import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import smileImg from '@/assets/smile-ai.png';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSmileAnimations } from '@/hooks/useSmileAnimations';
import { useBackgroundTheme, backgroundThemes } from '@/hooks/useBackgroundTheme';
import { getCachedUrl } from '@/hooks/useVideoCache';
import { Mic, MicOff, Volume2, VolumeX, Camera, Video, Sun, X, Plus, Square, Pause, Play, Circle, FolderOpen, Calculator, FileText } from 'lucide-react';
import { useScreenCapture, type AudioSource, type VideoQuality } from '@/hooks/useScreenCapture';
import FloatingMiniCalculator from '@/components/FloatingMiniCalculator';
import FloatingMiniNotepad from '@/components/FloatingMiniNotepad';

const WELCOME_MSG = "Hi there, I'm Smile, your AI Voice assistant by Orange AI OS. What can I do for you?";

const GREETING_MSG = `Greetings,

I am Smile, your AI Assistant here at Orange Ai OS Cubed. I will guide you in utilizing this operating system. The desktop is organized into four drawers for ease of access.

By tapping the top section, an AI drawer will appear, providing connections to all AI platforms, agents, and related resources.

A single tap near the edge of the right side of your phone or a swipe from right to left will open the World Wide Web drawer, linking you to essential websites for productivity, news, knowledge, and social media access.

A single tap near the edge of the left side of your phone or a swipe from left to right will reveal the Decentralized Cortex drawer, which connects you to the Intranet or the Decentralized Distributed Domain of Curated Cache Content. This includes access to DC3 tools and apps for productivity, as well as Edge AI, Etherneom Decentralized Currency, and curated content relevant to news and social media.

Swiping from the bottom towards the top will open the System and Utilities drawer, granting access to system controls such as battery life, volume, and an overview of the founder's mission and vision. It also provides access to the Orange Ai OS WhatsApp Community.

Tapping my body will minimize me into a blue orb. Tapping the blue orb will allow me to assist you as I move around the desktop. A hard or long press on my body will reveal quick shortcuts like screenshot, screen recorder, mini calculator, notes button, volume, and brightness control. Additionally, you can select cool background animations to enhance your desktop experience.

We offer a notepad that is considered the best in the world. Our phone system can switch between regular standard modes and applications such as WhatsApp, Viber, Telegram, ChatX, Messenger, or Keet, a peer-to-peer communication application prioritizing security and privacy.

As an Edge Contextual AI, our advertisements are driven by geo-fenced algorithms, allowing sponsors to promote their products in real-time across the Decentralized Cortex Network.

We advocate for an Open WiFi Network and proudly participate in the Wireless Enterprises Open WiFi Network Allowance or WEOWN. Thank you and happy browsing.`;

const DEMO_PHRASES = [
  "Good Morning Don, how are you today.",
  "I remember you have an unfinished business with your Origin OS. Should I open the file?",
  "It's a Sunny day here in Cantilan, unfortunately the weather forecast for tomorrow will be a rainy day. Prepare your umbrella.",
  "Do you want me to play Tesha Music? Your favorite Tesha Song, or should I play Taylor Swift? I am a Swiftie, hahaha!",
  "You have 9 emails since yesterday, should I read them to you?",
  "The war in Iran has gone haywire. I bet crude oil will go up to the roof, maybe more than 100 pesos!",
  "I like the hamburger in Cantilan FOOD PARK, should I order it for you?",
];

const AD_MESSAGE = "Hello Don, Jollibee is offering your favorite breakfasts! Corned beef and garlic rice. It sounds delicious! Jollibee Rockwell Makati is nearby at the Powerplant Mall. In 5 minutes you can redeem the attached QR Voucher for free. Should I activate Google Map to guide you the fastest way to Jollibee Rockwell?";

interface SmileAssistantProps {
  introComplete?: boolean;
}

