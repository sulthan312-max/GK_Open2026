import { useMemo, useState } from 'react';
import { LandingPage } from './LandingPage';
import { FormStepProgress } from '../components/FormStepProgress';
import { POOMSAE_MAPPING, CONTACT_INFO } from '../config/gko2026';
import { supabase } from '../lib/supabaseClient';

const initialForm = {
  nama: '',
  email: '',
  sabuk: '',
  usia: '',
  berat: '',
  kelasHasil: '',
  fotoAtletFile: null,
  fotoAtletPath: '',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function compressImageFile(file) {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(file);
  }

  return createImageBitmap(file).then((imageBitmap) => {
    const maxDimension = 1200;
    const ratio = Math.min(1, maxDimension / Math.max(imageBitmap.width, imageBitmap.height));
    const width = Math.round(imageBitmap.width * ratio);
    const height = Math.round(imageBitmap.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(imageBitmap, 0, 0, width, height);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengompres gambar'));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }));
        },
        'image/webp',
        0.7,
      );
    });
  });
}

function findKyorugiClass(usia, berat) {
  const age = Number(usia);
  const weight = Number(berat);
  if (!age || !weight) {
    return '';
  }

  if (age >= 6 && age <= 11) {
    if (weight <= 22) return 'Under 22 kg';
    if (weight <= 26) return 'Under 26 kg';
    if (weight <= 30) return 'Under 30 kg';
    if (weight <= 34) return 'Under 34 kg';
    if (weight <= 38) return 'Under 38 kg';
    if (weight <= 42) return 'Under 42 kg';
    return 'Over 42 kg';
  }

  if (age >= 12 && age <= 14) {
    if (weight <= 33) return 'Under 33 kg';
    if (weight <= 37) return 'Under 37 kg';
    if (weight <= 41) return 'Under 41 kg';
    if (weight <= 45) return 'Under 45 kg';
    if (weight <= 49) return 'Under 49 kg';
    if (weight <= 53) return 'Under 53 kg';
    if (weight <= 57) return 'Under 57 kg';
    if (weight <= 61) return 'Under 61 kg';
    if (weight <= 65) return 'Under 65 kg';
    return 'Over 65 kg';
  }

  if (age >= 15 && age <= 17) {
    if (weight <= 45) return 'Under 45 kg';
    if (weight <= 48) return 'Under 48 kg';
    if (weight <= 51) return 'Under 51 kg';
    if (weight <= 55) return 'Under 55 kg';
    if (weight <= 59) return 'Under 59 kg';
    if (weight <= 63) return 'Under 63 kg';
    if (weight <= 68) return 'Under 68 kg';
    if (weight <= 73) return 'Under 73 kg';
    if (weight <= 78) return 'Under 78 kg';
    return 'Over 78 kg';
  }

  if (age >= 18) {
    if (weight <= 54) return 'Under 54 kg';
    if (weight <= 58) return 'Under 58 kg';
    if (weight <= 63) return 'Under 63 kg';
    if (weight <= 68) return 'Under 68 kg';
    if (weight <= 74) return 'Under 74 kg';
    if (weight <= 80) return 'Under 80 kg';
    if (weight <= 87) return 'Under 87 kg';
    return 'Over 87 kg';
  }

  return '';
}

