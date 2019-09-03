/**
 * /artisti/muokkaa/:artistiId -sivun js.
 *
 * @param {{maxArtistNameLen: number; maxTaglineLen: number; artistId: string;}} props
 */
function artistEditViewJs(props) {
    var inputs = [document.getElementById('i-name'),
                  document.getElementById('i-tagline'),
                  document.getElementById('i-widgets')];
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
        window.artistit.fetch(window.artistit.baseUrl + 'artisti', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'id=' + encodeURIComponent(props.artistId) +
                  '&name=' + encodeURIComponent(inputs[0].value) +
                  '&tagline=' + encodeURIComponent(inputs[1].value) +
                  '&widgets=' + encodeURIComponent(inputs[2].value) +
                  '&sneakySneaky=' + encodeURIComponent(
                        document.getElementById('i-sneakySneaky').value)
        })
        .then(function(res) {
            status = res.status;
            return res.text();
        })
        .then(function(numAffectedRows) {
            if (status == 200 && numAffectedRows.length == 1)
                window.location.href = `${window.artistit.baseUrl}artisti/${props.artistId}`;
            else
                window.toast('Tietojen tallennus epäonnistui.');
        });
    };
}
