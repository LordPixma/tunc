import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, LockIcon, GlobeIcon, ChevronRightIcon } from 'lucide-react';
interface Event {
  id: string;
  title: string;
  date: string;
  coverImage: string;
  collaborators: number;
  capsules: number;
  isPublic: boolean;
}
interface EventCardProps {
  event: Event;
}
export function EventCard({
  event
}: EventCardProps) {
  return <Link to={`/timeline/${event.id}`} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="h-40 overflow-hidden relative">
        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
          {event.isPublic ? <GlobeIcon className="w-4 h-4 text-white mr-1" /> : <LockIcon className="w-4 h-4 text-white mr-1" />}
          <span className="text-xs text-white">
            {event.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {new Date(event.date).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <UsersIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{event.collaborators}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <LockIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{event.capsules}</span>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </Link>;
}