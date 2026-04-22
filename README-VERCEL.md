# Deploy ke Vercel

## File yang sudah disiapkan

- `index.html`: frontend dashboard KPI
- `api/kpi-data.js`: endpoint save/load/reset ke Vercel Blob
- `vercel.json`: konfigurasi project Vercel
- `package.json`: dependency `@vercel/blob`
- `.env.example`: contoh environment variable

## Langkah deploy

1. Upload project ini ke GitHub atau import folder ke Vercel.
2. Di Vercel, buat atau connect **Blob Store** ke project.
3. Pastikan environment variable `BLOB_READ_WRITE_TOKEN` tersedia.
   Biasanya Vercel mengisinya otomatis saat Blob Store dihubungkan ke project.
4. Deploy project.

## Cara kerja

- Data cloud disimpan per user ke pathname:
  `kpi-data/<user>.json`
- Tombol `Save Cloud` akan overwrite file JSON user aktif.
- Tombol `Load Cloud` akan mengambil file JSON user aktif.
- Tombol `Reset Cloud` akan menghapus file JSON user aktif.

## Catatan

- Data lokal browser tetap ada sebagai backup cepat.
- Jika `BLOB_READ_WRITE_TOKEN` belum tersedia, endpoint cloud tidak akan bekerja.
- Untuk pengembangan lokal, jalankan `vercel dev` setelah project terhubung ke Vercel.
