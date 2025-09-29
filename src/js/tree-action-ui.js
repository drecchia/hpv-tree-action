/**
 * TreeActionUI Component - Handles UI rendering and interactions for TreeAction
 */
class TreeActionUI {
    constructor(treeAction, options = {}) {
        this.treeAction = treeAction;
        this.containerId = options.containerId || 'tree-container';
        this.loadingText = options.loadingText || 'Loading data...';
        this.operationsTitle = options.operationsTitle || 'Node / Operations';

        // Component order configuration
        this.componentOrder = options.componentOrder || [
            'header',
            'levelControls',
            'searchControls',
            'treeContainer',
            'legend'
        ];

        // Store references to search elements to avoid recreating event listeners
        this.searchControls = null;
        this.searchInput = null;
        this.searchButton = null;
        this.clearSearchButton = null;
        
        // Text options
        this.searchPlaceholderText = options.searchPlaceholderText || 'Search by node name...';
        this.searchButtonText = options.searchButtonText || 'Search';
        this.clearButtonText = options.clearButtonText || 'Clear';
        this.expandToLevelText = options.expandToLevelText || 'Expand to Level';
        this.collapseToLevelText = options.collapseToLevelText || 'Collapse to Level';
        this.expandAllText = options.expandAllText || 'Expand All';
        this.collapseAllText = options.collapseAllText || 'Collapse All';
        this.levelPlaceholderText = options.levelPlaceholderText || 'Level';
        this.folderIconText = options.folderIconText || '📁';
        this.fileIconText = options.fileIconText || '📄';
        this.collapsedIconText = options.collapsedIconText || '▶';
        this.expandedIconText = options.expandedIconText || '▼';
        this.operationUnavailableText = options.operationUnavailableText || '(Not available)';
        
        // UI component visibility options
        this.showSearchControls = options.showSearchControls ?? true;
        this.showTreeActionHeader = options.showTreeActionHeader ?? true;
        this.showLevelControls = options.showLevelControls ?? true;
        this.showLegend = options.showLegend ?? true;

        // Legend configuration
        this.legend = options.legend || {
            unselected: {
                text: 'Not Selected',
                bg: '#fff',
                border: '#ccc'
            },
            disabled: {
                text: 'Not Available',
                bg: '#eee',
                border: '#ccc'
            }
        };
        
        // UI customization options
        this.maxHeight = options.maxHeight || null;
        
        // Initialize UI
        this.init();
    }

    init() {
        // Ensure container exists
        const container = document.getElementById(this.containerId);
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = this.containerId;
            document.body.appendChild(newContainer);
        }

        // Setup event listeners
        this._setupEventListeners();
        
