import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Plus, ArrowUpAZ, LayoutGrid, ChevronDown, Link, Bot, Shield, FolderPlus, FolderMinus, Wrench, Maximize2, Minimize2 } from 'lucide-react';

interface FolderApp {
  id: string;
  name: string;
  icon: string;
  url?: string;
  customIconUrl?: string;
  apiUrl?: string;
  apiKey?: string;
}

interface FolderItem {
  id: string;
  name: string;
  icon: string;
}

interface FolderCMSProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderItem[];
  onFoldersChange: (folders: FolderItem[]) => void;
  drawerId: string;
}

const STORAGE_KEY_CMS = 'origin-os-cms-apps-';

export default function FolderCMS({ isOpen, onClose, folders, onFoldersChange, drawerId }: FolderCMSProps) {
  const storageKey = STORAGE_KEY_CMS + drawerId;

  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [apps, setApps] = useState<Record<string, FolderApp[]>>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {};
  });

  const [sortMode, setSortMode] = useState<'alphabetical' | 'category'>('category');
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New icon form state
  const [iconName, setIconName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconFile, setIconFile] = useState<string | null>(null);
  const [iconFileName, setIconFileName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(apps));
  }, [apps, storageKey]);

  const selectedFolder = useMemo(() => folders.find(f => f.id === selectedFolderId), [folders, selectedFolderId]);

  const currentApps = useMemo(() => {
    const folderApps = apps[selectedFolderId] || [];
    if (sortMode === 'alphabetical') {
      return [...folderApps].sort((a, b) => a.name.localeCompare(b.name));
    }
    return folderApps;
  }, [apps, selectedFolderId, sortMode]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setIconFile(ev.target?.result as string);
      setIconFileName(file.name);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAddApp = useCallback(() => {
    if (!iconName.trim()) return;

    const newApp: FolderApp = {
      id: Date.now().toString(),
      name: iconName.trim(),
      icon: 'Globe',
      url: iconUrl.trim() || undefined,
      customIconUrl: iconFile || undefined,
      apiUrl: apiUrl.trim() || undefined,
      apiKey: apiKey.trim() || undefined,
    };

    setApps(prev => ({
      ...prev,
      [selectedFolderId]: [...(prev[selectedFolderId] || []), newApp],
    }));

    // Reset form
    setIconName('');
    setIconUrl('');
    setIconFile(null);
    setIconFileName('');
    setApiUrl('');
    setApiKey('');
  }, [iconName, iconUrl, iconFile, apiUrl, apiKey, selectedFolderId]);

  const handleDeleteApp = useCallback((appId: string) => {
    setApps(prev => ({
      ...prev,
      [selectedFolderId]: (prev[selectedFolderId] || []).filter(a => a.id !== appId),
    }));
  }, [selectedFolderId]);

  const handleAddFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newFolder: FolderItem = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      icon: '__new__',
    };
    onFoldersChange([...folders, newFolder]);
    setSelectedFolderId(newFolder.id);
    setNewFolderName('');
    setShowAddFolder(false);
  }, [newFolderName, folders, onFoldersChange]);

  const handleDeleteFolder = useCallback(() => {
    if (folders.length <= 1) return;
    const remaining = folders.filter(f => f.id !== selectedFolderId);
    onFoldersChange(remaining);
    setSelectedFolderId(remaining[0]?.id || '');
    // Clean up apps
    setApps(prev => {
      const copy = { ...prev };
      delete copy[selectedFolderId];
      return copy;
    });
  }, [folders, selectedFolderId, onFoldersChange]);

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => a.name.localeCompare(b.name));
  }, [folders]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
            data-drawer-interactive="true"
            className={`relative overflow-hidden flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-[360px] max-h-[85vh] rounded-2xl'}`}
            style={{
              background: 'rgba(15, 15, 20, 0.85)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
               <h2 className="text-white/90 font-thin text-[14pt] tracking-wide flex items-center gap-2"><Wrench size={16} strokeWidth={1.5} className="text-white/80" /> Content Manager</h2>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={13} strokeWidth={1.5} className="text-white/80" /> : <Maximize2 size={13} strokeWidth={1.5} className="text-white/80" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <X size={14} strokeWidth={1.5} className="text-white/80" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}>
              
              {/* Folder Selector */}
              <div className="space-y-2">
                <label className="text-white/50 font-thin text-[9pt] uppercase tracking-widest">Select Folder</label>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-white/90 font-thin text-[10pt]"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <span>{selectedFolder?.name || 'Choose folder...'}</span>
                    <ChevronDown size={14} className={`text-white/50 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 max-h-[200px] overflow-y-auto"
                        style={{
                          background: 'rgba(20, 20, 28, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          scrollbarWidth: 'thin',
                        }}
                      >
                        {sortedFolders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => { setSelectedFolderId(f.id); setDropdownOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-[10pt] font-thin transition-colors ${
                              f.id === selectedFolderId ? 'text-white bg-white/10' : 'text-white/70 hover:bg-white/5'
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Folder Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddFolder(!showAddFolder)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9pt] font-thin text-white/70 active:scale-95 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <FolderPlus size={12} strokeWidth={1.3} />
                    Add Folder
                  </button>
                  <button
                    onClick={handleDeleteFolder}
                    disabled={folders.length <= 1}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9pt] font-thin text-red-400/70 active:scale-95 transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.1)' }}
                  >
                    <FolderMinus size={12} strokeWidth={1.3} />
                    Delete Folder
                  </button>
                </div>

                {/* Add Folder Input */}
                <AnimatePresence>
                  {showAddFolder && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="flex gap-2 overflow-hidden"
                    >
                      <input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddFolder(); }}
                        placeholder="Folder name..."
                        className="flex-1 px-3 py-2 rounded-lg text-[10pt] font-thin text-white/90 placeholder:text-white/30 outline-none"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                      />
                      <button
                        onClick={handleAddFolder}
                        className="px-3 py-2 rounded-lg text-[9pt] font-thin text-white/80 active:scale-95"
                        style={{ background: 'rgba(100,200,100,0.15)', border: '1px solid rgba(100,200,100,0.2)' }}
                      >
                        Add
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortMode('alphabetical')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9pt] font-thin transition-all ${
                    sortMode === 'alphabetical' ? 'text-white/90' : 'text-white/50'
                  }`}
                  style={{
                    background: sortMode === 'alphabetical' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,${sortMode === 'alphabetical' ? '0.15' : '0.06'})`,
                  }}
                >
                  <ArrowUpAZ size={12} strokeWidth={1.3} />
                  A-Z Order
                </button>
                <button
                  onClick={() => setSortMode('category')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9pt] font-thin transition-all ${
                    sortMode === 'category' ? 'text-white/90' : 'text-white/50'
                  }`}
                  style={{
                    background: sortMode === 'category' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,${sortMode === 'category' ? '0.15' : '0.06'})`,
                  }}
                >
                  <LayoutGrid size={12} strokeWidth={1.3} />
                  Category
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/8" />

              {/* Add New Icon Section */}
              <div className="space-y-2.5">
                <label className="text-white/50 font-thin text-[9pt] uppercase tracking-widest">Add New Icon</label>

                {/* Icon Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}
                >
                  {iconFile ? (
                    <img src={iconFile} alt="icon preview" className="w-8 h-8 rounded-lg object-contain" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <Upload size={14} strokeWidth={1.3} className="text-white/40" />
                    </div>
                  )}
                  <span className="text-white/50 font-thin text-[9pt]">{iconFileName || 'Upload icon (PNG, ICO)'}</span>
                  <input ref={fileInputRef} type="file" accept="image/png,image/x-icon,image/ico" onChange={handleFileUpload} className="hidden" />
                </div>

                {/* Icon Name */}
                <input
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  placeholder="Icon title / name"
                  className="w-full px-3 py-2.5 rounded-xl text-[10pt] font-thin text-white/90 placeholder:text-white/30 outline-none"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                />

                {/* URL */}
                <div className="relative">
                  <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://website-url.com"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[10pt] font-thin text-white/90 placeholder:text-white/30 outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                {/* AI Agent / API Section */}
                <label className="text-white/40 font-thin text-[8pt] uppercase tracking-widest flex items-center gap-1.5 pt-1">
                  <Bot size={10} strokeWidth={1.3} /> AI Agent / Automation
                </label>

                <div className="relative">
                  <Bot size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="API endpoint URL"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[10pt] font-thin text-white/90 placeholder:text-white/30 outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                <div className="relative">
                  <Shield size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="API key / token (optional)"
                    type="password"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-[10pt] font-thin text-white/90 placeholder:text-white/30 outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddApp}
                  disabled={!iconName.trim()}
                  className="w-full py-2.5 rounded-xl text-[10pt] font-thin text-white/90 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(100,180,255,0.2), rgba(100,140,255,0.15))',
                    border: '1px solid rgba(100,180,255,0.2)',
                  }}
                >
                  <Plus size={14} strokeWidth={1.5} />
                  Add to {selectedFolder?.name || 'Folder'}
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-white/8" />

              {/* Current Icons List */}
              <div className="space-y-2">
                <label className="text-white/50 font-thin text-[9pt] uppercase tracking-widest">
                  Icons in {selectedFolder?.name || '—'} ({currentApps.length})
                </label>

                {currentApps.length === 0 ? (
                  <p className="text-white/25 font-thin text-[9pt] text-center py-4">No icons in this folder yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {currentApps.map(app => (
                      <div
                        key={app.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl group"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {app.customIconUrl ? (
                          <img src={app.customIconUrl} alt={app.name} className="w-6 h-6 rounded object-contain" />
                        ) : (
                          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <span className="text-white/50 text-[8pt]">{app.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 font-thin text-[9pt] truncate">{app.name}</p>
                          {app.url && <p className="text-white/30 font-thin text-[7pt] truncate">{app.url}</p>}
                        </div>
                        <button
                          onClick={() => handleDeleteApp(app.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg active:scale-90 transition-all"
                          style={{ background: 'rgba(255,60,60,0.1)' }}
                        >
                          <Trash2 size={11} strokeWidth={1.3} className="text-red-400/70" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
