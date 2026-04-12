const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'src/public/index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const dom = new JSDOM(html);
const document = dom.window.document;

// 1. Dependency Injection
const links = document.querySelectorAll('link[rel="stylesheet"]');
links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('css/') && href !== 'css/message.css') {
        link.remove();
    }
});

const head = document.querySelector('head');
const beerCss = document.createElement('link');
beerCss.href = 'https://cdn.jsdelivr.net/npm/beercss@3.7.10/dist/cdn/beer.min.css';
beerCss.rel = 'stylesheet';
const beerJs = document.createElement('script');
beerJs.type = 'module';
beerJs.src = 'https://cdn.jsdelivr.net/npm/beercss@3.7.10/dist/cdn/beer.min.js';
const colorJs = document.createElement('script');
colorJs.type = 'module';
colorJs.src = 'https://cdn.jsdelivr.net/npm/material-dynamic-colors@1.1.2/dist/cdn/material-dynamic-colors.min.js';

head.appendChild(beerCss);
head.appendChild(beerJs);
head.appendChild(colorJs);

// 2. Layout
const body = document.querySelector('body');
if (body) {
    body.className = 'light';
}

const headerDiv = document.querySelector('div.header');
if (headerDiv) {
    const header = document.createElement('header');
    header.innerHTML = headerDiv.innerHTML;
    header.className = headerDiv.className;
    headerDiv.replaceWith(header);
}

const tabsDiv = document.querySelector('div.tabs');
if (tabsDiv) {
    const nav = document.createElement('nav');
    nav.className = tabsDiv.className;
    Array.from(tabsDiv.children).forEach(child => {
        const a = document.createElement('a');
        a.innerHTML = child.innerHTML;
        a.className = child.className;
        Array.from(child.attributes).forEach(attr => {
            if (attr.name !== 'class') a.setAttribute(attr.name, attr.value);
        });
        nav.appendChild(a);
    });
    tabsDiv.replaceWith(nav);
}

const tabContents = document.querySelectorAll('.tab-content');
tabContents.forEach(content => {
    const article = document.createElement('article');
    article.innerHTML = content.innerHTML;
    article.className = content.className + ' round';
    Array.from(content.attributes).forEach(attr => {
        if (attr.name !== 'class') article.setAttribute(attr.name, attr.value);
    });
    content.replaceWith(article);
});

// 3. Components - Buttons
const buttons = document.querySelectorAll('button');
buttons.forEach(btn => {
    let classes = Array.from(btn.classList);
    let newClasses = [];
    let isPrimary = false;
    let isError = false;
    let isTransparent = false;

    if (classes.includes('btn-primary')) { newClasses.push('primary'); isPrimary = true; }
    if (classes.includes('btn-danger') || classes.includes('btn-warning')) { newClasses.push('error'); isError = true; }
    if (classes.includes('btn-outline') || classes.includes('icon-btn')) { newClasses.push('transparent'); isTransparent = true; }
    
    // Add standard 'button' if no beer class matches
    if (!isPrimary && !isError && !isTransparent && !classes.includes('button')) {
        newClasses.push('button');
    }

    // Retain other custom JS-binding classes
    classes.forEach(c => {
        if (!c.startsWith('btn-') && c !== 'icon-btn' && c !== 'button') {
            newClasses.push(c);
        }
    });

    btn.className = newClasses.join(' ');
});

// Components - Inputs
const textInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="number"]');
textInputs.forEach(input => {
    // If not already in a form-group or specific wrapper, we might not want to aggressively wrap everything 
    // to avoid breaking flex layouts, but let's add basic classes.
    input.classList.add('border');
});

const selects = document.querySelectorAll('select');
selects.forEach(select => {
    select.classList.add('border');
});

// Modals to Dialog
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = modal.innerHTML;
    dialog.className = modal.className;
    Array.from(modal.attributes).forEach(attr => {
        if (attr.name !== 'class') dialog.setAttribute(attr.name, attr.value);
    });
    modal.replaceWith(dialog);
    
    // Update modal-content
    const content = dialog.querySelector('.modal-content');
    if (content) {
        const article = document.createElement('article');
        article.innerHTML = content.innerHTML;
        article.className = content.className;
        content.replaceWith(article);
    }
});

// Fix Data Tables
const tables = document.querySelectorAll('table');
tables.forEach(table => {
    table.classList.add('stripes');
});

fs.writeFileSync(indexPath, dom.serialize());
console.log('Successfully refactored index.html via JSDOM');