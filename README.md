# Keii Tools — Sound Sticker Maker

Website statis untuk GitHub Pages. Tidak membutuhkan Supabase, server, atau API key.

## Fitur versi awal
- Upload video dari perangkat.
- Preview video dan audio.
- Pilih waktu mulai dan akhir (maksimal 30 detik).
- Ekspor hasil sebagai WebM dengan audio asli jika browser mendukung `HTMLVideoElement.captureStream()` dan `MediaRecorder`.

## Jalankan di GitHub Pages
1. Buat repository baru, misalnya `keii-tools`.
2. Upload `index.html`, `style.css`, dan `app.js` ke root repository.
3. Buka **Settings → Pages**.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch `main` dan folder `/(root)`, lalu **Save**.
6. Tunggu beberapa menit, kemudian buka URL GitHub Pages yang diberikan.

## Batasan penting
- Ekspor memakai WebM, bukan MP4. Dukungan codec dan `captureStream()` berbeda antar-browser/perangkat.
- Beberapa browser Android dapat membatasi perekaman audio dari elemen video. Jika gagal, coba Chrome terbaru dan file video lokal yang memiliki audio.
- Website ini belum menghasilkan paket Sound Sticker native WhatsApp dan tidak dapat melewati ketersediaan fitur WhatsApp. Gunakan editor WhatsApp jika akun/perangkat mendukung pembuatan Sound Sticker.
- File diproses lokal di browser; tidak diunggah ke server.
- Untuk percobaan pertama gunakan video pendek (5–10 detik) agar lebih ringan.
