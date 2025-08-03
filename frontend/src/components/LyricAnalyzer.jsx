import React, { useState, useEffect } from 'react';
import './LyricAnalyzer.css';

const LyricAnalyzer = ({ lyrics, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeLyrics = async (lyricsText) => {
    if (!lyricsText?.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Perform local analysis first for immediate feedback
      const localAnalysis = performLocalAnalysis(lyricsText);
      setAnalysis(localAnalysis);
      
      // Then enhance with AI analysis
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analyze-lyrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': localStorage.getItem('apiKey') || ''
        },
        body: JSON.stringify({ lyrics: lyricsText })
      });
      
      if (response.ok) {
        const aiAnalysis = await response.json();
        const enhancedAnalysis = { ...localAnalysis, ...aiAnalysis };
        setAnalysis(enhancedAnalysis);
        onAnalysisComplete?.(enhancedAnalysis);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze lyrics. Using local analysis only.');
    } finally {
      setLoading(false);
    }
  };

  const performLocalAnalysis = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    // Rhyme scheme detection
    const rhymeScheme = detectRhymeScheme(lines);
    
    // Sentiment analysis (basic)
    const sentiment = analyzeSentiment(text);
    
    // Theme detection
    const themes = detectThemes(text);
    
    // Quality scoring
    const qualityScore = calculateQualityScore(text, rhymeScheme, uniqueWords);
    
    return {
      statistics: {
        lineCount: lines.length,
        wordCount: words.length,
        uniqueWordCount: uniqueWords.length,
        averageWordsPerLine: Math.round(words.length / lines.length * 10) / 10,
        vocabularyRichness: Math.round(uniqueWords.length / words.length * 100)
      },
      rhymeScheme,
      sentiment,
      themes,
      qualityScore,
      readabilityLevel: calculateReadability(text)
    };
  };

  const detectRhymeScheme = (lines) => {
    const scheme = [];
    const rhymeMap = new Map();
    let currentLetter = 'A';
    
    lines.forEach(line => {
      const lastWord = line.trim().split(' ').pop()?.toLowerCase().replace(/[^a-z]/g, '');
      if (!lastWord) {
        scheme.push('-');
        return;
      }
      
      const rhymeKey = getPhoneticEnding(lastWord);
      
      if (rhymeMap.has(rhymeKey)) {
        scheme.push(rhymeMap.get(rhymeKey));
      } else {
        rhymeMap.set(rhymeKey, currentLetter);
        scheme.push(currentLetter);
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      }
    });
    
    return scheme;
  };

  const getPhoneticEnding = (word) => {
    // Simple phonetic ending detection (last 2-3 characters)
    if (word.length < 2) return word;
    return word.slice(-2);
  };

  const analyzeSentiment = (text) => {
    const positiveWords = ['love', 'happy', 'joy', 'success', 'win', 'great', 'amazing', 'good', 'best', 'awesome'];
    const negativeWords = ['hate', 'sad', 'pain', 'loss', 'fail', 'bad', 'worst', 'terrible', 'angry', 'hurt'];
    
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return { score: 0, label: 'Neutral' };
    
    const score = (positiveCount - negativeCount) / total;
    let label = 'Neutral';
    if (score > 0.2) label = 'Positive';
    else if (score < -0.2) label = 'Negative';
    
    return { score: Math.round(score * 100) / 100, label, positiveCount, negativeCount };
  };

  const detectThemes = (text) => {
    const themeKeywords = {
      'Love & Relationships': ['love', 'heart', 'girl', 'boy', 'relationship', 'together', 'forever'],
      'Success & Money': ['money', 'cash', 'rich', 'success', 'win', 'grind', 'hustle', 'boss'],
      'Street Life': ['street', 'block', 'hood', 'gang', 'trap', 'hustle', 'real'],
      'Party & Fun': ['party', 'club', 'dance', 'fun', 'night', 'drink', 'celebrate'],
      'Struggle & Pain': ['struggle', 'pain', 'hard', 'difficult', 'fight', 'battle', 'overcome'],
      'Technology': ['code', 'tech', 'digital', 'ai', 'computer', 'internet', 'app']
    };
    
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const themes = {};
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const matches = words.filter(word => keywords.includes(word)).length;
      if (matches > 0) {
        themes[theme] = matches;
      }
    });
    
    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme, count]) => ({ theme, count }));
  };

  const calculateQualityScore = (text, rhymeScheme, uniqueWords) => {
    let score = 50; // Base score
    
    // Rhyme consistency bonus
    const rhymeConsistency = rhymeScheme.filter(r => r !== '-').length / rhymeScheme.length;
    score += rhymeConsistency * 20;
    
    // Vocabulary richness bonus
    const words = text.match(/\b\w+\b/g) || [];
    const vocabularyRichness = uniqueWords.length / words.length;
    score += vocabularyRichness * 15;
    
    // Length appropriateness
    const lineCount = text.split('\n').filter(l => l.trim()).length;
    if (lineCount >= 8 && lineCount <= 32) score += 10;
    
    // Repetition penalty
    const repetitionPenalty = calculateRepetition(text);
    score -= repetitionPenalty * 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const calculateRepetition = (text) => {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = {};
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const totalWords = words.length;
    const repeatedWords = Object.values(wordCounts).filter(count => count > 2).length;
    
    return repeatedWords / totalWords;
  };

  const calculateReadability = (text) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = text.match(/\b\w+\b/g) || [];
    const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
    
    if (sentences === 0 || words.length === 0) return 'Unknown';
    
    // Simplified Flesch Reading Ease
    const avgWordsPerSentence = words.length / sentences;
    const avgSyllablesPerWord = syllables / words.length;
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  };

  const countSyllables = (word) => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  useEffect(() => {
    if (lyrics) {
      analyzeLyrics(lyrics);
    }
  }, [lyrics]);

  if (!lyrics) {
    return (
      <div className="lyric-analyzer">
        <div className="analyzer-placeholder">
          <h3>🎤 Lyric Analyzer</h3>
          <p>Generate or paste lyrics to see detailed analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lyric-analyzer">
      <div className="analyzer-header">
        <h3>🎤 Lyric Analysis</h3>
        {loading && <div className="loading-spinner">Analyzing...</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      {analysis && (
        <div className="analysis-results">
          {/* Statistics */}
          <div className="analysis-section">
            <h4>📊 Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Lines</span>
                <span className="stat-value">{analysis.statistics.lineCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Words</span>
                <span className="stat-value">{analysis.statistics.wordCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Unique Words</span>
                <span className="stat-value">{analysis.statistics.uniqueWordCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Vocabulary Richness</span>
                <span className="stat-value">{analysis.statistics.vocabularyRichness}%</span>
              </div>
            </div>
          </div>

          {/* Quality Score */}
          <div className="analysis-section">
            <h4>⭐ Quality Score</h4>
            <div className="quality-score">
              <div className="score-circle">
                <span className="score-number">{analysis.qualityScore}</span>
                <span className="score-label">/ 100</span>
              </div>
              <div className="score-description">
                {analysis.qualityScore >= 80 && "Excellent lyrics with great flow and vocabulary!"}
                {analysis.qualityScore >= 60 && analysis.qualityScore < 80 && "Good lyrics with room for improvement."}
                {analysis.qualityScore >= 40 && analysis.qualityScore < 60 && "Decent lyrics, consider enhancing rhyme scheme."}
                {analysis.qualityScore < 40 && "Needs work on structure and vocabulary."}
              </div>
            </div>
          </div>

          {/* Rhyme Scheme */}
          <div className="analysis-section">
            <h4>🎵 Rhyme Scheme</h4>
            <div className="rhyme-scheme">
              {analysis.rhymeScheme.map((letter, index) => (
                <span key={index} className={`rhyme-letter ${letter === '-' ? 'no-rhyme' : ''}`}>
                  {letter}
                </span>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div className="analysis-section">
            <h4>😊 Sentiment</h4>
            <div className="sentiment-analysis">
              <div className="sentiment-score">
                <span className={`sentiment-label ${analysis.sentiment.label.toLowerCase()}`}>
                  {analysis.sentiment.label}
                </span>
                <span className="sentiment-value">({analysis.sentiment.score})</span>
              </div>
              <div className="sentiment-breakdown">
                <span>Positive words: {analysis.sentiment.positiveCount}</span>
                <span>Negative words: {analysis.sentiment.negativeCount}</span>
              </div>
            </div>
          </div>

          {/* Themes */}
          {analysis.themes.length > 0 && (
            <div className="analysis-section">
              <h4>🎯 Themes</h4>
              <div className="themes-list">
                {analysis.themes.map((theme, index) => (
                  <div key={index} className="theme-item">
                    <span className="theme-name">{theme.theme}</span>
                    <span className="theme-count">{theme.count} mentions</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Readability */}
          <div className="analysis-section">
            <h4>📖 Readability</h4>
            <div className="readability-level">
              <span className="readability-label">{analysis.readabilityLevel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyricAnalyzer;