import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { VerbData, Person } from '../types';
import { fetchVerbsData } from '../utils/sheetsData';
import Toast from './Toast';
import './VerbsPractice.css';

const PERSONS: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

function getConjugation(verb: VerbData, person: Person): string {
  return verb[person];
}

export default function VerbsPractice() {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVerb, setCurrentVerb] = useState<VerbData | null>(null);
  const [currentPerson, setCurrentPerson] = useState<Person | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [toast, setToast] = useState<{ type: 'correct' | 'incorrect'; message: string } | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

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

  const selectNext = useCallback(() => {
    if (verbs.length === 0) return;

    setUsedIndices(prevUsed => {
      const available = verbs.map((_, i) => i).filter(i => !prevUsed.has(i));
      const idx = available.length === 0
        ? Math.floor(Math.random() * verbs.length)
        : available[Math.floor(Math.random() * available.length)];

      const randomPerson = PERSONS[Math.floor(Math.random() * PERSONS.length)];
      setCurrentVerb(verbs[idx]);
      setCurrentPerson(randomPerson);
      setIsAnswered(false);
      setToast(null);

      return available.length === 0 ? new Set([idx]) : new Set([...prevUsed, idx]);
    });
  }, [verbs]);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (verbs.length > 0 && currentVerb === null) selectNext();
  }, [verbs, currentVerb, selectNext]);

  const handleAnswer = (selectedPerson: Person) => {
    if (!currentVerb || !currentPerson || isAnswered) return;

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);
    const conjugation = getConjugation(currentVerb, currentPerson);

    if (selectedPerson === currentPerson) {
      setScore(prev => prev + 1);
      setToast({ type: 'correct', message: `Correct! "${conjugation}" is for "${currentPerson}".` });
    } else {
      setToast({ type: 'incorrect', message: `"${conjugation}" is for "${currentPerson}".` });
    }
  };

  const handleNext = () => {
    setToast(null);
    setIsAnswered(false);
    selectNext();
  };

  if (loading) return <div className="practice-container"><div className="loading">Loading verbs data...</div></div>;
  if (error) return <div className="practice-container"><div className="error"><p>Error: {error}</p><button onClick={loadData}>Retry</button></div></div>;
  if (verbs.length === 0) return <div className="practice-container"><div className="error">No verbs data available.</div></div>;
  if (!currentVerb || !currentPerson) return <div className="practice-container"><div className="loading">Preparing practice...</div></div>;

  const conjugation = getConjugation(currentVerb, currentPerson);

  return (
    <div className="practice-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Link to="/" className="back-button">← Back to Home</Link>
      <div className="practice-header">
        <h1>German Verb Conjugation Practice</h1>
        <div className="stats">
          <span>Score: {score}/{totalAnswered}</span>
          <span>Remaining: {verbs.length - usedIndices.size}</span>
        </div>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="word-display">
            <p className="verb-meaning">{currentVerb.meaning}</p>
            <h2>{conjugation}</h2>
            <p className="verb-infinitive">({currentVerb.infinitive})</p>
          </div>
          <div className="question"><p>Which person uses this conjugation?</p></div>
          <div className="options">
            {PERSONS.map((person) => (
              <button
                key={person}
                className={`option-button ${isAnswered ? (person === currentPerson ? 'correct' : 'incorrect') : ''}`}
                onClick={() => handleAnswer(person)}
                disabled={isAnswered}
              >
                {person}
              </button>
            ))}
          </div>
          {isAnswered && <button className="next-button" onClick={handleNext}>Next Question</button>}
        </div>
      </div>
    </div>
  );
}
