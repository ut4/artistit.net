(function() {
//
window.artistit = {
    ID_LEN: 20
};
}());

(function() {
var el = document.querySelector('.toast');
/**
 * @param {string} message
 * @param {string} level 'error'|'message'
 */
window.toast = function (message, level) {
    el.classList.add(level);
    el.classList.remove('hidden');
    el.textContent = message;
};
}());