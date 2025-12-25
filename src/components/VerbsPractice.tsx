import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { VerbData, Person } from '../types';
import { fetchVerbsData } from '../utils/sheetsData';
import './VerbsPractice.css';

export default function VerbsPractice() {
  const [verbs, setVerbs] = useState<VerbData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVerb, setCurrentVerb] = useState<VerbData | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null; message: string }>({
    type: null,
    message: '',
  });
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

  const selectRandomVerb = useCallback(() => {
    if (verbs.length === 0) return;

    setUsedIndices(prevUsed => {
      const availableIndices = verbs
        .map((_, index) => index)
        .filter(index => !prevUsed.has(index));

      if (availableIndices.length === 0) {
        // All verbs have been used, reset
        const randomIndex = Math.floor(Math.random() * verbs.length);
        setCurrentVerb(verbs[randomIndex]);
        return new Set([randomIndex]);
      } else {
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setCurrentVerb(verbs[randomIndex]);
        return new Set([...prevUsed, randomIndex]);
      }
    });
  }, [verbs]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Select a new random verb when data is loaded
  useEffect(() => {
    if (verbs.length > 0 && currentVerb === null) {
      selectRandomVerb();
    }
  }, [verbs, currentVerb, selectRandomVerb]);

  const handleAnswer = (selectedPerson: Person) => {
    if (!currentVerb || isAnswered) return;

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    if (selectedPerson === currentVerb.person) {
      setScore(prev => prev + 1);
      setFeedback({
        type: 'correct',
        message: `Correct! The conjugation "${currentVerb.conjugation}" is for "${currentVerb.person}".`,
      });
    } else {
      setFeedback({
        type: 'incorrect',
        message: `Incorrect. The conjugation "${currentVerb.conjugation}" is for "${currentVerb.person}", not "${selectedPerson}".`,
      });
    }
  };

  const handleNext = () => {
    setFeedback({ type: null, message: '' });
    setIsAnswered(false);
    selectRandomVerb();
  };

  if (loading) {
    return (
      <div className="practice-container">
        <div className="loading">Loading verbs data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practice-container">
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  if (verbs.length === 0) {
    return (
      <div className="practice-container">
        <div className="error">No verbs data available.</div>
      </div>
    );
  }

  if (!currentVerb) {
    return (
      <div className="practice-container">
        <div className="loading">Preparing practice...</div>
      </div>
    );
  }

  const personOptions: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

  return (
    <div className="practice-container">
      <Link to="/" className="back-button">
        ← Back to Home
      </Link>
      
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
            <h2>{currentVerb.verb}</h2>
            <p className="german-word">{currentVerb.germanWord}</p>
            <p className="conjugation-display">{currentVerb.conjugation}</p>
          </div>

          <div className="question">
            <p>What person is this conjugation for?</p>
          </div>

          <div className="options">
            {personOptions.map((person) => (
              <button
                key={person}
                className={`option-button ${
                  isAnswered
                    ? person === currentVerb.person
                      ? 'correct'
                      : 'incorrect'
                    : ''
                }`}
                onClick={() => handleAnswer(person)}
                disabled={isAnswered}
              >
                {person}
              </button>
            ))}
          </div>

          {feedback.type && (
            <div className={`feedback feedback-${feedback.type}`}>
              <p>{feedback.message}</p>
            </div>
          )}

          {isAnswered && (
            <button className="next-button" onClick={handleNext}>
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

