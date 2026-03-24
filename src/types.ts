export interface UserProfile {
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  createdAt?: string;
}

export interface Scene {
  prompt: string;
  duration: string;
}

export interface ViralScript {
  id?: string;
  userId: string;
  topic: string;
  hook: string;
  script: string;
  scenes: Scene[];
  audioCues: string;
  monetizationTip: string;
  selectedMusic?: MusicTrack;
  createdAt: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  genre: string;
}
