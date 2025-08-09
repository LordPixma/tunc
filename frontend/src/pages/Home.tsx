import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ChevronRightIcon } from 'lucide-react';
import { EventCard } from '../components/events/EventCard';
export function Home() {
  // Mock data for events
  const activeEvents = [{
    id: '1',
    title: 'Summer Beach Trip 2023',
    date: '2023-07-15',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 8,
    capsules: 3,
    isPublic: false
  }, {
    id: '2',
    title: 'Wedding Anniversary',
    date: '2023-09-22',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 12,
    capsules: 5,
    isPublic: true
  }, {
    id: '3',
    title: 'Hiking Trip: Redwood Forest',
    date: '2023-08-05',
    coverImage: 'https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    collaborators: 4,
    capsules: 2,
    isPublic: false
  }];
  const upcomingCapsules = [{
    id: '1',
    eventId: '1',
    title: 'Sunset photos',
    unlockDate: '2023-10-15',
    thumbnail: 'https://images.unsplash.com/photo-1566369594801-a5a64b10c5cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  }, {
    id: '2',
    eventId: '2',
    title: 'Special message',
    unlockDate: '2023-09-25',
    thumbnail: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
  }];
  return <div className="space-y-8 pb-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your Events</h2>
          <Link to="/create" className="flex items-center text-teal-600 dark:text-teal-400 font-medium">
            <PlusIcon className="w-5 h-5 mr-1" />
            New Event
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeEvents.map(event => <EventCard key={event.id} event={event} />)}
          <Link to="/create" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl h-64 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <PlusIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
              Create New Event
            </p>
          </Link>
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Upcoming Capsules</h2>
          <Link to="/anticipation" className="flex items-center text-teal-600 dark:text-teal-400 font-medium">
            View All
            <ChevronRightIcon className="w-5 h-5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingCapsules.map(capsule => <div key={capsule.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 overflow-hidden">
                <img src={capsule.thumbnail} alt={capsule.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-medium">{capsule.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unlocks on {new Date(capsule.unlockDate).toLocaleDateString()}
                </p>
              </div>
            </div>)}
        </div>
      </section>
    </div>;
}