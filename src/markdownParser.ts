const MarkdownIt = require('markdown-it');
import * as vscode from 'vscode';

export interface TableNode {
    startLine: number;
    endLine: number;
    headers: string[];
    rows: string[][];
    alignment: ('left' | 'center' | 'right')[];
}

export interface MarkdownAST {
    tokens: any[];
    content: string;
}

export class MarkdownParser {
    private md: any;

    constructor() {
        this.md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true
        });
    }

    /**
     * Parse markdown document and return AST
     */
    parseDocument(content: string): MarkdownAST {
        const tokens = this.md.parse(content, {});
        return {
            tokens,
            content
        };
    }

    /**
     * Find all tables in the document
     */
    findTablesInDocument(ast: MarkdownAST): TableNode[] {
        const tables: TableNode[] = [];
        const tokens = ast.tokens;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            
            if (token.type === 'table_open') {
                const tableNode = this.parseTableToken(tokens, i, ast.content);
                if (tableNode) {
                    tables.push(tableNode);
                }
            }
        }

        return tables;
    }

    /**
     * Find table at specific position
     */
    findTableAtPosition(ast: MarkdownAST, position: vscode.Position): TableNode | null {
        const tables = this.findTablesInDocument(ast);
        
        for (const table of tables) {
            if (position.line >= table.startLine && position.line <= table.endLine) {
                return table;
            }
        }

        return null;
    }

    /**
     * Parse table token and extract table data
     */
    private parseTableToken(tokens: any[], startIndex: number, content: string): TableNode | null {
        let currentIndex = startIndex;
        let headers: string[] = [];
        let rows: string[][] = [];
        let alignment: ('left' | 'center' | 'right')[] = [];
        let startLine = 0;
        let endLine = 0;

        // Find table boundaries
        if (tokens[startIndex].map) {
            startLine = tokens[startIndex].map[0];
            endLine = tokens[startIndex].map[1];
        }

        // Parse table structure
        while (currentIndex < tokens.length) {
            const token = tokens[currentIndex];

            if (token.type === 'table_close') {
                break;
            }

            if (token.type === 'thead_open') {
                const headerData = this.parseTableHead(tokens, currentIndex);
                headers = headerData.headers;
                alignment = headerData.alignment;
                currentIndex = headerData.nextIndex;
                continue;
            }

            if (token.type === 'tbody_open') {
                const bodyData = this.parseTableBody(tokens, currentIndex);
                rows = bodyData.rows;
                currentIndex = bodyData.nextIndex;
                continue;
            }

            currentIndex++;
        }

        // Update end line if we have better information
        if (tokens[currentIndex] && tokens[currentIndex].map) {
            endLine = tokens[currentIndex].map[1];
        }

        return {
            startLine,
            endLine,
            headers,
            rows,
            alignment
        };
    }

    /**
     * Parse table header
     */
    private parseTableHead(tokens: any[], startIndex: number): {
        headers: string[];
        alignment: ('left' | 'center' | 'right')[];
        nextIndex: number;
    } {
        let currentIndex = startIndex;
        const headers: string[] = [];
        const alignment: ('left' | 'center' | 'right')[] = [];

        while (currentIndex < tokens.length) {
            const token = tokens[currentIndex];

            if (token.type === 'thead_close') {
                currentIndex++;
                break;
            }

            if (token.type === 'tr_open') {
                currentIndex++;
                continue;
            }

            if (token.type === 'th_open') {
                // Extract alignment from token attributes
                const align = this.extractAlignment(token);
                alignment.push(align);
                
                // Find the content of this header cell
                const headerContent = this.extractCellContent(tokens, currentIndex);
                headers.push(headerContent.content);
                currentIndex = headerContent.nextIndex;
                continue;
            }

            currentIndex++;
        }

        return { headers, alignment, nextIndex: currentIndex };
    }

    /**
     * Parse table body
     */
    private parseTableBody(tokens: any[], startIndex: number): {
        rows: string[][];
        nextIndex: number;
    } {
        let currentIndex = startIndex;
        const rows: string[][] = [];
        let currentRow: string[] = [];

        while (currentIndex < tokens.length) {
            const token = tokens[currentIndex];

            if (token.type === 'tbody_close') {
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                }
                currentIndex++;
                break;
            }

            if (token.type === 'tr_open') {
                currentRow = [];
                currentIndex++;
                continue;
            }

            if (token.type === 'tr_close') {
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                    currentRow = [];
                }
                currentIndex++;
                continue;
            }

            if (token.type === 'td_open') {
                const cellContent = this.extractCellContent(tokens, currentIndex);
                currentRow.push(cellContent.content);
                currentIndex = cellContent.nextIndex;
                continue;
            }

            currentIndex++;
        }

        return { rows, nextIndex: currentIndex };
    }

    /**
     * Extract cell content from tokens
     */
    private extractCellContent(tokens: any[], startIndex: number): {
        content: string;
        nextIndex: number;
    } {
        let currentIndex = startIndex + 1; // Skip the opening tag
        let content = '';

        while (currentIndex < tokens.length) {
            const token = tokens[currentIndex];

            if (token.type === 'th_close' || token.type === 'td_close') {
                currentIndex++;
                break;
            }

            if (token.type === 'inline') {
                content += token.content || '';
            }

            currentIndex++;
        }

        return { content: content.trim(), nextIndex: currentIndex };
    }

    /**
     * Extract alignment from token attributes
     */
    private extractAlignment(token: any): 'left' | 'center' | 'right' {
        if (token.attrGet && token.attrGet('style')) {
            const style = token.attrGet('style');
            if (style.includes('text-align: center')) {
                return 'center';
            }
            if (style.includes('text-align: right')) {
                return 'right';
            }
        }
        return 'left';
    }
}