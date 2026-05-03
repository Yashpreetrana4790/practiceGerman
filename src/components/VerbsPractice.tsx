import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { VerbData, Person } from '../types';
import { fetchVerbsData } from '../utils/sheetsData';
import './VerbsPractice.css';

const PERSONS: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

export default function VerbsPractice() {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVerb, setCurrentVerb] = useState<VerbData | null>(null);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<Person | null>(null);

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
      setIsAnswered(false);
      setSelectedAnswer(null);
      return available.length === 0 ? new Set([idx]) : new Set([...prevUsed, idx]);
    });
  }, [verbs]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (verbs.length > 0 && currentVerb === null) selectNext(); }, [verbs, currentVerb, selectNext]);

  const handleAnswer = useCallback((person: Person) => {
    if (!currentVerb || !currentPerson || isAnswered) return;
    setSelectedAnswer(person);
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    if (person === currentPerson) setScore(prev => prev + 1);
  }, [currentVerb, currentPerson, isAnswered]);

  const handleNext = useCallback(() => {
    setIsAnswered(false); setSelectedAnswer(null); selectNext();
  }, [selectNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isAnswered) { if (e.key === 'Enter') handleNext(); return; }
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < PERSONS.length) handleAnswer(PERSONS[idx]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnswered, handleAnswer, handleNext]);

  if (loading) return <div className="practice-container"><div className="loading">Loading verbs…</div></div>;
  if (error) return <div className="practice-container"><div className="error"><p>{error}</p><button onClick={loadData}>Retry</button></div></div>;
  if (verbs.length === 0) return <div className="practice-container"><div className="error">No verbs data available.</div></div>;
  if (!currentVerb || !currentPerson) return <div className="practice-container"><div className="loading">Preparing…</div></div>;

  const conjugation = currentVerb[currentPerson];
  const isCorrect = selectedAnswer === currentPerson;
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
        <div className="verb-display">
          <p className="verb-meaning-small">{currentVerb.meaning}</p>
          <h2 className="verb-conjugation">{conjugation}</h2>
          <p className="verb-infinitive">({currentVerb.infinitive})</p>
          <p className="verb-question">Which person uses this form?</p>
        </div>

        <div className="person-options">
          {PERSONS.map((person, i) => {
            let cls = 'person-btn';
            if (isAnswered) {
              if (person === currentPerson) cls += ' btn-correct';
              else if (person === selectedAnswer) cls += ' btn-wrong';
              else cls += ' btn-dimmed';
            }
            return (
              <button key={person} className={cls} onClick={() => handleAnswer(person)} disabled={isAnswered}>
                <kbd>{i + 1}</kbd>
                <span>{person}</span>
                {isAnswered && person === currentPerson && <span className="btn-check">✓</span>}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className={`conjugation-table ${isCorrect ? 'table-correct' : 'table-wrong'}`}>
            <div className="table-header">
              <span className="table-verdict">{isCorrect ? '✅ Correct!' : `❌ It was "${currentPerson}"`}</span>
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
            Next Question <span className="key-hint">Enter ↵</span>
          </button>
        )}
      </div>

      <div className="keyboard-hints">
        <kbd>1</kbd>–<kbd>6</kbd> Choose person &nbsp;·&nbsp; <kbd>Enter</kbd> Next
      </div>
    </div>
  );
}
