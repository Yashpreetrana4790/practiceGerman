import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import GenderPractice from './components/GenderPractice';
import VerbsPractice from './components/VerbsPractice';
import VerbTypingPractice from './components/VerbTypingPractice';
import NounTranslationPractice from './components/NounTranslationPractice';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/practice/nouns" element={<GenderPractice />} />
        <Route path="/practice/nouns/translation" element={<NounTranslationPractice />} />
        <Route path="/practice/verbs" element={<VerbsPractice />} />
        <Route path="/practice/verbs/typing" element={<VerbTypingPractice />} />
      </Routes>
    </Router>
  );
}

export default App;
