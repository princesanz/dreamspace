# Dreamspace

Portofolio 3D sinematik — pengunjung tidak menggulir halaman, mereka **terbang** menembus void berkabut berisi struktur bercahaya. Vite + Three.js + GSAP/ScrollTrigger + Lenis, tanpa framework.

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # → dist/ (statis, siap Vercel)
npm run preview   # cek hasil build
```

Deploy: unggah `dist/` ke Vercel (atau `vercel --prod` dari root — framework preset: Vite).

## Mengedit konten

| Apa | Di mana |
|---|---|
| Nama hero, semua teks stasiun, microcopy UI, daftar skill, kontak | [src/content.js](src/content.js) |
| 5 karya (nama, deskripsi, tag, URL, warna) | [data/projects.js](data/projects.js) |
| Judul/description/OG meta (duplikat statis dari content.js — sengaja, agar crawlable tanpa JS) | [index.html](index.html) |
| Palet 3D | [src/world/util.js](src/world/util.js) (`COLORS`) |
| Palet UI | [src/style.css](src/style.css) (`:root`) |
| Jalur kamera & posisi stasiun | [src/world/path.js](src/world/path.js) |

Setelah deploy: perbarui `og:url` + `canonical` di index.html dan `SITE.url` di content.js, lalu tambahkan `og:image` (belum disertakan — butuh aset raster).

## Arsitektur

- `src/main.js` — satu loop RAF: Lenis → progress → kamera di CatmullRom → dunia → composer.
- `src/world/` — scene, path, postfx (bloom + grain/CA/vignette), partikel, raycast, dan `islands/` (satu modul per stasiun).
- `src/ui/` — preloader, overlay stasiun, label 3D→HTML, nav + rail, kursor magnetik, drone WebAudio, panel fokus.

## Perilaku adaptif

- FPS < 45 selama 3 detik → bloom ½ resolusi, grain mati, debu ½ (sekali jalan, log di console).
- `prefers-reduced-motion` → tanpa penerbangan kontinu; kamera ease antar stasiun, seksi crossfade, komet/trail/sway mati.
- Sentuh → scroll native, tap monolit untuk fokus, kursor/magnet/trail mati, partikel dikurangi, DPR 1.5.
- Keyboard → ↑/↓ & PgUp/PgDn antar stasiun, Esc menutup panel fokus.
- Tab tersembunyi → loop RAF berhenti total.
