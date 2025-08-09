import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TimelineHeader } from './TimelineHeader';
import { TimelineItemCard } from './TimelineItemCard';
import type { Capsule, TimelineItem } from '../../types';

export function TimelineContainer() {
  const { id } = useParams<{ id: string }>();
  const [filter, setFilter] = useState<string>('all');
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setError(null);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${baseUrl}/capsule/${id}`);
        if (!res.ok) throw new Error('Failed to load timeline');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTimelineItems(data);
        } else {
          setCapsule(data);
          setTimelineItems(data.items || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };
    fetchTimeline();
  }, [id]);

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="pb-6">
      <TimelineHeader capsule={capsule} filter={filter} setFilter={setFilter} />
      <div className="space-y-6">
        {timelineItems.map((item) => (
          <TimelineItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default TimelineContainer;
