# ServerAPP

## Artist

```typescript
interface Artist {
    id: string;
    name: string;
    tagLine: string;
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
}
```

## User

```typescript
interface User {
    id: string;
}
```