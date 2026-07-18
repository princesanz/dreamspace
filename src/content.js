// ============================================================
// DREAMSPACE — semua teks & konfigurasi stasiun di satu file.
// Edit di sini; tidak perlu menyentuh kode dunia 3D.
// ============================================================

export const SITE = {
  name: 'Gilang Arif Afrisda',        // nama lengkap (aria-label, meta, sumber name mark)
  nameLines: ['GILANG', 'ARIF', 'AFRISDA'], // hero: satu kata per baris, tak pernah terpotong
  role: 'Professional Trader · Engineer · Quant', // baris peran di bawah nama
  mark: 'GA·Dreamspace',              // name mark kecil di kiri-atas
  title: 'Gilang Arif Afrisda — Dreamspace · Portofolio 3D',
  description:
    'Portofolio imersif Gilang Arif Afrisda — bukan halaman, tapi ruang. Di persimpangan kode dan pasar: trading, riset kuantitatif, dan web interaktif.',
  url: 'https://dreamspace-gilang.vercel.app', // ganti setelah deploy
  locale: 'id_ID',

  // Slot aset — kosong sekarang, aktif begitu file-nya diletakkan.
  cvUrl: '',        // set '/cv.pdf' setelah taruh public/cv.pdf → tombol Unduh CV aktif
  ambientUrl: '',   // set '/ambient.mp3' setelah taruh public/ambient.mp3 → drone diganti MP3
};

export const HERO = {
  kicker: 'Sebuah perjalanan · bukan halaman',
  sub: 'Di persimpangan kode dan pasar. Gulir untuk terbang.',
  // Petunjuk gulir sudah dibawa oleh `sub`; sisakan garis-tetes sebagai
  // isyarat visual saja (teks dikosongkan agar tidak berulang).
  hint: '',
};

// Stasiun di sepanjang jalur terbang. `progress` = posisi pada kurva (0–1).
// `align` = sisi overlay teks; objek 3D diletakkan di sisi berlawanan.
export const STATIONS = [
  {
    key: 'origin',
    menu: 'Origin',
    kicker: HERO.kicker,
    heading: null, // hero memakai SITE.nameLines
    progress: 0.02,
    align: 'left',
    width: 0.085,
  },
  {
    key: 'about',
    menu: 'About',
    kicker: '01 · Asal',
    heading: 'Dua dunia, satu bahasa',
    body: [
      'Operator SANZ CAPITAL — family office trading yang bergerak lintas aset: ekuitas IDX & AS, crypto, forex, dan emas (XAUUSD). Berlatar Computer Engineering di Telkom University Surabaya, saya bekerja di persimpangan dua dunia.',
      'Di satu sisi, eksekusi trading berbasis market microstructure dan analisis aliran order; di sisi lain, riset kuantitatif yang sistematis. Alih-alih bergantung pada tools jadi, saya membangun infrastruktur sendiri — dari sistem manajemen portofolio, pipeline data & sinyal, hingga mesin backtesting.',
      'Bagi saya, kode dan pasar adalah bahasa yang sama.',
    ],
    progress: 0.22,
    align: 'right',
    width: 0.075,
  },
  {
    key: 'projects',
    menu: 'Karya',
    kicker: '02 · Karya',
    heading: 'Lima monolit',
    body: ['Setiap monolit menyimpan satu karya. Arahkan kursor, lalu klik untuk mendekat.'],
    bodyTouch: ['Setiap monolit menyimpan satu karya. Sentuh monolit untuk mendekat.'],
    progress: 0.45,
    align: 'left',
    width: 0.1,
  },
  {
    key: 'skills',
    menu: 'Skills',
    kicker: '03 · Keahlian',
    heading: 'Konstelasi keahlian',
    body: ['Alat dan bahasa yang saya pakai — saling terhubung, terus bertumbuh. Usik dengan kursormu.'],
    progress: 0.68,
    align: 'right',
    width: 0.075,
  },
  {
    key: 'contact',
    menu: 'Kontak',
    kicker: '04 · Gerbang',
    heading: 'Mendarat di sini',
    body: ['Perjalanan selesai — percakapan baru dimulai. Kirim sinyal.'],
    progress: 0.97,
    align: 'center',
    width: 0.09,
  },
];

export const CONTACT = {
  email: 'gilangafrisda@gmail.com',
  socials: [
    { label: 'GitHub', url: 'https://github.com/princesanz' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/gilang-afrisda-15b7202a3/' },
  ],
};

// Konstelasi keahlian (stasiun 3) — dikelompokkan per domain. Tiap klaster
// punya warna; node-nya berkerumun dekat satu sama lain di ruang 3D.
export const SKILL_CLUSTERS = [
  {
    key: 'quant',
    label: 'Trading & Quant',
    color: '#ffb45e',
    nodes: [
      'Market Microstructure', 'Order Flow', 'Technical Analysis',
      'Backtesting', 'Walk-Forward', 'Risk Management', 'XAUUSD / Forex',
    ],
  },
  {
    key: 'frontend',
    label: 'Frontend',
    color: '#7fd8ff',
    nodes: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Three.js', 'WebGL'],
  },
  {
    key: 'backend',
    label: 'Backend & Data',
    color: '#b9a8ff',
    nodes: ['Supabase', 'PostgreSQL', 'Python', 'pandas', 'vectorbt', 'Node.js'],
  },
  {
    key: 'ai',
    label: 'AI & Automation',
    color: '#d9f6ff',
    nodes: ['MCP (Multi-Agent)', 'LLM API', 'Telegram Bot', 'Binance WebSocket'],
  },
  {
    key: 'hardware',
    label: 'Hardware',
    color: '#ff9d5e',
    nodes: ['PC Building', 'eMMC/UFS Repair', 'Workstation Design'],
  },
];

// Flattened: setiap node membawa indeks klaster + warnanya. Dipakai oleh
// dunia 3D (posisi/warna/edge) dan label melayang.
export const SKILLS = SKILL_CLUSTERS.flatMap((c, ci) =>
  c.nodes.map((name) => ({ name, cluster: ci, color: c.color })),
);

// Microcopy UI — konsisten dengan metafora penerbangan.
export const UI = {
  preloaderLabel: 'Menyiapkan ruang…',
  panelKicker: 'Karya',
  panelVisit: 'Kunjungi proyek ↗',
  panelPrivate: 'Proyek privat',       // saat url kosong: label, bukan tautan mati
  panelClose: 'Kembali ke jalur',
  panelCloseAria: 'Tutup panel dan kembali ke jalur terbang',
  cvLabel: 'Unduh CV',
  cvSoon: 'segera',
  cvSoonAria: 'Unduh CV — segera tersedia',
  audioAria: 'Suara latar',
  audioOn: 'Suara: hidup',
  audioOff: 'Suara: mati',
  railAria: 'Peta stasiun',
  railJump: 'Lompat ke',
  navAria: 'Navigasi stasiun',
  focusHint: 'Esc untuk kembali',
  noscript:
    'Dreamspace butuh JavaScript untuk menerbangkanmu. Versi singkat: Gilang Arif Afrisda — trader, engineer, quant (trading multi-aset, riset kuantitatif, web interaktif). Kontak: gilangafrisda@gmail.com',
};
