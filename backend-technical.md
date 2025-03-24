# Backend Technical Standards

This document outlines the backend technology stack, architecture, and development standards for the Codebase Visualizer project.

## Technology Stack

### Core Technologies
- **Runtime Environment**: Node.js (LTS version)
- **Language**: TypeScript for type safety and enhanced developer experience
- **Framework**: Express.js for HTTP server functionality (when needed)
- **Code Analysis**: Custom parsers built on top of language-specific AST libraries
- **Database**: SQLite for local data persistence
- **File System**: Node.js fs/promises API for file operations

### Code Parsing & Analysis
- **JavaScript/TypeScript**: TypeScript Compiler API, Babel parser
- **Python**: ast module, typed-ast
- **Java**: JavaParser
- **C/C++**: Clang
- **Ruby**: RuboCop AST
- **Go**: go/ast
- **Generic**: Tree-sitter for language-agnostic parsing

### Visualization Generation
- **Graph Generation**: Graphviz (dot) for layout generation
- **Diagram Format**: SVG with custom metadata for interactivity
- **Image Processing**: Sharp for image optimization and conversion

## Architecture

### Backend Structure
- **Modular Architecture**: Clear separation of concerns with dedicated modules
- **Service-Based Design**: Independent services for parsing, analysis, and visualization
- **Plugin System**: Extensible architecture for supporting additional languages

### Directory Structure
```
src/
├── api/               # API routes and controllers
├── parsers/           # Language-specific code parsers
│   ├── javascript/
│   ├── python/
│   ├── java/
│   └── generic/
├── analyzers/         # Code analysis modules
│   ├── dependency/
│   ├── structure/
│   └── metrics/
├── visualizers/       # Diagram generation components
├── storage/           # Data persistence layer
├── utils/             # Helper functions and utilities
├── types/             # TypeScript type definitions
└── index.ts           # Application entry point
```

## Coding Standards

### TypeScript
- Strict type checking enabled
- Use interfaces for service contracts
- Implement proper error handling with custom error types
- Avoid use of `any` type; use `unknown` when type is uncertain
- Document public APIs with JSDoc

### Performance Considerations
- Implement worker threads for CPU-intensive parsing operations
- Use caching for repeated analysis of the same files
- Implement streaming for large file operations
- Optimize memory usage for large codebases

### Error Handling
- Structured error responses with appropriate HTTP status codes
- Detailed logging for debugging purposes
- Graceful degradation when specific parsers fail
- User-friendly error messages

### Security
- Input validation for all file operations
- Protection against path traversal attacks
- Safe handling of untrusted code
- Resource limitations to prevent DoS attacks

## Parser Implementation

### Parser Interface
Each language parser must implement the following interface:
```typescript
interface CodeParser {
  parseFile(filePath: string): Promise<ParsedFile>;
  parseDirectory(directoryPath: string): Promise<ParsedDirectory>;
  getLanguages(): string[];
  getSupportedFileExtensions(): string[];
}
```

### Analyzer Interface
```typescript
interface CodeAnalyzer {
  analyze(parsedCode: ParsedFile | ParsedDirectory): Promise<AnalysisResult>;
  getMetrics(): MetricDefinition[];
  getSupportedLanguages(): string[];
}
```

### Visualization Interface
```typescript
interface Visualizer {
  generateDiagram(analysisResult: AnalysisResult): Promise<Diagram>;
  getSupportedOutputFormats(): string[];
  getLayoutOptions(): LayoutOption[];
}
```

## Data Models

### Core Models
- **File**: Represents a source code file with metadata
- **Directory**: Represents a collection of files and subdirectories
- **Symbol**: Represents a code entity (function, class, variable)
- **Relationship**: Represents a relationship between symbols
- **Diagram**: Represents a visualization of the code structure

## Testing Strategy

- **Unit Tests**: Jest for individual parser and analyzer components
- **Integration Tests**: Testing the full pipeline from parsing to visualization
- **Performance Tests**: Benchmarking against large codebases
- **Coverage Target**: 85% code coverage for core functionality

## API Documentation

All APIs should be documented using:
- OpenAPI (Swagger) for HTTP endpoints
- JSDoc for internal TypeScript interfaces
- Markdown documentation for usage examples and integration guides

## Performance Targets

- Parse speed: Process at least 10,000 LOC per second on modern hardware
- Memory usage: <2GB RAM for codebases up to 100,000 LOC (standard) and <4GB for up to 500,000 LOC (extended mode)
- Analysis time: <2 minutes for complex dependency analysis of standard projects (<100,000 LOC)
- Visualization generation: <20 seconds for a complete system diagram
- Startup time: <3 seconds from application launch to ready state

## Error Handling Protocol

### Error Categories
- **Parsing Errors**: Issues with reading or understanding code files
- **Analysis Errors**: Problems in analyzing code structures and relationships
- **System Errors**: File system, memory, or other resource limitations
- **Visualization Errors**: Problems generating diagrams or visual elements

### Error Propagation
- All errors must include:
  - Unique error code
  - Human-readable description
  - Technical details (when appropriate)
  - Suggested recovery action
- Errors should be propagated up the stack with added context at each level
- Frontend-facing errors should be translated to user-friendly messages

### Error Reporting
- All critical errors must be logged with full context
- Implement automated error reporting for crashes or critical failures
- Provide option for users to submit error reports
- Include system diagnostics with error reports (with user permission)

### Recovery Strategies
- Implement graceful degradation for non-critical errors
- Provide automatic retries for transient errors
- Include self-healing mechanisms where possible
- Save user work and state before attempting risky operations

## Dependency Management

- Minimize external dependencies to reduce security risks
- Pin dependency versions for reproducible builds
- Regular dependency auditing and updates
- Prefer established libraries with active maintenance

## Logging and Monitoring

- Structured logging with Winston
- Performance metrics collection
- Error tracking and alerting
- Operation auditing for critical functions

## Development Workflow

- Test-driven development for core parsing components
- Code reviews required for all backend changes
- Automated CI/CD pipeline for testing and deployment
- Feature flags for experimental parsers or analyzers 