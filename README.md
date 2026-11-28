# Love Hub v5 — WA-Style AI Chat, Media Downloader, Profile Stalker & Love Gacha

## Perbaikan Utama di v5
1. **AI Chat Layout WhatsApp Asli**: Bubble chat proporsional mengikuti panjang teks (kanan hijau untuk pengguna, kiri putih/gelap untuk AI), jam kirim & centang dua, bilah input bulat di bawah, serta format teks tebal otomatis rapi tanpa simbol `**` mentah.
2. **TikTok & Media Downloader Anti-Blank**: Menggunakan pemuatan *Blob* (`referrerPolicy="no-referrer"`) agar video TikTok tidak diblokir *hotlink* saat diputar di preview, ditambah tombol unduh file langsung dan fallback buka tab baru.
3. **Auto-Fallback AI**: Tetap menggunakan urutan `gptoss120b` → `glm47flash` → `metaai` dengan instruksi respons penuh agar jawaban AI tidak terpotong.
