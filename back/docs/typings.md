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
    new (rootEl: HTMLElement, events: PlayerEvents);
    increasePlayClickCount(): void;
}
```

## Song

```typescript
interface Song {
    id: string;,
    duration: number;
    audioEl: HTMLAudioElement;
}
```

## PlayerEvents

```typescript
interface PlayerEvents {
    onStart: (song: Song, player: Player): void;
    onEnd: (song: Song): void;
    onPause: (song: Song): void;
    onTimeUpdate: (song: Song): void;
}
```