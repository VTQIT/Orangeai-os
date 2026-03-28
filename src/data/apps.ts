import { App } from '@/types';

import facebookIcon from '@/assets/icons/facebook.png';
import xIcon from '@/assets/icons/x.png';
import youtubeIcon from '@/assets/icons/youtube.png';
import wikipediaIcon from '@/assets/icons/wikipedia.png';
import grokipediaIcon from '@/assets/icons/grokipedia.png';
import instagramIcon from '@/assets/icons/instagram.png';
import googleIcon from '@/assets/icons/google.png';
import bingIcon from '@/assets/icons/bing.png';
import shopweIcon from '@/assets/icons/shopwe.png';
import grabIcon from '@/assets/icons/grab.png';
import gcashIcon from '@/assets/icons/gcash.png';
import telegramIcon from '@/assets/icons/telegram.png';
import jollibeeIcon from '@/assets/icons/jollibee.png';
import deepseekIcon from '@/assets/icons/deepseek.png';
import chatgptIcon from '@/assets/icons/chatgpt.png';
import claudeIcon from '@/assets/icons/claude.png';
import grokIcon from '@/assets/icons/grok.png';
import openclawIcon from '@/assets/icons/openclaw.png';
import musifyIcon from '@/assets/icons/musify.png';
import lovableIcon from '@/assets/icons/lovable.png';
import boltIcon from '@/assets/icons/bolt.png';
import higgsfieldIcon from '@/assets/icons/higgsfield.png';
import veoIcon from '@/assets/icons/veo.png';
import geminiIcon from '@/assets/icons/gemini.png';
import soraIcon from '@/assets/icons/sora.png';
import openrouterIcon from '@/assets/icons/openrouter.png';
import claudeCodeIcon from '@/assets/icons/claudecode.png';
import cursorIcon from '@/assets/icons/cursor.png';
import perplexityIcon from '@/assets/icons/perplexity.png';
import replitIcon from '@/assets/icons/replit.png';
import emergentIcon from '@/assets/icons/emergent.png';
import klingIcon from '@/assets/icons/kling.png';
import midjourneyIcon from '@/assets/icons/midjourney.png';
import sunoIcon from '@/assets/icons/suno.png';
import seedanceIcon from '@/assets/icons/seedance.png';
import minimaxIcon from '@/assets/icons/minimax.png';
import nanoBananaIcon from '@/assets/icons/nanobanana.png';
import base44Icon from '@/assets/icons/base44.png';
import mistralIcon from '@/assets/icons/mistral.png';
import codexIcon from '@/assets/icons/codex.png';

const u = {
  facebook: 'https://www.facebook.com',
  x: 'https://x.com',
  youtube: 'https://www.youtube.com',
  instagram: 'https://www.instagram.com',
  google: 'https://www.google.com',
  wikipedia: 'https://www.wikipedia.org',
  grokipedia: 'https://x.com/i/grok',
  shopwe: 'https://shopee.ph',
  apple: 'https://www.apple.com',
  gcash: 'https://www.gcash.com',
  telegram: 'https://web.telegram.org',
  bing: 'https://www.bing.com',
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai',
  grok: 'https://grok.com',
  deepseek: 'https://chat.deepseek.com',
  openclaw: 'https://openclaw.ai',
  lovable: 'https://lovable.dev',
  bolt: 'https://bolt.new',
  higgsfield: 'https://higgsfield.ai',
  veo: 'https://deepmind.google/technologies/veo',
  gemini: 'https://gemini.google.com',
  sora: 'https://sora.com',
  openrouter: 'https://openrouter.ai',
  cursor: 'https://cursor.com',
  perplexity: 'https://www.perplexity.ai',
  replit: 'https://replit.com',
  emergent: 'https://www.emergentmind.com',
  claudecode: 'https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview',
  kling: 'https://klingai.com',
  midjourney: 'https://www.midjourney.com',
  suno: 'https://suno.com',
  seedance: 'https://www.seedance2ai.net/',
  minimax: 'https://www.minimax.io',
  nanobanana: 'https://ai.google.dev/gemma',
  base44: 'https://www.base44.com',
  mistral: 'https://mistral.ai',
  codex: 'https://chatgpt.com/codex',
};

export const homeApps: App[] = [
  { id: 1, name: 'Facebook', icon: 'Globe', image: facebookIcon, url: u.facebook, category: 'social' },
  { id: 2, name: 'X', icon: 'Globe', image: xIcon, url: u.x, category: 'social' },
  { id: 3, name: 'YouTube', icon: 'Play', image: youtubeIcon, iconScale: 1.56, url: u.youtube, category: 'media' },
  { id: 4, name: 'Instagram', icon: 'Camera', image: instagramIcon, iconScale: 1.3, url: u.instagram, category: 'social' },
  { id: 5, name: 'Google', icon: 'Search', image: googleIcon, iconScale: 1.3, url: u.google, category: 'essential' },
  { id: 6, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'essential' },
  { id: 7, name: 'Musify', icon: 'Music', image: musifyIcon, iconScale: 1.3, url: '', category: 'media' },
  { id: 8, name: 'ShopWE', icon: 'ShoppingBag', image: shopweIcon, iconScale: 1.3, url: u.shopwe, category: 'utility' },
  { id: 9, name: 'Apple', icon: 'Car', image: grabIcon, iconScale: 1.3, url: 'https://www.apple.com', category: 'utility' },
  { id: 10, name: 'GCash', icon: 'Wallet', image: gcashIcon, url: u.gcash, category: 'utility' },
  { id: 11, name: 'Jollibee', icon: 'UtensilsCrossed', image: jollibeeIcon, iconScale: 1.17, url: 'https://www.jollibee.com.ph', category: 'social' },
  { id: 12, name: 'Bing', icon: 'Search', image: bingIcon, iconScale: 1.69, url: u.bing, category: 'essential' },
];

