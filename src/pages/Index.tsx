import { useState, useCallback, useEffect, useRef } from 'react';
import { startPrecaching, getCachedUrl } from '@/hooks/useVideoCache';
import { weatherScenes } from '@/data/weatherScenes';
import { useTheme } from '@/hooks/useTheme';
import { useSwipe } from '@/hooks/useSwipe';
import { useBackgroundTheme, backgroundThemes } from '@/hooks/useBackgroundTheme';
import StatusBar from '@/components/StatusBar';
import SmartBanner from '@/components/SmartBanner';
import SearchBar from '@/components/SearchBar';
import HomeGrid from '@/components/HomeGrid';
import Dock from '@/components/Dock';
import AppDrawer from '@/components/AppDrawer';
import EdgeHandles from '@/components/EdgeHandles';
import SmileAssistant from '@/components/SmileAssistant';
import IntroSplash from '@/components/IntroSplash';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import PWAUpdateNotification from '@/components/PWAUpdateNotification';
import { leftDrawerApps, rightDrawerApps, topDrawerApps, bottomDrawerApps, homeApps, dockApps } from '@/data/apps';
import { videoAds } from '@/data/videoAds';
import { JOLLIBEE_ASSET_URLS } from '@/components/JollibeeStore';
import { SPOTIFY_ASSET_URLS } from '@/components/SpotifyMini';
import { DrawerDirection } from '@/types';

// Collect all icon image imports
const allIconUrls = [
  ...homeApps, ...dockApps,
  ...leftDrawerApps, ...rightDrawerApps,
  ...topDrawerApps, ...bottomDrawerApps,
].map(a => a.image).filter((v): v is string => !!v);

// Collect all logo assets
import originLogo from '@/assets/icons/origin-os-logo.png';
import cortexLogo from '@/assets/icons/cortex-logo.png';
import wwwLogo from '@/assets/icons/www-logo.png';
import aiLogo from '@/assets/icons/ai-logo.png';
import sysLogo from '@/assets/icons/system-utilities-logo.png';
import orangeAiLogoPng from '@/assets/orange-ai-logo.png';
const allLogos = [originLogo, cortexLogo, wwwLogo, aiLogo, sysLogo];

// Collect all ad assets
const adImageUrls = [
  'https://images.unsplash.com/photo-1619454016518-697bc231e7cb?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800&h=320&fit=crop',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=320&fit=crop',
];
const adVideoUrls = [...videoAds.map(v => v.video), '/videos/ads/sponsored-grok.mp4'];

const drawerData: Record<DrawerDirection, typeof leftDrawerApps> = {
  left: rightDrawerApps,
  right: leftDrawerApps,
  top: bottomDrawerApps,
  bottom: topDrawerApps,
};

const drawerTitles: Record<DrawerDirection, string> = {
  right: 'Decentralized Cortex',
  left: 'World Wide Web',
  top: 'System Utilities',
  bottom: 'Artificial Intelligence',
};

const Index = () => {
  const { theme, toggleTheme } = useTheme();
  const [dockAppActive, setDockAppActive] = useState(false);
  const [gridAppActive, setGridAppActive] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<DrawerDirection | null>(null);
  const appActive = dockAppActive || gridAppActive || openDrawer !== null;
  const { videoUrl: bgVideoUrl } = useBackgroundTheme();
  const [showIntro, setShowIntro] = useState(true);
  const [criticalAssetsReady, setCriticalAssetsReady] = useState(false);
  const precacheStarted = useRef(false);

  useEffect(() => {
    if (precacheStarted.current) return;
    precacheStarted.current = true;

    // Start priority-based precaching:
    // P0 (logos + background) resolves first → signals intro splash can finish
    // P1 (icons) loads after P0
    // P2 (weather videos + ads) loads last
    startPrecaching({
      logos: allLogos,
      backgrounds: ['/videos/background.mp4'],
      backgroundThemes: backgroundThemes.map(t => t.videoUrl),
      icons: [...new Set(allIconUrls)],
      weatherVideos: weatherScenes.map(s => s.videoUrl),
      adAssets: [...adVideoUrls, ...adImageUrls],
      jollibeeAssets: JOLLIBEE_ASSET_URLS,
      spotifyAssets: SPOTIFY_ASSET_URLS,
      orangeAiAssets: ['/videos/orange-ai-bg.mp4', orangeAiLogoPng],
    }).then(() => {
      setCriticalAssetsReady(true);
    });
  }, []);

  const handleSwipe = useCallback((direction: DrawerDirection) => {
    setOpenDrawer(direction);
    (window as any).__smartBannerReset?.();
  }, []);

  const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp } = useSwipe(handleSwipe);

  return (
    <>
      {showIntro && (
        <IntroSplash
          onComplete={() => setShowIntro(false)}
          assetsReady={criticalAssetsReady}
        />
      )}

      <div
        className="fixed inset-0 flex flex-col overflow-hidden select-none"
        style={{ maxWidth: 428, margin: '0 auto' }}
        onTouchStart={appActive ? undefined : onTouchStart}
        onTouchEnd={appActive ? undefined : onTouchEnd}
        onMouseDown={appActive ? undefined : onMouseDown}
        onMouseUp={appActive ? undefined : onMouseUp}
      >
        <video
          key={bgVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          src={bgVideoUrl}
        />
        <div className="absolute inset-0 z-[1] bg-background/10" />

        <div className="relative z-10 flex flex-col h-full">
          <StatusBar theme={theme} toggleTheme={toggleTheme} />
          <div className="flex-1 flex flex-col justify-between py-4" data-vortex-container>
            <SmartBanner />
            <SearchBar />
            <HomeGrid onAppActiveChange={setGridAppActive} />
            <Dock onAppActiveChange={setDockAppActive} />
          </div>
        </div>

        {!appActive && <EdgeHandles onOpenDrawer={handleSwipe} />}

        {(['left', 'right', 'top', 'bottom'] as DrawerDirection[]).map(dir => (
          <AppDrawer
            key={dir}
            apps={drawerData[dir]}
            direction={dir}
            isOpen={openDrawer === dir}
            onClose={() => setOpenDrawer(null)}
            title={drawerTitles[dir]}
          />
        ))}

        <SmileAssistant introComplete={!showIntro} />
        <PWAInstallBanner />
        <PWAUpdateNotification />
      </div>
    </>
  );
};

export default Index;
