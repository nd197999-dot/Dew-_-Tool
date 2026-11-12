import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEW TOOL | Hoa Viên",
  description: "Quản lý tài khoản và dịch vụ Hoa Viên trên DEW TOOL."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
