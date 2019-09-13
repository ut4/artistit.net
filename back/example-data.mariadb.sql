insert into photos values
("-LkbhF4iOa032wUATTzV", 1);
insert into users values
("-abcdefghijklmnopqrs");
insert into connectedAuthAccounts values
(0, "1234", "-abcdefghijklmnopqrs"); -- 0 = github
insert into genres values
(1, "Ambient");
insert into artists values
("-LkbhE8-_8AZFR1rPgtc", "Artistin nimi", "...", "-LkbhF4iOa032wUATTzV", "[{\"type\":\"info-box\",\"data\":{\"infos\":[{\"title\":\"Jäsenet\",\"text\":\"Foo\"}]}},{\"type\":\"twitter-feed\",\"data\":{\"tid\":123}}]", "1564035762", "-abcdefghijklmnopqrs");
insert into songs values
("-Lkbki8w-8PgWYRje-ta", "Biisin nimi", 27, "-LkbhE8-_8AZFR1rPgtc", 1);
insert into tags values
(1, "Rauhallinen"),
(2, "Keskittyminen");
insert into songTags values
("-Lkbki8w-8PgWYRje-ta", 1),
("-Lkbki8w-8PgWYRje-ta", 2);

--

insert into topics values
(1 , 'Musiikin tekeminen', 'Musiikin tekeminen-alueen kuvaus, todo.'),
(2 , 'Yhteistyökumppanin etsijät', 'Yhteistyökumppanin etsijät-alueen kuvaus, todo.'),
(3 , 'Yleistä keskustelua', 'Yleistä keskustelua-alueen kuvaus, todo.'),
(4 , 'Demot', 'Demot-alueen kuvaus, todo.'),
(5 , 'Kilpailut', 'Kilpailut-alueen kuvaus, todo.'),
(6 , 'Hardware', 'Hardware-alueen kuvaus, todo.'),
(7 , 'Software', 'Software-alueen kuvaus, todo.'),
(8 , 'Osta & Myy', 'Osta & Myy-alueen kuvaus, todo.'),
(9 , 'Hiekkalaatikko', 'Hiekkalaatikko-alueen kuvaus, todo.'),
(10, 'artistit.net', 'artistit.net-alueen kuvaus, todo.');
insert into threads values
(1, 'Mun demo', 1567945260, 0, 4, '-abcdefghijklmnopqrs'),
(2, 'Mun demo2', 1567858860, 0, 4, '-abcdefghijklmnopqrs'),
(3, 'Help 1', 1567772460, 0, 1, '-abcdefghijklmnopqrs');
insert into posts values
(1, 'Mun demo ap', 1567945261, 1, '-abcdefghijklmnopqrs'),
(2, 'Mun demo2 ap', 1567858861, 2, '-abcdefghijklmnopqrs'),
(3, 'Help 1 ap', 1567772461, 3, '-abcdefghijklmnopqrs');