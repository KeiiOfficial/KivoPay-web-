# NexusChat — Social & Siputzx Multi-AI Web App (GitHub Pages Ready)

Aplikasi web chat modern ala WhatsApp Web yang 100% statis (HTML, CSS, JS murni) sehingga siap langsung di-upload ke **GitHub** dan di-hosting gratis menggunakan **GitHub Pages**.

## Fitur Utama
1. **Siputzx Multi-AI Auto-Fallback (Tanpa Perlu API Key):**
   - **Utama:** `https://api.siputzx.my.id/api/ai/gptoss120b` (`?prompt=...&system=...&temperature=0.7`)
   - **Cadangan 1:** `https://api.siputzx.my.id/api/ai/glm47flash` (`?prompt=...&system=...&temperature=0.7`)
   - **Cadangan 2:** `https://api.siputzx.my.id/api/ai/metaai` (`?query=...`)
   - Jika satu endpoint lambat (>16 detik), error, atau mati, sistem otomatis berpindah ke endpoint berikutnya tanpa menghentikan percakapan.
2. **Real-Time Chat & Cari Teman:**
   - **Multi-Tab Real-Time:** Langsung sinkron antar-tab browser melalui `BroadcastChannel` dan `localStorage`.
   - **Firebase Cloud (Opsional):** Tempel konfigurasi Firebase Realtime Database JSON di menu Pengaturan agar chat online lintas perangkat.
3. **Dark Mode & Light Mode:**
   - Tombol pengubah tema instan di pojok kiri bawah.

## Cara Upload ke GitHub & Aktifkan GitHub Pages
1. Ekstrak file `.zip` ini sehingga terlihat file `index.html`, `style.css`, `app.js`, dan `README.md` di folder utama (jangan di dalam subfolder lagi).
2. Buat repository baru di GitHub, lalu upload keempat file tersebut ke root repository.
3. Buka tab **Settings** → **Pages** di repository GitHub kamu.
4. Pada bagian **Build and deployment** → **Branch**, pilih `main` (folder `/ (root)`), lalu klik **Save**.
5. Tunggu ~1 menit, link website kamu (`https://username.github.io/nama-repo/`) siap digunakan!
