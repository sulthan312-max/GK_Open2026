import React from 'react';

export function CategoryCard({ category, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      aria-label={`Pilih kategori ${category.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-300"
    >
      <div className="overflow-hidden bg-slate-100">
        <img
          src={category.image}
          alt={category.title}
          loading="lazy"
          className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          {category.title}
        </div>
        <div>
          <p className="text-xl font-semibold text-slate-950">{category.description}</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{category.hint}</p>
        </div>
        <span className="mt-auto inline-flex items-center justify-center rounded-full bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition group-hover:bg-amber-100">
          Pilih {category.title}
        </span>
      </div>
    </button>
  );
}
