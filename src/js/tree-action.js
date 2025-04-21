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
            EXPORT: 'exportData',
            SEARCH_START: 'searchStart',
            SEARCH_COMPLETE: 'searchComplete'
        }
    };

    static ACTIONS = [
        { code: 'C', tooltip: 'Create' },
        { code: 'R', tooltip: 'Read' },
        { code: 'U', tooltip: 'Update' },
        { code: 'D', tooltip: 'Delete' }
    ];

    constructor(options = {}) {
        super();

        if (!options.actionClickHandler) {
            throw new Error('actionClickHandler is required in TreeAction constructor');
        }

        this.operationTypes = options.operations ?? TreeAction.ACTIONS;
        this.currentSearchQuery = null;

        this.actionClickHandler = options.actionClickHandler;
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
    }

    toggleCollapse(node) {
        if (!node.isFolder) return;

        node.collapsed = !node.collapsed;
        this.emit(node.collapsed ? TreeAction.EVENTS.NODE.COLLAPSE : TreeAction.EVENTS.NODE.EXPAND, node);

        if (!node.collapsed && node.lazyLoad && !node.loaded && !node.loading) {
            this.loadNodeChildren(node);
        }

        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
    }

    loadNodeChildren(node) {
        if (!node.loading && node.lazyLoad && !node.loaded) {
            node.loading = true;
            this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);

            // avoid double loading
            node.children = [];

            Promise.resolve()
                .then(() => this.childrenLoader ? this.childrenLoader(node, this.currentSearchQuery) : null)
                .then(() => {
                    if ( !this.currentSearchQuery ) {
                        node.loaded = true;
                    }
                    node.loading = false;
                    this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
                })
                .catch(error => {
                    console.error('Error loading children:', error);
                    node.loading = false;
                    this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
                });
        }
    }

    exportTreeAsJSON() {
        const jsonData = {
            operations: this.operationTypes,
            tree: this._serializeNode(this.rootNode)
        };

        const jsonString = JSON.stringify(jsonData);
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
            collapsed: node.collapsed,
            isVisible: node.isVisible,
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
            loaded: data.loaded,
            initialStates: data.operationState,
            isVisible: data.isVisible,
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
        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
    }

    collapseToLevel(level) {
        this._traverseTree(this.rootNode, (node) => {
            if (node.level >= level && node.isFolder) {
                node.collapsed = true;
            }
        });
        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
    }

    // nodes created during search
    deleteTemporaryNodes() {
        this._traverseTree(this.rootNode, (node) => {
            if (node.isFolder && node.lazyLoad && !node.loaded) {
                node.collapsed = true;
                node.children = [];
            }
        });
        
        // Emit update event
        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
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
        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
        return true;
    }

    removeOperationType(code) {
        const index = this.operationTypes.findIndex(op => op.code === code);
        if (index !== -1) {
            this.operationTypes.splice(index, 1);
            this._removeOperationFromNode(this.rootNode, code);
            this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
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

    getNodeById(nodeId) {
        return this._findNodeById(this.rootNode, nodeId);
    }

    resetNodesVisibility() {
        this._traverseTree(this.rootNode, (node) => {
            node.isVisible = true;
        });
        this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
    }

    markPathAsVisible(node) {
        let current = node;
        while (current) {
            current.isVisible = true;
            current = current.parent;
        }
    }

    markChildrenVisible(node) {
        if (!node.children) return;
        node.children.forEach(child => {
            child.isVisible = true;
            if (child.isFolder) {
                this.markChildrenVisible(child);
            }
        });
    }

    async search(query) {
        if (!query) {
            this.currentSearchQuery = null;
            // back hidden nodes back to life
            this.resetNodesVisibility();
            // clear lazyLoad itens with search query
            this.deleteTemporaryNodes();
            return;
        }

        this.currentSearchQuery = query;
        this.emit(TreeAction.EVENTS.TREE.SEARCH_START);

        // Initially set all nodes as invisible
        this._traverseTree(this.rootNode, (node) => {
            node.isVisible = false;
        });
        
        const loadingPromises = [];
        const loadAndSearch = async (node) => {
            if (node.isFolder && node.lazyLoad && !node.loaded) {
                node.loading = true;
                const promise = Promise.resolve()
                    .then(() => this.childrenLoader ? this.childrenLoader(node, query) : null)
                    .then(() => {
                        node.loading = false;
                    });
                loadingPromises.push(promise);
                await promise;
            }

            const nodeName = node.name.toLowerCase();
            const searchQuery = query.toLowerCase();
            
            if (nodeName.includes(searchQuery)) {
                this.markPathAsVisible(node);
                let current = node;
                while (current.parent) {
                    if (current.parent.isFolder) {
                        current.parent.collapsed = false;
                    }
                    current = current.parent;
                }
                if (node.isFolder) {
                    node.collapsed = false;
                    this.markChildrenVisible(node);
                }
            }

            if (node.isFolder && node.children) {
                await Promise.all(node.children.map(child => loadAndSearch(child)));
            }
        };

        try {
            await loadAndSearch(this.rootNode);
            await Promise.all(loadingPromises);
            this.emit(TreeAction.EVENTS.TREE.SEARCH_COMPLETE);
            this.emit(TreeAction.EVENTS.TREE.UPDATE, this.rootNode);
        } catch (error) {
            console.error('Error during search:', error);
        }
    }
}
