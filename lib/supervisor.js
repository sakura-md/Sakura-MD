/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
import { spawn } from 'child_process'

// Kode keluar khusus: "tolong jalankan ulang aku". Dipakai autorestart.js dan .restart.
export const RESTART_EXIT_CODE = 42

const CRASH_WINDOW = 5 * 60 * 1000
const CRASH_LIMIT = 5
const CRASH_DELAY = 3000
const RESTART_DELAY = 500

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const say = text => console.log(`[SUPERVISOR] ${text}`)

function runChild() {
    return new Promise(resolve => {
        const child = spawn(
            process.execPath,
            [...process.execArgv, process.argv[1], ...process.argv.slice(2)],
            {
                stdio: 'inherit',
                env: { ...process.env, SAKURA_CHILD: '1' }
            }
        )

        runChild.current = child

        child.once('error', error => {
            say(`Gagal menjalankan bot: ${error.message}`)
            resolve({ code: 1, signal: null })
        })

        child.once('exit', (code, signal) => resolve({ code, signal }))
    })
}

async function supervise() {
    let stopping = false
    const crashes = []

    // Ctrl+C / stop dari panel: teruskan ke proses bot lalu ikut berhenti.
    for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        process.on(signal, () => {
            stopping = true

            const child = runChild.current
            if (!child || child.exitCode !== null) return

            child.kill(signal)

            // Kalau bot tidak mau berhenti, paksa setelah 10 detik.
            setTimeout(() => {
                if (child.exitCode === null) child.kill('SIGKILL')
            }, 10000).unref()
        })
    }

    while (true) {
        const { code, signal } = await runChild()

        if (stopping) process.exit(code ?? 0)

        if (code === RESTART_EXIT_CODE) {
            say('Restart diminta, menjalankan ulang bot...')
            await sleep(RESTART_DELAY)
            continue
        }

        // Keluar normal (code 0) = memang sengaja berhenti.
        if (code === 0) process.exit(0)

        // Selain itu dianggap crash: nyalakan lagi, tapi jangan crash-loop tanpa batas.
        const now = Date.now()
        crashes.push(now)
        while (crashes.length && now - crashes[0] > CRASH_WINDOW) crashes.shift()

        if (crashes.length > CRASH_LIMIT) {
            say(`Bot crash lebih dari ${CRASH_LIMIT}x dalam ${CRASH_WINDOW / 60000} menit. Supervisor berhenti, periksa error di atas.`)
            process.exit(code ?? 1)
        }

        say(`Bot berhenti tidak normal (${signal || `kode ${code}`}), menyalakan ulang dalam ${CRASH_DELAY / 1000} detik...`)
        await sleep(CRASH_DELAY)
    }
}

// Proses induk menjalankan bot sebagai proses anak, jadi `node index.js` / `npm start` tetap sama.
// Top-level await ini tidak pernah selesai di proses induk, sehingga index.js tidak ikut dijalankan dua kali.
// Matikan dengan SAKURA_NO_SUPERVISOR=1 kalau proses sudah dikelola pm2/panel sendiri.
if (process.env.SAKURA_CHILD !== '1' && process.env.SAKURA_NO_SUPERVISOR !== '1') {
    await supervise()
}
