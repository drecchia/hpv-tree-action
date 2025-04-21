/**
 * TreeNode Class - Represents a node in the TreeAction component
 */
class TreeNode {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.isFolder = options.isFolder || false;
        this.lazyLoad = options.lazyLoad || false;
        this.isVisible = options.isVisible !== undefined ? options.isVisible : true;
        // If loaded is explicitly set in options use that, otherwise it's the opposite of lazyLoad
        this.loaded = options.loaded !== undefined ? options.loaded : !this.lazyLoad;
        this.collapsed = true;
        this.loading = false;
        this.level = options.level || 0;
        this.children = [];
        this.parent = null;
        this.operationState = {}; // current state of operations
        this.availableOperations = options.availableOperations || []; // available operations for this node

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

    /**
     * Sets the state for a specific operation
     * @param {string} operation - The operation code (e.g. 'R', 'C', 'U', etc.)
     * @param {string} state - The state to set (e.g. 'allowed', 'denied', etc.)
     * @returns {TreeNode} - Returns this instance for method chaining
     */
    setState(operation, state) {
        if (!this.availableOperations.includes(operation)) {
            throw new Error(`Operation '${operation}' is not available for this node`);
        }
        this.operationState[operation] = state;
        return this;
    }

    /**
     * Gets all descendant nodes (children, grandchildren, etc.) as a flat array
     * @returns {TreeNode[]} Array of all descendant nodes
     */
    getDescendantNodes() {
        const allNodes = [];
        
        // Add direct children
        allNodes.push(...this.children);
        
        // Recursively add children of children
        for (const child of this.children) {
            allNodes.push(...child.getDescendantNodes());
        }
        
        return allNodes;
    }

    /**
     * Gets all ancestor nodes (parent, grandparent, etc.) up to root as an array
     * @returns {TreeNode[]} Array of all ancestor nodes from parent to root
     */
    getAscendantNodes() {
        const ancestors = [];
        let currentNode = this.parent;
        
        while (currentNode !== null) {
            ancestors.push(currentNode);
            currentNode = currentNode.parent;
        }
        
        return ancestors;
    }

    /**
     * Finds the nearest ancestor node that has the specified operation available
     * @param {string} operation - The operation code to search for (e.g. 'R', 'C', 'U', etc.)
     * @returns {TreeNode|null} - The nearest ancestor node with the operation, or null if none found
     */
    findNearestParentByOp(operation) {
        return this.getAscendantNodes().find(node => 
            node.availableOperations.includes(operation)
        ) || null;
    }
}
