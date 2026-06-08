import type { Character } from '../data/characters';
import SpeechBubble from './SpeechBubble';
import { useDraggable } from '../hooks/useDraggable';

const HEART_COUNT = 14;

// Pre-compute a radial spray of hearts: each fans out at an even angle around the
// character's center, with slight per-heart variation in distance/size/delay so the
// burst feels organic rather than mechanical. A global upward bias (-28px) makes the
// hearts drift up as they scatter, which reads as more heart-like than a flat ring.
const HEARTS = Array.from({ length: HEART_COUNT }, (_, index) => {
  const angle = (index / HEART_COUNT) * Math.PI * 2 - Math.PI / 2;
  const distance = 96 + (index % 3) * 22;
  return {
    dx: `${Math.cos(angle) * distance}px`,
    dy: `${Math.sin(angle) * distance - 28}px`,
    delay: `${(index % 5) * 55}ms`,
    scale: 0.9 + (index % 3) * 0.3,
  };
});

type PetProps = {
  character: Character;
  scale: number;
  reminderMessage: string | null;
  isReminding: boolean;
  isSwitching: boolean;
  onInteractiveEnter: () => void;
  onInteractiveLeave: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDismissReminder: () => void;
  onOpenSettings: () => void;
  onCloseApp: () => void;
};

const Pet = ({
  character,
  scale,
  reminderMessage,
  isReminding,
  isSwitching,
  onInteractiveEnter,
  onInteractiveLeave,
  onDragStart,
  onDragEnd,
  onDismissReminder,
  onOpenSettings,
  onCloseApp,
}: PetProps) => {
  const dragHandlers = useDraggable(onDragStart, onDragEnd);

  return (
    <section className="pet-stage" aria-label="Screen companion">
      {reminderMessage ? (
        <div onMouseEnter={onInteractiveEnter} onMouseLeave={onInteractiveLeave}>
          <SpeechBubble message={reminderMessage} onDismiss={onDismissReminder} />
        </div>
      ) : null}
      <div
        className={`pet ${isReminding ? 'pet--reminding' : ''} ${isSwitching ? 'pet--switching' : ''}`}
        style={{ ['--pet-scale' as string]: scale * (character.defaultScale ?? 1) }}
        onMouseEnter={onInteractiveEnter}
        onMouseLeave={onInteractiveLeave}
        onContextMenu={(event) => {
          event.preventDefault();
          onOpenSettings();
        }}
      >
        <img
          className="pet__image"
          src={character.image}
          alt={character.name}
          draggable={false}
          onPointerDown={dragHandlers.onPointerDown}
          onPointerMove={dragHandlers.onPointerMove}
          onPointerUp={dragHandlers.onPointerUp}
          onPointerCancel={dragHandlers.onPointerCancel}
        />
        {isReminding ? (
          <div className="heart-burst" aria-hidden="true">
            {HEARTS.map((heart, index) => (
              <span
                key={index}
                className="heart-burst__heart"
                style={{
                  ['--dx' as string]: heart.dx,
                  ['--dy' as string]: heart.dy,
                  ['--delay' as string]: heart.delay,
                  ['--heart-scale' as string]: heart.scale,
                }}
              >
                {/* U+2764 + U+FE0E forces text presentation so the CSS color
                    applies on every platform (Windows would otherwise render a
                    fixed-color emoji heart via Segoe UI Emoji). */}
                {'❤︎'}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className="pet-actions"
        aria-label="Companion actions"
        onMouseEnter={onInteractiveEnter}
        onMouseLeave={onInteractiveLeave}
      >
        <button type="button" aria-label="Open settings" title="Settings" onClick={onOpenSettings}>
          SET
        </button>
        <button type="button" aria-label="Close app" title="Close app" onClick={onCloseApp}>
          X
        </button>
      </div>
    </section>
  );
};

export default Pet;
