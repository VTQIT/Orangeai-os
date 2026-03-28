import React, { useState, useRef, useCallback, useEffect, useMemo, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FolderCMS from './FolderCMS';
import { playSwoosh } from '@/hooks/useOSSounds';
import {
  Plus, X, Check, MessageCircle, StickyNote, Star, FolderKanban, Wrench, ChevronUp, ChevronLeft, ChevronRight,
  BarChart3, Music, Gamepad2, Cpu, DollarSign, GraduationCap,
  Search as SearchIcon, Briefcase, Folder,
  Phone, Mail, Video, Radio, Headphones, Mic,
  FileText, PenTool, BookOpen, Clipboard, Bookmark,
  Heart, ThumbsUp, Flame, Sparkles,
  Layout, Layers, GitBranch, Terminal,
  TrendingUp, Clock, Calendar, ListChecks,
  Disc, Volume2, PlayCircle,
  Dice1, Trophy, Target, Joystick,
  Monitor, Wifi, Database, HardDrive,
  CreditCard, PiggyBank, Receipt, Wallet,
  Apple, PencilRuler, Library, Lightbulb,
  Globe, Microscope, FlaskConical, Compass,
  Building, Users, Handshake, Award
} from 'lucide-react';

const folderIcon = '/folder-icon.png';

interface FolderItem {
  id: string;
  name: string;
  icon: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  Communication: MessageCircle,
  Notes: StickyNote,
  Favorites: Star,
  Project: FolderKanban,
  Productivity: BarChart3,
  Music: Music,
  Games: Gamepad2,
  Technology: Cpu,
  Finance: DollarSign,
  School: GraduationCap,
  Research: SearchIcon,
  Business: Briefcase,
};

// Unique translucent colors for each folder category
const FOLDER_COLORS: Record<string, string> = {
  Communication: 'rgba(59, 130, 246, 0.45)',
  Notes: 'rgba(234, 179, 8, 0.45)',
  Favorites: 'rgba(239, 68, 68, 0.45)',
  Project: 'rgba(34, 197, 94, 0.45)',
  Productivity: 'rgba(168, 85, 247, 0.45)',
  Music: 'rgba(236, 72, 153, 0.45)',
  Games: 'rgba(249, 115, 22, 0.45)',
  Technology: 'rgba(6, 182, 212, 0.45)',
  Finance: 'rgba(132, 204, 22, 0.45)',
  School: 'rgba(99, 102, 241, 0.45)',
  Research: 'rgba(20, 184, 166, 0.45)',
  Business: 'rgba(161, 98, 7, 0.45)',
};

// Single minimalist icon per folder category — algorithmically matched to name
const CATEGORY_SINGLE_ICON: Record<string, React.ComponentType<any>> = {
  Communication: Phone,
  Notes: FileText,
  Favorites: Heart,
  Project: Layout,
  Productivity: Clock,
  Music: Headphones,
  Games: Gamepad2,
  Technology: Monitor,
  Finance: Wallet,
  School: GraduationCap,
  Research: FlaskConical,
  Business: Briefcase,
};

// AI-like algorithm: match folder name keywords to the best minimalist icon
function getSmartFolderIcon(name: string): React.ComponentType<any> {
  const n = name.toLowerCase().trim();
  // Exact category match first
  for (const [key, icon] of Object.entries(CATEGORY_SINGLE_ICON)) {
    if (key.toLowerCase() === n) return icon;
  }
  // Keyword matching
  const keywords: [string[], React.ComponentType<any>][] = [
    [['chat', 'message', 'sms', 'text', 'talk', 'conversation'], MessageCircle],
    [['phone', 'call', 'dial', 'ring'], Phone],
    [['mail', 'email', 'inbox', 'letter'], Mail],
    [['video', 'stream', 'watch', 'movie', 'film', 'cinema', 'tv', 'television'], Video],
    [['radio', 'broadcast', 'fm', 'am'], Radio],
    [['mic', 'voice', 'record', 'audio', 'sound', 'podcast'], Mic],
    [['headphone', 'listen', 'ear'], Headphones],
    [['note', 'memo', 'sticky', 'write', 'writing'], StickyNote],
    [['document', 'doc', 'file', 'paper', 'report'], FileText],
    [['pen', 'draw', 'sketch', 'art', 'paint', 'design', 'creative'], PenTool],
    [['book', 'read', 'library', 'literature', 'novel', 'story'], BookOpen],
    [['clipboard', 'copy', 'paste'], Clipboard],
    [['bookmark', 'save', 'pin'], Bookmark],
    [['heart', 'love', 'like', 'favorite', 'fav'], Heart],
    [['star', 'rate', 'rating'], Star],
    [['fire', 'hot', 'trending', 'popular', 'trend'], Flame],
    [['sparkle', 'magic', 'special', 'premium'], Sparkles],
    [['layout', 'kanban', 'board', 'project', 'plan'], Layout],
    [['layer', 'stack'], Layers],
    [['git', 'branch', 'version', 'code', 'dev', 'develop'], GitBranch],
    [['terminal', 'console', 'command', 'shell', 'cli'], Terminal],
    [['trend', 'growth', 'stock', 'invest', 'market'], TrendingUp],
    [['clock', 'time', 'hour', 'minute'], Clock],
    [['calendar', 'date', 'schedule', 'event', 'agenda'], Calendar],
    [['task', 'todo', 'checklist', 'list', 'check'], ListChecks],
    [['disc', 'vinyl', 'album', 'cd'], Disc],
    [['volume', 'speaker', 'loud'], Volume2],
    [['play', 'player', 'media'], PlayCircle],
    [['music', 'song', 'tune', 'melody', 'spotify', 'musify'], Headphones],
    [['game', 'gaming', 'arcade', 'controller', 'play station', 'xbox', 'nintendo'], Gamepad2],
    [['trophy', 'win', 'champion', 'award', 'prize'], Trophy],
    [['target', 'goal', 'aim', 'focus', 'objective'], Target],
    [['dice', 'random', 'luck', 'chance', 'casino'], Dice1],
    [['monitor', 'screen', 'display', 'computer', 'pc', 'desktop'], Monitor],
    [['wifi', 'network', 'internet', 'connect', 'online', 'web'], Wifi],
    [['database', 'data', 'sql', 'storage', 'server'], Database],
    [['drive', 'disk', 'hard', 'ssd', 'memory'], HardDrive],
    [['credit', 'card', 'pay', 'payment', 'transaction'], CreditCard],
    [['piggy', 'save', 'saving', 'budget'], PiggyBank],
    [['receipt', 'invoice', 'bill'], Receipt],
    [['wallet', 'money', 'cash', 'finance', 'bank', 'fund'], Wallet],
    [['school', 'education', 'learn', 'study', 'academic', 'university', 'college'], GraduationCap],
    [['pencil', 'ruler', 'homework', 'assignment', 'exam', 'test', 'quiz'], PencilRuler],
    [['library', 'archive', 'collection'], Library],
    [['idea', 'bulb', 'light', 'bright', 'innovation', 'inspire'], Lightbulb],
    [['globe', 'world', 'earth', 'international', 'global', 'www'], Globe],
    [['microscope', 'science', 'biology', 'lab', 'experiment'], Microscope],
    [['flask', 'chemistry', 'research', 'analyze', 'analysis'], FlaskConical],
    [['compass', 'navigate', 'direction', 'explore', 'adventure', 'travel', 'trip'], Compass],
    [['building', 'office', 'company', 'corporate', 'enterprise', 'real estate'], Building],
    [['user', 'team', 'people', 'group', 'social', 'community', 'friend'], Users],
    [['handshake', 'deal', 'partner', 'agreement', 'contract'], Handshake],
    [['briefcase', 'business', 'work', 'career', 'job', 'profession'], Briefcase],
    [['tool', 'utility', 'setting', 'config', 'wrench', 'fix', 'repair'], Wrench],
    [['lock', 'security', 'secure', 'password', 'protect', 'privacy', 'safe'], Star],
    [['cloud', 'upload', 'download', 'sync', 'backup'], Star],
    [['camera', 'photo', 'picture', 'image', 'gallery', 'snap'], Star],
    [['health', 'medical', 'doctor', 'hospital', 'wellness', 'fit', 'gym', 'exercise', 'sport'], Trophy],
    [['food', 'cook', 'recipe', 'kitchen', 'restaurant', 'eat', 'meal', 'dinner'], Star],
    [['shop', 'store', 'buy', 'purchase', 'cart', 'ecommerce', 'retail', 'mall'], CreditCard],
    [['map', 'location', 'place', 'gps', 'geo'], Compass],
    [['weather', 'climate', 'forecast', 'rain', 'sun', 'snow'], Globe],
    [['ai', 'artificial', 'intelligence', 'machine', 'neural', 'deep', 'robot', 'bot', 'auto'], Cpu],
    [['crypto', 'bitcoin', 'blockchain', 'nft', 'token', 'defi', 'web3'], DollarSign],
  ];
  for (const [keys, icon] of keywords) {
    if (keys.some(k => n.includes(k))) return icon;
  }
  return Folder;
}

const DEFAULT_FOLDERS: FolderItem[] = [
  { id: '1', name: 'Communication', icon: 'Communication' },
  { id: '2', name: 'Notes', icon: 'Notes' },
  { id: '3', name: 'Favorites', icon: 'Favorites' },
  { id: '4', name: 'Project', icon: 'Project' },
  { id: '5', name: 'Productivity', icon: 'Productivity' },
  { id: '6', name: 'Music', icon: 'Music' },
  { id: '7', name: 'Games', icon: 'Games' },
  { id: '8', name: 'Technology', icon: 'Technology' },
  { id: '9', name: 'Finance', icon: 'Finance' },
  { id: '10', name: 'School', icon: 'School' },
  { id: '11', name: 'Research', icon: 'Research' },
  { id: '12', name: 'Business', icon: 'Business' },
];

const STORAGE_KEY_PREFIX = 'origin-os-folders-';

function getIcon(iconKey: string) {
  return CATEGORY_ICONS[iconKey] || Folder;
}

function getFolderSingleIcon(iconKey: string): React.ComponentType<any> {
  return CATEGORY_SINGLE_ICON[iconKey] || getSmartFolderIcon(iconKey);
}

export interface FolderSliderHandle {
  navigate: (dir: 'prev' | 'next') => void;
}

interface FolderSliderProps {
  drawerId: string;
  hideNames?: boolean;
  onToggleHideNames?: () => void;
  onFolderSelect?: (folderIconKey: string | null) => void;
}

const FolderSlider = forwardRef<FolderSliderHandle, FolderSliderProps>(function FolderSlider({ drawerId, hideNames = false, onToggleHideNames, onFolderSelect }, ref) {
  const storageKey = STORAGE_KEY_PREFIX + drawerId;

  const [folders, setFolders] = useState<FolderItem[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_FOLDERS;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // Default select the first folder
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.length > 0 ? parsed[0].id : null;
      }
    } catch {}
    return DEFAULT_FOLDERS.length > 0 ? DEFAULT_FOLDERS[0].id : null;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cmsOpen, setCmsOpen] = useState(false);

  // Notify parent of initial default selection
  useEffect(() => {
    if (selectedId && onFolderSelect) {
      const folder = folders.find(f => f.id === selectedId);
      onFolderSelect(folder?.icon || null);
    }
  }, []); // only on mount

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(folders));
  }, [folders, storageKey]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const addFolder = useCallback(() => {
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: 'New Folder',
      icon: '__new__',
    };

    setFolders((prev) => [...prev, newFolder]);

    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: 'smooth' });
    }, 100);
  }, []);

  const startRename = useCallback((folder: FolderItem) => {
    setEditingId(folder.id);
    setEditValue(folder.name);
  }, []);

  const handleFolderTap = useCallback((folder: FolderItem) => {
    if (editingId) return;
    setSelectedId((prev) => {
      const newId = prev === folder.id ? null : folder.id;
      if (onFolderSelect) {
        onFolderSelect(newId ? folder.icon : null);
      }
      return newId;
    });
  }, [editingId, onFolderSelect]);

  const handleFolderLongPress = useCallback((folder: FolderItem) => {
    startRename(folder);
  }, [startRename]);

  const confirmRename = useCallback(() => {
    if (!editingId) return;

    const trimmed = editValue.trim();

    if (trimmed) {
      setFolders((prev) =>
        prev.map((f) =>
          f.id === editingId
            ? { ...f, name: trimmed, icon: trimmed }
            : f
        )
      );
    }

    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue]);

  const cancelRename = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const selectedFolder = useMemo(() => folders.find(f => f.id === selectedId) || null, [folders, selectedId]);

  const navigateFolder = useCallback((direction: 'prev' | 'next') => {
    if (folders.length === 0) return;
    const currentIndex = folders.findIndex(f => f.id === selectedId);
    let newIndex: number;
    if (currentIndex === -1) {
      newIndex = direction === 'next' ? 0 : folders.length - 1;
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % folders.length;
    } else {
      newIndex = (currentIndex - 1 + folders.length) % folders.length;
    }
    const newFolder = folders[newIndex];
    setSelectedId(newFolder.id);
    onFolderSelect?.(newFolder.icon);
    playSwoosh();
  }, [folders, selectedId, onFolderSelect]);

  useImperativeHandle(ref, () => ({
    navigate: navigateFolder,
  }), [navigateFolder]);

  const folderPages = useMemo(() => {
    const pages: (FolderItem | null)[][] = [];

    for (let i = 0; i < folders.length; i += 4) {
      const chunk = folders.slice(i, i + 4);
      const paddedChunk = [...chunk, ...Array.from({ length: Math.max(0, 4 - chunk.length) }, () => null)];
      pages.push(paddedChunk);
    }

    return pages.length ? pages : [[null, null, null, null]];
  }, [folders]);

  const [folderPaneOpen, setFolderPaneOpen] = useState(true);

  return (
    <div
      className="mx-4 mt-3 relative"
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {/* Title bar with folder name + horizontal action buttons */}
      <div className="flex items-center justify-between mb-1">
        <div className="ml-1 min-h-[24px]">
          <AnimatePresence>
            {selectedFolder && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className="text-white/90 font-thin tracking-wide"
                style={{ fontSize: '16pt' }}
              >
                {selectedFolder.name}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Folder navigation + action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigateFolder('prev')}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title="Previous folder"
          >
            <ChevronLeft size={14} strokeWidth={1.5} className="text-white" />
          </button>
          <button
            onClick={() => navigateFolder('next')}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title="Next folder"
          >
            <ChevronRight size={14} strokeWidth={1.5} className="text-white" />
          </button>
          <button
            onClick={addFolder}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <Plus size={14} strokeWidth={1.5} className="text-white" />
          </button>
          <button
            onClick={() => setCmsOpen(true)}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title="Content Manager"
          >
            <Wrench size={13} strokeWidth={1.5} className="text-white" />
          </button>
          <button
            onClick={onToggleHideNames}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200 overflow-hidden"
            style={{
              background: hideNames ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title={hideNames ? 'Show names' : 'Hide names'}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {hideNames ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
          {/* Collapse / Expand folder pane */}
          <button
            onClick={() => setFolderPaneOpen(prev => !prev)}
            className="w-7 h-7 rounded-full backdrop-blur-xl flex items-center justify-center active:scale-[0.95] transition-transform duration-200"
            style={{
              background: folderPaneOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            title={folderPaneOpen ? 'Hide folders' : 'Show folders'}
          >
            <motion.div
              animate={{ rotate: folderPaneOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp size={14} strokeWidth={1.5} className="text-white" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Collapsible Folder Pane */}
      <AnimatePresence initial={false}>
        {folderPaneOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
              opacity: { duration: 0.3, ease: 'easeInOut' },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex w-full">
                {folderPages.map((page, pageIndex) => (
                  <div key={`page-${pageIndex}`} className="w-full shrink-0 snap-start">
                    <div className="grid grid-cols-4 gap-1.5 pb-1.5 overflow-visible">
                      {page.map((folder, slotIndex) => {
                        if (!folder) {
                          return <div key={`empty-${pageIndex}-${slotIndex}`} />;
                        }

                        const isEditing = editingId === folder.id;
                        const isSelected = selectedId === folder.id;
                        const isNewFolder = folder.icon === '__new__';
                        const FolderIcon = isNewFolder ? null : getFolderSingleIcon(folder.name);

                        return (
                          <motion.div
                            key={folder.id}
                            layout
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col items-center gap-0.5 min-w-0 w-full mx-auto"
                          >
                            <button
                              onClick={() => handleFolderTap(folder)}
                              onDoubleClick={() => handleFolderLongPress(folder)}
                              className="w-full relative active:scale-[0.97] transition-all duration-200"
                              style={{ aspectRatio: '1 / 0.75' }}
                            >
                              {isSelected && !isNewFolder && (
                                <div
                                  className="absolute inset-0 pointer-events-none z-[2] rounded-lg"
                                  style={{
                                    background: FOLDER_COLORS[folder.icon] || 'rgba(120, 200, 255, 0.45)',
                                    transition: 'background 0.3s',
                                  }}
                                />
                              )}
                              <div className="relative w-full h-full z-[1]">
                                <img
                                  src={folderIcon}
                                  alt="folder"
                                  className="w-full h-full object-contain drop-shadow-lg"
                                  style={{
                                    opacity: isNewFolder ? 0.2 : isSelected ? 0.5 : 0.25,
                                    filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))',
                                    transition: 'opacity 0.3s',
                                  }}
                                />
                                <div
                                  className="absolute inset-0 flex items-center justify-center z-[3]"
                                  style={{ paddingTop: '10%' }}
                                >
                                  {isNewFolder ? (
                                    <div
                                      className="rounded-full border-2 border-white/60 flex items-center justify-center"
                                      style={{ width: 22, height: 22 }}
                                    >
                                      <span
                                        className="text-white font-light leading-none"
                                        style={{ fontSize: '14pt' }}
                                      >
                                        +
                                      </span>
                                    </div>
                                  ) : FolderIcon ? (
                                    <FolderIcon
                                      size={16}
                                      strokeWidth={1.2}
                                      className="text-white/90 drop-shadow-sm"
                                    />
                                  ) : null}
                                </div>
                              </div>
                            </button>

                            {isEditing ? (
                              <div className="flex items-center gap-0.5 w-full justify-center">
                                <input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmRename();
                                    if (e.key === 'Escape') cancelRename();
                                  }}
                                  className="w-[60px] bg-white/15 backdrop-blur-xl border border-white/25 rounded-md px-1 py-0.5 text-[8px] text-white font-light text-center outline-none"
                                />
                                <button onClick={confirmRename} className="p-0.5">
                                  <Check size={9} className="text-green-400" />
                                </button>
                                <button onClick={cancelRename} className="p-0.5">
                                  <X size={9} className="text-red-400" />
                                </button>
                              </div>
                            ) : !hideNames ? (
                              <span className="text-[8pt] text-white/80 font-thin tracking-wide text-center leading-tight truncate w-full px-0.5">
                                {folder.name}
                              </span>
                            ) : (
                              <span className="text-[8pt] text-transparent select-none w-full px-0.5">&nbsp;</span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-1 mt-1">
              {Array.from({ length: folderPages.length }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-white/30" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FolderCMS
        isOpen={cmsOpen}
        onClose={() => setCmsOpen(false)}
        folders={folders}
        onFoldersChange={setFolders}
        drawerId={drawerId}
      />
    </div>
  );
});

export default FolderSlider;
