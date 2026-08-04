import React from 'react';

export function FormStepProgress({ step }) {
  const steps = [
    { label: 'Kategori' },
    { label: 'Info Peserta' },
    { label: 'Upload Foto' },
    { label: 'Konfirmasi' },
  ];

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Langkah {step} dari 4</p>
      <div className="flex flex-1 items-center gap-2">
        {steps.map((item, index) => (
          <div key={item.label} className="flex-1">
            <div className={`h-2 rounded-full ${index < step ? 'bg-gold' : 'bg-slate-200'}`} />
            <p className="mt-2 text-xs text-slate-500 text-center">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
