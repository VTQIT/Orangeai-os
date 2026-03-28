import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sun, Moon, Palette, Code, Music, Calculator, Sigma,
  Mic, MicOff, Paperclip, Save, Plus, Trash2, Sparkles, Check,
  PenTool, Highlighter, Eraser, ChevronDown, Send, Wand2,
  FileText, RotateCcw, Copy, MessageSquare, Minimize2,
  StickyNote, BookOpen, FlaskConical, Lightbulb, PenLine,
  Rocket, Puzzle, Lock, Layers, FolderPlus, Tag,
  AlignLeft, AlignCenter, AlignRight, Type, Volume2, VolumeX,
  Bot, Newspaper, Pen, Braces
} from 'lucide-react';
import { useNotepadAI } from '@/hooks/useNotepadAI';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

type NoteMode = 'general' | 'code' | 'prompt' | 'music' | 'math';
type DrawTool = 'pen' | 'highlighter' | 'eraser' | null;

interface Note {
  id: string;
  title: string;
  content: string;
  mode: NoteMode;
  color: string;
  category: string;
  createdAt: number;
  images: string[];
  isTask: boolean;
  taskDone: boolean;
  isSticky: boolean;
}

// Contextual AI Agents per category
interface AIAgent {
  id: string;
  name: string;
  description: string;
}

