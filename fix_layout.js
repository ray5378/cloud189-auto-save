const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src/public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const fixStyles = `
<style>
/* Layout Fixes for MD3 */
header.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--surface-container-low);
    border-radius: 16px;
    margin: 1rem;
}
.header-title-group h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
.header-subtitle { margin: 0; font-size: 0.875rem; color: var(--on-surface-variant); }
.header-actions { display: flex; align-items: center; gap: 1rem; position: relative; }
.theme-switch { position: relative; }
.theme-dropdown { 
    display: none; 
    position: absolute; 
    top: 120%; 
    right: 0; 
    background: var(--surface-container-high); 
    border-radius: 8px; 
    padding: 0.5rem; 
    z-index: 100;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    min-width: 120px;
}
.theme-dropdown.show { display: block; }
.theme-option { padding: 0.5rem 1rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 4px; color: var(--on-surface); }
.theme-option:hover { background: var(--surface-variant); }

/* App Shell & Tabs */
.app-shell { margin: 0 1rem 1rem 1rem; }
nav.tabs { margin-bottom: 1rem; overflow-x: auto; white-space: nowrap; }
.tab-content { display: none; padding: 1.5rem; }
.tab-content.active { display: block; }

/* Forms & Tables */
.form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-size: 0.875rem; color: var(--on-surface-variant); font-weight: 500; }
.button-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
table { width: 100%; border-collapse: collapse; }
table th, table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--outline-variant); }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 150px; vertical-align: middle; }

/* Modals mapped to BeerCSS Dialogs using custom JS display block */
dialog.modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
    border: none;
    margin: 0;
    padding: 0;
}
dialog.modal[style*="display: block"], 
dialog.modal[style*="display: flex"] {
    display: flex !important;
}
.modal-content {
    background: var(--surface);
    color: var(--on-surface);
    padding: 1.5rem;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 500; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--on-surface-variant); }

/* Utility */
.operation-group { margin-bottom: 1rem; }
</style>
`;

if (!html.includes('<!-- Layout Fixes for MD3 -->')) {
    html = html.replace('</head>', fixStyles + '</head>');
    fs.writeFileSync(indexPath, html);
    console.log('Injected missing structural CSS');
} else {
    console.log('CSS already injected');
}

