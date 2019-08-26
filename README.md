# Artistit.net

Kuvitteelinen sivusto musiikin tekijöille (mikseri.net, soundcloud.com).

## Erot soundcloudiin

- Hakukoneystävällinen
    - Renderöinti kokonaan backendissä
- Kustomoitava artistisivu
    - Rakennettavissa widgeteistä (Twitter/Face-feed, Youtube-embed, info-laatikko jne.)
- Kokonaan suomenkielinen
- Biisien starraus ei vaadi kirjautumista

## Erot mikseri.netiin

- Ei vaadi käyttäjätunnusta
    - Tunnistautuminen 3rd. palvelun (Face, Twitter, Github etc.) kautta
- Handlaa robotit

## Arkkitehtuuri

```
           |__Selain/fetch()__|
                    |
               HTTP-pyyntö
                    |
           |  Nginx-serveri   |
           |_artistit.net:80__|
                   / \
                /       \
             /             \
          /                   \
jos /static-alkuinen       kaikki muut           |__MariaDB-serveri__|
        |                   proxy-pass         /
        |                       |            /
 tarjoilu suoraan               |       käyttää
     levyltä                    |         /
        .                       |       /
                  | ServerAPP nodejs -serveri |
                  |_127.0.0.1:3000____________|
                                |
                                |
                    vastauksena html:ää/tekstiä
```

Lisenssi

MIT