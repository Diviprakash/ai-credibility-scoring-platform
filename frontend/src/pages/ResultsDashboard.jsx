import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { getEventResultsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import ErrorAlert from '../components/ErrorAlert';

const ResultsDashboard = () => {
  const { eventId } = useParams();
  const { role } = useAuth();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getEventResultsApi(eventId);
      setResults(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          (err.request ? 'Unable to reach backend server.' : 'Failed to load election results.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const getBackPath = () => {
    return role === 'CONDUCTOR' ? `/conductor/events/${eventId}` : '/candidate';
  };

  if (loading) {
    return <LoadingState message="Fetching deterministic results from server..." className="py-20" />;
  }

  if (error || !results) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-slate-300">
          <div className="w-16 h-16 bg-amber-950/60 border border-amber-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400 text-2xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Results Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
            {error || 'Election results are unavailable or have not yet been published.'}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => fetchResults(true)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Retry Connection
            </button>
            <Link
              to={getBackPath()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Combine raw and weighted results by option_id for side-by-side comparison
  const weightedMap = new Map(results.weighted_results.map((w) => [w.option_id, w]));

  const comparisonRows = results.raw_results.map((r) => {
    const w = weightedMap.get(r.option_id) || { weighted_sum: 0, percentage: 0 };
    return {
      option_id: r.option_id,
      option_text: r.option_text,
      raw_count: r.count,
      raw_percentage: r.percentage,
      weighted_sum: w.weighted_sum,
      weighted_percentage: w.percentage,
      isRawWinner: results.raw_winner?.option_id === r.option_id,
      isFinalWinner: results.winning_option?.option_id === r.option_id,
    };
  });

  const hasDivergence =
    results.raw_winner &&
    results.winning_option &&
    results.raw_winner.option_id !== results.winning_option.option_id;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Link to={role === 'CONDUCTOR' ? '/conductor' : '/candidate'} className="hover:text-indigo-300 transition-colors">
            {role === 'CONDUCTOR' ? 'Conductor Dashboard' : 'Candidate Portal'}
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium truncate max-w-xs">{results.event_title}</span>
          <span>/</span>
          <span className="text-indigo-400 font-semibold">Results</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchResults(true)}
            disabled={refreshing}
            className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh Results'}</span>
          </button>
          <Link
            to={getBackPath()}
            className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-all"
          >
            ← Back
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onRetry={() => fetchResults(true)} onDismiss={() => setError('')} />

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="mb-2">
              <StatusBadge status={results.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {results.event_title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Calculated at: {new Date(results.calculated_at).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[120px]">
              <div className="text-xs text-slate-400 font-medium">Total Voters</div>
              <div className="text-2xl font-black text-white mt-0.5">{results.total_votes}</div>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[140px]">
              <div className="text-xs text-slate-400 font-medium">Total Weight</div>
              <div className="text-2xl font-black text-indigo-400 mt-0.5">{results.total_weight.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: FINAL DECISION SHOWCASE */}
        <div className="pt-6">
          <div className="bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-700/50 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                  FINAL DECISION
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {results.winning_option ? (
                    <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-white bg-clip-text text-transparent">
                      {results.winning_option.option_text}
                    </span>
                  ) : (
                    <span className="text-amber-400">{results.decision_status}</span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  Decision based on credibility-weighted voting.
                </p>
              </div>

              <div className="text-right flex flex-col sm:items-end justify-center">
                <span className="text-xs text-slate-400 font-medium">Outcome Basis</span>
                <span className="text-xs font-bold text-indigo-200 px-3 py-1 bg-indigo-900/60 border border-indigo-700/60 rounded-xl mt-1">
                  Credibility-Weighted Voting
                </span>
              </div>
            </div>

            {/* DIVERGENCE / CONSENSUS CALLOUT */}
            <div className="mt-6 pt-4 border-t border-indigo-800/60">
              {hasDivergence ? (
                <div className="flex items-start space-x-3 text-xs bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl text-amber-200">
                  <span className="text-base">⚡</span>
                  <div>
                    <strong className="font-bold text-amber-300 uppercase tracking-wide">
                      Winner Difference:
                    </strong>
                    <p className="mt-0.5 text-slate-300">
                      Raw community voting favored <strong className="text-white">'{results.raw_winner?.option_text}'</strong>, while credibility-weighted voting selected <strong className="text-emerald-300">'{results.winning_option?.option_text}'</strong>.
                    </p>
                  </div>
                </div>
              ) : results.winning_option ? (
                <div className="flex items-start space-x-3 text-xs bg-emerald-950/40 border border-emerald-800/60 p-4 rounded-xl text-emerald-200">
                  <span className="text-base">✓</span>
                  <div>
                    <strong className="font-bold text-emerald-300 uppercase tracking-wide">
                      Consensus:
                    </strong>
                    <p className="mt-0.5 text-slate-300">
                      Both raw community voting and credibility-weighted voting selected <strong className="text-white">'{results.winning_option.option_text}'</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Status: {results.decision_status} (No single winning option decided).
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SIDE-BY-SIDE COMPARISON TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl mb-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Raw vs Credibility-Weighted
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side comparison of raw popular vote counts against credibility weights.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase text-slate-400">
                <th className="pb-3 px-4">Option</th>
                <th className="pb-3 px-4 text-center">Raw Votes</th>
                <th className="pb-3 px-4 text-right">Raw %</th>
                <th className="pb-3 px-4 text-center">Weighted Score</th>
                <th className="pb-3 px-4 text-right">Weighted %</th>
                <th className="pb-3 px-4 text-right">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {comparisonRows.map((row) => (
                <tr key={row.option_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-4 font-bold text-white flex items-center space-x-2">
                    <span>{row.option_text}</span>
                  </td>
                  <td className="py-4 px-4 text-center text-slate-300">
                    {row.raw_count}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-indigo-300">
                    {row.raw_percentage.toFixed(4)}%
                  </td>
                  <td className="py-4 px-4 text-center text-slate-300 font-mono">
                    {row.weighted_sum.toFixed(4)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-cyan-300">
                    {row.weighted_percentage.toFixed(4)}%
                  </td>
                  <td className="py-4 px-4 text-right text-xs">
                    {row.isFinalWinner && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold">
                        🏆 Final Winner
                      </span>
                    )}
                    {row.isRawWinner && !row.isFinalWinner && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700/60 font-medium">
                        Raw Winner
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: DUAL VISUAL METERS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* RAW COMMUNITY RESULT */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Community Vote</span>
              <h3 className="text-lg font-bold text-white">RAW COMMUNITY RESULT</h3>
            </div>
            {results.raw_winner && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                Raw Winner: {results.raw_winner.option_text}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {results.raw_results.map((opt) => (
              <div key={opt.option_id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-100">{opt.option_text}</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 mr-2">{opt.count} votes</span>
                    <span className="font-mono font-bold text-indigo-300">{opt.percentage.toFixed(4)}%</span>
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, opt.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CREDIBILITY-WEIGHTED RESULT */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Credibility Weight</span>
              <h3 className="text-lg font-bold text-white">CREDIBILITY-WEIGHTED RESULT</h3>
            </div>
            {results.winning_option && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Final Winner: {results.winning_option.option_text}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {results.weighted_results.map((opt) => (
              <div key={opt.option_id} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-100">{opt.option_text}</span>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 mr-2">Weight: {opt.weighted_sum.toFixed(4)}</span>
                    <span className="font-mono font-bold text-cyan-300">{opt.percentage.toFixed(4)}%</span>
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, opt.percentage))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
