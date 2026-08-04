import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function buildCsv(rows) {
  const headers = ['Nama Anak', 'Email Orang Tua', 'Kategori', 'Sabuk', 'Usia', 'Berat (kg)', 'Kelas Hasil', 'Status', 'Tanggal Daftar', 'Bukti Bayar'];
  const csvRows = [headers.join(',')];
  rows.forEach((row) => {
    csvRows.push([
      row.nama_anak,
      row.email_orang_tua,
      row.kategori,
      row.sabuk || '',
      row.usia ?? '',
      row.berat_badan ?? '',
      row.kelas_hasil,
      row.status,
      row.created_at ? new Date(row.created_at).toISOString() : '',
      row.bukti_bayar_url || '',
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(','));
  });
  return csvRows.join('\n');
}

export default function AdminApp() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(data.session);
        fetchRegistrations();
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event, sessionData) => {
      setSession(sessionData?.session || null);
      if (sessionData?.session) {
        fetchRegistrations();
      }
    });

    loadSession();
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/admin');
  };

  const handleStatusUpdate = async (id, status) => {
    const { error: updateError } = await supabase.from('registrations').update({ status }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    fetchRegistrations();
  };

  const filteredRegistrations = useMemo(() => {
    return registrations.filter((row) => {
      const text = `${row.nama_anak} ${row.email_orang_tua ?? ''} ${row.kelas_hasil}`.toLowerCase();
      const matchesSearch = search ? text.includes(search.toLowerCase()) : true;
      const matchesStatus = statusFilter ? row.status === statusFilter : true;
      const matchesCategory = categoryFilter ? row.kategori === categoryFilter : true;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [registrations, search, statusFilter, categoryFilter]);

  const handleExportCsv = () => {
    const csv = buildCsv(filteredRegistrations);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gko2026_registrations.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const openPreview = async (row) => {
    setPreviewError('');
    if (!row.bukti_bayar_url) {
      setPreviewError('Tidak ada bukti bayar untuk ditampilkan.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: urlError } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(row.bukti_bayar_url, 60);
      if (urlError || !data.signedUrl) {
        throw urlError || new Error('Gagal membuat tanda tangan URL');
      }
      setPreviewUrl(data.signedUrl);
    } catch (error) {
      setPreviewError('Gagal memuat bukti bayar.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-card">
          <h1 className="text-3xl font-semibold text-slate-950">Login Admin Panitia</h1>
          <p className="mt-2 text-slate-600">Masuk dengan akun Supabase untuk mengelola pendaftar GKO 2026.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                placeholder="admin@goldenkickers.id"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                placeholder="Masukkan password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Memeriksa...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Dashboard Panitia</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Data Pendaftar GKO 2026</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={fetchRegistrations} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Refresh</button>
          <button onClick={handleExportCsv} className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">Export CSV</button>
          <button onClick={handleLogout} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Logout</button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_240px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Cari</p>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-gold focus:ring-2 focus:ring-amber-200"
                placeholder="Nama, email, kelas"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kategori</p>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-gold focus:ring-2 focus:ring-amber-200">
                <option value="">Semua</option>
                <option value="poomsae">Poomsae</option>
                <option value="kyorugi">Kyorugi</option>
              </select>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Status</p>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-gold focus:ring-2 focus:ring-amber-200">
                <option value="">Semua</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Ringkasan</p>
          <div className="mt-4 space-y-3 text-slate-700">
            <p>Total pendaftar: <span className="font-semibold text-slate-950">{registrations.length}</span></p>
            <p>Hasil filter: <span className="font-semibold text-slate-950">{filteredRegistrations.length}</span></p>
            <p>Status terakhir: <span className="font-semibold text-slate-950">{session.user?.email}</span></p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-4">Nama Anak</th>
              <th className="px-4 py-4">Kategori</th>
              <th className="px-4 py-4">Usia / Sabuk</th>
              <th className="px-4 py-4">Kelas</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Tanggal</th>
              <th className="px-4 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRegistrations.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 font-semibold text-slate-900">{row.nama_anak}</td>
                <td className="px-4 py-4 capitalize">{row.kategori}</td>
                <td className="px-4 py-4">{row.kategori === 'poomsae' ? row.sabuk : `${row.usia} th / ${row.berat_badan} kg`}</td>
                <td className="px-4 py-4">{row.kelas_hasil}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : row.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4">{row.created_at ? formatDate(row.created_at) : '-'}</td>
                <td className="px-4 py-4 space-y-2">
                  <button type="button" onClick={() => openPreview(row)} className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Lihat Bukti</button>
                  <button type="button" onClick={() => handleStatusUpdate(row.id, 'verified')} className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600">Verifikasi</button>
                  <button type="button" onClick={() => handleStatusUpdate(row.id, 'rejected')} className="inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">Tolak</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewUrl && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-900">Pratinjau Bukti Transfer</p>
            <button type="button" onClick={() => setPreviewUrl('')} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Tutup</button>
          </div>
          <div className="rounded-3xl bg-white p-4">
            <iframe src={previewUrl} title="Bukti Pembayaran" className="h-[520px] w-full rounded-3xl border border-slate-200" />
          </div>
        </div>
      )}

      {previewError && <p className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{previewError}</p>}
      {error && <p className="mt-4 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
