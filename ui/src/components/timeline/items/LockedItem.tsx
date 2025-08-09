import React from 'react';
import { LockIcon } from 'lucide-react';

interface LockedItemProps {
  unlockDate?: string;
}

export function LockedItem({ unlockDate }: LockedItemProps) {
  return (
    <div className="p-8 flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
        <LockIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
      </div>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
        This content is locked in a time capsule
      </p>
      {unlockDate && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-500">
          Unlocks on {new Date(unlockDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default LockedItem;
