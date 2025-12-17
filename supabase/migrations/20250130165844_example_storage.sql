-- Create storage bucket for files
-- Note: 'public' column may not exist in older Supabase versions
insert into storage.buckets (id, name)
values ('files', 'files')
on conflict (id) do nothing;