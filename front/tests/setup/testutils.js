/**
 * Renderöi $reactCmp:n ja appendoi DOMiin.
 *
 * @param {React.Component} reactCmp
 * @param {Object} props
 */
function renderIntoDocument(reactCmp, props) {
    const el = document.getElementById('render-container-el');
    return preact.render(preact.createElement(reactCmp, props), el);
}

const fillInput = window.artistit.utils.fillInput;

export {renderIntoDocument, fillInput};
