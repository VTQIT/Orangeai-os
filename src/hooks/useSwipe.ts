import { useCallback, useRef } from 'react';
import { DrawerDirection } from '@/types';

const EDGE_ZONE = 100;
const MIN_DISTANCE = 15;

export function useSwipe(onSwipe: (direction: DrawerDirection) => void) {
  const startRef = useRef<{ x: number; y: number; fromEdge: DrawerDirection | null } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const { clientX: x, clientY: y } = touch;
    const w = window.innerWidth;
    const h = window.innerHeight;

    let fromEdge: DrawerDirection | null = null;
    if (x <= EDGE_ZONE) fromEdge = 'left';
    else if (x >= w - EDGE_ZONE) fromEdge = 'right';
    if (y <= EDGE_ZONE) fromEdge = 'top';

    startRef.current = { x, y, fromEdge };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const { fromEdge } = startRef.current;

    if (fromEdge === 'left' && dx > MIN_DISTANCE) onSwipe('right');
    else if (fromEdge === 'right' && dx < -MIN_DISTANCE) onSwipe('left');
    else if (fromEdge === 'top' && dy > MIN_DISTANCE) onSwipe('bottom');

    startRef.current = null;
  }, [onSwipe]);

  // Mouse support for desktop testing
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const { clientX: x, clientY: y } = e;
    const w = window.innerWidth;
    const h = window.innerHeight;

    let fromEdge: DrawerDirection | null = null;
    if (x <= EDGE_ZONE) fromEdge = 'left';
    else if (x >= w - EDGE_ZONE) fromEdge = 'right';
    if (y <= EDGE_ZONE) fromEdge = 'top';

    startRef.current = { x, y, fromEdge };
  }, []);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    const { fromEdge } = startRef.current;

    if (fromEdge === 'left' && dx > MIN_DISTANCE) onSwipe('right');
    else if (fromEdge === 'right' && dx < -MIN_DISTANCE) onSwipe('left');
    else if (fromEdge === 'top' && dy > MIN_DISTANCE) onSwipe('bottom');

    startRef.current = null;
  }, [onSwipe]);

  return { onTouchStart, onTouchEnd, onMouseDown, onMouseUp };
}
