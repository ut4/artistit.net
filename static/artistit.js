(function() {
//
window.artistit.ID_LEN = 20;
//
function FormValidation(inputs, submitButton) {
    this.inputs = inputs;
    this.submitButton = submitButton || document.getElementById('i-submit');
}
FormValidation.prototype.addChecker = function(el, checkIsValid, errMessage) {
    var self = this;
    if (self.inputs.indexOf(el) < 0) throw new Error('el not found from the input list');
    el.addEventListener('input', function(e) {
        var isValid = checkIsValid(e.target);
        el.nextElementSibling.textContent = isValid ? '' : errMessage;
        self.submitButton.disabled = self.inputs.some(function(el) {
            return el.nextElementSibling.textContent != '';
        });
    });
};
window.artistit.FormValidation = FormValidation;
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