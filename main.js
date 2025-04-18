/**
 * TreeAction Component
 * A reusable component for tree structures with operation buttons
 */
class TreeAction {
    /**
     * Create a new TreeAction component
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - ID of the container element
     * @param {Object} options.initialData - Initial tree data (optional)
     * @param {Array} options.defaultOperations - Default operation types (optional)
     */
    constructor(options = {}) {
        // Default options
        const defaults = {
            containerId: 'tree-action-app',
            initialData: null,
            defaultOperations: [
                { code: 'C', tooltip: 'Create' },
                { code: 'R', tooltip: 'Read' },
                { code: 'U', tooltip: 'Update' },
                { code: 'D', tooltip: 'Delete' },
                { code: 'S', tooltip: 'Share' }
            ]
        };
        
        // Merge options with defaults
        this.options = { ...defaults, ...options };
        
        // Initialize operation types
        this.operationTypes = [...this.options.defaultOperations];
        
        // Initialize component
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        // Get container element
        this.container = document.getElementById(this.options.containerId);
        if (!this.container) {
            console.error(`Container element with ID "${this.options.containerId}" not found.`);
            return;
        }
        
        // Create component structure
        this.createComponentStructure();
        
        // Initialize tree
        if (this.options.initialData) {
            this.loadTreeFromJSON(this.options.initialData);
        } else {
            // Create sample tree
            this.createSampleTree();
        }
        
        // Update operation types list
        this.updateOperationTypesList();
        
        // Render the tree
        this.tree.render(this.treeContainer);
        
        // Expand to level 1 by default
        this.tree.expandToLevel(1);
    }
    
    /**
     * Create the component structure
     */
    createComponentStructure() {
        // Create component container
        const componentContainer = document.createElement('div');
        componentContainer.className = 'tree-action__container';
        
        // Create operation types section
        const operationTypes = document.createElement('div');
        operationTypes.className = 'operation-types';
        operationTypes.innerHTML = `
            <div class="operation-type-header">Operation Types:</div>
            <div id="operation-type-list" class="operation-type-list"></div>
            <div class="add-operation-container">
                <input type="text" id="new-operation-input" class="add-operation-input" placeholder="Add new operation (e.g., EX)" maxlength="2">
                <input type="text" id="new-operation-tooltip" class="tooltip-input" placeholder="Tooltip description">
                <button id="add-operation-btn" class="btn">Add Operation</button>
            </div>
        `;
        
        // Create controls section
        const controls = document.createElement('div');
        controls.className = 'controls';
        controls.innerHTML = `
            <span>Expand to level: </span>
            <button class="level-btn" data-level="1">1</button>
            <button class="level-btn" data-level="2">2</button>
            <button class="level-btn" data-level="3">3</button>
            <button class="level-btn" data-level="4">4</button>
            <button class="level-btn" data-level="all">All</button>
        `;
        
        // Create tree container
        this.treeContainer = document.createElement('div');
        this.treeContainer.className = 'tree-action__tree';
        
        // Create JSON controls
        const jsonControls = document.createElement('div');
        jsonControls.className = 'json-controls';
        jsonControls.innerHTML = `
            <button id="export-json" class="btn">Export Tree as JSON</button>
            <button id="download-json" class="btn btn-green">Download JSON</button>
            <div class="file-input-container">
                <button class="btn btn-orange">Load from JSON</button>
                <input type="file" id="load-json" class="file-input" accept=".json">
            </div>
        `;
        
        // Create JSON output
        const jsonOutput = document.createElement('pre');
        jsonOutput.id = 'json-output';
        jsonOutput.className = 'json-output';
        
        // Append all elements to component container
        componentContainer.appendChild(operationTypes);
        componentContainer.appendChild(controls);
        componentContainer.appendChild(this.treeContainer);
        componentContainer.appendChild(jsonControls);
        componentContainer.appendChild(jsonOutput);
        
        // Append component container to main container
        this.container.appendChild(componentContainer);
        
        // Add event listeners
        this.addEventListeners();
    }
    
