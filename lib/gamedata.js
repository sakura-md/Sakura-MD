/*
  Made By Seikagenou
  Telegram : t.me/seikagenou
  Mohon Untuk Tidak Menghapus, Mengedit, dll Watermark Di Dalam Kode Ini
*/
// Bank soal bawaan (ditulis untuk Sakura-MD). Soal gambar/logo dibaca dari database/games/*.json
// yang diisi owner — tidak ada soal gambar palsu.
export const TEBAKKATA = [
    ['Hewan berkaki empat yang suka mengeong', 'kucing'], ['Benda langit yang bersinar di malam hari', 'bulan'], ['Buah kuning panjang kesukaan monyet', 'pisang'],
    ['Alat untuk menulis di papan tulis putih', 'spidol'], ['Kendaraan roda dua berpedal', 'sepeda'], ['Hewan raja hutan', 'singa'],
    ['Minuman hangat dari daun yang diseduh', 'teh'], ['Tempat menyimpan makanan dan minuman agar dingin', 'kulkas'], ['Alat penunjuk waktu di pergelangan tangan', 'jam'],
    ['Bunga nasional Indonesia yang berwarna putih harum', 'melati'], ['Makanan pokok dari beras yang ditanak', 'nasi'], ['Hewan laut bertentakel delapan', 'gurita'],
    ['Ibu kota negara Jepang', 'tokyo'], ['Planet terdekat dengan matahari', 'merkurius'], ['Alat musik petik berdawai enam', 'gitar']
]
export const SUSUNKATA = ['sakura', 'komputer', 'pelangi', 'jendela', 'kacamata', 'perpustakaan', 'gunung', 'sekolah', 'matahari', 'telepon', 'petualangan', 'semangka', 'kerupuk', 'tetangga', 'universitas', 'bahagia', 'pesawat', 'kalkulator']
export const ASAHOTAK = [
    ['Apa yang makin diambil makin besar?', 'lubang'], ['Punya kepala tapi tak punya otak, punya kaki tapi tak berjalan. Apa itu?', 'jarum'],
    ['Apa yang basah saat mengeringkan?', 'handuk'], ['Semakin banyak kamu ambil, semakin banyak yang kamu tinggalkan. Apa itu?', 'jejak'],
    ['Apa yang naik tapi tak pernah turun?', 'umur'], ['Punya banyak gigi tapi tak bisa menggigit. Apa itu?', 'sisir'],
    ['Apa yang bisa pecah tanpa dijatuhkan atau dipukul?', 'janji'], ['Apa yang selalu di depanmu tapi tak bisa dilihat?', 'masa depan'],
    ['Apa yang punya leher tapi tak punya kepala?', 'botol'], ['Ada di tengah-tengah Jakarta, huruf apa?', 'k']
]
export const SIAPAKAHAKU = [
    ['Aku hewan berkantung dari Australia dan suka melompat. Siapakah aku?', 'kanguru'], ['Aku benda cair yang jatuh dari langit saat mendung. Siapakah aku?', 'hujan'],
    ['Aku presiden pertama Republik Indonesia. Siapakah aku?', 'soekarno'], ['Aku hewan laut terbesar di dunia, bukan ikan. Siapakah aku?', 'paus biru'],
    ['Aku ilmuwan yang mencetuskan teori relativitas. Siapakah aku?', 'einstein'], ['Aku bunga yang mekar di musim semi Jepang dan jadi nama bot ini. Siapakah aku?', 'sakura'],
    ['Aku planet yang dijuluki planet merah. Siapakah aku?', 'mars'], ['Aku burung yang tidak bisa terbang dan hidup di Antartika. Siapakah aku?', 'pinguin']
]
export const CAKLONTONG = [
    ['Kenapa ayam menyeberang jalan? (jawab satu kata: tujuan)', 'seberang'], ['Buah apa yang kalau dimakan bikin ingat rumah sakit?', 'apel'],
    ['Hewan apa yang paling sopan kalau lewat?', 'kura-kura'], ['Kenapa lampu lalu lintas merah tidak pernah kesepian?', 'ada kuning'],
    ['Angka berapa yang paling suka berdiri sendiri?', 'satu'], ['Bulan apa yang paling pendek?', 'februari']
]
export const KUIS = [
    ['Ibu kota Prancis?', 'paris'], ['Berapa jumlah provinsi di pulau Jawa (termasuk DKI dan DIY)?', '6'], ['Planet terbesar di tata surya?', 'jupiter'],
    ['Siapa penulis novel "Laskar Pelangi"?', 'andrea hirata'], ['Hasil dari 12 x 12?', '144'], ['Gunung tertinggi di dunia?', 'everest'],
    ['Lambang kimia untuk air?', 'h2o'], ['Negara dengan jumlah pulau terbanyak (dikenal sebagai negara kepulauan terbesar)?', 'indonesia'],
    ['Benua terkecil di dunia?', 'australia'], ['Sungai terpanjang di Indonesia (Kalimantan)?', 'kapuas'], ['Tahun Indonesia merdeka?', '1945'],
    ['Alat untuk mengukur suhu?', 'termometer'], ['Berapa sisi segitiga?', '3'], ['Mata uang Jepang?', 'yen'], ['Hewan tercepat di darat?', 'cheetah']
]
export const FAMILY100 = [
    { q: 'Sebutkan buah yang berwarna merah', a: ['apel', 'stroberi', 'semangka', 'cherry', 'tomat', 'delima'] },
    { q: 'Sebutkan benda yang ada di kamar tidur', a: ['kasur', 'bantal', 'selimut', 'lemari', 'guling', 'kipas'] },
    { q: 'Sebutkan hewan peliharaan', a: ['kucing', 'anjing', 'kelinci', 'hamster', 'ikan', 'burung'] },
    { q: 'Sebutkan alat transportasi umum', a: ['bus', 'kereta', 'angkot', 'pesawat', 'kapal', 'ojek'] },
    { q: 'Sebutkan makanan khas Indonesia', a: ['rendang', 'nasi goreng', 'sate', 'gado-gado', 'soto', 'bakso'] },
    { q: 'Sebutkan warna pelangi', a: ['merah', 'jingga', 'kuning', 'hijau', 'biru', 'ungu'] }
]
export const BENDERA = [
    ['🇮🇩', 'indonesia'], ['🇯🇵', 'jepang'], ['🇰🇷', 'korea selatan'], ['🇧🇷', 'brasil'], ['🇫🇷', 'prancis'], ['🇩🇪', 'jerman'], ['🇮🇹', 'italia'],
    ['🇪🇸', 'spanyol'], ['🇬🇧', 'inggris'], ['🇺🇸', 'amerika serikat'], ['🇨🇦', 'kanada'], ['🇦🇺', 'australia'], ['🇮🇳', 'india'], ['🇨🇳', 'tiongkok'],
    ['🇲🇾', 'malaysia'], ['🇸🇬', 'singapura'], ['🇹🇭', 'thailand'], ['🇵🇭', 'filipina'], ['🇻🇳', 'vietnam'], ['🇸🇦', 'arab saudi'], ['🇹🇷', 'turki'],
    ['🇪🇬', 'mesir'], ['🇿🇦', 'afrika selatan'], ['🇦🇷', 'argentina'], ['🇲🇽', 'meksiko'], ['🇷🇺', 'rusia'], ['🇳🇱', 'belanda'], ['🇵🇹', 'portugal']
]
export const TRUTH = [
    'Apa hal paling memalukan yang pernah kamu alami di sekolah/kantor?', 'Siapa orang terakhir yang kamu stalk di media sosial?', 'Apa kebiasaan anehmu yang jarang orang tahu?',
    'Pernahkah kamu pura-pura sakit supaya tidak masuk? Ceritakan.', 'Apa mimpi terkonyol yang pernah kamu ingat?', 'Hal apa yang paling kamu sesali tahun ini?',
    'Lagu apa yang diam-diam kamu suka tapi malu mengaku?', 'Apa ketakutan terbesarmu yang terdengar sepele?', 'Kapan terakhir kali kamu menangis dan kenapa?',
    'Siapa teman di grup ini yang paling kamu percayai dan kenapa?', 'Apa pekerjaan impianmu waktu kecil?', 'Apa hal terbaik yang pernah orang lain lakukan untukmu?'
]
export const DARE = [
    'Kirim voice note menyanyikan satu bait lagu favoritmu.', 'Ganti foto profilmu jadi foto lucu selama 1 jam.', 'Kirim sticker paling random yang kamu punya ke grup.',
    'Ceritakan lelucon terburukmu sekarang juga.', 'Ketik pesan berikutnya tanpa huruf "a".', 'Tiru gaya bicara salah satu anggota grup selama 3 pesan.',
    'Kirim foto benda terdekat di sekitarmu dan ceritakan kenangan tentangnya.', 'Kirim pujian tulus untuk 3 orang di grup ini.', 'Bicara dengan aksen daerah pilihanmu selama 5 menit.',
    'Tulis puisi 2 baris tentang makanan yang kamu makan hari ini.'
]