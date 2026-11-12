
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type GameAccount = {
  id: string;
  label: string;
  game_uid: string | null;
  status: string;
  notes: string | null;
};

export default function GameAccounts() {
  const supabase = createClient();

  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [notes, setNotes] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadAccounts() {
    const { data, error } = await supabase
      .from('game_accounts')
      .select('id,label,game_uid,status,notes')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Không tải được dữ liệu: ' + error.message);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!email.trim()) {
      setMessage('Vui lòng nhập email tài khoản game.');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setMessage('Bạn cần đăng nhập lại.');
      return;
    }

    const values = {
      label: email.trim(),
      game_uid: uid.trim() || null,
      notes: notes.trim() || null,
    };

    const result = editing
      ? await supabase.from('game_accounts').update(values).eq('id', editing)
      : await supabase.from('game_accounts').insert({
          ...values,
          owner_id: user.id,
          status: 'inactive',
        });

    if (result.error) {
      setMessage('Lỗi: ' + result.error.message);
      return;
    }

    setEmail('');
    setUid('');
    setNotes('');
    setEditing(null);
    setMessage('Đã lưu tài khoản.');
    loadAccounts();
  }

  function editAccount(account: GameAccount) {
    setEditing(account.id);
    setEmail(account.label);
    setUid(account.game_uid || '');
    setNotes(account.notes || '');
  }

  async function deleteAccount(id: string) {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;

    const { error } = await supabase
      .from('game_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage('Không xóa được: ' + error.message);
    } else {
      setMessage('Đã xóa tài khoản.');
      loadAccounts();
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tài khoản game</h1>
        <p className="text-sm text-gray-500">
          Quản lý danh sách tài khoản Hoa Viên của bạn.
        </p>
      </div>

      <form onSubmit={saveAccount} className="space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">
          {editing ? 'Sửa tài khoản' : 'Thêm tài khoản mới'}
        </h2>

        <input
          className="w-full rounded-lg border p-3"
          placeholder="Email đăng nhập game"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded-lg border p-3"
          placeholder="UID game (nếu có)"
          value={uid}
          onChange={e => setUid(e.target.value)}
        />

        <textarea
          className="w-full rounded-lg border p-3"
          placeholder="Ghi chú"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <button className="rounded-lg bg-pink-600 px-5 py-3 text-white">
          {editing ? 'Cập nhật' : 'Thêm tài khoản'}
        </button>

        {editing && (
          <button
            type="button"
            className="ml-2 rounded-lg border px-4 py-3"
            onClick={() => {
              setEditing(null);
              setEmail('');
              setUid('');
              setNotes('');
            }}
          >
            Hủy
          </button>
        )}

        {message && <p className="text-sm">{message}</p>}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Danh sách tài khoản ({accounts.length})
        </h2>

        {loading ? (
          <p>Đang tải...</p>
        ) : accounts.length === 0 ? (
          <p className="rounded-xl border p-4 text-gray-500">
            Chưa có tài khoản nào.
          </p>
        ) : (
          accounts.map(account => (
            <article key={account.id} className="rounded-xl border p-4">
              <p className="font-semibold">{account.label}</p>
              <p className="text-sm text-gray-500">
                UID: {account.game_uid || 'Chưa có'}
              </p>
              <p className="text-sm text-amber-600">
                Chưa xác thực với game
              </p>
              {account.notes && <p className="mt-2">{account.notes}</p>}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => editAccount(account)}
                  className="rounded-lg border px-3 py-2"
                >
                  Sửa
                </button>
                <button
                  onClick={() => deleteAccount(account.id)}
                  className="rounded-lg border px-3 py-2 text-red-600"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