const CATEGORY_AI_AGENTS: Record<string, AIAgent[]> = {
  'Diary': [
    { id: 'grok', name: 'Grok', description: 'Conversational diary assistant' },
    { id: 'gemini', name: 'Gemini', description: 'Contextual journaling AI' },
    { id: 'chatgpt', name: 'ChatGPT', description: 'Creative diary companion' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Deep reflection assistant' },
  ],
  'Formulas': [
    { id: 'claude', name: 'Claude', description: 'Advanced math reasoning' },
    { id: 'gemini', name: 'Gemini', description: 'Formula solver' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Scientific computation' },
  ],
  'Ideas': [
    { id: 'chatgpt', name: 'ChatGPT', description: 'Idea brainstorming' },
    { id: 'grok', name: 'Grok', description: 'Creative ideation' },
    { id: 'gemini', name: 'Gemini', description: 'Idea expansion' },
  ],
  'Blog': [
    { id: 'chatgpt', name: 'ChatGPT', description: 'Blog post writer' },
    { id: 'claude', name: 'Claude', description: 'Long-form blog content' },
    { id: 'gemini', name: 'Gemini', description: 'SEO-optimized blogs' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Research-based articles' },
  ],
  'Write Article': [
    { id: 'claude', name: 'Claude', description: 'Professional article writer' },
    { id: 'chatgpt', name: 'ChatGPT', description: 'Versatile article assistant' },
    { id: 'gemini', name: 'Gemini', description: 'Fact-checked articles' },
    { id: 'deepseek', name: 'DeepSeek', description: 'In-depth analysis' },
  ],
  'Vibe Coding Prompt': [
    { id: 'claude', name: 'Claude', description: 'Expert code prompting' },
    { id: 'chatgpt', name: 'ChatGPT', description: 'Code prompt generator' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Technical prompt craft' },
    { id: 'grok', name: 'Grok', description: 'Creative coding prompts' },
  ],
  'Drafts': [
    { id: 'chatgpt', name: 'ChatGPT', description: 'Draft refinement' },
    { id: 'gemini', name: 'Gemini', description: 'Draft polishing' },
  ],
  'Invention': [
    { id: 'chatgpt', name: 'ChatGPT', description: 'Invention brainstorm' },
    { id: 'grok', name: 'Grok', description: 'Innovative thinking' },
  ],
  'Concept': [
    { id: 'gemini', name: 'Gemini', description: 'Concept development' },
    { id: 'claude', name: 'Claude', description: 'Concept analysis' },
  ],
  'Framework': [
    { id: 'claude', name: 'Claude', description: 'Framework design' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Architecture planning' },
  ],
  'Secret': [
    { id: 'chatgpt', name: 'ChatGPT', description: 'Private assistant' },
  ],
  '_music': [
    { id: 'suno', name: 'Suno', description: 'AI music generation' },
    { id: 'jukebox', name: 'Jukebox', description: 'OpenAI music model' },
    { id: 'musicful', name: 'Musicful.ai', description: 'Music composition' },
    { id: 'jggl', name: 'jggl.ai', description: 'AI music creation' },
  ],
  '_code': [
    { id: 'claude', name: 'Claude', description: 'Expert coding assistant' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Code generation' },
    { id: 'chatgpt', name: 'ChatGPT', description: 'Code helper' },
  ],
  '_math': [
    { id: 'claude', name: 'Claude', description: 'Math reasoning' },
    { id: 'deepseek', name: 'DeepSeek', description: 'Math solver' },
  ],
};

const BG_COLORS = [
  { label: 'Default', value: 'transparent' },
  { label: 'Pitch Black', value: 'hsla(0, 0%, 0%, 1)' },
  { label: 'Notepad', value: 'notepad-lined' },
  { label: 'Warm', value: 'hsla(30, 100%, 95%, 0.3)' },
  { label: 'Cool', value: 'hsla(210, 100%, 95%, 0.3)' },
  { label: 'Mint', value: 'hsla(150, 80%, 92%, 0.3)' },
  { label: 'Rose', value: 'hsla(340, 80%, 94%, 0.3)' },
  { label: 'Lavender', value: 'hsla(270, 80%, 94%, 0.3)' },
  { label: 'Amber', value: 'hsla(45, 100%, 92%, 0.3)' },
  { label: 'Slate', value: 'hsla(220, 20%, 90%, 0.3)' },
];

const COLOR_PREVIEWS: Record<string, string> = {
  'transparent': '',
  'hsla(0, 0%, 0%, 1)': '#000000',
  'notepad-lined': '#fefce8',
};

const PEN_COLORS = ['#ffffff', '#ff4444', '#44aaff', '#44ff88', '#ffaa00', '#ff44ff', '#000000'];

const MODE_CONFIG: Record<NoteMode, { icon: any; label: string; placeholder: string }> = {
  general: { icon: FileText, label: 'General', placeholder: 'Start writing your note...' },
  code: { icon: Code, label: 'Code', placeholder: '// Write or paste code here...' },
  prompt: { icon: MessageSquare, label: 'Prompt', placeholder: 'Compose your AI prompt...' },
  music: { icon: Music, label: 'Music', placeholder: 'Write lyrics, chords, or notation...' },
  math: { icon: Sigma, label: 'Math', placeholder: 'Write equations or formulas...' },
};

const DEFAULT_CATEGORIES = [
  'All', 'Diary', 'Formulas', 'Ideas', 'Drafts', 'Invention', 'Concept', 'Framework', 'Secret',
  'Blog', 'Write Article', 'Vibe Coding Prompt', 'Sticky Notes'
];

const CATEGORY_ICONS: Record<string, any> = {
  'All': Layers,
  'Diary': BookOpen,
  'Formulas': FlaskConical,
  'Ideas': Lightbulb,
  'Drafts': PenLine,
  'Invention': Rocket,
  'Concept': Puzzle,
  'Framework': Layers,
  'Secret': Lock,
  'Sticky Notes': StickyNote,
  'Blog': Newspaper,
  'Write Article': Pen,
  'Vibe Coding Prompt': Braces,
};

const STICKY_COLORS = [
  'hsla(50, 100%, 80%, 0.9)',
  'hsla(200, 100%, 80%, 0.9)',
  'hsla(330, 100%, 85%, 0.9)',
  'hsla(120, 80%, 80%, 0.9)',
  'hsla(270, 80%, 85%, 0.9)',
  'hsla(30, 100%, 80%, 0.9)',
];

const FONT_SIZES = [
  { label: '8pt', value: '8pt' },
  { label: '10pt', value: '10pt' },
  { label: '12pt', value: '12pt' },
];

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif', weight: undefined, style: undefined },
  { label: 'Courier', value: '"Courier New", Courier, monospace', weight: undefined, style: undefined },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif', weight: undefined, style: undefined },
  { label: 'Thin', value: '"Outfit", sans-serif', weight: '200', style: undefined },
  { label: 'Cursive', value: 'cursive', weight: undefined, style: undefined },
  { label: 'Bold', value: 'Arial, sans-serif', weight: '700', style: undefined },
  { label: 'Italic', value: 'Arial, sans-serif', weight: undefined, style: 'italic' },
];

type TextAlign = 'left' | 'center' | 'right';

interface NotepadAppProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotepadApp({ isOpen, onClose }: NotepadAppProps) {
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>('dark');
  const [noteMode, setNoteMode] = useState<NoteMode>('general');
  const [bgColor, setBgColor] = useState('transparent');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('notepad-categories') || 'null') || DEFAULT_CATEGORIES; } catch { return DEFAULT_CATEGORIES; }
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem('notepad-notes') || '[]'); } catch { return []; }
  });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [showNotesList, setShowNotesList] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isTask, setIsTask] = useState(false);
  const [taskDone, setTaskDone] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [fontSize, setFontSize] = useState('10pt');
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontWeight, setFontWeight] = useState<string | undefined>(undefined);
  const [fontStyle, setFontStyle] = useState<string | undefined>(undefined);
  const [textAlign, setTextAlign] = useState<TextAlign>('left');
  const [showFontPicker, setShowFontPicker] = useState(false);

  // Drawing state
  const [drawTool, setDrawTool] = useState<DrawTool>(null);
  const [penColor, setPenColor] = useState('#ffffff');
  const [penSize, setPenSize] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const drawHistoryRef = useRef<ImageData[]>([]);

  // Floating mini calculator
  const [showMiniCalc, setShowMiniCalc] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcNewNum, setCalcNewNum] = useState(true);

  // AI Agent selection
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // AI hook
  const { response: aiResponse, isLoading: aiLoading, error: aiError, runAI, clearResponse } = useNotepadAI();

  // Voice - normal dictation
  const { isListening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useSpeechRecognition((transcript) => {
    setContent(prev => prev + (prev ? ' ' : '') + transcript);
  });

  // Wake word detection ("Hello Smile" / "Smile")
  const [wakeWordActive, setWakeWordActive] = useState(false);
  const [voiceChatMode, setVoiceChatMode] = useState(false);
  const { isListening: isWakeListening, start: startWake, stop: stopWake, supported: wakeSupported } = useSpeechRecognition((transcript) => {
    const lower = transcript.toLowerCase().trim();
    if (!voiceChatMode) {
      // Check for wake word
      if (lower.includes('hello smile') || lower === 'smile') {
        setVoiceChatMode(true);
        speakTTS('Hi! I\'m Smile. How can I help you? Just speak your request.');
      }
    } else {
      // In voice chat mode - send to AI
      setVoiceChatMode(false);
      handleVoiceCommand(transcript);
    }
  });

  // Resolve contextual agents for current category/mode
  const getContextualAgents = useCallback((): AIAgent[] => {
    if (noteMode === 'music') return CATEGORY_AI_AGENTS['_music'] || [];
    if (noteMode === 'code') return CATEGORY_AI_AGENTS['_code'] || [];
    if (noteMode === 'math') return CATEGORY_AI_AGENTS['_math'] || [];
    return CATEGORY_AI_AGENTS[category] || CATEGORY_AI_AGENTS['Diary'] || [];
  }, [category, noteMode]);

  // TTS via ElevenLabs
  const speakTTS = useCallback(async (text: string) => {
    if (!ttsEnabled || !text.trim()) return;
    setIsSpeaking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.slice(0, 500), voiceId: 'EXAVITQu4vr4xnSDxMaL' }),
        }
      );
      if (!response.ok) throw new Error('TTS failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (ttsAudioRef.current) { ttsAudioRef.current.pause(); }
      const audio = new Audio(url);
      ttsAudioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, [ttsEnabled]);

  // Handle voice command -> send to AI -> speak response
  const handleVoiceCommand = useCallback(async (transcript: string) => {
    setAiPrompt(transcript);
    setShowAIPanel(true);
    await runAI('compose', transcript, noteMode);
  }, [noteMode, runAI]);

  // When AI response completes, speak it if TTS enabled
  const prevAiLoadingRef = useRef(false);
  useEffect(() => {
    if (prevAiLoadingRef.current && !aiLoading && aiResponse && ttsEnabled) {
      speakTTS(aiResponse);
    }
    prevAiLoadingRef.current = aiLoading;
  }, [aiLoading, aiResponse, ttsEnabled, speakTTS]);

  // Toggle wake word listening
  useEffect(() => {
    if (isOpen && wakeWordActive && wakeSupported) {
      startWake();
    }
    return () => { if (wakeSupported) stopWake(); };
  }, [isOpen, wakeWordActive]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save notes & categories to localStorage
  useEffect(() => {
    localStorage.setItem('notepad-notes', JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('notepad-categories', JSON.stringify(categories));
  }, [categories]);

  const isDark = localTheme === 'dark';
  const isNotepadBg = bgColor === 'notepad-lined';
  const isPitchBlack = bgColor === 'hsla(0, 0%, 0%, 1)';

  const saveNote = useCallback(() => {
    const note: Note = {
      id: activeNoteId || Date.now().toString(),
      title: title || 'Untitled Note',
      content,
      mode: noteMode,
      color: isSticky ? stickyColor : bgColor,
      category,
      createdAt: activeNoteId ? (notes.find(n => n.id === activeNoteId)?.createdAt || Date.now()) : Date.now(),
      images,
      isTask,
      taskDone,
      isSticky,
    };
    setNotes(prev => {
      const existing = prev.findIndex(n => n.id === note.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = note;
        return updated;
      }
      return [note, ...prev];
    });
    setActiveNoteId(note.id);
  }, [activeNoteId, title, content, noteMode, bgColor, stickyColor, category, notes, images, isTask, taskDone, isSticky]);

  const loadNote = useCallback((note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setNoteMode(note.mode);
    setBgColor(note.isSticky ? 'transparent' : note.color);
    setCategory(note.category || 'All');
    setImages(note.images);
    setIsTask(note.isTask);
    setTaskDone(note.taskDone);
    setIsSticky(note.isSticky || false);
    if (note.isSticky) setStickyColor(note.color);
    setShowNotesList(false);
  }, []);

  const newNote = useCallback(() => {
    setActiveNoteId(null);
    setTitle('');
    setContent('');
    setNoteMode('general');
    setBgColor('transparent');
    setCategory('All');
    setImages([]);
    setIsTask(false);
    setTaskDone(false);
    setIsSticky(false);
    setShowNotesList(false);
    clearResponse();
  }, [clearResponse]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) newNote();
  }, [activeNoteId, newNote]);

  const addCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (name && !categories.includes(name)) {
      setCategories(prev => [...prev, name]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  }, [newCategoryName, categories]);

  // Image attachment
  const handleImageAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, []);

  // Drawing
  const getCanvasPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawTool || !canvasRef.current) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) drawHistoryRef.current.push(ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height));
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawingRef.current || !drawTool || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    if (drawTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penSize * 4;
    } else if (drawTool === 'highlighter') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor + '55';
      ctx.lineWidth = penSize * 6;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const endDraw = () => { isDrawingRef.current = false; };

  const undoDraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    const last = drawHistoryRef.current.pop();
    if (last) ctx.putImageData(last, 0, 0);
    else ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    drawHistoryRef.current = [];
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Mini calculator
  const calcInput = (val: string) => {
    if (calcNewNum) { setCalcDisplay(val); setCalcNewNum(false); }
    else setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };
  const calcOperation = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcNewNum(true);
  };
  const calcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const cur = parseFloat(calcDisplay);
    let result = 0;
    switch (calcOp) {
      case '+': result = calcPrev + cur; break;
      case '-': result = calcPrev - cur; break;
      case '×': result = calcPrev * cur; break;
      case '÷': result = cur !== 0 ? calcPrev / cur : 0; break;
    }
    setCalcDisplay(String(result));
    setCalcPrev(null);
    setCalcOp(null);
    setCalcNewNum(true);
  };
  const calcClear = () => { setCalcDisplay('0'); setCalcPrev(null); setCalcOp(null); setCalcNewNum(true); };

  // AI actions
  const handleAIAction = useCallback((action: string) => {
    const selectedText = content;
    if (!selectedText.trim()) return;
    const modeMap: Record<string, string> = {
      code_help: 'code', math_help: 'math', music_help: 'music', prompt_help: 'prompt',
    };
    runAI(action as any, selectedText, modeMap[action] || noteMode, selectedAgent || undefined);
  }, [content, noteMode, runAI, selectedAgent]);

  const handleComposeAI = useCallback(() => {
    if (!aiPrompt.trim()) return;
    runAI('compose', aiPrompt, noteMode, selectedAgent || undefined);
  }, [aiPrompt, noteMode, runAI, selectedAgent]);

  const applyAIResponse = useCallback(() => {
    if (aiResponse) setContent(aiResponse);
    clearResponse();
    setShowAIPanel(false);
  }, [aiResponse, clearResponse]);

  const insertAIResponse = useCallback(() => {
    if (aiResponse) setContent(prev => prev + '\n\n' + aiResponse);
    clearResponse();
    setShowAIPanel(false);
  }, [aiResponse, clearResponse]);

  // Dynamic text color based on theme/background
  const isLightBg = !isDark || isNotepadBg || isSticky;
  const textColor = isLightBg ? '#1a1a2e' : '#ffffff';
  const textMuted = isLightBg ? 'rgba(26,26,46,0.5)' : 'rgba(255,255,255,0.4)';
  const iconColor = isLightBg ? 'text-gray-800' : 'text-white';
  const iconMuted = isLightBg ? 'text-gray-500' : 'text-white/60';
  const textClass = isLightBg ? 'text-gray-900' : 'text-white';
  const textMutedClass = isLightBg ? 'text-gray-500' : 'text-white/40';
  const borderClass = isLightBg ? 'border-gray-300/30' : 'border-white/10';
  const glassBgDyn = isLightBg ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10';
  const glassHeavyDyn = isLightBg ? 'bg-black/10 border-black/15' : 'bg-white/10 border-white/15';
  const btnActiveDyn = isLightBg ? 'bg-black/15 text-gray-900' : 'bg-white/20 text-white';

  // All white text, monochrome icons
  const glassBg = 'bg-white/5 border-white/10';
  const glassHeavy = 'bg-white/10 border-white/15';
  const btnActive = 'bg-white/20 text-white';
  const accent = '#ffffff';

  if (!isOpen) return null;

  const ModeIcon = MODE_CONFIG[noteMode].icon;

  // Notepad lined background renderer
  const renderNotepadLines = () => {
    if (!isNotepadBg) return null;
    const lines = [];
    for (let i = 0; i < 40; i++) {
      lines.push(
        <div
          key={i}
          className="absolute w-full border-b"
          style={{
            top: `${60 + i * 28}px`,
            borderColor: 'hsla(210, 20%, 70%, 0.3)',
          }}
        />
      );
    }
    return (
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: 'hsl(50, 100%, 93%)' }} />
        {/* Red margin line */}
        <div className="absolute top-0 bottom-0 w-[1px]" style={{ left: '48px', backgroundColor: 'hsla(0, 70%, 60%, 0.4)' }} />
        {lines}
      </div>
    );
  };

  // Sticky note view
  const renderStickyNote = () => (
    <div
      className="absolute inset-0 z-0 flex items-center justify-center"
      style={{ backgroundColor: isDark ? 'hsl(225, 50%, 8%)' : 'hsl(220, 30%, 96%)' }}
    >
      <div
        className="w-[90%] h-[80%] rounded-lg shadow-2xl relative"
        style={{
          backgroundColor: stickyColor,
          boxShadow: '4px 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Sticky fold effect */}
        <div
          className="absolute top-0 right-0 w-8 h-8"
          style={{
            background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)`,
          }}
        />
      </div>
    </div>
  );

  const filteredNotes = showNotesList
    ? (category === 'All'
        ? notes
        : category === 'Sticky Notes'
          ? notes.filter(n => n.isSticky)
          : notes.filter(n => n.category === category))
    : notes;

  const CategoryIcon = CATEGORY_ICONS[category] || Tag;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed inset-0 z-[200] flex flex-col ${textClass}`}
          style={{
            maxWidth: 428,
            margin: '0 auto',
            backgroundColor: isPitchBlack ? '#000000' : isNotepadBg ? 'transparent' : (isDark ? 'hsl(225, 50%, 8%)' : 'hsl(220, 30%, 96%)'),
          }}
        >
          {/* Background layers */}
          {isNotepadBg && renderNotepadLines()}
          {isSticky && renderStickyNote()}
          {bgColor !== 'transparent' && bgColor !== 'notepad-lined' && !isPitchBlack && !isSticky && (
            <div className="absolute inset-0 z-0" style={{ backgroundColor: bgColor }} />
          )}

          {/* Header */}
          <div className={`relative z-10 flex items-center justify-between px-4 py-3 backdrop-blur-xl border-b ${borderClass}`}>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl`}>
                <X size={24} className={iconColor} />
              </button>
              <div className="flex items-center gap-1.5 ml-1">
                <ModeIcon size={22} className={iconColor} />
                <span className={`text-[10pt] font-medium font-display ${textClass}`}>{MODE_CONFIG[noteMode].label}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setLocalTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl`}
              >
                {isDark ? <Sun size={22} className={iconColor} /> : <Moon size={22} className={iconColor} />}
              </button>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl ${showColorPicker ? btnActiveDyn : ''}`}
              >
                <Palette size={22} className={iconColor} />
              </button>
              <button
                onClick={() => { setShowFontPicker(!showFontPicker); setShowModePicker(false); setShowColorPicker(false); }}
                className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl ${showFontPicker ? btnActiveDyn : ''}`}
              >
                <Type size={22} className={iconColor} />
              </button>
              <button
                onClick={() => setShowModePicker(!showModePicker)}
                className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl ${showModePicker ? btnActiveDyn : ''}`}
              >
                <ChevronDown size={22} className={iconColor} />
              </button>
              <button onClick={saveNote} className={`p-2 rounded-full ${glassBgDyn} backdrop-blur-xl`}>
                <Save size={22} className={iconColor} />
              </button>
            </div>
          </div>

          {/* Color picker dropdown */}
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-10 overflow-hidden border-b ${borderClass}`}
              >
                <div className="px-4 py-3 space-y-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {BG_COLORS.map(c => (
                      <button
                        key={c.label}
                        onClick={() => { setBgColor(c.value); setIsSticky(false); setShowColorPicker(false); }}
                        className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${bgColor === c.value ? 'border-current scale-110' : 'border-current/20'}`}
                        style={{
                          backgroundColor: COLOR_PREVIEWS[c.value] || (c.value === 'transparent' ? (isDark ? '#1a1a2e' : '#f0f0f5') : c.value),
                          ...(c.value === 'notepad-lined' ? { background: 'linear-gradient(to bottom, #fefce8 0%, #fefce8 100%)', backgroundSize: '100% 8px' } : {}),
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <div>
                    <span className={`text-[10pt] ${iconMuted} mb-1 block`}>
                      <StickyNote size={14} className={`inline mr-1 ${iconColor}`} />
                      Sticky Notes
                    </span>
                    <div className="flex gap-2">
                      {STICKY_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => { setIsSticky(true); setStickyColor(c); setBgColor('transparent'); setShowColorPicker(false); }}
                          className={`flex-shrink-0 w-10 h-10 rounded-lg border-2 shadow-md ${isSticky && stickyColor === c ? 'border-current scale-110' : 'border-current/20'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Font picker toolbar */}
          <AnimatePresence>
            {showFontPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-10 overflow-hidden border-b ${borderClass}`}
              >
                <div className="px-4 py-3 space-y-3">
                  {/* Font size */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9pt] ${iconMuted} w-10`}>Size</span>
                    <div className="flex gap-1.5">
                      {FONT_SIZES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => setFontSize(s.value)}
                          className={`px-2.5 py-1 rounded-full text-[9pt] border ${fontSize === s.value ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Alignment */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9pt] ${iconMuted} w-10`}>Align</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded-full border ${textAlign === 'left' ? btnActiveDyn : glassBgDyn}`}>
                        <AlignLeft size={16} className={iconColor} />
                      </button>
                      <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded-full border ${textAlign === 'center' ? btnActiveDyn : glassBgDyn}`}>
                        <AlignCenter size={16} className={iconColor} />
                      </button>
                      <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded-full border ${textAlign === 'right' ? btnActiveDyn : glassBgDyn}`}>
                        <AlignRight size={16} className={iconColor} />
                      </button>
                    </div>
                  </div>
                  {/* Font family */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[9pt] ${iconMuted} w-10`}>Font</span>
                    <div className="flex gap-1.5 overflow-x-auto">
                      {FONT_FAMILIES.map(f => (
                        <button
                          key={f.label}
                          onClick={() => { setFontFamily(f.value); setFontWeight(f.weight); setFontStyle(f.style); }}
                          className={`px-2.5 py-1 rounded-full text-[9pt] border whitespace-nowrap ${fontFamily === f.value && fontWeight === f.weight ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
                          style={{ fontFamily: f.value, fontWeight: f.weight, fontStyle: f.style }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mode picker dropdown */}
          <AnimatePresence>
            {showModePicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-10 overflow-hidden border-b ${borderClass}`}
              >
                <div className="flex gap-2 px-4 py-3 flex-wrap">
                  {(Object.keys(MODE_CONFIG) as NoteMode[]).map(mode => {
                    const Icon = MODE_CONFIG[mode].icon;
                    return (
                      <button
                        key={mode}
                        onClick={() => { setNoteMode(mode); setShowModePicker(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10pt] font-medium backdrop-blur-xl border ${noteMode === mode ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
                      >
                        <Icon size={18} className={iconColor} />
                        <span className={textClass}>{MODE_CONFIG[mode].label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category bar */}
          <div className={`relative z-10 border-b ${borderClass}`}>
            <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
              {categories.map(cat => {
                const CIcon = CATEGORY_ICONS[cat] || Tag;
                return (
                  <button
                    key={cat}
                    onClick={() => { setCategory(cat); setShowCategoryPicker(false); }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9pt] font-medium whitespace-nowrap border ${category === cat ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
                  >
                    <CIcon size={14} className={iconColor} />
                    <span className={textClass}>{cat}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddCategory(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9pt] font-medium whitespace-nowrap border ${glassBgDyn}`}
              >
                <Plus size={14} className={iconColor} />
              </button>
            </div>
          </div>

          {/* Add category modal */}
          <AnimatePresence>
            {showAddCategory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-10 overflow-hidden border-b ${borderClass}`}
              >
                <div className="flex items-center gap-2 px-4 py-2">
                  <FolderPlus size={18} className={iconColor} />
                  <input
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                    placeholder="New category name..."
                    className={`flex-1 bg-transparent text-[10pt] outline-none ${textClass}`}
                    style={{ color: textColor }}
                    autoFocus
                  />
                  <button onClick={addCategory} className={`p-1.5 rounded-full ${glassBgDyn}`}>
                    <Check size={16} className={iconColor} />
                  </button>
                  <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }} className={`p-1.5 rounded-full ${glassBgDyn}`}>
                    <X size={16} className={iconColor} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title input */}
          <div className="relative z-10 px-4 pt-3">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Note title..."
              className={`w-full bg-transparent text-lg font-display font-semibold outline-none ${textClass}`}
              style={{ fontSize: '14pt', color: textColor }}
            />
          </div>

          {/* Task / Sticky toggle */}
          <div className="relative z-10 px-4 pt-2 flex items-center gap-2">
            <button
              onClick={() => setIsTask(!isTask)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border ${isTask ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
            >
              <Check size={16} className={iconColor} />
              <span className={textClass}>{isTask ? 'Task' : 'Note'}</span>
            </button>
            {isTask && (
              <button
                onClick={() => setTaskDone(!taskDone)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border ${taskDone ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
              >
                <span className={textClass}>{taskDone ? 'Done' : 'Pending'}</span>
              </button>
            )}
            <button
              onClick={() => { setIsSticky(!isSticky); }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border ${isSticky ? btnActiveDyn + ` ${borderClass}` : glassBgDyn}`}
            >
              <StickyNote size={16} className={iconColor} />
              <span className={textClass}>Sticky</span>
            </button>
          </div>

          {/* Main writing area */}
          <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 relative overflow-auto">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={MODE_CONFIG[noteMode].placeholder}
                className={`w-full h-full p-4 bg-transparent outline-none resize-none leading-relaxed ${noteMode === 'code' ? 'font-mono' : ''}`}
                style={{
                  minHeight: '200px',
                  fontSize,
                  fontFamily: noteMode === 'code' ? '"Courier New", monospace' : fontFamily,
                  fontWeight: fontWeight || undefined,
                  fontStyle: fontStyle || undefined,
                  textAlign,
                  color: textColor,
                  ...(isNotepadBg ? { lineHeight: '28px', paddingLeft: '56px' } : {}),
                  ...(isSticky ? { paddingTop: '20px' } : {}),
                }}
              />

              {/* Drawing canvas overlay */}
              {drawTool && (
                <canvas
                  ref={canvasRef}
                  width={428}
                  height={600}
                  className="absolute inset-0 z-20"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              )}
            </div>

            {/* Attached images */}
            {images.length > 0 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Panel */}
          <AnimatePresence>
            {showAIPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative z-10 overflow-hidden border-t border-white/10"
              >
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10pt] font-display font-semibold text-white">
                      <Sparkles size={16} className="inline mr-1 text-white" />
                      AI Assistant
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* TTS toggle */}
                      <button
                        onClick={() => {
                          setTtsEnabled(!ttsEnabled);
                          if (isSpeaking && ttsAudioRef.current) {
                            ttsAudioRef.current.pause();
                            setIsSpeaking(false);
                          }
                        }}
                        className={`p-1.5 rounded-full ${ttsEnabled ? 'bg-white/20' : glassBg}`}
                        title={ttsEnabled ? 'TTS On' : 'TTS Off'}
                      >
                        {ttsEnabled ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-white/50" />}
                      </button>
                      <button onClick={() => { setShowAIPanel(false); clearResponse(); }} className={`p-1 rounded-full ${glassBg}`}>
                        <X size={18} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* AI Agent dropdown */}
                  {getContextualAgents().length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAgentPicker(!showAgentPicker)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl border text-left text-[10pt] text-white ${glassBg}`}
                      >
                        <Bot size={16} className="text-white" />
                        <span className="flex-1">
                          {selectedAgent ? getContextualAgents().find(a => a.id === selectedAgent)?.name || 'Select AI Agent' : 'Select AI Agent'}
                        </span>
                        <ChevronDown size={14} className="text-white/60" />
                      </button>
                      <AnimatePresence>
                        {showAgentPicker && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="absolute left-0 right-0 top-full mt-1 rounded-xl border bg-black/95 border-white/15 backdrop-blur-2xl overflow-hidden z-50"
                          >
                            {getContextualAgents().map(agent => (
                              <button
                                key={agent.id}
                                onClick={() => { setSelectedAgent(agent.id); setShowAgentPicker(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 ${selectedAgent === agent.id ? 'bg-white/15' : ''}`}
                              >
                                <Bot size={14} className="text-white/70" />
                                <div>
                                  <p className="text-[10pt] text-white font-medium">{agent.name}</p>
                                  <p className="text-[8pt] text-white/40">{agent.description}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => handleAIAction('grammar')} disabled={aiLoading}
                      className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                      <PenTool size={12} className="inline mr-1" /> Fix Grammar
                    </button>
                    <button onClick={() => handleAIAction('suggest')} disabled={aiLoading}
                      className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                      <Lightbulb size={12} className="inline mr-1" /> Suggestions
                    </button>
                    {noteMode === 'code' && (
                      <button onClick={() => handleAIAction('code_help')} disabled={aiLoading}
                        className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                        <Code size={12} className="inline mr-1" /> Code Help
                      </button>
                    )}
                    {noteMode === 'math' && (
                      <button onClick={() => handleAIAction('math_help')} disabled={aiLoading}
                        className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                        <Sigma size={12} className="inline mr-1" /> Math Help
                      </button>
                    )}
                    {noteMode === 'music' && (
                      <button onClick={() => handleAIAction('music_help')} disabled={aiLoading}
                        className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                        <Music size={12} className="inline mr-1" /> Music Help
                      </button>
                    )}
                    {noteMode === 'prompt' && (
                      <button onClick={() => handleAIAction('prompt_help')} disabled={aiLoading}
                        className={`px-2.5 py-1 rounded-full text-[10pt] backdrop-blur-xl border text-white ${glassBg} disabled:opacity-50`}>
                        <Wand2 size={12} className="inline mr-1" /> Improve Prompt
                      </button>
                    )}
                  </div>

                  <div className={`flex items-center gap-2 rounded-xl border ${glassBg} p-2`}>
                    <input
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleComposeAI()}
                      placeholder="Ask AI to write something..."
                      className="flex-1 bg-transparent text-[10pt] outline-none text-white placeholder:text-white/40"
                    />
                    <button onClick={handleComposeAI} disabled={aiLoading}
                      className="p-1.5 rounded-full bg-white/20">
                      <Send size={16} className="text-white" />
                    </button>
                  </div>

                  {(aiResponse || aiLoading || aiError) && (
                    <div className={`rounded-xl border ${glassBg} p-3 max-h-32 overflow-y-auto`}>
                      {aiLoading && (
                        <div className="flex items-center gap-2 text-[10pt] text-white">
                          <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Thinking...
                        </div>
                      )}
                      {aiError && <p className="text-[10pt] text-red-400">{aiError}</p>}
                      {aiResponse && (
                        <>
                          <p className="text-[10pt] whitespace-pre-wrap leading-relaxed text-white">{aiResponse}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={applyAIResponse}
                              className="px-2.5 py-1 rounded-full text-[10pt] font-medium bg-white/20 text-white">
                              Replace
                            </button>
                            <button onClick={insertAIResponse}
                              className={`px-2.5 py-1 rounded-full text-[10pt] text-white ${glassBg}`}>
                              Insert Below
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(aiResponse); }}
                              className={`px-2.5 py-1 rounded-full text-[10pt] text-white ${glassBg}`}>
                              <Copy size={12} className="inline mr-1" /> Copy
                            </button>
                            <button onClick={() => speakTTS(aiResponse)}
                              className={`px-2.5 py-1 rounded-full text-[10pt] text-white ${glassBg}`}>
                              <Volume2 size={12} className="inline mr-1" /> Speak
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Drawing toolbar */}
          <AnimatePresence>
            {drawTool && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`relative z-10 border-t ${borderClass}`}
              >
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex gap-1.5">
                    {PEN_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setPenColor(c)}
                        className={`w-7 h-7 rounded-full border-2 ${penColor === c ? 'border-current scale-110' : 'border-current/20'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <input
                    type="range" min={1} max={12} value={penSize}
                    onChange={e => setPenSize(Number(e.target.value))}
                    className="w-16 h-1"
                  />
                  <button onClick={undoDraw} className={`p-1.5 rounded-full ${glassBgDyn}`}>
                    <RotateCcw size={18} className={iconColor} />
                  </button>
                  <button onClick={clearCanvas} className={`p-1.5 rounded-full ${glassBgDyn}`}>
                    <Trash2 size={18} className={iconColor} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom toolbar */}
          <div className={`relative z-10 flex items-center justify-between px-3 py-2.5 backdrop-blur-xl border-t ${borderClass}`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDrawTool(drawTool === 'pen' ? null : 'pen')}
                className={`p-2 rounded-full ${drawTool === 'pen' ? btnActiveDyn : glassBgDyn}`}
              >
                <PenTool size={22} className={iconColor} />
              </button>
              <button
                onClick={() => setDrawTool(drawTool === 'highlighter' ? null : 'highlighter')}
                className={`p-2 rounded-full ${drawTool === 'highlighter' ? btnActiveDyn : glassBgDyn}`}
              >
                <Highlighter size={22} className={iconColor} />
              </button>
              <button
                onClick={() => setDrawTool(drawTool === 'eraser' ? null : 'eraser')}
                className={`p-2 rounded-full ${drawTool === 'eraser' ? btnActiveDyn : glassBgDyn}`}
              >
                <Eraser size={22} className={iconColor} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* Wake word: "Hello Smile" toggle */}
              {wakeSupported && (
                <button
                  onClick={() => setWakeWordActive(!wakeWordActive)}
                  className={`p-2 rounded-full ${wakeWordActive ? 'bg-green-500/30 ring-1 ring-green-400/50' : glassBgDyn}`}
                  title={wakeWordActive ? '"Hello Smile" active' : 'Activate "Hello Smile"'}
                >
                  <Bot size={22} className={wakeWordActive ? 'text-green-400' : iconColor} />
                </button>
              )}
              {voiceSupported && (
                <button
                  onClick={isListening ? stopVoice : startVoice}
                  className={`p-2 rounded-full ${isListening ? 'bg-red-500/20' : glassBgDyn}`}
                >
                  {isListening ? <MicOff size={22} className={iconColor} /> : <Mic size={22} className={iconColor} />}
                </button>
              )}
              <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full ${glassBgDyn}`}>
                <Paperclip size={22} className={iconColor} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageAttach} />
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`p-2 rounded-full ${showAIPanel ? btnActiveDyn : glassBgDyn}`}
              >
                <Sparkles size={22} className={iconColor} />
              </button>
              <button
                onClick={() => setShowMiniCalc(!showMiniCalc)}
                className={`p-2 rounded-full ${showMiniCalc ? btnActiveDyn : glassBgDyn}`}
              >
                <Calculator size={22} className={iconColor} />
              </button>
              <button
                onClick={() => setShowNotesList(!showNotesList)}
                className={`p-2 rounded-full ${showNotesList ? btnActiveDyn : glassBgDyn}`}
              >
                <FileText size={22} className={iconColor} />
              </button>
              <button onClick={newNote} className={`p-2 rounded-full ${glassBgDyn}`}>
                <Plus size={22} className={iconColor} />
              </button>
            </div>
          </div>

          {/* Notes list panel */}
          <AnimatePresence>
            {showNotesList && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl max-h-[70%] overflow-hidden flex flex-col backdrop-blur-2xl border-t bg-black/90 border-white/10"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <h3 className="font-display font-semibold text-white text-[12pt]">My Notes</h3>
                  <button onClick={() => setShowNotesList(false)} className={`p-2 rounded-full ${glassBg}`}>
                    <X size={20} className="text-white" />
                  </button>
                </div>
                {/* Category filter in notes list */}
                <div className="flex gap-1 px-4 pb-2 overflow-x-auto">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-0.5 rounded-full text-[9pt] whitespace-nowrap border text-white ${category === cat ? btnActive + ' border-white/30' : glassBg}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {filteredNotes.length === 0 ? (
                    <p className="text-center text-[10pt] py-8 text-white/40">No saved notes yet</p>
                  ) : (
                    filteredNotes.map(note => {
                      const NIcon = MODE_CONFIG[note.mode]?.icon || FileText;
                      return (
                        <div
                          key={note.id}
                          onClick={() => loadNote(note)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer ${glassBg} ${activeNoteId === note.id ? btnActive : ''}`}
                          style={note.isSticky ? { borderLeft: `3px solid ${note.color}` } : undefined}
                        >
                          {note.isSticky ? (
                            <StickyNote size={20} className="text-white" />
                          ) : (
                            <NIcon size={20} className="text-white" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[10pt] font-medium truncate text-white">{note.title || 'Untitled'}</p>
                            <p className="text-[9pt] truncate text-white/50">{note.content.slice(0, 50) || 'Empty note'}</p>
                            {note.category && note.category !== 'All' && (
                              <span className="text-[8pt] text-white/30">{note.category}</span>
                            )}
                          </div>
                          {note.isTask && (
                            <span className={`text-[10pt] px-1.5 py-0.5 rounded-full ${note.taskDone ? 'bg-white/20' : 'bg-white/10'} text-white`}>
                              {note.taskDone ? '✓' : '○'}
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                            className="p-1 rounded-full hover:bg-white/10"
                          >
                            <Trash2 size={18} className="text-white/60" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Mini Calculator */}
          <AnimatePresence>
            {showMiniCalc && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute z-40 top-20 right-4 w-52 rounded-2xl backdrop-blur-2xl border shadow-2xl bg-black/90 border-white/15"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <span className="text-[10pt] font-display font-semibold text-white">
                    <Calculator size={14} className="inline mr-1" />
                    Calculator
                  </span>
                  <button onClick={() => setShowMiniCalc(false)} className="p-0.5">
                    <Minimize2 size={16} className="text-white" />
                  </button>
                </div>
                <div className="px-3 py-2 text-right text-lg font-mono truncate text-white">
                  {calcDisplay}
                </div>
                <div className="grid grid-cols-4 gap-1 p-2">
                  {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='].map(btn => (
                    <button
                      key={btn}
                      onClick={() => {
                        if (btn === 'C') calcClear();
                        else if (btn === '=') calcEquals();
                        else if (['+', '-', '×', '÷'].includes(btn)) calcOperation(btn);
                        else if (btn === '±') setCalcDisplay(prev => String(-parseFloat(prev)));
                        else if (btn === '%') setCalcDisplay(prev => String(parseFloat(prev) / 100));
                        else if (btn === '⌫') setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
                        else calcInput(btn);
                      }}
                      className={`h-9 rounded-lg text-[10pt] font-medium text-white ${
                        ['÷', '×', '-', '+', '='].includes(btn)
                          ? 'bg-white/20'
                          : ['C', '±', '%'].includes(btn)
                            ? glassHeavy
                            : glassBg
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
