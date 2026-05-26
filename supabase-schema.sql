-- SQL to run in Supabase SQL Editor
CREATE TABLE gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  blob_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON gallery_images
  FOR SELECT USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access" ON gallery_images
  FOR INSERT WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access" ON gallery_images
  FOR UPDATE USING (true);

-- Allow public delete access
CREATE POLICY "Allow public delete access" ON gallery_images
  FOR DELETE USING (true);