export default function RegistrationPage() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const selectedPoomsaeLevel = useMemo(() => {
    return POOMSAE_MAPPING[form.sabuk.toLowerCase()] || '';
  }, [form.sabuk]);

  const selectedKyorugiClass = useMemo(() => findKyorugiClass(form.usia, form.berat), [form.usia, form.berat]);

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validateStepTwo = () => {
    const nextErrors = {};
    if (!form.nama.trim()) nextErrors.nama = 'Nama peserta wajib diisi.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email orang tua wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Email tidak valid.';
    }

    if (selectedCategory === 'poomsae') {
      if (!form.sabuk) nextErrors.sabuk = 'Pilih tingkat sabuk.';
    } else if (selectedCategory === 'kyorugi') {
      if (!form.usia || Number(form.usia) <= 0) nextErrors.usia = 'Masukkan usia yang valid.';
      if (!form.berat || Number(form.berat) <= 0) nextErrors.berat = 'Masukkan berat badan yang valid.';
    }

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.general = 'Mohon lengkapi semua field wajib sebelum lanjut ke upload foto.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextToUpload = () => {
    if (!validateStepTwo()) return;
    const kelasHasil = selectedCategory === 'poomsae' ? selectedPoomsaeLevel : selectedKyorugiClass;
    setForm((current) => ({ ...current, kelasHasil }));
    setStep(3);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setErrors((current) => ({ ...current, fotoAtlet: 'Unggah foto JPG atau PNG.' }));
      return;
    }

    setLoading(true);
    try {
      const compressed = await compressImageFile(file);
      setForm((current) => ({ ...current, fotoAtletFile: compressed }));
      setErrors((current) => ({ ...current, fotoAtlet: '' }));
    } catch (err) {
      setErrors((current) => ({ ...current, fotoAtlet: 'Gagal memproses foto atlet.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!form.fotoAtletFile) {
      setErrors((current) => ({ ...current, fotoAtlet: 'Unggah Foto Atlet 3x4 terlebih dahulu.' }));
      return;
    }

    if (!supabase) {
      setErrors((current) => ({
        ...current,
        submit: 'Supabase belum dikonfigurasi. Halaman pendaftaran hanya dapat ditampilkan, tetapi tidak dapat mengirim data.',
      }));
      return;
    }

    setLoading(true);
    try {
      const file = form.fotoAtletFile;
      const fileExt = file.name.split('.').pop() ?? 'png';
      const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storagePath = `registrations/${filename}`;

      const { error: storageError } = await supabase.storage
        .from('athlete-photos')
        .upload(storagePath, file, { contentType: file.type });

      if (storageError) throw storageError;

      const { data: inserted, error: insertError } = await supabase
        .from('registrations')
        .insert([
          {
            nama_lengkap: form.nama,
            email_orang_tua: form.email,
            kategori: selectedCategory,
            sabuk: selectedCategory === 'poomsae' ? form.sabuk : null,
            berat_badan: selectedCategory === 'kyorugi' ? Number(form.berat) : null,
            kelas_pertandingan: form.kelasHasil,
            photo_url: storagePath,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      const payload = {
        email: form.email,
        childName: form.nama,
        category: selectedCategory === 'poomsae' ? 'Poomsae' : 'Kyorugi',
        kelasHasil: form.kelasHasil,
        status: 'Menunggu Verifikasi Pendaftaran',
        contactEmail: CONTACT_INFO.email,
        contactPhone: CONTACT_INFO.phone,
      };

      const functionUrl = import.meta.env.VITE_SEND_CONFIRMATION_FUNCTION_URL;
      if (functionUrl) {
        fetch(functionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => {
          console.error('Email confirmation failed', err);
        });
      }

      setSuccessData({ ...payload, registration: inserted });
      setStep(4);
    } catch (error) {
      const message = error?.message || 'Gagal mengirimkan pendaftaran. Coba lagi nanti.';
      setErrors((current) => ({ ...current, submit: message }));
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedCategory('');
    setForm(initialForm);
    setErrors({});
    setSuccessData(null);
  };

  if (step === 1 && !selectedCategory) {
    return <LandingPage onSelectCategory={handleSelectCategory} />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">GKO 2026</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">Form Pendaftaran Golden Kickers Open</h1>
          </div>
          <button type="button" onClick={resetFlow} className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Mulai ulang pendaftaran
          </button>
        </div>

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 shadow-sm">
          <img
            src="/GK-OPEN2026.png"
            alt="Poster GK OPEN 2026"
            className="w-full object-cover"
            loading="lazy"
          />
        </div>

        <FormStepProgress step={step} />

        {step === 2 && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Kategori terpilih</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {selectedCategory === 'poomsae' ? 'Poomsae' : 'Kyorugi'}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="space-y-4">
                  {errors.general && <div className="rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">{errors.general}</div>}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nama Peserta</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(event) => handleChange('nama', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                      placeholder="Contoh: Ahmad Firdaus"
                    />
                    {errors.nama && <p className="mt-2 text-sm text-red-600">{errors.nama}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Email Orang Tua</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                      placeholder="contoh@email.com"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {selectedCategory === 'poomsae' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Tingkat Sabuk</label>
                        <select
                          value={form.sabuk}
                          onChange={(event) => handleChange('sabuk', event.target.value)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                        >
                          <option value="">Pilih sabuk</option>
                          <option value="putih">Putih</option>
                          <option value="kuning">Kuning</option>
                          <option value="hijau">Hijau</option>
                          <option value="biru">Biru</option>
                          <option value="merah">Merah</option>
                          <option value="hitam">Hitam</option>
                        </select>
                        {errors.sabuk && <p className="mt-2 text-sm text-red-600">{errors.sabuk}</p>}
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Kategori Poomsae</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{selectedPoomsaeLevel || 'Pilih tingkat sabuk untuk melihat kategori.'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-slate-700">Usia</label>
                          <input
                            type="number"
                            min="1"
                            value={form.usia}
                            onChange={(event) => handleChange('usia', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                            placeholder="Contoh: 10"
                          />
                          {errors.usia && <p className="mt-2 text-sm text-red-600">{errors.usia}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700">Berat Badan (kg)</label>
                          <input
                            type="number"
                            min="1"
                            step="0.1"
                            value={form.berat}
                            onChange={(event) => handleChange('berat', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-amber-200"
                            placeholder="Contoh: 28.5"
                          />
                          {errors.berat && <p className="mt-2 text-sm text-red-600">{errors.berat}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Kelas Kyorugi</p>
                          <p className="mt-2 text-lg font-semibold text-slate-900">{selectedKyorugiClass || 'Isi usia dan berat untuk melihat kelas.'}</p>
                        </div>
                        <div className="overflow-hidden rounded-3xl bg-white p-3">
                          <img
                            src="/ilustrasi-kelas-berat-badan.png"
                            alt="Ilustrasi kelas berat"
                            className="h-36 w-full object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Petunjuk</p>
                <div className="mt-4 space-y-4 text-slate-600">
                  <p>Data akan digunakan untuk menempatkan peserta dalam kategori dan kelas yang sesuai.</p>
                  <p>Pastikan email orang tua aktif karena email konfirmasi akan dikirim otomatis setelah submit.</p>
                  <p>Gunakan berat badan dalam satuan kg, misal 25 atau 28.5.</p>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl bg-white p-4">
                  <img
                    src={
                      selectedCategory === 'poomsae'
                        ? '/ilustrasi-poomsae.png'
                        : '/ilustrasi-kategori-kyorugi.png'
                    }
                    alt="Ilustrasi kategori"
                    loading="lazy"
                    className="h-52 w-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setStep(1)} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Ubah kategori
              </button>
              <button type="button" onClick={handleNextToUpload} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Lanjut ke Upload Foto
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Ringkasan Pendaftaran</p>
              <div className="mt-6 space-y-4 text-slate-700">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Nama Peserta</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{form.nama}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Kategori</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{selectedCategory === 'poomsae' ? 'Poomsae' : 'Kyorugi'}</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {selectedCategory === 'poomsae' ? (
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Sabuk</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{form.sabuk || '-'}</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Usia</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{form.usia} tahun</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Berat</p>
                        <p className="mt-1 text-lg font-semibold text-slate-900">{form.berat} kg</p>
                      </div>
                    </>
                  )}
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      {selectedCategory === 'poomsae' ? 'Tingkat Poomsae' : 'Kelas Kyorugi'}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{form.kelasHasil}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pendaftaran</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">Gratis</p>
                    <p className="mt-2 text-sm text-slate-600">Semua peserta dapat mendaftar tanpa biaya.</p>
                  </div>
                  <div className="rounded-3xl bg-white p-5">
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Informasi penting</p>
                    <p className="mt-3 text-slate-900">Unggah hanya foto 3x4 atlet memakai dobok.</p>
                    <p className="mt-1 text-slate-600">Format JPG/PNG, resolusi jelas, latar belakang netral.</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-white p-5">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Unggah Foto Atlet 3x4</p>
                  <label className="mt-4 flex cursor-pointer flex-col items-start gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-slate-600 transition hover:border-gold hover:bg-slate-100">
                    <span className="text-base font-semibold text-slate-900">Pilih foto</span>
                    <span className="text-sm text-slate-500">JPEG atau PNG (3x4 dengan dobok)</span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileChange} />
                  </label>
                  {form.fotoAtletFile && <p className="text-sm text-slate-700">File siap diunggah: {form.fotoAtletFile.name}</p>}
                  {errors.fotoAtlet && <p className="mt-2 text-sm text-red-600">{errors.fotoAtlet}</p>}
                </div>
              </div>
            </div>

            {errors.submit && <p className="rounded-3xl bg-red-50 p-4 text-sm text-red-700">{errors.submit}</p>}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setStep(2)} className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Kembali ke data peserta
              </button>
              <button type="button" onClick={handleSubmitRegistration} disabled={loading} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? 'Mengirim...' : 'Konfirmasi Pendaftaran'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && successData && (
          <div className="space-y-8 rounded-3xl border border-green-200 bg-green-50 p-8 text-slate-900 shadow-sm">
            <h2 className="text-3xl font-semibold text-slate-950">Selamat! {successData.childName} sudah terdaftar sebagai peserta GKO 2026.</h2>
            <p className="text-slate-700">Pendaftaranmu berhasil dikirim. Status saat ini: <span className="font-semibold">Menunggu Verifikasi Panitia</span>.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Nama Peserta</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{successData.childName}</p>
              </div>
              <div className="rounded-3xl bg-white p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Email Orang Tua/Peserta</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{successData.email}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Kategori</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{successData.category}</p>
              <p className="mt-1 text-slate-600">{successData.kelasHasil}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Kontak Panitia</p>
              <p className="mt-2 text-slate-700">{CONTACT_INFO.email} / {CONTACT_INFO.phone}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetFlow} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Daftar peserta lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
