# Golden Kickers Open 2026

A lightweight pendaftaran online GKO 2026 menggunakan React + Vite + Tailwind CSS dan Supabase.

## Apa yang sudah dibuat
- `src/config/gko2026.js`: semua konfigurasi yang mudah disesuaikan, termasuk mapping sabuk, kelas kyorugi, biaya pendaftaran, dan info rekening.
- `src/lib/supabaseClient.js`: inisialisasi Supabase client menggunakan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
-- `src/pages/RegistrationPage.jsx`: alur pendaftaran utama dengan pilihan kategori, form dinamis, ringkasan, upload foto peserta, dan konfirmasi.
-- `src/pages/AdminApp.jsx`: dashboard admin terpisah dengan login Supabase Auth, daftar pendaftar, preview foto peserta, verifikasi status, dan export CSV.
- `public/poomsae.svg`, `public/kyorugi.svg`, `public/weight.svg`: ilustrasi ringan untuk landing dan form.
- `supabase/migrations/001_init.sql`: skema tabel `registrations` dan policy Supabase untuk insert anon dan select/update authenticated.
- `supabase/functions/send-confirmation-email/index.ts`: Supabase Edge Function untuk mengirim email konfirmasi menggunakan Resend.

## Setup lokal
1. Copy file `.env.example` ke `.env`.
2. Isi variabel berikut:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SEND_CONFIRMATION_FUNCTION_URL`
3. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
4. Buka `http://localhost:5173`

## Supabase setup
1. Buat project Supabase baru.
2. Jalankan SQL di `supabase/migrations/001_init.sql` untuk membuat tabel dan policy.
3. Buat storage bucket `athlete-photos` dan set `public=false`.
4. Buat akun admin awal di Auth (email + password).
5. Deploy Edge Function menggunakan kode di `supabase/functions/send-confirmation-email`.
6. Simpan key Resend di Secret Supabase Edge Function sebagai `RESEND_API_KEY`.
7. Isi `VITE_SEND_CONFIRMATION_FUNCTION_URL` di `.env` dengan URL function hasil deploy.

## Supabase Auth & Policy
- Form pendaftaran publik menggunakan `anon` key Supabase.
- Halaman `/admin` dilindungi dengan Supabase Auth.
- `supabase/migrations/001_init.sql` sudah membuat policy untuk:
  - `anon` insert ke `registrations`
  - `authenticated` select dan update pada `registrations`

## Deploy
1. Deploy aplikasi ke Vercel atau Netlify.
2. Set env vars di deployment:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SEND_CONFIRMATION_FUNCTION_URL`

## Catatan penting
- Semua aturan yang mungkin berubah dipisahkan di `src/config/gko2026.js`.
- Halaman admin dimuat secara lazy untuk menjaga bundle pendaftaran utama tetap ringan.
- Upload gambar dikompres di client sebelum dikirim ke Supabase Storage.
- Jika email konfirmasi gagal, pendaftaran tetap berhasil dan error dicatat di console.
