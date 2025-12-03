interface Style {
    name: string;
    file: string;
}

const appState: {
    currentStyle: Style;
    availableStyles: Style[];
} = {
    currentStyle: { name: "Style 1", file: "style-1.css" },
    availableStyles: [
        { name: "Style 1", file: "style-1.css" },
        { name: "Style 2", file: "style-2.css" },
        { name: "Style 3", file: "style-3.css" }
    ]
};

function loadStyle(styleFile: string): void {
   
    const oldLink = document.querySelector('link[rel="stylesheet"]');
    if (oldLink) {
        oldLink.remove();
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = styleFile;
    document.head.appendChild(link);
}

function changeStyle(style: Style): void {
    appState.currentStyle = style;
    loadStyle(style.file);
    console.log(`Style changed to: ${style.name}`);
}

function createStyleSwitcher(): void {
    const footer = document.querySelector('.site-footer .container');

    if (!footer) {
        console.error('Footer not found');
        return;
    }

    const styleSwitcher = document.createElement('div');
    styleSwitcher.className = 'style-switcher';
    styleSwitcher.style.marginTop = '1rem';
    styleSwitcher.style.paddingTop = '1rem';
    styleSwitcher.style.borderTop = '1px solid rgba(255, 255, 255, 0.2)';

    const heading = document.createElement('p');
    heading.textContent = 'Style option:';
    heading.style.marginBottom = '0.5rem';
    styleSwitcher.appendChild(heading);

    const linksContainer = document.createElement('div');
    linksContainer.style.display = 'flex';
    linksContainer.style.gap = '1rem';
    linksContainer.style.justifyContent = 'center';
    linksContainer.style.flexWrap = 'wrap';

    appState.availableStyles.forEach((style) => {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = style.name;
        link.style.color = 'var(--secondary)';
        link.style.textDecoration = 'none';
        link.style.padding = '0.5rem 1rem';
        link.style.border = '1px solid var(--secondary)';
        link.style.borderRadius = '25px';
        link.style.transition = 'all 0.3s ease';

        link.addEventListener('mouseenter', () => {
            link.style.backgroundColor = 'var(--secondary)';
            link.style.color = 'var(--dark)';
        });

        link.addEventListener('mouseleave', () => {
            link.style.backgroundColor = 'transparent';
            link.style.color = 'var(--secondary)';
        });

        link.addEventListener('click', (e) => {
            e.preventDefault();
            changeStyle(style);
        });

        linksContainer.appendChild(link);
    });

    styleSwitcher.appendChild(linksContainer);
    footer.insertBefore(styleSwitcher, footer.firstChild);
}

function init(): void {
    loadStyle(appState.currentStyle.file);

    createStyleSwitcher();

    console.log('App initialized successfully');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}