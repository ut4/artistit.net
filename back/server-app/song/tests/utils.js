exports.insertSongs = (tctx, songs) =>
    tctx.getDb().getPool().query(
        'insert into songs values ' + songs.map(_ => '(?,?,?,?,?)').join(','),
        songs.reduce((arr, song) => arr.concat(Object.values(song)), [])
    )
    .then(res => {
        if (res.affectedRows < 1)
            throw new Error('Testibiisin insertointi epäonnistui');
    });

exports.deleteSongs = (tctx, songs) =>
    tctx.getDb().getPool().query(
        'delete from songs where `id` in (' + songs.map(_ => '?').join(',') + ')',
        songs.map(song => song.id)
    )
    .then(res => {
        if (res.affectedRows < 1)
            throw new Error('Testibiisin siivous epäonnistui');
    });
