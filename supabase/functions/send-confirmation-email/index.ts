import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

interface RequestBody {
  email: string;
  childName: string;
  category: string;
  kelasHasil: string;
  status: string;
  kontingen?: string;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

if (!RESEND_API_KEY) {
  console.error('Missing RESEND_API_KEY');
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body: RequestBody = await req.json();
  if (!body.email || !body.childName || !body.category || !body.kelasHasil) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const statusLabel = ['verified', 'approved'].includes(body.status?.toLowerCase() || '')
    ? 'TERVERIFIKASI'
    : body.status;
  const kontingenLabel = body.kontingen || '-';
  const subject = `Konfirmasi Pendaftaran GK OPEN 2026 - ${body.childName}`;

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111827;">
      <h1 style="color: #1D4ED8;">Konfirmasi Pendaftaran GK OPEN 2026</h1>
      <p>Halo,</p>
      <p>Status pendaftaran <strong>${body.childName}</strong> telah <strong>${statusLabel}</strong>.</p>
      <p>Berikut adalah rincian pendaftaran:</p>
      <ul style="line-height: 1.8;">
        <li><strong>Nama Peserta:</strong> ${body.childName}</li>
        <li><strong>Kategori:</strong> ${body.category}</li>
        <li><strong>Kontingen/Klub:</strong> ${kontingenLabel}</li>
      </ul>
      <p>Selamat! Silakan pertahankan semangat bertanding dan persiapkan fisik serta perlengkapan pertandingan dengan baik.</p>
      <p>Salam olahraga,<br/>Golden Kickers Taekwondo Club</p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Golden Kickers <noreply@goldenkickers.id>',
        to: body.email,
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend email error', data);
      return new Response(JSON.stringify({ ok: false, error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, result: data }), { status: 200 });
  } catch (err) {
    console.error('Resend request failed', err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 });
  }
});