export default function SmileAssistant({ introComplete = false }: SmileAssistantProps) {
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 20, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const greetingPlayedRef = useRef(false);
  const speechUnlockedRef = useRef(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const lastTapRef = useRef(0);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // Quick shortcut menu state
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(60);
  const { selectedId: activeBgId, selectTheme: selectBgTheme } = useBackgroundTheme();

  // Screen capture
  const {
    isRecording, isPaused, recordingTime, permissionError, clearPermissionError,
    takeScreenshot, startRecording, pauseRecording, resumeRecording, stopRecording,
  } = useScreenCapture();
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource>('system');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('1080p');
  const [folderName, setFolderName] = useState('Recordings');
  const [showMiniCalc, setShowMiniCalc] = useState(false);
  const [showMiniNotepad, setShowMiniNotepad] = useState(false);

  // Speak permission errors aloud
  useEffect(() => {
    if (permissionError) {
      speak(permissionError);
      const t = setTimeout(clearPermissionError, 5000);
      return () => clearTimeout(t);
    }
  }, [permissionError]);

  const handleVoiceResult = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    if (lower.includes('smile') || lower.includes('hello smile')) {
      if (!visible) {
        setVisible(true);
        speak(WELCOME_MSG);
      } else {
        speak("I'm here! What can I do for you?");
      }
    } else if (visible) {
      speak(`You said: "${transcript}"`);
    }
  }, [visible]);

  const { isListening, start: startListening, stop: stopListening, supported } = useSpeechRecognition(handleVoiceResult);
  const { currentTrick, isPerformingTrick } = useSmileAnimations(visible, hasGreeted);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (mutedRef.current) {
        resolve();
        return;
      }
      // Stop ALL audio sources to prevent overlapping voices
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1.2;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, []);

  const [speechUnlocked, setSpeechUnlocked] = useState(false);

  // Unlock speechSynthesis on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => {
      if (speechUnlockedRef.current) return;
      speechUnlockedRef.current = true;
      setSpeechUnlocked(true);
      if ('speechSynthesis' in window) {
        const silent = new SpeechSynthesisUtterance('');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
      }
    };
    // Also try to auto-unlock if speech is already available (some browsers)
    if ('speechSynthesis' in window) {
      try {
        const test = new SpeechSynthesisUtterance('');
        test.volume = 0;
        test.onend = () => {
          speechUnlockedRef.current = true;
          setSpeechUnlocked(true);
        };
        window.speechSynthesis.speak(test);
      } catch (e) { /* ignore */ }
    }
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Play greeting ONCE on first boot, right after intro splash finishes AND speech is unlocked
  useEffect(() => {
    if (introComplete && speechUnlocked && visible && !hasGreeted && !muted && !greetingPlayedRef.current) {
      const timer = setTimeout(async () => {
        greetingPlayedRef.current = true;
        await speak(GREETING_MSG);
        setHasGreeted(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    // If greeting was already played but hasGreeted is false (e.g. orb restore), just mark greeted
    if (visible && !hasGreeted && greetingPlayedRef.current) {
      setHasGreeted(true);
    }
  }, [introComplete, speechUnlocked, visible, hasGreeted, muted, speak]);

  // Random demo phrases loop — 60s interval AFTER each message finishes
  const demoIndexRef = useRef<number[]>([]);
  const demoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPlayedRef = useRef<number>(-1);
  const messageCountRef = useRef(0);

  useEffect(() => {
    if (!visible || !hasGreeted) return;
    let cancelled = false;

    const MESSAGE_INTERVAL = 60000; // 60 seconds after each message finishes

    const shuffleAndSpeak = async () => {
      if (cancelled) return;

      if (mutedRef.current) {
        demoTimerRef.current = setTimeout(shuffleAndSpeak, MESSAGE_INTERVAL);
        return;
      }

      // Every 3rd message, play the ad/promo message instead
      messageCountRef.current += 1;
      if (messageCountRef.current % 4 === 0) {
        await speak(AD_MESSAGE);
      } else {
        if (demoIndexRef.current.length === 0) {
          let shuffled: number[];
          do {
            shuffled = [...Array(DEMO_PHRASES.length).keys()].sort(() => Math.random() - 0.5);
          } while (shuffled[shuffled.length - 1] === lastPlayedRef.current && DEMO_PHRASES.length > 1);
          demoIndexRef.current = shuffled;
        }

        const idx = demoIndexRef.current.pop()!;
        lastPlayedRef.current = idx;

        await speak(DEMO_PHRASES[idx]);
      }

      // Wait 60 seconds AFTER the message finishes before scheduling the next one
      if (!cancelled) {
        demoTimerRef.current = setTimeout(shuffleAndSpeak, MESSAGE_INTERVAL);
      }
    };

    // First regular message starts 60 seconds after greeting completes
    demoTimerRef.current = setTimeout(shuffleAndSpeak, MESSAGE_INTERVAL);

    return () => {
      cancelled = true;
      if (demoTimerRef.current) clearTimeout(demoTimerRef.current);
    };
  }, [visible, hasGreeted, speak]);

  const handleTap = useCallback(() => {
    if (hasMoved.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      setVisible(false);
      window.speechSynthesis?.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, []);

  // Long press helpers
  const longPressTriggeredRef = useRef(false);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    clearLongPress();
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setShowQuickMenu(true);
    }, 600);
  }, [clearLongPress]);

  // Show from orb — only if long press didn't fire
  const handleOrbTap = useCallback(() => {
    if (longPressTriggeredRef.current || showQuickMenu) {
      longPressTriggeredRef.current = false;
      return;
    }
    setVisible(true);
    // Don't replay greeting — just say a short welcome back
  }, [speak, showQuickMenu]);

  // Drag handlers (touch)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    posStartRef.current = { ...position };
    hasMoved.current = false;
    setIsDragging(true);
    startLongPress();
  }, [position, startLongPress]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true;
      clearLongPress();
    }
    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 80, posStartRef.current.x + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 100, posStartRef.current.y + dy)),
    });
  }, [isDragging, clearLongPress]);

  const onTouchEnd = useCallback(() => {
    setIsDragging(false);
    clearLongPress();
    if (!hasMoved.current && !longPressTriggeredRef.current) handleTap();
  }, [handleTap, clearLongPress]);

  // Drag handlers (mouse)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...position };
    hasMoved.current = false;
    setIsDragging(true);
    startLongPress();

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragStartRef.current.x;
      const dy = ev.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        hasMoved.current = true;
        clearLongPress();
      }
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 80, posStartRef.current.x + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, posStartRef.current.y + dy)),
      });
    };
    const onUp = () => {
      setIsDragging(false);
      clearLongPress();
      if (!hasMoved.current && !longPressTriggeredRef.current) handleTap();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [position, handleTap, startLongPress, clearLongPress]);

  return (
    <>
      {/* Floating Recording Indicator */}
      <AnimatePresence>
        {isRecording && !showQuickMenu && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-12 left-1/2 -translate-x-1/2 z-[300] screen-capture-ignore"
          >
            <div className="flex items-center gap-3 bg-black/70 backdrop-blur-xl border border-red-500/30 rounded-full px-4 py-2 shadow-[0_4px_20px_rgba(239,68,68,0.3)]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-medium tabular-nums">
                {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
              </span>
              <div className="w-px h-4 bg-white/20" />
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {isPaused ? <Play size={12} className="text-white ml-0.5" /> : <Pause size={12} className="text-white" />}
              </button>
              <button
                onClick={() => { stopRecording(); speak('Recording saved!'); }}
                className="w-7 h-7 rounded-full bg-red-500/30 flex items-center justify-center hover:bg-red-500/40 transition-colors"
              >
                <Square size={10} className="text-red-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blue Orb when hidden */}
      <AnimatePresence>
        {!visible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed z-[200] cursor-pointer"
            style={{ left: position.x + 20, top: position.y + 30 }}
            onClick={handleOrbTap}
            onMouseDown={(e) => { e.stopPropagation(); startLongPress(); }}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={(e) => { e.stopPropagation(); startLongPress(); }}
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
          >
            <div className="w-10 h-10 rounded-full relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
              <div className="absolute inset-1 rounded-full bg-blue-400/50 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-blue-400 shadow-[0_0_20px_6px_rgba(59,130,246,0.5)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Shortcut Menu */}
      <AnimatePresence>
        {showQuickMenu && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[250] w-64 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-4 max-h-[80vh] overflow-y-auto screen-capture-ignore"
            style={{
              left: Math.min(position.x, window.innerWidth - 272),
              top: Math.max(10, position.y - 80),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowQuickMenu(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={12} className="text-white" />
            </button>

            <p className="text-white/60 text-[10px] font-light tracking-widest uppercase mb-3">Quick Shortcuts</p>

            {/* Calculator & Notepad buttons */}
            <div className="flex gap-3 mb-2">
              <button
                onClick={() => { setShowMiniCalc(true); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Calculator size={18} className="text-white" strokeWidth={1.5} />
                <span className="text-white text-[9px] font-light">Calculator</span>
              </button>
              <button
                onClick={() => { setShowMiniNotepad(true); }}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <FileText size={18} className="text-white" strokeWidth={1.5} />
                <span className="text-white text-[9px] font-light">Notepad</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  const result = await takeScreenshot();
                  if (result.success) {
                    speak('Screenshot saved successfully!');
                    setShowQuickMenu(false);
                  }
                }}
                className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Camera size={18} className="text-white" strokeWidth={1.5} />
                <span className="text-white text-[9px] font-light">Screenshot</span>
              </button>
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                    speak('Recording stopped and saved!');
                  } else {
                    setShowRecordDialog(true);
                  }
                }}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-colors ${
                  isRecording ? 'bg-red-500/30 hover:bg-red-500/40' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {isRecording ? <Square size={18} className="text-red-400" strokeWidth={1.5} /> : <Video size={18} className="text-white" strokeWidth={1.5} />}
                <span className={`text-[9px] font-light ${isRecording ? 'text-red-400' : 'text-white'}`}>
                  {isRecording ? 'Stop' : 'Record'}
                </span>
              </button>
            </div>

            {/* Record Setup Dialog */}
            <AnimatePresence>
              {showRecordDialog && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="bg-white/5 rounded-xl p-3 space-y-3 border border-white/10">
                    <p className="text-white/60 text-[10px] font-light tracking-widest uppercase">Recording Setup</p>

                    {/* Folder Name */}
                    <div>
                      <label className="text-white/50 text-[9px] font-light block mb-1">Save Folder</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={folderName}
                          onChange={(e) => setFolderName(e.target.value)}
                          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
                          placeholder="Folder name..."
                        />
                        <button className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                          <FolderOpen size={14} className="text-white/60" />
                        </button>
                      </div>
                    </div>

                    {/* Audio Source */}
                    <div>
                      <label className="text-white/50 text-[9px] font-light block mb-1.5">Audio Source</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([
                          { value: 'system' as AudioSource, label: 'System', icon: '🔊' },
                          { value: 'microphone' as AudioSource, label: 'Mic', icon: '🎙️' },
                          { value: 'both' as AudioSource, label: 'Both', icon: '🎚️' },
                          { value: 'none' as AudioSource, label: 'None', icon: '🔇' },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setAudioSource(opt.value)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                              audioSource === opt.value
                                ? 'bg-white/20 text-white border border-white/30'
                                : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Video Quality */}
                    <div>
                      <label className="text-white/50 text-[9px] font-light block mb-1.5">Video Quality</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([
                          { value: '720p' as VideoQuality, label: '720p', desc: 'HD' },
                          { value: '1080p' as VideoQuality, label: '1080p', desc: 'FHD' },
                          { value: '4k' as VideoQuality, label: '4K', desc: 'Ultra' },
                        ]).map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setVideoQuality(opt.value)}
                            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                              videoQuality === opt.value
                                ? 'bg-white/20 text-white border border-white/30'
                                : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                            }`}
                          >
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-[8px] opacity-60">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start / Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRecordDialog(false)}
                        className="flex-1 py-2 rounded-lg bg-white/5 text-white/50 text-[10px] hover:bg-white/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setShowRecordDialog(false);
                          setShowQuickMenu(false);
                          await new Promise(r => setTimeout(r, 400));
                          const result = await startRecording({ audioSource, folderName, quality: videoQuality });
                          if (result.success) speak('Recording started!');
                        }}
                        className="flex-1 py-2 rounded-lg bg-red-500/30 text-red-300 text-[10px] font-medium hover:bg-red-500/40 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Circle size={10} className="fill-red-400 text-red-400" />
                        Start Recording
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Volume slider */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Volume2 size={12} className="text-white/70" strokeWidth={1.5} />
                <span className="text-white/70 text-[9px] font-light">Volume</span>
                <span className="text-white/50 text-[9px] font-light ml-auto">{volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Brightness slider */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Sun size={12} className="text-white/70" strokeWidth={1.5} />
                <span className="text-white/70 text-[9px] font-light">Brightness</span>
                <span className="text-white/50 text-[9px] font-light ml-auto">{brightness}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              />
            </div>

            {/* Background Theme Selector */}
            <div>
              <p className="text-white/60 text-[10px] font-light tracking-widest uppercase mb-2">Backgrounds</p>
              <div className="grid grid-cols-4 gap-2">
                {backgroundThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => selectBgTheme(theme.id)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                        activeBgId === theme.id
                          ? 'border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)] scale-110'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <video
                        src={getCachedUrl(theme.videoUrl)}
                        muted
                        playsInline
                        autoPlay
                        loop
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white/70 text-[7px] font-light leading-tight truncate w-full text-center">
                      {theme.label}
                    </span>
                  </button>
                ))}
                {/* Add custom background button */}
                <button
                  className="flex flex-col items-center gap-1 group"
                  onClick={() => {/* Future: custom background upload */}}
                >
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center hover:border-white/50 transition-colors">
                    <Plus size={16} className="text-white/50 group-hover:text-white/70" />
                  </div>
                  <span className="text-white/70 text-[7px] font-light">Add</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smile AI Assistant */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed z-[200] select-none touch-none"
            style={{ left: position.x, top: position.y }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >

            {/* Floating Robot with 3D tricks */}
            <motion.div
              style={{ perspective: 800 }}
              className="relative cursor-grab active:cursor-grabbing"
            >
              <motion.div
                animate={
                  isPerformingTrick && currentTrick
                    ? currentTrick.keyframes
                    : { y: [0, -8, 0, -4, 0] }
                }
                transition={
                  isPerformingTrick && currentTrick
                    ? currentTrick.transition
                    : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  transformStyle: 'preserve-3d',
                  visibility: isPerformingTrick && currentTrick?.fullscreen ? 'hidden' : 'visible',
                }}
              >
                {/* Large outer glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full bg-sky-400/20 blur-2xl animate-pulse" />
                </div>

                {/* Mid ring glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full border-2 border-sky-400/30 animate-ping" style={{ animationDuration: '3s' }} />
                </div>

                <img
                  src={smileImg}
                  alt="Smile AI Assistant"
                  className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]"
                  draggable={false}
                />

                {/* Chest glow circle */}
                <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-sky-400/40 shadow-[0_0_14px_6px_rgba(56,189,248,0.4)] animate-pulse pointer-events-none" />

                {/* Bottom glow accent */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-sky-400/25 blur-md animate-pulse pointer-events-none" />
              </motion.div>
            </motion.div>

            {/* Fullscreen face zoom overlay */}
            <AnimatePresence>
              {isPerformingTrick && currentTrick?.fullscreen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none"
                  style={{ left: -position.x, top: -position.y }}
                >
                  <motion.img
                    src={smileImg}
                    alt="Smile AI Zoom"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{
                      scale: [0.5, 1, 6, 6, 1, 0.5],
                      opacity: [0, 1, 1, 1, 1, 0],
                      rotateY: [0, -5, 0, 0, 5, 0],
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 3.5, ease: 'easeInOut' }}
                    className="w-32 h-32 object-contain drop-shadow-[0_0_40px_rgba(56,189,248,0.8)]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mute button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                const next = !muted;
                setMuted(next);
                mutedRef.current = next;
                if (next) {
                  window.speechSynthesis?.cancel();
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                }
              }}
              className={`absolute -bottom-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                muted
                  ? 'bg-orange-500/80 border-orange-400/60 shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                  : 'bg-white/20 border-white/30 backdrop-blur-xl'
              }`}
            >
              {muted ? (
                <VolumeX size={14} className="text-white" />
              ) : (
                <Volume2 size={14} className="text-white" />
              )}
            </motion.button>

            {/* Mic button */}
            {supported && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  isListening ? stopListening() : startListening();
                }}
                className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                  isListening
                    ? 'bg-red-500/80 border-red-400/60 shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                    : 'bg-white/20 border-white/30 backdrop-blur-xl'
                }`}
              >
                {isListening ? (
                  <MicOff size={14} className="text-white" />
                ) : (
                  <Mic size={14} className="text-white" />
                )}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mini Calculator - independent of quick menu */}
      <AnimatePresence>
        {showMiniCalc && <FloatingMiniCalculator onClose={() => setShowMiniCalc(false)} />}
      </AnimatePresence>

      {/* Floating Mini Notepad - independent of quick menu */}
      <AnimatePresence>
        {showMiniNotepad && <FloatingMiniNotepad onClose={() => setShowMiniNotepad(false)} />}
      </AnimatePresence>
    </>
  );
}