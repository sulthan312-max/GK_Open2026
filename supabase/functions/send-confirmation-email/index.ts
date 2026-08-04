import { serve } from 'https://deno.land/std@0.201.0/http/server.ts';

interface RequestBody {
  email: string;
  childName: string;
  category: string;
  kelasHasil: string;
  status: string;
  contactEmail: string;
  contactPhone: string;
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

  const html = `
    <div style="font-family: Inter, sans-serif; color: #111827;">
      <h1 style="color: #1D4ED8;">Pendaftaran GKO 2026 Berhasil</h1>
      <p>Halo,</p>
      <p>Terima kasih telah mendaftarkan <strong>${body.childName}</strong> untuk Golden Kickers Open 2026.</p>
      <ul style="line-height: 1.8;">
        <li><strong>Kategori:</strong> ${body.category}</li>
        <li><strong>Kelas/Tingkat:</strong> ${body.kelasHasil}</li>
        <li><strong>Status:</strong> ${body.status}</li>
      </ul>
      <p>Silakan tunggu verifikasi pembayaran oleh panitia.</p>
      <p>Jika butuh bantuan, hubungi: ${body.contactEmail} atau ${body.contactPhone}.</p>
      <p>Salam,<br/>Golden Kickers Taekwondo Club</p>
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
        subject: 'Konfirmasi Pendaftaran GKO 2026',
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
