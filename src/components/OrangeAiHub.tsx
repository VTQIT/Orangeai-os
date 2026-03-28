import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Menu, Paperclip, Send, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import orangeAiLogo from '@/assets/orange-ai-logo.png';
import { getCachedUrl } from '@/hooks/useVideoCache';

import grokIcon from '@/assets/icons/grok.png';
import chatgptIcon from '@/assets/icons/chatgpt.png';
import deepseekIcon from '@/assets/icons/deepseek.png';
import geminiIcon from '@/assets/icons/gemini.png';
import minimaxIcon from '@/assets/icons/minimax.png';
import veoIcon from '@/assets/icons/veo.png';
import soraIcon from '@/assets/icons/sora.png';
import midjourneyIcon from '@/assets/icons/midjourney.png';
import higgsfieldIcon from '@/assets/icons/higgsfield.png';
import seedanceIcon from '@/assets/icons/seedance.png';
import klingIcon from '@/assets/icons/kling.png';
import sunoIcon from '@/assets/icons/suno.png';
import claudeIcon from '@/assets/icons/claude.png';
import lovableIcon from '@/assets/icons/lovable.png';
import replitIcon from '@/assets/icons/replit.png';
import perplexityIcon from '@/assets/icons/perplexity.png';
import emergentIcon from '@/assets/icons/emergent.png';
import openclawIcon from '@/assets/icons/openclaw.png';
import nanoBananaIcon from '@/assets/icons/nanobanana.png';
import claudeCodeIcon from '@/assets/icons/claudecode.png';
import base44Icon from '@/assets/icons/base44.png';
import mistralIcon from '@/assets/icons/mistral.png';
import codexIcon from '@/assets/icons/codex.png';

type Category = 'General' | 'Image Generator' | 'Video Generator' | 'Music Generator' | 'Coding & Apps' | 'Voice TTS' | '3D Ai' | 'Ai Agents' | 'Physics & Science' | 'Law' | 'Fintech & Trading' | 'Medicine' | 'Ai Academy' | 'Ai Tutorials';

const CATEGORIES: Category[] = [
  'General', 'Image Generator', 'Video Generator', 'Music Generator',
  'Coding & Apps', 'Voice TTS', '3D Ai', 'Ai Agents',
  'Physics & Science', 'Law', 'Fintech & Trading', 'Medicine', 'Ai Academy', 'Ai Tutorials',
];

// Map agent names to their icon assets
const AGENT_ICONS: Record<string, string> = {
  'Grok': grokIcon,
  'ChatGPT': chatgptIcon,
  'DeepSeek': deepseekIcon,
  'Gemini': geminiIcon,
  'MiniMax': minimaxIcon,
  'VEO': veoIcon,
  'Sora': soraIcon,
  'Midjourney': midjourneyIcon,
  'Higgsfield': higgsfieldIcon,
  'Seedance': seedanceIcon,
  'Kling': klingIcon,
  'Suno': sunoIcon,
  'Claude': claudeIcon,
  'Lovable': lovableIcon,
  'Replit': replitIcon,
  'Perplexity': perplexityIcon,
  'Emergent': emergentIcon,
  'Open Claw': openclawIcon,
  'Nano Banana': nanoBananaIcon,
  'Claude Code': claudeCodeIcon,
  'Base 44': base44Icon,
  'Mistral': mistralIcon,
  'Codex': codexIcon,
};

interface Agent {
  name: string;
  icon: string;
}

