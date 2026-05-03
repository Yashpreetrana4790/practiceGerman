import { Link } from 'react-router-dom';
import { ARTICLE_COLORS } from '../types';
import './Home.css';

const ARTICLES = [
  { art: 'der', label: 'Masculine', example: 'der Mann' },
  { art: 'die', label: 'Feminine', example: 'die Frau' },
  { art: 'das', label: 'Neutral', example: 'das Kind' },
];

const MODES = [
  {
    to: '/practice/nouns',
    icon: '🏷️',
    title: 'Noun Gender',
    description: 'See a German noun — guess der, die, or das. Article colours revealed after each answer.',
    badge: 'Multiple choice',
  },
  {
    to: '/practice/nouns/translation',
    icon: '🔤',
    title: 'Noun Translation',
    description: 'Given the English word, pick the correct German translation from four options.',
    badge: 'Multiple choice',
  },
  {
    to: '/practice/verbs',
    icon: '⚡',
    title: 'Verb Conjugation',
    description: 'A conjugated form is shown — identify which person (ich / du / er …) it belongs to.',
    badge: 'Multiple choice',
  },
  {
    to: '/practice/verbs/typing',
    icon: '⌨️',
    title: 'Verb Typing',
    description: 'Type the correct conjugation for a given verb and person. Full table revealed after each answer.',
    badge: 'Type answer',
  },
];

export default function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">🇩🇪 German Practice</h1>
        <p className="home-subtitle">Master German nouns and verbs through interactive practice</p>

        <div className="article-legend">
          <span className="legend-intro">Learn article colours:</span>
          {ARTICLES.map(({ art, label, example }) => (
            <div key={art} className="legend-pill" style={{ borderColor: ARTICLE_COLORS[art].color, background: ARTICLE_COLORS[art].light }}>
              <span className="legend-art" style={{ color: ARTICLE_COLORS[art].color }}>{art}</span>
              <span className="legend-details">
                <span className="legend-label">{label}</span>
                <span className="legend-example">{example}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="practice-cards">
          {MODES.map(({ to, icon, title, description, badge }) => (
            <Link key={to} to={to} className="practice-card">
              <div className="card-icon">{icon}</div>
              <div className="card-badge">{badge}</div>
              <h2>{title}</h2>
              <p>{description}</p>
              <div className="card-arrow">→</div>
            </Link>
          ))}
        </div>

        <p className="home-tip">💡 Tip: Use keyboard shortcuts <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> and <kbd>Enter</kbd> for fastest practice.</p>
      </div>
    </div>
  );
}
