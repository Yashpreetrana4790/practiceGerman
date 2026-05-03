import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { VerbData, Person } from '../types';
import { fetchVerbsData } from '../utils/sheetsData';
import Toast from './Toast';
import './VerbTypingPractice.css';

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
  const [toast, setToast] = useState<{ type: 'correct' | 'incorrect'; message: string } | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVerbsData();
      setVerbs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getPersonConjugation = (verb: VerbData, person: Person): string => verb[person];

  const selectRandomVerbAndPerson = useCallback(() => {
    if (verbs.length === 0) return;

    setUsedIndices(prevUsed => {
      const available = verbs.map((_, i) => i).filter(i => !prevUsed.has(i));
      const idx = available.length === 0
        ? Math.floor(Math.random() * verbs.length)
        : available[Math.floor(Math.random() * available.length)];

      const persons: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
      const randomPerson = persons[Math.floor(Math.random() * persons.length)];

      setCurrentVerb(verbs[idx]);
      setCurrentPerson(randomPerson);
      setUserInput('');
      setIsAnswered(false);
      setToast(null);
      setShowHint(false);

      setTimeout(() => inputRef.current?.focus(), 100);

      return available.length === 0 ? new Set([idx]) : new Set([...prevUsed, idx]);
    });
  }, [verbs]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (verbs.length > 0 && currentVerb === null) selectRandomVerbAndPerson();
  }, [verbs, currentVerb, selectRandomVerbAndPerson]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentVerb || !currentPerson || isAnswered || !userInput.trim()) return;

    const correctAnswer = getPersonConjugation(currentVerb, currentPerson);
    const isCorrect = userInput.trim().toLowerCase() === correctAnswer.toLowerCase();

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    if (isCorrect) {
      setScore(prev => prev + 1);
      setToast({ type: 'correct', message: `Correct! "${correctAnswer}" is right.` });
    } else {
      setToast({ type: 'incorrect', message: `The correct answer is "${correctAnswer}".` });
    }
  };

  const handleNext = () => {
    setToast(null);
    setIsAnswered(false);
    setUserInput('');
    setShowHint(false);
    selectRandomVerbAndPerson();
  };

  if (loading) return <div className="practice-container"><div className="loading">Loading verbs data...</div></div>;
  if (error) return <div className="practice-container"><div className="error"><p>Error: {error}</p><button onClick={loadData}>Retry</button></div></div>;
  if (verbs.length === 0 && !loading) return (
    <div className="practice-container">
      <Link to="/" className="back-button">← Back to Home</Link>
      <div className="error"><h2>No verbs data available</h2><p>Check the browser console for details.</p><button onClick={loadData} className="retry-button">Retry</button></div>
    </div>
  );
  if (!currentVerb || !currentPerson) return <div className="practice-container"><div className="loading">Preparing practice...</div></div>;

  const correctAnswer = getPersonConjugation(currentVerb, currentPerson);

  return (
    <div className="practice-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Link to="/" className="back-button">← Back to Home</Link>
      <div className="practice-header">
        <h1>Verb Conjugation Typing</h1>
        <div className="stats">
          <span>Score: {score}/{totalAnswered}</span>
          <span>Remaining: {verbs.length - usedIndices.size}</span>
        </div>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="question-display">
            <div className="prompt">
              <p className="prompt-text">Type the word for</p>
              <h2 className="meaning">{currentVerb.meaning}</h2>
              <p className="person-prompt">for <span className="person-highlight">{currentPerson}</span></p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="input-form">
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your answer..."
                className={`typing-input ${isAnswered ? (userInput.trim().toLowerCase() === correctAnswer.toLowerCase() ? 'correct' : 'incorrect') : ''}`}
                disabled={isAnswered}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {!isAnswered && (
                <button type="submit" className="submit-button" disabled={!userInput.trim()}>Check</button>
              )}
            </div>
          </form>
          {!isAnswered && (
            <button className="hint-button" onClick={() => setShowHint(!showHint)}>
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          )}
          {showHint && !isAnswered && (
            <div className="hint-box"><p>The infinitive is: <strong>{currentVerb.infinitive}</strong></p></div>
          )}
          {isAnswered && <button className="next-button" onClick={handleNext}>Continue</button>}
        </div>
      </div>
    </div>
  );
}
