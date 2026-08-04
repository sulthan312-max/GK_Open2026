export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, childName, category, kelasHasil, status, kontingen } = body || {};

    if (!email || !childName || !category || !kelasHasil) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Mailer not configured' }), { status: 500 });
    }

    const statusLabel = ['verified', 'approved'].includes((status || '').toLowerCase()) ? 'TERVERIFIKASI' : (status || '').toUpperCase();
    const kontingenLabel = kontingen || '-';
    const subject = `Konfirmasi Pendaftaran GK OPEN 2026 - ${childName}`;

    const html = `
      <div style="font-family: Inter, sans-serif; color: #111827;">
        <h1 style="color: #1D4ED8;">Konfirmasi Pendaftaran GK OPEN 2026</h1>
        <p>Halo,</p>
        <p>Status pendaftaran <strong>${childName}</strong> telah <strong>${statusLabel}</strong>.</p>
        <p>Berikut adalah rincian pendaftaran:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Nama Peserta:</strong> ${childName}</li>
          <li><strong>Kategori:</strong> ${category}</li>
          <li><strong>Kontingen/Klub:</strong> ${kontingenLabel}</li>
        </ul>
        <p>Salam olahraga,<br/>Golden Kickers Taekwondo Club</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Golden Kickers <noreply@goldenkickers.id>',
        to: email,
        subject,
        html,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Resend error', data);
      return new Response(JSON.stringify({ ok: false, error: data }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, result: data }), { status: 200 });
  } catch (err: any) {
    console.error('Send email failed', err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), { status: 500 });
  }
}
