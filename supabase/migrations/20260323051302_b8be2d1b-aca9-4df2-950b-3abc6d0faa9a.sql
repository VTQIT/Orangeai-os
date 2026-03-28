
-- Create spotify_songs table
CREATE TABLE public.spotify_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  album TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 0,
  audio_url TEXT NOT NULL,
  cover_url TEXT NOT NULL DEFAULT '',
  karaoke_url TEXT,
  mtv_video_url TEXT,
  logo_url TEXT,
  lyrics TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public RLS
ALTER TABLE public.spotify_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read spotify_songs" ON public.spotify_songs FOR SELECT USING (true);
CREATE POLICY "Public insert spotify_songs" ON public.spotify_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update spotify_songs" ON public.spotify_songs FOR UPDATE USING (true);
CREATE POLICY "Public delete spotify_songs" ON public.spotify_songs FOR DELETE USING (true);
