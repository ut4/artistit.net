/*
 * Tässä tiedostossa: window.artistit.FormValidation, window.artistit.AsyncQueue,
 * window.toast.
 */

/* eslint-disable strict */

// artistit.FormValidation /////////////////////////////////////////////////////
(function() {
'use strict';
/**
 * @param {Array<HTMLElement>} inputEls
 * @param {HTMLElement?} submitButton
 */
function FormValidation(inputEls, submitButton) {
    this.checkers = new Array(inputEls.length);
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
 * @param {string} friendlyInputName Nimi jolla korvataan virheviestin "%s"
 * @param {[(input: HTMLElement) => boolean, string]} validatorPair ([checkIsValidFn, errMessage])
 * @param {...[(input: HTMLElement) => boolean, string]} lisääValidatorPareja
 * @param {boolean?} isInitiallyValid
 */
FormValidation.prototype.addCheckers = function(el, friendlyInputName) {
    var idx = this.inputEls.indexOf(el);
    if (idx < 0)
        throw new Error('elementtiä ei löytynyt konstruktoriin tarjotusta listasta');
    var self = this;
    self.checkers[idx] = makeChecker(friendlyInputName, arguments);
    //
    el.addEventListener('input', function() {
        self.checkSingle(idx, true);
        self.updateSubmitButton();
    });
};
/**
 * @param {boolean} doShowErrors
 * @access public
 */
FormValidation.prototype.checkAll = function(doShowErrors) {
    var self = this;
    for (var i = 0; i < self.checkers.length; ++i) {
        if (self.checkers[i])
            self.checkSingle(i, doShowErrors === true);
    }
    self.updateSubmitButton();
};
/**
 * @access private
 */
FormValidation.prototype.checkSingle = function(idx, doUpdateError) {
    var self = this;
    var lastErr = '';
    var checker = self.checkers[idx];
    var inputEl = self.inputEls[idx];
    for (var i = 0; i < checker.validators.length; ++i) {
        var pair = checker.validators[i];
        checker.isValid = pair.checkFn(inputEl);
        lastErr = checker.isValid
            ? ''
            : pair.errorMessage.replace('%s', checker.friendlyInputName);
        if (!checker.isValid) break;
    }
    if (doUpdateError)
        self.errEls[idx].textContent = lastErr;
};
/**
 * @access private
 */
FormValidation.prototype.updateSubmitButton = function() {
    this.submitButton.disabled = this.checkers.some(function(c) {
        return !c.isValid;
    });
};
function makeChecker(friendlyInputName, args) {
    var out = {friendlyInputName: friendlyInputName,
               isValid: args[args.length - 1] === true,
               validators: []};
    for (var i = 2; i < args.length; ++i) {
        if (typeof args[i] == 'boolean') break;
        out.validators.push({checkFn: args[i][0], errorMessage: args[i][1]});
    }
    return out;
}
//
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
//
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