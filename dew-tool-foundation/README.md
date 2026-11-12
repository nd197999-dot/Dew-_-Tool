# DEW TOOL – Foundation

Gói này dựng nền tảng ban đầu cho DEW TOOL: Next.js App Router, Supabase SSR Auth, đăng nhập/đăng ký/Google OAuth/khôi phục mật khẩu, Dashboard đọc dữ liệu thật, và migration database có RLS.

## 1. Cài đặt
```bash
npm install
cp .env.example .env.local
```
Điền `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` bằng URL và publishable/anon key của dự án Supabase. Không đưa service role key vào biến `NEXT_PUBLIC_*`.

## 2. Database
Mở Supabase SQL Editor, kiểm tra backup trước, sau đó chạy:
`supabase/migrations/202611130001_dew_tool_foundation.sql`

Migration dùng `IF NOT EXISTS`, không xóa dữ liệu. Nếu dự án đã có bảng/cột cùng tên nhưng schema khác, cần đối chiếu trước khi chạy; không chạy lại schema cũ toàn bộ.

## 3. Auth URL
Trong Supabase Authentication → URL Configuration:
- Site URL: URL production của website.
- Redirect URLs: thêm `http://localhost:3000/auth/callback` và URL production `/auth/callback`.
Bật Google provider và cấu hình OAuth credentials trong Supabase nếu muốn dùng đăng nhập Google.

## 4. Chạy local / deploy
```bash
npm run dev
npm run build
```
Vercel: import repository, đặt hai biến môi trường public ở trên, deploy. Sau khi thay đổi env cần redeploy.

## 5. Những gì đã có trong gói
- Đăng nhập email/mật khẩu, đăng ký và xác thực email qua callback.
- Google OAuth (cần cấu hình provider ở Supabase).
- Quên mật khẩu và đặt mật khẩu mới.
- Dashboard truy vấn hồ sơ, số dư, số tài khoản và gói đang hoạt động từ Supabase.
- Migration nền tảng có bảng tài khoản, ví, gói, đăng ký dịch vụ, hàng đợi Worker, logs và RLS cơ bản.
- Giá gói 30 ngày 75.000đ, 60 ngày 135.000đ, 150 ngày 260.000đ.

## 6. Chưa được coi là hoàn tất
Gói này KHÔNG giả lập rằng bot đang chạy. Chưa có adapter API được trò chơi cho phép, Worker chạy nền, mã hóa thông tin đăng nhập game, quy trình admin duyệt nạp tiền, VietQR/webhook, marketplace, guild orders, rental orders, ticket UI hoặc admin console hoàn chỉnh. Không nhập mật khẩu game vào form/chat trước khi thiết kế lưu trữ mã hóa và kiểm tra phương thức tích hợp được nhà phát hành cho phép.

## 7. Bảo mật quan trọng
- Không cấp quyền sửa `profiles.role` cho khách hàng.
- Không dùng service role key ở trình duyệt.
- Không tự cộng ví dựa trên ảnh chuyển khoản.
- Admin cần được gán role qua thao tác quản trị an toàn, không qua form người dùng.
- Kiểm tra kỹ các policy hiện hữu trước khi đưa hệ thống vào production.
