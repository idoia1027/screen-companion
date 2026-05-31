type SpeechBubbleProps = {
  message: string;
  onDismiss: () => void;
};

const SpeechBubble = ({ message, onDismiss }: SpeechBubbleProps) => {
  return (
    <div className="speech-bubble" role="status">
      <button className="speech-bubble__close" type="button" aria-label="Dismiss reminder" onClick={onDismiss}>
        X
      </button>
      <p>{message}</p>
    </div>
  );
};

export default SpeechBubble;
