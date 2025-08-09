import React from 'react';
import type { TimelineItem } from '../../../types';

interface ImageItemProps {
  item: Extract<TimelineItem, { type: 'photo' }>;
}

export function ImageItem({ item }: ImageItemProps) {
  return (
    <div>
      <div className="w-full aspect-video overflow-hidden">
        <img
          src={item.content.image}
          alt={item.content.caption}
          className="w-full h-full object-cover"
        />
      </div>
      {item.content.caption && (
        <p className="p-4 text-gray-800 dark:text-gray-200">{item.content.caption}</p>
      )}
    </div>
  );
}

export default ImageItem;
