/*
 * Tässä tiedostossa:
 *
 * Luokka, joka lukee ja konvertoi esim. mp3-tiedostoja käyttäen ffmpeg-
 * komentoriviohjelmaa.
 */

const ffmpeg = require('fluent-ffmpeg');

class SongFormatConverter {
    /**
     * Resamplaa $origFilePath -tiedoston 128kbps mp3-tiedostoksi, ja kirjoittaa
     * sen nimellä $destFilePath.
     *
     * @param {string} origFilePath esim. ../static/songs/-Lkb../my-song.wav
     * @param {string} destFilePath esim. ../static/songs/-Lkb../-Lnx...mp3
     * @param {Object} songOut
     */
    convert(origFilePath, destFilePath, songOut) {
        return new Promise(resolve => {
            ffmpeg(origFilePath)
                .audioCodec('libmp3lame')
                .audioFrequency(44100)
                .audioBitrate('128')
                .on('codecData', info => {
                    songOut.duration = ffmpegDurationToSecs(info.duration);
                })
                .on('error', err => {
                    throw err;
                })
                .on('end', () => {
                    resolve();
                })
                .save(destFilePath);
        });
    }
}

/**
 * @param {string} str esim. '00:03:24.28'
 * @returns {number}
 */
function ffmpegDurationToSecs(str) {
    const [hours, mins, secs] = str.split(':');
    return parseFloat(hours) * 60 * 60 +
           parseFloat(mins) * 60 +
           parseFloat(secs);
}

exports.SongFormatConverter = SongFormatConverter;
