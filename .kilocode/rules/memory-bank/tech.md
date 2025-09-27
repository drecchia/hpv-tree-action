# Tree Action - Tech

## Technologies Used
- **JavaScript (ES6+)**: Core implementation language
- **CSS3**: Styling with modern features and animations
- **Gulp**: Build system for minification and optimization
- **NPM**: Package management and distribution

## Development Setup
- **Node.js**: Runtime environment
- **Gulp**: Task runner for build processes
- **Development Dependencies**:
  - gulp: ^4.0.2
  - gulp-autoprefixer: ^8.0.0
  - gulp-clean-css: ^4.3.0
  - gulp-concat: ^2.6.1
  - gulp-uglify: ^3.0.2

## Technical Constraints
- **Zero Dependencies**: No external runtime dependencies allowed
- **Modern Browser Support**: IE11+ compatibility required
- **Performance Requirements**: Handle 1000+ nodes efficiently
- **Memory Limits**: < 10MB for 1000 nodes
- **Bundle Size**: Minimize CSS and JS output

## Dependencies
### Runtime Dependencies
- **None**: Pure vanilla JavaScript implementation

### Development Dependencies
- **Gulp**: Build automation and task running
- **gulp-autoprefixer**: CSS vendor prefixing
- **gulp-clean-css**: CSS minification
- **gulp-concat**: File concatenation
- **gulp-uglify**: JavaScript minification

## Tool Usage Patterns
- **Build Process**: `gulp` command runs both JS and CSS tasks
- **Development**: `gulp watch` for continuous building
- **Distribution**: Files output to `dist/` directory
- **NPM**: Published as `hpv-tree-action` package

## Project Structure
```
├── src/                 # Source code
│   ├── js/             # JavaScript modules
│   └── css/            # Stylesheets
├── dist/               # Built distribution files
├── gulp/               # Gulp task definitions
├── docs/               # Documentation
└── examples/           # Usage examples
```

## Build Output
- **dist/js/all.min.js**: Minified JavaScript bundle
- **dist/css/all.css**: Processed CSS with prefixes
- **Main Entry**: TreeAction class exported globally
- **CSS Framework**: BEM methodology with semantic naming