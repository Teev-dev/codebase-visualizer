# Interface Contracts

This document defines the interface contracts between frontend and backend components in the Codebase Visualizer application. These contracts ensure consistent data flow and communication between layers.

## Communication Model

The Codebase Visualizer uses a local communication model with the following pattern:
- Frontend components use IPC (Inter-Process Communication) to call backend services
- Backend services process requests and return results via IPC response channels
- Events from backend to frontend use a publish/subscribe model for asynchronous notifications

## Data Flow Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   UI Layer      │       │  Backend API    │       │  Core Services  │
│                 │       │                 │       │                 │
│  React          │       │  Express/IPC    │       │  Parsers        │
│  Components     │◄─────►│  Controllers    │◄─────►│  Analyzers      │
│                 │       │                 │       │  Visualizers    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        ▲                                                   ▲
        │                                                   │
        └───────────────────────────────────────────────────┘
                         Direct API calls
                     (when performance critical)
```

## Core Data Types

All interfaces share these common data types:

```typescript
interface Entity {
  id: string;
  name: string;
  type: string;
  path?: string;
  metadata?: Record<string, any>;
}

interface Relationship {
  source: string; // Entity ID
  target: string; // Entity ID
  type: string;   // "imports", "extends", "implements", "calls", etc.
  metadata?: Record<string, any>;
}

interface CodebaseStructure {
  entities: Entity[];
  relationships: Relationship[];
  metadata: {
    name: string;
    totalFiles: number;
    totalEntities: number;
    languages: string[];
    createdAt: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

## API Endpoints

### Codebase Management

```typescript
// Upload a codebase
interface UploadCodebaseRequest {
  path: string;         // Local directory path
  name?: string;        // Project name (optional, derived from path if not provided)
  includePatterns?: string[]; // Glob patterns to include
  excludePatterns?: string[]; // Glob patterns to exclude
}

// Upload response
interface UploadCodebaseResponse {
  projectId: string;    // Unique identifier for the uploaded project
  name: string;         // Project name
  path: string;         // Path to the source directory
  status: 'processing' | 'ready' | 'error';
  summary?: {
    fileCount: number;
    languages: { [language: string]: number }; // Language: file count
    totalSize: number;  // In bytes
  };
}

// Get analysis status
interface AnalysisStatusResponse {
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;     // 0-100
  currentOperation?: string;
  timeRemaining?: number; // Estimated seconds remaining
  error?: string;
}
```

### Code Analysis

```typescript
// Get entities (files, classes, functions, etc.)
interface GetEntitiesRequest {
  projectId: string;
  types?: string[];     // Filter by entity types
  path?: string;        // Filter by file path
  limit?: number;
  offset?: number;
}

interface GetEntitiesResponse {
  entities: Entity[];
  totalCount: number;
  hasMore: boolean;
}

// Get relationships between entities
interface GetRelationshipsRequest {
  projectId: string;
  entityId?: string;    // Get relationships for a specific entity
  types?: string[];     // Filter by relationship types
  limit?: number;
  offset?: number;
}

interface GetRelationshipsResponse {
  relationships: Relationship[];
  totalCount: number;
  hasMore: boolean;
}

// Get code structure overview
interface GetCodeStructureRequest {
  projectId: string;
  depth?: number;       // How deep to analyze dependencies
  includeOrphans?: boolean; // Include entities with no relationships
}

interface GetCodeStructureResponse {
  structure: CodebaseStructure;
  metrics: {
    complexity: number; // Overall complexity score
    modularity: number; // Modularity score
    cohesion: number;   // Cohesion score
    coupling: number;   // Coupling score
  };
}
```

### Visualization

```typescript
// Generate diagram
interface GenerateDiagramRequest {
  projectId: string;
  type: 'dependency' | 'class' | 'sequence' | 'package' | 'custom';
  filters?: {
    includePaths?: string[];
    excludePaths?: string[];
    includeTypes?: string[];
    maxDepth?: number;
  };
  layout?: {
    algorithm: 'force' | 'hierarchical' | 'circular' | 'radial';
    direction?: 'LR' | 'RL' | 'TB' | 'BT';
    spacing?: number;
  };
}

interface GenerateDiagramResponse {
  diagramId: string;
  svgContent?: string;  // Inline SVG for small diagrams
  imageUrl?: string;    // URL to the generated image for large diagrams
  entities: {
    id: string;
    x: number;          // X coordinate in the diagram
    y: number;          // Y coordinate in the diagram
    width: number;
    height: number;
  }[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    groups?: any[];
  };
}

// Export diagram
interface ExportDiagramRequest {
  diagramId: string;
  format: 'svg' | 'png' | 'pdf' | 'json';
  width?: number;
  height?: number;
  includeMetadata?: boolean;
}

interface ExportDiagramResponse {
  url: string;          // URL to download the exported file
  expiresAt: string;    // When the URL expires
}
```

### Search & Query

```typescript
// Search the codebase
interface SearchRequest {
  projectId: string;
  query: string;
  type?: 'text' | 'regex' | 'semantic';
  scope?: string[];     // File patterns to search in
  limit?: number;
  offset?: number;
}

interface SearchResponse {
  results: {
    entityId: string;
    path: string;
    line: number;
    column: number;
    text: string;
    context: string;    // Surrounding text
  }[];
  totalCount: number;
  hasMore: boolean;
}

// Execute a custom query
interface CustomQueryRequest {
  projectId: string;
  query: string;        // Query in custom DSL or natural language
  parameters?: Record<string, any>;
}

interface CustomQueryResponse {
  results: any[];       // Query-specific results
  metadata: {
    executionTime: number;
    queryType: string;
  };
}
```

## Event System

Backend-to-frontend events use a publish/subscribe model:

```typescript
// Event types
type EventType = 
  | 'analysis:started'
  | 'analysis:progress'
  | 'analysis:completed'
  | 'analysis:failed'
  | 'diagram:progress'
  | 'diagram:completed'
  | 'system:warning'
  | 'system:error';

// Event payload
interface EventPayload<T = any> {
  eventType: EventType;
  projectId?: string;
  timestamp: string;
  data: T;
}

// Subscribe to events
interface EventSubscription {
  subscribe(eventType: EventType | EventType[], callback: (payload: EventPayload) => void): void;
  unsubscribe(eventType: EventType | EventType[], callback?: (payload: EventPayload) => void): void;
}
```

## Error Handling

All APIs follow consistent error handling patterns:

```typescript
// Error codes
type ErrorCode =
  | 'INVALID_REQUEST'
  | 'PROJECT_NOT_FOUND'
  | 'ANALYSIS_FAILED'
  | 'DIAGRAM_GENERATION_FAILED'
  | 'FILE_ACCESS_ERROR'
  | 'UNSUPPORTED_LANGUAGE'
  | 'RESOURCE_EXHAUSTED'
  | 'INTERNAL_ERROR';

// Error response structure
interface ErrorResponse {
  code: ErrorCode;
  message: string;      // User-friendly message
  details?: any;        // Additional error context
  requestId?: string;   // For tracking/debugging
}
```

## Implementation Guidelines

1. All interfaces must be implemented as TypeScript interfaces
2. Validate request and response data against these contracts
3. Document any deviations or extensions to these interfaces
4. Update this document when interfaces change
5. Generate API documentation from these interface definitions
6. Implement automated tests to verify contract compliance

## Version Control

These interface contracts are versioned along with the codebase. 
Any breaking changes must be:

1. Discussed and approved by both frontend and backend teams
2. Clearly documented with migration paths
3. Implemented with backward compatibility where possible
4. Tested thoroughly before deployment 