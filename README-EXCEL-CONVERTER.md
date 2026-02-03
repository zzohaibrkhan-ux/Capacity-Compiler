# Excel File Compiler - Capacity Reliability

## Overview

A **100% client-side** web application that compiles multiple raw capacity reliability Excel files into a single standardized formatted document. All processing happens in your browser - no data is ever sent to a server.

## Features

- **100% Client-Side Processing**: All Excel processing happens in your browser for maximum privacy
- **Self-Contained Application**: All processing logic embedded in the application - ready for deployment
- **Drag & Drop Upload**: Drop multiple Excel files (.xlsx, .xls) onto upload area
- **Multi-file Compilation**: Process multiple files and compile them into a single output document
- **Single Download**: Download one compiled file containing all data from all uploaded files
- **Date Sorting**: Automatically sorts all data chronologically by date
- **Zero Data Transmission**: Your files never leave your device
- **Fast Processing**: No server round-trips - instant compilation
- **Clean UI**: Modern interface built with shadcn/ui components
- **Production Ready**: All logic embedded - works when deployed anywhere

## Privacy & Security

- **All processing happens in your browser** - no data is transmitted to any server
- Files are read locally using FileReader API
- Excel processing is done using JavaScript libraries (xlsx)
- The compiled file is generated in-memory and downloaded directly
- No database, no cloud storage, no external dependencies for processing
- **All logic self-contained in the application** - works offline after page load

## File Format Conversion

### Input Format (Raw)
- Dates arranged as columns in row 0
- Metrics arranged as rows in column 0
- Each date column contains metric values for that day
- "Total" column is excluded from compilation

### Output Format (Compiled)
- All data from all files combined into a single document
- Each date becomes a separate row
- All metrics become columns
- Data sorted chronologically by date
- RMLC and DOM3 columns removed as requested
- **Date column formatted as Short Date (mm/dd/yyyy)**
- **All numeric columns stored as Number format (not text)**
- Capacity reliability score: decimal format (3 decimal places)
- Week#: integer format (no decimals)
- Other numeric columns: integer format (no decimals)
- Empty values: represented as null
- Total columns: 11

## Technology Stack

- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Excel Processing**: xlsx library (SheetJS) for reading and writing Excel files in browser
- **No Backend Processing Required**: All computation happens client-side
- **Self-Contained**: All processing logic embedded in main component

## Application Structure

The entire application is self-contained in a single file (`src/app/page.tsx`):

- **Types**: All TypeScript interfaces defined inline
- **Processing Functions**:
  - `parseNumber()` - Converts values, handles percentages
  - `getWeekNumber()` - Calculates ISO week numbers
  - `processExcelFile()` - Parses raw Excel structure
  - `generateCompiledExcel()` - Creates output Excel file
- **UI Component**: Complete React component with drag & drop
- **No External Logic Files**: Everything needed is in one place

This structure ensures the application works correctly when deployed to any environment.

## Compilation Process

1. User uploads multiple raw Excel files (files are read locally in browser)
2. Files are parsed using SheetJS library in browser
3. Data from all files is transposed from column-based to row-based format
4. Week numbers are calculated from dates
5. All data is combined into a single dataset
6. Data is sorted chronologically by date
7. Formatted file is generated in-memory
8. File is downloaded directly to user's device

## Column Mapping

| Input Row | Output Column |
|-----------|---------------|
| Row 1, Col 1-N | Date column values |
| Row 2 | Capacity reliability score |
| Row 3 | Completed routes |
| Row 4 | Amazon paid cancels |
| Row 5 | DSP dropped routes |
| Row 6 | Reliability target |
| Row 7 | Route target |
| Row 8 | Flex-up route target |
| Row 9 | Final scheduled |
| Row 10 | DSP available capacity |
| Calculated | Week# |

**Removed columns:** RMLC, DOM3, and empty unnamed column (per user request)

## Output Columns (11 total)

1. Date
2. Week#
3. Capacity reliability score
4. Completed routes
5. Amazon paid cancels
6. DSP dropped routes
7. Reliability target
8. Route target
9. Flex-up route target
10. Final scheduled
11. DSP available capacity

## Usage

1. Open application in your browser
2. Drag and drop one or more raw Excel files onto upload area
3. Click "Compile All Files" to process all files together
4. Wait for compilation to complete (success card will appear) - happens instantly!
5. Download single compiled file using "Download Compiled File" button
6. Use "Clear All" to remove all files from the queue

## Deployment

The application is production-ready and can be deployed anywhere:

- **Vercel**: Works with default Next.js configuration
- **Netlify**: Compatible with Next.js static or serverless
- **Docker**: Can be containerized for any platform
- **Traditional Hosting**: Build with `bun run build` and serve static files
- **No Special Configuration**: All logic is self-contained

No additional server-side setup required - all processing happens client-side.

## Error Handling

- Invalid file types are rejected with toast notifications
- Individual file processing errors are shown but don't stop other files
- Only files matching expected raw format will be processed
- Success notification shows how many rows were compiled from how many files
- Processing errors are displayed with clear, actionable messages

## Important Notes

- All uploaded files are compiled into a **single** Excel document
- RMLC and DOM3 columns have been removed as requested
- **Date column is formatted as Short Date (mm/dd/yyyy)**
- **All numeric values are stored as numbers, not text**
- Percentage values from raw files are converted to decimals (e.g., 100% → 1.0)
- The "Total" column is always excluded from compilation
- Data is automatically sorted by date in chronological order
- Only raw format files (transposed structure) are processed correctly
- Files that don't match expected format are silently skipped
- Empty/missing values are represented as null
- **All processing happens in your browser - maximum privacy and security**
- **No server round-trips - instant processing and download**
- **All logic self-contained - works when deployed anywhere**
- **No external processing files needed**
