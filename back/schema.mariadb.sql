DROP TABLE IF EXISTS songLikes;
DROP TABLE IF EXISTS songListens;
DROP TABLE IF EXISTS songTags;
DROP TABLE IF EXISTS songMakers;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS genres;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS connectedAuthAccounts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS photos;

CREATE TABLE photos (
    `id` CHAR(20) NOT NULL,
    `type` TINYINT(1) NOT NULL DEFAULT 1, -- 1 = cover, 2 = profiili
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE users (
    `id` CHAR(20) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE connectedAuthAccounts (
    `provider` TINYINT NOT NULL,
    `identity` VARCHAR(128) NOT NULL,
    `userId` CHAR(20) NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES users(`id`),
    PRIMARY KEY (`provider`, `identity`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE artists (
    `id` CHAR(20) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `tagline` VARCHAR(256) DEFAULT NULL,
    `coverPhoto` CHAR(20) DEFAULT NULL,
    `widgets` TEXT NOT NULL,
    `createdAt` INT UNSIGNED NOT NULL,
    `userId` CHAR(20) NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES users(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE genres (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE tags (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `tag` VARCHAR(64) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE songs (
    `id` CHAR(20) NOT NULL,
    `name` VARCHAR(128) NOT NULL,
    `genreId` SMALLINT UNSIGNED NOT NULL,
    `duration` FLOAT NOT NULL,
    FOREIGN KEY (`genreId`) REFERENCES genres(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE songMakers (
    `songId` CHAR(20) NOT NULL,
    `artistId` CHAR(20) NOT NULL,
    FOREIGN KEY (`songId`) REFERENCES songs(`id`),
    FOREIGN KEY (`artistId`) REFERENCES artists(`id`),
    PRIMARY KEY (`songId`, `artistId`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE songTags (
    `songId` CHAR(20) NOT NULL,
    `tagId` SMALLINT UNSIGNED NOT NULL,
    FOREIGN KEY (`songId`) REFERENCES songs(`id`),
    FOREIGN KEY (`tagId`) REFERENCES tags(`id`),
    PRIMARY KEY (`songId`, `tagId`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE songListens (
    `songId` CHAR(20) NOT NULL,
    `userId` CHAR(20) NOT NULL,
    FOREIGN KEY (`songId`) REFERENCES songs(`id`),
    FOREIGN KEY (`userId`) REFERENCES users(`id`),
    PRIMARY KEY (`songId`, `userId`)
) DEFAULT CHARSET = utf8mb4;

CREATE TABLE songLikes (
    `songId` CHAR(20) NOT NULL,
    `userId` CHAR(20) NOT NULL,
    FOREIGN KEY (`songId`) REFERENCES songs(`id`),
    FOREIGN KEY (`userId`) REFERENCES users(`id`),
    PRIMARY KEY (`songId`, `userId`)
) DEFAULT CHARSET = utf8mb4;
