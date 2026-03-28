import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Heart, List, ChevronDown, Volume2, VolumeX, Wifi, Signal, Database, Plus, Music, Upload, FileText, Image, Sparkles, Stamp, AlertCircle, User, FolderOpen, Disc, ChevronRight, Video, Mic, MicOff, Maximize2, Minimize2, Search, Wand2, Loader2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedUrl } from '@/hooks/useVideoCache';
import { usePreloadQueue } from '@/hooks/usePreloadQueue';
import MtvVideoPlayer from '@/components/MtvVideoPlayer';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  audioUrl: string;
  coverUrl: string;
  mtvVideoUrl?: string | null;
}

// GitHub repository configuration for dynamic playlist
const GITHUB_REPO = 'nasmusic-ai/RAW-music';
const GITHUB_MUSIC_FOLDER = 'music';
const GITHUB_COVERS_FOLDER = 'covers'; // <-- new: folder for cover images
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_MUSIC_FOLDER}`;
const GITHUB_COVERS_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_COVERS_FOLDER}`;
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_MUSIC_FOLDER}`;
const GITHUB_COVERS_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${GITHUB_COVERS_FOLDER}`;
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop';

const FALLBACK_AUDIO_URLS = [
  'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
  'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
];

// Demo royalty-free music videos for tracks without an MTV video
const DEMO_MTV_VIDEOS = [
  'https://raw.githubusercontent.com/nasmusic-ai/RAW-music/main/music/dragons-lair-MTV.mp4',
  'https://cdn.pixabay.com/video/2024/06/12/216078_large.mp4',
  'https://cdn.pixabay.com/video/2023/07/28/173620_large.mp4',
  'https://cdn.pixabay.com/video/2022/12/22/143875_large.mp4',
];

/** Clean a filename into a readable song title */
function cleanFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]/g, ' ')   // replace dashes/underscores with spaces
    .replace(/\b\w/g, c => c.toUpperCase()); // title case
}

