import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, UsersIcon, FilterIcon, PlusIcon, LockIcon, ImageIcon, MusicIcon, FileTextIcon } from 'lucide-react';
import { apiFetch } from '../api';
export function Timeline() {
  const { id } = useParams<{ id: string }>();
  const [filter, setFilter] = useState<string>('all');
  const [event, setEvent] = useState<any | null>(null);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setError(null);
        const res = await apiFetch(`/capsule/${id}`);
        if (!res.ok) throw new Error('Failed to load timeline');
        const data = await res.json();
        setEvent(data);
        setTimelineItems(Array.isArray(data) ? data : data.items || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      }
    };
    fetchTimeline();
  }, [id]);
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }
  return <div className="pb-6">
      {/* Event Header */}
      <div className="h-48 md:h-64 -mx-4 md:-mx-6 mb-4 bg-cover bg-center relative" style={{
      backgroundImage: `url(${event?.coverImage || ''})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-4 md:p-6">
          <Link to="/" className="inline-flex items-center text-white mb-auto">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {event?.title}
          </h1>
          <div className="flex items-center text-white/80 space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>
                {event?.date && new Date(event.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              </span>
            </div>
            <div className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-2" />
              <span>{event?.collaborators?.length ?? 0} Collaborators</span>
            </div>
          </div>
        </div>
      </div>
      {/* Collaborator Avatars */}
      <div className="flex items-center mb-6">
        <div className="flex -space-x-2 mr-4">
          {event?.collaborators?.slice(0, 5).map(collaborator => <div key={collaborator.id} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden">
              <img src={collaborator.avatar} alt={collaborator.name} className="w-full h-full object-cover" />
            </div>)}
        </div>
        <button className="text-teal-600 dark:text-teal-400 font-medium text-sm">
          Manage Collaborators
        </button>
      </div>
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            Filter by:
          </span>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="all">All Content</option>
            <option value="you">Your Content</option>
            <option value="alex">Alex's Content</option>
            <option value="sarah">Sarah's Content</option>
            <option value="miguel">Miguel's Content</option>
          </select>
        </div>
        <button className="flex items-center bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Content
        </button>
      </div>
      {/* Timeline */}
      <div className="space-y-6">
        {timelineItems.map(item => <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* Item Header */}
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
              {item.isLocked && <div className="ml-auto flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1">
                  <LockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Unlocks{' '}
                    {new Date(item.lockInfo.unlockDate).toLocaleDateString()}
                  </span>
                </div>}
            </div>
            {/* Item Content */}
            {item.type === 'photo' && !item.isLocked && <div>
                <div className="w-full aspect-video overflow-hidden">
                  <img src={item.content.image} alt={item.content.caption} className="w-full h-full object-cover" />
                </div>
                {item.content.caption && <p className="p-4 text-gray-800 dark:text-gray-200">
                    {item.content.caption}
                  </p>}
              </div>}
            {item.type === 'text' && !item.isLocked && <div className="p-4">
                <p className="text-gray-800 dark:text-gray-200">
                  {item.content.text}
                </p>
              </div>}
            {item.type === 'audio' && !item.isLocked && <div className="p-4">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-800/30 flex items-center justify-center mr-3">
                    <MusicIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {item.content.audioTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.content.duration}
                    </p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>
              </div>}
            {item.isLocked && <div className="p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <LockIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
                  This content is locked in a time capsule
                </p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                  Unlocks on{' '}
                  {new Date(item.lockInfo.unlockDate).toLocaleDateString()}
                </p>
              </div>}
            {/* Item Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {item.type === 'photo' && <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <ImageIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Photo</span>
                  </div>}
                {item.type === 'text' && <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <FileTextIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Text</span>
                  </div>}
                {item.type === 'audio' && <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <MusicIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Audio</span>
                  </div>}
              </div>
              {!item.isLocked && <button className="text-teal-600 dark:text-teal-400 text-sm font-medium flex items-center">
                  <LockIcon className="w-4 h-4 mr-1" />
                  Seal in Capsule
                </button>}
            </div>
          </div>)}
      </div>
    </div>;
}