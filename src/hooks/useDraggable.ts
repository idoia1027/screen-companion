import { useRef } from 'react';

type DragPoint = {
  x: number;
  y: number;
};

export const useDraggable = () => {
  const lastPointRef = useRef<DragPoint | null>(null);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    lastPointRef.current = { x: event.screenX, y: event.screenY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      return;
    }

    const nextPoint = { x: event.screenX, y: event.screenY };
    window.companionApi.moveWindowBy({
      x: nextPoint.x - lastPoint.x,
      y: nextPoint.y - lastPoint.y,
    });
    lastPointRef.current = nextPoint;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    lastPointRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };
};
