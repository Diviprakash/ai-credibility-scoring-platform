import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getCandidateEventDetailApi,
  joinCandidateEventApi,
  submitCandidateVoteApi,
  getMyVoteApi,
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';

const CandidateEventDetail = () => {
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [answers, setAnswers] = useState({}); // { [question_id]: selected_choice_id }
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successVote, setSuccessVote] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [eventData, myVoteData] = await Promise.all([
        getCandidateEventDetailApi(eventId),
        getMyVoteApi(eventId),
      ]);
      setEvent(eventData);
      setMyVote(myVoteData);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.request ? 'Unable to connect to backend server.' : 'Failed to load referendum.')
      );
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Event Joining
  const handleJoinEvent = async () => {
    setError('');
    setJoinLoading(true);
    try {
      await joinCandidateEventApi(eventId);
      // Update local event state to joined
      setEvent((prev) => ({
        ...prev,
        has_joined: true,
        current_participants: prev.current_participants + 1,
        remaining_slots: Math.max(0, prev.remaining_slots - 1),
      }));
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to join referendum. Please try again.'
      );
    } finally {
      setJoinLoading(false);
    }
  };

  // Handle Choice Selection in Questionnaire
  const handleSelectChoice = (questionId, choiceId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  // Handle Vote Submission
  const handleCastVote = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side Validation
    if (!event) return;

    const totalQuestions = event.credibility_questions.length;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQuestions) {
      setFormError(
        `Please answer all ${totalQuestions} credibility assessment questions (${answeredCount}/${totalQuestions} completed).`
      );
      return;
    }

    if (!selectedOptionId) {
      setFormError('Please select your voting option on the ballot.');
      return;
    }

    // Prepare payload
    const payload = {
      selected_option_id: selectedOptionId,
      answers: Object.entries(answers).map(([questionId, choiceId]) => ({
        question_id: questionId,
        selected_choice_id: choiceId,
      })),
    };

    setVoteLoading(true);
    try {
      const voteResult = await submitCandidateVoteApi(eventId, payload);
      setSuccessVote(voteResult);
      setMyVote({ has_voted: true, vote: voteResult });
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
          (err.request ? 'Server unavailable. Your vote could not be recorded.' : 'Failed to cast vote.')
      );
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading referendum details and voter status..." className="py-20" />;
  }

  if (error && !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-rose-300 shadow-2xl">
          <h2 className="text-xl font-bold mb-2">Referendum Unavailable</h2>
          <p className="text-sm text-rose-400 mb-6">{error || 'Event not found or is no longer open.'}</p>
          <Link
            to="/candidate"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
          >
            Back to Open Events
          </Link>
        </div>
      </div>
    );
  }

  const hasVoted = myVote?.has_voted || !!successVote;
  const recordedScore = (successVote?.credibility_score ?? myVote?.vote?.credibility_score ?? 0).toFixed(4);
  const isFull = event.remaining_slots === 0;

  // Compute Active Step
  let currentStepNumber = 1;
  if (hasVoted) currentStepNumber = 4;
  else if (event.has_joined) {
    const totalQuestions = event.credibility_questions.length;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount === totalQuestions && selectedOptionId) currentStepNumber = 3;
    else currentStepNumber = 2;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link to="/candidate" className="hover:text-emerald-300 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium truncate max-w-xs">{event.title}</span>
        </div>
        <Link
          to="/candidate"
          className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-all"
        >
          ← Back to Referendums
        </Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Main Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <StatusBadge status={event.status} />
              {event.has_joined && (
                <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  ✓ Participant Slot Reserved
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              {event.description || 'No description provided.'}
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[140px]">
            <div className="text-xs text-slate-400 font-medium">Slots Remaining</div>
            <div className={`text-2xl font-black mt-1 ${isFull ? 'text-rose-400' : 'text-emerald-400'}`}>
              {event.remaining_slots}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {event.current_participants} / {event.max_voters} filled
            </div>
          </div>
        </div>

        {/* Voting Flow Step Progress Indicator */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Voting Workflow
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'Join Event' },
              { num: 2, label: 'Assessment' },
              { num: 3, label: 'Cast Vote' },
              { num: 4, label: 'Confirmation' },
            ].map((step) => {
              const isPast = step.num < currentStepNumber;
              const isCurrent = step.num === currentStepNumber;
              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold shadow-md'
                      : isPast
                      ? 'bg-slate-950/80 border-slate-800 text-emerald-400/80'
                      : 'bg-slate-950/40 border-slate-900 text-slate-600'
                  }`}
                >
                  <span className="text-[10px] block opacity-75">STEP {step.num}</span>
                  <span className="truncate block font-semibold">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* STATE 1: ALREADY VOTED / CONFIRMATION SCREEN */}
      {hasVoted ? (
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-emerald-800/50 rounded-3xl p-8 sm:p-12 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-950/80 border border-emerald-600/50 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-900/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>VOTE RECORDED</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Your vote has been securely recorded.</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
              Your assessment responses and ballot selection have been committed permanently to the database.
            </p>
          </div>

          {/* Credibility Score Display */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 max-w-sm mx-auto shadow-inner">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Your Credibility Score
            </div>
            <div className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              {recordedScore}%
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              This score was calculated by the server from your event-specific credibility assessment.
            </p>
          </div>

          <div className="pt-4">
            <Link
              to="/candidate"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : !event.has_joined ? (
        /* STATE 2: NOT JOINED - PROMPT TO JOIN */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-950/60 border border-indigo-800/50 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">Step 1: Join Referendum</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              You must reserve a participant slot before completing the credibility assessment and casting your vote.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={isFull || joinLoading}
              onClick={handleJoinEvent}
              className={`px-8 py-3 rounded-2xl font-bold text-xs shadow-xl transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer ${
                isFull
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/50'
              }`}
            >
              {joinLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Reserving Voter Slot...</span>
                </>
              ) : isFull ? (
                <span>Event Full</span>
              ) : (
                <span>Join Event</span>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STATE 3: JOINED - ACTIVE QUESTIONNAIRE & VOTING FORM */
        <form onSubmit={handleCastVote} className="space-y-10">
          <ErrorAlert message={formError} onDismiss={() => setFormError('')} />

          {/* STEP 2: Credibility Assessment (STRICT SCORE SECRECY) */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                2
              </span>
              <h2 className="text-lg font-bold text-white">Credibility Assessment</h2>
            </div>

            <p className="text-xs text-slate-400">
              Please answer all assessment questions. Your responses are evaluated server-side to calculate your vote credibility weight.
            </p>

            <div className="space-y-6">
              {event.credibility_questions.map((q) => {
                const selectedChoiceId = answers[q.id];

                return (
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

                    <div className="space-y-2.5 pt-1">
                      {q.choices.map((choice) => {
                        const isSelected = selectedChoiceId === choice.id;

                        return (
                          <label
                            key={choice.id}
                            onClick={() => handleSelectChoice(q.id, choice.id)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-sm'
                                : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-600'
                                    : 'border-slate-600 bg-slate-900'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                              </div>
                              <span className="text-xs font-medium">{choice.choice_text}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Cast Your Vote Ballot */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30">
                3
              </span>
              <h2 className="text-lg font-bold text-white">Cast Your Vote</h2>
            </div>

            <p className="text-xs text-slate-400">
              Select exactly ONE option on the ballot.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.options.map((opt, index) => {
                const isSelected = selectedOptionId === opt.id;

                return (
                  <label
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`flex items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-all ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500'
                          : 'border-slate-600 bg-slate-950'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 font-semibold">Option {index + 1}</span>
                      <span className="text-sm font-bold text-white">{opt.option_text}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Submission Notice & Action */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-start space-x-3 text-xs text-slate-400">
              <span className="text-emerald-400 text-base">ℹ️</span>
              <p>
                <strong>Final Submission Notice:</strong> You are about to submit your vote. Your vote can only be submitted once.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
              <Link
                to="/candidate"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={voteLoading}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
              >
                {voteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Vote...</span>
                  </>
                ) : (
                  <span>CAST MY VOTE</span>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default CandidateEventDetail;
