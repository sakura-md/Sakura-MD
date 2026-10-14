🌸 Sakura-MD

<p align="center">
  <b>Advanced WhatsApp Bot Framework</b><br>
  Modular • Extensible • Developer-Friendly
</p><p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-ff69b4?style=for-the-badge" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/Node.js-ESM-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Baileys-@sakuraa%2Fbaileys-8A2BE2?style=for-the-badge" alt="Sakuraa Baileys">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License">
</p><p align="center">
  Sakura-MD adalah bot WhatsApp berbasis Node.js dengan sistem plugin modular yang dirancang agar mudah dikembangkan, dikonfigurasi, dan diperluas sesuai kebutuhan.
</p>---

📑 Daftar Isi

- "Tentang Proyek" (#-tentang-proyek)
- "Informasi Proyek" (#-informasi-proyek)
- "Fitur Utama" (#-fitur-utama)
- "Sistem Menu" (#-sistem-menu)
- "Sistem Plugin" (#-sistem-plugin)
- "Struktur Direktori" (#-struktur-direktori)
- "Teknologi" (#-teknologi)
- "Lisensi" (#-lisensi)

---

🌸 Tentang Proyek

Sakura-MD merupakan framework bot WhatsApp yang menggunakan JavaScript ES Modules dan package "@sakuraa/baileys".

Dengan arsitektur berbasis plugin, setiap fitur dapat dikelola secara terpisah tanpa harus mengubah keseluruhan sistem utama.

✨ Keunggulan

- 🧩 Modular Architecture — fitur dipisahkan berdasarkan kategori.
- ⚙️ Flexible Configuration — konfigurasi bot dapat disesuaikan.
- 🚀 Extensible System — mudah menambahkan plugin baru.
- 📚 Dynamic Menu — daftar command mengikuti plugin yang dimuat.
- 🛠️ Developer-Friendly — struktur proyek dirancang untuk memudahkan pengembangan.

---

📌 Informasi Proyek

Properti| Detail
Nama| Sakura-MD
Versi| 1.0.0
Author| Seika
Runtime| Node.js
Module System| ES Modules
WhatsApp Library| "@sakuraa/baileys"
License| MIT

---

🚀 Fitur Utama

🤖 Artificial Intelligence

Fitur AI untuk percakapan, pemrosesan media, dan berbagai tools berbasis kecerdasan buatan.

- AI Chat
- AI Tools
- AI Vision
- AI Mood
- Configurable AI Models
- Token Limit Configuration

Konfigurasi model AI dan batas token dapat disesuaikan melalui "config.js", sesuai dukungan implementasi yang tersedia.

📥 Downloader & Web Tools

Berbagai tools untuk mengunduh media dan mengakses layanan berbasis web.

- TikTok Downloader
- YouTube Downloader
- YouTube Play
- Spotify Tools
- HD Image
- HD Video
- Media Tools
- Link Bypass
- Website Bypass

👥 Group Management

Kumpulan fitur administrasi grup WhatsApp.

- Add / Remove Members
- Promote / Demote Admins
- Admin & Member List
- Tag All
- Hidden Mention
- Open / Close Group
- Lock / Unlock Group
- Set Group Name
- Set Group Description
- Set Group Profile Picture
- Welcome & Goodbye Message
- Group Information
- Group Backup
- Slowmode
- Anti-Bot
- Group Bio
- Group CN
- Dan berbagai fitur manajemen grup lainnya

🛡️ Group Protection

Sistem proteksi untuk membantu menjaga ketertiban grup.

- Anti-Link
- Anti-Bot
- Anti-Flood
- Anti-Spam
- Anti-Raid
- Anti-Mention
- Anti-Media
- Anti-Sticker
- Anti-Toxic
- Warning System
- Warning Limit
- Reset Warning
- Toxic Management

🎮 Games & RPG

Kumpulan permainan interaktif dan fitur hiburan.

- Dino
- Tetris
- Sonic
- Geometry
- Tic Tac Toe
- Block Game
- Mini Games
- RPG System

🎨 Ephoto Effects

Tools untuk membuat gambar dengan efek teks melalui layanan Ephoto.

- Ephoto Menu
- Text Effects
- Image Effects

🖼️ Sticker & Media Processing

Fitur untuk pembuatan stiker dan pemrosesan media.

- Sticker Maker
- Media Converter
- Image Processing
- Video Processing
- Media Upload
- Image FX
- Video FX

📱 APK Tools

Tools untuk membaca dan memproses informasi file APK.

- APK Menu
- APK Information
- APK Processing
- APK Verification

🔍 TikTok Stalker & Verification

Tools terkait informasi TikTok dan sistem verifikasi.

- TikTok Verification
- Unverify
- TikTok Information
- Verification List
- Stalker Tools

🔧 Utilities

Berbagai utilitas tambahan untuk kebutuhan bot.

- Text Developer
- HD Image & Video
- Media Tools
- Link Bypass
- Website Bypass
- NGL Spam
- URL Checker
- Utility Tools

📜 Primbon

Kategori khusus yang menyediakan berbagai fitur dan tools Primbon.

💰 Rental System

Sistem penyewaan bot dengan beberapa pilihan durasi.

- Rental 7 Days
- Rental 30 Days
- Rental 90 Days
- Configurable Payment Settings
- Configurable Rental Contact
- Expiration Reminders

Pengaturan sistem sewa dapat disesuaikan melalui "config.js".

---

🌸 Menu System

Sakura-MD menyediakan dua menu utama untuk mengakses fitur bot.

".menu"

Menampilkan menu utama dengan tampilan informatif dan kategori fitur.

Fitur menu:

- 🌸 Auto Reaction
- 🖼️ Thumbnail
- ⚡ Interactive Menu
- 📂 Feature Categories
- 👤 User Information
- 🤖 Bot Information
- 🎵 Sakura Audio ("Sakura.mp3")

".allmenu"

Menampilkan seluruh kategori dan command yang tersedia berdasarkan plugin yang berhasil dimuat.

Sistem menu dinamis membantu menjaga daftar command agar tetap selaras dengan plugin yang terpasang.

---

🧩 Plugin Architecture

Sakura-MD menggunakan sistem plugin modular untuk memisahkan fitur berdasarkan kategori.

Keuntungan sistem plugin:

- Menambahkan fitur tanpa mengubah banyak bagian sistem utama.
- Mengelompokkan command agar lebih mudah dikelola.
- Mempermudah pemeliharaan dan debugging.
- Memudahkan pengembangan fitur baru.

📁 Struktur Direktori

Sakura-MD/
├── config.js
├── index.js
├── handler.js
├── package.json
│
├── database/
│   └── ...
│
├── lib/
│   └── ...
│
└── plugins/
    ├── ai/
    ├── apk/
    ├── cek/
    ├── downloader/
    ├── ephoto/
    ├── game/
    ├── group/
    ├── installer/
    ├── menu/
    ├── npm/
    ├── owner/
    ├── ping/
    ├── primbon/
    ├── proteksi/
    ├── rpg/
    ├── script/
    ├── sewa/
    ├── shell/
    ├── stalker/
    ├── sticker/
    └── tools/

Catatan: struktur di atas merupakan gambaran umum. Sesuaikan dengan direktori yang benar-benar tersedia di repositori.

---

🛠️ Teknologi

Teknologi| Kegunaan
Node.js| Runtime JavaScript
JavaScript ES Modules| Sistem modul
"@sakuraa/baileys"| Integrasi WhatsApp
JSON| Penyimpanan konfigurasi atau data tertentu

---

📦 Pengembangan

Sakura-MD dirancang agar dapat dikembangkan lebih lanjut melalui sistem plugin.

Kontribusi berupa perbaikan bug, peningkatan performa, dokumentasi, dan fitur baru dapat disesuaikan dengan struktur proyek serta ketentuan repositori.

---

🔄 Auto Restart

Bot otomatis restart saat file inti diperbarui (index.js, handler.js, config.js, package.json, dan folder lib/). Cara kerjanya:

- `node index.js` / `npm start` tetap sama; bot berjalan di bawah supervisor (lib/supervisor.js).
- Perubahan dipantau tiap 2 detik dan restart baru dilakukan setelah file berhenti berubah (aman untuk upload/ekstrak zip atau git pull).
- File .js yang punya error sintaks tidak memicu restart; bot tetap jalan dengan kode lama dan error ditampilkan di console.
- Plugin sudah hot-reload sendiri, jadi tidak ikut memicu restart. Tambahkan 'plugins' ke `autoRestart.watch` di config.js kalau mau.
- Restart manual: `.restart` (khusus creator).
- Nonaktifkan lewat `autoRestart.enabled = false` di config.js. Kalau proses sudah dikelola pm2, jalankan dengan env `SAKURA_NO_SUPERVISOR=1`.

---

📄 Lisensi

Proyek ini menggunakan lisensi MIT.

Silakan merujuk ke file "LICENSE" di repositori untuk melihat ketentuan penggunaan, modifikasi, dan distribusi.

---

<p align="center">
  🌸 <b>Sakura-MD</b><br>
  <i>Built for flexibility, designed for extensibility.</i>
</p>