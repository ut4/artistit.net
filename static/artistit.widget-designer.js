/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner.
 */

/* eslint-disable strict */
(function() {
'use strict';
var featherSvg = function(iconId) {
    return '<svg class="feather">' +
        '<use xlink:href="' + window.artistit.staticBaseUrl + 'feather-sprite.svg#' +
            iconId + '"/>' +
    '</svg>';
};
/**
 * Muuntaa backendissä renderöidyn widgettinäkymän $el dynaamisesti muokattavaksi
 * (/artisti/:artistId?näytä=seinä), tai luo sellaisen (/artisti/uusi).
 */
function WidgetDesigner(el, _templates, widgets) {
    var usePreRenderedEls = el.children.length > 1;
    var me = {rootEl: el};
    me.rootEl.appendChild(makeConfigBtn(function() {
        //
    }));
    var slots = widgets.map(function(_widget, i) {
        return new Slot(usePreRenderedEls ? el.children[i] : null, me);
    });
}
function makeConfigBtn(onClick) {
    var tmp = document.createElement('div');
    tmp.innerHTML = '<button class="icon-button filled" title="Konfiguroi ' +
        'widgettien layoutia">' + featherSvg('layout') + 'Muokkaa layoutia</button>';
    var out = tmp.children[0];
    out.addEventListener('click', onClick);
    return out;
}
/**
 * Wräpper-elementti widgetille.
 */
function Slot(preRenderedWidget, designer) {
    var slotEl = makeSlotEl();
    if (preRenderedWidget) {
        preRenderedWidget.parentNode.insertBefore(slotEl, preRenderedWidget);
        slotEl.appendChild(preRenderedWidget);
    } else {
        designer.rootEl.appendChild(slotEl);
    }
}
function makeSlotEl() {
    var out = document.createElement('div');
    out.className = 'widget-slot';
    out.innerHTML = '<button class="icon-button filled" title="Muokkaa widgettiä"'+
                     ' type="button">' + featherSvg('edit-3') + '</button>';
    out.children[0].addEventListener('click', function() {
        //
    });
    return out;
}
//
window.artistit.WidgetDesigner = WidgetDesigner;
}());