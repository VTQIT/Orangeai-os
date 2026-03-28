import { DrawerDirection } from '@/types';

interface EdgeHandlesProps {
  onOpenDrawer: (dir: DrawerDirection) => void;
}

const handleBase = "absolute z-[50] cursor-pointer touch-manipulation";

function handleClick(e: React.MouseEvent | React.TouchEvent, onOpenDrawer: (dir: DrawerDirection) => void, dir: DrawerDirection) {
  e.stopPropagation();
  e.preventDefault();
  onOpenDrawer(dir);
}

export default function EdgeHandles({ onOpenDrawer }: EdgeHandlesProps) {
  return (
    <>
      {/* Left edge tap zone */}
      <div
        className={`${handleBase} left-0 top-0 w-8 h-full`}
        onClick={(e) => handleClick(e, onOpenDrawer, 'right')}
        onTouchEnd={(e) => handleClick(e, onOpenDrawer, 'right')}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-foreground/10 rounded-r-full" />
      </div>
      {/* Right edge tap zone */}
      <div
        className={`${handleBase} right-0 top-0 w-8 h-full`}
        onClick={(e) => handleClick(e, onOpenDrawer, 'left')}
        onTouchEnd={(e) => handleClick(e, onOpenDrawer, 'left')}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-foreground/10 rounded-l-full" />
      </div>
      {/* Top edge tap zone */}
      <div
        className={`${handleBase} top-0 left-0 w-full h-8`}
        onClick={(e) => handleClick(e, onOpenDrawer, 'bottom')}
        onTouchEnd={(e) => handleClick(e, onOpenDrawer, 'bottom')}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-foreground/10 rounded-b-full" />
      </div>
      {/* Bottom edge tap zone - narrowed to avoid dock overlap */}
      <div
        className={`${handleBase} bottom-0 left-0 w-full h-4`}
        onClick={(e) => handleClick(e, onOpenDrawer, 'top')}
        onTouchEnd={(e) => handleClick(e, onOpenDrawer, 'top')}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-foreground/10 rounded-t-full" />
      </div>
    </>
  );
}
