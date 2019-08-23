# Testien ajaminen

Testit ei tarvitse erillistä main-tiedostoa, vaan qunit osaa ajaa ne suoraan
(katso komento back/package.jsonista).

- Kaikki: `npm test`
- Vain yksi: `npm test -- -f "testin nimi"`

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

## ejs-globaalit

esim. `<div>Hello <%= user.id %></div>`

- user: {id: string;} || {};
- baseUrl: string;
- staticBaseUrl: string;
- featherSvg: (iconId: string) => string;

## Tietoturva

- Ei self-rolled autentikointia, kirjautuminen ainoastaan kolmannen osapuolen palveluilla
- Nginx rejektoi liian suuret uploadit

# Selainympäristö

## globaalit

- artistit: {ID_LEN: number; pageScripts: Array<Function>;};
- toast: (message: string, level: string) => void;

## Mahdollisesti polyfillattava

- [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)