    /**
     * Add event listeners
     */
    addEventListeners() {
        // Add operation button
        const addOperationBtn = document.getElementById('add-operation-btn');
        if (addOperationBtn) {
            addOperationBtn.addEventListener('click', () => {
                this.addNewOperationType();
            });
        }
        
        // New operation input - enter key
        const newOperationInput = document.getElementById('new-operation-input');
        if (newOperationInput) {
            newOperationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addNewOperationType();
                }
            });
        }
        
        // Level buttons
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const level = btn.dataset.level;
                this.tree.expandToLevel(level);
            });
        });
        
        // Export JSON button
        const exportBtn = document.getElementById('export-json');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.tree.exportTreeAsJSON();
            });
        }
        
        // Download JSON button
        const downloadBtn = document.getElementById('download-json');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.tree.downloadTreeAsJSON();
            });
        }
        
        // Load JSON button
        const loadJsonInput = document.getElementById('load-json');
        if (loadJsonInput) {
            loadJsonInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const jsonData = JSON.parse(event.target.result);
                            this.loadTreeFromJSON(jsonData);
                        } catch (error) {
                            alert('Error loading JSON: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    }
    
    /**
     * Create a sample tree structure
     */
    createSampleTree() {
        // Create root node
        const root = new TreeNode("root", "Root", {
            isFolder: true,
            availableOperations: this.operationTypes.map(op => op.code),
            initialStates: { R: "allowed" }
        });
        root.level = 0;
        
        // First level folders - not lazy loaded
        const documents = root.addChild(new TreeNode("documents", "Documents", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: ['C', 'R', 'D'],
            initialStates: { R: "allowed" }
        }));
        
        const work = root.addChild(new TreeNode("work", "Work", {
            isFolder: true,
            availableOperations: this.operationTypes.map(op => op.code),
            initialStates: { R: "allowed" }
        }));
        
        const personal = root.addChild(new TreeNode("personal", "Personal", {
            isFolder: true,
            availableOperations: ['R', 'U', 'D'],
            initialStates: { R: "allowed" }
        }));
        
        const downloads = root.addChild(new TreeNode("downloads", "Downloads", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: ['R', 'D'],
            initialStates: { R: "allowed" }
        }));
        
        // Second level folders - some are lazy loaded
        const projects = work.addChild(new TreeNode("projects", "Projects", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: this.operationTypes.map(op => op.code),
            initialStates: { R: "allowed" }
        }));
        
        const reports = work.addChild(new TreeNode("reports", "Reports", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: ['C', 'R', 'U'],
            initialStates: { R: "allowed" }
        }));
        
        const photos = personal.addChild(new TreeNode("photos", "Photos", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: ['R', 'D'],
            initialStates: { R: "allowed" }
        }));
        
        const music = personal.addChild(new TreeNode("music", "Music", {
            isFolder: true,
            lazyLoad: true,
            availableOperations: ['R', 'D'],
            initialStates: { R: "allowed" }
        }));
        
        // Initialize tree component
        this.tree = new TreeCheckbox(root, this.operationTypes);
    }
    
    /**
     * Add a new operation type
     */
    addNewOperationType() {
        const input = document.getElementById('new-operation-input');
        const tooltipInput = document.getElementById('new-operation-tooltip');
        if (!input || !tooltipInput) return;
        
        const newOp = input.value.trim().toUpperCase();
        const tooltip = tooltipInput.value.trim();
        
        // Validate input
        if (newOp.length === 0 || newOp.length > 2) {
            alert('Operation type must be 1-2 characters.');
            return;
        }
        
        if (this.operationTypes.some(op => op.code === newOp)) {
            alert('Operation type already exists.');
            return;
        }
        
        if (tooltip.length === 0) {
            alert('Please provide a tooltip description.');
            return;
        }
        
        // Add the new operation type
        this.operationTypes.push({ code: newOp, tooltip: tooltip });
        
        // Update the operation types list
        this.updateOperationTypesList();
        
        // Update all nodes to include the new operation type
        this.tree.addOperationType(newOp);
        
        // Clear the inputs
        input.value = '';
        tooltipInput.value = '';
        
        // Re-render the tree
        this.tree.render(this.treeContainer);
    }
    
    /**
     * Remove an operation type
     * @param {string} opCode - Operation code to remove
     */
    removeOperationType(opCode) {
        // Don't allow removing all operation types
        if (this.operationTypes.length <= 1) {
            alert('Cannot remove the last operation type.');
            return;
        }
        
        // Remove the operation type
        this.operationTypes = this.operationTypes.filter(op => op.code !== opCode);
        
        // Update the operation types list
        this.updateOperationTypesList();
        
        // Update all nodes to remove the operation type
        this.tree.removeOperationType(opCode);
        
        // Re-render the tree
        this.tree.render(this.treeContainer);
    }
    
    /**
     * Update the operation types list in the UI
     */
    updateOperationTypesList() {
        const container = document.getElementById('operation-type-list');
        if (!container) return;
        
        // Clear the container
        container.innerHTML = '';
        
        // Add each operation type
        this.operationTypes.forEach(op => {
            const item = document.createElement('div');
            item.className = 'tree-action__operations-item tree-action__tooltip';
            item.dataset.operation = op.code;
            item.textContent = op.code;
            
            // Add tooltip
            const tooltip = document.createElement('span');
            tooltip.className = 'tree-action__tooltip-text';
            tooltip.textContent = op.tooltip;
            item.appendChild(tooltip);
            
            // Add remove button
            const removeBtn = document.createElement('span');
            removeBtn.className = 'operation-type-remove';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeOperationType(op.code);
            });
            
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
    }
    
    /**
     * Load tree from JSON data
     * @param {Object} jsonData - JSON data to load
     */
    loadTreeFromJSON(jsonData) {
        try {
            // Check if the JSON has operation types
            if (jsonData.operationTypes && Array.isArray(jsonData.operationTypes)) {
                // Update operation types
                this.operationTypes = [...jsonData.operationTypes];
                this.updateOperationTypesList();
            }
            
            // Get the tree data
            const treeData = jsonData.tree || jsonData;
            
            // Create a new tree
            this.tree = new TreeCheckbox(null, this.operationTypes);
            
            // Load the tree data
            this.tree.loadTreeFromJSON(jsonData);
            
            // Show success message
            alert('Tree loaded successfully!');
        } catch (error) {
            console.error('Error loading tree from JSON:', error);
            alert('Error loading tree from JSON: ' + error.message);
        }
    }
    
    /**
     * Get the current tree data as JSON
     * @returns {Object} Tree data as JSON
     */
    getTreeData() {
        return this.tree ? this.tree.root.toJSON() : null;
    }
    
    /**
     * Get the current operation types
     * @returns {Array} Operation types
     */
    getOperationTypes() {
        return [...this.operationTypes];
    }
}

