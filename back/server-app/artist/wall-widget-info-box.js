/*
 * Tässä tiedostossa: isomorfinen react-komponentti, joka renderöi artistisivun
 * infoboksi-widgetin.
 */
const preact = require('preact');
const featherSvg = require('../templating.js').reactFeatherSvg;
const $el = preact.createElement;

/**
 * @param {{infos: Array<{title: string; text: string;}>;}} props
 */
function InfoBox(props) {
    preact.Component.call(this, props);
}
InfoBox.prototype = Object.create(preact.Component.prototype);

/**
 */
InfoBox.prototype.render = function() {
    var self = this;
    return $el('div', null,
        $el('h3', {class: 'icon-h3'}, featherSvg('info'), self.props.title || 'Meistä'),
        $el('div', {class: 'widget-main'},
            $el('ul', null, self.props.infos.map(function(pair) {
                return $el('li', null, pair.title + ': ' + pair.text);
            }))
        )
    );
};

exports.InfoBox = InfoBox;
