# Nginx-config

```conf
http {
    ...
    server {
        listen       80;
        server_name  domain.com;
        client_max_body_size 20m;
        ...
        location / {
            proxy_pass http://127.0.0.1:3000;                # node-serverin url
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            access_log off;
        }

        location /static {
            root   html;
            index  index.html index.htm;
            access_log off;
        }
        ...
    }
    ...
}
```

# ServerAPP

## Testien ajaminen

Katso koko komento back/package.jsonista.

- Kaikki: `npm test`
- Vain yksi: `npm test -- --filter="testin nimi"`

## ejs-globaalit

esim. `<div>Hello <%= user.id %></div>`

- user: {id: string;} || null;
- baseUrl: string;
- staticBaseUrl: string;
- featherSvg: (iconId: string) => string;

## Tietoturva

- Ei self-rolled autentikointia, kirjautuminen ainoastaan kolmannen osapuolen palveluilla
- Nginx rejektoi liian suuret uploadit

# Selainympäristö

## Testien ajaminen

1. Käynnistä node-serveri "test"-flagillä `node server-app/main.js test`.
2. Avaa file:///.../front/tests/index.html modernilla selaimella

## globaalit

```typescript
interface artistit {
    ID_LEN: number;
    pageScripts: Array<Function>;
    baseUrl: string;
    sessionStorage: Storage;
    addPageScript: (fn: (props: any) => any, props: any): void;
    fetch: (url: string, settings?: Object): Promise;
    redirect: (to: string): void;
}
```

```typescript
interface toast {
    (message: string, level: string): void;
}
```

## Mahdollisesti polyfillattava

- [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)