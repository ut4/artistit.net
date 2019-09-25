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
    isLikedByCurrentUser?: boolean;
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

## Topic

```typescript
interface Topic {
    id: number;
    title: string;
    description: string;
    latestThreads?: Array<Thread>;
}
```

## Thread

```typescript
interface Thread {
    id: number;
    title: string;
    topicId: number;
    createdAt: number;
}
```

## Widget

```typescript
interface Widget {
    type: string;
    data: Object;
}
```

## WidgetDefaults

```typescript
interface WidgetDefaults {
    [widgetName: string]: {icon: string; title: string;};
}
```

# Selainympäristö

## window.artistit

```typescript
interface Artistit {
    ID_LEN: number;
    pageScripts: Array<Function>;
    baseUrl: string;
    staticBaseUrl: string;
    addPageScript: (fn: (props: any) => any, props: any): void;
    // -- Moduulit ----
    FormValidation: FormValidation;
    validators: {[name: string]: [(inputEl: HTMLInputElement): boolean, string];};
    Player: Object;
    PlayerEventsHandler: PlayerEventsHandler;
    utils: {fillInput: (value: string; inputEl: HTMLElement): any;};
    // -- Aliakset ----
    fetch: (url: string, settings?: Object): Promise;
    redirect: (to: string): void;
}
```

## FormValidation

```typescript
interface FormValidation {
    /**
     * Esimerkki:
     *
     * var v = window.artistit.validators;
     * new window.FormValidation([
     *    ['inputin-id', 'Selkonimi', v.notEmpty(), v.maxLen(64), ...],
     *    ...
     * ])
     * -- tai --
     * new window.FormValidation([
     *    [document.querySelector('.pw'), 'Salasana', [function (input) {
     *                                                   return input.value != ''
     *                                                 }, '%s vaaditaan'], ...],
     *    ...
     * ])
     */
    new (configs: Array<[string|HTMLInputElement, string, Function|boolean...]>,
         submitButton?: HTMLElement);
    checkAll(doShowErrors: boolean): void;
}
```

## PlayerEventsHandler

```typescript
interface PlayerEventsHandler {
    new (sessionStorage: Storage);
    /**
     * Promisen palauttaessa true = lisää kuuntelumäärää yhdellä,
     *                       false = älä lisää kuuntelumäärää.
     */
    onStart: (song: ServerApp.Song): Promise<boolean>;
    onEnd: (song: ServerApp.Song): void;
    onPause: (song: ServerApp.Song): void;
    onTimeUpdate: (song: ServerApp.Song): void;
    /**
     * Promisen palauttaessa true = lisää tykkäysmäärää yhdellä,
     *                       false = älä lisää tykkäysmäärää.
     */
    onLike: (song: ServerApp.Song): Promise<boolean>;
}
```

## window.toast

```typescript
interface toast {
    (message: string, level: string): void;
}
```

## Storage

[mozilla docs](https://developer.mozilla.org/en-US/docs/Web/API/Storage)

## ReactWidget

```typescript
interface ReactWidget {
    setEditModeIsOn(isIt: boolean): any;
}
```

## WidgetConfigFormProps

```typescript
interface WidgetConfigFormProps {
    widget: Widget;
    onSave: (newConfig: Object) => any;
    onCancel: () => any;
}
```