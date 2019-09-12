const cheerio = require('cheerio');

exports.parseDocumentBody = (docHtml) => {
    const begin = docHtml.indexOf('<div id="app">');
    const firstElAfterAppEl = '<div class="toast hidden">';
    const end = docHtml.indexOf(firstElAfterAppEl);
    return cheerio.load(docHtml.substr(begin, end));
};