/**
 * TreeNode class
 * Represents a node in the tree structure
 */
class TreeNode {
    /**
     * Create a new TreeNode
     * @param {string} id - Node ID
     * @param {string} name - Node name
     * @param {Object} options - Node options
     */
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        
        // Get operation types from the tree
        const operationCodes = options.operationTypes ? 
            options.operationTypes.map(op => op.code) : 
            (options.availableOperations || []);
        
        // Default options
        const defaultOptions = {
            isFolder: false,
            lazyLoad: false,
            availableOperations: [...operationCodes],
            initialStates: {}
        };
        
        // Merge options with defaults
        const mergedOptions = {...defaultOptions, ...options};
        
        this.isFolder = mergedOptions.isFolder;
        this.lazyLoad = this.isFolder && mergedOptions.lazyLoad; // Only folders can be lazy loaded
        this.availableOperations = mergedOptions.availableOperations;
        
        this.children = [];
        this.parent = null;
        this.collapsed = true; // Start collapsed
        this.loaded = !this.lazyLoad; // If not lazy loaded, mark as loaded
        this.loading = false;
        this.level = 0; // Will be calculated when added to tree
        
        // Initialize operations states
        this.operations = {};
        this.operationsMixed = {};
        
        // Initialize with available operations
        this.availableOperations.forEach(op => {
            this.operations[op] = "unselected";
            this.operationsMixed[op] = false;
        });
        
        // Apply initial states if provided
        Object.keys(mergedOptions.initialStates).forEach(op => {
            if (this.operations.hasOwnProperty(op)) {
                this.operations[op] = mergedOptions.initialStates[op];
            }
        });
    }
    
    /**
     * Add a child node
     * @param {TreeNode} child - Child node to add
     * @returns {TreeNode} The added child node
     */
    addChild(child) {
        this.children.push(child);
        child.parent = this;
        child.level = this.level + 1;
        return child;
    }
    
    /**
     * Check if an operation is available for this node
     * @param {string} operation - Operation code
     * @returns {boolean} True if operation is available
     */
    isOperationAvailable(operation) {
        return this.availableOperations.includes(operation);
    }
    
    /**
     * Convert node to JSON-friendly object
     * @returns {Object} JSON-friendly object
     */
    toJSON() {
        // Create a clean object without circular references
        const jsonObj = {
            id: this.id,
            name: this.name,
            isFolder: this.isFolder,
            level: this.level,
            operations: { ...this.operations },
            availableOperations: [...this.availableOperations],
            lazyLoad: this.lazyLoad,
            children: this.children.map(child => child.toJSON())
        };
        
        return jsonObj;
    }
}

