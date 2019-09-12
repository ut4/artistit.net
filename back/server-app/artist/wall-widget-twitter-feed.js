/*
 * Tässä tiedostossa: isomorfinen react-komponentti, joka renderöi artistisivun
 * twitter-feed -widgetin.
 */
const preact = require('preact');
const featherSvg = require('../templating.js').reactFeatherSvg;
const $el = preact.createElement;

/**
 * @param {{tid: number;}} props
 */
function TwitterFeed(props) {
    preact.Component.call(this, props);
}
TwitterFeed.prototype = Object.create(preact.Component.prototype);

/**
 */
TwitterFeed.prototype.render = function() {
    return $el('div', null,
        $el('h3', {class: 'icon-h3'}, featherSvg('twitter'),  'Twitter'),
        $el('div', null, {class: 'widget-main'},
            $el('div', null, 'todo ' + this.props.tid)
        )
    );
};

exports.TwitterFeed = TwitterFeed;
