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
    static EVENTS = {
        NODE: {
            COLLAPSE: 'nodeCollapse',
            EXPAND: 'nodeExpand'
        },
        TREE: {
            UPDATE: 'treeUpdate',
            DATA_LOAD: 'dataLoad',
            EXPORT: 'exportData'
        }
    };

    constructor(options = {}) {
        super();

        if (!options.operationHandler) {
            throw new Error('operationHandler is required in TreeAction constructor');
        }

        this.loadingText = options.loadingText || 'Loading data...';

        this.containerId = options.containerId || 'tree-container';
        this.operationTypes = options.operations || [
            { code: 'C', tooltip: 'Create' },
            { code: 'R', tooltip: 'Read' },
            { code: 'U', tooltip: 'Update' },
            { code: 'D', tooltip: 'Delete' },
            { code: 'S', tooltip: 'Share' }
        ];

        this.operationHandler = options.operationHandler;
        this.childrenLoader = options.childrenLoader || null;

        this.rootNode = new TreeNode('root', 'Root', {
            isFolder: true,
            level: 0,
            availableOperations: this.operationTypes.map(op => op.code),
            lazyLoad: false,
            loaded: true
        });

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

        this.render();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID "${this.containerId}" not found.`);
            return;
        }
        container.innerHTML = '';

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

        const levelInput = document.createElement('input');
        levelInput.type = 'number';
        levelInput.min = '0';
        levelInput.value = '0';
        levelInput.className = 'level-input';
        levelInput.placeholder = 'Level';

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

        levelControls.appendChild(levelInput);
        levelControls.appendChild(expandLevelBtn);
        levelControls.appendChild(collapseLevelBtn);
        levelControls.appendChild(expandAllBtn);
        levelControls.appendChild(collapseAllBtn);

        wrapper.appendChild(levelControls);

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

        const toggleElement = document.createElement('span');
        toggleElement.className = 'toggle-indicator';

        if (node.isFolder) {
            toggleElement.textContent = node.collapsed ? '▶' : '▼';
            toggleElement.addEventListener('click', () => this.toggleCollapse(node));
        } else {
            toggleElement.textContent = ' ';
        }

        const iconElement = document.createElement('span');
        iconElement.className = 'node-icon';
        iconElement.textContent = node.isFolder ? '📁' : '📄';

        const nameElement = document.createElement('span');
        nameElement.className = 'node-name';
        nameElement.textContent = node.name;

        const operationsElement = document.createElement('div');
        operationsElement.className = 'node-operations';

        this.operationTypes.forEach(op => {
            if (node.availableOperations.includes(op.code)) {
                const opButton = document.createElement('button');
                opButton.className = 'operation-button';
                opButton.dataset.operation = op.code;
                opButton.title = op.tooltip;
                opButton.textContent = op.code;

                const state = node.operationState[op.code] || 'unselected';
                opButton.classList.add(`state-${state}`);

                if (node.isFolder && node.children.length > 0 && node.hasOperationMixedState(op.code)) {
                    opButton.classList.add('state-mixed');
                }

                opButton.addEventListener('click', () => {
                    this.operationHandler(node, op.code);
                    this.render();
                });

                operationsElement.appendChild(opButton);
            } else {
                const opPlaceholder = document.createElement('span');
                opPlaceholder.className = 'operation-button state-disabled';
                opPlaceholder.textContent = op.code;
                opPlaceholder.title = `${op.tooltip} (Not available)`;
                operationsElement.appendChild(opPlaceholder);
            }
        });

        nodeElement.appendChild(toggleElement);
        nodeElement.appendChild(iconElement);
        nodeElement.appendChild(nameElement);
        nodeElement.appendChild(operationsElement);

        parentElement.appendChild(nodeElement);

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'node-children';
        childrenContainer.style.display = node.collapsed ? 'none' : 'block';

        if (node.isFolder && !node.loaded && !node.collapsed) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading-indicator';
            loadingElement.textContent = this.loadingText;
            childrenContainer.appendChild(loadingElement);

            if (!node.loading) {
                this.loadNodeChildren(node);
            }
        }

        if (!node.collapsed && node.children.length > 0) {
            node.children.forEach(childNode => {
                this._renderNode(childNode, childrenContainer);
            });
        }

        parentElement.appendChild(childrenContainer);
    }

    toggleCollapse(node) {
        if (!node.isFolder) return;

        node.collapsed = !node.collapsed;
        this.emit(node.collapsed ? TreeAction.EVENTS.NODE.COLLAPSE : TreeAction.EVENTS.NODE.EXPAND, node);

        if (!node.collapsed && node.lazyLoad && !node.loaded && !node.loading) {
            this.loadNodeChildren(node);
        } else {
            this.render();
        }
    }

    loadNodeChildren(node) {
        if (!node.loading && node.lazyLoad && !node.loaded) {
            node.loading = true;
            this.render();

            Promise.resolve()
                .then(() => this.childrenLoader ? this.childrenLoader(node) : null)
                .then(() => {
                    node.loaded = true;
                    node.loading = false;
                    this.render();
                    this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
                })
                .catch(error => {
                    console.error('Error loading children:', error);
                    node.loading = false;
                    this.render();
                });
        } else if (node.loaded && !node.collapsed) {
            this.render();
        }
    }

    exportTreeAsJSON() {
        const jsonData = {
            operations: this.operationTypes,
            tree: this._serializeNode(this.rootNode)
        };

        const jsonString = JSON.stringify(jsonData, null, 2);

        const jsonOutput = document.querySelector(`#${this.containerId}-json-output`);
        if (jsonOutput) {
            jsonOutput.value = jsonString;
        }

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

        if (jsonData.operations) {
            this.operationTypes = jsonData.operations;
        }

        if (jsonData.tree) {
            this.rootNode = this._deserializeNode(jsonData.tree);
        }

        this.render();

        this.emit(TreeAction.EVENTS.TREE.DATA_LOAD, {
            success: true,
            operations: this.operationTypes,
            tree: this.rootNode
        });

        return true;
    }

    _serializeNode(node) {
        const serialized = {
            id: node.id,
            name: node.name,
            isFolder: node.isFolder,
            level: node.level,
            operationState: { ...node.operationState },
            availableOperations: [...node.availableOperations],
            lazyLoad: node.lazyLoad,
            loaded: node.loaded,
            collapsed: node.collapsed
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
        node.collapsed = data.collapsed !== undefined ? data.collapsed : true;

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

    _traverseTree(startNode, callback) {
        callback(startNode);
        if (startNode.children) {
            startNode.children.forEach(child => {
                this._traverseTree(child, callback);
            });
        }
    }

    addNewOperationType(code, tooltip) {
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
            this._removeOperationFromNode(this.rootNode, code);
            this.render();
            return true;
        }
        return false;
    }

    _removeOperationFromNode(node, operationCode) {
        const index = node.availableOperations.indexOf(operationCode);
        if (index !== -1) {
            node.availableOperations.splice(index, 1);
        }

        if (operationCode in node.operationState) {
            delete node.operationState[operationCode];
        }

        node.children.forEach(child => {
            this._removeOperationFromNode(child, operationCode);
        });
    }

    setNodeInitialStates(nodeId, states) {
        const node = this._findNodeById(this.rootNode, nodeId);
        if (node) {
            node.setInitialStates(states);
            this.render();
            return true;
        }
        return false;
    }

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

    getTreeData() {
        return this._serializeNode(this.rootNode);
    }

    getOperationTypes() {
        return [...this.operationTypes];
    }

    /**
     * Gets a node by its ID
     * @param {string} nodeId - The ID of the node to find
     * @returns {TreeNode|null} The found node or null if not found
     */
    getNodeById(nodeId) {
        return this._findNodeById(this.rootNode, nodeId);
    }
}
