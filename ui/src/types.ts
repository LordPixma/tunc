export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
}

export interface LockInfo {
  unlockDate: string;
}

export type ItemType = 'photo' | 'video' | 'text' | 'audio';

interface BaseItem {
  id: string;
  author: Collaborator;
  timestamp: string;
  isLocked: boolean;
  lockInfo?: LockInfo;
  type: ItemType;
}

export interface PhotoContent {
  image: string;
  caption?: string;
}

export interface VideoContent {
  videoUrl: string;
  caption?: string;
}

export interface TextContent {
  text: string;
}

export interface AudioContent {
  audioTitle: string;
  duration: string;
}

export type TimelineItem =
  | (BaseItem & { type: 'photo'; content: PhotoContent })
  | (BaseItem & { type: 'video'; content: VideoContent })
  | (BaseItem & { type: 'text'; content: TextContent })
  | (BaseItem & { type: 'audio'; content: AudioContent });

export interface Capsule {
  id: string;
  title: string;
  date?: string;
  coverImage?: string;
  collaborators: Collaborator[];
  items: TimelineItem[];
}
