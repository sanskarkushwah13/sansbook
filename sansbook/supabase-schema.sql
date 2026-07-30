create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'reader' check (role in ('reader', 'author', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  title text not null,
  author text not null,
  category text not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  file_name text,
  file_type text,
  file_url text,
  rights_confirmed boolean not null default false,
  chapters jsonb not null default '[]'::jsonb,
  views int not null default 0,
  downloads int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists library_items (
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists reading_progress (
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  page int not null default 0,
  percentage numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  page int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  page int not null default 0,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  page int not null default 0,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  book_id uuid references books(id) on delete cascade,
  email text not null,
  reason text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table books enable row level security;
alter table library_items enable row level security;
alter table reading_progress enable row level security;
alter table bookmarks enable row level security;
alter table notes enable row level security;
alter table highlights enable row level security;
alter table reports enable row level security;

create policy "profiles read own" on profiles for select using (auth.uid() = id);
create policy "profiles create own" on profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on profiles for update using (auth.uid() = id);

create policy "approved books are public" on books for select using (status = 'approved' or owner_id = auth.uid());
create policy "authors create books" on books for insert with check (owner_id = auth.uid() and rights_confirmed = true);
create policy "owners update own pending books" on books for update using (owner_id = auth.uid());
create policy "admins update books" on books for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);
create policy "admins read all books" on books for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
);

create policy "own library read" on library_items for select using (user_id = auth.uid());
create policy "own library insert" on library_items for insert with check (user_id = auth.uid());
create policy "own library delete" on library_items for delete using (user_id = auth.uid());

create policy "own progress all" on reading_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own bookmarks all" on bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes all" on notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own highlights all" on highlights for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reports can be created" on reports for insert with check (true);
create policy "reporters read own" on reports for select using (reporter_id = auth.uid());

-- Storage setup:
-- 1. Create a public Supabase Storage bucket named "ebooks".
-- 2. For stricter production security, make it private and generate signed URLs from a server.
