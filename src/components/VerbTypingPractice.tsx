import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { VerbData, Person } from '../types';
import { fetchVerbsData } from '../utils/sheetsData';
import './VerbTypingPractice.css';

const PERSONS: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

export default function VerbTypingPractice() {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVerb, setCurrentVerb] = useState<VerbData | null>(null);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [userInput, setUserInput] = useState('');
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true); setError(null);
      setVerbs(await fetchVerbsData());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally { setLoading(false); }
  };

  const selectNext = useCallback(() => {
    if (verbs.length === 0) return;
    setUsedIndices(prevUsed => {
      const available = verbs.map((_, i) => i).filter(i => !prevUsed.has(i));
      const idx = available.length === 0
        ? Math.floor(Math.random() * verbs.length)
        : available[Math.floor(Math.random() * available.length)];
      setCurrentVerb(verbs[idx]);
      setCurrentPerson(PERSONS[Math.floor(Math.random() * PERSONS.length)]);
      setUserInput('');
      setIsAnswered(false);
      setShowHint(false);
      setTimeout(() => inputRef.current?.focus(), 80);
      return available.length === 0 ? new Set([idx]) : new Set([...prevUsed, idx]);
    });
  }, [verbs]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (verbs.length > 0 && currentVerb === null) selectNext(); }, [verbs, currentVerb, selectNext]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentVerb || !currentPerson || isAnswered || !userInput.trim()) return;
    const correct = currentVerb[currentPerson];
    const isCorrect = userInput.trim().toLowerCase() === correct.toLowerCase();
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    if (isCorrect) setScore(prev => prev + 1);
  };

  const handleNext = useCallback(() => {
    setIsAnswered(false); setUserInput(''); setShowHint(false); selectNext();
  }, [selectNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isAnswered && e.key === 'Enter') { e.preventDefault(); handleNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, handleNext]);

  if (loading) return <div className="practice-container"><div className="loading">Loading verbs…</div></div>;
  if (error) return <div className="practice-container"><div className="error"><p>{error}</p><button onClick={loadData}>Retry</button></div></div>;
  if (verbs.length === 0 && !loading) return (
    <div className="practice-container">
      <Link to="/" className="back-button">← Back</Link>
      <div className="error"><h2>No verbs data</h2><p>Check browser console for details.</p><button onClick={loadData}>Retry</button></div>
    </div>
  );
  if (!currentVerb || !currentPerson) return <div className="practice-container"><div className="loading">Preparing…</div></div>;

  const correctAnswer = currentVerb[currentPerson];
  const isCorrect = isAnswered && userInput.trim().toLowerCase() === correctAnswer.toLowerCase();
  const progress = Math.round((Math.min(usedIndices.size, verbs.length) / verbs.length) * 100);

  return (
    <div className="practice-container">
      <div className="top-bar">
        <Link to="/" className="back-button">← Back</Link>
        <div className="session-score">{score} / {totalAnswered}</div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        <span className="progress-label">{Math.min(usedIndices.size, verbs.length)} / {verbs.length}</span>
      </div>

      <div className="card">
        <div className="verb-prompt">
          <p className="prompt-text">Type the conjugation of</p>
          <h2 className="prompt-meaning">{currentVerb.meaning}</h2>
          <div className="prompt-person">
            for <span className="person-tag">{currentPerson}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-row">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              placeholder="Type here…"
              className={`typing-input ${isAnswered ? (isCorrect ? 'input-correct' : 'input-wrong') : ''}`}
              disabled={isAnswered}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {!isAnswered && (
              <button type="submit" className="submit-btn" disabled={!userInput.trim()}>Check</button>
            )}
          </div>
        </form>

        {!isAnswered && (
          <button className="hint-toggle" onClick={() => setShowHint(v => !v)}>
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        )}
        {showHint && !isAnswered && (
          <div className="hint-box">Infinitive: <strong>{currentVerb.infinitive}</strong></div>
        )}

        {isAnswered && (
          <div className={`conjugation-table ${isCorrect ? 'table-correct' : 'table-wrong'}`}>
            <div className="table-header">
              <span className="table-verdict">
                {isCorrect ? '✅ Correct!' : `❌ Correct answer: "${correctAnswer}"`}
              </span>
              <span className="table-title">{currentVerb.infinitive} — full conjugation</span>
            </div>
            <div className="conj-grid">
              {PERSONS.map(p => (
                <div key={p} className={`conj-row ${p === currentPerson ? 'conj-highlight' : ''}`}>
                  <span className="conj-person">{p}</span>
                  <span className="conj-form">{currentVerb[p]}</span>
                  {p === currentPerson && <span className="conj-mark">{isCorrect ? '✓' : '←'}</span>}
                </div>
              ))}
            </div>
            {(currentVerb.past || currentVerb.pastParticiple) && (
              <div className="conj-extras">
                {currentVerb.past && <span><strong>Past:</strong> {currentVerb.past}</span>}
                {currentVerb.pastParticiple && <span><strong>Participle:</strong> {currentVerb.pastParticiple} ({currentVerb.auxiliary})</span>}
              </div>
            )}
            {currentVerb.exampleSentence && (
              <p className="conj-example">"{currentVerb.exampleSentence}"</p>
            )}
          </div>
        )}

        {isAnswered && (
          <button className="next-button" onClick={handleNext}>
            Continue <span className="key-hint">Enter ↵</span>
          </button>
        )}
      </div>
    </div>
  );
}
