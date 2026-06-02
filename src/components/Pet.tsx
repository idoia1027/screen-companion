import type { Character } from '../data/characters';
import SpeechBubble from './SpeechBubble';
import { useDraggable } from '../hooks/useDraggable';

type PetProps = {
  character: Character;
  scale: number;
  reminderMessage: string | null;
  isReminding: boolean;
  isSwitching: boolean;
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
  onDismissReminder,
  onOpenSettings,
  onCloseApp,
}: PetProps) => {
  const dragHandlers = useDraggable();

  return (
    <section className="pet-stage" aria-label="Screen companion">
      {reminderMessage ? <SpeechBubble message={reminderMessage} onDismiss={onDismissReminder} /> : null}
      <div
        className={`pet ${isReminding ? 'pet--reminding' : ''} ${isSwitching ? 'pet--switching' : ''}`}
        style={{ ['--pet-scale' as string]: scale * (character.defaultScale ?? 1) }}
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
      <div className="pet-actions" aria-label="Companion actions">
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
