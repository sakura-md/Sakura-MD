/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Helper media: cari media di pesan itu sendiri atau pesan yang di-reply.
const MB = 1024 * 1024
const toNum = (v) => (v && typeof v === 'object' && typeof v.toNumber === 'function' ? v.toNumber() : Number(v) || 0)

const KIND_OF = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'sticker', documentMessage: 'document' }

// kinds: ['image','video','sticker','audio']  -> { kind, mime, size, seconds, animated, download } | null
export function findMedia(m, kinds) {
    for (const ref of [m, m?.quoted].filter(Boolean)) {
        const kind = KIND_OF[ref.mtype]
        const c = ref.msg
        if (!kind || !c || typeof c !== 'object' || typeof ref.download !== 'function') continue
        let k = kind
        if (kind === 'document') {
            const mime = String(c.mimetype || '')
            k = mime.startsWith('image/') ? 'image' : mime.startsWith('video/') ? 'video' : mime.startsWith('audio/') ? 'audio' : 'document'
        }
        if (!kinds.includes(k)) continue
        return { kind: k, mime: String(c.mimetype || ''), fileName: String(c.fileName || ''), size: toNum(c.fileLength), seconds: toNum(c.seconds), animated: !!c.isAnimated, download: () => ref.download() }
    }
    return null
}

export const tooBig = (media, maxMB) => media.size > maxMB * MB
export const MB_ = MB