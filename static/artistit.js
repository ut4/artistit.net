/*
 * Tässä tiedostossa: window.artistit.FormValidation, window.artistit.AsyncQueue,
 * window.toast.
 */

/* eslint-disable strict */
(function() {
'use strict';
window.artistit.ID_LEN = 20;
}());

// artistit.FormValidation /////////////////////////////////////////////////////
(function() {
'use strict';
/**
 * @param {Array<HTMLElement>} inputEls
 * @param {HTMLElement?} submitButton
 */
function FormValidation(inputEls, submitButton) {
    this.inputEls = inputEls;
    this.errEls = inputEls.map(function(el) {
        return el.parentElement.querySelector('.error');
    });
    this.submitButton = submitButton || document.getElementById('i-submit');
}
/**
 * Esimerkki: addCheckers(document.querySelector('.foo'), 'Nimi',
 *     v.notEmpty(),
 *     v.maxLen(64)
 * )
 * -- tai --
 * addCheckers(document.querySelector('.foo'), 'Nimi', [function (input) {
 *     return input.value != ''
 * }, '%s vaaditaan'], [function (input) {
 *     return input.value.length <= 128
 * }, '%s tulisi olla max. 128 merkkiä pitkä'])
 *
 * @param {HTMLElement} el Validoitava input-elementti
 * @param {string} inputName Nimi jolla korvataan virheviestin "%s"
 * @param {[(input: HTMLElement) => boolean, string]} validatorPair ([checkIsValidFn, errMessage])
 * @param {...[(input: HTMLElement) => boolean, string]} lisääValidatorPareja
 */
FormValidation.prototype.addCheckers = function(el, inputName) {
    var i = this.inputEls.indexOf(el);
    if (i < 0)
        throw new Error('elementtiä ei löytynyt konstruktoriin tarjotusta listasta');
    var self = this;
    var args = arguments;
    el.addEventListener('input', function(e) {
        for (var i2 = 2; i2 < args.length; ++i2) {
            var checkIsValid = args[i2][0];
            var errMessage = args[i2][1];
            var isValid = checkIsValid(e.target);
            self.errEls[i].textContent = isValid
                ? ''
                : errMessage.replace('%s', inputName);
            self.submitButton.disabled = self.inputEls.some(function(_el, i3) {
                return self.errEls[i3].textContent != '';
            });
            if (!isValid) break;
        }
    });
};
FormValidation.prototype.notEmpty = function() {
    return [function(input) {
        return input.value != '';
    }, '%s vaaditaan'];
};
FormValidation.prototype.maxLen = function(len) {
    return [function(input) {
        return input.value.length <= len;
    }, '%s tulisi olla max. '+len+' merkkiä pitkä'];
};
window.artistit.FormValidation = FormValidation;
}());

// artistit.AsyncQueue /////////////////////////////////////////////////////////
(function() {
    'use strict';
    function AsyncQueue() {
        this.queue = [];
        this.queueIsProcessing = false;
    }
    /**
     * Lisää $fn:n taskijonoon, ja aloittaa jonon ajon mikäli se ei jo käynnissä.
     */
    AsyncQueue.prototype.addTask = function(fn) {
        var self = this;
        self.queue.push(fn);
        if (!self.queueIsProcessing) {
            self.queueIsProcessing = true;
            self.doOldestTask();
        }
    };
    /**
     * Käynnistää taskijonofunktioiden ajon yksi kerrallaan vanhimmasta uusim-
     * paan niin kauan, kunnes jono on tyhjä.
     */
    AsyncQueue.prototype.doOldestTask = function() {
        var self = this;
        self.queue[0](function() {
            self.queue.shift();
            self.queueIsProcessing = self.queue.length > 0;
            if (self.queueIsProcessing) self.doOldestTask();
        });
    };
    window.artistit.AsyncQueue = AsyncQueue;
}());

// window.toast ////////////////////////////////////////////////////////////////
(function() {
'use strict';
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