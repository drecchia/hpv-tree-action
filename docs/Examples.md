# Tree CRUDS Selection Component Usage Examples

## Basic Implementation

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="tree-action.css">
</head>
<body>
    <div id="basic-tree"></div>
    
    <script src="tree-action.js"></script>
    <script>
        // Initialize with basic configuration
        const basicTree = new TreeAction({
            containerId: 'basic-tree',
            operations: [
                { code: 'C', tooltip: 'Create' },
                { code: 'R', tooltip: 'Read' },
                { code: 'U', tooltip: 'Update' },
                { code: 'D', tooltip: 'Delete' },
                { code: 'S', tooltip: 'Share' }
            ]
        });
    </script>
</body>
</html>
```

## Custom Tree Structure

```javascript
// Create nodes programmatically
const docsFolder = new TreeNode('docs', 'Documents', {
    isFolder: true,
    availableOperations: ['C', 'R', 'U', 'D', 'S']
});

docsFolder.addChild(new TreeNode('report', 'Report.pdf', {
    isFolder: false,
    availableOperations: ['R', 'U', 'S'],
    initialStates: {
        'R': 'allowed',
        'S': 'denied'
    }
}));

// Add to tree
treeAction.rootNode.addChild(docsFolder);
treeAction.render();
```

## Loading From JSON

```javascript
// Initialize with predefined structure
const treeAction = new TreeAction({
    containerId: 'json-tree',
    initialData: {
        operations: [
            { code: 'V', tooltip: 'View' },
            { code: 'E', tooltip: 'Edit' }
        ],
        tree: {
            id: 'root',
            name: 'Project Files',
            isFolder: true,
            level: 0,
            availableOperations: ['V', 'E'],
            children: [
                {
                    id: 'src',
                    name: 'Source',
                    isFolder: true,
                    level: 1,
                    availableOperations: ['V', 'E'],
                    children: []
                }
            ]
        }
    }
});
```

## Event Handling

```javascript
// Track operation changes
treeAction.on(TreeAction.EVENTS.OPERATION.CHANGE, (data) => {
    const { node, operation, oldState, newState } = data;
    console.log(`Operation ${operation} on ${node.name} changed from ${oldState} to ${newState}`);
});

// Monitor tree updates
treeAction.on(TreeAction.EVENTS.TREE.UPDATE, () => {
    console.log('Tree structure updated');
});

// Track node expansion
treeAction.on(TreeAction.EVENTS.NODE.EXPAND, (node) => {
    console.log(`${node.name} expanded`);
});
```

## Custom Operation Types

```javascript
// Initialize with custom operations
const customTree = new TreeAction({
    containerId: 'custom-tree',
    operations: [
        { code: 'V', tooltip: 'View' },
        { code: 'M', tooltip: 'Modify' },
        { code: 'X', tooltip: 'Execute' }
    ]
});

// Add new operation type dynamically
customTree.addNewOperationType('P', 'Print');

// Remove operation type
customTree.removeOperationType('X');
```

## Lazy Loading Implementation

```javascript
// Create lazy-loaded folder
const projectsFolder = new TreeNode('projects', 'Projects', {
    isFolder: true,
    lazyLoad: true,
    availableOperations: ['C', 'R', 'U', 'D']
});

// Add to tree
treeAction.rootNode.addChild(projectsFolder);

// Listen for expansion
treeAction.on(TreeAction.EVENTS.NODE.EXPAND, async (node) => {
    if (node.id === 'projects' && !node.loaded) {
        // Simulate API call
        const children = await fetchProjectFiles();
        children.forEach(child => {
            node.addChild(new TreeNode(child.id, child.name, {
                isFolder: child.isFolder,
                availableOperations: child.operations
            }));
        });
        node.loaded = true;
        treeAction.render();
    }
});
```

## Bulk Operations

```javascript
// Set initial states for multiple nodes
const bulkTree = new TreeAction({
    containerId: 'bulk-tree'
});

// Configure root permissions
bulkTree.setNodeInitialStates('root', {
    'R': 'allowed',
    'U': 'allowed'
});

// Listen for batch updates
bulkTree.on(TreeAction.EVENTS.OPERATION.BATCH_UPDATE, (updates) => {
    updates.forEach(update => {
        const { node, operation, state, affected } = update;
        console.log(`Bulk update: ${operation} set to ${state} on ${node.name}`);
        console.log('Affected nodes:', affected.map(n => n.name));
    });
});
```

## State Export/Import

```javascript
// Export current state
const exportBtn = document.getElementById('export-btn');
exportBtn.addEventListener('click', () => {
    const jsonData = treeAction.exportTreeAsJSON();
    
    // Save to file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tree-state.json';
    a.click();
});

// Import saved state
const importBtn = document.getElementById('import-btn');
importBtn.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const jsonData = e.target.result;
        treeAction.loadTreeFromJSON(jsonData);
    };
    
    reader.readAsText(file);
});
```

## Advanced Event Logging

```javascript
// Create comprehensive event logging
const eventLogger = {
    init(tree) {
        // Node events
        Object.values(TreeAction.EVENTS.NODE).forEach(event => {
            tree.on(event, (node) => {
                console.log(`Node Event: ${event}`, {
                    id: node.id,
                    name: node.name,
                    level: node.level,
                    state: node.operationState
                });
            });
        });

        // Operation events
        Object.values(TreeAction.EVENTS.OPERATION).forEach(event => {
            tree.on(event, (data) => {
                console.log(`Operation Event: ${event}`, data);
            });
        });

        // Tree events
        Object.values(TreeAction.EVENTS.TREE).forEach(event => {
            tree.on(event, (data) => {
                console.log(`Tree Event: ${event}`, data);
            });
        });
    }
};

// Initialize logging
eventLogger.init(treeAction);
