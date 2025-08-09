import React from 'react';
import type { TimelineItem } from '../../../types';

interface VideoItemProps {
  item: Extract<TimelineItem, { type: 'video' }>;
}

export function VideoItem({ item }: VideoItemProps) {
  return (
    <div>
      <div className="w-full aspect-video overflow-hidden">
        <video
          controls
          src={item.content.videoUrl}
          className="w-full h-full object-cover"
        />
      </div>
      {item.content.caption && (
        <p className="p-4 text-gray-800 dark:text-gray-200">{item.content.caption}</p>
      )}
    </div>
  );
}

export default VideoItem;
