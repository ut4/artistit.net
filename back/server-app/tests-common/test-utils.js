const cheerio = require('cheerio');
const {staticBaseUrl} = require('../../config.js');

exports.parseDocumentBody = docHtml => {
    const begin = docHtml.indexOf('<div id="app">');
    const firstElAfterAppEl = '<script src="'+staticBaseUrl+'artistit.js';
    const end = docHtml.indexOf(firstElAfterAppEl);
    return cheerio.load(docHtml.substr(begin, end - begin));
};
