# SansBook

SansBook is a working legal ebook library MVP.

## Run locally

Open `index.html` in your browser. It works immediately in local mode.

## Local mode features

- Signup/login demo
- Reader, author, and admin roles
- Separate library per user
- Book upload demo
- Admin approve/reject
- Reader pages, chapters, bookmarks, highlights, notes, progress
- Copyright report form

## Supabase setup

1. Create a free Supabase project.
2. Open the SQL editor and run `supabase-schema.sql`.
3. Create a Storage bucket named `ebooks`.
4. Open `config.js`.
5. Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_ANON_KEY`.
6. Open `index.html` again.

## Important

This frontend-only version uses the Supabase anon key, which is normal for Supabase browser apps. For a serious production launch, add a server layer for admin-only approval, private signed download URLs, payment webhooks, and stronger copyright moderation.