export const dockApps: App[] = [
  { id: 101, name: 'ChatGPT', icon: 'Bot', image: chatgptIcon, iconScale: 1.3, url: u.chatgpt, category: 'essential' },
  { id: 102, name: 'Claude', icon: 'Sparkles', image: claudeIcon, iconScale: 1.3, url: u.claude, category: 'essential' },
  { id: 103, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 2.03, url: u.grok, category: 'essential' },
  { id: 104, name: 'DeepSeek', icon: 'Brain', image: deepseekIcon, iconScale: 1.3, url: u.deepseek, category: 'essential' },
];

export const leftDrawerApps: App[] = [
  { id: 201, name: 'Facebook', icon: 'Globe', image: facebookIcon, url: u.facebook, category: 'social' },
  { id: 202, name: 'X', icon: 'Globe', image: xIcon, url: u.x, category: 'social' },
  { id: 203, name: 'Instagram', icon: 'Camera', image: instagramIcon, iconScale: 1.3, url: u.instagram, category: 'social' },
  { id: 204, name: 'Telegram', icon: 'Send', image: telegramIcon, iconScale: 4.0, url: u.telegram, category: 'social' },
  { id: 205, name: 'YouTube', icon: 'Play', image: youtubeIcon, iconScale: 1.56, url: u.youtube, category: 'social' },
  { id: 206, name: 'ChatGPT', icon: 'Bot', image: chatgptIcon, url: u.chatgpt, category: 'social' },
  { id: 207, name: 'Claude', icon: 'Sparkles', image: claudeIcon, url: u.claude, category: 'social' },
  { id: 208, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'social' },
  { id: 209, name: 'DeepSeek', icon: 'Brain', image: deepseekIcon, url: u.deepseek, category: 'social' },
  { id: 210, name: 'OpenClaw', icon: 'Cog', image: openclawIcon, url: u.openclaw, category: 'social' },
  { id: 211, name: 'Grokipedia', icon: 'Brain', image: grokipediaIcon, url: u.grokipedia, category: 'social' },
  { id: 212, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'social' },
];

export const rightDrawerApps: App[] = [
  { id: 301, name: 'Google', icon: 'Search', image: googleIcon, iconScale: 1.3, url: u.google, category: 'productivity' },
  { id: 302, name: 'Bing', icon: 'Search', image: bingIcon, iconScale: 1.69, url: u.bing, category: 'productivity' },
  { id: 303, name: 'ShopWE', icon: 'ShoppingBag', image: shopweIcon, iconScale: 1.3, url: u.shopwe, category: 'productivity' },
  { id: 304, name: 'Apple', icon: 'Car', image: grabIcon, iconScale: 1.3, url: 'https://www.apple.com', category: 'productivity' },
  { id: 305, name: 'GCash', icon: 'Wallet', image: gcashIcon, url: u.gcash, category: 'productivity' },
  { id: 306, name: 'ChatGPT', icon: 'Bot', image: chatgptIcon, url: u.chatgpt, category: 'productivity' },
  { id: 307, name: 'Claude', icon: 'Sparkles', image: claudeIcon, url: u.claude, category: 'productivity' },
  { id: 308, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'productivity' },
  { id: 309, name: 'DeepSeek', icon: 'Brain', image: deepseekIcon, url: u.deepseek, category: 'productivity' },
  { id: 310, name: 'OpenClaw', icon: 'Cog', image: openclawIcon, url: u.openclaw, category: 'productivity' },
  { id: 311, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'productivity' },
  { id: 312, name: 'Grokipedia', icon: 'Brain', image: grokipediaIcon, url: u.grokipedia, category: 'productivity' },
];

