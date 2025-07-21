# Development Guidelines

## Git Commit Rules

### Commit Message Prefixes
All commit messages must use one of the following prefixes:

- `feat: ` - New features or functionality
- `fix: ` - Bug fixes
- `refactor: ` - Code refactoring without changing functionality
- `doc: ` - Documentation changes

### Example Commit Messages
- `feat: add markdown table parser with AST extraction`
- `fix: resolve table position detection issue`
- `refactor: improve table parsing performance`
- `doc: update API documentation for parser`

## Development Workflow

### Task Completion Process
1. **Implement the task** - Write code according to the task requirements
2. **Run tests** - Execute all relevant tests to ensure functionality works
3. **Verify test success** - All tests must pass before proceeding
4. **Git commit** - Commit changes with appropriate prefix
5. **Update task status** - Mark task as completed in tasks.md

### Testing Requirements
- All new functionality must have corresponding unit tests
- Tests must pass before any git commit
- Use `npm test` to run the full test suite
- Use `npm run compile` to check for TypeScript compilation errors

### Code Quality
- Follow TypeScript strict mode requirements
- Use ESLint for code style consistency
- Ensure proper error handling for all functions
- Document public APIs with JSDoc comments

## Project Structure
```
src/
├── extension.ts          # Main extension entry point
├── markdownParser.ts     # Markdown parsing functionality
├── tableDataManager.ts   # Table data management
├── webviewManager.ts     # Webview panel management
├── fileHandler.ts        # File system operations
└── test/
    ├── runTest.ts        # Test runner
    └── suite/
        ├── index.ts      # Test suite setup
        └── *.test.ts     # Individual test files
```

## Commands
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode compilation
- `npm test` - Run all tests
- `npm run lint` - Run ESLint
- `npm run vscode:prepublish` - Prepare for publishing