/**
 * TreeCheckbox class
 * Manages the tree structure and operations
 */
class TreeCheckbox {
    /**
     * Create a new TreeCheckbox
     * @param {TreeNode} rootNode - Root node of the tree
     * @param {Array} operationTypes - Operation types
     */
    constructor(rootNode, operationTypes) {
        this.root = rootNode;
        this.operationTypes = operationTypes || [];
        this.nodeCache = new Map(); // Cache DOM nodes to prevent full re-renders
        this.pendingOperations = []; // Track operations that need to be applied after loading
    }
    
    /**
     * Toggle operation state and propagate changes
     * @param {TreeNode} node - Node to toggle
     * @param {string} operation - Operation code
     */
    toggleOperationState(node, operation) {
        // Skip if operation is not available for this node
        if (!node.isOperationAvailable(operation)) return;
        
        // Cycle through states: unselected -> allowed -> denied -> unselected
        const nextState = {
            "unselected": "allowed",
            "allowed": "denied",
            "denied": "unselected"
        };
        
        this.setOperationState(node, operation, nextState[node.operations[operation]]);
    }
    
    /**
     * Set operation state with cascading effect
     * @param {TreeNode} node - Node to update
     * @param {string} operation - Operation code
     * @param {string} state - New state
     */
    setOperationState(node, operation, state) {
        // Skip if operation is not available for this node
        if (!node.isOperationAvailable(operation)) return;
        
        node.operations[operation] = state;
        node.operationsMixed[operation] = false; // Reset mixed state
        
        // Propagate down to children
        this._propagateOperationDown(node, operation);
        
        // Propagate up to parents
        this._propagateOperationUp(node, operation);
        
        // Update UI without full re-render
        this.updateUI();
    }
    
    /**
     * Update children operation based on parent operation state
     * @param {TreeNode} node - Parent node
     * @param {string} operation - Operation code
     */
    _propagateOperationDown(node, operation) {
        node.children.forEach(child => {
            // Only propagate to children that have this operation available
            if (child.isOperationAvailable(operation)) {
                child.operations[operation] = node.operations[operation];
                child.operationsMixed[operation] = false; // Reset mixed state
                this._propagateOperationDown(child, operation);
            }
        });
    }
    
    /**
     * Update parent operation based on children operation states
     * @param {TreeNode} node - Child node
     * @param {string} operation - Operation code
     */
    _propagateOperationUp(node, operation) {
        if (!node.parent) return;
        
        const parent = node.parent;
        // Only consider children that have this operation available
        const relevantChildren = parent.children.filter(c => c.isOperationAvailable(operation));
        
        if (relevantChildren.length === 0) return;
        
        const childStates = relevantChildren.map(c => c.operations[operation]);
        
        // Check if all children have the same state for this operation
        if (childStates.every(s => s === "allowed")) {
            parent.operations[operation] = "allowed";
            parent.operationsMixed[operation] = false;
        } else if (childStates.every(s => s === "denied")) {
            parent.operations[operation] = "denied";
            parent.operationsMixed[operation] = false;
        } else if (childStates.every(s => s === "unselected")) {
            parent.operations[operation] = "unselected";
            parent.operationsMixed[operation] = false;
        } else {
            // Mixed state - parent shows unselected but with mixed indicator
            parent.operations[operation] = "unselected";
            parent.operationsMixed[operation] = true;
        }
        
        this._propagateOperationUp(parent, operation);
    }
    
    /**
     * Toggle folder collapse state
     * @param {TreeNode} node - Node to toggle
     */
    toggleCollapse(node) {
        if (node.isFolder) {
            // If folder is collapsed and not loaded yet, load its children
            if (node.collapsed && node.lazyLoad && !node.loaded) {
                this.loadNodeChildren(node);
            } else {
                node.collapsed = !node.collapsed;
                this.updateUI(); // Just update view, no full re-render
            }
        }
    }
    
