create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  nama_anak text not null,
  email_ortu text not null,
  kategori text not null check (kategori in ('poomsae', 'kyorugi')),
  sabuk text,
  usia int,
  berat_badan numeric,
  kelas_hasil text not null,
  bukti_bayar_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now()
);

alter table registrations enable row level security;

-- Drop policy lama agar bersih
drop policy if exists "Allow anonymous inserts" on registrations;
drop policy if exists "Allow authenticated selects" on registrations;
drop policy if exists "Allow authenticated updates" on registrations;

-- Policy Tabel Registrations
create policy "Allow anonymous inserts" on registrations
  for insert
  with check (auth.role() = 'anon' or auth.role() = 'authenticated');

create policy "Allow authenticated selects" on registrations
  for select
  using (auth.role() = 'authenticated');

create policy "Allow authenticated updates" on registrations
  for update
  using (auth.role() = 'authenticated');

-- Setup Storage Bucket & Policy
insert into storage.buckets (id, name, public) 
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do nothing;

create policy "Allow public uploads to payment-proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs');

create policy "Allow public read access to payment-proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');