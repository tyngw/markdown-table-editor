# CSV Export Test

This file is for testing the CSV export functionality and status bar improvements.

| Name | Age | City | Notes |
|------|-----|------|-------|
| Alice | 25 | Tokyo | Software Engineer<br/>Loves coding |
| Bob | 30 | Osaka | Designer<br/>Creative person |
| Carol | 28 | Kyoto | Manager<br/>Team leader |
| David | 35 | Nagoya | Sales Rep<br/>Experienced |
| Eve | 32 | Fukuoka | Data Scientist<br/>Machine learning expert |
| Frank | 29 | Sendai | Product Manager<br/>Strategic thinker |

## Test Cases

1. **CSV Export**: Click the "📄 Export CSV" button to test export functionality
2. **Copy/Paste**: Select cells and use Ctrl+C/V to test clipboard operations
3. **Status Display**: Observe status messages in the center of the status bar
4. **Layout Stability**: Verify that status bar height remains constant

## Expected Results

- CSV export should work without "Invalid message format" error
- CSV filename should be "test-csv-export.csv" (based on original filename)
- Multi-line cells should be properly quoted with double quotes
- Status messages should appear in the center of the status bar
- Auto-saved indicator should remain in the left corner
- Table info should remain in the right corner
- Status bar height should not change when messages appear/disappear

## CSV Export Test Cases

1. **Multi-line text**: Notes column contains `<br/>` tags that should be converted to actual newlines in CSV
2. **Filename generation**: Should suggest "test-csv-export.csv" as default filename
3. **Quote escaping**: If cells contain commas or quotes, they should be properly escaped
4. **Whitespace handling**: Leading/trailing spaces should trigger quoting 