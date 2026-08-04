create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  nama_anak text not null,
  email_orang_tua text not null,
  kategori text not null check (kategori in ('poomsae', 'kyorugi')),
  sabuk text,
  usia int,
  berat_badan numeric,
  kelas_hasil text not null,
  photo_url text,
  kontingen text,
  bukti_bayar_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

alter table registrations enable row level security;

create policy "Allow anonymous inserts" on registrations
  for insert
  with (auth.role() = 'anon');

create policy "Allow authenticated selects" on registrations
  for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated updates" on registrations
  for update
  using (auth.role() = 'authenticated');
