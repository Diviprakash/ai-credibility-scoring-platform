import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getConductorEventsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

const ConductorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getConductorEventsApi();
      setEvents(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.request ? 'Unable to connect to backend server.' : 'Failed to fetch conductor events.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const draftCount = events.filter((e) => e.status === 'DRAFT').length;
  const publishedCount = events.filter((e) => e.status === 'PUBLISHED').length;
  const openCount = events.filter((e) => e.status === 'OPEN').length;
  const closedCount = events.filter((e) => e.status === 'CLOSED').length;
  const resultPublishedCount = events.filter((e) => e.status === 'RESULT_PUBLISHED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>CONDUCTOR PORTAL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Conductor Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back, <span className="text-slate-200 font-medium">{user?.full_name}</span>. Create, manage, and publish credibility-weighted voting events.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/conductor/events/create"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Referendum</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard label="Total Events" value={events.length} subtitle="Managed by you" accentColor="indigo" />
        <MetricCard label="Drafts" value={draftCount} subtitle={`${publishedCount} published`} accentColor="blue" />
        <MetricCard label="Open for Voting" value={openCount} subtitle="Active voting" accentColor="emerald" />
        <MetricCard label="Closed" value={closedCount} subtitle="Awaiting results" accentColor="amber" />
        <MetricCard label="Results Published" value={resultPublishedCount} subtitle="Completed" accentColor="purple" />
      </div>

      <ErrorAlert message={error} onRetry={fetchEvents} onDismiss={() => setError('')} />

      {/* Events List Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Your Referendums</h2>
        <button
          onClick={fetchEvents}
          className="text-xs text-slate-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer flex items-center space-x-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Loading your referendums..." />}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="No Voting Events Yet"
          description="You have not created any referendums yet. Click below to configure options and build your first credibility questionnaire."
          actionLabel="Create Your First Event"
          actionLink="/conductor/events/create"
        />
      )}

      {/* Events Grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/conductor/events/${event.id}`)}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-600/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Status & Options Info */}
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={event.status} />
                  <span className="text-xs text-slate-500 font-medium">
                    Cap: {event.max_voters} voters
                  </span>
                </div>

                {/* Event Title */}
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors mb-2 line-clamp-1">
                  {event.title}
                </h3>

                {/* Event Description */}
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {event.description || 'No description provided.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <span>{event.options_count} Options</span>
                  <span>•</span>
                  <span>{event.questions_count} MCQs</span>
                </div>
                <span className="group-hover:translate-x-1 transition-transform text-indigo-400 font-semibold flex items-center space-x-1">
                  <span>Manage</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConductorDashboard;
