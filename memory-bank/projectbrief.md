# Project Brief: Tree Action

## Overview
Tree Action is a highly parametrizable vanilla JavaScript library for creating interactive treeviews and checklists. It provides a flexible, event-driven system for managing hierarchical data with CRUD operation support and customizable node permissions.

## Core Requirements

### 1. Tree Structure
- Support for hierarchical data representation
- Flexible node structure with folders and leaf nodes
- Customizable node properties and metadata
- Parent-child relationship management

### 2. Operations
- Built-in CRUD operations (Create, Read, Update, Delete)
- Customizable operation permissions per node
- Operation state management and inheritance
- Mixed-state handling for parent nodes

### 3. Lazy Loading
- On-demand loading of child nodes
- Loading state management
- Async data fetching support
- Error handling for failed loads

### 4. Event System
- Rich event emission for tree operations
- Node expand/collapse events
- Tree update notifications
- Search and data loading events

### 5. Search Functionality
- Tree-wide search capabilities
- Visibility management for search results
- Path highlighting to matched nodes
- Async search support with lazy loading

### 6. Data Management
- JSON import/export functionality
- State persistence
- Tree data serialization
- Operation type management

## Technical Goals
1. Zero dependencies (vanilla JavaScript)
2. High performance with large datasets
3. Flexible API for integration
4. Maintainable, modular code structure

## Integration Goals
1. Easy to integrate into existing projects
2. Minimal setup requirements
3. Customizable styling
4. Clear documentation and examples
