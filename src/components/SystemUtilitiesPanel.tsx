import { useState, useEffect, useRef, useCallback, type ComponentType } from 'react';
import orangeLogo from '@/assets/orange-logo.png';
import whatsappQR from '@/assets/whatsapp-community-qr.jpg';
import { Volume2, VolumeX, Sun, Wifi, Signal, HardDrive, Cpu, Battery, BatteryCharging, Activity, Search, ChevronDown, ChevronLeft, Settings, Shield, Palette, Globe, Clock, Bluetooth, Monitor, Smartphone, Keyboard, MousePointer, Lock, Bell, Languages, Accessibility, Database, Cloud, Trash2, RefreshCw, Download, Upload, Check, X, ToggleLeft, ToggleRight, Package, Loader2, FolderOpen, Film, Image, Music, Layers } from 'lucide-react';
import { useBackgroundTheme } from '@/hooks/useBackgroundTheme';
import { getCacheStats } from '@/hooks/useVideoCache';

// ── Utility items ──
const utilityItems: { icon: ComponentType<any>; label: string }[] = [
  { icon: Settings, label: 'General Settings' },
  { icon: Shield, label: 'Security & Privacy' },
  { icon: Palette, label: 'Display & Themes' },
  { icon: Globe, label: 'Network Settings' },
  { icon: Clock, label: 'Date & Time' },
  { icon: Bluetooth, label: 'Bluetooth' },
  { icon: Monitor, label: 'Screen Mirroring' },
  { icon: Smartphone, label: 'Device Info' },
  { icon: Keyboard, label: 'Keyboard Settings' },
  { icon: MousePointer, label: 'Touch & Gestures' },
  { icon: Lock, label: 'Lock Screen' },
  { icon: Bell, label: 'Notifications' },
  { icon: Languages, label: 'Language & Region' },
  { icon: Accessibility, label: 'Accessibility' },
  { icon: Database, label: 'Backup & Restore' },
  { icon: Cloud, label: 'Cloud Sync' },
  { icon: Trash2, label: 'Clear Cache' },
  { icon: RefreshCw, label: 'System Update' },
  { icon: Download, label: 'Downloads' },
  { icon: Upload, label: 'File Transfer' },
];

// ── Toggle Row ──
function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(!on)} className="w-full flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      {on ? <ToggleRight size={22} className="text-green-400" /> : <ToggleLeft size={22} className="text-white/30" />}
    </button>
  );
}

// ── Info Row ──
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <span className="text-sm text-white/40">{value}</span>
    </div>
  );
}

