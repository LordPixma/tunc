import React from 'react';
import { MusicIcon } from 'lucide-react';
import type { TimelineItem } from '../../../types';

interface AudioItemProps {
  item: Extract<TimelineItem, { type: 'audio' }>;
}

export function AudioItem({ item }: AudioItemProps) {
  return (
    <div className="p-4">
      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800/30 flex items-center justify-center mr-3">
          <MusicIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{item.content.audioTitle}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.content.duration}</p>
        </div>
        <button className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default AudioItem;
