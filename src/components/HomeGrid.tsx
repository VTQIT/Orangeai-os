import { useState, useEffect } from 'react';
import IconStackApp from './IconStackApp';
import JollibeeStore from './JollibeeStore';
import SpotifyMini from './SpotifyMini';
import GrokMini from './GrokMini';
import { homeApps } from '@/data/apps';
import grokIcon from '@/assets/icons/grok.png';
import grokipediaIcon from '@/assets/icons/grokipedia.png';
import type { StackedIcon } from './IconStackApp';

const grokStack: StackedIcon[] = [
  { id: 'grok', name: 'Grok', image: grokIcon, url: 'https://grok.com', iconScale: 1.56 },
  { id: 'grokipedia', name: 'Grokipedia', image: grokipediaIcon, url: 'https://grokipedia.com/', iconScale: 1.3 },
];

export default function HomeGrid({ onAppActiveChange }: { onAppActiveChange?: (active: boolean) => void }) {
  const [jollibeeOpen, setJollibeeOpen] = useState(false);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [grokOpen, setGrokOpen] = useState(false);

  const anyOpen = jollibeeOpen || spotifyOpen || grokOpen;

  useEffect(() => {
    onAppActiveChange?.(anyOpen);
  }, [anyOpen, onAppActiveChange]);

  const handleGrokStack = (icon: StackedIcon) => {
    if (icon.id === 'grok') {
      setGrokOpen(true);
    } else {
      window.open(icon.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleIconAction = (appName: string) => (icon: StackedIcon) => {
    if (appName === 'Jollibee') {
      setJollibeeOpen(true);
    } else if (appName === 'Musify') {
      setSpotifyOpen(true);
    } else if (icon.url) {
      window.open(icon.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-4 px-4 py-4 place-items-center">
        {homeApps.map(app => {
          if (app.id === 6) {
            return (
              <IconStackApp
                key={app.id}
                initialStack={grokStack}
                onCustomAction={handleGrokStack}
              />
            );
          }

          const initialStack: StackedIcon[] = [{
            id: String(app.id),
            name: app.name,
            image: app.image,
            url: app.url || '',
            iconScale: app.iconScale,
          }];

          const needsCustomAction = app.name === 'Jollibee' || app.name === 'Musify';

          return (
            <IconStackApp
              key={app.id}
              initialStack={initialStack}
              onCustomAction={needsCustomAction ? handleIconAction(app.name) : undefined}
            />
          );
        })}
      </div>
      <JollibeeStore isOpen={jollibeeOpen} onClose={() => setJollibeeOpen(false)} />
      <SpotifyMini isOpen={spotifyOpen} onClose={() => setSpotifyOpen(false)} />
      <GrokMini isOpen={grokOpen} onClose={() => setGrokOpen(false)} />
    </>
  );
}
