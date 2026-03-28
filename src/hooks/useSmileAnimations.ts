import { useState, useEffect, useRef, useCallback } from 'react';

export interface TrickAnimation {
  name: string;
  keyframes: Record<string, number | number[] | string | string[]>;
  transition: Record<string, any>;
  /** If true, this trick uses fixed fullscreen positioning */
  fullscreen?: boolean;
}

const TRICK_ANIMATIONS: TrickAnimation[] = [
  {
    // 1. Face Zoom — rushes toward camera covering the screen
    name: 'faceZoom',
    keyframes: {
      scale: [1, 1.2, 8, 8, 1.2, 1],
      rotateY: [0, -5, 0, 0, 5, 0],
      z: [0, 50, 400, 400, 50, 0],
      opacity: [1, 1, 1, 1, 1, 1],
    },
    transition: { duration: 3.5, ease: 'easeInOut' },
    fullscreen: true,
  },
  {
    // 2. Barrel Roll — full 360° spin on Z axis
    name: 'barrelRoll',
    keyframes: {
      rotateZ: [0, 360],
      scale: [1, 1.1, 1],
      y: [0, -30, 0],
    },
    transition: { duration: 1.5, ease: 'easeInOut' },
  },
  {
    // 3. Backflip — rotates on X axis like doing a flip
    name: 'backflip',
    keyframes: {
      rotateX: [0, -360],
      y: [0, -60, -80, -60, 0],
      scale: [1, 0.9, 0.8, 0.9, 1],
    },
    transition: { duration: 1.8, ease: 'easeInOut' },
  },
  {
    // 4. Side Flip — Y axis rotation like turning around
    name: 'sideFlip',
    keyframes: {
      rotateY: [0, 180, 360],
      scale: [1, 0.7, 1],
      x: [0, 20, 0],
    },
    transition: { duration: 1.6, ease: 'easeInOut' },
  },
  {
    // 5. Fly Across — zooms across the screen and back
    name: 'flyAcross',
    keyframes: {
      x: [0, 150, 200, 150, -150, -200, -150, 0],
      y: [0, -60, -100, -140, -100, -60, -30, 0],
      rotateZ: [0, -15, -25, -15, 15, 25, 15, 0],
      scale: [1, 1.1, 1.2, 1.1, 1.1, 1.2, 1.1, 1],
    },
    transition: { duration: 3, ease: 'easeInOut' },
  },
  {
    // 6. Spiral Dance — spins while moving in a circle
    name: 'spiralDance',
    keyframes: {
      rotateZ: [0, 120, 240, 360],
      x: [0, 40, -40, 0],
      y: [0, -50, -50, 0],
      scale: [1, 1.3, 1.3, 1],
      rotateY: [0, 45, -45, 0],
    },
    transition: { duration: 2.5, ease: 'easeInOut' },
  },
  {
    // 7. Wobble & Shake — playful jittery dance
    name: 'wobbleShake',
    keyframes: {
      rotateZ: [0, -12, 12, -8, 8, -5, 5, 0],
      rotateX: [0, 10, -10, 8, -8, 5, -5, 0],
      x: [0, -10, 10, -8, 8, -5, 5, 0],
      y: [0, -5, 5, -8, 8, -3, 3, 0],
      scale: [1, 1.05, 0.95, 1.05, 0.95, 1.02, 0.98, 1],
    },
    transition: { duration: 2, ease: 'easeInOut' },
  },
  {
    // 8. Rocket Launch — blasts upward then floats back down
    name: 'rocketLaunch',
    keyframes: {
      y: [0, 10, 20, -200, -250, -200, -50, 0],
      scale: [1, 1.1, 1.2, 0.8, 0.7, 0.8, 1.1, 1],
      rotateZ: [0, -3, -5, 0, 0, 0, 3, 0],
    },
    transition: { duration: 2.5, ease: [0.25, 0.1, 0.25, 1] },
  },
  {
    // 9. Figure Eight — traces a figure-8 pattern
    name: 'figureEight',
    keyframes: {
      x: [0, 50, 0, -50, 0, 50, 0, -50, 0],
      y: [0, -30, -60, -30, 0, 30, 60, 30, 0],
      rotateZ: [0, 10, 0, -10, 0, 10, 0, -10, 0],
      rotateY: [0, 15, 30, 15, 0, -15, -30, -15, 0],
    },
    transition: { duration: 3.5, ease: 'easeInOut' },
  },
];

export function useSmileAnimations(visible: boolean, hasGreeted: boolean) {
  const [currentTrick, setCurrentTrick] = useState<TrickAnimation | null>(null);
  const [isPerformingTrick, setIsPerformingTrick] = useState(false);
  const trickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickOrderRef = useRef<number[]>([]);

  const performRandomTrick = useCallback(() => {
    // Reshuffle when exhausted
    if (trickOrderRef.current.length === 0) {
      trickOrderRef.current = [...Array(TRICK_ANIMATIONS.length).keys()]
        .sort(() => Math.random() - 0.5);
    }
    const idx = trickOrderRef.current.pop()!;
    const trick = TRICK_ANIMATIONS[idx];

    setCurrentTrick(trick);
    setIsPerformingTrick(true);

    // End trick after its duration
    const duration = (trick.transition.duration as number) * 1000 + 500;
    setTimeout(() => {
      setIsPerformingTrick(false);
      setCurrentTrick(null);
    }, duration);
  }, []);

  useEffect(() => {
    if (!visible || !hasGreeted) return;

    const scheduleTrick = () => {
      // Random interval 12-25s between tricks
      const delay = 12000 + Math.random() * 13000;
      trickTimerRef.current = setTimeout(() => {
        performRandomTrick();
        scheduleTrick();
      }, delay);
    };

    // First trick after 8-15s
    const initialDelay = 8000 + Math.random() * 7000;
    trickTimerRef.current = setTimeout(() => {
      performRandomTrick();
      scheduleTrick();
    }, initialDelay);

    return () => {
      if (trickTimerRef.current) clearTimeout(trickTimerRef.current);
    };
  }, [visible, hasGreeted, performRandomTrick]);

  return { currentTrick, isPerformingTrick };
}
