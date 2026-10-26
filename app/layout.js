import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'CRUD Produk - Next.js + PostgreSQL',
  description: 'Contoh aplikasi CRUD dengan Next.js dan PostgreSQL',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
