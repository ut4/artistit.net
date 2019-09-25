/*
 * Tässä tiedostossa: window.artistit.featherSvg, window.artistit.FormValidation,
 * window.artistit.validators, window.artistit.AsyncQueue, window.artistit.utils,
 * window.toast.
 */

/* eslint-disable strict */

// artistit.featherSvg /////////////////////////////////////////////////////////
/**
 * @param {string} iconId ks. https://feathericons.com
 * @param {boolean?} filled
 * @returns {string}
 */
window.artistit.featherSvg = function(iconId, filled) {
    return preact.createElement('svg', {className: 'feather' + (!filled ? '' : ' filled')},
        preact.createElement('use', {'xlink:href': window.artistit.staticBaseUrl +
                                                   'feather-sprite.svg#' + iconId})
    );
};

// artistit.FormValidation /////////////////////////////////////////////////////
(function() {
'use strict';
/**
 * @param {Array<[string|HTMLInputElement, string, Function|boolean...]>} configs
 * @param {HTMLElement?} submitButton
 */
function FormValidation(configs, submitButton) {
    var self = this;
    self.checkers = configs.map(function(config) {
        var checker = makeChecker(config);
        checker.el.addEventListener('input', function() {
            self.checkSingle(checker, true);
            self.updateSubmitButton();
        });
        return checker;
    });
    self.submitButton = submitButton || document.getElementById('i-submit');
    self.checkAll();
}
/**
 * @param {boolean} doShowErrors
 * @access public
 */
FormValidation.prototype.checkAll = function(doShowErrors) {
    var self = this;
    self.checkers.forEach(function(checker) {
        self.checkSingle(checker, doShowErrors === true);
    });
    self.updateSubmitButton();
};
/**
 * @access private
 */
FormValidation.prototype.checkSingle = function(checker, doUpdateError) {
    var lastErr = '';
    for (var i = 0; i < checker.validators.length; ++i) {
        var pair = checker.validators[i];
        checker.isValid = pair.checkFn(checker.el);
        lastErr = checker.isValid
            ? ''
            : pair.errorMessage.replace('%s', checker.friendlyInputName);
        if (!checker.isValid) break;
    }
    if (doUpdateError)
        checker.errEl.textContent = lastErr;
};
/**
 * @access private
 */
FormValidation.prototype.updateSubmitButton = function() {
    this.submitButton.disabled = this.checkers.some(function(c) {
        return !c.isValid;
    });
};
function makeChecker(config) {
    var inputElOrId = config[0];
    var friendlyInputName = config[1];
    var el = typeof inputElOrId == 'string'
        ? document.getElementById(inputElOrId)
        : inputElOrId;
    var out = {friendlyInputName: friendlyInputName,
               isValid: config[config.length - 1] === true,
               el: el,
               errEl: el.parentElement.querySelector('.error'),
               validators: []};
    for (var i = 2; i < config.length; ++i) {
        if (typeof config[i] == 'boolean') break;
        out.validators.push({checkFn: config[i][0],
                             errorMessage: config[i][1]});
    }
    return out;
}
//
window.artistit.validators = {
    notEmpty: function() {
        return [function(input) {
            return input.value != '';
        }, '%s vaaditaan'];
    },
    maxLen: function(len) {
        return [function(input) {
            return input.value.length <= len;
        }, '%s tulisi olla max. ' + len + ' merkkiä pitkä'];
    }
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

// artistit.utils //////////////////////////////////////////////////////////////
window.artistit.utils = {
    fillInput: function(value, inputEl) {
        inputEl.value = value;
        var event = document.createEvent('HTMLEvents');
        event.initEvent('input', false, true);
        inputEl.dispatchEvent(event);
    }
};

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