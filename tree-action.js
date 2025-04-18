/**
 * TreeNode Class - Represents a node in the TreeAction component
 */
class TreeNode {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.isFolder = options.isFolder || false;
        this.lazyLoad = options.lazyLoad || false;
        this.loaded = !this.lazyLoad;
        this.collapsed = true;
        this.loading = false;
        this.level = options.level || 0;
        this.children = [];
        this.parent = null;
        this.operationState = {};
        this.availableOperations = options.availableOperations || [];

        // Initialize operations with initial states if provided
        if (options.initialStates) {
            this.setInitialStates(options.initialStates);
        }
    }

    /**
     * Set initial operation states for this node
     * @param {Object} states - Object mapping operation codes to states ('allowed', 'denied', 'unselected')
     */
    setInitialStates(states) {
        this.operationState = { ...this.operationState, ...states };
    }

    addChild(childNode) {
        childNode.level = this.level + 1;
        childNode.parent = this;
        this.children.push(childNode);
        return childNode;
    }

    hasOperationMixedState(operation) {
        if (this.children.length === 0) return false;

        const firstChildState = this.children[0].operationState[operation];
        return this.children.some(child =>
            child.availableOperations.includes(operation) &&
            child.operationState[operation] !== firstChildState
        );
    }
}

/**
 * Simple Event Emitter implementation
 */
class EventEmitter {
    constructor() {
        this._events = {};
    }

    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
        return this;
    }

    off(event, listener) {
        if (!this._events[event]) return this;
        
        const index = this._events[event].indexOf(listener);
        if (index !== -1) {
            this._events[event].splice(index, 1);
        }
        return this;
    }

    emit(event, ...args) {
        if (!this._events[event]) return false;
        
        const listeners = this._events[event].slice();
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].apply(this, args);
        }
        return true;
    }

    once(event, listener) {
        const self = this;
        function fn(...args) {
            self.off(event, fn);
            listener.apply(self, args);
        }
        this.on(event, fn);
        return this;
    }
}

/**
 * TreeAction Component - Main class for tree with operation buttons
 */
class TreeAction extends EventEmitter {
    /**
     * Event types supported by TreeAction
     */
    static EVENTS = {
        NODE: {
            COLLAPSE: 'nodeCollapse',
            EXPAND: 'nodeExpand',
            SELECT: 'nodeSelect'
        },
        OPERATION: {
            CHANGE: 'operationChange',
            STATE_UPDATE: 'operationStateUpdate',
            BATCH_UPDATE: 'batchOperationUpdate'
        },
        TREE: {
            UPDATE: 'treeUpdate',
            DATA_LOAD: 'dataLoad',
            EXPORT: 'exportData'
        }
    };

    constructor(options = {}) {
        super();
        this.containerId = options.containerId || 'tree-container';
        this.operationTypes = options.operations || [
            { code: 'C', tooltip: 'Create' },
            { code: 'R', tooltip: 'Read' },
            { code: 'U', tooltip: 'Update' },
            { code: 'D', tooltip: 'Delete' },
            { code: 'S', tooltip: 'Share' }
        ];

        // Create root node
        this.rootNode = new TreeNode('root', 'Root', {
            isFolder: true,
            level: 0,
            availableOperations: this.operationTypes.map(op => op.code),
            lazyLoad: false
        });

        this.pendingOperations = [];

        // Initialize with data if provided
        if (options.initialData) {
            this.loadTreeFromJSON(options.initialData);
        }

        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = this.containerId;
            document.body.appendChild(newContainer);
        }

