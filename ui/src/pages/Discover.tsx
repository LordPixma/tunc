import React, { useState } from 'react';
import { SearchIcon, MapPinIcon, CalendarIcon, UsersIcon, GlobeIcon } from 'lucide-react';
export function Discover() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  // Mock data
  const publicEvents = [{
    id: '1',
    title: 'San Francisco Street Art Festival',
    date: '2023-08-12',
    location: 'Mission District, San Francisco',
    coverImage: 'https://images.unsplash.com/photo-1582561833070-5654bd23f8dd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 24,
    views: 1243
  }, {
    id: '2',
    title: 'Tokyo Cherry Blossom Season',
    date: '2023-04-05',
    location: 'Ueno Park, Tokyo',
    coverImage: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 56,
    views: 4562
  }, {
    id: '3',
    title: 'NYC Marathon 2023',
    date: '2023-11-05',
    location: 'New York City',
    coverImage: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 112,
    views: 8721
  }, {
    id: '4',
    title: 'Paris Fashion Week',
    date: '2023-09-25',
    location: 'Paris, France',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 87,
    views: 6345
  }, {
    id: '5',
    title: "Sydney New Year's Eve Fireworks",
    date: '2022-12-31',
    location: 'Sydney Harbour, Australia',
    coverImage: 'https://images.unsplash.com/photo-1546268060-2592ff93ee24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 134,
    views: 12567
  }, {
    id: '6',
    title: 'Rio Carnival 2023',
    date: '2023-02-17',
    location: 'Rio de Janeiro, Brazil',
    coverImage: 'https://images.unsplash.com/photo-1518131945814-df08ee8eada8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 223,
    views: 18934
  }];
  return <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discover Public Events</h1>
        <div className="flex items-center space-x-2">
          <button
            tabIndex={0}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-lg flex items-center ${viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </button>
          <button
            tabIndex={0}
            aria-label="Map view"
            aria-pressed={viewMode === 'map'}
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-lg flex items-center ${viewMode === 'map' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <MapPinIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="w-5 h-5 text-gray-500 dark:text-gray-300" aria-hidden="true" />
        </div>
        <input type="text" placeholder="Search events, locations, or themes..." className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" />
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          tabIndex={0}
          aria-label="Show events from all locations"
          aria-pressed={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full flex items-center text-sm font-medium ${activeFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          <GlobeIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          All Locations
        </button>
        <button
          tabIndex={0}
          aria-label="Show events for any date"
          aria-pressed={activeFilter === 'date'}
          onClick={() => setActiveFilter('date')}
          className={`px-4 py-2 rounded-full flex items-center text-sm font-medium ${activeFilter === 'date' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          <CalendarIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          Any Date
        </button>
        <button
          tabIndex={0}
          aria-label="Sort by most popular"
          aria-pressed={activeFilter === 'popular'}
          onClick={() => setActiveFilter('popular')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeFilter === 'popular' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Most Popular
        </button>
        <button
          tabIndex={0}
          aria-label="Sort by recent"
          aria-pressed={activeFilter === 'recent'}
          onClick={() => setActiveFilter('recent')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${activeFilter === 'recent' ? 'bg-teal-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}
        >
          Recent
        </button>
      </div>
      {viewMode === 'list' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicEvents.map(event => <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 relative">
                <img src={event.coverImage} alt={`${event.title} cover`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <h3 className="font-bold text-xl text-white mb-1">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-white/80 text-sm">
                    <MapPinIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-4">
                  <CalendarIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  <span>
                    {new Date(event.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <UsersIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                      <span className="text-sm">{event.collaborators}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300">
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span className="text-sm">
                        {event.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors">
                    Join
                  </button>
                </div>
              </div>
            </div>)}
        </div> : <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm h-[500px] relative">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="text-center">
              <MapPinIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <p className="text-gray-600 dark:text-gray-300">
                Map view would display here with event pins
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Interactive map implementation required
              </p>
            </div>
          </div>
          {/* Map event cards - would be positioned based on coordinates */}
          <div className="absolute top-6 right-6 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-32 relative">
              <img src={publicEvents[0].coverImage} alt={`${publicEvents[0].title} cover`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                <h3 className="font-bold text-white text-sm">
                  {publicEvents[0].title}
                </h3>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center text-gray-600 dark:text-gray-300 text-xs mb-2">
                <CalendarIcon className="w-3 h-3 mr-1" aria-hidden="true" />
                <span>
                  {new Date(publicEvents[0].date).toLocaleDateString()}
                </span>
              </div>
              <button className="w-full px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700 transition-colors">
                View Event
              </button>
            </div>
          </div>
        </div>}
    </div>;
}