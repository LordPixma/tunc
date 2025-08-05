import React from 'react';
import { CalendarIcon, MapPinIcon, LockIcon } from 'lucide-react';
export function AnticipationFeed() {
  // Mock data
  const upcomingCapsules = [{
    id: '1',
    eventId: '1',
    eventTitle: 'Summer Beach Trip 2023',
    title: 'Sunset photos',
    unlockType: 'date',
    unlockDate: '2023-10-15',
    thumbnail: 'https://images.unsplash.com/photo-1566369594801-a5a64b10c5cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Sarah Johnson',
      avatar: 'https://i.pravatar.cc/150?img=3'
    }
  }, {
    id: '2',
    eventId: '2',
    eventTitle: 'Wedding Anniversary',
    title: 'Special message',
    unlockType: 'date',
    unlockDate: '2023-09-25',
    thumbnail: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'You',
      avatar: 'https://i.pravatar.cc/150?img=1'
    }
  }, {
    id: '3',
    eventId: '3',
    eventTitle: 'Hiking Trip: Redwood Forest',
    title: 'Trail video compilation',
    unlockType: 'location',
    location: 'Redwood National Park',
    thumbnail: 'https://images.unsplash.com/photo-1511497584788-876760111969?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Miguel Rodriguez',
      avatar: 'https://i.pravatar.cc/150?img=4'
    }
  }, {
    id: '4',
    eventId: '1',
    eventTitle: 'Summer Beach Trip 2023',
    title: 'Beach audio ambiance',
    unlockType: 'sensor',
    sensorType: 'Temperature above 80°F',
    thumbnail: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80',
    creator: {
      name: 'Alex Kim',
      avatar: 'https://i.pravatar.cc/150?img=2'
    }
  }];
  // Group capsules by unlock type
  const dateUnlock = upcomingCapsules.filter(c => c.unlockType === 'date');
  const locationUnlock = upcomingCapsules.filter(c => c.unlockType === 'location');
  const sensorUnlock = upcomingCapsules.filter(c => c.unlockType === 'sensor');
  return <div className="space-y-8 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Anticipation Feed</h1>
      </div>
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
          Time-Based Capsules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dateUnlock.map(capsule => <div key={capsule.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 relative overflow-hidden">
                <img src={capsule.thumbnail} alt={capsule.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <h3 className="font-bold text-white">{capsule.title}</h3>
                  <p className="text-sm text-white/80">
                    From {capsule.eventTitle}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <img src={capsule.creator.avatar} alt={capsule.creator.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {capsule.creator.name}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <LockIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Locked</span>
                  </div>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3 flex items-center">
                  <CalendarIcon className="w-5 h-5 text-orange-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Unlocks on</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(capsule.unlockDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                    </p>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <MapPinIcon className="w-5 h-5 mr-2 text-teal-500" />
          Location-Based Capsules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationUnlock.map(capsule => <div key={capsule.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 relative overflow-hidden">
                <img src={capsule.thumbnail} alt={capsule.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <h3 className="font-bold text-white">{capsule.title}</h3>
                  <p className="text-sm text-white/80">
                    From {capsule.eventTitle}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <img src={capsule.creator.avatar} alt={capsule.creator.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {capsule.creator.name}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <LockIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Locked</span>
                  </div>
                </div>
                <div className="bg-teal-100 dark:bg-teal-900/20 rounded-lg p-3 flex items-center">
                  <MapPinIcon className="w-5 h-5 text-teal-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium">Unlocks at</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {capsule.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-500">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <path d="M12 20h.01"></path>
          </svg>
          Sensor-Based Capsules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensorUnlock.map(capsule => <div key={capsule.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-48 relative overflow-hidden">
                <img src={capsule.thumbnail} alt={capsule.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                  <h3 className="font-bold text-white">{capsule.title}</h3>
                  <p className="text-sm text-white/80">
                    From {capsule.eventTitle}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                      <img src={capsule.creator.avatar} alt={capsule.creator.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {capsule.creator.name}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <LockIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm">Locked</span>
                  </div>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-500">
                    <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                    <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                    <path d="M12 20h.01"></path>
                  </svg>
                  <div>
                    <p className="text-sm font-medium">Unlocks when</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {capsule.sensorType}
                    </p>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </section>
    </div>;
}