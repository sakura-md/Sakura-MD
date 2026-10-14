/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/

import config from '../../config.js'

import {
    ApiError,
    sakuraRequest,
    downloadBuffer,
    collectUrls,
    firstString,
    formatBytes,
    truncate
} from '../../lib/api.js'

import {
    sendChoiceButtons,
    sendChoiceList
} from '../../lib/wa.js'

import {
    getStore,
    randomToken
} from '../../lib/cache.js'

import {
    checkCooldown,
    acquireLock,
    releaseLock
} from '../../lib/cooldown.js'

import {
    isSameJid
} from '../../lib/myfunc.js'

import {
    spawn
} from 'node:child_process'

import {
    mkdtemp,
    writeFile,
    readFile,
    stat,
    rm
} from 'node:fs/promises'

import {
    tmpdir
} from 'node:os'

import {
    join
} from 'node:path'

import {
    sendInapp
} from '../../lib/inapp.js'

import {
    ytmp4
} from '../../lib/scrape/youtube.js'


// ╔══════════════════════════════════════════════════════════╗
// ║ API KEY SakuraApis                                      ║
// ╚══════════════════════════════════════════════════════════╝

const API_KEY =
    'haidarapis-a0012a7302574649be2391772075d154'

const BASE_URL =
    'https://api.haidarxd.my.id'

const sakura = (
    endpoint,
    params = {},
    opts = {}
) =>
    sakuraRequest(
        endpoint,
        params,
        {
            apikey: API_KEY,
            baseUrl: BASE_URL,
            ...opts
        }
    )


// Endpoint SakuraApis
const ENDPOINT =
    '/api/v1/downloader/savefrom'

const MB =
    1024 * 1024


// ============================================================
// SESSION PILIHAN FORMAT / KUALITAS
// ============================================================

const sessions =
    getStore(
        'youtube-choice',
        15 * 60 * 1000,
        200
    )


// ============================================================
// FFMPEG
// ============================================================

const FFMPEG =
    process.env.FFMPEG_PATH || 'ffmpeg'


// ============================================================
// FFMPEG VIDEO
// ============================================================

async function runFFmpeg(
    inputPath,
    outputPath
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {

            const args = [
                '-hide_banner',
                '-loglevel',
                'error',

                '-y',

                '-i',
                inputPath,

                '-map',
                '0:v:0',

                '-map',
                '0:a:0?',

                '-c:v',
                'libx264',

                '-preset',
                'veryfast',

                '-crf',
                '23',

                '-pix_fmt',
                'yuv420p',

                '-c:a',
                'aac',

                '-b:a',
                '128k',

                '-movflags',
                '+faststart',

                outputPath
            ]

            const child =
                spawn(
                    FFMPEG,
                    args,
                    {
                        stdio: [
                            'ignore',
                            'ignore',
                            'pipe'
                        ]
                    }
                )

            let stderr = ''

            child.stderr.on(
                'data',
                data => {
                    stderr +=
                        data.toString()
                }
            )

            child.on(
                'error',
                error => {

                    if (
                        error.code ===
                        'ENOENT'
                    ) {
                        reject(
                            new Error(
                                'FFmpeg tidak ditemukan. Install FFmpeg atau set FFMPEG_PATH'
                            )
                        )

                        return
                    }

                    reject(
                        error
                    )
                }
            )

            child.on(
                'close',
                code => {

                    if (
                        code === 0
                    ) {
                        resolve()
                        return
                    }

                    reject(
                        new Error(
                            `FFmpeg gagal memproses video (exit code ${code})\n${stderr.slice(-2000)}`
                        )
                    )
                }
            )
        }
    )
}


// ============================================================
// CONVERT VIDEO
// ============================================================

async function convertVideo(
    buffer
) {
    const folder =
        await mkdtemp(
            join(
                tmpdir(),
                'sakura-ytdl-'
            )
        )

    const inputPath =
        join(
            folder,
            'input'
        )

    const outputPath =
        join(
            folder,
            'output.mp4'
        )

    try {

        await writeFile(
            inputPath,
            buffer
        )

        await runFFmpeg(
            inputPath,
            outputPath
        )

        const outputBuffer =
            await readFile(
                outputPath
            )

        const outputStat =
            await stat(
                outputPath
            )

        if (
            outputStat.size <
            10 * 1024
        ) {
            throw new Error(
                'Hasil video terlalu kecil'
            )
        }

        return {
            buffer:
                outputBuffer,

            size:
                outputStat.size,

            mime:
                'video/mp4',

            ext:
                'mp4'
        }

    } finally {

        await rm(
            folder,
            {
                recursive:
                    true,

                force:
                    true
            }
        ).catch(
            () => {}
        )
    }
}


