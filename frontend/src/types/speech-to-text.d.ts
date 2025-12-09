declare module "speech-to-text" {
  type OnFinalised = (text: string) => void;
  type OnEndEvent = () => void;
  type OnAnythingSaid = (text: string) => void;

  class SpeechToText {
    constructor(
      onFinalised: OnFinalised,
      onEndEvent: OnEndEvent,
      onAnythingSaid?: OnAnythingSaid,
      language?: string
    );
    startListening(): void;
    stopListening(): void;
  }

  export default SpeechToText;
}
