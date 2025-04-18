// Sample tree data with lazy loading handlers
const sampleNodeData = {
    "documents": [
        { id: "doc1", name: "Annual Report.pdf", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } },
        { id: "doc2", name: "Meeting Notes.docx", availableOperations: ['R', 'U', 'D'], initialStates: { R: "allowed", U: "allowed" } },
        { id: "doc3", name: "Budget.xlsx", availableOperations: ['R', 'U'], initialStates: { R: "allowed" } }
    ],
    "projects": [
        { 
            id: "project1", 
            name: "Website Redesign", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['C', 'R', 'U', 'D', 'S'], 
            initialStates: { R: "allowed" } 
        },
        { 
            id: "project2", 
            name: "Mobile App", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['R', 'U', 'S'], 
            initialStates: { R: "allowed" } 
        },
        { 
            id: "project3", 
            name: "Database Migration", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['R', 'D', 'S'], 
            initialStates: { R: "allowed" } 
        }
    ],
    "project1": [
        { id: "wireframes", name: "Wireframes.sketch", availableOperations: ['R', 'U'], initialStates: { R: "allowed" } },
        { id: "mockups", name: "Mockups.psd", availableOperations: ['R', 'U'], initialStates: { R: "allowed" } },
        { 
            id: "assets", 
            name: "Assets", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['C', 'R', 'U', 'D'], 
            initialStates: { R: "allowed" } 
        }
    ],
    "project2": [
        { 
            id: "ios", 
            name: "iOS App", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['R', 'U'], 
            initialStates: { R: "allowed" } 
        },
        { 
            id: "android", 
            name: "Android App", 
            isFolder: true, 
            lazyLoad: true, 
            availableOperations: ['R', 'U'], 
            initialStates: { R: "allowed" } 
        }
    ],
    "photos": [
        { id: "photo1", name: "Vacation.jpg", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } },
        { id: "photo2", name: "Family.jpg", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } },
        { id: "photo3", name: "Birthday.jpg", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } }
    ],
    "downloads": [
        { id: "download1", name: "Software.exe", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } },
        { id: "download2", name: "Movie.mp4", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } },
        { id: "download3", name: "Book.pdf", availableOperations: ['R', 'D'], initialStates: { R: "allowed" } }
    ]
};

// Initialize the component
const initTreeAction = () => {
    const treeAction = new TreeAction({
        containerId: 'tree-action-app',
        defaultOperations: [
            { code: 'C', tooltip: 'Create' },
            { code: 'R', tooltip: 'Read' },
            { code: 'U', tooltip: 'Update' },
            { code: 'D', tooltip: 'Delete' },
            { code: 'S', tooltip: 'Share' }
        ],
        initialData: {
            "operationTypes": [
                { code: "C", tooltip: "Create" },
                { code: "R", tooltip: "Read" },
                { code: "U", tooltip: "Update" },
                { code: "D", tooltip: "Delete" },
                { code: "S", tooltip: "Share" }
            ],
            "tree": {
                "id": "root",
                "name": "Root",
                "isFolder": true,
                "level": 0,
                "operations": {
                    "C": "unselected",
                    "R": "allowed",
                    "U": "unselected",
                    "D": "unselected",
                    "S": "unselected"
                },
                "availableOperations": ["C", "R", "U", "D", "S"],
                "lazyLoad": false,
                "children": [
                    {
                        "id": "documents",
                        "name": "Documents",
                        "isFolder": true,
                        "level": 1,
                        "operations": {
                            "C": "unselected",
                            "R": "allowed",
                            "D": "unselected"
                        },
                        "availableOperations": ["C", "R", "D"],
                        "lazyLoad": true,
                        "children": []
                    },
                    {
                        "id": "work",
                        "name": "Work",
                        "isFolder": true,
                        "level": 1,
                        "operations": {
                            "C": "unselected",
                            "R": "allowed",
                            "U": "unselected",
                            "D": "unselected",
                            "S": "unselected"
                        },
                        "availableOperations": ["C", "R", "U", "D", "S"],
                        "lazyLoad": false,
                        "children": [
                            {
                                "id": "projects",
                                "name": "Projects",
                                "isFolder": true,
                                "level": 2,
                                "operations": {
                                    "C": "unselected",
                                    "R": "allowed",
                                    "U": "unselected",
                                    "D": "unselected",
                                    "S": "unselected"
                                },
                                "availableOperations": ["C", "R", "U", "D", "S"],
                                "lazyLoad": true,
                                "children": []
                            },
                            {
                                "id": "reports",
                                "name": "Reports",
                                "isFolder": true,
                                "level": 2,
                                "operations": {
                                    "C": "unselected",
                                    "R": "allowed",
                                    "U": "unselected"
                                },
                                "availableOperations": ["C", "R", "U"],
                                "lazyLoad": true,
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "personal",
                        "name": "Personal",
                        "isFolder": true,
                        "level": 1,
                        "operations": {
                            "R": "allowed",
                            "U": "unselected",
                            "D": "unselected"
                        },
                        "availableOperations": ["R", "U", "D"],
                        "lazyLoad": false,
                        "children": [
                            {
                                "id": "photos",
                                "name": "Photos",
                                "isFolder": true,
                                "level": 2,
                                "operations": {
                                    "R": "allowed",
                                    "D": "unselected"
                                },
                                "availableOperations": ["R", "D"],
                                "lazyLoad": true,
                                "children": []
                            },
                            {
                                "id": "music",
                                "name": "Music",
                                "isFolder": true,
                                "level": 2,
                                "operations": {
                                    "R": "allowed",
                                    "D": "unselected"
                                },
                                "availableOperations": ["R", "D"],
                                "lazyLoad": true,
                                "children": []
                            }
                        ]
                    },
                    {
                        "id": "downloads",
                        "name": "Downloads",
                        "isFolder": true,
                        "level": 1,
                        "operations": {
                            "R": "allowed",
                            "D": "unselected"
                        },
                        "availableOperations": ["R", "D"],
                        "lazyLoad": true,
                        "children": []
                    }
                ]
            }
        }
    });

    // Set up lazy loading handler
    treeAction.tree.setLoadNodeDataHandler((node) => {
        // Simulate API call delay
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(sampleNodeData[node.id] || []);
            }, 500);
        });
    });
};

// Initialize when DOM is loaded or if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTreeAction);
} else {
    initTreeAction();
}
