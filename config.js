/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Config.js ganti sesuka kalian
*/

export default {
    // Informasi utama bot
    botName: 'Sakura-MD',
    version: '1.0.0',
    ownerName: 'Seika',
    
    // Pengaturan sticker
    sticker: {
        packname: 'Sakura-MD',
        author: 'Seika'
    },

    // Nomor creator bot
    creator: [
        '6283167752474'
    ],

    // Reaction otomatis pada menu
    menu: {
        reaction: {
            enabled: true,
            emoji: '🌸'
        }
    },

    // Restart otomatis saat file diperbarui (upload/ganti file, git pull, dll)
    // Plugin sudah hot-reload sendiri; tambahkan 'plugins' ke watch kalau plugin juga mau memicu restart.
    autoRestart: {
        enabled: true,
        watch: ['index.js', 'handler.js', 'config.js', 'package.json', 'lib'],
        interval: 2000,
        settle: 2000
    },

    // Prefix command bot
    prefix: ['.', '#', '!', '/'],

    // Mode bot
    botMode: 'public',

    // Pengaturan API
    api: {
        baseUrl: 'https://api.haidarxd.my.id',
        apikey: 'ISI_APIKEY_LU',

        // Pengaturan AI
        ai: {
            apikey: 'ISI_APIKEY_LU',
            baseUrl: 'https://router.clouvia.id/v1',
            model: 'coding-high',
            visionModel: 'gemini-3.8-flash-high',
            maxTokens: 4096
        },

        // Pengaturan Ephoto
        ephoto: {
            text: {},
            image: {}
        }
    },

    // Batas waktu request dalam milidetik
    timeouts: {
        api: 30000,
        upscale: 120000,
        video: 300000,
        download: 120000,
        upload: 60000
    },

    // Batas penggunaan fitur
    limits: {
        maxDownloadMB: 100,
        maxImageMB: 10,
        maxVideoMB: 50,
        maxPluginKB: 512,

        // Cooldown setiap fitur dalam detik
        cooldown: {
            youtube: 10,
            download: 10,
            play: 15,
            hd: 30,
            hdvid: 120,
            alightMotion: 20,
            bypass: 5,
            spamngl: 120,
            ai: 8,
            ephoto: 15,
            tempmail: 5,
            virustotal: 30,
            web2apk: 120,
            anime: 5
        },

        // Pengaturan anti-spam
        spamngl: {
            maxCount: 5,
            maxMessageLength: 200
        }
    },

    // Path Chromium untuk fitur VirusTotal (kosongkan = pakai Chromium bawaan puppeteer / env CHROMIUM_PATH)
    chromiumPath: '',

    // Pengaturan Web2APK (password keystore template; ubah hanya kalau memakai template sendiri)
    apk: {
        keystorePass: 'mdmdky'
    },

    // Host untuk upload sementara
    uploader: {
        hosts: [
            'catbox',
            'uguu'
        ]
    },

    // Pengaturan harga dan informasi script
    script: {
        priceNoUpdate: 'Rp 40.000',
        priceFullUpdate: 'Rp 60.000',
        group: 'https://chat.whatsapp.com/HhZMuDV1qrn9MwLescK2S3',
        contact: 'https://t.me/seikagenou'
    },

    // Informasi pembayaran (command .payment)
    // Ganti number & name dengan data Dana kamu. Gambar (QR / bukti akun) taruh di media/ lalu isi nama filenya di image.
    payment: {
        dana: {
            number: '083167752474',       // <- GANTI: nomor Dana
            name: 'Sei Kagenou',    // <- GANTI: nama akun Dana
            image: 'media/dana.jpeg'       // gambar Dana di folder media/ (kalau file tidak ada, dikirim teks saja)
        },
        note: 'Setelah bayar, kirim bukti transfer ke owner untuk aktivasi sewa'
    },

    // Pengaturan sistem sewa
    sewa: {
        plans: {
            '7d': {
                days: 7,
                label: '7 Hari',
                price: ''
            },

            '30d': {
                days: 30,
                label: '30 Hari',
                price: ''
            },

            '90d': {
                days: 90,
                label: '90 Hari',
                price: ''
            }
        },

        // Informasi pembayaran
        paymentInfo: [],

        // Kontak sewa
        contact: 'wa.me/seikageen',

        // Pengingat sebelum sewa berakhir
        remindDays: 3
    },

    // Pesan saat mengubah mode bot
    modeMessages: {
        self: {
            already: '*Bot sudah dalam mode Self*',
            success: '*Bot mode berhasil diubah ke Self*',
            saveError: '*Mode Self aktif, tapi gagal disimpan ke database/settings.json (akan kembali ke config.js setelah restart)*'
        },

        public: {
            already: '*Bot sudah dalam mode Public*',
            success: '*Bot mode berhasil diubah ke Public*',
            saveError: '*Mode Public aktif, tapi gagal disimpan ke database/settings.json (akan kembali ke config.js setelah restart)*'
        }
    },

    // Pesan global untuk semua command on/off
    toggleMessages: {
        on: (type) => `*✅ ${type} Diaktifkan*`,
        off: (type) => `*❌ ${type} Dinonaktifkan*`,
        example: (prefix, command, options = ['on', 'off']) =>
            `*Contoh:*\n${options.map(o => `${prefix}${command} ${o}`).join('\n')}`
    },

    // Pesan ketika akses fitur ditolak
    accessDenied: {
        owner: '❌ *khusus Owner*',
        creator: '❌ *khusus Creator*',
        premium: '❌ *khusus Premium*'
    }
}