const AGENTS: Record<Category, Agent[]> = {
  'General': [
    { name: 'Grok', icon: 'G' },
    { name: 'ChatGPT', icon: 'C' },
    { name: 'DeepSeek', icon: 'D' },
    { name: 'Gemini', icon: 'G' },
    { name: 'Mistral', icon: 'M' },
    { name: 'MiniMax', icon: 'M' },
  ],
  'Image Generator': [
    { name: 'Nano Banana', icon: 'N' },
    { name: 'Grok', icon: 'G' },
  ],
  'Video Generator': [
    { name: 'Grok', icon: 'G' },
    { name: 'VEO', icon: 'V' },
    { name: 'Sora', icon: 'S' },
    { name: 'Midjourney', icon: 'M' },
    { name: 'Higgsfield', icon: 'H' },
    { name: 'Seedance', icon: 'S' },
    { name: 'Kling', icon: 'K' },
  ],
  'Music Generator': [
    { name: 'Jggl.ai', icon: 'J' },
    { name: 'Jukebox', icon: 'J' },
    { name: 'Musicful.ai', icon: 'M' },
    { name: 'Suno', icon: 'S' },
  ],
  'Coding & Apps': [
    { name: 'Claude', icon: 'C' },
    { name: 'Claude Code', icon: 'CC' },
    { name: 'Lovable', icon: 'L' },
    { name: 'Replit', icon: 'R' },
    { name: 'Perplexity', icon: 'P' },
    { name: 'Emergent', icon: 'E' },
    { name: 'Base 44', icon: 'B' },
    { name: 'Codex', icon: 'X' },
  ],
  'Voice TTS': [
    { name: 'ElevenLabs', icon: 'E' },
    { name: 'Grok', icon: 'G' },
    { name: 'ChatGPT', icon: 'C' },
  ],
  '3D Ai': [
    { name: 'Tripo3D', icon: 'T' },
  ],
  'Ai Agents': [
    { name: 'Open Claw', icon: 'O' },
  ],
  'Physics & Science': [
    { name: 'Gemini', icon: 'G' },
    { name: 'ChatGPT', icon: 'C' },
    { name: 'DeepSeek', icon: 'D' },
  ],
  'Law': [
    { name: 'ChatGPT', icon: 'C' },
    { name: 'Gemini', icon: 'G' },
    { name: 'Claude', icon: 'C' },
  ],
  'Fintech & Trading': [
    { name: 'ChatGPT', icon: 'C' },
    { name: 'Grok', icon: 'G' },
    { name: 'DeepSeek', icon: 'D' },
  ],
  'Medicine': [
    { name: 'Gemini', icon: 'G' },
    { name: 'ChatGPT', icon: 'C' },
    { name: 'Claude', icon: 'C' },
  ],
  'Ai Academy': [
    { name: 'ChatGPT', icon: 'C' },
    { name: 'Gemini', icon: 'G' },
    { name: 'Perplexity', icon: 'P' },
  ],
  'Ai Tutorials': [
    { name: 'ChatGPT', icon: 'C' },
    { name: 'Gemini', icon: 'G' },
    { name: 'Claude', icon: 'C' },
  ],
};

