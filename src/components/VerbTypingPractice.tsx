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
      console.log('Loaded verbs data:', data);
      console.log('Number of verbs:', data.length);
      setVerbs(data);
      if (data.length === 0) {
        console.error('⚠️ No verbs were loaded. Check the browser console for details.');
        console.error('Most likely cause: Wrong gid in VERBS_CSV_URL');
        console.error('Open src/utils/sheetsData.ts and update the gid on line 9');
      }
    } catch (err) {
      console.error('Error loading verbs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getPersonConjugation = (verb: VerbData, person: Person): string => {
    switch (person) {
      case 'ich':
        return verb.ich;
      case 'du':
        return verb.du;
      case 'er/sie/es':
        return verb['er/sie/es'];
      case 'wir':
        return verb.wir;
      case 'ihr':
        return verb.ihr;
      case 'sie/Sie':
        return verb['sie/Sie'];
      default:
        return verb.ich;
    }
  };

  const selectRandomVerbAndPerson = useCallback(() => {
    if (verbs.length === 0) return;

    setUsedIndices(prevUsed => {
      const availableIndices = verbs
        .map((_, index) => index)
        .filter(index => !prevUsed.has(index));

      let selectedIndex: number;
      if (availableIndices.length === 0) {
        // All verbs have been used, reset
        selectedIndex = Math.floor(Math.random() * verbs.length);
        setUsedIndices(new Set([selectedIndex]));
      } else {
        selectedIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        setUsedIndices(new Set([...prevUsed, selectedIndex]));
      }

      const selectedVerb = verbs[selectedIndex];
      const persons: Person[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
      const randomPerson = persons[Math.floor(Math.random() * persons.length)];

      setCurrentVerb(selectedVerb);
      setCurrentPerson(randomPerson);
      setUserInput('');
      setIsAnswered(false);
      setToast(null);
      setShowHint(false);

      // Focus input after a short delay
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return prevUsed.size === 0 ? new Set([selectedIndex]) : new Set([...prevUsed, selectedIndex]);
    });
  }, [verbs]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Select a new random verb when data is loaded
  useEffect(() => {
    if (verbs.length > 0 && currentVerb === null) {
      selectRandomVerbAndPerson();
    }
  }, [verbs, currentVerb, selectRandomVerbAndPerson]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentVerb || !currentPerson || isAnswered || !userInput.trim()) return;

    const correctAnswer = getPersonConjugation(currentVerb, currentPerson);
    const userAnswer = userInput.trim().toLowerCase();
    const correctAnswerLower = correctAnswer.toLowerCase();

    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    if (userAnswer === correctAnswerLower) {
      setScore(prev => prev + 1);
      setToast({
        type: 'correct',
        message: `Correct! "${correctAnswer}" is right.`,
      });
    } else {
      setToast({
        type: 'incorrect',
        message: `The correct answer is "${correctAnswer}".`,
      });
    }
  };

  const handleNext = () => {
    setToast(null);
    setIsAnswered(false);
    setUserInput('');
    setShowHint(false);
    selectRandomVerbAndPerson();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnswered) {
      handleSubmit();
    }
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

  if (verbs.length === 0 && !loading) {
    return (
      <div className="practice-container">
        <Link to="/" className="back-button">
          ← Back to Home
        </Link>
        <div className="error">
          <h2>No verbs data available</h2>
          <p>This usually means the Verb worksheet gid is incorrect.</p>
          <div className="error-instructions">
            <p><strong>To fix this:</strong></p>
            <ol>
              <li>Open your Google Sheet</li>
              <li>Click on the <strong>"Verb"</strong> tab at the bottom</li>
              <li>Look at the URL - it will show <code>gid=XXXXX</code></li>
              <li>Open <code>src/utils/sheetsData.ts</code> in your code</li>
              <li>Find line 6: <code>const VERBS_CSV_URL = ...gid=0</code></li>
              <li>Replace <code>gid=0</code> with <code>gid=XXXXX</code> (the number from step 3)</li>
              <li>Save and refresh the page</li>
            </ol>
            <p><strong>Check the browser console (F12) for more details about what data was received.</strong></p>
          </div>
          <button onClick={loadData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  if (!currentVerb || !currentPerson) {
    return (
      <div className="practice-container">
        <div className="loading">Preparing practice...</div>
      </div>
    );
  }

  const correctAnswer = getPersonConjugation(currentVerb, currentPerson);

  return (
    <div className="practice-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Link to="/" className="back-button">
        ← Back to Home
      </Link>

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
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className={`typing-input ${isAnswered ? (userInput.trim().toLowerCase() === correctAnswer.toLowerCase() ? 'correct' : 'incorrect') : ''}`}
                disabled={isAnswered}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
              {!isAnswered && (
                <button
                  type="submit"
                  className="submit-button"
                  disabled={!userInput.trim()}
                >
                  Check
                </button>
              )}
            </div>
          </form>

          {!isAnswered && (
            <button
              className="hint-button"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          )}

          {showHint && !isAnswered && (
            <div className="hint-box">
              <p>The infinitive is: <strong>{currentVerb.infinitive}</strong></p>
            </div>
          )}

          {isAnswered && (
            <button className="next-button" onClick={handleNext}>
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

