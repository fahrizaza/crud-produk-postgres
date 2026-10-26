import { Pool } from 'pg';

let pool;

// CA certificate Aiven dikirim sebagai base64 lewat DB_CA_CERT
// (generate: base64 -i ca.pem | tr -d '\n').
function readCaCertificate() {
  if (!process.env.DB_CA_CERT) return undefined;
  return Buffer.from(process.env.DB_CA_CERT, 'base64').toString('utf-8');
}

// pg-connection-string v2 menganggap `sslmode=require` sebagai alias
// `verify-full`, padahal libpq (dan dokumentasi Aiven) memakai arti yang lebih
// longgar: TLS wajib, sertifikat tidak diverifikasi. Karena CA Aiven bukan CA
// publik, membiarkan URL diparse apa adanya membuat koneksi ke Aiven ditolak.
// Jadi parameter koneksi diurai di sini dan perilaku SSL ditentukan eksplisit.
function connectionFromUrl(connectionString) {
  const url = new URL(connectionString);
  const sslmode = url.searchParams.get('sslmode') || '';
  const ca = readCaCertificate();

  let ssl;
  if (sslmode === 'disable') {
    ssl = false;
  } else if (ca) {
    // Verifikasi penuh terhadap CA Aiven (paling aman).
    ssl = { ca, rejectUnauthorized: true };
  } else if (sslmode === 'verify-full' || sslmode === 'verify-ca') {
    // Minta verifikasi eksplisit tanpa CA tambahan: percayai CA publik sistem.
    ssl = {};
  } else if (sslmode) {
    // Semantik libpq "require": tetap terenkripsi, sertifikat tidak diverifikasi.
    ssl = { rejectUnauthorized: false };
  } else {
    ssl = false;
  }

  return {
    host: url.hostname,
    port: Number(url.port) || 5432,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    ssl,
  };
}

export function getPool() {
  if (!pool) {
    // DATABASE_URL dipakai untuk database hosted (Aiven, Neon, Supabase, dsb).
    // DB_* dipakai untuk PostgreSQL lokal.
    const connection = process.env.DATABASE_URL
      ? connectionFromUrl(process.env.DATABASE_URL)
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          // Postgres lokal biasanya tanpa SSL; set DB_SSL=true kalau server
          // mewajibkan SSL.
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
        };

    pool = new Pool({
      ...connection,
      max: 5,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}
