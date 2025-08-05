import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { EventCreation } from './pages/EventCreation';
import { Timeline } from './pages/Timeline';
import { AnticipationFeed } from './pages/AnticipationFeed';
import { Discover } from './pages/Discover';
export function App() {
  return <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<EventCreation />} />
          <Route path="/timeline/:id" element={<Timeline />} />
          <Route path="/anticipation" element={<AnticipationFeed />} />
          <Route path="/discover" element={<Discover />} />
        </Routes>
      </Layout>
    </Router>;
}