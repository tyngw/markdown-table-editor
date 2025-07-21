const assert = require('assert');
import { TableDataManager, TableData } from '../../tableDataManager';
import { TableNode } from '../../markdownParser';

suite('TableDataManager Test Suite', () => {
    let sampleTableNode: TableNode;
    let manager: TableDataManager;

    setup(() => {
        sampleTableNode = {
            startLine: 0,
            endLine: 3,
            headers: ['Name', 'Age', 'City'],
            rows: [
                ['John', '25', 'NYC'],
                ['Jane', '30', 'LA'],
                ['Bob', '35', 'Chicago']
            ],
            alignment: ['left', 'center', 'right']
        };
        
        manager = new TableDataManager(sampleTableNode, 'test.md');
    });

    test('should load table from TableNode', () => {
        const tableData = manager.getTableData();
        
        assert.deepStrictEqual(tableData.headers, ['Name', 'Age', 'City']);
        assert.strictEqual(tableData.rows.length, 3);
        assert.deepStrictEqual(tableData.rows[0], ['John', '25', 'NYC']);
        assert.deepStrictEqual(tableData.alignment, ['left', 'center', 'right']);
        assert.strictEqual(tableData.metadata.sourceUri, 'test.md');
        assert.strictEqual(tableData.metadata.columnCount, 3);
        assert.strictEqual(tableData.metadata.rowCount, 3);
    });

    test('should update cell value', () => {
        manager.updateCell(0, 0, 'Johnny');
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][0], 'Johnny');
    });

    test('should throw error for invalid cell position', () => {
        assert.throws(() => {
            manager.updateCell(10, 0, 'Invalid');
        }, /Invalid cell position/);
        
        assert.throws(() => {
            manager.updateCell(0, 10, 'Invalid');
        }, /Invalid cell position/);
    });

    test('should add row at end', () => {
        manager.addRow();
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows.length, 4);
        assert.deepStrictEqual(tableData.rows[3], ['', '', '']);
        assert.strictEqual(tableData.metadata.rowCount, 4);
    });

    test('should add row at specific index', () => {
        manager.addRow(1);
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows.length, 4);
        assert.deepStrictEqual(tableData.rows[1], ['', '', '']);
        assert.deepStrictEqual(tableData.rows[2], ['Jane', '30', 'LA']);
    });

    test('should delete row', () => {
        manager.deleteRow(1);
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows.length, 2);
        assert.deepStrictEqual(tableData.rows[0], ['John', '25', 'NYC']);
        assert.deepStrictEqual(tableData.rows[1], ['Bob', '35', 'Chicago']);
    });

    test('should throw error for invalid row index', () => {
        assert.throws(() => {
            manager.deleteRow(10);
        }, /Invalid row index/);
    });

    test('should add column at end', () => {
        manager.addColumn(undefined, 'Country');
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.headers.length, 4);
        assert.strictEqual(tableData.headers[3], 'Country');
        assert.strictEqual(tableData.alignment[3], 'left');
        assert.strictEqual(tableData.rows[0].length, 4);
        assert.strictEqual(tableData.rows[0][3], '');
    });

    test('should add column at specific index', () => {
        manager.addColumn(1, 'Email');
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.headers.length, 4);
        assert.strictEqual(tableData.headers[1], 'Email');
        assert.strictEqual(tableData.headers[2], 'Age');
        assert.strictEqual(tableData.rows[0][1], '');
        assert.strictEqual(tableData.rows[0][2], '25');
    });

    test('should delete column', () => {
        manager.deleteColumn(1);
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.headers.length, 2);
        assert.deepStrictEqual(tableData.headers, ['Name', 'City']);
        assert.deepStrictEqual(tableData.rows[0], ['John', 'NYC']);
        assert.deepStrictEqual(tableData.alignment, ['left', 'right']);
    });

    test('should not delete last column', () => {
        // Delete two columns first
        manager.deleteColumn(1);
        manager.deleteColumn(1);
        
        // Try to delete the last column
        assert.throws(() => {
            manager.deleteColumn(0);
        }, /Cannot delete the last column/);
    });

    test('should sort by column ascending', () => {
        manager.sortByColumn(0, 'asc'); // Sort by Name
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][0], 'Bob');
        assert.strictEqual(tableData.rows[1][0], 'Jane');
        assert.strictEqual(tableData.rows[2][0], 'John');
    });

    test('should sort by column descending', () => {
        manager.sortByColumn(1, 'desc'); // Sort by Age (numeric)
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][1], '35');
        assert.strictEqual(tableData.rows[1][1], '30');
        assert.strictEqual(tableData.rows[2][1], '25');
    });

    test('should move row', () => {
        manager.moveRow(0, 2); // Move first row to third position
        
        const tableData = manager.getTableData();
        assert.deepStrictEqual(tableData.rows[0], ['Jane', '30', 'LA']);
        assert.deepStrictEqual(tableData.rows[1], ['Bob', '35', 'Chicago']);
        assert.deepStrictEqual(tableData.rows[2], ['John', '25', 'NYC']);
    });

    test('should move column', () => {
        manager.moveColumn(0, 2); // Move Name column to third position
        
        const tableData = manager.getTableData();
        assert.deepStrictEqual(tableData.headers, ['Age', 'City', 'Name']);
        assert.deepStrictEqual(tableData.rows[0], ['25', 'NYC', 'John']);
        assert.deepStrictEqual(tableData.alignment, ['center', 'right', 'left']);
    });

    test('should serialize to markdown', () => {
        const markdown = manager.serializeToMarkdown();
        
        assert.ok(markdown.includes('| Name | Age | City |'));
        assert.ok(markdown.includes('| :--- | :---: | ---: |'));
        assert.ok(markdown.includes('| John | 25 | NYC |'));
        assert.ok(markdown.includes('| Jane | 30 | LA |'));
        assert.ok(markdown.includes('| Bob | 35 | Chicago |'));
    });

    test('should validate table structure', () => {
        const validTableNode: TableNode = {
            startLine: 0,
            endLine: 2,
            headers: ['A', 'B'],
            rows: [['1', '2'], ['3', '4']],
            alignment: ['left', 'left']
        };
        
        const validManager = new TableDataManager(validTableNode);
        const validation = validManager.validateTableStructure(validTableNode);
        
        assert.strictEqual(validation.isValid, true);
        assert.strictEqual(validation.issues.length, 0);
    });

    test('should detect validation issues', () => {
        const invalidTableNode: TableNode = {
            startLine: 0,
            endLine: 2,
            headers: ['A', 'B'],
            rows: [['1'], ['3', '4', '5']], // Inconsistent column count
            alignment: ['left'] // Wrong alignment count
        };
        
        const invalidManager = new TableDataManager(invalidTableNode);
        const validation = invalidManager.validateTableStructure(invalidTableNode);
        
        assert.strictEqual(validation.isValid, false);
        assert.ok(validation.issues.length > 0);
    });

    test('should provide table statistics', () => {
        const stats = manager.getStatistics();
        
        assert.strictEqual(stats.totalCells, 9);
        assert.strictEqual(stats.emptyCells, 0);
        assert.strictEqual(stats.fillRate, 1);
        assert.strictEqual(stats.columnWidths.length, 3);
        assert.ok(stats.averageRowLength > 0);
    });

    test('should handle change listeners', () => {
        let changeCount = 0;
        let lastData: TableData | null = null;
        
        const listener = (data: TableData) => {
            changeCount++;
            lastData = data;
        };
        
        manager.addChangeListener(listener);
        manager.updateCell(0, 0, 'Changed');
        
        assert.strictEqual(changeCount, 1);
        assert.notStrictEqual(lastData, null);
        assert.strictEqual(lastData!.rows[0][0], 'Changed');
        
        manager.removeChangeListener(listener);
        manager.updateCell(0, 0, 'Changed Again');
        
        assert.strictEqual(changeCount, 1); // Should not increment
    });

    test('should clone table data manager', () => {
        const cloned = manager.clone();
        const originalData = manager.getTableData();
        const clonedData = cloned.getTableData();
        
        assert.notStrictEqual(cloned, manager);
        assert.deepStrictEqual(clonedData.headers, originalData.headers);
        assert.deepStrictEqual(clonedData.rows, originalData.rows);
        assert.deepStrictEqual(clonedData.alignment, originalData.alignment);
        
        // Modify cloned data and ensure original is unchanged
        cloned.updateCell(0, 0, 'Modified');
        assert.notStrictEqual(cloned.getTableData().rows[0][0], manager.getTableData().rows[0][0]);
    });

    test('should generate unique table IDs', () => {
        const manager1 = new TableDataManager(sampleTableNode);
        const manager2 = new TableDataManager(sampleTableNode);
        
        assert.notStrictEqual(manager1.getTableData().id, manager2.getTableData().id);
    });

    // Advanced CRUD Operations Tests

    test('should batch update multiple cells', () => {
        const updates = [
            { row: 0, col: 0, value: 'Updated1' },
            { row: 1, col: 1, value: 'Updated2' },
            { row: 2, col: 2, value: 'Updated3' }
        ];

        manager.batchUpdateCells(updates);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.rows[0][0], 'Updated1');
        assert.strictEqual(tableData.rows[1][1], 'Updated2');
        assert.strictEqual(tableData.rows[2][2], 'Updated3');
    });

    test('should insert multiple rows', () => {
        manager.insertRows(1, 2);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.rows.length, 5);
        assert.deepStrictEqual(tableData.rows[1], ['', '', '']);
        assert.deepStrictEqual(tableData.rows[2], ['', '', '']);
        assert.deepStrictEqual(tableData.rows[3], ['Jane', '30', 'LA']);
    });

    test('should delete multiple rows', () => {
        manager.deleteRows([0, 2]);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.rows.length, 1);
        assert.deepStrictEqual(tableData.rows[0], ['Jane', '30', 'LA']);
    });

    test('should insert multiple columns', () => {
        manager.insertColumns(1, 2, ['Email', 'Phone']);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.headers.length, 5);
        assert.deepStrictEqual(tableData.headers, ['Name', 'Email', 'Phone', 'Age', 'City']);
        assert.strictEqual(tableData.rows[0].length, 5);
        assert.strictEqual(tableData.rows[0][1], '');
        assert.strictEqual(tableData.rows[0][2], '');
        assert.strictEqual(tableData.rows[0][3], '25');
    });

    test('should delete multiple columns', () => {
        manager.deleteColumns([0, 2]);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.headers.length, 1);
        assert.deepStrictEqual(tableData.headers, ['Age']);
        assert.deepStrictEqual(tableData.rows[0], ['25']);
        assert.deepStrictEqual(tableData.rows[1], ['30']);
    });

    test('should update entire row', () => {
        manager.updateRow(0, ['Johnny', '26', 'Boston']);
        const tableData = manager.getTableData();

        assert.deepStrictEqual(tableData.rows[0], ['Johnny', '26', 'Boston']);
    });

    test('should update entire column', () => {
        manager.updateColumn(1, ['22', '28', '33'], 'Years');
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.headers[1], 'Years');
        assert.strictEqual(tableData.rows[0][1], '22');
        assert.strictEqual(tableData.rows[1][1], '28');
        assert.strictEqual(tableData.rows[2][1], '33');
    });

    test('should clear all cells', () => {
        manager.clearAllCells();
        const tableData = manager.getTableData();

        for (const row of tableData.rows) {
            for (const cell of row) {
                assert.strictEqual(cell, '');
            }
        }
    });

    test('should clear specific row', () => {
        manager.clearRow(1);
        const tableData = manager.getTableData();

        assert.deepStrictEqual(tableData.rows[1], ['', '', '']);
        assert.deepStrictEqual(tableData.rows[0], ['John', '25', 'NYC']); // Other rows unchanged
    });

    test('should clear specific column', () => {
        manager.clearColumn(1);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.rows[0][1], '');
        assert.strictEqual(tableData.rows[1][1], '');
        assert.strictEqual(tableData.rows[2][1], '');
        assert.strictEqual(tableData.rows[0][0], 'John'); // Other columns unchanged
    });

    test('should duplicate row', () => {
        manager.duplicateRow(0);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.rows.length, 4);
        assert.deepStrictEqual(tableData.rows[0], ['John', '25', 'NYC']);
        assert.deepStrictEqual(tableData.rows[1], ['John', '25', 'NYC']);
        assert.deepStrictEqual(tableData.rows[2], ['Jane', '30', 'LA']);
    });

    test('should duplicate column', () => {
        manager.duplicateColumn(0);
        const tableData = manager.getTableData();

        assert.strictEqual(tableData.headers.length, 4);
        assert.strictEqual(tableData.headers[0], 'Name');
        assert.strictEqual(tableData.headers[1], 'Name Copy');
        assert.strictEqual(tableData.rows[0][0], 'John');
        assert.strictEqual(tableData.rows[0][1], 'John');
    });

    test('should find and replace text', () => {
        const count = manager.findAndReplace('John', 'Jonathan');
        
        assert.strictEqual(count, 1);
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][0], 'Jonathan');
    });

    test('should find and replace with regex', () => {
        const count = manager.findAndReplace('\\d+', 'XX', { useRegex: true });
        
        assert.ok(count > 0);
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][1], 'XX');
        assert.strictEqual(tableData.rows[1][1], 'XX');
    });

    test('should get row data', () => {
        const rowData = manager.getRow(0);
        assert.deepStrictEqual(rowData, ['John', '25', 'NYC']);
    });

    test('should get column data', () => {
        const columnData = manager.getColumn(0);
        assert.strictEqual(columnData.header, 'Name');
        assert.deepStrictEqual(columnData.values, ['John', 'Jane', 'Bob']);
        assert.strictEqual(columnData.alignment, 'left');
    });

    test('should get cell value', () => {
        const cellValue = manager.getCell(0, 0);
        assert.strictEqual(cellValue, 'John');
    });

    test('should check if table is empty', () => {
        assert.strictEqual(manager.isEmpty(), false);
        
        // Create empty table
        const emptyTableNode: TableNode = {
            startLine: 0,
            endLine: 1,
            headers: ['A', 'B'],
            rows: [],
            alignment: ['left', 'left']
        };
        const emptyManager = new TableDataManager(emptyTableNode);
        assert.strictEqual(emptyManager.isEmpty(), true);
    });

    test('should detect empty cells', () => {
        manager.updateCell(0, 1, ''); // Make a cell empty
        
        assert.strictEqual(manager.hasEmptyCells(), true);
        
        const emptyCells = manager.getEmptyCells();
        assert.strictEqual(emptyCells.length, 1);
        assert.deepStrictEqual(emptyCells[0], { row: 0, col: 1 });
    });

    test('should handle batch update errors', () => {
        const invalidUpdates = [
            { row: 10, col: 0, value: 'Invalid' }
        ];

        assert.throws(() => {
            manager.batchUpdateCells(invalidUpdates);
        }, /Invalid cell position/);
    });

    test('should handle column deletion constraints', () => {
        // Try to delete all columns
        assert.throws(() => {
            manager.deleteColumns([0, 1, 2]);
        }, /Cannot delete all columns/);
    });

    // Advanced Sorting Tests

    test('should perform advanced sort with options', () => {
        manager.sortByColumnAdvanced(1, 'desc', { dataType: 'number' });
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][1], '35');
        assert.strictEqual(tableData.rows[1][1], '30');
        assert.strictEqual(tableData.rows[2][1], '25');
        
        const sortState = manager.getSortState();
        assert.notStrictEqual(sortState, null);
        assert.strictEqual(sortState!.columnIndex, 1);
        assert.strictEqual(sortState!.direction, 'desc');
    });

    test('should perform multi-column sort', () => {
        // Add duplicate ages to test secondary sort
        manager.updateCell(1, 1, '25'); // Jane now has same age as John
        
        manager.sortByMultipleColumns([
            { columnIndex: 1, direction: 'asc' }, // Sort by age first
            { columnIndex: 0, direction: 'asc' }  // Then by name
        ]);
        
        const tableData = manager.getTableData();
        // Both John and Jane have age 25, so should be sorted by name
        assert.strictEqual(tableData.rows[0][1], '25');
        assert.strictEqual(tableData.rows[1][1], '25');
        assert.strictEqual(tableData.rows[2][1], '35');
    });

    test('should sort with custom function', () => {
        // Sort by city length (shortest first)
        manager.sortByCustomFunction((rowA, rowB) => {
            const cityA = rowA[2];
            const cityB = rowB[2];
            return cityA.length - cityB.length;
        });
        
        const tableData = manager.getTableData();
        assert.strictEqual(tableData.rows[0][2], 'LA'); // Shortest city name
        assert.strictEqual(tableData.rows[2][2], 'Chicago'); // Longest city name
        
        // Custom sort should clear sort state
        assert.strictEqual(manager.getSortState(), null);
    });

    test('should shuffle rows randomly', () => {
        const originalOrder = manager.getTableData().rows.map(row => row[0]);
        
        manager.shuffleRows();
        
        const shuffledOrder = manager.getTableData().rows.map(row => row[0]);
        
        // Should have same elements but potentially different order
        assert.strictEqual(shuffledOrder.length, originalOrder.length);
        assert.ok(originalOrder.every(name => shuffledOrder.includes(name)));
        
        // Sort state should be cleared
        assert.strictEqual(manager.getSortState(), null);
    });

    test('should reverse row order', () => {
        const originalOrder = manager.getTableData().rows.map(row => row[0]);
        
        manager.reverseRows();
        
        const reversedOrder = manager.getTableData().rows.map(row => row[0]);
        
        assert.deepStrictEqual(reversedOrder, originalOrder.reverse());
    });

    test('should detect column data types', () => {
        // Create table with different data types
        const mixedTableNode: TableNode = {
            startLine: 0,
            endLine: 4,
            headers: ['Name', 'Age', 'Score'],
            rows: [
                ['John', '25', '85.5'],
                ['Jane', '30', '92.0'],
                ['Bob', '35', '78.5']
            ],
            alignment: ['left', 'left', 'left']
        };
        
        const mixedManager = new TableDataManager(mixedTableNode);
        
        const ageStats = mixedManager.getSortedColumnStats(1);
        assert.strictEqual(ageStats.dataType, 'number');
        
        const scoreStats = mixedManager.getSortedColumnStats(2);
        assert.strictEqual(scoreStats.dataType, 'number');
        
        const nameStats = mixedManager.getSortedColumnStats(0);
        assert.strictEqual(nameStats.dataType, 'string');
    });

    test('should perform natural sort', () => {
        // Create table with mixed alphanumeric data
        const naturalTableNode: TableNode = {
            startLine: 0,
            endLine: 4,
            headers: ['Item'],
            rows: [
                ['Item10'],
                ['Item2'],
                ['Item1'],
                ['Item20']
            ],
            alignment: ['left']
        };
        
        const naturalManager = new TableDataManager(naturalTableNode);
        naturalManager.sortNatural(0, 'asc');
        
        const tableData = naturalManager.getTableData();
        assert.strictEqual(tableData.rows[0][0], 'Item1');
        assert.strictEqual(tableData.rows[1][0], 'Item2');
        assert.strictEqual(tableData.rows[2][0], 'Item10');
        assert.strictEqual(tableData.rows[3][0], 'Item20');
    });

    test('should get sort indicators', () => {
        manager.sortByColumnAdvanced(1, 'desc');
        
        const indicators = manager.getSortIndicators();
        assert.strictEqual(indicators.length, 3);
        assert.strictEqual(indicators[1].direction, 'desc');
        assert.strictEqual(indicators[1].isPrimary, true);
        assert.strictEqual(indicators[0].direction, null);
        assert.strictEqual(indicators[2].direction, null);
    });

    test('should get column statistics', () => {
        const stats = manager.getSortedColumnStats(1); // Age column
        
        assert.strictEqual(stats.dataType, 'number');
        assert.strictEqual(stats.uniqueValues, 3);
        assert.strictEqual(stats.nullValues, 0);
        assert.strictEqual(stats.minValue, '25');
        assert.strictEqual(stats.maxValue, '35');
        assert.ok(stats.sampleValues.length > 0);
    });

    test('should clear sort state', () => {
        manager.sortByColumnAdvanced(0, 'asc');
        assert.notStrictEqual(manager.getSortState(), null);
        
        manager.clearSortState();
        assert.strictEqual(manager.getSortState(), null);
        assert.strictEqual(manager.isSorted(), false);
    });

    test('should handle case-insensitive sorting', () => {
        // Create table with mixed case
        const caseTableNode: TableNode = {
            startLine: 0,
            endLine: 3,
            headers: ['Name'],
            rows: [
                ['alice'],
                ['Bob'],
                ['CHARLIE']
            ],
            alignment: ['left']
        };
        
        const caseManager = new TableDataManager(caseTableNode);
        caseManager.sortByColumnAdvanced(0, 'asc', { caseSensitive: false });
        
        const tableData = caseManager.getTableData();
        assert.strictEqual(tableData.rows[0][0], 'alice');
        assert.strictEqual(tableData.rows[1][0], 'Bob');
        assert.strictEqual(tableData.rows[2][0], 'CHARLIE');
    });

    test('should handle date sorting', () => {
        // Create table with dates
        const dateTableNode: TableNode = {
            startLine: 0,
            endLine: 3,
            headers: ['Date'],
            rows: [
                ['2023-12-01'],
                ['2023-01-15'],
                ['2023-06-30']
            ],
            alignment: ['left']
        };
        
        const dateManager = new TableDataManager(dateTableNode);
        dateManager.sortByColumnAdvanced(0, 'asc', { dataType: 'date' });
        
        const tableData = dateManager.getTableData();
        assert.strictEqual(tableData.rows[0][0], '2023-01-15');
        assert.strictEqual(tableData.rows[1][0], '2023-06-30');
        assert.strictEqual(tableData.rows[2][0], '2023-12-01');
    });
});