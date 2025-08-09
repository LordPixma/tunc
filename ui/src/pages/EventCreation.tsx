import React, { useState, Fragment, useRef } from 'react';
import { ArrowLeftIcon, ImageIcon, UsersIcon, LockIcon, GlobeIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
export function EventCreation() {
  const [step, setStep] = useState(1);
  const [eventType, setEventType] = useState<'private' | 'public'>('private');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const handleAddCollaborator = () => {
    if (inviteEmail.trim()) {
      setCollaborators(prev => [...prev, inviteEmail.trim()]);
      setInviteEmail('');
    }
  };

  const handleCreateEvent = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/capsule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: eventName })
      });
      if (!res.ok) throw new Error('Failed to create event');
      const { id } = await res.json();
      navigate(`/timeline/${id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="max-w-2xl mx-auto py-6">
      <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-300 mb-6">
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
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
              <input
                type="text"
                id="event-name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                placeholder="e.g., Summer Beach Trip 2023"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Event Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setEventType('private')} className={`p-4 rounded-lg border ${eventType === 'private' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-300 dark:border-gray-600'} flex flex-col items-center`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${eventType === 'private' ? 'bg-teal-100 dark:bg-teal-800/30 text-teal-600 dark:text-teal-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    <LockIcon className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Private</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    Only invited people can view and contribute
                  </span>
                </button>
                <button type="button" onClick={() => setEventType('public')} className={`p-4 rounded-lg border ${eventType === 'public' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-300 dark:border-gray-600'} flex flex-col items-center`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${eventType === 'public' ? 'bg-teal-100 dark:bg-teal-800/30 text-teal-600 dark:text-teal-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    <GlobeIcon className="w-6 h-6" />
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
              <input
                type="date"
                id="event-date"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity">
              Continue
            </button>
          </div>}
        {step === 2 && <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Cover Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => setCoverPhoto(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {coverPhoto ? `Selected file: ${coverPhoto.name}` : 'Drag and drop an image, or click to browse'}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                placeholder="Add a description for your event..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
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
              <label className="block text-sm font-medium mb-2">
                Invite Collaborators
              </label>
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="email"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddCollaborator}
                  className="px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  Add
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                {collaborators.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <UsersIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      No collaborators added yet
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {collaborators.map(email => (
                      <li key={email} className="text-gray-700 dark:text-gray-300">
                        {email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
            <div className="flex space-x-4">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-gray-600 font-medium">
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>}
      </div>
    </div>;
}