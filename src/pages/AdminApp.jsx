import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabaseClient';

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function buildCsv(rows) {
  const headers = ['Nama Peserta', 'Email Orang Tua', 'Kategori', 'Usia', 'Berat (kg)', 'Kelas Pertandingan', 'Status', 'Tanggal Daftar', 'Bukti Transfer'];
  const csvRows = [headers.join(',')];
  rows.forEach((row) => {
    csvRows.push([
      row.displayName,
      row.parentEmail,
      row.displayCategory,
      row.displayAge ?? '',
      row.displayWeight ?? '',
      row.displayClass,
      row.displayStatus,
      row.created_at ? new Date(row.created_at).toISOString() : '',
      row.displayProof || '',
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
  const [errorMessage, setErrorMessage] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewError, setPreviewError] = useState('');

  const normalizedRegistrations = useMemo(() => {
    return registrations.map((row) => {
      const normalizedStatus = row.status?.toLowerCase();
      return {
        ...row,
        displayName: row.nama_lengkap || row.nama_anak || '-',
        parentEmail: row.email_orang_tua || row.email_ortu || '-',
        displayClass: row.kelas_pertandingan || row.kelas_hasil || '-',
        displayCategory: row.kategori || '-',
        displayProof: row.bukti_bayar_url || row.buktiBayarUrl || '-',
        displayAge: row.usia ?? '-',
        displayWeight: row.berat_badan ?? '-',
        displayStatus: normalizedStatus === 'approved' || normalizedStatus === 'verified' ? 'Approved' : normalizedStatus === 'rejected' ? 'Rejected' : 'Pending',
      };
    });
  }, [registrations]);

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
    setErrorMessage('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setErrorMessage(authError.message || 'Login gagal. Silakan coba lagi.');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/admin');
  };

  const handleStatusUpdate = async (id, status) => {
    const sanitizedStatus = status?.toLowerCase();
    const { error: updateError } = await supabase.from('registrations').update({ status: sanitizedStatus }).eq('id', id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    fetchRegistrations();
  };

  const filteredRegistrations = useMemo(() => {
    return normalizedRegistrations.filter((row) => {
      const text = `${row.displayName} ${row.parentEmail} ${row.displayCategory} ${row.displayClass}`.toLowerCase();
      const matchesSearch = search ? text.includes(search.toLowerCase()) : true;
      const matchesStatus = statusFilter ? row.displayStatus.toLowerCase() === statusFilter.toLowerCase() : true;
      const matchesCategory = categoryFilter ? row.displayCategory.toLowerCase() === categoryFilter.toLowerCase() : true;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [normalizedRegistrations, search, statusFilter, categoryFilter]);

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

  const handleExportXlsx = () => {
    const worksheetData = filteredRegistrations.map((row) => ({
      'Nama Peserta': row.displayName,
      'Email Orang Tua': row.parentEmail,
      'Kategori': row.displayCategory,
      'Usia': row.displayAge,
      'Berat (kg)': row.displayWeight,
      'Kelas Pertandingan': row.displayClass,
      'Status': row.displayStatus,
      'Tanggal Pendaftaran': row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-',
      'Bukti Transfer': row.displayProof,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    XLSX.writeFile(workbook, 'gko2026_registrations.xlsx');
  };

  const openPreview = async (row) => {
    setPreviewError('');
    const proofUrl = row.displayProof || row.bukti_bayar_url || row.buktiBayarUrl;
    if (!proofUrl) {
      setPreviewError('Tidak ada bukti bayar untuk ditampilkan.');
      return;
    }

    setLoading(true);
    try {
      let previewLink = proofUrl;
      if (!/^https?:\/\//i.test(proofUrl)) {
        const storagePath = proofUrl.replace(/^\/+/, '');
        const { data, error: urlError } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(storagePath, 60);
        if (urlError || !data?.signedUrl) {
          throw urlError || new Error('Gagal membuat tanda tangan URL');
        }
        previewLink = data.signedUrl;
      }
      setPreviewUrl(previewLink);
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
            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
            {error && session && <p className="mt-4 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="inline-flex w-full justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Memproses...' : 'Masuk'}
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
          <button onClick={handleExportXlsx} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Export XLSX</button>
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
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Ringkasan</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Total Pendaftar</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{registrations.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Menunggu Verifikasi</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{normalizedRegistrations.filter((row) => row.displayStatus === 'Pending').length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Terverifikasi</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{normalizedRegistrations.filter((row) => row.displayStatus === 'Approved').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-4">Nama Peserta</th>
              <th className="px-4 py-4">Email Orang Tua</th>
              <th className="px-4 py-4">Kategori</th>
              <th className="px-4 py-4">Usia</th>
              <th className="px-4 py-4">Berat</th>
              <th className="px-4 py-4">Kelas Pertandingan</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Tanggal</th>
              <th className="px-4 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRegistrations.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 font-semibold text-slate-900">{row.displayName}</td>
                <td className="px-4 py-4 text-slate-700">{row.parentEmail}</td>
                <td className="px-4 py-4 capitalize">{row.displayCategory}</td>
                <td className="px-4 py-4">{row.displayAge}</td>
                <td className="px-4 py-4">{row.displayWeight}</td>
                <td className="px-4 py-4">{row.displayClass}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.displayStatus === 'Approved' ? 'bg-emerald-100 text-emerald-700' : row.displayStatus === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {row.displayStatus}
                  </span>
                </td>
                <td className="px-4 py-4">{row.created_at ? formatDate(row.created_at) : '-'}</td>
                <td className="px-4 py-4 space-y-2">
                  <button type="button" onClick={() => openPreview(row)} className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">Preview Bukti</button>
                  <button type="button" onClick={() => handleStatusUpdate(row.id, 'verified')} className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600">Verified</button>
                  <button type="button" onClick={() => handleStatusUpdate(row.id, 'rejected')} className="inline-flex w-full items-center justify-center rounded-2xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">Rejected</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewUrl && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-900">Pratinjau Bukti Transfer</p>
            <div className="flex flex-wrap gap-3">
              <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800">Unduh Bukti</a>
              <button type="button" onClick={() => setPreviewUrl('')} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">Tutup</button>
            </div>
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