        // Initial render
        this.render();
    }

    _setupEventListeners() {
        // Listen for tree events
        this.treeAction.on(TreeAction.EVENTS.NODE.COLLAPSE, () => {
            this.render();
        });
        this.treeAction.on(TreeAction.EVENTS.NODE.EXPAND, () => {
            this.render();
        });
        this.treeAction.on(TreeAction.EVENTS.TREE.UPDATE, () => {
            this.render();
        });
        this.treeAction.on(TreeAction.EVENTS.TREE.DATA_LOAD, () => {
            this.render();
        });
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID "${this.containerId}" not found.`);
            return;
        }

        // Store the current scroll position of the tree container
        let scrollTop = 0;
        const currentTreeContainer = container.querySelector('.tree-container');
        if (currentTreeContainer) {
            scrollTop = currentTreeContainer.scrollTop;
        }

        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'tree-action-wrapper';

        // Component creation mapping
        const componentCreators = {
            header: () => this.showTreeActionHeader ? this._createOperationsHeader() : null,
            levelControls: () => this.showLevelControls ? this._createLevelControls() : null,
            searchControls: () => this.showSearchControls ? this._createSearchControls() : null,
            treeContainer: () => {
                const container = document.createElement('div');
                container.className = 'tree-container';
                if (this.maxHeight) {
                    container.style.maxHeight = typeof this.maxHeight === 'number' ? 
                        `${this.maxHeight}px` : this.maxHeight;
                    container.style.overflowY = 'auto';
                }
                this._renderNode(this.treeAction.rootNode, container);
                return container;
            },
            legend: () => this.showLegend ? this._createLegend() : null
        };

        // Add components in specified order
        this.componentOrder.forEach(componentName => {
            const component = componentCreators[componentName]?.();
            if (component) {
                wrapper.appendChild(component);
            }
        });

        container.appendChild(wrapper);

        // Restore the scroll position
        const newTreeContainer = container.querySelector('.tree-container');
        if (newTreeContainer) {
            newTreeContainer.scrollTop = scrollTop;
        }
    }

    _createSearchControls() {
        // Create search controls container if it doesn't exist
        if (!this.searchControls) {
            this.searchControls = document.createElement('div');
            this.searchControls.className = 'search-controls';

            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.className = 'search-input';
            this.searchInput.placeholder = this.searchPlaceholderText;

            this.searchButton = document.createElement('button');
            this.searchButton.textContent = this.searchButtonText;
            this.searchButton.className = 'tree-action-button';

            this.clearSearchButton = document.createElement('button');
            this.clearSearchButton.textContent = this.clearButtonText;
            this.clearSearchButton.className = 'tree-action-button';

            // Add event listeners once
            this.searchButton.addEventListener('click', () => {
                this.treeAction.search(this.searchInput.value);
            });

            this.searchInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    this.treeAction.search(this.searchInput.value);
                }
            });

            this.clearSearchButton.addEventListener('click', () => {
                this.searchInput.value = '';
                this.treeAction.search();
                // this.treeAction.collapseToLevel(0);
            });

            // Assemble the controls
            this.searchControls.appendChild(this.searchInput);
            this.searchControls.appendChild(this.searchButton);
            this.searchControls.appendChild(this.clearSearchButton);
        }

        // Update the search input value in case the search query changed
        if (this.treeAction.currentSearchQuery) {
            this.searchInput.value = this.treeAction.currentSearchQuery;
        }

        return this.searchControls;
    }

    _createOperationsHeader() {
        const header = document.createElement('div');
        header.className = 'tree-action-header';

        const operationsList = document.createElement('div');
        operationsList.className = 'operations-list';

        const titleCell = document.createElement('div');
        titleCell.className = 'operations-title';
        titleCell.textContent = this.operationsTitle;
        operationsList.appendChild(titleCell);

        header.appendChild(operationsList);
        return header;
    }

    _createLegend() {
        const legend = document.createElement('div');
        legend.className = 'action-legend';

        Object.entries(this.legend).forEach(([key, config]) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            
            const color = document.createElement('div');
            color.className = 'legend-color';
            color.style.background = config.bg;
            color.style.borderColor = config.border;
            
            const text = document.createElement('span');
            text.textContent = config.text;
            
            item.appendChild(color);
            item.appendChild(text);
            legend.appendChild(item);
        });

        return legend;
    }

    _createLevelControls() {
        const levelControls = document.createElement('div');
        levelControls.className = 'level-controls';

        const levelInput = document.createElement('input');
        levelInput.type = 'number';
        levelInput.min = '0';
        levelInput.value = '0';
        levelInput.className = 'level-input';
        levelInput.placeholder = this.levelPlaceholderText;

        const expandLevelBtn = document.createElement('button');
        expandLevelBtn.textContent = this.expandToLevelText;
        expandLevelBtn.className = 'tree-action-button';
        expandLevelBtn.addEventListener('click', () => {
            const level = parseInt(levelInput.value, 10);
            if (!isNaN(level) && level >= 0) {
                this.treeAction.expandToLevel(level);
            }
        });

        const collapseLevelBtn = document.createElement('button');
        collapseLevelBtn.textContent = this.collapseToLevelText;
        collapseLevelBtn.className = 'tree-action-button';
        collapseLevelBtn.addEventListener('click', () => {
            const level = parseInt(levelInput.value, 10);
            if (!isNaN(level) && level >= 0) {
                this.treeAction.collapseToLevel(level);
            }
        });

        const expandAllBtn = document.createElement('button');
        expandAllBtn.textContent = this.expandAllText;
        expandAllBtn.className = 'tree-action-button';
        expandAllBtn.addEventListener('click', () => {
            this.treeAction.expandToLevel(Number.MAX_SAFE_INTEGER);
        });

        const collapseAllBtn = document.createElement('button');
        collapseAllBtn.textContent = this.collapseAllText;
        collapseAllBtn.className = 'tree-action-button';
        collapseAllBtn.addEventListener('click', () => {
            this.treeAction.collapseToLevel(0);
        });

        levelControls.appendChild(levelInput);
        levelControls.appendChild(expandLevelBtn);
        levelControls.appendChild(collapseLevelBtn);
        levelControls.appendChild(expandAllBtn);
        levelControls.appendChild(collapseAllBtn);

        return levelControls;
    }

    _renderNode(node, parentElement) {
        if (!node.isVisible) {
            return;
        }

        const nodeElement = document.createElement('div');
        nodeElement.className = 'tree-node';
        nodeElement.dataset.nodeId = node.id;
        nodeElement.style.paddingLeft = `${node.level * 20}px`;

        const toggleElement = document.createElement('span');
        toggleElement.className = 'toggle-indicator';

        if (node.isFolder) {
            toggleElement.textContent = node.collapsed ? this.collapsedIconText : this.expandedIconText;
            toggleElement.addEventListener('click', () => this.treeAction.toggleCollapse(node));
        } else {
            toggleElement.textContent = ' ';
        }

        const iconElement = document.createElement('span');
        iconElement.className = 'node-icon';
        iconElement.textContent = node.isFolder ? this.folderIconText : this.fileIconText;

        const nameElement = document.createElement('span');
        nameElement.className = 'node-name';
        if (node.lazyLoad) {
            nameElement.classList.add('node-name-lazy');
        }

        // Handle search highlighting
        if (this.treeAction.currentSearchQuery) {
            const searchQuery = this.treeAction.currentSearchQuery.toLowerCase();
            const nodeName = node.name;
            const lowerNodeName = nodeName.toLowerCase();
            const matchIndex = lowerNodeName.indexOf(searchQuery);

            if (matchIndex !== -1) {
                // This node has a match
                nameElement.classList.add('match');
                
                // Wrap matching text in span
                const before = nodeName.substring(0, matchIndex);
                const match = nodeName.substring(matchIndex, matchIndex + searchQuery.length);
                const after = nodeName.substring(matchIndex + searchQuery.length);
                
                nameElement.innerHTML = `${before}<span class="match-text">${match}</span>${after}`;
            } else {
                // Check if this node contains matches in its children
                const hasMatchInChildren = node.isFolder && node.children.some(child => 
                    child.isVisible && (
                        child.name.toLowerCase().includes(searchQuery) || 
                        (child.isFolder && child.children.some(grandChild => grandChild.isVisible))
                    )
                );
                
                if (hasMatchInChildren) {
                    nameElement.classList.add('contains-match');
                }
                nameElement.textContent = nodeName;
            }
        } else {
            nameElement.textContent = node.name;
        }

        const operationsElement = document.createElement('div');
        operationsElement.className = 'node-operations';

        this.treeAction.operationTypes.forEach(op => {
            if (node.availableOperations.includes(op.code)) {
                const opButton = document.createElement('button');
                opButton.className = 'operation-button';
                opButton.dataset.operation = op.code;
                opButton.title = op.tooltip;
                opButton.textContent = op.code;

                const state = node.operationState[op.code] || 'unselected';
                opButton.classList.add(`state-${state}`);

                // if (node.isFolder && node.children.length > 0 && node.hasOperationMixedState(op.code)) {
                //     opButton.classList.add('state-mixed');
                // }

                opButton.addEventListener('click', () => {
                    this.treeAction.actionClickHandler(node, op.code);
                    this.render();
                });

                operationsElement.appendChild(opButton);
            } else {
                const opPlaceholder = document.createElement('span');
                opPlaceholder.className = 'operation-button state-disabled';
                opPlaceholder.textContent = op.code;
                opPlaceholder.title = `${op.tooltip} ${this.operationUnavailableText}`;
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

        if (node.isFolder && node.loading && !node.collapsed) {
            const loadingElement = document.createElement('div');
            loadingElement.className = 'loading-indicator';
            loadingElement.textContent = this.loadingText;
            childrenContainer.appendChild(loadingElement);
        }

        if (!node.collapsed && node.children.length > 0) {
            node.children.forEach(childNode => {
                this._renderNode(childNode, childrenContainer);
            });
        }

        parentElement.appendChild(childrenContainer);
    }
}
