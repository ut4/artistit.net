/**
 * /biisi/uusi/:artistId -sivun js.
 *
 * @param {{maxSongNameLen: number; artistId: string;}} props
 */
function songUploadViewJs(props) {
    var inputs = [document.getElementById('i-name'),
                  document.getElementById('i-file'),
                  document.getElementById('i-genre'),
                  document.getElementById('i-tags')];
    var validator = new window.artistit.FormValidation(inputs);
    validator.addCheckers(inputs[0], 'Nimi',
        validator.notEmpty(),
        validator.maxLen(props.maxSongNameLen));
    validator.addCheckers(inputs[2], 'Genre',
        validator.notEmpty());
    //
    window.handleFormSubmit = function(e) {
        e.preventDefault();
        var status = 0;
        var body = new FormData();
        body.append('name', inputs[0].value);
        body.append('fileData', inputs[1].files[0]);
        body.append('genre', inputs[2].value);
        body.append('tags', inputs[3].value);
        body.append('artistId', props.artistId);
        body.append('sneakySneaky', document.getElementById('i-sneakySneaky').value);
        window.artistit.fetch(window.artistit.baseUrl + 'biisi', {
            method: 'POST',
            credentials: 'same-origin',
            body
        })
        .then(function(res) {
            status = res.status;
            return res.text();
        })
        .then(function(result) {
            if (status == 200 && result.length == window.artistit.ID_LEN)
                window.location.href = `${window.artistit.baseUrl}artisti/${props.artistId}?näytä=biisit`;
            else
                window.toast('Biisin lataus epäonnistui.');
        });
    };
}
