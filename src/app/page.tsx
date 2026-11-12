
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Account = {
  id: string;
  label: string;
  game_uid: string | null;
  status: string;
  auth_status: string;
  auto_enabled: boolean;
  auth_error_message: string | null;
};

type AccountEvent = {
  id: string;
  game_account_id: string;
  event_type: string;
  message: string;
  created_at: string;
};

type Package = {
  id: string;
  name: string;
  duration_days: number;
  price: number;
};

type Deposit = {
  id: string;
  amount: number;
  transfer_code: string;
  status: string;
  created_at: string;
};

type Subscription = {
  id: string;
  package_name: string;
  duration_days: number;
  total_paid: number;
  starts_at: string;
  ends_at: string;
  status: string;
};

export default function Home() {
  const supabase = createClient();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<AccountEvent[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [balance, setBalance] = useState(0);

  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [message, setMessage] = useState('Đang tải dữ liệu...');
  const [busy, setBusy] = useState(false);

  const money = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN') + 'đ';

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage('Bạn cần đăng nhập lại.');
      return;
    }

    const userId = userData.user.id;

    const [a, p, w, d, s, ev] = await Promise.all([
      supabase.from('game_accounts')
        .select('id,label,game_uid,status,auth_status,auto_enabled,auth_error_message')
        .order('created_at', { ascending: false }),

      supabase.from('service_packages')
        .select('id,name,duration_days,price')
        .eq('active', true)
        .order('duration_days'),

      supabase.from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle(),

      supabase.from('deposit_requests')
        .select('id,amount,transfer_code,status,created_at')
        .order('created_at', { ascending: false }),

      supabase.from('nurturing_subscriptions')
        .select('id,package_name,duration_days,total_paid,starts_at,ends_at,status')
        .order('created_at', { ascending: false }),

      supabase.from('game_account_events')
        .select('id,game_account_id,event_type,message,created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (a.error) {
      setMessage('Lỗi tài khoản: ' + a.error.message);
      return;
    }

    if (p.error || d.error || s.error || ev.error) {
      setMessage(
        'Lỗi tải dữ liệu: ' +
        (p.error?.message || d.error?.message || s.error?.message || ev.error?.message)
      );
      return;
    }

    setAccounts((a.data || []) as Account[]);
    setEvents((ev.data || []) as AccountEvent[]);
    setPackages((p.data || []) as Package[]);
    setBalance(Number(w.data?.balance || 0));
    setDeposits((d.data || []) as Deposit[]);
    setSubscriptions((s.data || []) as Subscription[]);

    if (a.data?.length && !a.data.some(x => x.id === selectedAccount)) {
      setSelectedAccount(a.data[0].id);
    }

    setMessage('');
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addAccount(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setMessage('Bạn cần đăng nhập lại.');
      setBusy(false);
      return;
    }

    const { error } = await supabase.from('game_accounts').insert({
      owner_id: data.user.id,
      label: email.trim(),
      game_uid: uid.trim() || null,
      status: 'inactive',
      auth_status: 'not_linked',
      auto_enabled: false,
    });

    if (error) {
      setMessage('Lỗi thêm tài khoản: ' + error.message);
    } else {
      setEmail('');
      setUid('');
      setMessage('Đã thêm tài khoản thành công!');
      await loadData();
    }

    setBusy(false);
  }

  async function deleteAccount(id: string) {
    if (!confirm('Bạn chắc chắn muốn xóa tài khoản này?')) return;

    const { error } = await supabase
      .from('game_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage('Lỗi: ' + error.message);
    } else {
      setMessage('Đã xóa tài khoản.');
      if (selectedAccount === id) setSelectedAccount('');
      await loadData();
    }
  }

  async function toggleAuto(account: Account) {
    const nextValue = !account.auto_enabled;

    setBusy(true);

    const { error } = await supabase
      .from('game_accounts')
      .update({ auto_enabled: nextValue })
      .eq('id', account.id);

    if (error) {
      setMessage('Không cập nhật được: ' + error.message);
    } else {
      setMessage(
        nextValue
          ? 'Đã lưu lựa chọn bật chế độ tự động.'
          : 'Đã lưu lựa chọn tắt chế độ tự động.'
      );
      await loadData();
    }

    setBusy(false);
  }

  async function createDeposit(e: React.FormEvent) {
    e.preventDefault();

    const value = Number(amount);

    if (!Number.isFinite(value) || value < 10000) {
      setMessage('Số tiền nạp tối thiểu là 10.000đ.');
      return;
    }

    setBusy(true);

    const { data, error } = await supabase.rpc(
      'create_deposit_request',
      { p_amount: value }
    );

    if (error) {
      setMessage('Không tạo được yêu cầu: ' + error.message);
    } else {
      setMessage('Đã tạo yêu cầu nạp tiền. Mã chuyển khoản: ' + data);
      setAmount('');
      await loadData();
    }

    setBusy(false);
  }

  async function buyPackage(packageId: string, packageName: string) {
    if (!selectedAccount) {
      setMessage('Bạn cần chọn tài khoản game trước.');
      return;
    }

    if (!confirm('Xác nhận mua ' + packageName + ' bằng số dư ví?')) {
      return;
    }

    setBusy(true);

    const { error } = await supabase.rpc(
      'purchase_nurturing_package',
      {
        p_package_id: packageId,
        p_game_account_id: selectedAccount,
      }
    );

    if (error) {
      setMessage('Mua gói chưa thành công: ' + error.message);
    } else {
      setMessage('Mua gói thành công!');
      await loadData();
    }

    setBusy(false);
  }

  const selectedEvents = events.filter(
    item => item.game_account_id === selectedAccount
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-3xl space-y-5">

        <header className="rounded-2xl bg-green-950 p-6 text-white">
          <h1 className="text-3xl font-bold">DEW TOOL</h1>
          <p className="mt-2 text-green-100">
            Hệ thống quản lý dịch vụ Hoa Viên
          </p>
          <p className="mt-2 text-xs text-green-200">
            Quản lý tài khoản - Ví tiền - Gói dịch vụ
          </p>
        </header>

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            {message}
          </div>
        )}

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">SỐ DƯ VÍ CỦA BẠN</p>
          <p className="my-2 text-3xl font-bold text-green-700">
            {money(balance)}
          </p>
          <button
            onClick={loadData}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Làm mới dữ liệu
          </button>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Nạp tiền vào ví</h2>

          <form onSubmit={createDeposit} className="space-y-3">
            <input
              className="w-full rounded-lg border p-3"
              type="number"
              min="10000"
              placeholder="Nhập số tiền muốn nạp (VNĐ)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />

            <button
              disabled={busy}
              className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Đang xử lý...' : 'Tạo yêu cầu nạp tiền'}
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Ví chỉ được cộng tiền khi Admin xác nhận giao dịch.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">Lịch sử nạp tiền</h2>

          {deposits.length === 0 && (
            <p className="text-sm text-slate-500">
              Chưa có yêu cầu nạp tiền.
            </p>
          )}

          {deposits.map(item => (
            <div key={item.id} className="mb-3 rounded-xl border p-3">
              <p className="font-bold">{money(item.amount)}</p>
              <p className="text-sm">Mã: {item.transfer_code}</p>
              <p className="text-sm text-amber-700">
                Trạng thái: {
                  item.status === 'approved' ? 'Đã duyệt' :
                  item.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'
                }
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Tài khoản game</h2>

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

            <button
              disabled={busy}
              className="w-full rounded-lg bg-green-700 px-5 py-3 text-white"
            >
              Thêm tài khoản
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Tài khoản mới thêm chưa được xác thực với máy chủ game.
          </p>

          <div className="mt-4 space-y-3">
            {accounts.map(account => (
              <div key={account.id} className="rounded-xl border p-4">
                <p className="font-semibold">{account.label}</p>

                <p className="text-sm text-slate-500">
                  UID: {account.game_uid || 'Chưa có'}
                </p>

                <p className="mt-2 text-sm">
                  Xác thực: {
                    account.auth_status === 'linked' ? 'Đã xác thực' :
                    account.auth_status === 'checking' ? 'Đang kiểm tra' :
                    account.auth_status === 'error' ? 'Lỗi kết nối' :
                    'Chưa xác thực'
                  }
                </p>

                {account.auth_error_message && (
                  <p className="mt-1 text-sm text-red-600">
                    {account.auth_error_message}
                  </p>
                )}

                <p className="mt-1 text-sm">
                  Chế độ tự động: {
                    account.auto_enabled ? 'Đã bật lựa chọn' : 'Đang tắt'
                  }
                </p>

                <p className="mt-2 text-xs text-amber-700">
                  Lựa chọn bật/tắt chưa khởi chạy tác vụ chăm sóc game thật.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={busy}
                    onClick={() => toggleAuto(account)}
                    className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {account.auto_enabled ? 'Tắt chế độ' : 'Bật chế độ'}
                  </button>

                  <button
                    onClick={() => setSelectedAccount(account.id)}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    Xem lịch sử
                  </button>

                  <button
                    onClick={() => deleteAccount(account.id)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            {accounts.length === 0 && (
              <p className="text-sm text-slate-500">
                Chưa có tài khoản game nào.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">
            Lịch sử hoạt động tài khoản
          </h2>

          <select
            className="mb-4 w-full rounded-lg border p-3"
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
          >
            <option value="">-- Chọn tài khoản --</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>

          {selectedEvents.length === 0 && (
            <p className="text-sm text-slate-500">
              Chưa có lịch sử hoạt động.
            </p>
          )}

          {selectedEvents.map(event => (
            <div key={event.id} className="mb-3 rounded-xl border p-3">
              <p className="font-medium">{event.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(event.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">Mua gói nuôi</h2>

          <label className="mb-2 block text-sm font-medium">
            Chọn tài khoản game
          </label>

          <select
            className="mb-4 w-full rounded-lg border p-3"
            value={selectedAccount}
            onChange={e => setSelectedAccount(e.target.value)}
          >
            <option value="">-- Chọn tài khoản --</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>

          <div className="space-y-3">
            {packages.map(pkg => (
              <div key={pkg.id} className="rounded-xl border p-4">
                <h3 className="text-lg font-bold">{pkg.name}</h3>
                <p className="text-sm text-slate-500">
                  Thời hạn: {pkg.duration_days} ngày
                </p>
                <p className="my-2 text-2xl font-bold text-green-700">
                  {money(pkg.price)}
                </p>
                <button
                  disabled={busy || !selectedAccount}
                  onClick={() => buyPackage(pkg.id, pkg.name)}
                  className="w-full rounded-lg bg-green-700 p-3 font-semibold text-white disabled:opacity-50"
                >
                  Mua bằng ví
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">Gói đã mua</h2>

          {subscriptions.length === 0 && (
            <p className="text-sm text-slate-500">
              Bạn chưa mua gói nào.
            </p>
          )}

          {subscriptions.map(item => (
            <div key={item.id} className="mb-3 rounded-xl border p-3">
              <p className="font-bold">{item.package_name}</p>
              <p className="text-sm">
                Thời hạn: {item.duration_days} ngày
              </p>
              <p className="text-sm">
                Đã thanh toán: {money(item.total_paid)}
              </p>
              <p className="text-sm text-slate-500">
                Kết thúc: {new Date(item.ends_at).toLocaleString('vi-VN')}
              </p>
            </div>
          ))}
        </section>

        <footer className="pb-6 text-center text-xs text-slate-400">
          DEW TOOL © 2026
        </footer>

      </div>
    </main>
  );
}
