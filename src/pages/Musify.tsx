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
import { useEffect } from 'react';
import SpotifyMini from '@/components/SpotifyMini';

export default function Musify() {
  useEffect(() => {
    document.title = 'Musify - Orange Ai OS';
  }, []);

  return (
    <div className="w-screen h-screen bg-black">
      <SpotifyMini isOpen={true} onClose={() => {}} standalone />
    </div>
  );
}
