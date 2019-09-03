const config = window.artistitEnvConfig;
config.nodeServer = 'http://localhost:3000/';

const ejsGlobals = {
    user: {},
    baseUrl: config.baseUrl,
    staticBaseUrl: config.staticBaseUrl,
    featherSvg: iconId => '<svg class="feather">' +
        '<use xlink:href="' + config.staticBaseUrl + 'feather-sprite.svg#' +
            iconId + '"/>' +
    '</svg>',
};

/**
 * ks. renderTemplate()
 */
function fetchTemplate(name) {
    return fetch(config.nodeServer + 'template/' + name)
            .then(res => res.text());
}

/**
 * ks. renderIntoDocument()
 */
function renderTemplate(name, data, htmlPrepareFn = html => html) {
    return fetchTemplate(name)
        .then(htmlPrepareFn)
        .then(ejsCode => {
            const clsr = window.ejs.compile(ejsCode, {client: true});
            const includeFn = () => '';
            return clsr(Object.assign({}, ejsGlobals, data), null, includeFn);
        });
}

/**
 * Lukee server-app/$templateName.ejs -tiedoston sisällön backendistä,
 * kääntää/renderöi sen selaimessa, ja appendoi DOMiin.
 *
 * @param {string} templateName esim. artist-index-view
 * @param {Object} data
 * @param {(html: string): string;} htmlPrepareFn = html => html
 */
function renderIntoDocument(templateName, data, htmlPrepareFn = html => html) {
    return renderTemplate(templateName, data, htmlPrepareFn)
        .then(rendered => {
            const el = document.getElementById('render-container-el');
            el.innerHTML = rendered;
            return el;
        });
}

export {renderIntoDocument};
