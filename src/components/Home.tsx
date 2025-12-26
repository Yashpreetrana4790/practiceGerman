import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🇩🇪 German Practice</h1>
        <p className="home-subtitle">Master German grammar through interactive practice</p>

        <div className="practice-cards">
          <Link to="/practice/nouns" className="practice-card">
            <div className="card-icon">📚</div>
            <h2>Noun Gender Practice</h2>
            <p>Practice identifying the gender of German nouns (Masculine, Feminine, Neutral)</p>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/practice/nouns/translation" className="practice-card">
            <div className="card-icon">🌐</div>
            <h2>Noun Translation Practice</h2>
            <p>Practice translating English nouns to German - learn what nouns are called in German</p>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/practice/verbs" className="practice-card">
            <div className="card-icon">🔤</div>
            <h2>Verb Conjugation Practice</h2>
            <p>Practice German verb conjugations by person (ich, du, er/sie/es, etc.)</p>
            <div className="card-arrow">→</div>
          </Link>

          <Link to="/practice/verbs/typing" className="practice-card">
            <div className="card-icon">⌨️</div>
            <h2>Verb Typing Practice</h2>
            <p>Type the correct German verb conjugation for different persons</p>
            <div className="card-arrow">→</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

