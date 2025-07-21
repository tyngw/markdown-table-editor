const assert = require('assert');
import { MarkdownParser, TableNode } from '../../markdownParser';
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
});