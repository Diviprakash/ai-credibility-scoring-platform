import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getCandidateEventsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import MetricCard from '../components/MetricCard';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCandidateEventsApi();
      setEvents(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.request ? 'Unable to reach backend server. Please check connection.' : 'Failed to fetch open events.')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const totalRemainingSlots = events.reduce((acc, e) => acc + (e.remaining_slots || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-900/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <span>CANDIDATE PORTAL</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Available Voting Events
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Participate in open events and make your vote count.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-medium">
              Voter: {user?.full_name}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <MetricCard
          label="Open Referendums"
          value={events.length}
          subtitle="Currently active elections open for participation"
          accentColor="emerald"
        />
        <MetricCard
          label="Available Voter Slots"
          value={totalRemainingSlots}
          subtitle="Aggregated open participant capacity across all active referendums"
          accentColor="indigo"
        />
      </div>

      <ErrorAlert message={error} onRetry={fetchEvents} onDismiss={() => setError('')} />

      {/* Events List Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Active Referendums</h2>
        <button
          onClick={fetchEvents}
          className="text-xs text-slate-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center space-x-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh List</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && <LoadingState message="Checking for open referendums..." />}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="No Open Voting Events"
          description="There are currently no OPEN referendums available for voting. Please check back when a conductor opens an election."
          actionLabel="Refresh Events"
          onAction={fetchEvents}
        />
      )}

      {/* Event Cards Grid */}
      {!loading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const isFull = event.remaining_slots === 0;
            const percentFilled = Math.min(100, Math.round((event.current_participants / event.max_voters) * 100));

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/candidate/events/${event.id}`)}
                className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-600/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Status & Capacity Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={event.status} />
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        isFull
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isFull ? 'Event Full' : `${event.remaining_slots} slots left`}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 line-clamp-1">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                    {event.description || 'No description provided.'}
                  </p>

                  {/* Capacity Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Participation</span>
                      <span>
                        {event.current_participants} / {event.max_voters}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          isFull ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentFilled}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Created: {new Date(event.created_at).toLocaleDateString()}</span>
                  <span className="group-hover:translate-x-1 transition-transform text-emerald-400 font-semibold flex items-center space-x-1">
                    <span>{isFull ? 'View Event' : 'Participate'}</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;
