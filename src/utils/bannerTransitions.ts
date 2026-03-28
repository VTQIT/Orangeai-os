type TransitionVariant = {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit: Record<string, number>;
};

const transitions: TransitionVariant[] = [
  // 1. Slide left to right
  { initial: { opacity: 0, x: -100 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 100 } },
  // 2. Slide right to left
  { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -100 } },
  // 3. Slide top to bottom
  { initial: { opacity: 0, y: -100 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 100 } },
  // 4. Slide bottom to top
  { initial: { opacity: 0, y: 100 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -100 } },
  // 5. Scale morph (zoom in)
  { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.5 } },
  // 6. Scale morph (zoom out)
  { initial: { opacity: 0, scale: 1.4 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.6 } },
  // 7. Rotate + fade
  { initial: { opacity: 0, rotate: -15, scale: 0.8 }, animate: { opacity: 1, rotate: 0, scale: 1 }, exit: { opacity: 0, rotate: 15, scale: 0.8 } },
  // 8. Diagonal slide (top-left)
  { initial: { opacity: 0, x: -80, y: -80 }, animate: { opacity: 1, x: 0, y: 0 }, exit: { opacity: 0, x: 80, y: 80 } },
  // 9. Flip-like horizontal
  { initial: { opacity: 0, scaleX: 0 }, animate: { opacity: 1, scaleX: 1 }, exit: { opacity: 0, scaleX: 0 } },
  // 10. Blur dissolve (fade with blur simulation via scale + opacity)
  { initial: { opacity: 0, scale: 1.08 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.08 } },
  // 11. Curtain wipe left (clip from right edge)
  { initial: { opacity: 0, x: 100, scaleX: 0.3 }, animate: { opacity: 1, x: 0, scaleX: 1 }, exit: { opacity: 0, x: -100, scaleX: 0.3 } },
  // 12. Curtain wipe right
  { initial: { opacity: 0, x: -100, scaleX: 0.3 }, animate: { opacity: 1, x: 0, scaleX: 1 }, exit: { opacity: 0, x: 100, scaleX: 0.3 } },
  // 13. Flip vertical
  { initial: { opacity: 0, scaleY: 0 }, animate: { opacity: 1, scaleY: 1 }, exit: { opacity: 0, scaleY: 0 } },
  // 14. Diagonal slide (bottom-right)
  { initial: { opacity: 0, x: 80, y: 80 }, animate: { opacity: 1, x: 0, y: 0 }, exit: { opacity: 0, x: -80, y: -80 } },
  // 15. Spin zoom
  { initial: { opacity: 0, rotate: 90, scale: 0.4 }, animate: { opacity: 1, rotate: 0, scale: 1 }, exit: { opacity: 0, rotate: -90, scale: 0.4 } },
  // 16. Soft dissolve (very slow crossfade feel)
  { initial: { opacity: 0, scale: 1.02, y: 5 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.98, y: -5 } },
  // 17. Swing in from top-right
  { initial: { opacity: 0, x: 60, y: -60, rotate: 8 }, animate: { opacity: 1, x: 0, y: 0, rotate: 0 }, exit: { opacity: 0, x: -60, y: 60, rotate: -8 } },
  // 18. Elastic pop
  { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.3 } },
];

export function getRandomTransition(): TransitionVariant {
  return transitions[Math.floor(Math.random() * transitions.length)];
}
