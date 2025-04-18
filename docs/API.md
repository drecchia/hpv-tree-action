# Tree CRUDS Selection Component API Documentation

## Table of Contents
1. [Installation](#installation)
2. [Component Classes](#component-classes)
3. [Events](#events)
4. [Public API Methods](#public-api-methods)
5. [State Management](#state-management)

## Installation

```html
<!-- Add component styles -->
<link rel="stylesheet" href="tree-action.css">

<!-- Add component script -->
<script src="tree-action.js"></script>
```

## Component Classes

### TreeAction

Main component class for managing the tree structure and operations.

#### Constructor Options
```javascript
const options = {
    containerId: string,       // ID of the container element (default: 'tree-container')
    operations: Array<{       // Array of available operations
        code: string,         // Operation code (e.g., 'C', 'R', 'U', 'D', 'S')
        tooltip: string       // Operation tooltip text
    }>,
    initialData: {           // Optional initial tree data
        operations: Array,   // Operation definitions
        tree: Object        // Tree structure
    }
};

const treeAction = new TreeAction(options);
```

### TreeNode

Represents a node in the tree structure.

#### Constructor Options
```javascript
const options = {
    isFolder: boolean,        // Whether the node is a folder
    lazyLoad: boolean,        // Enable lazy loading for folders
    level: number,            // Node level in tree
    availableOperations: Array<string>,  // Available operations for this node
    initialStates: Object     // Initial operation states
};

const node = new TreeNode(id, name, options);
```

## Events

The component uses an event system for tracking changes and updates.

### Available Events
```javascript
TreeAction.EVENTS = {
    NODE: {
        COLLAPSE: 'nodeCollapse',    // Node collapsed
        EXPAND: 'nodeExpand',        // Node expanded
        SELECT: 'nodeSelect'         // Node selected
    },
    OPERATION: {
        CHANGE: 'operationChange',           // Single operation changed
        STATE_UPDATE: 'operationStateUpdate', // Operation state updated
        BATCH_UPDATE: 'batchOperationUpdate' // Multiple operations updated
    },
    TREE: {
        UPDATE: 'treeUpdate',    // Tree structure updated
        DATA_LOAD: 'dataLoad',   // Data loaded into tree
        EXPORT: 'exportData'     // Tree data exported
    }
};
```

### Event Usage
```javascript
// Subscribe to events
treeAction.on('operationChange', (data) => {
    console.log('Operation changed:', data);
});

// Unsubscribe from events
treeAction.off('operationChange', listener);

// One-time event subscription
treeAction.once('treeUpdate', (data) => {
    console.log('Tree updated:', data);
});
```

## Public API Methods

### Tree Management
```javascript
// Export tree structure as JSON
const jsonData = treeAction.exportTreeAsJSON();

// Load tree from JSON data
treeAction.loadTreeFromJSON(jsonData);

// Get current tree data
const treeData = treeAction.getTreeData();

// Expand tree to specific level
treeAction.expandToLevel(2);
```

### Operation Management
```javascript
// Add new operation type
treeAction.addNewOperationType('X', 'Execute');

// Remove operation type
treeAction.removeOperationType('X');

// Get available operation types
const operations = treeAction.getOperationTypes();

// Set initial states for a node
treeAction.setNodeInitialStates('nodeId', {
    'R': 'allowed',
    'W': 'denied'
});
```

## State Management

### Operation States
- `'unselected'`: Default state
- `'allowed'`: Operation permitted
- `'denied'`: Operation forbidden
- `'mixed'`: Mixed state (folders only)

### State Inheritance
- Changes to parent nodes cascade to children
- Parent nodes reflect aggregate state of children
- Mixed states indicate varying child permissions

### Example State Structure
```javascript
node.operationState = {
    'C': 'allowed',
    'R': 'denied',
    'U': 'unselected',
    'D': 'mixed'
};
