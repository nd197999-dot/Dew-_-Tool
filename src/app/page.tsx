import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Flower2, ShieldCheck, Sprout, ShoppingBag, Wallet, Headphones, Users, Activity, ArrowUpRight, CircleHelp } from 'lucide-react';

const nav = [
  { label: 'Tổng quan', href: '/', icon: Activity },
  { label: 'Tài khoản game', href: '#accounts', icon: Users },
  { label: 'Nuôi tài khoản', href: '#nurturing', icon: Sprout },
  { label: 'Xây Hội', href: '#guild', icon: ShieldCheck },
  { label: 'Chợ hoa', href: '#market', icon: ShoppingBag },
  { label: 'Ví & giao dịch', href: '#wallet', icon: Wallet },
  { label: 'Hỗ trợ', href: '#support', icon: Headphones },
];
export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('display_name, role').eq('id', user.id).maybeSingle();
  const name = profile?.display_name || user.email?.split('@')[0] || 'Thành viên';
  return <main className="min-h-screen md:flex">
    <aside className="hidden md:flex md:w-64 md:flex-col bg-[#102b20] text-white p-5">
      <Link href="/" className="flex items-center gap-3 mb-10"><span className="rounded-xl bg-[#b8edca] p-2 text-[#123b29]"><Flower2 size={25}/></span><span><b className="text-lg tracking-wide">HOAVIEN AUTO</b><small className="block text-emerald-200">Quản lý Hoa Viên</small></span></Link>
      <p className="text-xs uppercase tracking-widest text-emerald-300 mb-3">Không gian làm việc</p>
      <nav className="space-y-1">{nav.map(({label,href,icon:Icon},i)=><Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${i===0?'bg-[#24563d] text-white':'text-emerald-100 hover:bg-white/10'}`}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="mt-auto rounded-2xl bg-white/10 p-4"><p className="text-sm font-semibold">Trung tâm trợ giúp</p><p className="mt-1 text-xs text-emerald-100">Cần hỗ trợ khi thiết lập hệ thống?</p><Link href="#support" className="mt-3 inline-flex items-center gap-2 text-sm text-[#c6f4d4]">Gửi yêu cầu <ArrowUpRight size={15}/></Link></div>
    </aside>
    <section className="min-w-0 flex-1">
      <header className="flex items-center justify-between border-b border-emerald-100 bg-white px-4 py-4 md:px-8">
        <div className="flex items-center gap-2 md:hidden"><Flower2 className="text-emerald-700"/><b>HOAVIEN AUTO</b></div>
        <div className="hidden md:block"><p className="text-sm text-slate-500">Không gian làm việc / Tổng quan</p><h1 className="text-xl font-bold">Tổng quan hệ thống</h1></div>
        <div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold">{name}</p><p className="text-xs text-slate-500">{profile?.role || 'customer'}</p></div><form action="/auth/signout" method="post"><button className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Đăng xuất</button></form></div>
      </header>
      <div className="p-4 md:p-8">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#143d2b] to-[#28764d] p-6 text-white md:p-8">
          <p className="text-sm text-emerald-100">Xin chào, {name} 👋</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Chào mừng đến Hoa Viên</h2><p className="mt-2 max-w-2xl text-sm text-emerald-100">Quản lý tài khoản, theo dõi tiến độ và vận hành dịch vụ tại một nơi.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-amber-300"/> Nền tảng đang ở giai đoạn khởi tạo</div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[['Tài khoản game','Chưa kết nối dữ liệu','Users'],['Tác vụ tự động','Worker chưa kết nối','Bot'],['Đơn đang xử lý','Chưa có đơn hàng','Orders'],['Số dư ví','Chưa kích hoạt ví','Wallet']].map(([t,v,k])=><div key={k} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{t}</p><p className="mt-3 text-lg font-bold">{v}</p><p className="mt-2 text-xs text-slate-400">Sẽ cập nhật khi module được kích hoạt</p></div>)}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="font-bold">Các phân hệ</h3><span className="text-xs text-slate-400">Lộ trình triển khai</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['Quản lý tài khoản game','Lưu và phân nhóm tài khoản'],['Auto Hoa Viên','Hàng đợi và worker thực tế'],['Nuôi tài khoản','Theo dõi tiến độ và lịch sử'],['Xây Hội','Quản lý đơn và nhiệm vụ'],['Chợ hoa','Sản phẩm và giao dịch'],['Ví điện tử','Nạp/rút và đối soát']].map(([t,d])=><div key={t} className="flex gap-3 rounded-xl bg-[#f5faf6] p-4"><span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-800"><Sprout size={18}/></span><div><p className="text-sm font-semibold">{t}</p><p className="mt-1 text-xs text-slate-500">{d}</p></div></div>)}</div></div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5"><h3 className="font-bold">Trạng thái hệ thống</h3><div className="mt-4 space-y-4 text-sm">{[['Đăng nhập','Đã kết nối'],['Cơ sở dữ liệu','Supabase'],['Automation Worker','Chưa triển khai'],['Thanh toán','Chưa tích hợp']].map(([a,b])=><div key={a} className="flex items-center justify-between gap-2"><span className="text-slate-600">{a}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{b}</span></div>)}</div><p className="mt-5 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><CircleHelp size={16} className="shrink-0"/> Chỉ hiển thị tác vụ chạy khi worker thực tế gửi heartbeat và cập nhật trạng thái.</p></div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">HOAVIEN AUTO · v0.2.0 · Nền tảng đang được xây dựng theo từng giai đoạn</p>
      </div>
    </section>
  </main>;
}
