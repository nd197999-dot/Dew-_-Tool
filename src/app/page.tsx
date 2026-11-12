
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Account = {
  id: string;
  label: string;
  game_uid: string | null;
  status: string;
};

export default function Home() {
  const supabase = createClient();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [message, setMessage] = useState('Đang tải dữ liệu...');

  async function loadAccounts() {
    const { data, error } = await supabase
      .from('game_accounts')
      .select('id,label,game_uid,status')
      .order('created_at', { ascending: false });

    if (error) setMessage('Lỗi tải dữ liệu: ' + error.message);
    else {
      setAccounts(data || []);
      setMessage('');
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function addAccount(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setMessage('Bạn cần đăng nhập lại.');
      return;
    }

    const { error } = await supabase.from('game_accounts').insert({
      owner_id: data.user.id,
      label: email.trim(),
      game_uid: uid.trim() || null,
      status: 'inactive',
    });

    if (error) {
      setMessage('Lỗi: ' + error.message);
    } else {
      setEmail('');
      setUid('');
      setMessage('Đã thêm tài khoản thành công!');
      loadAccounts();
    }
  }

  async function deleteAccount(id: string) {
    if (!confirm('Bạn chắc chắn muốn xóa tài khoản này?')) return;

    const { error } = await supabase
      .from('game_accounts')
      .delete()
      .eq('id', id);

    if (error) setMessage('Lỗi: ' + error.message);
    else {
      setMessage('Đã xóa tài khoản.');
      loadAccounts();
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl bg-green-900 p-6 text-white">
          <h1 className="text-2xl font-bold">DEW TOOL</h1>
          <p className="mt-2">Quản lý tài khoản Hoa Viên</p>
        </header>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">Thêm tài khoản game</h2>
          <form onSubmit={addAccount} className="space-y-3">
            <input
              className="w-full rounded-lg border p-3"
              type="email"
              placeholder="Email đăng nhập game"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border p-3"
              placeholder="UID game (không bắt buộc)"
              value={uid}
              onChange={e => setUid(e.target.value)}
            />
            <button className="rounded-lg bg-green-700 px-5 py-3 text-white">
              Thêm tài khoản
            </button>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-4 text-xl font-bold">
            Danh sách tài khoản ({accounts.length})
          </h2>

          {accounts.map(account => (
            <div key={account.id} className="mb-3 rounded-xl border p-4">
              <p className="font-semibold">{account.label}</p>
              <p className="text-sm text-slate-500">
                UID: {account.game_uid || 'Chưa có'}
              </p>
              <p className="mt-1 text-sm text-amber-600">
                Chưa xác thực với game
              </p>
              <button
                onClick={() => deleteAccount(account.id)}
                className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-red-600"
              >
                Xóa tài khoản
              </button>
            </div>
          ))}

          {message && <p className="mt-3 text-sm">{message}</p>}
        </section>
      </div>
    </main>
  );
}