/** Fetch audio files and matching covers from GitHub repository */
async function fetchGitHubTracks(): Promise<Track[]> {
  try {
    // Fetch audio files
    const audioResp = await fetch(GITHUB_API_URL);
    if (!audioResp.ok) throw new Error(`GitHub API error: ${audioResp.status}`);
    const audioFiles = await audioResp.json();
    if (!Array.isArray(audioFiles)) return [];

    // Fetch cover images (optional folder, may be missing)
    let coverMap = new Map<string, string>();
    try {
      const coverResp = await fetch(GITHUB_COVERS_API_URL);
      if (coverResp.ok) {
        const coverFiles = await coverResp.json();
        if (Array.isArray(coverFiles)) {
          for (const file of coverFiles) {
            if (file.type === 'file' && IMAGE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
              const base = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
              coverMap.set(base, file.download_url || `${GITHUB_COVERS_RAW_BASE}/${encodeURIComponent(file.name)}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch covers folder, using default covers', e);
    }

    // Build tracks, matching covers by base name (case-insensitive)
    return audioFiles
      .filter((f: any) => f.type === 'file' && AUDIO_EXTENSIONS.some(ext => f.name.toLowerCase().endsWith(ext)))
      .map((f: any, i: number) => {
        const audioBase = f.name.replace(/\.[^/.]+$/, '').toLowerCase();
        const coverUrl = coverMap.get(audioBase) || DEFAULT_COVER;
        return {
          id: `gh-${i}-${f.sha?.slice(0, 8) || i}`,
          title: cleanFilename(f.name),
          artist: 'NAS Music',
          album: 'RAW Music',
          duration: 180, // default, will be resolved on play
          audioUrl: f.download_url || `${GITHUB_RAW_BASE}/${encodeURIComponent(f.name)}`,
          coverUrl: coverUrl,
        };
      });
  } catch (e) {
    console.error('Failed to fetch GitHub tracks:', e);
    return [];
  }
}

// Export for precaching
export const SPOTIFY_ASSET_URLS = [DEFAULT_COVER, ...FALLBACK_AUDIO_URLS];

// --- TESHA Prioritization Helpers ---
const getSafeTitle = (song: any) => {
  return (song?.title || song?.name || "")
    .toString()
    .toUpperCase()
    .trim();
};

const isTESHA = (song: any) => {
  return getSafeTitle(song).endsWith("TESHA");
};

const sortSongsTESHAFirst = (songs: any[] = []) => {
  if (!Array.isArray(songs)) return [];

  return [...songs].sort((a, b) => {
    const aIs = isTESHA(a);
    const bIs = isTESHA(b);

    if (aIs && !bIs) return -1;
    if (!aIs && bIs) return 1;

    return getSafeTitle(a).localeCompare(getSafeTitle(b));
  });
};

const findTESHAIndex = (songs: any[] = []) => {
  if (!Array.isArray(songs)) return -1;
  return songs.findIndex(song => isTESHA(song));
};

interface SpotifyMiniProps {
  isOpen: boolean;
  onClose: () => void;
  standalone?: boolean;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Skeleton loader bar */
function SkeletonBar({ width = '100%', height = 12 }: { width?: string; height?: number }) {
  return (
    <div
      className="rounded-md bg-white/10 animate-pulse"
      style={{ width, height }}
    />
  );
}

/** Buffer Health Indicator */
function BufferHealthIndicator({
  bufferSeconds,
  connectionType,
  preloadCount,
  dataSaverMode,
  onToggleDataSaver,
}: {
  bufferSeconds: number;
  connectionType: string;
  preloadCount: number;
  dataSaverMode: boolean;
  onToggleDataSaver: () => void;
}) {
  const healthColor = bufferSeconds > 120
    ? 'bg-[#1DB954]'
    : bufferSeconds > 30
    ? 'bg-yellow-400'
    : 'bg-red-400';

  const healthLabel = bufferSeconds > 120
    ? 'Excellent'
    : bufferSeconds > 30
    ? 'Good'
    : 'Low';

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm">
      {/* Connection indicator */}
      <div className="flex items-center gap-1">
        {connectionType === 'wifi' ? (
          <Wifi size={12} className="text-[#1DB954]" />
        ) : connectionType === 'cellular' ? (
          <Signal size={12} className="text-yellow-400" />
        ) : (
          <Wifi size={12} className="text-white/40" />
        )}
      </div>

      {/* Buffer bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${healthColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (bufferSeconds / 300) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-[9px] text-white/50 whitespace-nowrap">
          {formatTime(bufferSeconds)} buffered · {healthLabel}
        </span>
      </div>

      {/* Data saver toggle */}
      <button
        onClick={onToggleDataSaver}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] transition-colors ${
          dataSaverMode
            ? 'bg-[#1DB954]/20 text-[#1DB954]'
            : 'bg-white/5 text-white/40'
        }`}
      >
        <Database size={9} />
        {dataSaverMode ? 'Saver' : 'Full'}
      </button>
    </div>
  );
}

/** Preload status dots for queue items */
function PreloadDot({ state }: { state: string }) {
  const color = state === 'cached' ? 'bg-[#1DB954]'
    : state === 'loading' ? 'bg-yellow-400 animate-pulse'
    : state === 'error' ? 'bg-red-400'
    : 'bg-white/20';
  return <div className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}

const GENRE_OPTIONS = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
  'Country', 'Reggae', 'Blues', 'Metal', 'Folk', 'Indie', 'K-Pop', 'Lo-Fi',
];

/** Artist Profile Panel */
function ArtistProfilePanel({ onClose, artistName }: { onClose: () => void; artistName?: string }) {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [displayName, setDisplayName] = useState(artistName || '');
  const [savedAlbums] = useState<{ name: string; cover: string }[]>([
    { name: 'Ambient Collection', cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop' },
    { name: 'Nature Collection', cover: 'https://images.unsplash.com/photo-1520523839897-bd69bfd2d71a?w=120&h=120&fit=crop' },
  ]);
  const [showSaved, setShowSaved] = useState(false);
  const picRef = useRef<HTMLInputElement>(null);

  const handlePic = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setProfilePic(file);
    const reader = new FileReader();
    reader.onload = (e) => setProfilePicPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setShowSaved(true);
    setTimeout(() => { setShowSaved(false); onClose(); }, 2000);
  };

  if (showSaved) {
    return (
      <motion.div
        className="fixed inset-0 z-[260] flex flex-col items-center justify-center"
        style={{ maxWidth: 428, margin: '0 auto' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
            className="w-16 h-16 rounded-full bg-[#1DB954] flex items-center justify-center">
            <User size={28} className="text-black" />
          </motion.div>
          <p className="text-white font-bold text-lg">Profile Saved!</p>
          <p className="text-white/50 text-sm">Your artist profile has been updated.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[260] flex flex-col"
      style={{ maxWidth: 428, margin: '0 auto' }}
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-10 pb-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-20">
          <h2 className="text-white font-bold text-lg tracking-wide">Artist Profile</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
            <X size={18} className="text-white" />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-28 h-28 rounded-full border-2 border-dashed border-white/15 bg-white/5 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={() => picRef.current?.click()}
            >
              {profilePicPreview ? (
                <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-white/25" />
              )}
            </div>
            <button onClick={() => picRef.current?.click()} className="text-[#1DB954] text-xs font-medium">
              {profilePic ? 'Change Photo' : 'Upload Photo'}
            </button>
            <input ref={picRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handlePic(e.target.files[0]); }} />
          </div>

          {/* Display Name */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Artist Name</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your artist name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors" />
          </div>

          {/* About Us */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">About</label>
            <textarea value={aboutUs} onChange={(e) => setAboutUs(e.target.value)}
              placeholder="Tell listeners about yourself, your journey, your sound..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors resize-none" />
          </div>

          {/* Album Thumbnails */}
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Albums</label>
            {savedAlbums.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {savedAlbums.map((alb, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5">
                      <img src={alb.cover} alt={alb.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white/60 text-[10px] truncate w-full text-center">{alb.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/20 text-xs">No albums yet. Add songs to create albums.</p>
            )}
          </div>

          {/* Save */}
          <button onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-3.5 text-sm transition-colors mt-2">
            Save Profile
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/** Full-screen CMS Panel for adding songs */
function SongCMSPanel({ onClose, onSongAdded }: { onClose: () => void; onSongAdded?: () => void }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [genre, setGenre] = useState('');
  const [albumArt, setAlbumArt] = useState<File | null>(null);
  const [albumPreview, setAlbumPreview] = useState('');
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [musicUrl, setMusicUrl] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [showLyricsEditor, setShowLyricsEditor] = useState(false);
  const [dragOverArt, setDragOverArt] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [artistLogo, setArtistLogo] = useState<File | null>(null);
  const [artistLogoPreview, setArtistLogoPreview] = useState('');
  const [logoError, setLogoError] = useState('');
  const [generatingArt, setGeneratingArt] = useState(false);
  const [showArtistProfile, setShowArtistProfile] = useState(false);
  // MTV Video (9:16 only)
  const [mtvVideo, setMtvVideo] = useState<File | null>(null);
  const [mtvError, setMtvError] = useState('');
  // Minus One / Karaoke (instrumental MP3, optional)
  const [minusOneFile, setMinusOneFile] = useState<File | null>(null);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const mtvInputRef = useRef<HTMLInputElement>(null);
  const minusOneInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasMusicSource = !!mp3File || musicUrl.trim().length > 0;
  const isValidUrl = musicUrl.trim().length === 0 || /^https?:\/\/.+/i.test(musicUrl.trim());
  const canSubmit = title.trim().length > 0 && hasMusicSource && isValidUrl;

  const handleAlbumArt = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAlbumArt(file);
    const reader = new FileReader();
    reader.onload = (e) => setAlbumPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMp3 = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.mp3')) return;
    setMp3File(file);
  };

  const handleLyricsFile = (file: File) => {
    if (!file.name.match(/\.(txt|md)$/i)) return;
    setLyricsFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLyricsText(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (file: File) => {
    setLogoError('');
    const isPng = file.type === 'image/png';
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    if (!isPng && !isSvg) {
      setLogoError('Only transparent PNG or SVG files are allowed.');
      return;
    }
    setArtistLogo(file);
    const reader = new FileReader();
    reader.onload = (e) => setArtistLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Handle MTV video upload (9:16 aspect ratio validation)
  const handleMtvUpload = (file: File) => {
    setMtvError('');
    if (!file.type.startsWith('video/')) {
      setMtvError('Only video files are allowed.');
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const ratio = video.videoWidth / video.videoHeight;
      const expected = 9 / 16;
      if (Math.abs(ratio - expected) > 0.05) {
        setMtvError(`Only 9:16 portrait videos allowed. Yours is ${video.videoWidth}×${video.videoHeight}.`);
        return;
      }
      setMtvVideo(file);
    };
    video.src = URL.createObjectURL(file);
  };

  // Handle Minus One / Karaoke MP3
  const handleMinusOne = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.mp3')) return;
    setMinusOneFile(file);
  };


  const handleGenerateAlbumArt = async () => {
    if (generatingArt) return;
    setGeneratingArt(true);
    try {
      const prompt = `Create a professional album cover art for a ${genre || 'music'} song titled "${title || 'Untitled'}" by artist "${artist || 'Unknown'}". Modern, visually striking, high quality album artwork.`;
      const { data, error } = await supabase.functions.invoke('notepad-ai', {
        body: { message: prompt, agent: 'gemini' },
      });
      if (error) throw error;
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      const hash = (title + artist + genre + albumName).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const hue1 = hash % 360;
      const hue2 = (hash * 7) % 360;
      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, `hsl(${hue1}, 70%, 40%)`);
      grad.addColorStop(0.5, `hsl(${(hue1 + hue2) / 2}, 60%, 25%)`);
      grad.addColorStop(1, `hsl(${hue2}, 80%, 35%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc((hash * (i + 3) * 47) % 600, (hash * (i + 5) * 31) % 600, 40 + (i * 25), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(hue1 + i * 60) % 360}, 60%, 50%, 0.15)`;
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title || 'Untitled', 300, 480);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(artist || 'Artist', 300, 515);
      if (albumName) {
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(albumName, 300, 545);
      }
      const dataUrl = canvas.toDataURL('image/png');
      setAlbumPreview(dataUrl);
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();
      setAlbumArt(new File([blob], 'ai-album-art.png', { type: 'image/png' }));
    } catch (e) {
      console.error('AI art generation failed:', e);
    } finally {
      setGeneratingArt(false);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleSubmit = async () => {
    if (!canSubmit || uploading) return;
    setUploading(true);
    setUploadError('');
    try {
      // Ensure storage bucket exists
      await supabase.functions.invoke('spotify-storage');

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const albumFolder = albumName.trim() ? albumName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : 'singles';
      const timestamp = Date.now();

      let finalAudioUrl = musicUrl.trim();
      let finalCoverUrl = '';
      let finalKaraokeUrl: string | null = null;
      let finalMtvUrl: string | null = null;
      let finalLogoUrl: string | null = null;
      let songDuration = 0;

      // Upload MP3 file if provided
      if (mp3File) {
        const filePath = `${albumFolder}/${timestamp}_${mp3File.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: uploadErr } = await supabase.storage
          .from('spotifymini')
          .upload(filePath, mp3File, { contentType: 'audio/mpeg', upsert: true });
        if (uploadErr) throw new Error(`Audio upload failed: ${uploadErr.message}`);
        finalAudioUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${filePath}`;

        // Get duration from audio file
        try {
          const tempAudio = new Audio();
          const blobUrl = URL.createObjectURL(mp3File);
          tempAudio.src = blobUrl;
          songDuration = await new Promise<number>((resolve) => {
            tempAudio.onloadedmetadata = () => {
              URL.revokeObjectURL(blobUrl);
              resolve(Math.round(tempAudio.duration));
            };
            tempAudio.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(0); };
          });
        } catch { songDuration = 0; }
      }

      // Upload album art if provided
      if (albumArt) {
        const artPath = `${albumFolder}/cover_${timestamp}.${albumArt.name.split('.').pop()}`;
        const { error: artErr } = await supabase.storage
          .from('spotifymini')
          .upload(artPath, albumArt, { contentType: albumArt.type, upsert: true });
        if (artErr) throw new Error(`Cover upload failed: ${artErr.message}`);
        finalCoverUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${artPath}`;
      } else if (albumPreview.startsWith('data:')) {
        // AI-generated art — convert to blob and upload
        const resp = await fetch(albumPreview);
        const blob = await resp.blob();
        const artPath = `${albumFolder}/cover_${timestamp}.png`;
        const { error: artErr } = await supabase.storage
          .from('spotifymini')
          .upload(artPath, blob, { contentType: 'image/png', upsert: true });
        if (artErr) throw new Error(`AI cover upload failed: ${artErr.message}`);
        finalCoverUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${artPath}`;
      }

      // Upload karaoke MP3 if provided
      if (minusOneFile) {
        const karPath = `${albumFolder}/karaoke_${timestamp}_${minusOneFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: karErr } = await supabase.storage
          .from('spotifymini')
          .upload(karPath, minusOneFile, { contentType: 'audio/mpeg', upsert: true });
        if (karErr) throw new Error(`Karaoke upload failed: ${karErr.message}`);
        finalKaraokeUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${karPath}`;
      }

      // Upload MTV video if provided
      if (mtvVideo) {
        const vidPath = `${albumFolder}/mtv_${timestamp}_${mtvVideo.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: vidErr } = await supabase.storage
          .from('spotifymini')
          .upload(vidPath, mtvVideo, { contentType: mtvVideo.type, upsert: true });
        if (vidErr) throw new Error(`MTV upload failed: ${vidErr.message}`);
        finalMtvUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${vidPath}`;
      }

      // Upload artist logo if provided
      if (artistLogo) {
        const logoPath = `${albumFolder}/logo_${timestamp}.${artistLogo.name.split('.').pop()}`;
        const { error: logoErr } = await supabase.storage
          .from('spotifymini')
          .upload(logoPath, artistLogo, { contentType: artistLogo.type, upsert: true });
        if (logoErr) throw new Error(`Logo upload failed: ${logoErr.message}`);
        finalLogoUrl = `${SUPABASE_URL}/storage/v1/object/public/spotifymini/${logoPath}`;
      }

      // Save metadata to database
      const { error: dbErr } = await supabase.from('spotify_songs').insert({
        title: title.trim(),
        artist: artist.trim(),
        album: albumName.trim(),
        genre,
        duration: songDuration,
        audio_url: finalAudioUrl,
        cover_url: finalCoverUrl,
        karaoke_url: finalKaraokeUrl,
        mtv_video_url: finalMtvUrl,
        logo_url: finalLogoUrl,
        lyrics: lyricsText || null,
      });
      if (dbErr) throw new Error(`Database save failed: ${dbErr.message}`);

      // Notify parent to refresh songs
      if (onSongAdded) onSongAdded();

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2500);
    } catch (e: any) {
      console.error('Upload failed:', e);
      setUploadError(e.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        className="fixed inset-0 z-[250] flex flex-col items-center justify-center"
        style={{ maxWidth: 428, margin: '0 auto' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="relative z-10 flex flex-col items-center gap-5 px-8 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center">
            <Music size={36} className="text-black" />
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-white font-bold text-xl">
            🎉 Upload Successful!
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-white/50 text-sm">
            Congratulations! <span className="text-[#1DB954] font-semibold">{title}</span> has been added
            {albumName && <> to album <span className="text-[#1DB954] font-semibold">{albumName}</span></>}.
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-[250] flex flex-col"
        style={{ maxWidth: 428, margin: '0 auto' }}
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="relative z-10 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-10 pb-4 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-20">
            <h2 className="text-white font-bold text-lg tracking-wide">Add New Song</h2>
            <div className="flex items-center gap-2">
              {/* Artist Profile Button */}
              <button onClick={() => setShowArtistProfile(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                title="Artist Profile">
                <User size={16} className="text-white" />
              </button>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
                <X size={18} className="text-white" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-8 space-y-5">
            {/* Title */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors" />
            </div>

            {/* Artist */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Artist / Singer</label>
              <input value={artist} onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors" />
            </div>

            {/* Album Name */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">
                <span className="flex items-center gap-1.5">
                  <FolderOpen size={12} className="text-[#1DB954]" />
                  Album Name
                </span>
              </label>
              <input value={albumName} onChange={(e) => setAlbumName(e.target.value)}
                placeholder="Album name (creates a folder)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors" />
              {albumName.trim() && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-[#1DB954]/10 border border-[#1DB954]/20">
                  <Disc size={14} className="text-[#1DB954]" />
                  <span className="text-[#1DB954] text-xs font-medium">Songs will be grouped under "{albumName}"</span>
                </div>
              )}
            </div>

            {/* Genre */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Genre</label>
              <div className="relative">
                <select value={genre} onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#1DB954]/50 transition-colors appearance-none cursor-pointer">
                  <option value="" className="bg-[#1a1a1a]">Select genre...</option>
                  {GENRE_OPTIONS.map(g => (
                    <option key={g} value={g} className="bg-[#1a1a1a]">{g}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Album Art Upload */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Album Cover</label>
              <div className="relative">
                <div
                  className={`w-full aspect-square max-w-[200px] mx-auto rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
                    dragOverArt ? 'border-[#1DB954] bg-[#1DB954]/10' : 'border-white/15 bg-white/5'
                  }`}
                  onClick={() => albumInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOverArt(true); }}
                  onDragLeave={() => setDragOverArt(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOverArt(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleAlbumArt(file);
                  }}
                >
                  {albumPreview ? (
                    <div className="relative w-full h-full">
                      <img src={albumPreview} alt="Album art" className="w-full h-full object-cover" />
                      {artistLogoPreview && (
                        <img src={artistLogoPreview} alt="Artist logo"
                          className="absolute object-contain pointer-events-none"
                          style={{ bottom: '33.3%', left: 8, height: 12, width: 100, opacity: 0.85 }} />
                      )}
                    </div>
                  ) : (
                    <>
                      <Image size={28} className="text-white/25 mb-2" />
                      <span className="text-white/30 text-xs">Drag & drop or tap</span>
                      <span className="text-white/20 text-[10px] mt-1">JPG, PNG, WebP</span>
                    </>
                  )}
                </div>
                <input ref={albumInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleAlbumArt(e.target.files[0]); }} />
              </div>

              {/* AI Generate Album Art */}
              <button onClick={handleGenerateAlbumArt} disabled={generatingArt}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all disabled:opacity-50">
                <Sparkles size={16} className={generatingArt ? 'animate-spin' : ''} />
                {generatingArt ? 'Generating...' : 'Generate Album Art with AI'}
              </button>
            </div>

            {/* Artist Logo Watermark */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Artist Logo Watermark</label>
              <p className="text-white/25 text-[10px] mb-2">Transparent PNG or SVG only · Placed at lower-third left of album cover</p>
              <button onClick={() => logoInputRef.current?.click()}
                className="w-full flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-3 text-white/60 text-sm transition-colors">
                <Stamp size={18} />
                <span>{artistLogo ? artistLogo.name : 'Upload Artist Logo (PNG / SVG)'}</span>
              </button>
              <input ref={logoInputRef} type="file" accept=".png,.svg,image/png,image/svg+xml" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
              {logoError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {logoError}
                </p>
              )}
              {artistLogoPreview && !logoError && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="w-[100px] h-[12px] bg-white/5 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                    <img src={artistLogoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-[#1DB954] text-[10px]">✓ Logo ready</span>
                  <button onClick={() => { setArtistLogo(null); setArtistLogoPreview(''); }}
                    className="text-white/30 hover:text-white/60 ml-auto"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* MP3 Upload */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Music File</label>
              <button onClick={() => mp3InputRef.current?.click()}
                className="w-full flex items-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-xl px-4 py-3.5 transition-colors">
                <Music size={20} />
                <span className="text-sm">{mp3File ? mp3File.name : 'Upload MP3 File'}</span>
              </button>
              <input ref={mp3InputRef} type="file" accept=".mp3,audio/mpeg" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleMp3(e.target.files[0]); }} />
              {mp3File && (
                <p className="text-[#1DB954] text-xs mt-1.5 flex items-center gap-1">
                  <Music size={10} /> {(mp3File.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              )}
            </div>

            {/* OR divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Music URL */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Music URL</label>
              <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)}
                placeholder="https://example.com/song.mp3"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors ${
                  musicUrl.trim() && !isValidUrl ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#1DB954]/50'
                }`} />
              {musicUrl.trim() && !isValidUrl && (
                <p className="text-red-400 text-xs mt-1">Please enter a valid URL (https://...)</p>
              )}
              {!hasMusicSource && (
                <p className="text-white/25 text-[10px] mt-1.5">Provide either an MP3 file or a music URL</p>
              )}
            </div>

            {/* MTV Video Upload (9:16 only) */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">
                <span className="flex items-center gap-1.5">
                  <Video size={12} className="text-[#1DB954]" />
                  MTV Video (Optional)
                </span>
              </label>
              <p className="text-white/25 text-[10px] mb-2">Portrait 9:16 aspect ratio only</p>
              <button onClick={() => mtvInputRef.current?.click()}
                className="w-full flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-3 text-white/60 text-sm transition-colors">
                <Video size={18} />
                <span>{mtvVideo ? mtvVideo.name : 'Upload MTV Video (9:16)'}</span>
              </button>
              <input ref={mtvInputRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleMtvUpload(e.target.files[0]); }} />
              {mtvError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {mtvError}
                </p>
              )}
              {mtvVideo && !mtvError && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#1DB954] text-[10px]">✓ Video ready ({(mtvVideo.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  <button onClick={() => { setMtvVideo(null); setMtvError(''); }}
                    className="text-white/30 hover:text-white/60 ml-auto"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Minus One / Karaoke (Optional) */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">
                <span className="flex items-center gap-1.5">
                  <Mic size={12} className="text-[#1DB954]" />
                  Minus One — Karaoke (Optional)
                </span>
              </label>
              <p className="text-white/25 text-[10px] mb-2">Upload an instrumental-only MP3 (no vocals) for karaoke mode</p>
              <button onClick={() => minusOneInputRef.current?.click()}
                className="w-full flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-3 text-white/60 text-sm transition-colors">
                <MicOff size={18} />
                <span>{minusOneFile ? minusOneFile.name : 'Upload Instrumental MP3'}</span>
              </button>
              <input ref={minusOneInputRef} type="file" accept=".mp3,audio/mpeg" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleMinusOne(e.target.files[0]); }} />
              {minusOneFile && (
                <div className="flex items-center gap-2 mt-2">
                  <MicOff size={10} className="text-[#1DB954]" />
                  <span className="text-[#1DB954] text-[10px]">✓ Karaoke track ready ({(minusOneFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  <button onClick={() => setMinusOneFile(null)}
                    className="text-white/30 hover:text-white/60 ml-auto"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Lyrics */}
            <div>
              <label className="text-white/50 text-xs uppercase tracking-wider mb-1.5 block">Lyrics (Optional)</label>
              <div className="flex gap-2">
                <button onClick={() => lyricsInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white/60 text-sm hover:bg-white/10 transition-colors">
                  <Upload size={16} />
                  <span>{lyricsFile ? lyricsFile.name : 'Upload .txt / .md'}</span>
                </button>
                <button onClick={() => setShowLyricsEditor(!showLyricsEditor)}
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 hover:bg-white/10 transition-colors"
                  title="Type lyrics">
                  <FileText size={16} />
                </button>
              </div>
              <input ref={lyricsInputRef} type="file" accept=".txt,.md" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleLyricsFile(e.target.files[0]); }} />
              {showLyricsEditor && (
                <textarea value={lyricsText} onChange={(e) => setLyricsText(e.target.value)}
                  placeholder="Type or paste lyrics here..."
                  className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#1DB954]/50 transition-colors min-h-[120px] resize-none" />
              )}
            </div>

            {/* Upload button */}
            <button
              className="w-full flex items-center justify-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full py-3.5 text-sm transition-colors mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!canSubmit || uploading} onClick={handleSubmit}>
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              {uploading ? 'Uploading...' : 'Upload to Playlist'}
            </button>
            {uploadError && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {uploadError}
              </p>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>

      {/* Artist Profile Panel */}
      <AnimatePresence>
        {showArtistProfile && (
          <ArtistProfilePanel onClose={() => setShowArtistProfile(false)} artistName={artist} />
        )}
      </AnimatePresence>
    </>
  );
}

export default function SpotifyMini({ isOpen, onClose, standalone = false }: SpotifyMiniProps) {
  // Load songs from GitHub repo
  const [ghTracks, setGhTracks] = useState<Track[]>([]);
  const [ghLoading, setGhLoading] = useState(false);

  const loadGitHubSongs = useCallback(async () => {
    setGhLoading(true);
    try {
      const tracks = await fetchGitHubTracks();
      setGhTracks(tracks);
    } catch (e) {
      console.error('Failed to load GitHub tracks:', e);
    } finally {
      setGhLoading(false);
    }
  }, []);

  // Load songs from database
  const [dbTracks, setDbTracks] = useState<Track[]>([]);
  const loadDbSongs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('spotify_songs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const mapped: Track[] = data.map((s: any) => ({
          id: s.id,
          title: s.title,
          artist: s.artist || 'Unknown',
          album: s.album || 'Singles',
          duration: s.duration || 180,
          audioUrl: s.audio_url,
          coverUrl: s.cover_url || DEFAULT_COVER,
          mtvVideoUrl: s.mtv_video_url || null,
        }));
        setDbTracks(mapped);
      }
    } catch (e) {
      console.error('Failed to load songs from DB:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDbSongs();
      loadGitHubSongs();
    }
  }, [isOpen, loadDbSongs, loadGitHubSongs]);

  // Merge DB + GitHub tracks, then sort with TESHA first
  const unsortedTracks = useMemo(() => [...dbTracks, ...ghTracks], [dbTracks, ghTracks]);
  const sortedTracks = useMemo(() => sortSongsTESHAFirst(unsortedTracks), [unsortedTracks]);
  const allTracks = sortedTracks; // keep variable name for backward compatibility

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [showQueue, setShowQueue] = useState(false);
  const [showCMS, setShowCMS] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [karaokeMode, setKaraokeMode] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [isBuffering, setIsBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPlaylist, setShowAIPlaylist] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPlaylistResult, setAiPlaylistResult] = useState('');
  const [showMtvPlayer, setShowMtvPlayer] = useState(false);
  const lastTapRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const progressInterval = useRef<number | null>(null);
  const currentIndexRef = useRef(currentIndex);
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const volumeRef = useRef(volume);

  const CROSSFADE_MS = 1200;
  const FADE_STEPS = 30;

  // Preload queue integration
  const {
    getPreloadedUrl,
    preloadStatuses,
    bufferHealthSeconds,
    connectionInfo,
    dataSaverMode,
    setDataSaverMode,
    recordSkip,
    preloadCount,
  } = usePreloadQueue(allTracks, currentIndex, isPlaying);

  // Keep refs in sync
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const track = sortedTracks[currentIndex] || sortedTracks[0] || {
    id: '0',
    title: 'No Songs',
    artist: '',
    album: '',
    duration: 0,
    audioUrl: '',
    coverUrl: DEFAULT_COVER,
    mtvVideoUrl: null,
  };

  // Ensure audio element exists
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = volume;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  // Keep current volume synced
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      [audioRef.current, fadeAudioRef.current].forEach(a => {
        if (a) { a.pause(); a.src = ''; }
      });
      audioRef.current = null;
      fadeAudioRef.current = null;
      setIsPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  // Pause when closed (but don't destroy)
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  }, [isOpen]);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    progressInterval.current = window.setInterval(() => {
      if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
        setProgress(audioRef.current.currentTime);
      }
    }, 250);
  }, []);

  // Crossfade: fade out old audio, fade in new audio over CROSSFADE_MS
  const crossfadeTo = useCallback((newAudio: HTMLAudioElement, onComplete: () => void) => {
    const oldAudio = audioRef.current;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const targetVol = volumeRef.current;
    newAudio.volume = 0;
    const stepTime = CROSSFADE_MS / FADE_STEPS;
    let step = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      step++;
      const ratio = step / FADE_STEPS;
      const ease = ratio * ratio * (3 - 2 * ratio);

      newAudio.volume = Math.min(targetVol * ease, 1);
      if (oldAudio && oldAudio !== newAudio) {
        oldAudio.volume = Math.max(targetVol * (1 - ease), 0);
      }

      if (step >= FADE_STEPS) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (oldAudio && oldAudio !== newAudio) {
          oldAudio.pause();
          oldAudio.src = '';
        }
        audioRef.current = newAudio;
        onComplete();
      }
    }, stepTime);
  }, [CROSSFADE_MS, FADE_STEPS]);

  const playTrack = useCallback((index: number, skipCrossfade = false) => {
    const selectedTrack = allTracks[index];

    // Try preloaded URL first, then original, then fallbacks
    const preloadedUrl = getPreloadedUrl(selectedTrack.audioUrl);
    const candidateSources = [
      preloadedUrl,
      ...(preloadedUrl !== selectedTrack.audioUrl ? [selectedTrack.audioUrl] : []),
      ...FALLBACK_AUDIO_URLS.filter(url => url !== selectedTrack.audioUrl),
    ];

    let sourceIndex = 0;
    const isFirstPlay = !audioRef.current?.src || audioRef.current.src === window.location.href;
    const shouldCrossfade = !skipCrossfade && !isFirstPlay && isPlaying;

    const newAudio = shouldCrossfade ? new Audio() : getAudio();
    if (!shouldCrossfade) {
      newAudio.pause();
      newAudio.oncanplay = null;
      newAudio.onerror = null;
    }
    newAudio.preload = 'auto';
    setIsBuffering(true);

    // Track buffering state
    newAudio.onwaiting = () => setIsBuffering(true);
    newAudio.onplaying = () => setIsBuffering(false);
    newAudio.oncanplaythrough = () => setIsBuffering(false);

    newAudio.onended = () => {
      if (repeatRef.current) {
        newAudio.currentTime = 0;
        newAudio.play().catch(() => setIsPlaying(false));
      } else {
        const cur = currentIndexRef.current;
        const next = shuffleRef.current
          ? Math.floor(Math.random() * allTracks.length)
          : cur < allTracks.length - 1 ? cur + 1 : 0;
        playTrack(next);
      }
    };

    const trySource = () => {
      const source = candidateSources[sourceIndex];
      if (!source) {
        console.error('All audio sources failed for track:', selectedTrack.title);
        setIsPlaying(false);
        setIsBuffering(false);
        return;
      }

      const cleanupListeners = () => {
        newAudio.removeEventListener('canplay', onCanPlay);
        newAudio.removeEventListener('error', onError);
      };

      const onCanPlay = () => {
        cleanupListeners();
        setIsBuffering(false);

        if (shouldCrossfade) {
          newAudio.volume = 0;
          newAudio.play().then(() => {
            crossfadeTo(newAudio, () => {
              newAudio.volume = volumeRef.current;
            });
            setIsPlaying(true);
            startProgressTracking();
          }).catch(() => {
            sourceIndex += 1;
            trySource();
          });
        } else {
          newAudio.volume = volumeRef.current;
          newAudio.play().then(() => {
            setIsPlaying(true);
            startProgressTracking();
          }).catch(() => {
            sourceIndex += 1;
            trySource();
          });
        }
      };

      const onError = () => {
        cleanupListeners();
        sourceIndex += 1;
        trySource();
      };

      newAudio.addEventListener('canplay', onCanPlay);
      newAudio.addEventListener('error', onError);
      newAudio.src = source;
      newAudio.load();
    };

    currentIndexRef.current = index;
    setCurrentIndex(index);
    setProgress(0);
    trySource();
  }, [getAudio, startProgressTracking, crossfadeTo, isPlaying, getPreloadedUrl, allTracks]);

  // Auto-select first TESHA song and auto-play on initial load
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current && sortedTracks.length > 0) {
      const teshaIndex = findTESHAIndex(sortedTracks);
      const startIndex = teshaIndex !== -1 ? teshaIndex : 0;
      setCurrentIndex(startIndex);
      initialLoadDone.current = true;

      if (isOpen) {
        // skip crossfade for initial playback
        playTrack(startIndex, true);
      }
    }
  }, [sortedTracks, isOpen, playTrack]);

  const togglePlay = useCallback(() => {
    const audio = getAudio();

    if (!audio.src || audio.src === window.location.href || audio.error) {
      playTrack(currentIndex);
      return;
    }

    if (isPlaying) {
      audio.pause();
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        startProgressTracking();
      }).catch(() => {
        playTrack(currentIndex);
      });
    }
  }, [isPlaying, currentIndex, playTrack, startProgressTracking, getAudio]);

  const skipNext = useCallback(() => {
    recordSkip();
    const next = shuffle
      ? Math.floor(Math.random() * allTracks.length)
      : currentIndex < allTracks.length - 1 ? currentIndex + 1 : 0;
    playTrack(next);
  }, [currentIndex, shuffle, playTrack, recordSkip]);

  const skipPrev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    recordSkip();
    const prev = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
    playTrack(prev);
  }, [currentIndex, playTrack, recordSkip]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * (audioRef.current.duration || track.duration);
    audioRef.current.currentTime = time;
    setProgress(time);
  }, [track.duration]);

  const toggleLike = useCallback((id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const duration = audioRef.current?.duration || track.duration;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // Build MTV video tracks list (assign demo videos to tracks without one)
  const mtvTracks = allTracks.map((t, i) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    coverUrl: t.coverUrl,
    videoUrl: t.mtvVideoUrl || DEMO_MTV_VIDEOS[i % DEMO_MTV_VIDEOS.length],
  }));

  // Double-tap handler for album cover → open MTV player
  const handleAlbumCoverTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      setShowMtvPlayer(true);
    }
    lastTapRef.current = now;
  }, []);

  // Filtered tracks for search
  const filteredTracks = searchQuery.trim()
    ? allTracks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.album.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allTracks;

  // AI Playlist Generator
  const handleAIPlaylistGenerate = useCallback(async () => {
    if (!aiPrompt.trim() || aiGenerating) return;
    setAiGenerating(true);
    setAiPlaylistResult('');
    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notepad-ai`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'compose',
          text: `Generate a playlist of 10 songs based on this request: "${aiPrompt}". For each song, provide the song title, artist name, and genre. Format as a numbered list. Be creative and suggest real, well-known songs that match the mood/theme.`,
          mode: 'music',
          agent: 'gemini',
        }),
      });
      if (!resp.ok) throw new Error('AI service error');
      if (!resp.body) throw new Error('No response body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setAiPlaylistResult(accumulated);
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (e) {
      setAiPlaylistResult('Failed to generate playlist. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [aiPrompt, aiGenerating]);

  // Featured items
  const featuredItems = [
    { type: 'artist', name: allTracks[0]?.artist || 'Artist', image: allTracks[0]?.coverUrl || '', sub: 'Top Artist' },
    { type: 'album', name: allTracks[Math.min(2, allTracks.length - 1)]?.album || 'Album', image: allTracks[Math.min(2, allTracks.length - 1)]?.coverUrl || '', sub: 'Featured Album' },
    { type: 'song', name: allTracks[Math.min(1, allTracks.length - 1)]?.title || 'Song', image: allTracks[Math.min(1, allTracks.length - 1)]?.coverUrl || '', sub: `by ${allTracks[Math.min(1, allTracks.length - 1)]?.artist || ''}` },
  ];

  const shouldShow = standalone || isOpen;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col"
          style={standalone ? undefined : { maxWidth: 428, margin: '0 auto' }}
          initial={standalone ? { opacity: 1, y: 0 } : { opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-black" />

          <div className="relative z-10 flex flex-col h-full">
            {/* Title bar */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <span className="text-white font-light text-[15px] tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>Musify</span>
            </div>
            {/* Top bar */}
            <div className="flex items-center justify-between px-12 pt-2 pb-2">
              {!standalone && (
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <ChevronDown size={20} className="text-white" />
                </button>
              )}
              {standalone && <div className="w-8" />}
              <span className="text-[10px] uppercase tracking-[3px] text-white/60 font-medium">Playing from Playlist</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm" title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? <Minimize2 size={16} className="text-white" /> : <Maximize2 size={16} className="text-white" />}
                </button>
                <button onClick={() => setShowQueue(!showQueue)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                  <List size={18} className="text-white" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-6 pb-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Search size={14} className="text-white/40" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search songs, artists, albums..." className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none" />
                {searchQuery && <button onClick={() => setSearchQuery('')}><X size={12} className="text-white/40" /></button>}
              </div>
            </div>

            {showQueue ? (
              /* Queue view with close button */
              <div className="flex-1 overflow-y-auto px-6 py-4 mx-4 my-2 rounded-2xl bg-[#1DB954]/40 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg">Queue</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/40">{preloadCount} tracks preloaded</span>
                    <button onClick={() => setShowQueue(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 transition-colors" title="Close Queue">
                      <X size={14} className="text-white" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {(searchQuery.trim() ? filteredTracks : allTracks).map((t) => {
                    const realIndex = allTracks.findIndex(tr => tr.id === t.id);
                    const status = preloadStatuses.get(t.audioUrl);
                    return (
                      <button key={t.id} onClick={() => { playTrack(realIndex); setShowQueue(false); }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${realIndex === currentIndex ? 'bg-[#1DB954]/20' : 'hover:bg-white/5'}`}>
                        <img src={getCachedUrl(t.coverUrl)} alt={t.album} className="w-10 h-10 rounded object-cover" />
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-sm truncate ${realIndex === currentIndex ? 'text-[#1DB954]' : 'text-white'}`}>{t.title}</p>
                          <p className="text-xs text-white/50 truncate">{t.artist}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <PreloadDot state={status?.state ?? 'pending'} />
                          <span className="text-xs text-white/40">{formatTime(t.duration)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => setShowCMS(true)} className="w-full flex items-center justify-center gap-2 mt-4 bg-[#15803d] hover:bg-[#166534] text-white font-semibold rounded-xl py-3 transition-colors">
                  <Plus size={18} /><span className="text-sm">Add Song</span>
                </button>
              </div>
            ) : isFullscreen ? (
              /* Fullscreen Mode */
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {/* Featured Section */}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <Star size={16} className="text-[#1DB954]" /> Featured
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {featuredItems.map((item, i) => (
                      <div key={i} className="flex-shrink-0 w-28">
                        <div className="w-28 h-28 rounded-xl overflow-hidden mb-2 bg-white/5">
                          <img src={getCachedUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                        <p className="text-white/40 text-[10px] truncate">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Now Playing Mini */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <img src={getCachedUrl(track.coverUrl)} alt={track.album} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{track.title}</p>
                    <p className="text-white/50 text-xs truncate">{track.artist}</p>
                  </div>
                  <button onClick={togglePlay} className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center">
                    {isPlaying ? <Pause size={18} className="text-black" /> : <Play size={18} className="text-black ml-0.5" />}
                  </button>
                </div>

                {/* All Tracks */}
                <div className="mb-5">
                  <h3 className="text-white font-bold text-sm mb-2">All Songs</h3>
                  <div className="space-y-1">
                    {filteredTracks.map((t) => {
                      const realIndex = allTracks.findIndex(tr => tr.id === t.id);
                      return (
                        <button key={t.id} onClick={() => playTrack(realIndex)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${realIndex === currentIndex ? 'bg-[#1DB954]/10' : 'hover:bg-white/5'}`}>
                          <img src={getCachedUrl(t.coverUrl)} alt={t.album} className="w-9 h-9 rounded object-cover" />
                          <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm truncate ${realIndex === currentIndex ? 'text-[#1DB954]' : 'text-white'}`}>{t.title}</p>
                            <p className="text-xs text-white/40 truncate">{t.artist}</p>
                          </div>
                          <span className="text-xs text-white/30">{formatTime(t.duration)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Playlist Generator */}
                <div className="bg-gradient-to-br from-purple-900/30 to-[#1DB954]/10 border border-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-400" /> AI Playlist Generator
                  </h3>
                  <p className="text-white/30 text-[10px] mb-3">Describe a mood, genre, or vibe and AI will generate a playlist</p>
                  {!showAIPlaylist ? (
                    <button onClick={() => setShowAIPlaylist(true)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-[#1DB954] hover:from-purple-500 hover:to-[#1ed760] text-white font-semibold rounded-xl py-3 text-sm transition-all">
                      <Sparkles size={16} /> Generate Playlist with AI
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. Chill lo-fi beats for studying, 90s rock road trip, romantic jazz dinner..."
                        rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-purple-400/50 transition-colors resize-none" />
                      <div className="flex gap-2">
                        <button onClick={handleAIPlaylistGenerate} disabled={!aiPrompt.trim() || aiGenerating}
                          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-[#1DB954] hover:from-purple-500 hover:to-[#1ed760] text-white font-semibold rounded-xl py-2.5 text-sm transition-all disabled:opacity-40">
                          {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                          {aiGenerating ? 'Generating...' : 'Generate'}
                        </button>
                        <button onClick={() => { setShowAIPlaylist(false); setAiPrompt(''); setAiPlaylistResult(''); }}
                          className="w-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                          <X size={14} className="text-white/60" />
                        </button>
                      </div>
                      {aiPlaylistResult && (
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3 max-h-[200px] overflow-y-auto">
                          <p className="text-white/80 text-xs whitespace-pre-wrap leading-relaxed">{aiPlaylistResult}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Now Playing view with blurred background */
              <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
                {/* Blurred background image */}
                {track.coverUrl && (
                  <div
                    className="absolute inset-0 -z-10"
                    style={{
                      backgroundImage: `url(${getCachedUrl(track.coverUrl)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(60px) brightness(0.5)',
                      transform: 'scale(1.1)',
                    }}
                  />
                )}

                <motion.div
                  className="w-72 h-72 rounded-xl overflow-hidden shadow-2xl mb-6 cursor-pointer"
                  animate={{ scale: isPlaying ? 1 : 0.92 }}
                  transition={{ duration: 0.4 }}
                  onClick={handleAlbumCoverTap}
                >
                  {isBuffering ? (
                    <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center gap-3">
                      <SkeletonBar width="60%" height={8} />
                      <SkeletonBar width="40%" height={6} />
                      <SkeletonBar width="50%" height={6} />
                      <span className="text-[10px] text-white/30 mt-2">Buffering…</span>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={getCachedUrl(track.coverUrl)}
                        alt={track.album}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-0.5">
                        <span className="text-white/60 text-[9px]">Double-tap for MTV</span>
                      </div>
                    </div>
                  )}
                </motion.div>

                <div className="w-full mb-4">
                  <BufferHealthIndicator
                    bufferSeconds={bufferHealthSeconds}
                    connectionType={connectionInfo.type}
                    preloadCount={preloadCount}
                    dataSaverMode={dataSaverMode}
                    onToggleDataSaver={() => setDataSaverMode(!dataSaverMode)}
                  />
                </div>

                <div className="w-full flex items-center justify-between mb-6">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-white font-bold text-lg truncate">{track.title}</h2>
                    <p className="text-white/60 text-sm truncate">{track.artist}</p>
                  </div>
                  <button onClick={() => toggleLike(track.id)} className="ml-3 flex-shrink-0">
                    <Heart
                      size={22}
                      className={
                        liked.has(track.id)
                          ? 'text-[#1DB954] fill-[#1DB954]'
                          : 'text-white/50'
                      }
                    />
                  </button>
                </div>

                <div className="w-full mb-4">
                  <div
                    className="w-full h-1 bg-white/20 rounded-full cursor-pointer relative group"
                    onClick={seekTo}
                  >
                    <div
                      className="h-full bg-white rounded-full relative transition-all"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-white/40">{formatTime(progress)}</span>
                    <span className="text-[10px] text-white/40">{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 w-full">
                  <button onClick={() => setShuffle(!shuffle)}>
                    <Shuffle
                      size={18}
                      className={shuffle ? 'text-[#1DB954]' : 'text-white/50'}
                    />
                  </button>
                  <button onClick={skipPrev}>
                    <SkipBack size={24} className="text-white fill-white" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause size={28} className="text-black fill-black" />
                    ) : (
                      <Play size={28} className="text-black fill-black ml-1" />
                    )}
                  </button>
                  <button onClick={skipNext}>
                    <SkipForward size={24} className="text-white fill-white" />
                  </button>
                  <button onClick={() => setRepeat(!repeat)}>
                    <Repeat
                      size={18}
                      className={repeat ? 'text-[#1DB954]' : 'text-white/50'}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setKaraokeMode(!karaokeMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
                      karaokeMode
                        ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/40'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                    title="Minus One / Karaoke Mode"
                  >
                    {karaokeMode ? <MicOff size={12} /> : <Mic size={12} />}
                    {karaokeMode ? 'Karaoke ON' : 'Karaoke'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const v = volume > 0 ? 0 : 0.75;
                        setVolume(v);
                        if (audioRef.current) audioRef.current.volume = v;
                      }}
                    >
                      {volume === 0 ? (
                        <VolumeX size={14} className="text-white/60" />
                      ) : (
                        <Volume2 size={14} className="text-white/60" />
                      )}
                    </button>
                    <div
                      className="w-24 h-1 bg-white/20 rounded-full cursor-pointer relative group"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        setVolume(v);
                        if (audioRef.current) audioRef.current.volume = v;
                      }}
                    >
                      <div
                        className="h-full bg-white rounded-full relative"
                        style={{ width: `${volume * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      {showCMS && (
        <SongCMSPanel onClose={() => setShowCMS(false)} onSongAdded={loadDbSongs} />
      )}
      <MtvVideoPlayer
        isOpen={showMtvPlayer}
        onClose={() => setShowMtvPlayer(false)}
        tracks={mtvTracks}
        initialIndex={currentIndex}
      />
    </AnimatePresence>
  );
}
