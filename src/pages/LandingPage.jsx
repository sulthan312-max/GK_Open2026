import React from 'react';
import { CategoryCard } from '../components/CategoryCard';
import { CATEGORY_CARDS } from '../config/gko2026';

export function LandingPage({ onSelectCategory }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 shadow-2xl ring-1 ring-slate-900/10 sm:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo%20gktc.jpg"
              alt="GKTC Logo"
              className="h-16 w-16 rounded-3xl bg-white/10 p-3 ring-1 ring-white/20"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Golden Kickers Taekwondo Club</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Golden Kickers Open 2026
              </h1>
            </div>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-300">
            Pilih kategori kompetisi yang tepat untuk anak, isi data peserta, lalu lanjutkan ke pembayaran dengan nyaman dan cepat.
          </p>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-600">Langkah 1</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">Pilih jenis kompetisi</h2>
            <p className="mt-4 max-w-2xl text-slate-600">
              Kategori Poomsae cocok untuk penampilan teknik, sedangkan Kyorugi adalah pertandingan sparring untuk usia dan berat sesuai.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {CATEGORY_CARDS.map((category) => (
              <CategoryCard key={category.id} category={category} onSelect={onSelectCategory} />
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-xl">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Brand GKTC</p>
              <h3 className="mt-3 text-2xl font-semibold">Kompetisi resmi klub</h3>
            </div>
            <p className="text-slate-300">
              Kompetisi ini diselenggarakan oleh Golden Kickers Taekwondo Club dengan fokus pada fairplay, teknik, dan pengalaman lomba yang menyenangkan untuk peserta anak.
            </p>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Aksen warna</p>
                <p className="mt-2 text-lg font-semibold text-white">Biru & Merah Taekwondo</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Responsive</p>
                <p className="mt-2 text-lg font-semibold text-white">Layout adaptif untuk mobile dan desktop</p>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-5">
              <img
                src="/logo-taekwondo-indonesia.png"
                alt="Logo Taekwondo Indonesia"
                className="mx-auto h-28 w-full max-w-[220px] object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