    /**
     * Expand tree to a specific level
     * @param {string|number} level - Level to expand to
     */
    expandToLevel(level) {
        // First collapse all nodes
        this._collapseAll(this.root);
        
        // Then expand to the specified level
        if (level === 'all') {
            this._expandAll(this.root);
        } else {
            const maxLevel = parseInt(level);
            this._expandToLevel(this.root, maxLevel);
        }
        
        // Update UI
        this.render(document.querySelector('.tree-action__tree'));
    }
    
    /**
     * Collapse all nodes
     * @param {TreeNode} node - Starting node
     */
    _collapseAll(node) {
        node.collapsed = true;
        node.children.forEach(child => {
            this._collapseAll(child);
        });
    }
    
    /**
     * Expand all nodes
     * @param {TreeNode} node - Starting node
     */
    _expandAll(node) {
        if (node.isFolder) {
            node.collapsed = false;
            
            // If node is lazy loaded and not loaded yet, mark it for loading
            if (node.lazyLoad && !node.loaded) {
                this.loadNodeChildren(node);
            } else {
                node.children.forEach(child => {
                    this._expandAll(child);
                });
            }
        }
    }
    
    /**
     * Expand nodes up to a specific level
     * @param {TreeNode} node - Starting node
     * @param {number} maxLevel - Maximum level to expand to
     */
    _expandToLevel(node, maxLevel) {
        if (node.level < maxLevel && node.isFolder) {
            node.collapsed = false;
            
            // If node is lazy loaded and not loaded yet, mark it for loading
            if (node.lazyLoad && !node.loaded) {
                this.loadNodeChildren(node);
            } else {
                node.children.forEach(child => {
                    this._expandToLevel(child, maxLevel);
                });
            }
        }
    }
    
    /**
     * Simulate loading children for a lazy-loaded node
     * @param {TreeNode} node - Node to load children for
     */
    loadNodeChildren(node) {
        if (!node.loading) {
            node.loading = true;
            
            // Update UI to show loading indicator
            this.updateUI();
            
            // Simulate async loading with setTimeout
            setTimeout(() => {
                // Generate some sample children based on the node's name
                this._generateSampleChildren(node);
                
                node.loaded = true;
                node.loading = false;
                node.collapsed = false;
                
                // Re-render to show the new children
                this.render(document.querySelector('.tree-action__tree'));
                
                // Process any pending operations
                this.processPendingOperations();
            }, 500); // Simulate a delay
        }
    }
    
    /**
     * Process operations that were queued during loading
     */
    processPendingOperations() {
        while (this.pendingOperations.length > 0) {
            const op = this.pendingOperations.shift();
            this.setOperationState(op.node, op.operation, op.state);
        }
    }
    
