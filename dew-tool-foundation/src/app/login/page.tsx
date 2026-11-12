'use client';
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setMessage("");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){setMessage(error.message);setBusy(false);return;}
    window.location.href="/";
  }
  async function google(){setBusy(true);const {error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback`}});if(error){setMessage(error.message);setBusy(false);}}
  return <main className="grid min-h-screen place-items-center p-4"><section className="w-full max-w-md rounded-3xl border bg-white p-7 shadow-sm">
    <p className="font-black tracking-wide text-emerald-800">✿ DEW TOOL</p><h1 className="mt-5 text-2xl font-bold">Đăng nhập</h1><p className="mt-1 text-sm text-slate-500">Đăng nhập để quản lý dịch vụ Hoa Viên.</p>
    {message&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <form onSubmit={submit} className="mt-5 space-y-3"><input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border p-3"/><input required type="password" autoComplete="current-password" placeholder="Mật khẩu" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border p-3"/><button disabled={busy} className="w-full rounded-xl bg-emerald-800 p-3 font-semibold text-white disabled:opacity-60">{busy?"Đang xử lý...":"Đăng nhập"}</button></form>
    <button disabled={busy} onClick={google} className="mt-3 w-full rounded-xl border p-3 text-sm font-semibold">Tiếp tục với Google</button>
    <div className="mt-5 flex justify-between text-sm"><Link href="/forgot-password" className="text-emerald-800">Quên mật khẩu?</Link><Link href="/signup" className="text-emerald-800">Tạo tài khoản</Link></div>
  </section></main>;
}