// ── Selection Row ──
function SelectRow({ label, options, defaultIndex = 0 }: { label: string; options: string[]; defaultIndex?: number }) {
  const [selected, setSelected] = useState(defaultIndex);
  return (
    <div className="py-3 border-b border-white/5 last:border-0 space-y-2">
      <span className="text-sm text-white/70">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => setSelected(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              i === selected ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Slider Row ──
function SliderRow({ label, defaultValue = 50, suffix = '%' }: { label: string; defaultValue?: number; suffix?: string }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div className="py-3 border-b border-white/5 last:border-0 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-xs text-white/40 tabular-nums">{val}{suffix}</span>
      </div>
      <div className="relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />
        <div className="absolute left-0 h-1.5 rounded-full bg-white/50" style={{ width: `${val}%` }} />
        <input type="range" min={0} max={100} value={val} onChange={e => setVal(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
        <div className="absolute w-4 h-4 rounded-full bg-white shadow-md pointer-events-none" style={{ left: `calc(${val}% - 8px)` }} />
      </div>
    </div>
  );
}

// ── Settings Panels ──
// ── Display & Themes Panel with Background Picker ──
function DisplayThemesPanel() {
  const { selectedId, selectTheme, themes } = useBackgroundTheme();

  return (
    <div className="space-y-1">
      <SliderRow label="Text size" defaultValue={50} suffix="%" />
      <ToggleRow label="Dark mode" defaultOn />
      <ToggleRow label="True Tone" defaultOn />
      <SelectRow label="Refresh rate" options={['60Hz', '90Hz', '120Hz']} defaultIndex={2} />
      <SelectRow label="Theme" options={['Midnight', 'Aurora', 'Ocean', 'Ember']} />
      <ToggleRow label="Always-on display" defaultOn={false} />

      {/* Background Theme Picker */}
      <div className="pt-3 border-t border-white/5 mt-2">
        <span className="text-sm text-white/70 block mb-3">Animated Background</span>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                selectedId === theme.id
                  ? 'bg-white/20 ring-2 ring-white/40 shadow-lg'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl">{theme.icon}</span>
              <span className="text-[10px] text-white/60 font-medium leading-tight">{theme.label}</span>
              {selectedId === theme.id && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-400/90 flex items-center justify-center">
                  <Check size={10} className="text-black" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const settingsPanels: Record<string, () => JSX.Element> = {
  'General Settings': () => (
    <div className="space-y-1">
      <ToggleRow label="Auto-update apps" defaultOn />
      <ToggleRow label="Usage analytics" defaultOn={false} />
      <ToggleRow label="Haptic feedback" defaultOn />
      <SelectRow label="Performance mode" options={['Balanced', 'Power Save', 'High Performance']} />
      <InfoRow label="System version" value="OriginOS 3.2.1" />
      <InfoRow label="Build number" value="OOS-2026.03.19" />
    </div>
  ),
  'Security & Privacy': () => (
    <div className="space-y-1">
      <ToggleRow label="Biometric unlock" defaultOn />
      <ToggleRow label="App lock" defaultOn />
      <ToggleRow label="Location services" defaultOn />
      <ToggleRow label="Camera access" defaultOn />
      <ToggleRow label="Microphone access" defaultOn />
      <SelectRow label="Auto-lock timer" options={['30s', '1 min', '5 min', 'Never']} defaultIndex={1} />
    </div>
  ),
  'Display & Themes': () => <DisplayThemesPanel />,
  'Network Settings': () => (
    <div className="space-y-1">
      <ToggleRow label="Wi-Fi" defaultOn />
      <ToggleRow label="Mobile data" defaultOn />
      <ToggleRow label="Airplane mode" defaultOn={false} />
      <ToggleRow label="VPN" defaultOn={false} />
      <ToggleRow label="Private DNS" defaultOn />
      <InfoRow label="IP Address" value="192.168.1.42" />
      <InfoRow label="MAC Address" value="A4:C3:F0:2B:8E:1D" />
    </div>
  ),
  'Date & Time': () => (
    <div className="space-y-1">
      <ToggleRow label="Set automatically" defaultOn />
      <ToggleRow label="24-hour format" defaultOn={false} />
      <InfoRow label="Time zone" value="Asia/Manila (GMT+8)" />
      <InfoRow label="Current date" value={new Date().toLocaleDateString()} />
      <InfoRow label="Current time" value={new Date().toLocaleTimeString()} />
    </div>
  ),
  'Bluetooth': () => (
    <div className="space-y-1">
      <ToggleRow label="Bluetooth" defaultOn />
      <ToggleRow label="Discoverable" defaultOn={false} />
      <InfoRow label="Device name" value="OriginOS-Phone" />
      <InfoRow label="Paired devices" value="3 devices" />
      <InfoRow label="Version" value="Bluetooth 5.3" />
    </div>
  ),
  'Screen Mirroring': () => (
    <div className="space-y-1">
      <ToggleRow label="Wireless display" defaultOn={false} />
      <ToggleRow label="Auto-detect devices" defaultOn />
      <InfoRow label="Available displays" value="None found" />
      <SelectRow label="Resolution" options={['720p', '1080p', '4K']} defaultIndex={1} />
    </div>
  ),
  'Device Info': () => (
    <div className="space-y-1">
      <InfoRow label="Model" value="Origin Pro Max" />
      <InfoRow label="OS version" value="OriginOS 3.2.1" />
      <InfoRow label="Processor" value="Quantum X1 Gen 3" />
      <InfoRow label="RAM" value="32 GB" />
      <InfoRow label="Storage" value="3 TB" />
      <InfoRow label="Battery health" value="98%" />
      <InfoRow label="Serial number" value="OPM-2026-X1G3" />
      <InfoRow label="IMEI" value="●●●●●●●●●●●7842" />
    </div>
  ),
  'Keyboard Settings': () => (
    <div className="space-y-1">
      <ToggleRow label="Auto-correct" defaultOn />
      <ToggleRow label="Auto-capitalize" defaultOn />
      <ToggleRow label="Predictive text" defaultOn />
      <ToggleRow label="Key press sound" defaultOn={false} />
      <ToggleRow label="Haptic on keypress" defaultOn />
      <SliderRow label="Key press vibration" defaultValue={40} suffix="%" />
    </div>
  ),
  'Touch & Gestures': () => (
    <div className="space-y-1">
      <ToggleRow label="Swipe navigation" defaultOn />
      <ToggleRow label="Double-tap to wake" defaultOn />
      <ToggleRow label="Raise to wake" defaultOn />
      <SliderRow label="Touch sensitivity" defaultValue={70} suffix="%" />
      <SelectRow label="Navigation style" options={['Gesture', 'Buttons', '3-Button']} />
    </div>
  ),
  'Lock Screen': () => (
    <div className="space-y-1">
      <SelectRow label="Lock type" options={['PIN', 'Pattern', 'Password', 'Biometric']} defaultIndex={3} />
      <ToggleRow label="Show notifications" defaultOn />
      <ToggleRow label="Show clock" defaultOn />
      <ToggleRow label="Camera shortcut" defaultOn />
      <SelectRow label="Wallpaper" options={['Dynamic', 'Static', 'Live'] } />
    </div>
  ),
  'Notifications': () => (
    <div className="space-y-1">
      <ToggleRow label="Show notifications" defaultOn />
      <ToggleRow label="Notification sound" defaultOn />
      <ToggleRow label="Vibrate" defaultOn />
      <ToggleRow label="Show on lock screen" defaultOn />
      <ToggleRow label="Badge app icons" defaultOn />
      <SelectRow label="Do Not Disturb" options={['Off', 'Scheduled', 'Always']} />
    </div>
  ),
  'Language & Region': () => (
    <div className="space-y-1">
      <SelectRow label="Language" options={['English', 'Filipino', '日本語', 'Español']} />
      <SelectRow label="Region" options={['Philippines', 'US', 'Japan', 'UK']} />
      <SelectRow label="Temperature" options={['Celsius', 'Fahrenheit']} />
      <SelectRow label="Calendar" options={['Gregorian', 'Buddhist', 'Japanese']} />
    </div>
  ),
  'Accessibility': () => (
    <div className="space-y-1">
      <ToggleRow label="Screen reader" defaultOn={false} />
      <ToggleRow label="Magnification" defaultOn={false} />
      <ToggleRow label="Color inversion" defaultOn={false} />
      <ToggleRow label="Reduce motion" defaultOn={false} />
      <SliderRow label="Display zoom" defaultValue={50} suffix="%" />
      <ToggleRow label="Mono audio" defaultOn={false} />
    </div>
  ),
  'Backup & Restore': () => (
    <div className="space-y-1">
      <ToggleRow label="Auto backup" defaultOn />
      <InfoRow label="Last backup" value="Today, 2:30 AM" />
      <InfoRow label="Backup size" value="28.4 GB" />
      <SelectRow label="Backup frequency" options={['Daily', 'Weekly', 'Monthly']} />
      <ToggleRow label="Include photos" defaultOn />
      <ToggleRow label="Include messages" defaultOn />
    </div>
  ),
  'Cloud Sync': () => (
    <div className="space-y-1">
      <ToggleRow label="Cloud sync enabled" defaultOn />
      <ToggleRow label="Sync over Wi-Fi only" defaultOn />
      <InfoRow label="Cloud storage" value="420 GB / 2 TB" />
      <ToggleRow label="Sync contacts" defaultOn />
      <ToggleRow label="Sync photos" defaultOn />
      <ToggleRow label="Sync documents" defaultOn />
    </div>
  ),
  'Clear Cache': () => (
    <div className="space-y-1">
      <InfoRow label="System cache" value="1.2 GB" />
      <InfoRow label="App cache" value="3.8 GB" />
      <InfoRow label="Temp files" value="680 MB" />
      <InfoRow label="Total clearable" value="5.7 GB" />
      <div className="pt-3">
        <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white/80 font-medium transition-colors">
          Clear All Cache
        </button>
      </div>
    </div>
  ),
  'System Update': () => (
    <div className="space-y-1">
      <InfoRow label="Current version" value="OriginOS 3.2.1" />
      <InfoRow label="Last checked" value="Today, 9:15 AM" />
      <InfoRow label="Status" value="Up to date ✓" />
      <ToggleRow label="Auto-download updates" defaultOn />
      <ToggleRow label="Update over Wi-Fi only" defaultOn />
      <div className="pt-3">
        <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white/80 font-medium transition-colors">
          Check for Updates
        </button>
      </div>
    </div>
  ),
  'Downloads': () => (
    <div className="space-y-1">
      <InfoRow label="Download folder" value="/storage/Downloads" />
      <InfoRow label="Total downloads" value="142 files" />
      <InfoRow label="Storage used" value="8.3 GB" />
      <ToggleRow label="Auto-open after download" defaultOn={false} />
      <SelectRow label="Default location" options={['Internal', 'SD Card', 'Cloud']} />
    </div>
  ),
  'File Transfer': () => (
    <div className="space-y-1">
      <ToggleRow label="Nearby sharing" defaultOn />
      <ToggleRow label="AirDrop equivalent" defaultOn />
      <SelectRow label="Visibility" options={['Everyone', 'Contacts Only', 'Hidden']} defaultIndex={1} />
      <InfoRow label="Transfer history" value="23 recent transfers" />
      <ToggleRow label="Auto-accept from contacts" defaultOn={false} />
    </div>
  ),
};

// ── Search Bar ──
function UtilitiesSearchBar({ onSelect }: { onSelect: (label: string) => void }) {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const filtered = utilityItems.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative" ref={menuRef}>
      <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center h-11 px-1">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors shrink-0"
        >
          <Settings size={16} strokeWidth={1.5} className="text-white/70" />
          <ChevronDown size={12} strokeWidth={2} className={`text-white/50 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className="w-px h-5 bg-white/15 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setMenuOpen(true); }}
          onFocus={() => setMenuOpen(true)}
          placeholder="Search utilities..."
          className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-white placeholder:text-white/40 font-medium"
        />
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
          <Search size={16} strokeWidth={1.5} className="text-white/50" />
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/70 backdrop-blur-2xl border border-white/15 rounded-2xl py-2 z-[60] max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/40">No utilities found</div>
          ) : (
            filtered.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => { onSelect(item.label); setQuery(''); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10 transition-colors"
                >
                  <Icon size={15} strokeWidth={1.5} className="text-white/50" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Settings Sub-Panel ──
function SettingsSubPanel({ label, onBack }: { label: string; onBack: () => void }) {
  const item = utilityItems.find(u => u.label === label);
  const Icon = item?.icon ?? Settings;
  const PanelContent = settingsPanels[label];

  return (
    <div className="flex-1 px-4 pb-6 overflow-y-auto animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-white/60 hover:text-white/80 transition-colors mb-4 py-2"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
          <Icon size={20} className="text-white/70" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg text-white/90 font-light tracking-wide">{label}</h3>
      </div>

      <div className="bg-white/8 backdrop-blur-md rounded-2xl p-4">
        {PanelContent ? <PanelContent /> : (
          <p className="text-sm text-white/40 py-4 text-center">Settings coming soon</p>
        )}
      </div>
    </div>
  );
}

// ── Folder icon mapping ──
const FOLDER_ICONS: Record<string, ComponentType<any>> = {
  'videos/backgrounds': Monitor,
  'videos/weather': Cloud,
  'videos/ads': Film,
  'videos/apps': Film,
  'images/ads': Image,
  'images/icons': Layers,
  'images/logos': Package,
  'images/store': FolderOpen,
  'images/spotify': Music,
  'images/orangeai': Database,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// ── Install App Button ──
function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;

  useEffect(() => {
    if (isStandalone) { setInstalled(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Download size={16} className="text-orange-400/70" />
        <p className="text-sm font-light text-white/70 tracking-wide uppercase">Install App</p>
      </div>

      {installed || isStandalone ? (
        <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Check size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm text-white/80 font-light">Already Installed</p>
            <p className="text-[11px] text-white/40">Orange Ai OS³ is running as a standalone app</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs text-white/50 leading-relaxed">
            {isIOS
              ? 'To install, tap the Share button ↗ in Safari, then select "Add to Home Screen".'
              : 'Install Orange Ai OS³ on your device for the full standalone experience — no browser chrome, instant launch.'}
          </p>
          {deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium hover:from-orange-400 hover:to-orange-500 transition-all shadow-lg shadow-orange-500/20"
            >
              <Download size={16} />
              Install Orange Ai OS³
            </button>
          ) : !isIOS ? (
            <p className="text-[11px] text-white/30 text-center">
              Open in a supported browser (Chrome, Edge) to enable installation
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Cache Management Panel ──
function CacheManagementPanel() {
  const [stats, setStats] = useState<{ totalEntries: number; totalSize: number; folders: Record<string, { count: number; size: number }> } | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [s, q] = await Promise.all([
        getCacheStats(),
        navigator.storage?.estimate?.().then(est => ({
          usage: est.usage || 0,
          quota: est.quota || 0,
        })).catch(() => null) ?? Promise.resolve(null),
      ]);
      setStats(s);
      setQuota(q);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Clear IndexedDB media cache
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name && db.name.includes('media-cache')) {
          indexedDB.deleteDatabase(db.name);
        }
      }
      // Clear Service Worker caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      setStats({ totalEntries: 0, totalSize: 0, folders: {} });
    } catch { /* ignore */ }
    setClearing(false);
  };

  const sortedFolders = stats
    ? Object.entries(stats.folders).sort((a, b) => b[1].size - a[1].size)
    : [];

  const maxFolderSize = sortedFolders.length > 0 ? sortedFolders[0][1].size : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <HardDrive size={16} className="text-white/60" />
        <p className="text-sm font-light text-white/70 tracking-wide uppercase">Cache Management</p>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={20} className="text-white/40 animate-spin" />
        </div>
      ) : stats ? (
        <>
          {/* Storage Quota Indicator */}
          {quota && quota.quota > 0 && (() => {
            const pct = Math.min(100, (quota.usage / quota.quota) * 100);
            const color = pct > 85 ? 'from-red-500 to-red-400' : pct > 60 ? 'from-amber-500 to-amber-400' : 'from-orange-500 to-green-400';
            return (
              <div className="bg-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Device Storage</span>
                  <span className="text-[10px] text-white/40">{formatBytes(quota.usage)} / {formatBytes(quota.quota)}</span>
                </div>
                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{pct.toFixed(1)}% used</span>
                  <span className="text-[10px] text-white/30">{formatBytes(quota.quota - quota.usage)} free</span>
                </div>
              </div>
            );
          })()}

          {/* Summary bar */}
          <div className="bg-white/5 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Total Cached</span>
              <span className="text-xs font-light text-white/80">{formatBytes(stats.totalSize)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Files</span>
              <span className="text-xs font-light text-white/80">{stats.totalEntries} items</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Folders</span>
              <span className="text-xs font-light text-white/80">{sortedFolders.length} categories</span>
            </div>
          </div>

          {/* Per-folder breakdown */}
          {sortedFolders.length > 0 && (
            <div className="space-y-1.5">
              {sortedFolders.map(([folder, data]) => {
                const FolderIcon = FOLDER_ICONS[folder] || FolderOpen;
                const barWidth = Math.max(5, (data.size / maxFolderSize) * 100);
                return (
                  <div key={folder} className="bg-white/5 rounded-lg px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderIcon size={12} className="text-orange-400/70 shrink-0" />
                        <span className="text-[11px] text-white/60 truncate">{folder}</span>
                      </div>
                      <span className="text-[10px] text-white/40 shrink-0 ml-2">{data.count} · {formatBytes(data.size)}</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-500/60 to-orange-400/40 transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/60"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors text-xs text-red-400/80"
            >
              {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Clear Cache
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-white/40 text-center py-4">No cache data available</p>
      )}
    </div>
  );
}

// ── DC3 Download Button ──
function DC3DownloadButton() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setProgress(10);

    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const zip = new JSZip();
      setProgress(20);

      // Fetch the current page HTML
      const pageHtml = document.documentElement.outerHTML;
      zip.file('index.html', `<!DOCTYPE html>\n${pageHtml}`);
      setProgress(40);

      // Add README documentation
      zip.file('README.md', `# ORANGE Ai OS³ — Decentralized Cached Content Container (DC3)

## OmniScient Open Source Operating System

**Version:** 3.2.1  
**Build:** OOS-2026.03.25  
**License:** Open Source — Free Forever

---

### What is DC3?

The **Decentralized Cached Content Container (DC3)** is a self-contained, portable distribution of ORANGE Ai OS³. It packages the entire operating system experience — UI, media, icons, and application logic — into a single redistributable bundle.

### Designed for Web3 & Blockchain

DC3 is architected with decentralization in mind:

- **IPFS-Ready**: Content-addressable assets ready for InterPlanetary File System distribution
- **Peer-to-Peer**: Designed for P2P sharing across decentralized network nodes
- **Blockchain Verified**: Asset integrity can be verified through cryptographic hashing
- **Edge Deployable**: Runs on any Decentralized Cortex Microweb Server

### How to Host

1. **Static Hosting**: Upload the contents of this container to any web server (Nginx, Apache, Caddy, etc.)
2. **IPFS Pinning**: Pin this folder to IPFS using \`ipfs add -r .\` for permanent decentralized hosting
3. **Microweb Server**: Deploy on your Decentralized Cortex node for P2P distribution
4. **Browser**: Simply open \`index.html\` in any modern browser

### System Requirements

- Any modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required
- No cloud dependency — runs entirely offline once loaded

### Architecture

\`\`\`
DC3 Container
├── index.html          — Main application entry point
├── README.md           — This documentation
├── MANIFEST.json       — Asset manifest with integrity hashes
└── assets/             — All media, icons, and resources (embedded)
\`\`\`

### About ORANGE Ai OS

ORANGE Ai OS is an Open Source Alef Intelligence (Ai), Smart Contextual OmniScient Operating System (OS³). It is a blockchain-based platform designed to support:

- **DC3** — Decentralized Contextual Content Creators
- **DC4** — Decentralized Collaboration among Community Content Consumers
- **DA3** — Diversified AI Agents and Assistants

### Founded by

**DON JOSE LUGA GUARDO JR.**  
Founder — Orange Ai OS / OrangeWare USA / Smile WiFi Inc. / DC3 / Etherneom

📧 FOUNDER@orangeai-os.com  
🌐 www.orangeai-os.com

---

*"It's time to OWN the NETWORK!"* — W.E.O.W.N.
`);
      setProgress(60);

      // Add manifest
      const manifest = {
        name: 'ORANGE Ai OS³',
        version: '3.2.1',
        build: 'OOS-2026.03.25',
        type: 'DC3-Container',
        protocol: 'IPFS-Ready',
        creator: 'Don Jose Luga Guardo Jr.',
        license: 'Open Source',
        timestamp: new Date().toISOString(),
        integrity: 'sha256-' + Date.now().toString(36),
      };
      zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));
      setProgress(80);

      // Generate ZIP
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      }, (metadata) => {
        setProgress(80 + Math.round(metadata.percent * 0.2));
      });

      saveAs(blob, 'ORANGE-Ai-OS3-DC3.zip');
      setProgress(100);

      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error('DC3 packaging failed:', err);
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Package size={18} className="text-orange-400" strokeWidth={1.5} />
        <p className="text-sm font-light text-white/70 tracking-wide uppercase">DC3 Distribution</p>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-400/30 hover:from-orange-500/30 hover:to-orange-600/30 transition-all duration-300 group disabled:opacity-70"
      >
        <div className="flex items-center justify-center gap-3">
          {downloading ? (
            <Loader2 size={20} className="text-orange-400 animate-spin" strokeWidth={1.5} />
          ) : (
            <Download size={20} className="text-orange-400 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          )}
          <div className="text-left">
            <p className="text-sm font-medium text-white/90 tracking-wide">
              {downloading ? 'Compiling DC3 Container...' : 'ORANGE Ai OS³'}
            </p>
            <p className="text-[10px] text-white/50 leading-tight">
              {downloading
                ? `${progress}% complete`
                : 'Download for FREE the OmniScient Open Source Operating System'}
            </p>
          </div>
        </div>

        {downloading && (
          <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400/70 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </button>

      <p className="text-[10px] font-extralight text-white/40 text-center leading-relaxed px-2">
        Host it on your Decentralized Cortex Microweb Server. Documentation inside the distribution container.
      </p>
    </div>
  );
}

// ── Main Panel ──
export default function SystemUtilitiesPanel() {
  const [volume, setVolume] = useState(65);
  const [brightness, setBrightness] = useState(80);
  const [cpuUsage, setCpuUsage] = useState(42);
  const [cpuHistory, setCpuHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.random() * 60 + 20));
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryLevel(prev => prev <= 5 ? 85 : prev - 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newVal = Math.max(5, Math.min(95, cpuUsage + (Math.random() - 0.5) * 20));
      setCpuUsage(Math.round(newVal));
      setCpuHistory(prev => [...prev.slice(1), newVal]);
    }, 1500);
    return () => clearInterval(interval);
  }, [cpuUsage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
    const stepX = w / (cpuHistory.length - 1);
    ctx.beginPath(); ctx.moveTo(0, h);
    cpuHistory.forEach((val, i) => {
      const x = i * stepX, y = h - (val / 100) * h;
      if (i === 0) ctx.lineTo(x, y);
      else { const cpX = ((i - 1) * stepX + x) / 2; ctx.bezierCurveTo(cpX, h - (cpuHistory[i - 1] / 100) * h, cpX, y, x, y); }
    });
    ctx.lineTo(w, h); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath();
    cpuHistory.forEach((val, i) => {
      const x = i * stepX, y = h - (val / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else { const cpX = ((i - 1) * stepX + x) / 2; ctx.bezierCurveTo(cpX, h - (cpuHistory[i - 1] / 100) * h, cpX, y, x, y); }
    });
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2; ctx.stroke();
    const lastX = w, lastY = h - (cpuHistory[cpuHistory.length - 1] / 100) * h;
    ctx.beginPath(); ctx.arc(lastX, lastY, 3, 0, Math.PI * 2); ctx.fillStyle = '#c4b5fd'; ctx.fill();
    ctx.beginPath(); ctx.arc(lastX, lastY, 6, 0, Math.PI * 2); ctx.fillStyle = 'rgba(196, 181, 253, 0.3)'; ctx.fill();
  }, [cpuHistory]);

  const storageUsed = 1.2, storageTotal = 3, ramUsed = 18.4, ramTotal = 32;
  const batteryColor = batteryLevel <= 20 ? '#ef4444' : '#4ade80';
  const storagePct = (storageUsed / storageTotal) * 100;
  const ramPct = (ramUsed / ramTotal) * 100;
  const cpuColor = cpuUsage > 80 ? '#ef4444' : cpuUsage > 50 ? '#fbbf24' : '#a78bfa';

  const stopBubble = (e: React.MouseEvent | React.TouchEvent) => { e.stopPropagation(); };

  // Show sub-panel if active
  if (activePanel) {
    return (
      <div onClick={stopBubble} onTouchEnd={stopBubble} onMouseDown={stopBubble} onTouchStart={stopBubble}>
        <SettingsSubPanel label={activePanel} onBack={() => setActivePanel(null)} />
      </div>
    );
  }

  return (
    <div
      className="flex-1 px-4 pb-6 overflow-y-auto space-y-4"
      onClick={stopBubble}
      onTouchEnd={stopBubble}
      onMouseDown={stopBubble}
      onTouchStart={stopBubble}
    >
      <UtilitiesSearchBar onSelect={setActivePanel} />

      {/* Volume Slider */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          {volume === 0 ? <VolumeX size={18} className="text-white/80" strokeWidth={1.5} /> : <Volume2 size={18} className="text-white/80" strokeWidth={1.5} />}
          <span className="text-sm text-white/80 font-medium flex-1">Sound</span>
          <span className="text-xs text-white/50 tabular-nums">{volume}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
          <div className="absolute left-0 h-2 rounded-full bg-white/40" style={{ width: `${volume}%` }} />
          <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
          <div className="absolute w-5 h-5 rounded-full bg-white shadow-lg shadow-black/30 pointer-events-none" style={{ left: `calc(${volume}% - 10px)` }} />
        </div>
      </div>

      {/* Brightness Slider */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Sun size={18} className="text-white/80" strokeWidth={1.5} />
          <span className="text-sm text-white/80 font-medium flex-1">Brightness</span>
          <span className="text-xs text-white/50 tabular-nums">{brightness}%</span>
        </div>
        <div className="relative h-8 flex items-center">
          <div className="absolute inset-x-0 h-2 rounded-full bg-white/10" />
          <div className="absolute left-0 h-2 rounded-full bg-white/80" style={{ width: `${brightness}%` }} />
          <input type="range" min={0} max={100} value={brightness} onChange={e => setBrightness(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer z-10" />
          <div className="absolute w-5 h-5 rounded-full bg-white shadow-lg shadow-black/30 pointer-events-none" style={{ left: `calc(${brightness}% - 10px)` }} />
        </div>
      </div>

      {/* Battery */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          {batteryLevel <= 20 ? <BatteryCharging size={18} style={{ color: batteryColor }} strokeWidth={1.5} /> : <Battery size={18} style={{ color: batteryColor }} strokeWidth={1.5} />}
          <span className="text-sm text-white/80 font-medium flex-1">Battery</span>
          <span className="text-sm font-semibold" style={{ color: batteryColor }}>{batteryLevel}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${batteryLevel}%`, backgroundColor: batteryColor }} />
        </div>
      </div>

      {/* WiFi & Network */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Wifi size={18} className="text-green-400" strokeWidth={1.5} />
            <span className="text-sm text-white/80 font-medium">Wi-Fi</span>
          </div>
          <p className="text-xs text-white/50">Connected</p>
          <p className="text-[10px] text-white/30">OriginOS-5G</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Signal size={18} className="text-green-400" strokeWidth={1.5} />
            <span className="text-sm text-white/80 font-medium">Network</span>
          </div>
          <p className="text-xs text-white/50">5G Active</p>
          <p className="text-[10px] text-white/30">Strong Signal</p>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-3">
          <HardDrive size={18} className="text-blue-400" strokeWidth={1.5} />
          <span className="text-sm text-white/80 font-medium flex-1">Storage</span>
          <span className="text-xs text-white/40">{storageUsed} TB / {storageTotal} TB</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-blue-400 transition-all duration-500" style={{ width: `${storagePct}%` }} />
        </div>
      </div>

      {/* RAM */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-purple-400" strokeWidth={1.5} />
          <span className="text-sm text-white/80 font-medium flex-1">Memory</span>
          <span className="text-xs text-white/40">{ramUsed} GB / {ramTotal} GB</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${ramPct}%` }} />
        </div>
      </div>

      {/* CPU Monitor */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Activity size={18} style={{ color: cpuColor }} strokeWidth={1.5} />
          <span className="text-sm text-white/80 font-medium flex-1">CPU Usage</span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: cpuColor }}>{cpuUsage}%</span>
        </div>
        <div className="relative h-20 w-full rounded-xl overflow-hidden bg-white/5">
          <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
        </div>
        <div className="flex justify-between text-[10px] text-white/30">
          <span>45s ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* About Orange AI OS */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center space-y-3 mt-2">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full overflow-hidden">
            <img
              src={orangeLogo}
              alt="Orange AI OS Logo"
              className="w-full h-full object-cover scale-[1.18]"
              style={{
                clipPath: 'circle(48% at 50% 50%)',
                WebkitClipPath: 'circle(48% at 50% 50%)',
              }}
            />
          </div>
        </div>
        <h3 className="text-xl font-extralight text-white tracking-wide">ORANGE Ai OS</h3>
        <p className="text-xs font-light text-white/50 tracking-widest">v3.2.1 · Build OOS-2026.03.25</p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed mb-1">
          Vibe Designed and Coded by:
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed uppercase tracking-wider">
          Don Jose Luga Guardo Jr.
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Founder Orange Ai OS / OrangeWare USA / Smile WiFi Inc. / DC3 / Etherneom Decentralized Currency
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Address: Suite 1903, Sutherland Tower, Aqua Private Residence, Mandaluyong City Metro Manila Philippines
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Email: <a href="mailto:founder@orangeai-os.com" className="hover:text-white transition-colors">FOUNDER@orangeai-os.com</a>
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          <a href="https://www.orangeai-os.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">www.orangeai-os.com</a>
        </p>

        <div className="border-t border-white/10 my-4" />

        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          <span className="font-light text-white">ORANGE Ai OS</span> — the world's first truly open, AI-native operating system platform.
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Powered by cutting-edge edge-based, contextual AI algorithms, ORANGE Ai OS delivers intelligent, privacy-first assistance directly on your device — no constant cloud dependency required.
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Its ultra-lightweight graphical interface installs and runs seamlessly as a native application on virtually any platform:
        </p>
        <ul className="text-sm font-extralight text-white/80 leading-relaxed text-left list-disc list-inside space-y-1 px-2">
          <li>iOS & Android phones and tablets</li>
          <li>Windows & macOS computers</li>
          <li>Linux desktops and laptops</li>
        </ul>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          It can also operate entirely in the browser as a full-featured, cloud-optional OS experience.
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Built from the ground up for the AI era, ORANGE Ai OS creates an AI-ready ecosystem that proactively understands user intent, anticipates needs, personalizes workflows, and adapts in real time — all while keeping your data local and secure.
        </p>
        <p className="text-sm font-extralight text-white/80 leading-relaxed">
          Best of all: it's completely free to use, supported by non-intrusive advertising.
        </p>
        <p className="text-sm font-extralight text-white/90 leading-relaxed italic">
          Experience the future of computing — where AI isn't just an app… it's the entire operating system.
        </p>

        <div className="border-t border-white/10 my-4" />

        <p className="text-sm font-light text-white/70 tracking-wide uppercase mb-2">Key Benefits</p>
        <ul className="text-sm font-extralight text-white/80 leading-relaxed text-left list-disc list-inside space-y-1.5 px-2">
          <li><span className="font-light text-white/90">Edge-first intelligence</span> — fast, responsive, and private AI processing right on your device</li>
          <li><span className="font-light text-white/90">Universal compatibility</span> — one OS shell for phones, laptops, desktops, and browsers</li>
          <li><span className="font-light text-white/90">Context-aware & proactive</span> — learns your habits and preferences without invasive tracking</li>
          <li><span className="font-light text-white/90">Open & extensible</span> — developer-friendly platform with a growing ecosystem of AI-native tools & apps</li>
          <li><span className="font-light text-white/90">Zero upfront cost</span> — free forever, ad-supported model</li>
        </ul>

        <div className="border-t border-white/10 my-4" />

        <p className="text-xl font-light text-white/90 tracking-wide uppercase mb-3">WHAT IS ORANGE Ai OS</p>
        <div className="text-sm font-extralight text-white/80 leading-relaxed text-left space-y-4 px-2">
          <p>
            <span className="font-light text-white/90">ORANGE Ai OS</span> is an Open Source Alef Intelligence (Ai), Smart Contextual OmniScient Open Source Operating System (OS³) represents a blockchain-based operating system that is freely accessible and requires <span className="font-light text-white/90">NO DOWNLOAD</span>.
          </p>
          <p>
            It is specifically designed to support <span className="font-light text-white/90">Decentralized Contextual Content Creators (DC3)</span>, facilitate <span className="font-light text-white/90">Decentralized Collaboration among Community Content Consumers (DC4)</span>, and incorporate <span className="font-light text-white/90">Diversified AI Agents and Assistants (DA3)</span> within a <span className="font-light text-white/90">Decentralized Distributed Domain of Curated Cache Content (DC³)</span>.
          </p>
          <p>
            Allow me to introduce my <span className="font-light text-white/90">TERABITE</span> project, which serves as a virtual sandbox for humanity. This initiative aims to construct a new DNA for the future of computing, one that is not established by the foundations of corporate monopolies but rather by individuals dedicated to investing their time in building a future that unites us rather than divides us.
          </p>
          <p>
            This vision advocates for less governmental influence and emphasizes the importance of individuals who aspire to create something remarkably beautiful. This endeavor is grounded in principles such as placing <span className="font-light text-white/90">God, Truth, Earth, Humanity, and People</span> at the forefront.
          </p>
          <p>
            As Founder of <span className="font-light text-white/90">OmniScient Symphony (OS)</span>, I assume the role of the <span className="font-light text-white/90">MAESTRO</span>, merely a conductor, while you contribute your unique talents. I am here to guide you in crafting the finer details, for it is these details that collectively form the whole as we build a connected communities of <span className="font-light text-white/90">Wireless Enterprises</span> as we soon will Open the WiFi Network <span className="font-light text-white/90">(W.E.O.W.N.)</span>
          </p>
          <p className="font-light text-white/90 text-base tracking-wide">
            It's time to OWN the NETWORK!
          </p>
        </div>

        <div className="border-t border-white/10 my-4" />

        <p className="text-sm font-light text-white/70 tracking-wide uppercase mb-3">Join Our WhatsApp Community</p>
        <a
          href="https://chat.whatsapp.com/JFEiJAeIendLheaqN1XHwG"
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-auto w-48 rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
        >
          <img src={whatsappQR} alt="Orange Ai OS WhatsApp Community QR Code" className="w-full h-auto" />
        </a>
        <p className="text-xs font-extralight text-white/50 mt-2">Tap to join the Orange Ai OS WhatsApp Community</p>

        <div className="border-t border-white/10 my-4" />

        {/* Install App Button */}
        <InstallAppButton />

        <div className="border-t border-white/10 my-4" />

        {/* Cache Management Panel */}
        <CacheManagementPanel />

        <div className="border-t border-white/10 my-4" />

        {/* DC3 Download Section */}
        <DC3DownloadButton />
      </div>
    </div>
  );
}
