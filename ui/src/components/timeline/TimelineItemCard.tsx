import React from 'react';
import { ImageIcon, MusicIcon, FileTextIcon, LockIcon, VideoIcon } from 'lucide-react';
import type { TimelineItem } from '../../types';
import { ImageItem } from './items/ImageItem';
import { VideoItem } from './items/VideoItem';
import { TextItem } from './items/TextItem';
import { AudioItem } from './items/AudioItem';
import { LockedItem } from './items/LockedItem';

interface TimelineItemCardProps {
  item: TimelineItem;
}

export function TimelineItemCard({ item }: TimelineItemCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
          <img src={item.author.avatar} alt={item.author.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-medium">{item.author.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(item.timestamp).toLocaleString()}
          </p>
        </div>
        {item.isLocked && item.lockInfo && (
          <div className="ml-auto flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
            <LockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Unlocks {new Date(item.lockInfo.unlockDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      {item.isLocked ? (
        <LockedItem unlockDate={item.lockInfo?.unlockDate} />
      ) : (
        <>
          {item.type === 'photo' && <ImageItem item={item} />}
          {item.type === 'video' && <VideoItem item={item} />}
          {item.type === 'text' && <TextItem item={item} />}
          {item.type === 'audio' && <AudioItem item={item} />}
        </>
      )}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {item.type === 'photo' && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <ImageIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Photo</span>
            </div>
          )}
          {item.type === 'text' && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <FileTextIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Text</span>
            </div>
          )}
          {item.type === 'audio' && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MusicIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Audio</span>
            </div>
          )}
          {item.type === 'video' && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <VideoIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">Video</span>
            </div>
          )}
        </div>
        {!item.isLocked && (
          <button className="text-teal-600 dark:text-teal-400 text-sm font-medium flex items-center">
            <LockIcon className="w-4 h-4 mr-1" />
            Seal in Capsule
          </button>
        )}
      </div>
    </div>
  );
}

export default TimelineItemCard;
