# Project Brief: Tree CRUDS Selection Component

## Overview
A reusable vanilla JavaScript component for managing hierarchical permissions through a tree-based interface. The component visualizes and manages CRUDS (Create, Read, Update, Delete, Share) operations across a file/folder structure.

## Core Requirements

### 1. Tree Structure Management
- Display hierarchical file/folder structure
- Support for collapsible folders
- Lazy loading for folder contents
- Visual indicators for folders vs files

### 2. Permission Management
- Support for CRUDS operations
  - Create (C)
  - Read (R)
  - Update (U)
  - Delete (D)
  - Share (S)
- Dynamic operation type management
  - Add/remove operation types
  - Custom tooltips for operations
- Three-state permission toggle:
  - Allowed (green)
  - Denied (red)
  - Unselected (white)
- Mixed state indication for parent nodes
- Permission inheritance
  - Changes propagate to children
  - Parent states reflect children's states

### 3. User Interface
- Clean, intuitive interface
- Visual hierarchy through indentation
- Loading indicators for async operations
- Tooltips for operation explanations
- Level-based expansion controls

### 4. Data Management
- JSON export functionality
- JSON import capability
- State persistence
- Efficient updates without full re-renders

## Success Criteria
1. Component is reusable across different projects
2. Performs efficiently with large tree structures
3. Maintains consistent state across operations
4. Provides intuitive user experience
5. Supports dynamic permission configuration

## Technical Goals
1. Zero external dependencies
2. Modular and maintainable code structure
3. Efficient DOM manipulation
4. Clean, semantic HTML
5. Responsive CSS
6. Cross-browser compatibility
