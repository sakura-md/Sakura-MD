/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { cmd } from '../../lib/plugkit.js'
import { pfxOf, box } from '../../lib/format.js'
import { runAI } from './aitools.js'
import { askDeepAI, getModels } from '../../lib/scrape/deepai.js'

const T = { tags: ['ai'] }
const TITLE = 'DeepAI Code'

// .deepaicode <pertanyaan>            -> model default
// .deepaicode -m <id-model> <tanya>   -> pilih model (lihat .deepaimodels)
const deepaicode = cmd({ command: ['deepaicode', 'deepai', 'aicode'], desc: 'AI khusus coding (DeepAI)', ...T, title: TITLE }, async (m, { conn, text, prefix, notifReply }) => {
    let q = (text.trim() || m.quoted?.text || '').trim()
    let model
    const pick = q.match(/^(?:-m|--model)[=\s]+(\S+)\s*([\s\S]*)$/i)
    if (pick) { model = pick[1]; q = (pick[2] || m.quoted?.text || '').trim() }

    const pfx = pfxOf(prefix)
    if (!q) return notifReply(`Contoh:\n${pfx}deepaicode buatkan fungsi debounce di JavaScript\n${pfx}deepaicode -m <id-model> jelaskan closure\n\nDaftar model: ${pfx}deepaimodels`, TITLE)
    if (q.length > 3000) return notifReply('Pertanyaan terlalu panjang (maks 3000 karakter).', TITLE)

    await runAI(conn, m, notifReply, TITLE, async () => {
        const r = await askDeepAI(q, { model })
        return `${r.answer}\n\n_model: ${r.model.name}_`
    })
})

const deepaimodels = cmd({ command: ['deepaimodels', 'deepaimodel'], desc: 'Daftar model DeepAI yang bisa dipakai', ...T, title: TITLE }, async (m, { prefix, notifReply }) => {
    const models = await getModels()
    await notifReply(box('MODEL DEEPAI', [
        ...models.slice(0, 25).map((x, i) => `${i + 1}. ${x.name} (${x.id})`),
        '',
        `Pakai: ${pfxOf(prefix)}deepaicode -m <id> pertanyaan`
    ]), TITLE)
})

export default deepaicode
export const handlers = [deepaimodels]
