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

    /**
     * Set the state for a single operation
     * @param {string} operation - Operation code (e.g. 'C', 'R', 'U', 'D', 'S')
     * @param {string} state - State to set ('allowed', 'denied', 'unselected')
     * @returns {TreeNode} Current instance for chaining
     * @throws {Error} If operation is not available or state is invalid
     */
    setState(operation, state) {
        if (!this.availableOperations.includes(operation)) {
            throw new Error(`Operation ${operation} not available for this node`);
        }
        if (!['allowed', 'denied', 'unselected'].includes(state)) {
            throw new Error(`Invalid state: ${state}. Must be 'allowed', 'denied', or 'unselected'`);
        }
        this.operationState[operation] = state;
        return this;
    }

    addChild(childNode) {
        childNode.level = this.level + 1;
        childNode.parent = this;

        this.children.push(childNode);

        return childNode;
    }

    hasOperationMixedState(operation) {
        if (this.children.length === 0) return false;

        const firstChildState = this.children.find(child => child.availableOperations.includes(operation))?.operationState[operation] || 'unselected';

        return this.children.some(child =>
            child.availableOperations.includes(operation) &&
            (child.operationState[operation] || 'unselected') !== firstChildState
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
            SELECT: 'nodeSelect' // Added for potential future use
        },
        OPERATION: {
            CHANGE: 'operationChange', // Emitted when any operation state changes
            STATE_UPDATE: 'operationStateUpdate', // More granular update (internal use)
            BATCH_UPDATE: 'batchOperationUpdate' // For future batch updates
        },
        TREE: {
            UPDATE: 'treeUpdate', // Emitted when the tree structure changes
            DATA_LOAD: 'dataLoad', // Emitted after loading data
            EXPORT: 'exportData' // Emitted after exporting data
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
            lazyLoad: false,
            loaded: true // Root is always loaded
        });

        this.pendingOperations = []; // For potential future batching

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
        if (!container) {
            console.error(`Container with ID "${this.containerId}" not found.`);
            return;
        }
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
        if (!node.collapsed && node.lazyLoad && !node.loaded && !node.loading) {
            this.loadNodeChildren(node);
        } else {
            // Re-render to reflect collapse/expand state immediately
            this.render();
        }
    }

    /**
     * Static method to handle state changes
     * This is the default logic for how a single node's state changes.
     * It does NOT handle propagation to parents or children.
     * @param {TreeNode} node - Node to update
     * @param {string} operation - Operation code
     * @param {string} newState - New state to set ('unselected', 'allowed', 'denied')
     * @returns {Object} State change info { node, operation, oldState, newState }
     * @throws {Error} If parameters are invalid
     */
    static handleStateChange(node, operation, newState) {
        if (!node || !operation || !['unselected', 'allowed', 'denied'].includes(newState)) {
            throw new Error('Invalid state change parameters');
        }
        if (!node.availableOperations.includes(operation)) {
            console.warn(`Operation ${operation} not available for node ${node.id}. State not changed.`);
            return null; // Indicate no change occurred
        }

        const oldState = node.operationState[operation] || 'unselected';
        if (oldState === newState) {
            return null; // Indicate no change occurred
        }

        node.operationState[operation] = newState;

        return {
            node,
            operation,
            oldState,
            newState
        };
    }

    /**
     * Toggles through operation states for a single node.
     * This method uses the static handleStateChange and then emits an event.
     * Propagation logic should be handled by listeners to the operationChange event.
     */
    toggleOperationState(node, operation) {
        const currentState = node.operationState[operation] || 'unselected';
        let newState;

        switch (currentState) {
            case 'unselected': newState = 'allowed'; break;
            case 'allowed': newState = 'denied'; break;
            case 'denied': newState = 'unselected'; break;
            default: newState = 'unselected';
        }

        const changeInfo = TreeAction.handleStateChange(node, operation, newState);

        if (changeInfo) {
            this.emit(TreeAction.EVENTS.OPERATION.CHANGE, changeInfo);
            // Re-render after state change and event emission
            this.render();
        }
    }

    /**
     * Sets operation state for a single node.
     * This method uses the static handleStateChange and then emits an event.
     * Propagation logic should be handled by listeners to the operationChange event.
     */
    setOperationState(node, operation, state) {
        const changeInfo = TreeAction.handleStateChange(node, operation, state);

        if (changeInfo) {
            this.emit(TreeAction.EVENTS.OPERATION.CHANGE, changeInfo);
            // Re-render after state change and event emission
            this.render();
        }
    }


    /**
     * Helper method to manually propagate state to children.
     * This method is intended to be called by a custom event listener.
     */
    propagateToChildren(node, operation, state) {
        if (!node.children || node.children.length === 0) return;

        node.children.forEach(child => {
            // Use the static handler to change the child's state without emitting
            // a new 'operationChange' event for each child, to avoid infinite loops
            // if the listener also updates parents.
            const changeInfo = TreeAction.handleStateChange(child, operation, state);

            if (changeInfo) {
                // Optionally emit a more granular event for internal updates if needed
                // this.emit(TreeAction.EVENTS.OPERATION.STATE_UPDATE, changeInfo);

                // Recursively apply to descendants
                if (child.isFolder) {
                    this.propagateToChildren(child, operation, state);
                }
            }
        });

        // Re-render once after propagating to all descendants
        this.render();
    }

    /**
     * Helper method to update a single parent's operation state based on its children.
     * This method is intended to be called by a custom event listener.
     */
    _updateParentOperationState(parent, operation) {
        if (!parent || !parent.availableOperations.includes(operation)) return;

        const childrenWithOperation = parent.children.filter(child =>
            child.availableOperations.includes(operation)
        );

        if (childrenWithOperation.length === 0) {
            // If no children have the operation, parent state should probably be unselected
            const changeInfo = TreeAction.handleStateChange(parent, operation, 'unselected');
            if (changeInfo) {
                // this.emit(TreeAction.EVENTS.OPERATION.STATE_UPDATE, changeInfo);
                if (parent.parent) {
                    this._updateParentOperationState(parent.parent, operation);
                }
                this.render(); // Re-render after parent update
            }
            return;
        }

        // Get all child states for this operation
        const childStates = childrenWithOperation.map(child =>
            child.operationState[operation] || 'unselected'
        );

        // Determine the new parent state
        let newParentState;
        const allSame = childStates.every(state => state === childStates[0]);

        if (allSame) {
            newParentState = childStates[0];
        } else {
            // Mixed state - the UI will handle displaying this visually
            // We don't change the underlying state to 'mixed', it remains
            // whatever it was or 'unselected' if not set.
            // If you need to explicitly set a 'mixed' state, you'd need to
            // add it to the allowed states and update the logic.
            // For now, we just don't change the state if it's mixed.
            return; // No state change needed for mixed state in this logic
        }

        // Use the static handler to change the parent's state without emitting
        // a new 'operationChange' event, to avoid infinite loops if the listener
        // also updates children.
        const changeInfo = TreeAction.handleStateChange(parent, operation, newParentState);

        if (changeInfo) {
            // Optionally emit a more granular event for internal updates if needed
            // this.emit(TreeAction.EVENTS.OPERATION.STATE_UPDATE, changeInfo);

            // Continue up the tree if the parent's state changed
            if (parent.parent) {
                this._updateParentOperationState(parent.parent, operation);
            }
            this.render(); // Re-render after parent update
        }
    }


    /**
     * Register a callback for state changes (operationChange event)
     */
    onStateChange(callback) {
        return this.on(TreeAction.EVENTS.OPERATION.CHANGE, callback);
    }

    /**
     * Remove a state change callback
     */
    offStateChange(callback) {
        return this.off(TreeAction.EVENTS.OPERATION.CHANGE, callback);
    }

    /**
     * Simulate loading children for a lazy-loaded node.
     * In a real application, this would involve an API call.
     */
    loadNodeChildren(node) {
        if (!node.loading && node.lazyLoad && !node.loaded) {
            node.loading = true;
            this.render(); // Show loading indicator

            // Simulate API call with timeout
            setTimeout(() => {
                // Generate random children (replace with your actual data loading logic)
                const childCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 children
                for (let i = 0; i < childCount; i++) {
                    const isChildFolder = Math.random() > 0.6; // More files than folders
                    const childNode = new TreeNode(
                        `${node.id}-child-${i}`,
                        `${isChildFolder ? 'Folder' : 'File'} ${i + 1}`,
                        {
                            isFolder: isChildFolder,
                            lazyLoad: isChildFolder && Math.random() > 0.7, // Some child folders are also lazy
                            availableOperations: this.operationTypes
                                .filter(() => Math.random() > 0.1) // Randomly assign operations
                                .map(op => op.code),
                            initialStates: {} // Start with no states set
                        }
                    );
                    node.addChild(childNode);
                }

                node.loaded = true;
                node.loading = false;
                // node.collapsed = false; // Optionally expand after loading

                this.render(); // Re-render with loaded children
                this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode); // Notify tree structure update

            }, 800); // Simulate network delay
        } else if (node.loaded) {
            // If already loaded, just ensure it's not collapsed if expanding
            if (!node.collapsed) {
                this.render();
            }
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
            loaded: node.loaded,
            collapsed: node.collapsed // Include collapsed state in serialization
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
        node.collapsed = data.collapsed !== undefined ? data.collapsed : true; // Default to collapsed if not specified

        if (data.children && data.children.length > 0) {
            data.children.forEach(childData => {
                const childNode = this._deserializeNode(childData, node);
                node.addChild(childNode);
            });
        }

        return node;
    }

    expandToLevel(level) {
        this._traverseTree(this.rootNode, (node) => {
            if (node.level < level && node.isFolder) {
                node.collapsed = false;
                // Load if needed when expanding
                if (node.lazyLoad && !node.loaded && !node.loading) {
                    this.loadNodeChildren(node);
                }
            }
        });
        this.render();
    }

    collapseToLevel(level) {
        this._traverseTree(this.rootNode, (node) => {
            if (node.level >= level && node.isFolder) {
                node.collapsed = true;
            }
        });
        this.render();
    }

    /**
     * Generic tree traversal method
     * @private
     */
    _traverseTree(startNode, callback) {
        callback(startNode);
        if (startNode.children) {
            startNode.children.forEach(child => {
                this._traverseTree(child, callback);
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

        if (startNode.children) {
            for (const child of startNode.children) {
                const found = this._findNodeById(child, nodeId);
                if (found) return found;
            }
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
        // This method seems redundant, render() should be called after changes
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