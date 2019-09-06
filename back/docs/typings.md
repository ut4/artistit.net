# ServerAPP

## Artist

```typescript
interface Artist {
    id: string;
    name: string;
    tagline: string;
    coverPhoto: string;
    widgets: string;
    createdAt: number;
    userId: string;
}
```

## File

```typescript
interface File {
    mv: (destFilename: string, cb: (err: Object) => any) => any;
}
```

## Song

```typescript
interface Song {
    id: string;
    name: string;
    genre: string;
    duration: string;
    amountOfPlayClicks: number;
    amountOfLikes: number;
}
```

## User

```typescript
interface User {
    id: string;
}
```

## Db

```typescript
interface Db {
    getPool(): Pool;
}
```

## Pool

[mariadb-connector-nodejs docs](https://github.com/MariaDB/mariadb-connector-nodejs/blob/master/documentation/promise-api.md#poolgetconnection--promise)

# Selainympäristö

## Player

```typescript
interface Player {
    song: Song;
    new (rootEl: HTMLElement, events: PlayerEvents);
}
```

## Song

```typescript
interface Song {
    id: string;
    duration: number;
    audioEl: HTMLAudioElement;
}
```

## PlayerEvents

```typescript
interface PlayerEvents {
    /**
     * Promisen palauttaessa true = lisää kuuntelumäärää yhdellä,
     *                       false = älä lisää kuuntelumäärää.
     */
    onStart: (song: Song, player: Player): Promise<boolean>;
    onEnd: (song: Song, player: Player): void;
    onPause: (song: Song, player: Player): void;
    onTimeUpdate: (song: Song, player: Player): void;
    /**
     * Promisen palauttaessa true = lisää tykkäysmäärää yhdellä,
     *                       false = älä lisää tykkäysmäärää.
     */
    onLike: (song: Song, player: Player): Promise<boolean>;
}
```