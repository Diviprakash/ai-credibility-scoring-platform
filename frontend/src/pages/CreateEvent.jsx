import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createConductorEventApi } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';

const CreateEvent = () => {
  const navigate = useNavigate();

  // Basic Information
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxVoters, setMaxVoters] = useState(50);

  // Voting Options (minimum 2)
  const [options, setOptions] = useState([
    { option_text: 'YES' },
    { option_text: 'NO' },
    { option_text: 'NEUTRAL' },
  ]);

  // Credibility MCQ Questions (minimum 1, with minimum 2 choices per question)
  const [questions, setQuestions] = useState([
    {
      question_text: 'What is your level of domain expertise in this referendum subject?',
      order_index: 1,
      choices: [
        { choice_text: 'Expert / Professional Practitioner', score: 10.0 },
        { choice_text: 'Moderate Familiarity', score: 6.0 },
        { choice_text: 'General Observer / Novice', score: 2.0 },
      ],
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Option handlers
  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index].option_text = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    setOptions([...options, { option_text: '' }]);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) {
      setFormError('An event must have at least 2 voting options.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
  };

  // Question handlers
  const handleAddQuestion = () => {
    const nextOrder = questions.length + 1;
    setQuestions([
      ...questions,
      {
        question_text: '',
        order_index: nextOrder,
        choices: [
          { choice_text: '', score: 10.0 },
          { choice_text: '', score: 0.0 },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) {
      setFormError('An event must have at least 1 credibility question.');
      return;
    }
    const updated = questions
      .filter((_, i) => i !== qIndex)
      .map((q, idx) => ({ ...q, order_index: idx + 1 }));
    setQuestions(updated);
  };

  const handleQuestionTextChange = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].question_text = value;
    setQuestions(updated);
  };

  // Choice handlers
  const handleAddChoice = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].choices.push({ choice_text: '', score: 5.0 });
    setQuestions(updated);
  };

  const handleRemoveChoice = (qIndex, cIndex) => {
    const updated = [...questions];
    if (updated[qIndex].choices.length <= 2) {
      setFormError('Each question must have at least 2 choices.');
      return;
    }
    updated[qIndex].choices = updated[qIndex].choices.filter((_, i) => i !== cIndex);
    setQuestions(updated);
  };

  const handleChoiceChange = (qIndex, cIndex, field, value) => {
    const updated = [...questions];
    if (field === 'score') {
      const numVal = parseFloat(value);
      updated[qIndex].choices[cIndex].score = isNaN(numVal) ? 0 : numVal;
    } else {
      updated[qIndex].choices[cIndex].choice_text = value;
    }
    setQuestions(updated);
  };

  // Form submission & validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // 1. Basic Info Validation
    if (!title.trim()) {
      setFormError('Event title is required.');
      return;
    }

    const maxV = parseInt(maxVoters, 10);
    if (isNaN(maxV) || maxV <= 0) {
      setFormError('Maximum voters must be a positive integer greater than 0.');
      return;
    }

    // 2. Options Validation
    if (options.length < 2) {
      setFormError('Please provide at least 2 voting options.');
      return;
    }

    const trimmedOptions = options.map((o) => o.option_text.trim());
    if (trimmedOptions.some((o) => o === '')) {
      setFormError('All voting options must have non-empty text.');
      return;
    }

    const uniqueOptions = new Set(trimmedOptions);
    if (uniqueOptions.size !== trimmedOptions.length) {
      setFormError('All voting options must be distinct (no duplicate options).');
      return;
    }

    // 3. Questions & Choices Validation
    if (questions.length < 1) {
      setFormError('Please configure at least 1 credibility question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setFormError(`Question #${i + 1} text cannot be empty.`);
        return;
      }

      if (q.choices.length < 2) {
        setFormError(`Question #${i + 1} must have at least 2 choices.`);
        return;
      }

      const trimmedChoices = q.choices.map((c) => c.choice_text.trim());
      if (trimmedChoices.some((c) => c === '')) {
        setFormError(`All choices in Question #${i + 1} must have non-empty text.`);
        return;
      }

      const uniqueChoices = new Set(trimmedChoices);
      if (uniqueChoices.size !== trimmedChoices.length) {
        setFormError(`All choices in Question #${i + 1} must be distinct.`);
        return;
      }

      if (q.choices.some((c) => typeof c.score !== 'number' || c.score < 0)) {
        setFormError(`All choice scores in Question #${i + 1} must be non-negative numbers.`);
        return;
      }
    }

    // Prepare complete atomic payload
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      max_voters: maxV,
      options: trimmedOptions.map((text) => ({ option_text: text })),
      questions: questions.map((q, idx) => ({
        question_text: q.question_text.trim(),
        order_index: idx + 1,
        choices: q.choices.map((c) => ({
          choice_text: c.choice_text.trim(),
          score: c.score,
        })),
      })),
    };

    setSubmitting(true);
    try {
      const created = await createConductorEventApi(payload);
      navigate(`/conductor/events/${created.id}`);
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
          (err.request ? 'Backend connection failed. Please ensure the server is running.' : 'Failed to create event.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-400 mb-6">
        <Link to="/conductor" className="hover:text-indigo-300 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-200 font-medium">Create Referendum</span>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 border-b border-slate-800 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Referendum Event
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure ballot options and dynamic credibility questions with server-side scoring weights.
          </p>
        </div>

        <ErrorAlert message={formError} onDismiss={() => setFormError('')} />

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* SECTION 1: Event Information */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/80">
              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                1
              </span>
              <h2 className="text-lg font-bold text-white">Event Information</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="title">
                Event Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Campus Energy Strategy Referendum 2026"
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="description">
                Description / Context <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide background context and ballot rationale for voters..."
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5" htmlFor="maxVoters">
                Maximum Voters Capacity <span className="text-rose-400">*</span>
              </label>
              <input
                id="maxVoters"
                type="number"
                min="1"
                required
                value={maxVoters}
                onChange={(e) => setMaxVoters(e.target.value)}
                className="w-full sm:w-48 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Maximum participant slots enforced via database row locking.</p>
            </div>
          </div>

          {/* SECTION 2: Voting Options */}
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  2
                </span>
                <h2 className="text-lg font-bold text-white">Voting Options</h2>
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>+ Add Option</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Define the available voting ballot options. At least 2 distinct voting options are required.
            </p>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-slate-500 w-8">#{index + 1}</span>
                  <input
                    type="text"
                    required
                    value={option.option_text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove option"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Credibility Assessment */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                  3
                </span>
                <h2 className="text-lg font-bold text-white">Credibility Assessment</h2>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-xl transition-all cursor-pointer flex items-center space-x-1"
              >
                <span>+ Add Question</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 text-xs text-indigo-300">
              <strong>Score Secrecy Notice:</strong> Numerical score weights configured here are visible ONLY to conductors. They are strictly omitted from candidate responses.
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Question {qIndex + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                      >
                        Remove Question
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={q.question_text}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      placeholder="e.g., How many years of direct experience do you have with this topic?"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
                    />
                  </div>

                  {/* Question Choices */}
                  <div className="space-y-2.5 pl-3 border-l-2 border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                      <span>Choices (min 2)</span>
                      <span className="text-right w-28">Conductor Weight</span>
                    </div>

                    {q.choices.map((choice, cIndex) => (
                      <div key={cIndex} className="flex items-center space-x-3">
                        <input
                          type="text"
                          required
                          value={choice.choice_text}
                          onChange={(e) => handleChoiceChange(qIndex, cIndex, 'choice_text', e.target.value)}
                          placeholder={`Choice ${cIndex + 1}`}
                          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          required
                          value={choice.score}
                          onChange={(e) => handleChoiceChange(qIndex, cIndex, 'score', e.target.value)}
                          className="w-28 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-semibold text-right"
                        />
                        {q.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChoice(qIndex, cIndex)}
                            className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove choice"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleAddChoice(qIndex)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        + Add Choice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Review Summary */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Referendum Configuration Summary
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Voting Options</div>
                <div className="text-lg font-bold text-white mt-0.5">{options.length}</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">MCQ Questions</div>
                <div className="text-lg font-bold text-indigo-300 mt-0.5">{questions.length}</div>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">Voter Capacity</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{maxVoters || 0}</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-800">
            <Link
              to="/conductor"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Creating Referendum...</span>
                </>
              ) : (
                <span>Create Draft Event</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
