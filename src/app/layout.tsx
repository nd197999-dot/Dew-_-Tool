import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'HOAVIEN AUTO', description: 'Nền tảng quản lý Hoa Viên' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
