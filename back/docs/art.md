# Nginx-config

```conf
http {
    ...
    server {
        listen       80;
        server_name  domain.com;
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

- user: {id: string;};
- baseUrl: string;
- staticBaseUrl: string;
- featcherSvg: (iconId: string) => string;

# Selainympäristö

## globaalit

- artistit: {ID_LEN: number;};
- toast: (message: string, level: string) => void;