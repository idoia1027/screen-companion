import type { Character } from '../data/characters';
import SpeechBubble from './SpeechBubble';
import { useDraggable } from '../hooks/useDraggable';

type PetProps = {
  character: Character;
  scale: number;
  reminderMessage: string | null;
  isReminding: boolean;
  isSwitching: boolean;
  onInteractiveEnter: () => void;
  onInteractiveLeave: () => void;
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
  onDismissReminder,
  onOpenSettings,
  onCloseApp,
}: PetProps) => {
  const dragHandlers = useDraggable();

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
