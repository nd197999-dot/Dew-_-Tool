'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Flower2 } from 'lucide-react';
export default function Login() {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const router=useRouter();
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{const {error}=await createClient().auth.signInWithPassword({email,password});if(error)throw error;router.replace('/');router.refresh();}catch(err){setError(err instanceof Error?err.message:'Không thể đăng nhập');}finally{setBusy(false);}}
  return <main className="flex min-h-screen items-center justify-center p-4"><div className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm"><div className="mb-7 text-center"><span className="mx-auto inline-flex rounded-2xl bg-emerald-100 p-3 text-emerald-800"><Flower2 size={30}/></span><h1 className="mt-4 text-2xl font-bold">HOAVIEN AUTO</h1><p className="mt-1 text-sm text-slate-500">Đăng nhập vào tài khoản của bạn</p></div><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-emerald-600" placeholder="ban@email.com"/></label><label className="block text-sm font-medium">Mật khẩu<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3 outline-none focus:border-emerald-600" placeholder="••••••••"/></label>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-[#174b32] p-3 font-semibold text-white disabled:opacity-60">{busy?'Đang đăng nhập...':'Đăng nhập'}</button></form><p className="mt-5 text-center text-sm text-slate-500">Chưa có tài khoản? <Link className="font-semibold text-emerald-700" href="/signup">Đăng ký</Link></p></div></main>;
}