    /**
     * Generate sample children for lazy-loaded nodes
     * @param {TreeNode} node - Node to generate children for
     */
    _generateSampleChildren(node) {
        // Clear any existing children
        node.children = [];
        
        // Get operation codes
        const operationCodes = this.operationTypes.map(op => op.code);
        
        // Generate different children based on node ID to simulate real data
        if (node.id === "documents") {
            node.addChild(new TreeNode("doc1", "Annual Report.pdf", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("doc2", "Meeting Notes.docx", {
                availableOperations: ['R', 'U', 'D'],
                initialStates: { R: "allowed", U: "allowed" }
            }));
            node.addChild(new TreeNode("doc3", "Budget.xlsx", {
                availableOperations: ['R', 'U'],
                initialStates: { R: "allowed" }
            }));
        } else if (node.id === "projects") {
            const project1 = node.addChild(new TreeNode("project1", "Website Redesign", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: operationCodes,
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("project2", "Mobile App", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['R', 'U', 'S'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("project3", "Database Migration", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['R', 'D', 'S'],
                initialStates: { R: "allowed" }
            }));
        } else if (node.id === "project1") {
            node.addChild(new TreeNode("wireframes", "Wireframes.sketch", {
                availableOperations: ['R', 'U'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("mockups", "Mockups.psd", {
                availableOperations: ['R', 'U'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("assets", "Assets", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['C', 'R', 'U', 'D'],
                initialStates: { R: "allowed" }
            }));
        } else if (node.id === "project2") {
            node.addChild(new TreeNode("ios", "iOS App", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['R', 'U'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("android", "Android App", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['R', 'U'],
                initialStates: { R: "allowed" }
            }));
        } else if (node.id === "photos") {
            node.addChild(new TreeNode("photo1", "Vacation.jpg", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("photo2", "Family.jpg", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("photo3", "Birthday.jpg", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
        } else if (node.id === "downloads") {
            node.addChild(new TreeNode("download1", "Software.exe", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("download2", "Movie.mp4", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode("download3", "Book.pdf", {
                availableOperations: ['R', 'D'],
                initialStates: { R: "allowed" }
            }));
        } else {
            // Generic children for any other node
            node.addChild(new TreeNode(`${node.id}_file1`, "File 1.txt", {
                availableOperations: ['R', 'U', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode(`${node.id}_file2`, "File 2.doc", {
                availableOperations: ['R', 'U', 'D'],
                initialStates: { R: "allowed" }
            }));
            node.addChild(new TreeNode(`${node.id}_subfolder`, "Subfolder", {
                isFolder: true,
                lazyLoad: true,
                availableOperations: ['C', 'R', 'U', 'D'],
                initialStates: { R: "allowed" }
            }));
        }
    }
    
    /**
     * Initial render of the tree
     * @param {HTMLElement} container - Container element
     */
    render(container) {
        if (!container) return;
        
        container.innerHTML = '';
        this.nodeCache.clear();
        this._renderNode(this.root, container);
        this._attachEvents(); // Always rebind after render
    }
    
    /**
     * Update UI based on current state without full re-render
     */
    updateUI() {
        this.nodeCache.forEach((nodeEl, nodeId) => {
            const node = this._findNode(this.root, nodeId);
            if (node) {
                // Update collapse icon
                const collapseIcon = nodeEl.querySelector('.collapse-icon');
                if (collapseIcon && node.isFolder) {
                    if (node.loading) {
                        collapseIcon.innerHTML = '⟳';
                        collapseIcon.style.animation = 'spin 1s linear infinite';
                    } else {
                        collapseIcon.innerHTML = node.collapsed ? '▶' : '▼';
                        collapseIcon.style.animation = '';
                    }
                }
                
                // Update children container visibility
                const childrenContainer = nodeEl.querySelector('.tree-action__children');
                if (childrenContainer) {
                    childrenContainer.style.display = node.collapsed ? 'none' : 'block';
                }
                
                // Update loading indicator
                let loadingIndicator = nodeEl.querySelector('.loading-indicator');
                if (node.loading) {
                    if (!loadingIndicator) {
                        loadingIndicator = document.createElement('div');
                        loadingIndicator.className = 'loading-indicator';
                        loadingIndicator.textContent = 'Loading...';
                        nodeEl.appendChild(loadingIndicator);
                    }
                } else if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // Update operation buttons classes
                const nodeRight = nodeEl.querySelector('.tree-action__node-right');
                if (nodeRight) {
                    // Clear existing operation buttons
                    nodeRight.innerHTML = '';
                    
                    // Add operation buttons for all operation types
                    this.operationTypes.forEach(op => {
                        const btn = document.createElement('div');
                        
                        // Set appropriate class based on availability and state
                        if (!node.isOperationAvailable(op.code)) {
                            btn.className = 'tree-action__operation-btn tree-action__operation-btn--disabled tree-action__tooltip';
                        } else if (node.operationsMixed[op.code]) {
                            btn.className = 'tree-action__operation-btn tree-action__operation-btn--mixed tree-action__tooltip';
                        } else {
                            btn.className = `tree-action__operation-btn tree-action__operation-btn--${node.operations[op.code]} tree-action__tooltip`;
                        }
                        
                        btn.textContent = op.code;
                        btn.dataset.operation = op.code;
                        
                        // Add tooltip
                        const tooltip = document.createElement('span');
                        tooltip.className = 'tree-action__tooltip-text';
                        tooltip.textContent = op.tooltip;
                        btn.appendChild(tooltip);
                        
                        nodeRight.appendChild(btn);
                    });
                }
            }
        });
    }
    
    /**
     * Render a node and its children
     * @param {TreeNode} node - Node to render
     * @param {HTMLElement} container - Container element
     */
    _renderNode(node, container) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'tree-action__node';
        nodeEl.dataset.id = node.id;
        nodeEl.dataset.level = node.level;
        
        // Store in cache for later updates
        this.nodeCache.set(node.id, nodeEl);
        
        const nodeContent = document.createElement('div');
        nodeContent.className = 'tree-action__node-content';
        
        // Left side content (collapse icon, folder/file icon, label)
        const nodeLeft = document.createElement('div');
        nodeLeft.className = 'tree-action__node-left';
        
        // Collapse icon for folders
        const collapseIcon = document.createElement('span');
        collapseIcon.className = 'collapse-icon';
        if (node.isFolder) {
            if (node.loading) {
                collapseIcon.innerHTML = '⟳';
                collapseIcon.style.animation = 'spin 1s linear infinite';
            } else {
                collapseIcon.innerHTML = node.collapsed ? '▶' : '▼';
            }
        } else {
            collapseIcon.innerHTML = '&nbsp;';
        }
        
        // Icon based on type
        const icon = document.createElement('span');
        if (node.isFolder) {
            icon.className = 'folder-icon';
            icon.innerHTML = '📁';
        } else {
            icon.className = 'file-icon';
            icon.innerHTML = '📄';
        }
        
        // Label
        const label = document.createElement('label');
        label.textContent = node.name;
        
        nodeLeft.appendChild(collapseIcon);
        nodeLeft.appendChild(icon);
        nodeLeft.appendChild(label);
        
        // Right side content (operation buttons)
        const nodeRight = document.createElement('div');
        nodeRight.className = 'tree-action__node-right';
        
        // Operation buttons for all operation types
        this.operationTypes.forEach(op => {
            const btn = document.createElement('div');
            
            // Set appropriate class based on availability and state
            if (!node.isOperationAvailable(op.code)) {
                btn.className = 'tree-action__operation-btn tree-action__operation-btn--disabled tree-action__tooltip';
            } else if (node.operationsMixed[op.code]) {
                btn.className = 'tree-action__operation-btn tree-action__operation-btn--mixed tree-action__tooltip';
            } else {
                btn.className = `tree-action__operation-btn tree-action__operation-btn--${node.operations[op.code]} tree-action__tooltip`;
            }
            
            btn.textContent = op.code;
            btn.dataset.operation = op.code;
            
            // Add tooltip
            const tooltip = document.createElement('span');
            tooltip.className = 'tree-action__tooltip-text';
            tooltip.textContent = op.tooltip;
            btn.appendChild(tooltip);
            
            nodeRight.appendChild(btn);
        });
        
        nodeContent.appendChild(nodeLeft);
        nodeContent.appendChild(nodeRight);
        nodeEl.appendChild(nodeContent);
        
        // Loading indicator (if applicable)
        if (node.loading) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'Loading...';
            nodeEl.appendChild(loadingIndicator);
        }
        
        // Children container
        if (node.children.length > 0 || node.isFolder) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-action__children';
            if (node.collapsed) {
                childrenContainer.style.display = 'none';
            }
            
            node.children.forEach(child => {
                this._renderNode(child, childrenContainer);
            });
            
            nodeEl.appendChild(childrenContainer);
        }
        
        container.appendChild(nodeEl);
    }
    
    /**
     * Attach event listeners
     */
    _attachEvents() {
        // Use a single event listener on the container for all tree interactions
        const container = document.querySelector('.tree-action__tree');
        if (!container) return;
        
        // Remove existing event listeners by cloning and replacing
        const oldContainer = container;
        const newContainer = container.cloneNode(false); // shallow clone
        
        // Copy children to new container
        while (oldContainer.firstChild) {
            newContainer.appendChild(oldContainer.firstChild);
        }
        
        // Replace old container with new one
        oldContainer.parentNode.replaceChild(newContainer, oldContainer);
        
        // Add new event listener
        newContainer.addEventListener('click', (e) => {
            // Find closest tree node
            const nodeEl = e.target.closest('.tree-action__node');
            if (!nodeEl) return;
            
            const nodeId = nodeEl.dataset.id;
            const node = this._findNode(this.root, nodeId);
            
            if (!node) return;
            
            // Handle operation button click
            if (e.target.classList.contains('tree-action__operation-btn')) {
                const operation = e.target.dataset.operation;
                // Only toggle if operation is available
                if (node.isOperationAvailable(operation)) {
                    this.toggleOperationState(node, operation);
                }
            }
            
            // Handle collapse icon click
            if (e.target.classList.contains('collapse-icon') && node.isFolder) {
                this.toggleCollapse(node);
            }
        });
    }
    
    /**
     * Find a node by ID
     * @param {TreeNode} node - Starting node
     * @param {string} id - Node ID to find
     * @returns {TreeNode|null} Found node or null
     */
    _findNode(node, id) {
        if (node.id === id) return node;
        
        for (const child of node.children) {
            const found = this._findNode(child, id);
            if (found) return found;
        }
        
        return null;
    }
    
    /**
     * Export tree structure as JSON
     * @returns {string} JSON string
     */
    exportTreeAsJSON() {
        // Get the tree structure as a JSON object
        const treeData = this.root.toJSON();
        
        // Add operation types to the JSON
        const exportData = {
            operationTypes: [...this.operationTypes],
            tree: treeData
        };
        
        // Format the JSON with indentation for readability
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Display in the output area
        const outputEl = document.getElementById('json-output');
        if (outputEl) {
            outputEl.textContent = jsonString;
        }
        
        return jsonString;
    }
    
    /**
     * Download tree structure as JSON file
     */
    downloadTreeAsJSON() {
        // Get the JSON string
        const jsonString = this.exportTreeAsJSON();
        
        // Create a blob with the JSON data
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tree-cruds-export.json';
        
        // Trigger the download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
    
    /**
     * Load tree from JSON data
     * @param {Object} jsonData - JSON data to load
     */
    loadTreeFromJSON(jsonData) {
        try {
            // Check if the JSON has operation types
            if (jsonData.operationTypes && Array.isArray(jsonData.operationTypes)) {
                // Update operation types
                this.operationTypes = [...jsonData.operationTypes];
            }
            
            // Get the tree data
            const treeData = jsonData.tree || jsonData;
            
            // Create a new root node from the JSON data
            this.root = this._createNodeFromJSON(treeData);
            
            // Render the tree
            this.render(document.querySelector('.tree-action__tree'));
            
            // Expand to level 1 by default
            this.expandToLevel(1);
        } catch (error) {
            console.error('Error loading tree from JSON:', error);
            throw error;
        }
    }
    
    /**
     * Create a TreeNode from JSON data
     * @param {Object} jsonData - JSON data
     * @returns {TreeNode} Created node
     */
    _createNodeFromJSON(jsonData) {
        // Create the node with basic properties
        const node = new TreeNode(jsonData.id, jsonData.name, {
            isFolder: jsonData.isFolder,
            lazyLoad: jsonData.lazyLoad,
            availableOperations: jsonData.availableOperations || this.operationTypes.map(op => op.code),
            operationTypes: this.operationTypes
        });
        
        // Set level
        node.level = jsonData.level || 0;
        
        // Set operations states
        if (jsonData.operations) {
            Object.keys(jsonData.operations).forEach(op => {
                if (node.operations.hasOwnProperty(op)) {
                    node.operations[op] = jsonData.operations[op];
                }
            });
        }
        
        // Process children
        if (jsonData.children && Array.isArray(jsonData.children)) {
            jsonData.children.forEach(childData => {
                const childNode = this._createNodeFromJSON(childData);
                node.addChild(childNode);
            });
        }
        
        // Mark as loaded if it has children
        if (jsonData.children && jsonData.children.length > 0) {
            node.loaded = true;
        }
        
        return node;
    }
    
    /**
     * Add a new operation type to all nodes
     * @param {string} opCode - Operation code
     */
    addOperationType(opCode) {
        const addOpToNode = (node) => {
            // Add to operations
            if (!node.operations[opCode]) {
                node.operations[opCode] = "unselected";
            }
            
            // Add to mixed states
            if (!node.operationsMixed[opCode]) {
                node.operationsMixed[opCode] = false;
            }
            
            // Add to available operations if it's a root node
            if (node.level === 0 && !node.availableOperations.includes(opCode)) {
                node.availableOperations.push(opCode);
            }
            
            // Process children
            node.children.forEach(child => {
                addOpToNode(child);
            });
        };
        
        // Start with the root node
        if (this.root) {
            addOpToNode(this.root);
        }
    }
    
    /**
     * Remove an operation type from all nodes
     * @param {string} opCode - Operation code
     */
    removeOperationType(opCode) {
        const removeOpFromNode = (node) => {
            // Remove from operations
            if (node.operations[opCode]) {
                delete node.operations[opCode];
            }
            
            // Remove from mixed states
            if (node.operationsMixed[opCode]) {
                delete node.operationsMixed[opCode];
            }
            
            // Remove from available operations
            node.availableOperations = node.availableOperations.filter(op => op !== opCode);
            
            // Process children
            node.children.forEach(child => {
                removeOpFromNode(child);
            });
        };
        
        // Start with the root node
        if (this.root) {
            removeOpFromNode(this.root);
        }
    }
}