- GET /api/artists/:artistId
    [200 {Artist},
     400|500 {err: string;}]
- POST /api/artists
    []
- PUT /api/artists
    []

- GET /api/auth/github
    - Ohjaa githubin auth-dialogiin

- GET /api/song-metas/trending
    []
- GET /api/song-metas/by-artist/:artistId
    [200 {Array<Song>|[]},
     400|500 {err: string;}]
- GET /api/song-metas/by-tag/:tags
    []
- PUT /api/song-metas/like/:songId
    []
- POST api/song-metas
    []
- PUT /api/song-metas/:songId
    []