// ============================================================
// FFMPEG AUDIO → MP3
// ============================================================

async function runFFmpegAudio(
    inputPath,
    outputPath
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {

            const args = [
                '-hide_banner',
                '-loglevel',
                'error',

                '-y',

                '-i',
                inputPath,

                '-vn',

                '-c:a',
                'libmp3lame',

                '-b:a',
                '128k',

                '-map_metadata',
                '-1',

                outputPath
            ]

            const child =
                spawn(
                    FFMPEG,
                    args,
                    {
                        stdio: [
                            'ignore',
                            'ignore',
                            'pipe'
                        ]
                    }
                )

            let stderr = ''

            child.stderr.on(
                'data',
                data => {
                    stderr +=
                        data.toString()
                }
            )

            child.on(
                'error',
                error => {

                    if (
                        error.code ===
                        'ENOENT'
                    ) {
                        reject(
                            new Error(
                                'FFmpeg tidak ditemukan. Install FFmpeg terlebih dahulu'
                            )
                        )

                        return
                    }

                    reject(
                        error
                    )
                }
            )

            child.on(
                'close',
                code => {

                    if (
                        code === 0
                    ) {
                        resolve()
                        return
                    }

                    reject(
                        new Error(
                            `FFmpeg gagal mengubah audio ke MP3 (exit code ${code})\n${stderr.slice(-2000)}`
                        )
                    )
                }
            )
        }
    )
}


// ============================================================
// CONVERT AUDIO → MP3
// ============================================================

async function convertAudio(
    buffer
) {
    const folder =
        await mkdtemp(
            join(
                tmpdir(),
                'sakura-ytaudio-'
            )
        )

    const inputPath =
        join(
            folder,
            'input'
        )

    const outputPath =
        join(
            folder,
            'output.mp3'
        )

    try {

        await writeFile(
            inputPath,
            buffer
        )

        await runFFmpegAudio(
            inputPath,
            outputPath
        )

        const outputBuffer =
            await readFile(
                outputPath
            )

        const outputStat =
            await stat(
                outputPath
            )

        if (
            outputStat.size <
            10 * 1024
        ) {
            throw new Error(
                'Hasil MP3 terlalu kecil'
            )
        }

        return {
            buffer:
                outputBuffer,

            size:
                outputStat.size,

            mime:
                'audio/mpeg',

            ext:
                'mp3'
        }

    } finally {

        await rm(
            folder,
            {
                recursive:
                    true,

                force:
                    true
            }
        ).catch(
            () => {}
        )
    }
}


// ============================================================
// URL YOUTUBE
// ============================================================

const YT_HOSTS =
    new Set([
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'music.youtube.com',
        'youtu.be'
    ])

const VIDEO_ID =
    /^[A-Za-z0-9_-]{11}$/


function normalizeYoutubeUrl(
    input
) {
    let raw =
        String(
            input || ''
        ).trim()

    if (!raw) {
        return null
    }

    if (
        !/^https?:\/\//i.test(
            raw
        )
    ) {
        raw =
            `https://${raw}`
    }

    let url

    try {
        url =
            new URL(raw)
    } catch {
        return null
    }

    if (
        !YT_HOSTS.has(
            url.hostname.toLowerCase()
        )
    ) {
        return null
    }

    let id = ''

    if (
        url.hostname.toLowerCase() ===
        'youtu.be'
    ) {

        id =
            url.pathname
                .split('/')
                .filter(Boolean)[0] ||
            ''

    } else {

        const parts =
            url.pathname
                .split('/')
                .filter(Boolean)

        if (
            parts[0] ===
            'watch'
        ) {

            id =
                url.searchParams.get(
                    'v'
                ) || ''

        } else if (
            [
                'shorts',
                'live',
                'embed',
                'v'
            ].includes(
                parts[0]
            )
        ) {

            id =
                parts[1] ||
                ''
        }
    }

    if (
        !VIDEO_ID.test(
            id
        )
    ) {
        return null
    }

    return (
        `https://www.youtube.com/watch?v=${id}`
    )
}