export const topDrawerApps: App[] = [
  { id: 401, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'media' },
  { id: 402, name: 'ChatGPT', icon: 'Bot', image: chatgptIcon, iconScale: 1.3, url: u.chatgpt, category: 'media' },
  { id: 403, name: 'Claude', icon: 'Sparkles', image: claudeIcon, iconScale: 1.3, url: u.claude, category: 'media' },
  { id: 404, name: 'DeepSeek', icon: 'Brain', image: deepseekIcon, iconScale: 1.3, url: u.deepseek, category: 'media' },
  { id: 405, name: 'Open Claw', icon: 'Cog', image: openclawIcon, iconScale: 1.3, url: u.openclaw, category: 'media' },
  { id: 406, name: 'Lovable', icon: 'Heart', image: lovableIcon, iconScale: 1.3, url: u.lovable, category: 'media' },
  { id: 407, name: 'Bolt', icon: 'Zap', image: boltIcon, iconScale: 1.3, url: u.bolt, category: 'media' },
  { id: 408, name: 'Higgsfield', icon: 'Atom', image: higgsfieldIcon, iconScale: 1.3, url: u.higgsfield, category: 'media' },
  { id: 409, name: 'VEO', icon: 'Video', image: veoIcon, iconScale: 1.3, url: u.veo, category: 'media' },
  { id: 410, name: 'Gemini', icon: 'Sparkles', image: geminiIcon, iconScale: 1.3, url: u.gemini, category: 'media' },
  { id: 411, name: 'Sora', icon: 'Film', image: soraIcon, iconScale: 1.3, url: u.sora, category: 'media' },
  { id: 412, name: 'Open Router', icon: 'Network', image: openrouterIcon, iconScale: 1.3, url: u.openrouter, category: 'media' },
  { id: 413, name: 'Cursor', icon: 'MousePointer', image: cursorIcon, iconScale: 1.3, url: u.cursor, category: 'media' },
  { id: 414, name: 'Perplexity', icon: 'Search', image: perplexityIcon, iconScale: 1.3, url: u.perplexity, category: 'media' },
  { id: 415, name: 'Replit', icon: 'Code', image: replitIcon, iconScale: 1.3, url: u.replit, category: 'media' },
  { id: 416, name: 'Emergent', icon: 'Brain', image: emergentIcon, iconScale: 1.3, url: u.emergent, category: 'media' },
  { id: 417, name: 'Kling', icon: 'Film', image: klingIcon, iconScale: 1.3, url: u.kling, category: 'media' },
  { id: 418, name: 'Midjourney', icon: 'Paintbrush', image: midjourneyIcon, iconScale: 1.3, url: u.midjourney, category: 'media' },
  { id: 419, name: 'Suno', icon: 'Music', image: sunoIcon, iconScale: 1.3, url: u.suno, category: 'media' },
  { id: 420, name: 'Seedance', icon: 'Sparkles', image: seedanceIcon, iconScale: 1.3, url: u.seedance, category: 'media' },
  { id: 421, name: 'MiniMax', icon: 'Brain', image: minimaxIcon, iconScale: 1.3, url: u.minimax, category: 'media' },
  { id: 422, name: 'Nano Banana', icon: 'Image', image: nanoBananaIcon, iconScale: 1.3, url: u.nanobanana, category: 'media' },
  { id: 423, name: 'Claude Code', icon: 'Terminal', image: claudeCodeIcon, iconScale: 1.3, url: u.claudecode, category: 'media' },
  { id: 424, name: 'Base 44', icon: 'Layers', image: base44Icon, iconScale: 1.3, url: u.base44, category: 'media' },
  { id: 425, name: 'Mistral', icon: 'Wind', image: mistralIcon, iconScale: 1.3, url: u.mistral, category: 'media' },
  { id: 426, name: 'Codex', icon: 'Code', image: codexIcon, iconScale: 1.3, url: u.codex, category: 'media' },
];

export const bottomDrawerApps: App[] = [
  { id: 501, name: 'ChatGPT', icon: 'Bot', image: chatgptIcon, url: u.chatgpt, category: 'utility' },
  { id: 502, name: 'Claude', icon: 'Sparkles', image: claudeIcon, url: u.claude, category: 'utility' },
  { id: 503, name: 'Grok', icon: 'Zap', image: grokIcon, iconScale: 1.56, url: u.grok, category: 'utility' },
  { id: 504, name: 'DeepSeek', icon: 'Brain', image: deepseekIcon, url: u.deepseek, category: 'utility' },
  { id: 505, name: 'OpenClaw', icon: 'Cog', image: openclawIcon, url: u.openclaw, category: 'utility' },
  { id: 506, name: 'Google', icon: 'Search', image: googleIcon, iconScale: 1.3, url: u.google, category: 'utility' },
  { id: 507, name: 'Bing', icon: 'Search', image: bingIcon, iconScale: 1.69, url: u.bing, category: 'utility' },
  { id: 508, name: 'Facebook', icon: 'Globe', image: facebookIcon, url: u.facebook, category: 'utility' },
  { id: 509, name: 'X', icon: 'Globe', image: xIcon, url: u.x, category: 'utility' },
  { id: 510, name: 'Instagram', icon: 'Camera', image: instagramIcon, iconScale: 1.3, url: u.instagram, category: 'utility' },
  { id: 511, name: 'ShopWE', icon: 'ShoppingBag', image: shopweIcon, iconScale: 1.3, url: u.shopwe, category: 'utility' },
  { id: 512, name: 'Apple', icon: 'Car', image: grabIcon, iconScale: 1.3, url: 'https://www.apple.com', category: 'utility' },
];