        this._addStyles();
        this.render();
    }

    render() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = '';

        // Create main wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-action-wrapper';

        // Create operations header
        const header = document.createElement('div');
        header.className = 'tree-action-header';

        const operationsList = document.createElement('div');
        operationsList.className = 'operations-list';

        const titleCell = document.createElement('div');
        titleCell.className = 'operations-title';
        titleCell.textContent = 'Node / Operations';
        operationsList.appendChild(titleCell);

        this.operationTypes.forEach(op => {
            const opCell = document.createElement('div');
            opCell.className = 'operation-type';
            opCell.textContent = op.code;
            opCell.title = op.tooltip;
            operationsList.appendChild(opCell);
        });

        header.appendChild(operationsList);
        wrapper.appendChild(header);

        // Create level controls
        const levelControls = document.createElement('div');
        levelControls.className = 'level-controls';

        // Add level input
        const levelInput = document.createElement('input');
        levelInput.type = 'number';
        levelInput.min = '0';
        levelInput.value = '0';
        levelInput.className = 'level-input';
        levelInput.placeholder = 'Level';

        // Add expand/collapse buttons
        const expandLevelBtn = document.createElement('button');
        expandLevelBtn.textContent = 'Expand to Level';
        expandLevelBtn.className = 'tree-action-button';
        expandLevelBtn.addEventListener('click', () => {
            const level = parseInt(levelInput.value, 10);
            if (!isNaN(level) && level >= 0) {
                this.expandToLevel(level);
            }
        });

        const collapseLevelBtn = document.createElement('button');
        collapseLevelBtn.textContent = 'Collapse to Level';
        collapseLevelBtn.className = 'tree-action-button';
        collapseLevelBtn.addEventListener('click', () => {
            const level = parseInt(levelInput.value, 10);
            if (!isNaN(level) && level >= 0) {
                this.collapseToLevel(level);
            }
        });

        // Add expand/collapse all buttons
        const expandAllBtn = document.createElement('button');
        expandAllBtn.textContent = 'Expand All';
        expandAllBtn.className = 'tree-action-button';
        expandAllBtn.addEventListener('click', () => {
            this.expandToLevel(Number.MAX_SAFE_INTEGER);
        });

        const collapseAllBtn = document.createElement('button');
        collapseAllBtn.textContent = 'Collapse All';
        collapseAllBtn.className = 'tree-action-button';
        collapseAllBtn.addEventListener('click', () => {
            this.collapseToLevel(0);
        });

        // Assemble level controls
        levelControls.appendChild(levelInput);
        levelControls.appendChild(expandLevelBtn);
        levelControls.appendChild(collapseLevelBtn);
        levelControls.appendChild(expandAllBtn);
        levelControls.appendChild(collapseAllBtn);

        wrapper.appendChild(levelControls);

        // Create tree container
        const treeContainer = document.createElement('div');
        treeContainer.className = 'tree-container';

        this._renderNode(this.rootNode, treeContainer);

        wrapper.appendChild(treeContainer);

        // Add JSON operations section
        const jsonSection = document.createElement('div');
        jsonSection.className = 'json-section';

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export JSON';
        exportBtn.className = 'tree-action-button';
        exportBtn.addEventListener('click', () => {
            this.exportTreeAsJSON();
        });

        const jsonOutput = document.createElement('textarea');
        jsonOutput.id = `${this.containerId}-json-output`;
        jsonOutput.className = 'json-output';
        jsonOutput.placeholder = 'JSON output will appear here...';
        jsonOutput.rows = 5;

        jsonSection.appendChild(exportBtn);
        jsonSection.appendChild(jsonOutput);

        wrapper.appendChild(jsonSection);

        container.appendChild(wrapper);
    }

    _renderNode(node, parentElement) {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.dataset.nodeId = node.id;
        nodeElement.style.paddingLeft = `${node.level * 20}px`;

        // Create toggle indicator
        const toggleElement = document.createElement('span');
        toggleElement.className = 'toggle-indicator';

        if (node.isFolder) {
            toggleElement.textContent = node.collapsed ? '▶' : '▼';
            toggleElement.addEventListener('click', () => this.toggleCollapse(node));
        } else {
            toggleElement.textContent = ' ';
        }

        // Create node icon and name
        const iconElement = document.createElement('span');
        iconElement.className = 'node-icon';
        iconElement.textContent = node.isFolder ? '📁' : '📄';

        const nameElement = document.createElement('span');
        nameElement.className = 'node-name';
        nameElement.textContent = node.name;

        // Create operations container
        const operationsElement = document.createElement('div');
        operationsElement.className = 'node-operations';

        // Add each operation button
        this.operationTypes.forEach(op => {
            if (node.availableOperations.includes(op.code)) {
                const opButton = document.createElement('button');
                opButton.className = 'operation-button';
                opButton.dataset.operation = op.code;
                opButton.title = op.tooltip;
                opButton.textContent = op.code;

                // Set state class
                const state = node.operationState[op.code] || 'unselected';
                opButton.classList.add(`state-${state}`);

                // Add mixed state if applicable
                if (node.isFolder && node.children.length > 0 && node.hasOperationMixedState(op.code)) {
                    opButton.classList.add('state-mixed');
                }

                opButton.addEventListener('click', () => {
                    this.toggleOperationState(node, op.code);
                });

                operationsElement.appendChild(opButton);
            } else {
                // Add disabled placeholder
                const opPlaceholder = document.createElement('span');
                opPlaceholder.className = 'operation-button state-disabled';
                opPlaceholder.textContent = op.code;
                opPlaceholder.title = `${op.tooltip} (Not available)`;
                operationsElement.appendChild(opPlaceholder);
            }
        });

        // Assemble node
        nodeElement.appendChild(toggleElement);
        nodeElement.appendChild(iconElement);
        nodeElement.appendChild(nameElement);
        nodeElement.appendChild(operationsElement);

        parentElement.appendChild(nodeElement);

        // Create children container
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        childrenContainer.style.display = node.collapsed ? 'none' : 'block';

        // Show loading indicator if needed
        if (node.isFolder && !node.loaded && !node.collapsed) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading-indicator';
            loadingElement.textContent = 'Loading...';
            childrenContainer.appendChild(loadingElement);

            if (!node.loading) {
                this.loadNodeChildren(node);
            }
        }

        // Render children if not collapsed
        if (!node.collapsed && node.children.length > 0) {
            node.children.forEach(childNode => {
                this._renderNode(childNode, childrenContainer);
            });
        }

        parentElement.appendChild(childrenContainer);
    }

    toggleCollapse(node) {
        if (!node.isFolder) return;

        const oldState = node.collapsed;
        node.collapsed = !node.collapsed;

        // Emit appropriate event
        this.emit(node.collapsed ? TreeAction.EVENTS.NODE.COLLAPSE : TreeAction.EVENTS.NODE.EXPAND, node);

        // If expanding a node that needs lazy loading
        if (!node.collapsed && !node.loaded && !node.loading) {
            this.loadNodeChildren(node);
        }

        this.render();
    }

    toggleOperationState(node, operation) {
        // Cycle through states: unselected -> allowed -> denied -> unselected
        const currentState = node.operationState[operation] || 'unselected';
        let newState;

        switch (currentState) {
            case 'unselected': newState = 'allowed'; break;
            case 'allowed': newState = 'denied'; break;
            case 'denied': newState = 'unselected'; break;
            default: newState = 'unselected';
        }

        this.setOperationState(node, operation, newState);
    }

    setOperationState(node, operation, state) {
        const oldState = node.operationState[operation];
        node.operationState[operation] = state;

        // Emit single operation change event
        this.emit(TreeAction.EVENTS.OPERATION.CHANGE, { 
            node, 
            operation, 
            oldState, 
            newState: state 
        });

        // Add to pending operations to prevent multiple renders
        this.pendingOperations.push({ node, operation, state });

        // Process all pending operations in next animation frame
        if (this.pendingOperations.length === 1) {
            requestAnimationFrame(() => this.processPendingOperations());
        }
    }

    processPendingOperations() {
        const processed = new Set();
        const batchUpdates = [];

        while (this.pendingOperations.length > 0) {
            const { node, operation, state } = this.pendingOperations.shift();

            if (!processed.has(`${node.id}-${operation}`)) {
                // Track changes for batch event
                const update = { node, operation, state, affected: [] };
                
                // Apply state to children (cascade down)
                if (node.isFolder) {
                    this._applyOperationToChildren(node, operation, state, update.affected);
                }

                // Update parent states (cascade up)
                this._updateParentOperationStates(node, operation, update.affected);

                processed.add(`${node.id}-${operation}`);
                batchUpdates.push(update);
            }
        }

        // Emit batch update event if there were changes
        if (batchUpdates.length > 0) {
            this.emit(TreeAction.EVENTS.OPERATION.BATCH_UPDATE, batchUpdates);
        }

        // Re-render the tree
        this.render();
        
        // Emit tree update event
        this.emit(TreeAction.EVENTS.TREE.UPDATE);
    }

    _applyOperationToChildren(node, operation, state) {
        if (!node.children || node.children.length === 0) return;

        node.children.forEach(child => {
            if (child.availableOperations.includes(operation)) {
                child.operationState[operation] = state;

                // Recursively apply to descendants
                if (child.isFolder) {
                    this._applyOperationToChildren(child, operation, state);
                }
            }
        });
    }

    _updateParentOperationStates(node, operation) {
        if (!node.parent) return;

        const parent = node.parent;
        if (!parent.availableOperations.includes(operation)) return;

        // Check all siblings with the same operation
        const siblings = parent.children.filter(child =>
            child.availableOperations.includes(operation)
        );

        if (siblings.length === 0) return;

        // Check if all siblings have the same state
        const firstState = siblings[0].operationState[operation] || 'unselected';
        const allSame = siblings.every(sibling =>
            (sibling.operationState[operation] || 'unselected') === firstState
        );

        if (allSame) {
            parent.operationState[operation] = firstState;
        } else {
            // Mixed state - leave as is, UI will show mixed indicator
        }

        // Continue up the tree
        this._updateParentOperationStates(parent, operation);
    }

    loadNodeChildren(node) {
        if (!node.loading) {
            node.loading = true;
            this.render();

            // Simulate API call with timeout
            setTimeout(() => {
                // Generate random children
                const childCount = Math.floor(Math.random() * 5) + 1;
                for (let i = 0; i < childCount; i++) {
                    const isChildFolder = Math.random() > 0.5;
                    const childNode = new TreeNode(
                        `${node.id}-child-${i}`,
                        `${isChildFolder ? 'Folder' : 'File'} ${i}`,
                        {
                            isFolder: isChildFolder,
                            lazyLoad: isChildFolder && Math.random() > 0.5,
                            availableOperations: this.operationTypes
                                .filter(() => Math.random() > 0.2)
                                .map(op => op.code)
                        }
                    );
                    node.addChild(childNode);
                }

                node.loaded = true;
                node.loading = false;
                node.collapsed = false;

                this.render();
            }, 1000);
        }
    }

    exportTreeAsJSON() {
        const jsonData = {
            operations: this.operationTypes,
            tree: this._serializeNode(this.rootNode)
        };

        const jsonString = JSON.stringify(jsonData, null, 2);

        // Display in the textarea
        const jsonOutput = document.querySelector(`#${this.containerId}-json-output`);
        if (jsonOutput) {
            jsonOutput.value = jsonString;
        }

        // Emit export event
        this.emit(TreeAction.EVENTS.TREE.EXPORT, jsonString);

        return jsonString;
    }

    loadTreeFromJSON(jsonData) {
        if (typeof jsonData === 'string') {
            try {
                jsonData = JSON.parse(jsonData);
            } catch (e) {
                console.error('Invalid JSON format', e);
                this.emit(TreeAction.EVENTS.TREE.DATA_LOAD, { success: false, error: e });
                return false;
            }
        }

        // Load operation types if provided
        if (jsonData.operations) {
            this.operationTypes = jsonData.operations;
        }

        // Load tree structure
        if (jsonData.tree) {
            this.rootNode = this._deserializeNode(jsonData.tree);
        }

        this.render();
        
        // Emit load event
        this.emit(TreeAction.EVENTS.TREE.DATA_LOAD, { 
            success: true, 
            operations: this.operationTypes,
            tree: this.rootNode 
        });
        
        return true;
    }

    _serializeNode(node) {
        // Avoid circular references (parent)
        const serialized = {
            id: node.id,
            name: node.name,
            isFolder: node.isFolder,
            level: node.level,
            operationState: { ...node.operationState },
            availableOperations: [...node.availableOperations],
            lazyLoad: node.lazyLoad,
            loaded: node.loaded
        };

        if (node.children && node.children.length > 0) {
            serialized.children = node.children.map(child =>
                this._serializeNode(child)
            );
        }

        return serialized;
    }

    _deserializeNode(data, parent = null) {
        const node = new TreeNode(data.id, data.name, {
            isFolder: data.isFolder,
            level: data.level,
            availableOperations: data.availableOperations,
            lazyLoad: data.lazyLoad,
            initialStates: data.operationState
        });

        node.parent = parent;
        node.loaded = data.loaded;

        if (data.children && data.children.length > 0) {
            data.children.forEach(childData => {
                const childNode = this._deserializeNode(childData, node);
                node.addChild(childNode);
            });
        }

        return node;
    }

    expandToLevel(level) {
        this._expandNodeToLevel(this.rootNode, level);
        this.render();
    }

    _expandNodeToLevel(node, targetLevel) {
        if (node.level >= targetLevel) return;

        if (node.isFolder) {
            node.collapsed = false;

            // Load if needed
            if (!node.loaded && !node.loading) {
                this.loadNodeChildren(node);
            }

            // Recursively expand children
            node.children.forEach(child => {
                this._expandNodeToLevel(child, targetLevel);
            });
        }
    }

    collapseToLevel(level) {
        this._collapseNodeToLevel(this.rootNode, level);
        this.render();
    }

    _collapseNodeToLevel(node, targetLevel) {
        if (node.level >= targetLevel) {
            node.collapsed = true;
        }
        
        if (node.isFolder) {
            node.children.forEach(child => {
                this._collapseNodeToLevel(child, targetLevel);
            });
        }
    }

    addNewOperationType(code, tooltip) {
        // Prevent duplicates
        if (this.operationTypes.some(op => op.code === code)) {
            console.error(`Operation type ${code} already exists`);
            return false;
        }

        this.operationTypes.push({ code, tooltip });
        this.render();
        return true;
    }

    removeOperationType(code) {
        const index = this.operationTypes.findIndex(op => op.code === code);
        if (index !== -1) {
            this.operationTypes.splice(index, 1);

            // Remove this operation from all nodes
            this._removeOperationFromNode(this.rootNode, code);

            this.render();
            return true;
        }
        return false;
    }

    _removeOperationFromNode(node, operationCode) {
        // Remove from available operations
        const index = node.availableOperations.indexOf(operationCode);
        if (index !== -1) {
            node.availableOperations.splice(index, 1);
        }

        // Remove from operations state
        if (operationCode in node.operationState) {
            delete node.operationState[operationCode];
        }

        // Process children
        node.children.forEach(child => {
            this._removeOperationFromNode(child, operationCode);
        });
    }

    /**
     * Public API: Set initial states for a node
     * @param {string} nodeId - ID of the node to update
     * @param {Object} states - Object mapping operation codes to states
     * @returns {boolean} True if node was found and updated
     */
    setNodeInitialStates(nodeId, states) {
        const node = this._findNodeById(this.rootNode, nodeId);
        if (node) {
            node.setInitialStates(states);
            this.render();
            return true;
        }
        return false;
    }

    /**
     * Helper method to find a node by ID
     * @private
     */
    _findNodeById(startNode, nodeId) {
        if (startNode.id === nodeId) return startNode;
        
        for (const child of startNode.children) {
            const found = this._findNodeById(child, nodeId);
            if (found) return found;
        }
        
        return null;
    }

    // Public API methods
    getTreeData() {
        return this._serializeNode(this.rootNode);
    }

    getOperationTypes() {
        return [...this.operationTypes];
    }

    updateOperationTypesList() {
        this.render();
    }

    _addStyles() {
        if (document.getElementById('tree-action-styles')) return;

        const linkElement = document.createElement('link');
        linkElement.id = 'tree-action-styles';
        linkElement.rel = 'stylesheet';
        linkElement.href = 'tree-action.css';
        document.head.appendChild(linkElement);
    }
}
