const EMOTIONS = [
  "happy",
  "sad",
  "angry",
  "surprised",
  "neutral",
] as const;
export type Emotion = (typeof EMOTIONS)[number];
