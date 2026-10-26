# CRUD Produk — Next.js + PostgreSQL

Aplikasi CRUD sederhana (Create, Read, Update, Delete) untuk data "produk",
dibangun dengan Next.js App Router dan database PostgreSQL lokal.

## Struktur Project

```
app/
  api/products/route.js         -> GET (list), POST (create)
  api/products/[id]/route.js    -> GET (detail), PUT (update), DELETE
  api/categories/route.js       -> GET (list), POST (create)
  page.js                       -> Halaman utama (tabel + form)
  layout.js
  globals.css
lib/
  db.js                         -> Koneksi pool PostgreSQL
schema.sql                      -> Skema tabel `products`
migrations/
  001_add_categories.sql        -> Tabel `categories` + relasi ke products
.env.local.example              -> Contoh environment variables
```

## 1. Siapkan Database PostgreSQL Lokal

Project ini memakai PostgreSQL yang terpasang di komputer kamu sendiri.

1. Pastikan PostgreSQL sudah terpasang dan berjalan:
   ```bash
   brew services start postgresql@18
   ```
2. Buat database-nya:
   ```bash
   createdb crud_produk
   ```
3. Buat tabel dan data kategorinya:
   ```bash
   psql -d crud_produk -f schema.sql
   psql -d crud_produk -f migrations/001_add_categories.sql
   ```

Kedua file SQL tersebut aman dijalankan berulang kali (memakai
`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, dan `ON CONFLICT`).

## 2. Setup Project Secara Lokal

```bash
npm install
cp .env.local.example .env.local
```

Isi `.env.local` sesuai PostgreSQL di komputer kamu:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your-postgres-user
DB_PASSWORD=
DB_NAME=crud_produk
DB_SSL=false
```

Catatan:

- `DB_USER` biasanya nama user macOS kamu (`whoami`), karena Homebrew membuat
  role Postgres dengan nama yang sama saat instalasi.
- `DB_PASSWORD` boleh kosong untuk Postgres lokal yang memakai autentikasi
  `trust` (default Homebrew).
- `DB_SSL=true` hanya perlu kalau server mewajibkan SSL.

Jalankan secara lokal:

```bash
npm run dev
```

Buka http://localhost:3000 — kamu akan melihat form tambah produk dan tabel daftar produk.

## 3. Push ke GitHub

```bash
git init
git add .
git commit -m "CRUD produk Next.js + PostgreSQL"
git branch -M main
git remote add origin https://github.com/username/nama-repo.git
git push -u origin main
```

Pastikan `.env.local` **tidak** ikut ter-commit (sudah otomatis diabaikan lewat `.gitignore`).

## 4. Deploy ke Vercel

Ada satu batasan yang tidak bisa dilewati: **Vercel tidak bisa menjangkau
`localhost`**. Server Vercel berjalan di cloud, sedangkan PostgreSQL kamu
berjalan di komputer sendiri. Jadi database-nya harus pindah ke host yang bisa
diakses publik.

### 4a. Buat service PostgreSQL di Aiven

1. Login ke https://console.aiven.io, buat service baru → pilih **PostgreSQL**
   → plan **Free**. Tidak perlu kartu kredit.
2. Tunggu sampai status **Running**.
3. Buka tab **Overview**, catat `Host`, `Port`, `User` (`avnadmin`),
   `Password`, dan `Database name` (default `defaultdb`).
4. Di halaman yang sama, download **CA Certificate** (`ca.pem`). Kalau project
   Aiven-mu baru, sertifikat ini berbeda dari `ca.pem` lama yang ada di repo —
   pakai yang baru.
5. Bentuk connection string-nya:

   ```text
   postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require
   ```

6. Buat tabelnya dari komputer kamu:

   ```bash
   psql "postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require" \
     -f schema.sql
   psql "postgresql://avnadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require" \
     -f migrations/001_add_categories.sql
   ```

### 4b. Deploy lewat dashboard Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. **Add New → Project**, lalu import repo project ini.
3. Di bagian **Environment Variables**, tambahkan dua variabel:
   - `DATABASE_URL` → connection string dari langkah 4a
   - `DB_CA_CERT` → hasil `base64 -i ca.pem | tr -d '\n'` (satu baris panjang)
4. Klik **Deploy**.

`DB_CA_CERT` membuat koneksi diverifikasi penuh terhadap CA Aiven. Kalau
variabel ini dikosongkan, koneksi tetap terenkripsi tetapi sertifikat server
tidak diverifikasi — masih jalan, hanya kurang aman.

Kalau `DATABASE_URL` sudah diisi, aplikasi otomatis mengabaikan `DB_HOST`,
`DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, dan `DB_SSL`.

### 4c. Deploy lewat Vercel CLI

```bash
npm i -g vercel
vercel login
vercel link
vercel env add DATABASE_URL production
vercel env add DB_CA_CERT production
vercel --prod
```

### Kalau tetap ingin memakai PostgreSQL lokal

Kamu perlu membuat PostgreSQL di komputer ini bisa diakses dari internet —
misalnya lewat tunnel (Cloudflare Tunnel, ngrok) — lalu isi `DATABASE_URL`
dengan alamat tunnel tersebut. Cara ini bekerja, tapi tidak disarankan untuk
pemakaian jangka panjang karena komputer harus selalu menyala dan database
lokal terbuka ke publik.

## Fitur

- **Create**: tambah produk baru lewat form (nama, deskripsi, harga, kategori)
- **Read**: daftar semua produk otomatis dimuat saat halaman dibuka
- **Update**: klik "Edit" pada baris produk untuk mengubah data
- **Delete**: klik "Hapus" untuk menghapus produk (dengan konfirmasi)

## Catatan

- Kalau ingin menambah kolom atau tabel baru, cukup ubah `schema.sql` dan
  sesuaikan query di `app/api/products/`.
- Nama kategori bersifat unik, jadi menambah kategori dengan nama yang sudah
  ada akan ditolak (HTTP 409).
- Untuk validasi input yang lebih ketat atau autentikasi (login admin), beri
  tahu saya — bisa ditambahkan.
