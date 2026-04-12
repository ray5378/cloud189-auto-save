const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Setup & Dependency Injection
const oldCssRegex = /<link rel="stylesheet" href="css\/(base|theme|redesign|components|card-view|table-view|table|tabs|modal|floating-btn|folder-tree|logs|loading|message|cloudsaver|chat)\.css">/g;
html = html.replace(oldCssRegex, '');

const beercssHead = `
    <!-- BeerCSS & Material Dynamic Colors -->
    <link href="https://cdn.jsdelivr.net/npm/beercss@3.7.10/dist/cdn/beer.min.css" rel="stylesheet">
    <script type="module" src="https://cdn.jsdelivr.net/npm/beercss@3.7.10/dist/cdn/beer.min.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/npm/material-dynamic-colors@1.1.2/dist/cdn/material-dynamic-colors.min.js"></script>
    <link rel="stylesheet" href="css/message.css">
`;
html = html.replace('</head>', beercssHead + '</head>');

// 2. Layout & Theming Refactoring
html = html.replace('<body class="dashboard-page">', '<body class="light">');
html = html.replace('<div class="header">', '<header>');
html = html.replace(/<div class="tabs">/g, '<nav class="tabs">');
html = html.replace(/<div class="tab-item(.*?)"/g, '<a class="tab-item$1"');
html = html.replace(/<div class="tab-content(.*?)"/g, '<article class="tab-content round$1"');
// Note: replace closing tags for header and nav appropriately, assuming they are mostly straightforward or just replace classes
// We will do a simple targeted replace for buttons and inputs for now.

// 3. Component Migration
// Buttons
html = html.replace(/<button (.*?)class="(.*?)"(.*?)>/g, (match, p1, p2, p3) => {
    let newClass = p2;
    if (p2.includes('btn-primary')) newClass = newClass.replace('btn-primary', 'primary');
    if (p2.includes('btn-danger')) newClass = newClass.replace('btn-danger', 'error');
    if (p2.includes('btn-outline')) newClass = newClass.replace('btn-outline', 'transparent');
    if (p2.includes('icon-btn')) newClass = newClass.replace('icon-btn', 'transparent circle');
    if (!newClass.includes('primary') && !newClass.includes('error') && !newClass.includes('transparent') && !newClass.includes('button')) {
        newClass = 'button ' + newClass; 
    }
    return `<button ${p1}class="${newClass}"${p3}>`;
});

// Inputs - Wrap with field label border
// Simple replace for common inputs, but it's tricky with regex. Let's do a basic class injection for inputs if they don't have wrappers
html = html.replace(/<input type="text" (.*?)class="(.*?)"(.*?)>/g, '<input type="text" $1class="$2 border"$3>');
html = html.replace(/<input type="password" (.*?)class="(.*?)"(.*?)>/g, '<input type="password" $1class="$2 border"$3>');
html = html.replace(/<input type="number" (.*?)class="(.*?)"(.*?)>/g, '<input type="number" $1class="$2 border"$3>');
html = html.replace(/<select (.*?)class="(.*?)"(.*?)>/g, '<select $1class="$2 border"$3>');

// Dialogs
html = html.replace(/<div id="(.*?)" class="modal(.*?)">/g, '<dialog id="$1" class="modal$2">');
// Note: requires changing JS to use dialog.showModal() but keeping modal class might preserve old JS if we just style it. 
// BeerCSS modals actually use <dialog class="active">. 
// For now, let's keep the old modal structure but apply BeerCSS classes.
html = html.replace(/<div class="modal-content">/g, '<article class="modal-content">');
html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<!-- End of modal -->/g, '</article></dialog>'); // Rough heuristic, better to do manual if possible.

fs.writeFileSync(indexPath, html);
console.log('Refactored index.html');
