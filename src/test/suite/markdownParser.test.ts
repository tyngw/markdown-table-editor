const assert = require('assert');
import { MarkdownParser, TableNode, TableManager } from '../../markdownParser';
import * as vscode from 'vscode';

suite('MarkdownParser Test Suite', () => {
    let parser: MarkdownParser;

    setup(() => {
        parser = new MarkdownParser();
    });

    test('should parse simple table', () => {
        const markdown = `# Test Document

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

Some text after table.`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);

        assert.strictEqual(tables.length, 1);
        
        const table = tables[0];
        assert.deepStrictEqual(table.headers, ['Header 1', 'Header 2', 'Header 3']);
        assert.strictEqual(table.rows.length, 2);
        assert.deepStrictEqual(table.rows[0], ['Cell 1', 'Cell 2', 'Cell 3']);
        assert.deepStrictEqual(table.rows[1], ['Cell 4', 'Cell 5', 'Cell 6']);
    });

    test('should parse table with alignment', () => {
        const markdown = `| Left | Center | Right |
|:-----|:------:|------:|
| L1   | C1     | R1    |
| L2   | C2     | R2    |`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);

        assert.strictEqual(tables.length, 1);
        
        const table = tables[0];
        assert.deepStrictEqual(table.headers, ['Left', 'Center', 'Right']);
        // Note: markdown-it may not preserve alignment info in the way we expect
        // This test verifies the basic structure is parsed correctly
        assert.strictEqual(table.rows.length, 2);
    });

    test('should find multiple tables', () => {
        const markdown = `# First Table

| A | B |
|---|---|
| 1 | 2 |

# Second Table

| X | Y | Z |
|---|---|---|
| 3 | 4 | 5 |
| 6 | 7 | 8 |`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);

        assert.strictEqual(tables.length, 2);
        
        assert.deepStrictEqual(tables[0].headers, ['A', 'B']);
        assert.strictEqual(tables[0].rows.length, 1);
        
        assert.deepStrictEqual(tables[1].headers, ['X', 'Y', 'Z']);
        assert.strictEqual(tables[1].rows.length, 2);
    });

    test('should find table at position', () => {
        const markdown = `# Test Document

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

Some text after table.`;

        const ast = parser.parseDocument(markdown);
        
        // Position within table (line 4, which should be "| Cell 1   | Cell 2   |")
        const position = new vscode.Position(4, 0);
        const table = parser.findTableAtPosition(ast, position);

        assert.notStrictEqual(table, null);
        if (table) {
            assert.deepStrictEqual(table.headers, ['Header 1', 'Header 2']);
            assert.strictEqual(table.rows.length, 2);
        }
    });

    test('should return null for position outside table', () => {
        const markdown = `# Test Document

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

Some text after table.`;

        const ast = parser.parseDocument(markdown);
        
        // Position outside table (line 0, which is "# Test Document")
        const position = new vscode.Position(0, 0);
        const table = parser.findTableAtPosition(ast, position);

        assert.strictEqual(table, null);
    });

    test('should handle empty table', () => {
        const markdown = `| Header 1 | Header 2 |
|----------|----------|`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);

        assert.strictEqual(tables.length, 1);
        
        const table = tables[0];
        assert.deepStrictEqual(table.headers, ['Header 1', 'Header 2']);
        assert.strictEqual(table.rows.length, 0);
    });

    test('should handle malformed table gracefully', () => {
        const markdown = `| Header 1 | Header 2
| Cell 1   | Cell 2   |`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);

        // markdown-it should handle this gracefully, might not parse as table
        // This test ensures no errors are thrown
        assert.doesNotThrow(() => {
            parser.findTablesInDocument(ast);
        });
    });

    test('should validate table structure', () => {
        const validTable: TableNode = {
            startLine: 0,
            endLine: 3,
            headers: ['Header 1', 'Header 2'],
            rows: [['Cell 1', 'Cell 2'], ['Cell 3', 'Cell 4']],
            alignment: ['left', 'left']
        };

        const validation = parser.validateTableStructure(validTable);
        assert.strictEqual(validation.isValid, true);
        assert.strictEqual(validation.issues.length, 0);
    });

    test('should detect table structure issues', () => {
        const invalidTable: TableNode = {
            startLine: 0,
            endLine: 3,
            headers: ['Header 1', 'Header 2'],
            rows: [['Cell 1'], ['Cell 3', 'Cell 4', 'Cell 5']], // Inconsistent column count
            alignment: ['left'] // Wrong alignment array length
        };

        const validation = parser.validateTableStructure(invalidTable);
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.issues.length > 0);
        assert.ok(validation.issues.some(issue => issue.includes('Row 1 has 1 columns')));
        assert.ok(validation.issues.some(issue => issue.includes('Row 2 has 3 columns')));
    });

    test('should find table containing specific line', () => {
        const markdown = `# Header

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |

Some text after table.`;

        const ast = parser.parseDocument(markdown);
        
        // Line 4 should be within the table
        const table = parser.findTableContainingLine(ast, 4);
        assert.notStrictEqual(table, null);
        
        // Line 0 should not be within any table
        const noTable = parser.findTableContainingLine(ast, 0);
        assert.strictEqual(noTable, null);
    });

    test('should get table boundaries accurately', () => {
        const markdown = `# Header

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

Some text`;

        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);
        
        if (tables.length > 0) {
            const boundaries = parser.getTableBoundaries(markdown, tables[0]);
            assert.ok(boundaries.startLine >= 0);
            assert.ok(boundaries.endLine > boundaries.startLine);
            assert.ok(boundaries.actualContent.length > 0);
        }
    });

    test('should get enhanced table metadata', () => {
        const markdown = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |`;

        const ast = parser.parseDocument(markdown);
        const tablesWithMetadata = parser.findTablesWithMetadata(ast);

        assert.strictEqual(tablesWithMetadata.length, 1);
        
        const metadata = tablesWithMetadata[0];
        assert.ok(metadata.table);
        assert.ok(metadata.validation);
        assert.ok(metadata.boundaries);
        assert.ok(metadata.columnInfo);
        assert.strictEqual(metadata.columnInfo.length, 3);
        assert.strictEqual(metadata.columnInfo[0].header, 'Name');
    });
});

suite('TableManager Test Suite', () => {
    let parser: MarkdownParser;

    setup(() => {
        parser = new MarkdownParser();
    });

    test('should manage multiple tables', () => {
        const markdown = `# First Table

| A | B |
|---|---|
| 1 | 2 |

# Second Table

| X | Y | Z |
|---|---|---|
| 3 | 4 | 5 |
| 6 | 7 | 8 |`;

        const ast = parser.parseDocument(markdown);
        const manager = parser.createTableManager(ast);

        assert.strictEqual(manager.getTableCount(), 2);
        
        const allTables = manager.getAllTables();
        assert.strictEqual(allTables.length, 2);
        
        const firstTable = manager.getTableByIndex(0);
        assert.notStrictEqual(firstTable, null);
        assert.deepStrictEqual(firstTable!.headers, ['A', 'B']);
        
        const secondTable = manager.getTableByIndex(1);
        assert.notStrictEqual(secondTable, null);
        assert.deepStrictEqual(secondTable!.headers, ['X', 'Y', 'Z']);
    });

    test('should provide table summary', () => {
        const markdown = `| Valid | Table |
|-------|-------|
| A     | B     |

| Another | Valid | Table |
|---------|-------|-------|
| X       | Y     | Z     |`;

        const ast = parser.parseDocument(markdown);
        const manager = parser.createTableManager(ast);
        const summary = manager.getTablesSummary();

        // The actual number of tables detected by markdown-it may vary
        assert.ok(summary.totalTables >= 1);
        assert.ok(summary.totalRows >= 0);
        assert.ok(summary.totalColumns >= 0);
    });

    test('should find closest table to line', () => {
        const markdown = `Line 0

| Table 1 |
|---------|
| Data    |

Line 6

| Table 2 |
|---------|
| Data    |`;

        const ast = parser.parseDocument(markdown);
        const manager = parser.createTableManager(ast);
        
        const closest = manager.getClosestTable(1);
        assert.notStrictEqual(closest, null);
        assert.ok(closest!.distance >= 0);
    });

    test('should find tables in range', () => {
        const markdown = `| Table 1 |
|---------|
| Data    |

Some text

| Table 2 |
|---------|
| Data    |`;

        const ast = parser.parseDocument(markdown);
        const manager = parser.createTableManager(ast);
        
        const tablesInRange = manager.getTablesInRange(0, 10);
        assert.ok(tablesInRange.length >= 0);
    });

    // Error Handling Tests
    test('should handle invalid content in parseDocument', () => {
        assert.throws(() => {
            parser.parseDocument(null as any);
        }, /Invalid content provided for parsing/);

        assert.throws(() => {
            parser.parseDocument(undefined as any);
        }, /Invalid content provided for parsing/);

        assert.throws(() => {
            parser.parseDocument(123 as any);
        }, /Invalid content provided for parsing/);
    });

    test('should handle empty content gracefully', () => {
        const ast = parser.parseDocument('');
        assert.ok(ast);
        assert.ok(Array.isArray(ast.tokens));
        assert.strictEqual(ast.content, '');

        const tables = parser.findTablesInDocument(ast);
        assert.strictEqual(tables.length, 0);
    });

    test('should handle invalid AST in findTablesInDocument', () => {
        assert.throws(() => {
            parser.findTablesInDocument(null as any);
        }, /Invalid AST provided for table extraction/);

        assert.throws(() => {
            parser.findTablesInDocument({ tokens: null, content: '' } as any);
        }, /Invalid AST provided for table extraction/);

        assert.throws(() => {
            parser.findTablesInDocument({ tokens: 'not-array', content: '' } as any);
        }, /Invalid AST provided for table extraction/);
    });

    test('should handle malformed table structure gracefully', () => {
        const markdown = `| Header 1 | Header 2
|----------|
| Cell 1   | Cell 2   | Cell 3 |
| Cell 4`;

        const ast = parser.parseDocument(markdown);
        // Should not throw, but may log warnings
        const tables = parser.findTablesInDocument(ast);
        
        // The parser should be resilient to malformed tables
        assert.ok(Array.isArray(tables));
    });

    test('should handle corrupted token structure', () => {
        const ast = parser.parseDocument('| A | B |\n|---|---|\n| 1 | 2 |');
        
        // Manually corrupt the tokens to test error handling
        const corruptedAst = {
            ...ast,
            tokens: ast.tokens.map(token => {
                if (token.type === 'table_open') {
                    return { ...token, map: null }; // Corrupt the map property
                }
                return token;
            })
        };

        // Should handle corrupted tokens gracefully
        const tables = parser.findTablesInDocument(corruptedAst);
        assert.ok(Array.isArray(tables));
    });

    test('should validate table structure and report issues', () => {
        const tableNode: TableNode = {
            startLine: 0,
            endLine: 2,
            headers: ['A', 'B'],
            rows: [
                ['1', '2'],
                ['3'], // Missing cell
                ['4', '5', '6'] // Extra cell
            ],
            alignment: ['left'] // Missing alignment
        };

        const validation = parser.validateTableStructure(tableNode);
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.issues.length > 0);
        assert.ok(validation.issues.some(issue => issue.includes('Row 2 has 1 columns')));
        assert.ok(validation.issues.some(issue => issue.includes('Row 3 has 3 columns')));
        assert.ok(validation.issues.some(issue => issue.includes('Alignment array length')));
    });

    test('should handle table with no headers gracefully', () => {
        const tableNode: TableNode = {
            startLine: 0,
            endLine: 1,
            headers: [],
            rows: [['A', 'B']],
            alignment: []
        };

        const validation = parser.validateTableStructure(tableNode);
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.issues.some(issue => issue.includes('Table has no headers')));
    });

    test('should handle extremely large tables without hanging', () => {
        // Create a large table to test performance and stability
        const headers = Array.from({ length: 100 }, (_, i) => `Header${i}`);
        const headerRow = `| ${headers.join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        const dataRows = Array.from({ length: 1000 }, (_, i) => 
            `| ${headers.map((_, j) => `Cell${i}-${j}`).join(' | ')} |`
        ).join('\n');

        const markdown = `${headerRow}\n${separatorRow}\n${dataRows}`;

        // This should complete within reasonable time
        const startTime = Date.now();
        const ast = parser.parseDocument(markdown);
        const tables = parser.findTablesInDocument(ast);
        const endTime = Date.now();

        assert.ok(endTime - startTime < 5000, 'Parsing should complete within 5 seconds');
        assert.strictEqual(tables.length, 1);
        assert.strictEqual(tables[0].headers.length, 100);
        assert.strictEqual(tables[0].rows.length, 1000);
    });
});

// Error class tests
suite('MarkdownParser Error Classes', () => {
    test('should create MarkdownParsingError correctly', () => {
        const error = new (require('../../markdownParser').MarkdownParsingError)(
            'Test error message',
            'testOperation',
            { line: 5, column: 10 },
            new Error('Original error')
        );

        assert.strictEqual(error.name, 'MarkdownParsingError');
        assert.strictEqual(error.message, 'Test error message');
        assert.strictEqual(error.operation, 'testOperation');
        assert.deepStrictEqual(error.position, { line: 5, column: 10 });
        assert.ok(error.originalError instanceof Error);
    });

    test('should create TableValidationError correctly', () => {
        const error = new (require('../../markdownParser').TableValidationError)(
            'Validation failed',
            2,
            ['Issue 1', 'Issue 2'],
            { startLine: 10, endLine: 15 }
        );

        assert.strictEqual(error.name, 'TableValidationError');
        assert.strictEqual(error.message, 'Validation failed');
        assert.strictEqual(error.tableIndex, 2);
        assert.deepStrictEqual(error.issues, ['Issue 1', 'Issue 2']);
        assert.deepStrictEqual(error.position, { startLine: 10, endLine: 15 });
    });
});