// ============================================================
// PARSER RESPONSE SAVEFROM
// ============================================================

const IMAGE_URL =
    /\.(jpe?g|png|webp|gif)(\?|#|$)/i

const NON_MEDIA_KEYS =
    /(^|\.)(thumb|thumbnail|thumbnails|cover|poster|image|images|preview|avatar|icon)(\.|$)/i

const AUDIO_HINT =
    /audio|mp3|m4a|opus|ogg|aac|wav|flac/i

const VIDEO_HINT =
    /video|mp4|webm|mkv|mov|3gp/i


function urlExt(
    url
) {
    try {

        const match =
            new URL(url)
                .pathname
                .match(
                    /\.([a-z0-9]{2,5})$/i
                )

        return match
            ? match[1].toLowerCase()
            : ''

    } catch {
        return ''
    }
}


function classify(
    ctx,
    keyPath,
    ext
) {
    const hints = [
        ctx.type,
        ctx.mime,
        ctx.mimeType,
        ctx.mimetype,
        ctx.format,
        ctx.ext,
        ctx.extension,
        ctx.kind,
        ctx.media,
        keyPath,
        ext
    ]
        .filter(
            v =>
                typeof v ===
                'string'
        )
        .join(' ')
        .toLowerCase()

    if (
        /audio/.test(
            hints
        ) ||
        (
            AUDIO_HINT.test(
                hints
            ) &&
            !/video/.test(
                hints
            )
        )
    ) {
        return 'audio'
    }

    if (
        VIDEO_HINT.test(
            hints
        )
    ) {
        return 'video'
    }

    if (
        ctx.hasVideo === false ||
        ctx.onlyAudio === true
    ) {
        return 'audio'
    }

    return 'unknown'
}


function qualityOf(
    ctx
) {
    return firstString(
        ctx.quality,
        ctx.resolution,
        ctx.label,
        ctx.qualityLabel,

        ctx.height
            ? `${ctx.height}p`
            : '',

        ctx.bitrate
            ? `${ctx.bitrate}${
                /kbps/i.test(
                    String(
                        ctx.bitrate
                    )
                )
                    ? ''
                    : 'kbps'
            }`
            : '',

        ctx.abr
            ? `${ctx.abr}kbps`
            : ''
    )
}


const numericRank =
    text => {

        const match =
            String(text)
                .match(
                    /\d+/
                )

        return match
            ? Number(
                match[0]
            )
            : 0
    }


function parseSaveResponse(
    data
) {
    const root =
        data?.result ??
        data?.data ??
        data

    const info = {
        title:
            firstString(
                root?.title,
                data?.title,
                root?.name,
                root?.videoTitle
            ),

        duration:
            firstString(
                root?.duration,
                data?.duration,
                root?.length
            ),

        options: []
    }

    const seen =
        new Set()

    for (
        const found
        of collectUrls(root)
    ) {

        const keyPath =
            found.keys.join(
                '.'
            )

        if (
            NON_MEDIA_KEYS.test(
                keyPath
            ) ||
            IMAGE_URL.test(
                found.url
            ) ||
            seen.has(
                found.url
            )
        ) {
            continue
        }

        seen.add(
            found.url
        )

        const ctx =
            found.parent &&
            typeof found.parent ===
                'object'
                ? found.parent
                : {}

        const ext =
            urlExt(
                found.url
            )

        const lastKey =
            found.keys[
                found.keys.length - 1
            ] || ''

        const kind =
            classify(
                ctx,
                keyPath,
                ext
            )

        const formatWord =
            /^(mp3|mp4|m4a|webm|opus|ogg)$/i.test(
                lastKey
            )
                ? lastKey
                : firstString(
                    ctx.ext,
                    ctx.extension,
                    ctx.format,
                    ext
                )

        const format =
            /^[a-z0-9]{2,5}$/i.test(
                formatWord
            )
                ? formatWord.toUpperCase()
                : ''

        const quality =
            qualityOf(
                ctx
            )

        const size =
            Number(
                ctx.size ??
                ctx.filesize ??
                ctx.fileSize
            ) || 0

        let label =
            [
                format,
                quality
            ]
                .filter(Boolean)
                .join(' ')
                .trim()

        if (!label) {
            label =
                kind === 'audio'
                    ? 'Audio'
                    : kind === 'video'
                        ? 'Video'
                        : 'File'
        }

        info.options.push({
            url:
                found.url,

            kind,

            label:
                label.slice(
                    0,
                    24
                ),

            quality,

            size
        })
    }

    const rank =
        opt =>
            numericRank(
                opt.quality ||
                opt.label
            )

    const order = {
        audio: 0,
        video: 1,
        unknown: 2
    }

    info.options.sort(
        (
            a,
            b
        ) =>
            (
                order[a.kind] -
                order[b.kind]
            ) ||
            (
                rank(b) -
                rank(a)
            )
    )

    const count = {}

    for (
        const opt
        of info.options
    ) {

        const key =
            `${opt.kind}:${opt.label}`

        count[key] =
            (
                count[key] ||
                0
            ) + 1

        if (
            count[key] >
            1
        ) {
            opt.label =
                `${opt.label.slice(
                    0,
                    20
                )} #${count[key]}`
        }
    }

    return info
}


// ============================================================
// ERROR
// ============================================================

function friendlyError(
    e
) {
    const msg =
        String(
            e?.message || e
        )

    if (
        /private/i.test(
            msg
        )
    ) {
        return 'Video ini private dan tidak bisa diunduh'
    }

    if (
        /unavailable|not available|removed|deleted|not found|does not exist|tidak tersedia/i
            .test(msg)
    ) {
        return 'Video tidak tersedia (dihapus / dibatasi / tidak ditemukan)'
    }

    if (
        /age|sign in|login|restricted/i
            .test(msg)
    ) {
        return 'Video dibatasi (umur / login) dan tidak bisa diunduh'
    }

    if (
        /ffmpeg tidak ditemukan/i.test(
            msg
        )
    ) {
        return (
            'FFmpeg belum terpasang di server\n\n' +
            'Install FFmpeg terlebih dahulu'
        )
    }

    if (
        /FFmpeg gagal/i.test(
            msg
        )
    ) {
        return (
            'Video/audio berhasil diunduh, tetapi gagal dikonversi menggunakan FFmpeg'
        )
    }

    if (
        e instanceof ApiError
    ) {
        return msg.replace(
            /\.$/,
            ''
        )
    }

    return (
        `Terjadi kesalahan: ${msg}`
    ).replace(
        /\.$/,
        ''
    )
}


// ============================================================
// NAMA FILE
// ============================================================

const safeName =
    text =>
        String(
            text ||
            'youtube'
        )
            .replace(
                /[\\/:*?"<>|\n\r]+/g,
                ' '
            )
            .replace(
                /\s+/g,
                ' '
            )
            .trim()
            .slice(
                0,
                80
            ) ||
        'youtube'


// ============================================================
// VALIDASI VIDEO
// ============================================================

function looksLikeVideoFile(
    file
) {
    if (
        !file?.buffer ||
        !Buffer.isBuffer(
            file.buffer
        )
    ) {
        return false
    }

    if (
        file.buffer.length <
        10 * 1024
    ) {
        return false
    }

    const mime =
        String(
            file.mime || ''
        ).toLowerCase()

    if (
        mime.startsWith(
            'text/'
        ) ||
        mime.includes(
            'json'
        ) ||
        mime.includes(
            'html'
        )
    ) {
        return false
    }

    const head =
        file.buffer
            .subarray(
                0,
                64
            )
            .toString(
                'latin1'
            )

    if (
        head.includes(
            'ftyp'
        )
    ) {
        return true
    }

    return (
        file.buffer.length >=
        100 * 1024
    )
}


// ============================================================
// VALIDASI AUDIO
// ============================================================

function looksLikeAudioFile(
    file
) {
    if (
        !file?.buffer ||
        !Buffer.isBuffer(
            file.buffer
        )
    ) {
        return false
    }

    if (
        file.buffer.length <
        10 * 1024
    ) {
        return false
    }

    const mime =
        String(
            file.mime || ''
        ).toLowerCase()

    if (
        mime.startsWith(
            'text/'
        ) ||
        mime.includes(
            'json'
        ) ||
        mime.includes(
            'html'
        )
    ) {
        return false
    }

    return true
}


// ============================================================
// DOWNLOAD VIDEO
// SAKURA → NEVERCAP
// ============================================================

async function downloadVideoSource(
    url,
    maxBytes,
    youtubeUrl = url
) {
    let firstError = null

    try {

        const file =
            await downloadBuffer(
                url,
                {
                    maxBytes
                }
            )

        if (
            looksLikeVideoFile(
                file
            )
        ) {
            return {
                file,
                source:
                    'SakuraApis'
            }
        }

        firstError =
            new Error(
                `Hasil download utama tidak valid (${
                    file?.size ||
                    file?.buffer?.length ||
                    0
                } bytes)`
            )

    } catch (e) {

        firstError =
            e
    }

    console.error(
        '[youtube] Sumber video utama gagal:',
        firstError?.message ||
        firstError
    )


    const fallback =
        await ytmp4(
            youtubeUrl
        )

    if (
        !fallback?.success ||
        !fallback.url
    ) {
        throw new Error(
            fallback?.error ||
            firstError?.message ||
            'SakuraApis dan Nevercap gagal mendapatkan video'
        )
    }

    const file =
        await downloadBuffer(
            fallback.url,
            {
                maxBytes
            }
        )

    if (
        !looksLikeVideoFile(
            file
        )
    ) {
        throw new Error(
            `Nevercap mengembalikan file video tidak valid (${
                file?.size ||
                file?.buffer?.length ||
                0
            } bytes)`
        )
    }

    return {
        file,

        source:
            'Nevercap'
    }
}


// ============================================================
// DOWNLOAD AUDIO
// SAKURA → NEVERCAP → FFMPEG
// ============================================================

async function downloadAudioSource(
    optionUrl,
    maxBytes,
    youtubeUrl
) {
    let firstError = null

    try {

        const file =
            await downloadBuffer(
                optionUrl,
                {
                    maxBytes
                }
            )

        if (
            looksLikeAudioFile(
                file
            )
        ) {
            return {
                file,

                source:
                    'SakuraApis',

                needConvert:
                    true
            }
        }

        firstError =
            new Error(
                `Hasil audio Sakura terlalu kecil (${
                    file?.size ||
                    file?.buffer?.length ||
                    0
                } bytes)`
            )

    } catch (e) {

        firstError =
            e
    }

    console.error(
        '[youtube] Audio Sakura gagal:',
        firstError?.message ||
        firstError
    )


    let fallback

    try {

        fallback =
            await ytmp4(
                youtubeUrl
            )

    } catch (e) {

        throw new Error(
            `Sakura audio gagal dan Nevercap error: ${
                e?.message ||
                e
            }`
        )
    }

    if (
        !fallback?.success ||
        !fallback.url
    ) {
        throw new Error(
            fallback?.error ||
            firstError?.message ||
            'Gagal mendapatkan video dari Nevercap'
        )
    }

    const video =
        await downloadBuffer(
            fallback.url,
            {
                maxBytes
            }
        )

    if (
        !looksLikeVideoFile(
            video
        )
    ) {
        throw new Error(
            `Nevercap mengembalikan file tidak valid (${
                video?.size ||
                video?.buffer?.length ||
                0
            } bytes)`
        )
    }

    return {
        file:
            video,

        source:
            'Nevercap',

        needConvert:
            true
    }
}


// ============================================================
// DOWNLOAD + SEND
// ============================================================

async function downloadAndSend(
    conn,
    m,
    entry,
    option,
    notifReply
) {
    const lockKey =
        `youtube-dl:${m.sender}`

    if (
        !acquireLock(
            lockKey
        )
    ) {
        return notifReply(
            'Masih ada proses download yang berjalan\nTunggu sampai selesai ya'
        )
    }

    try {

        const maxBytes =
            (
                config.limits
                    ?.maxDownloadMB ??
                100
            ) * MB


        let file
        let source =
            'SakuraApis'


        // ====================================================
        // VIDEO
        // ====================================================

        if (
            option.kind ===
            'video'
        ) {

            try {

                const result =
                    await downloadVideoSource(
                        option.url,
                        maxBytes,
                        entry.url
                    )

                file =
                    result.file

                source =
                    result.source

            } catch (e) {

                if (
                    e instanceof ApiError &&
                    e.code ===
                    'TOO_LARGE'
                ) {
                    return notifReply(
                        `${e.message}\n\n` +
                        `Unduh manual lewat link:\n` +
                        option.url
                    )
                }

                throw e
            }
        }


        // ====================================================
        // AUDIO
        // ====================================================

        else if (
            option.kind ===
            'audio'
        ) {

            try {

                const result =
                    await downloadAudioSource(
                        option.url,
                        maxBytes,
                        entry.url
                    )

                file =
                    result.file

                source =
                    result.source

            } catch (e) {

                if (
                    e instanceof ApiError &&
                    e.code ===
                    'TOO_LARGE'
                ) {
                    return notifReply(
                        `${e.message}\n\n` +
                        `Unduh manual lewat link:\n` +
                        option.url
                    )
                }

                throw e
            }
        }


        // ====================================================
        // VIDEO PROCESS
        // ====================================================

        if (
            option.kind ===
            'video'
        ) {

            file =
                await convertVideo(
                    file.buffer
                )


            const title =
                entry.info.title ||
                'YouTube'


            const caption =
                `📝 *Judul:* ${title}` +
                `${
                    entry.info.duration
                        ? `\n⏱️ *Durasi:* ${entry.info.duration}`
                        : ''
                }` +
                `\n🎞️ *Format:* ${option.label}` +
                `\n📦 *Ukuran:* ${formatBytes(
                    file.size
                )}`


            await conn.sendMessage(
                m.chat,
                {
                    video:
                        file.buffer,

                    mimetype:
                        'video/mp4',

                    fileName:
                        `${safeName(
                            title
                        )}.mp4`,

                    caption
                },
                {
                    quoted:
                        m
                }
            )

            return
        }


        // ====================================================
        // AUDIO PROCESS
        // ====================================================

        if (
            option.kind ===
            'audio'
        ) {

            file =
                await convertAudio(
                    file.buffer
                )


            const title =
                entry.info.title ||
                'YouTube'


            const caption =
                `🎵 *YouTube MP3*\n\n` +
                `📝 *Judul:* ${title}` +
                `${
                    entry.info.duration
                        ? `\n⏱️ *Durasi:* ${entry.info.duration}`
                        : ''
                }` +
                `\n🎧 *Format:* MP3` +
                `\n📦 *Ukuran:* ${formatBytes(
                    file.size
                )}` +
                `\n🌐 *Server:* ${source}`


            await sendInapp(
                conn,
                m,
                caption
            )


            await conn.sendMessage(
                m.chat,
                {
                    audio:
                        file.buffer,

                    mimetype:
                        'audio/mpeg',

                    fileName:
                        `${safeName(
                            title
                        )}.mp3`,

                    ptt:
                        false
                },
                {
                    quoted:
                        m
                }
            )

            return
        }


        throw new Error(
            `Format media tidak dikenali: ${option.kind}`
        )

    } finally {

        releaseLock(
            lockKey
        )
    }
}


// ============================================================
// HEADER
// ============================================================

function header(
    info
) {
    return (
        `📝 ${truncate(
            info.title ||
            'Video YouTube',
            120
        )}` +
        `${
            info.duration
                ? `\n⏱️ ${info.duration}`
                : ''
        }`
    )
}


// ============================================================
// FORMAT BUTTON
// ============================================================

async function askFormat(
    conn,
    m,
    pfx,
    token,
    info,
    hasAudio,
    hasVideo
) {
    const items = []


    if (
        hasAudio
    ) {
        items.push({
            id:
                `${pfx}ytdl ${token} mp3`,

            label:
                '🎵 MP3'
        })
    }


    if (
        hasVideo
    ) {
        items.push({
            id:
                `${pfx}ytdl ${token} mp4`,

            label:
                '🎬 MP4'
        })
    }


    await sendChoiceButtons(
        conn,
        m,
        {
            title:
                '🎬 YouTube Downloader',

            text:
                `${header(
                    info
                )}\n\n` +
                `Pilih format:`,

            footer:
                'Pilihan berlaku 15 menit',

            items,

            fallbackText:
                `${header(
                    info
                )}\n\n` +
                `Pilih format:\n` +
                items
                    .map(
                        i =>
                            `• ${i.label} → ${i.id}`
                    )
                    .join(
                        '\n'
                    )
        }
    )
}


// ============================================================
// OPTION LIST
// ============================================================

async function askOption(
    conn,
    m,
    pfx,
    token,
    entry,
    options,
    label
) {
    const rows =
        options.map(
            opt => ({

                title:
                    opt.label,

                description:
                    opt.size
                        ? formatBytes(
                            opt.size
                        )
                        : label,

                id:
                    `${pfx}ytdl ${token} ` +
                    `${entry.info.options.indexOf(
                        opt
                    )}`
            })
        )


    await sendChoiceList(
        conn,
        m,
        {
            title:
                `${
                    label ===
                    'Audio'
                        ? '🎵'
                        : '🎬'
                } YouTube ${label}`,

            text:
                `${header(
                    entry.info
                )}\n\n` +
                `Pilih ${
                    label ===
                    'Audio'
                        ? 'kualitas audio'
                        : 'kualitas video'
                }:`,

            footer:
                'Pilihan berlaku 15 menit',

            listTitle:
                `Pilih ${label}`,

            buttonLabel:
                '☰ pilih',

            sections: [
                {
                    title:
                        `Pilihan ${label}`,

                    rows
                }
            ],

            fallbackText:
                `${header(
                    entry.info
                )}\n\n` +
                `Pilih kualitas:\n` +
                rows
                    .map(
                        r =>
                            `• ${r.title} → ${r.id}`
                    )
                    .join(
                        '\n'
                    )
        }
    )
}


// ============================================================
// HANDLER
// ============================================================

let handler =
    async (
        m,
        {
            conn,
            args,
            text,
            command,
            prefix,
            notifReply
        }
    ) => {

        const pfx =
            prefix ||
            config.prefix?.[0] ||
            '.'


        // ======================================================
        // CALLBACK BUTTON
        // ======================================================

        if (
            command ===
            'ytdl'
        ) {

            const [
                token,
                choice
            ] = args


            const entry =
                token
                    ? sessions.get(
                        token
                    )
                    : null


            if (!entry) {
                return notifReply(
                    `Pilihan sudah kedaluwarsa\n` +
                    `Kirim ulang ${pfx}ytmp4 <link>`
                )
            }


            if (
                !m.isOwner &&
                !isSameJid(
                    entry.sender,
                    m.sender
                )
            ) {
                return notifReply(
                    'Pilihan ini milik pengguna lain'
                )
            }


            // ==================================================
            // MP3 / MP4
            // ==================================================

            if (
                choice ===
                    'mp3' ||
                choice ===
                    'mp4'
            ) {

                const kind =
                    choice ===
                    'mp3'
                        ? 'audio'
                        : 'video'


                const options =
                    entry.info.options.filter(
                        opt =>
                            opt.kind ===
                            kind
                    )


                if (
                    !options.length
                ) {

                    if (
                        kind ===
                        'audio'
                    ) {

                        const fallbackOption = {
                            url:
                                entry.url,

                            kind:
                                'audio',

                            label:
                                'MP3',

                            quality:
                                '128kbps',

                            size:
                                0
                        }

                        return downloadAndSend(
                            conn,
                            m,
                            entry,
                            fallbackOption,
                            notifReply
                        )
                    }

                    return notifReply(
                        'Format itu tidak tersedia untuk video ini'
                    )
                }


                if (
                    options.length ===
                    1
                ) {

                    return downloadAndSend(
                        conn,
                        m,
                        entry,
                        options[0],
                        notifReply
                    )
                }


                return askOption(
                    conn,
                    m,
                    pfx,
                    token,
                    entry,
                    options,
                    kind ===
                        'audio'
                        ? 'Audio'
                        : 'Video'
                )
            }


            // ==================================================
            // NOMOR QUALITY
            // ==================================================

            const index =
                Number(
                    choice
                )


            const option =
                Number.isInteger(
                    index
                )
                    ? entry.info.options[
                        index
                    ]
                    : null


            if (
                !option
            ) {
                return notifReply(
                    'Pilihan tidak valid'
                )
            }


            return downloadAndSend(
                conn,
                m,
                entry,
                option,
                notifReply
            )
        }


        // ======================================================
        // COMMAND UTAMA
        // ======================================================

        const input =
            (text || '')
                .trim()
                .split(
                    /\s+/
                )[0]


        if (
            !input
        ) {

            return notifReply(
                `Kirim link YouTube-nya\n\n` +
                `Contoh:\n` +
                `${pfx}ytmp4 https://youtube.com/watch?v=xxxxxxxxxxx\n` +
                `${pfx}ytmp3 https://youtu.be/xxxxxxxxxxx`
            )
        }


        const url =
            normalizeYoutubeUrl(
                input
            )


        if (
            !url
        ) {

            return notifReply(
                'Link bukan URL YouTube yang valid'
            )
        }


        // ======================================================
        // COOLDOWN
        // ======================================================

        if (
            !m.isOwner
        ) {

            const cd =
                checkCooldown(
                    `youtube:${m.sender}`,

                    config.limits
                        ?.cooldown
                        ?.youtube ??
                    10
                )


            if (
                !cd.ok
            ) {

                return notifReply(
                    `Tunggu ${cd.wait} detik sebelum memakai fitur ini lagi`
                )
            }
        }


        try {

            await notifReply(
                '🔄 Mengambil info video...'
            )


            // ==================================================
            // SAKURA SAVEFROM
            // ==================================================

            const data =
                await sakura(
                    ENDPOINT,
                    {
                        url
                    },
                    {
                        retries:
                            1
                    }
                )


            const info =
                parseSaveResponse(
                    data
                )


            // ==================================================
            // JIKA SAKURA TIDAK MENGEMBALIKAN
            // MEDIA SAMA SEKALI
            // ==================================================

            if (
                !info.options.length
            ) {

                console.error(
                    '[youtube] respon tanpa link media:',
                    truncate(
                        JSON.stringify(
                            data
                        ),
                        500
                    )
                )


                const token =
                    randomToken()


                const entry = {
                    sender:
                        m.sender,

                    chat:
                        m.chat,

                    url,

                    info: {
                        title:
                            firstString(
                                data?.title,
                                data?.result?.title,
                                data?.data?.title
                            ) ||
                            'YouTube',

                        duration:
                            firstString(
                                data?.duration,
                                data?.result?.duration,
                                data?.data?.duration
                            ),

                        options: []
                    }
                }


                sessions.set(
                    token,
                    entry
                )


                return await sendChoiceButtons(
                    conn,
                    m,
                    {
                        title:
                            '🎬 YouTube Downloader',

                        text:
                            `${header(
                                entry.info
                            )}\n\n` +
                            `Pilih format:`,

                        footer:
                            'Pilihan berlaku 15 menit',

                        items: [
                            {
                                id:
                                    `${pfx}ytdl ${token} mp3`,

                                label:
                                    '🎵 MP3'
                            },

                            {
                                id:
                                    `${pfx}ytdl ${token} mp4`,

                                label:
                                    '🎬 MP4'
                            }
                        ],

                        fallbackText:
                            `${header(
                                entry.info
                            )}\n\n` +
                            `Pilih format:\n` +
                            `• 🎵 MP3 → ${pfx}ytdl ${token} mp3\n` +
                            `• 🎬 MP4 → ${pfx}ytdl ${token} mp4`
                    }
                )
            }


            // ==================================================
            // SESSION
            // ==================================================

            const token =
                randomToken()


            const entry = {
                sender:
                    m.sender,

                chat:
                    m.chat,

                url,

                info
            }


            sessions.set(
                token,
                entry
            )


            const audio =
                info.options.filter(
                    opt =>
                        opt.kind ===
                        'audio'
                )


            const video =
                info.options.filter(
                    opt =>
                        opt.kind ===
                        'video'
                )


            // ==================================================
            // SATU OPTION
            // ==================================================

            if (
                info.options.length ===
                1
            ) {

                return await downloadAndSend(
                    conn,
                    m,
                    entry,
                    info.options[0],
                    notifReply
                )
            }


            // ==================================================
            // AUDIO + VIDEO
            // ==================================================

            if (
                audio.length &&
                video.length
            ) {

                return await askFormat(
                    conn,
                    m,
                    pfx,
                    token,
                    info,
                    true,
                    true
                )
            }


            // ==================================================
            // AUDIO ATAU VIDEO
            // ==================================================

            if (
                audio.length ||
                video.length
            ) {

                const group =
                    audio.length
                        ? audio
                        : video


                return await askOption(
                    conn,
                    m,
                    pfx,
                    token,
                    entry,
                    group,

                    audio.length
                        ? 'Audio'
                        : 'Video'
                )
            }


            // ==================================================
            // UNKNOWN
            // ====================================================

            return await askOption(
                conn,
                m,
                pfx,
                token,
                entry,
                info.options,
                'File'
            )

        } catch (e) {

            console.error(
                '[youtube error]',
                e
            )


            await notifReply(
                friendlyError(
                    e
                )
            )
        }
    }


// ============================================================
// HANDLER CONFIG
// ============================================================

handler.command = [
    'yt',
    'ytdl'
]

handler.desc =
    'Download YouTube MP3/MP4 (pilih format & kualitas)'

handler.download =
    true

handler.tags = [
    'downloader'
]

export default handler