import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, UsersIcon, FilterIcon, PlusIcon } from 'lucide-react';
import type { Capsule } from '../../types';

interface TimelineHeaderProps {
  capsule: Capsule | null;
  filter: string;
  setFilter: (value: string) => void;
}

export function TimelineHeader({ capsule, filter, setFilter }: TimelineHeaderProps) {
  return (
    <>
      <div
        className="h-48 md:h-64 -mx-4 md:-mx-6 mb-4 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${capsule?.coverImage || ''})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 flex flex-col justify-end p-4 md:p-6">
          <Link to="/" className="inline-flex items-center text-white mb-auto">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Events
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{capsule?.title}</h1>
          <div className="flex items-center text-white/80 space-x-4">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span>
                {capsule?.date &&
                  new Date(capsule.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </span>
            </div>
            <div className="flex items-center">
              <UsersIcon className="w-4 h-4 mr-2" />
              <span>{capsule?.collaborators?.length ?? 0} Collaborators</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center mb-6">
        <div className="flex -space-x-2 mr-4">
          {capsule?.collaborators?.slice(0, 5).map((collaborator) => (
            <div
              key={collaborator.id}
              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden"
            >
              <img
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <button className="text-teal-600 dark:text-teal-400 font-medium text-sm">
          Manage Collaborators
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FilterIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400 text-sm">Filter by:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
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
    </>
  );
}

export default TimelineHeader;
