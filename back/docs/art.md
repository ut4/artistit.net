# Nginx-config

```conf
http {
    ...
    server {
        listen               443 ssl;
        server_name          domain.com;
        ssl_certificate      cert.pem; # samassa kansiossa nginx.conf:n kanssa
        ssl_certificate_key  key.pem;
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

## Globaalit

ks. [typings.md#Selainympäristö](typing.md#Selainympäristö)

## Testien ajaminen

Avaa file:///.../front/tests/index.html modernilla selaimella.

## Mahdollisesti polyfillattava

- [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)