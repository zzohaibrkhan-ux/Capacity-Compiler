import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files: File[] = []

    // Get all uploaded files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Create temporary directory for input files
    const tempDir = join(tmpdir(), `excel-convert-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })

    const inputPaths: string[] = []
    const outputPath = join(tempDir, 'compiled-output.xlsx')

    // Save all files to disk
    for (let i = 0; i < files.length; i++) {
      const bytes = await files[i].arrayBuffer()
      const buffer = Buffer.from(bytes)
      const inputPath = join(tempDir, `input-${i}.xlsx`)
      await writeFile(inputPath, buffer)
      inputPaths.push(inputPath)
    }

    // Python script to process all files and compile them
    const pythonProcess = spawn('/home/z/.venv/bin/python3', ['-c', `
import pandas as pd
import sys
from datetime import datetime
from openpyxl import load_workbook

# File paths are passed as arguments starting from index 1
# Last argument is output file path
input_files = sys.argv[1:-1]
output_file = sys.argv[-1]

all_data = []

for input_file in input_files:
    try:
        df = pd.read_excel(input_file, header=None, nrows=20)

        dates_row = df.iloc[0, 1:]
        dates = []
        for d in dates_row:
            if pd.notna(d) and str(d) != 'Total':
                if isinstance(d, datetime):
                    dates.append(d)
                else:
                    try:
                        dates.append(pd.to_datetime(d))
                    except:
                        continue

        data = df.iloc[1:, 1:-1].values if 'Total' in df.iloc[0, :].values else df.iloc[1:, 1:].values

        for i, date in enumerate(dates):
            if i < data.shape[1]:
                row_data = {}
                week_num = date.isocalendar()[1]
                
                # Helper function to convert to number
                def to_number(val):
                    if pd.isna(val) or val == '-':
                        return None
                    if isinstance(val, str):
                        # Remove percentage sign and convert
                        val = val.strip().replace('%', '')
                        try:
                            return float(val)
                        except:
                            return None
                    return float(val) if pd.notna(val) else None
                
                # Convert capacity reliability from percentage to decimal
                cr_score = data[0, i] if i < data.shape[1] else 0
                row_data['Date'] = date
                row_data['Week#'] = week_num
                row_data['Capacity reliability score'] = to_number(cr_score) / 100 if isinstance(cr_score, str) and '%' in str(cr_score) else to_number(cr_score)
                row_data['Completed routes'] = to_number(data[1, i])
                row_data['Amazon paid cancels'] = to_number(data[2, i])
                row_data['DSP dropped routes'] = to_number(data[3, i])
                row_data['Reliability target'] = to_number(data[4, i])
                row_data['Route target'] = to_number(data[5, i])
                row_data['Flex-up route target'] = to_number(data[6, i])
                row_data['Final scheduled'] = to_number(data[7, i])
                row_data['DSP available capacity'] = to_number(data[8, i])
                
                all_data.append(row_data)
    except Exception as e:
        print(f"Error processing file {input_file}: {e}", file=sys.stderr)
        continue

result_df = pd.DataFrame(all_data)

columns_order = [
    'Date', 'Week#', 'Capacity reliability score', 'Completed routes',
    'Amazon paid cancels', 'DSP dropped routes', 'Reliability target',
    'Route target', 'Flex-up route target', 'Final scheduled',
    'DSP available capacity'
]

result_df = result_df[columns_order]

# Sort by date
result_df = result_df.sort_values('Date').reset_index(drop=True)

# Save to Excel
result_df.to_excel(output_file, index=False, engine='openpyxl')

# Load workbook and apply formatting
wb = load_workbook(output_file)
ws = wb.active

# Apply Short Date format to Date column (column A, starting from row 2)
for row in range(2, ws.max_row + 1):
    cell = ws[f'A{row}']
    if cell.value:
        cell.number_format = 'mm/dd/yyyy'

# Apply Number format to all numeric columns
# Column B (Week#) - integer
for row in range(2, ws.max_row + 1):
    cell = ws[f'B{row}']
    if cell.value is not None:
        cell.number_format = '0'

# Column C (Capacity reliability score) - decimal
for row in range(2, ws.max_row + 1):
    cell = ws[f'C{row}']
    if cell.value is not None:
        cell.number_format = '0.000'

# Columns D-K (all other numeric) - integer or decimal based on value
for col in ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']:
    for row in range(2, ws.max_row + 1):
        cell = ws[f'{col}{row}']
        if cell.value is not None:
            cell.number_format = '0'

wb.save(output_file)

print(f"Successfully compiled {len(result_df)} rows from {len(input_files)} files")
    `, ...inputPaths, outputPath])

    await new Promise<void>((resolve, reject) => {
      let errorOutput = ''
      let stdOutput = ''
      
      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdOutput += data.toString()
      })

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code: number) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput)
          console.error('Python script output:', stdOutput)
          reject(new Error(errorOutput || stdOutput || 'Unknown error'))
        } else {
          console.log('Python script output:', stdOutput)
          resolve()
        }
      })

      pythonProcess.on('error', (err) => {
        console.error('Process error:', err)
        reject(err)
      })
    })

    const outputBuffer = await readFile(outputPath)

    // Clean up temporary files
    for (const path of inputPaths) {
      await unlink(path).catch(() => {})
    }
    await unlink(outputPath).catch(() => {})

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Capacity-Reliability-Compiled-${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json(
      { error: 'Failed to convert files' },
      { status: 500 }
    )
  }
}