interface OrangeAiHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrangeAiHub({ isOpen, onClose }: OrangeAiHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('General');
  const [selectedAgent, setSelectedAgent] = useState<string>('Grok');
  const [prompt, setPrompt] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [cachedLogo, setCachedLogo] = useState(orangeAiLogo);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    setCachedLogo(getCachedUrl(orangeAiLogo));
  }, []);

  const handleLogoTap = useCallback(() => {
    setShowIntroVideo(true);
    setTimeout(() => {
      if (introVideoRef.current) {
        introVideoRef.current.currentTime = 0;
        introVideoRef.current.play().catch(() => {});
      }
    }, 100);
  }, []);

  const handleCloseIntroVideo = useCallback(() => {
    setShowIntroVideo(false);
    if (introVideoRef.current) {
      introVideoRef.current.pause();
      introVideoRef.current.currentTime = 0;
    }
  }, []);

  if (!isOpen) return null;

  const agents = AGENTS[selectedCategory];

  const handleSend = () => {
    if (!prompt.trim()) return;
    console.log(`[${selectedCategory}] → ${selectedAgent}: ${prompt}`);
    setPrompt('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 3000);
  };

  const handleAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,audio/*,video/*,text/*,.md,.pdf,.doc,.docx';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        console.log('Attached files:', Array.from(files).map(f => f.name));
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black" style={{ maxWidth: 428, margin: '0 auto' }}>
      {/* Video background */}
      <div className="absolute inset-0">
        <video
          src={getCachedUrl('/videos/orange-ai-bg.mp4')}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gray-900/25 backdrop-blur-xl">
          <button onClick={onClose} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-white font-bold text-lg tracking-wider">ORANGE Ai</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Hamburger dropdown */}
        {menuOpen && (
          <div className="absolute top-14 right-3 z-50 bg-white/10 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 min-w-[180px]">
            {['Settings', 'History', 'Saved Prompts', 'About'].map(item => (
              <button
                key={item}
                className="block w-full text-left text-white/80 text-sm py-2.5 px-3 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Categories - scrollable row */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedAgent(AGENTS[cat][0].name);
                }}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'bg-white/8 text-white/60 border border-white/10 hover:bg-white/15 hover:text-white/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Middle area - conversation / placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-y-auto">
          <div
            className="relative w-[200px] h-[200px] mb-4 flex items-center justify-center cursor-pointer"
            onClick={handleLogoTap}
          >
            {/* Glowing orb layers */}
            <div className="absolute inset-0 rounded-full bg-white/20 animate-[orb-glow_3s_ease-in-out_infinite] blur-2xl" />
            <div className="absolute inset-4 rounded-full bg-white/15 animate-[orb-glow_3s_ease-in-out_infinite_0.5s] blur-xl" />
            <div className="absolute inset-8 rounded-full bg-white/10 animate-[orb-glow_3s_ease-in-out_infinite_1s] blur-lg" />
            <img src={cachedLogo} alt="Orange Ai" className="relative z-10 w-[200px] h-[200px] object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] pointer-events-none" />
          </div>
          {isTyping ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/60 animate-[typing-dot_1.4s_ease-in-out_infinite]" />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-[typing-dot_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-[typing-dot_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
              <span className="text-white/40 text-xs">{selectedAgent} is thinking…</span>
            </div>
          ) : (
            <p className="text-white text-sm text-center leading-relaxed">
              Select a category and agent above,<br />then type your prompt below.
            </p>
          )}
        </div>

        {/* Agent selector - lower third */}
        <div className="px-4 pb-2">
          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 px-1">
            {selectedCategory} Agents
          </p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {agents.map(agent => (
              <button
                key={agent.name}
                onClick={() => setSelectedAgent(agent.name)}
                className={`flex flex-col items-center gap-1.5 min-w-[60px] transition-all ${
                  selectedAgent === agent.name ? 'scale-105' : 'opacity-60 hover:opacity-90'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {selectedAgent === agent.name && (
                    <div className="absolute inset-0 -m-2">
                      <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-[agent-orb_2s_ease-in-out_infinite] blur-xl" />
                      <div className="absolute inset-1 rounded-full bg-blue-400/20 animate-[agent-orb_2s_ease-in-out_infinite_0.3s] blur-lg" />
                      <div className="absolute inset-2 rounded-full bg-blue-300/15 animate-[agent-orb_2s_ease-in-out_infinite_0.6s] blur-md" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative z-10 ${
                    selectedAgent === agent.name
                      ? 'bg-white/15 backdrop-blur-xl border border-blue-400/30 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border border-white/8'
                  }`}>
                    {AGENT_ICONS[agent.name] ? (
                      <img src={getCachedUrl(AGENT_ICONS[agent.name])} alt={agent.name} className="w-7 h-7 object-contain brightness-0 invert drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]" draggable={false} />
                    ) : (
                      <span className="text-white font-light text-lg tracking-wide">{agent.icon}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] leading-tight text-center ${
                  selectedAgent === agent.name ? 'text-white font-medium' : 'text-white/50'
                }`}>
                  {agent.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt input pane */}
        <div className="px-3 pb-4 pt-1">
          <div className="flex items-end gap-2 bg-white/8 backdrop-blur-xl border border-white/12 rounded-2xl px-3 py-2">
            <button
              onClick={handleAttach}
              className="p-2 text-white/50 hover:text-white transition-colors flex-shrink-0 mb-0.5"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Ask ${selectedAgent}...`}
              rows={5}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 resize-none outline-none max-h-[160px] py-2 leading-snug"
              style={{ scrollbarWidth: 'none' }}
            />
            <button
              onClick={handleSend}
              className={`p-2 rounded-xl flex-shrink-0 mb-0.5 transition-all ${
                prompt.trim()
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'text-white/20'
              }`}
              disabled={!prompt.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          {/* Safe area padding */}
          <div className="h-1" />
        </div>
      </div>

      {/* Fullscreen intro video overlay */}
      <AnimatePresence>
        {showIntroVideo && (
          <motion.div
            className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
            style={{ maxWidth: 428, margin: '0 auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleCloseIntroVideo}
          >
            <video
              ref={introVideoRef}
              src="/videos/orange-ai-intro.mp4"
              className="w-full h-full object-cover"
              playsInline
              onEnded={handleCloseIntroVideo}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
