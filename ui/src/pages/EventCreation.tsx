import React, { useState, Fragment } from 'react';
import { ArrowLeftIcon, ImageIcon, UsersIcon, LockIcon, GlobeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export function EventCreation() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<'private' | 'public'>('private');
  return <div className="max-w-2xl mx-auto py-6">
      <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-300 mb-6">
        <ArrowLeftIcon className="w-5 h-5 mr-2" aria-hidden="true" />
        Back to Events
      </Link>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
        {/* Progress indicator */}
        <div className="flex items-center mb-8">
          {[1, 2, 3].map(i => <Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= step ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                {i}
              </div>
              {i < 3 && <div className={`h-1 flex-1 ${i < step ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
            </Fragment>)}
        </div>
        {step === 1 && <div className="space-y-6">
            <div>
              <label htmlFor="event-name" className="block text-sm font-medium mb-2">
                Event Name
              </label>
              <input type="text" id="event-name" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="e.g., Summer Beach Trip 2023" />
            </div>
            <div>
              <span className="block text-sm font-medium mb-2">
                Event Type
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setEventType('private')} className={`p-4 rounded-lg border ${eventType === 'private' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-300 dark:border-gray-600'} flex flex-col items-center`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${eventType === 'private' ? 'bg-teal-100 dark:bg-teal-800/30 text-teal-600 dark:text-teal-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    <LockIcon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="font-medium">Private</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    Only invited people can view and contribute
                  </span>
                </button>
                <button type="button" onClick={() => setEventType('public')} className={`p-4 rounded-lg border ${eventType === 'public' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-300 dark:border-gray-600'} flex flex-col items-center`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${eventType === 'public' ? 'bg-teal-100 dark:bg-teal-800/30 text-teal-600 dark:text-teal-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    <GlobeIcon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <span className="font-medium">Public</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    Anyone can discover and view your event
                  </span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="event-date" className="block text-sm font-medium mb-2">
                Event Date
              </label>
              <input type="date" id="event-date" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity">
              Continue
            </button>
          </div>}
        {step === 2 && <div className="space-y-6">
            <div>
              <span className="block text-sm font-medium mb-2">
                Cover Photo
              </span>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Drag and drop an image, or click to browse
                </p>
                <button type="button" className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors">
                  Browse Files
                </button>
              </div>
            </div>
            <div>
              <span className="block text-sm font-medium mb-2">
                Description (Optional)
              </span>
              <textarea className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[100px]" placeholder="Add a description for your event..." />
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium">
                Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity">
                Continue
              </button>
            </div>
          </div>}
        {step === 3 && <div className="space-y-6">
            <div>
              <span className="block text-sm font-medium mb-2">
                Invite Collaborators
              </span>
              <div className="flex items-center space-x-2 mb-4">
                <input type="email" className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter email address" />
                <button type="button" className="px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors whitespace-nowrap">
                  Add
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center">
                  <UsersIcon className="w-8 h-8 text-gray-400 mb-2" aria-hidden="true" />
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    No collaborators added yet
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium">
                Back
              </button>
              <Link to="/" className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity text-center">
                Create Event
              </Link>
            </div>
          </div>}
      </div>
    </div>;
}