# HOAVIEN AUTO — v0.2.0 foundation

Nền tảng khởi đầu: Next.js App Router + TypeScript + Tailwind + Supabase Auth/Postgres.
Hiện có: giao diện dashboard responsive, đăng nhập/đăng ký/đăng xuất, hồ sơ, schema SQL và RLS nền tảng.

> Automation worker, thanh toán VietQR, marketplace và xử lý đơn hàng chưa được bật trong bản này.
> Không hiển thị tác vụ là đang chạy nếu chưa có worker thực sự kết nối.

## 1. Yêu cầu
- Node.js 20+
- Tài khoản Supabase
- GitHub để lưu mã nguồn

## 2. Cấu hình Supabase
1. Tạo project Supabase.
2. Vào SQL Editor, chạy toàn bộ `supabase/schema.sql`.
3. Vào Authentication → Providers, bật Email. Google có thể bật sau khi cấu hình OAuth credentials.
4. Vào Project Settings → API, lấy Project URL và anon/public key.

## 3. Chạy local
```bash
npm install
cp .env.example .env.local
# điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```
Mở http://localhost:3000

## 4. Triển khai
Có thể deploy lên Vercel bằng cách import repository GitHub và khai báo 2 biến môi trường ở trên.
Không đưa `service_role` key vào biến `NEXT_PUBLIC_*` hoặc frontend.
Nếu cần tác vụ nền lâu dài, triển khai worker riêng trên dịch vụ hỗ trợ background process; không chạy worker trong request web.

## 5. Vai trò
Bảng `profiles.role` nhận một trong: `customer`, `staff`, `admin`.
Người dùng mới mặc định là `customer`. Chỉ quản trị viên được cấp quyền admin thông qua SQL chạy trong dashboard Supabase bởi chủ dự án.

## 6. Phạm vi an toàn
- Mật khẩu game không được trả về dashboard list.
- Không lưu mật khẩu game dạng rõ. Khi triển khai module credential, dùng mã hóa phía server với khóa bí mật chỉ nằm ở server.
- RLS đang cô lập dữ liệu theo `auth.uid()`.
- Chỉ tích hợp tự động hóa qua API/SDK/phương thức được trò chơi cho phép.
