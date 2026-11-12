import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Flower2, Wallet, Sprout, Users, ShoppingBag, LifeBuoy, Settings, LogOut, ShieldCheck, Activity } from "lucide-react";

const nav = [
  { href: "/", label: "Tổng quan", icon: Activity },
  { href: "/accounts", label: "Tài khoản game", icon: Users },
  { href: "/nurturing", label: "Nuôi tài khoản", icon: Sprout },
  { href: "/market", label: "Chợ hoa", icon: ShoppingBag },
  { href: "/wallet", label: "Ví & giao dịch", icon: Wallet },
  { href: "/support", label: "Hỗ trợ", icon: LifeBuoy }
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: wallet }, { count: accountCount }, { data: subs }] = await Promise.all([
    supabase.from("profiles").select("display_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase.from("game_accounts").select("id", { count: "exact", head: true }),
    supabase.from("nurturing_subscriptions").select("id,status").eq("status", "active")
  ]);

  const money = Number(wallet?.balance || 0).toLocaleString("vi-VN") + "đ";
  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full border-b border-emerald-950/10 bg-[#103d2c] p-4 text-white md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:p-5">
        <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-wide">
          <span className="rounded-xl bg-emerald-400/15 p-2"><Flower2 className="text-emerald-300" /></span> DEW TOOL
        </Link>
        <p className="mb-5 mt-2 text-xs text-emerald-100/70">NỀN TẢNG HOA VIÊN</p>
        <nav className="grid grid-cols-2 gap-2 md:block md:space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-emerald-50 hover:bg-white/10">
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-5 border-t border-white/15 pt-4 md:absolute md:bottom-5 md:left-5 md:right-5">
          <Link href="/profile" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10"><Settings size={17}/> Hồ sơ & cài đặt</Link>
          {profile?.role === "admin" && <Link href="/admin" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-white/10"><ShieldCheck size={17}/> Quản trị</Link>}
          <form action="/auth/signout" method="post"><button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-emerald-100 hover:bg-white/10"><LogOut size={17}/> Đăng xuất</button></form>
        </div>
      </aside>

      <main className="w-full p-4 md:ml-64 md:p-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm text-slate-500">Bảng điều khiển</p><h1 className="mt-1 text-2xl font-bold">Xin chào, {profile?.display_name || user.email?.split("@")[0] || "bạn"} 👋</h1></div>
          <span className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">Tài khoản đã đăng nhập</span>
        </header>

        <section className="mb-6 rounded-3xl bg-gradient-to-r from-[#103d2c] to-[#176448] p-6 text-white shadow-sm">
          <p className="text-sm text-emerald-100">DEW TOOL · QUẢN LÝ HOA VIÊN</p>
          <h2 className="mt-2 max-w-xl text-2xl font-bold">Mọi tài khoản, dịch vụ và giao dịch trong một nơi.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">Theo dõi dữ liệu thực từ tài khoản của bạn. Tác vụ tự động chỉ hiển thị hoạt động khi Worker được cấu hình và kết nối.</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Số dư ví", money, Wallet],
            ["Tài khoản game", String(accountCount ?? 0), Users],
            ["Gói đang hoạt động", String(subs?.length ?? 0), Sprout],
            ["Vai trò", profile?.role === "admin" ? "Admin" : profile?.role === "staff" ? "Nhân viên" : "Khách hàng", ShieldCheck]
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><Icon size={19} className="text-emerald-700"/></div>
              <p className="mt-3 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Gói dịch vụ</h3><p className="mt-1 text-sm text-slate-500">Giá đang áp dụng trong hệ thống</p>
            <div className="mt-4 space-y-3">
              {[["30 ngày","75.000đ"],["60 ngày","135.000đ"],["150 ngày","260.000đ"]].map(([a,b])=><div key={a} className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm"><span>{a}</span><b>{b}</b></div>)}
            </div>
            <p className="mt-3 text-xs text-slate-400">Giá hiển thị tham khảo; giá thanh toán được xác định từ bảng service_packages trong database.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold">Trạng thái vận hành</h3>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-900">Worker chưa được xác nhận hoạt động</p>
              <p className="mt-1 text-sm leading-6 text-amber-800">Dashboard không tự nhận là đang nuôi tài khoản. Khi Worker kết nối, trạng thái tác vụ và nhật ký sẽ lấy từ database.</p>
            </div>
            <Link href="/accounts" className="mt-4 inline-flex rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white">Quản lý tài khoản</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
