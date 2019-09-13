/**
 * /artisti/uusi -sivun js.
 *
 * @param {{maxArtistNameLen: number; maxTaglineLen: number; userId: string;}} props
 */
function artistCreateViewJs(props) {
    var inputs = [document.getElementById('i-name'),
                  document.getElementById('i-tagline')];
    //
    var widgetDesigner = null;
    preact.render(preact.createElement(window.artistit.WidgetDesigner, {
        widgets: null,
        ref: function(instance) {
            widgetDesigner = instance;
            props.widgetDesigner = widgetDesigner;
        }
    }), document.getElementById('widgets-designer-app'));
    //
    var validator = new window.artistit.FormValidation(inputs);
    validator.addCheckers(inputs[0], 'Nimi',
        validator.notEmpty(),
        validator.maxLen(props.maxArtistNameLen));
    validator.addCheckers(inputs[1], 'Tagline',
        validator.maxLen(props.maxTaglineLen));
    //
    window.handleFormSubmit = function(e) {
        e.preventDefault();
        var status = 0;
        return window.artistit.fetch(window.artistit.baseUrl + 'artisti', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'name=' + encodeURIComponent(inputs[0].value) +
                  '&tagline=' + encodeURIComponent(inputs[1].value) +
                  '&widgets=' + encodeURIComponent(widgetDesigner.getWidgetsAsJson()) +
                  '&userId=' + encodeURIComponent(props.userId) +
                  '&sneakySneaky=' + encodeURIComponent(
                        document.getElementById('i-sneakySneaky').value)
        })
        .then(function(res) {
            status = res.status;
            return res.text();
        })
        .then(function(insertId) {
            if (status == 200 && insertId.length == window.artistit.ID_LEN)
                window.artistit.redirect('artisti/' + insertId);
            else
                window.toast('Artistin luonti epäonnistui.');
        });
    };
}
