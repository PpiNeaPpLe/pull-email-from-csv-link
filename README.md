# Email Scraper 🐋

A Node.js script that extracts email addresses from business websites listed in a CSV file. The script reads a CSV file containing business information (including website URLs), visits each website to extract email addresses, and outputs a new CSV file with the email addresses added.

## Features

- Reads business data from CSV files
- Extracts emails from business websites automatically
- Supports both mailto links and email patterns in text content
- Handles various URL formats automatically
- Filters out common placeholder/test emails
- Command line arguments for custom input/output files
- Progress tracking and detailed logging
- Error handling for unreachable websites

## Dependencies

Install the required dependencies by running:
```bash
npm install csv-parser csv-writer request-promise cheerio
```

Required modules:
- **csv-parser**: For reading CSV files
- **csv-writer**: For writing CSV files  
- **request-promise**: For making HTTP requests to websites
- **cheerio**: For parsing HTML and extracting emails

## Usage

### Basic Usage (with defaults)
```bash
node email-scraper.js
```
Uses default files: `hvac-in-chicago-overview.csv` → `hvac-in-chicago-with-emails.csv`

### Custom Input/Output Files
```bash
node email-scraper.js --input my-businesses.csv --output results.csv
```

### Command Line Options
- `--input <file>` - Specify input CSV file (default: hvac-in-chicago-overview.csv)
- `--output <file>` - Specify output CSV file (default: hvac-in-chicago-with-emails.csv) 
- `--help` or `-h` - Show usage information

### Examples
```bash
# Use custom input file, default output
node email-scraper.js --input hvac-new-lenox-il-overview.csv

# Use both custom input and output
node email-scraper.js --input my-data.csv --output extracted-emails.csv

# Get help
node email-scraper.js --help
```

## Input CSV Format

Your input CSV file should contain business information with at least these columns:
- `name` - Business name
- `website` - Business website URL

The script will preserve all existing columns and add a new `emails` column.

## How It Works

1. **Reads CSV**: Parses the input CSV file and loads business data
2. **Validates URLs**: Automatically adds https:// if missing from website URLs
3. **Scrapes Websites**: For each business website:
   - Fetches the webpage HTML
   - Extracts emails from mailto links
   - Searches for email patterns in page text
   - Filters out placeholder/test emails
4. **Combines Results**: Deduplicates and combines all found emails
5. **Outputs CSV**: Saves results to output CSV with emails added

## Email Extraction

The script finds emails through:
- **Mailto links**: `<a href="mailto:contact@business.com">`
- **Text patterns**: Email addresses found anywhere in the page text
- **Smart filtering**: Removes common placeholder emails (example.com, test.com, etc.)

## Error Handling

- Validates input file exists before starting
- Handles unreachable websites gracefully
- 10-second timeout per website request
- Continues processing even if some websites fail
- Detailed logging for debugging

## Limitations

- Only processes websites that return HTML content
- Cannot extract emails from JavaScript-generated content
- May be blocked by websites with anti-scraping measures
- Requires websites to be publicly accessible
- Does not handle websites requiring authentication

## Example Output

The script will show progress like this:
```
🐋 Starting email extraction from CSV websites...
📂 Input file: my-businesses.csv
📂 Output file: results.csv
Found 25 businesses to process

[1/25] Processing: ABC Plumbing
  → Extracting emails from: https://abcplumbing.com
  → Found emails: contact@abcplumbing.com, info@abcplumbing.com

[2/25] Processing: XYZ Heating
  → Extracting emails from: https://xyzheating.com
  → Found emails: sales@xyzheating.com

✅ Completed! Results saved to: results.csv
```

<div align="center">
<em>This script is for legitimate business contact extraction purposes. Please respect website terms of service and applicable laws.</em>
</div>
