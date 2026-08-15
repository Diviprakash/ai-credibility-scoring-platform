import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConductorEventDetailApi, updateConductorEventStatusApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';

const lifecycleSteps = ['DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'RESULT_PUBLISHED'];

const EventDetail = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    targetStatus: null,
  });

  const fetchEvent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getConductorEventDetailApi(eventId);
      setEvent(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.request ? 'Unable to connect to backend server.' : 'Failed to load event details.')
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleOpenConfirm = (targetStatus) => {
    setActionError('');
    if (targetStatus === 'PUBLISHED') {
      setConfirmModal({
        isOpen: true,
        title: 'Publish Referendum?',
        message:
          'Publishing locks the referendum structure (options and questions cannot be modified afterwards). Are you sure?',
        targetStatus: 'PUBLISHED',
      });
    } else if (targetStatus === 'OPEN') {
      setConfirmModal({
        isOpen: true,
        title: 'Open Voting?',
        message: 'This will make the event visible to candidates and allow voting to begin. Proceed?',
        targetStatus: 'OPEN',
      });
    } else if (targetStatus === 'CLOSED') {
      setConfirmModal({
        isOpen: true,
        title: 'Close Voting?',
        message: 'This will prevent any new votes from being cast. This action cannot be reversed. Close voting?',
        targetStatus: 'CLOSED',
      });
    } else if (targetStatus === 'RESULT_PUBLISHED') {
      setConfirmModal({
        isOpen: true,
        title: 'Publish Final Results?',
        message:
          'This will compute the raw community tally and credibility-weighted outcomes, atomically persist the final results record, and make results accessible to candidates. Proceed?',
        targetStatus: 'RESULT_PUBLISHED',
      });
    }
  };

  const handleExecuteStatusTransition = async () => {
    if (!confirmModal.targetStatus) return;

    setActionLoading(true);
    setActionError('');
    try {
      const updated = await updateConductorEventStatusApi(eventId, confirmModal.targetStatus);
      setEvent(updated);
      setConfirmModal({ isOpen: false, title: '', message: '', targetStatus: null });
    } catch (err) {
      setActionError(
        err.response?.data?.detail || 'Failed to update event lifecycle status. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading referendum details..." className="py-20" />;
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-rose-300 shadow-2xl">
          <h2 className="text-xl font-bold mb-2">Error Loading Event</h2>
          <p className="text-sm text-rose-400 mb-6">{error || 'Event not found or access denied.'}</p>
          <Link
            to="/conductor"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = lifecycleSteps.indexOf(event.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb & Back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link to="/conductor" className="hover:text-indigo-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium truncate max-w-xs">{event.title}</span>
        </div>
        <Link
          to="/conductor"
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-all"
        >
          ← Back to Events
        </Link>
      </div>

      <ErrorAlert message={actionError} onDismiss={() => setActionError('')} />

      {/* Main Event Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <StatusBadge status={event.status} />
              <span className="text-xs text-slate-400 font-medium">
                Voter Capacity: <strong className="text-slate-200">{event.max_voters}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>

            <p className="text-sm text-slate-400 max-w-2xl">
              {event.description || 'No description provided.'}
            </p>
          </div>

          {/* Lifecycle Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {event.status === 'DRAFT' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleOpenConfirm('PUBLISHED')}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Publish Event
              </button>
            )}

            {event.status === 'PUBLISHED' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleOpenConfirm('OPEN')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Open Voting
              </button>
            )}

            {event.status === 'OPEN' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleOpenConfirm('CLOSED')}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                Close Voting
              </button>
            )}

            {event.status === 'CLOSED' && (
              <div className="flex items-center space-x-3">
                <Link
                  to={`/events/${eventId}/results`}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  Preview Results
                </Link>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleOpenConfirm('RESULT_PUBLISHED')}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  Publish Final Results
                </button>
              </div>
            )}

            {event.status === 'RESULT_PUBLISHED' && (
              <Link
                to={`/events/${eventId}/results`}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all cursor-pointer flex items-center space-x-2"
              >
                <span>View Results Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Lifecycle Step Progress Bar */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Referendum Lifecycle Progression
          </div>
          <div className="grid grid-cols-5 gap-2">
            {lifecycleSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={step}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md'
                      : isPast
                      ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-bold tracking-tight uppercase truncate">
                    {step.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Notice */}
        <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
          <div>Created: {new Date(event.created_at).toLocaleString()}</div>
          <div>
            {event.status === 'DRAFT' && <span className="text-slate-400">✏️ Draft state</span>}
            {event.status === 'PUBLISHED' && <span className="text-amber-400">🔒 Structure locked</span>}
            {event.status === 'OPEN' && <span className="text-emerald-400 font-medium">🗳️ Voting active</span>}
            {event.status === 'CLOSED' && <span className="text-blue-400 font-medium">⏸️ Voting concluded</span>}
            {event.status === 'RESULT_PUBLISHED' && <span className="text-purple-400 font-medium">🏆 Results published</span>}
          </div>
        </div>
      </div>

      {/* Grid: Options & Credibility Questionnaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Voting Options */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Voting Options</h2>
            <span className="text-xs text-slate-500 font-semibold">{event.options.length} options</span>
          </div>

          <div className="space-y-3">
            {event.options.map((opt, index) => (
              <div
                key={opt.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-sm"
              >
                <span className="w-7 h-7 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-100">{opt.option_text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Credibility Questions & Scored Choices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight">Credibility MCQ Questionnaire</h2>
            <span className="text-xs text-slate-500 font-semibold">{event.credibility_questions.length} questions</span>
          </div>

          <div className="space-y-5">
            {event.credibility_questions.map((q) => (
              <div
                key={q.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800/60 text-indigo-400 font-bold">
                    Q{q.order_index}
                  </span>
                  <h3 className="text-sm font-bold text-white">{q.question_text}</h3>
                </div>

                {/* Choices & Assigned Scores */}
                <div className="space-y-2 pl-2 border-l-2 border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2 mb-1">
                    <span>Choice</span>
                    <span>Conductor Weight Score</span>
                  </div>

                  {q.choices.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                    >
                      <span className="text-slate-200 font-medium">{c.choice_text}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 font-bold">
                        Score: {c.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{confirmModal.message}</p>
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', targetStatus: null })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleExecuteStatusTransition}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Confirm Transition</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;
