import React from 'react';
import type { TimelineItem } from '../../../types';

interface TextItemProps {
  item: Extract<TimelineItem, { type: 'text' }>;
}

export function TextItem({ item }: TextItemProps) {
  return (
    <div className="p-4">
      <p className="text-gray-800 dark:text-gray-200">{item.content.text}</p>
    </div>
  );
}

export default TextItem;
