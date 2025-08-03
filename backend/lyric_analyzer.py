"""
Advanced Lyric Analysis Service for CodedSwitch

Provides comprehensive lyric analysis including:
- Rhyme scheme detection
- Sentiment analysis
- Theme identification
- Quality scoring
- Readability assessment
"""

import re
import json
from collections import Counter
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LyricAnalyzer:
    """Advanced lyric analysis with AI enhancement capabilities"""
    
    def __init__(self):
        # Load word lists and patterns
        self.positive_words = {
            'love', 'happy', 'joy', 'success', 'win', 'great', 'amazing', 'good', 'best', 
            'awesome', 'beautiful', 'perfect', 'wonderful', 'fantastic', 'excellent',
            'brilliant', 'outstanding', 'superb', 'magnificent', 'incredible'
        }
        
        self.negative_words = {
            'hate', 'sad', 'pain', 'loss', 'fail', 'bad', 'worst', 'terrible', 'angry', 
            'hurt', 'broken', 'lonely', 'empty', 'dark', 'cold', 'dead', 'wrong',
            'stupid', 'ugly', 'horrible', 'awful', 'disgusting', 'pathetic'
        }
        
        self.theme_keywords = {
            'Love & Relationships': {
                'love', 'heart', 'girl', 'boy', 'relationship', 'together', 'forever',
                'kiss', 'romance', 'date', 'marry', 'wedding', 'valentine', 'crush',
                'boyfriend', 'girlfriend', 'partner', 'soulmate', 'baby', 'honey'
            },
            'Success & Money': {
                'money', 'cash', 'rich', 'success', 'win', 'grind', 'hustle', 'boss',
                'wealth', 'dollar', 'bank', 'profit', 'business', 'empire', 'luxury',
                'diamond', 'gold', 'platinum', 'million', 'billion', 'fortune'
            },
            'Street Life': {
                'street', 'block', 'hood', 'gang', 'trap', 'hustle', 'real',
                'corner', 'alley', 'concrete', 'urban', 'city', 'ghetto', 'struggle',
                'survive', 'tough', 'hard', 'gritty', 'raw', 'authentic'
            },
            'Party & Fun': {
                'party', 'club', 'dance', 'fun', 'night', 'drink', 'celebrate',
                'music', 'beat', 'rhythm', 'vibe', 'energy', 'wild', 'crazy',
                'turn up', 'lit', 'fire', 'hype', 'bounce', 'move'
            },
            'Struggle & Pain': {
                'struggle', 'pain', 'hard', 'difficult', 'fight', 'battle', 'overcome',
                'suffer', 'tears', 'cry', 'hurt', 'wound', 'scar', 'trauma',
                'depression', 'anxiety', 'stress', 'pressure', 'burden'
            },
            'Technology & Innovation': {
                'code', 'tech', 'digital', 'ai', 'computer', 'internet', 'app',
                'software', 'algorithm', 'data', 'cyber', 'virtual', 'online',
                'programming', 'coding', 'developer', 'innovation', 'future'
            },
            'Motivation & Inspiration': {
                'dream', 'goal', 'ambition', 'inspire', 'motivate', 'achieve',
                'believe', 'hope', 'faith', 'courage', 'strength', 'power',
                'determination', 'perseverance', 'dedication', 'passion'
            }
        }
    
    def analyze_lyrics(self, lyrics: str) -> Dict[str, Any]:
        """
        Perform comprehensive lyric analysis
        
        Args:
            lyrics: The lyrics text to analyze
            
        Returns:
            Dictionary containing all analysis results
        """
        if not lyrics or not isinstance(lyrics, str):
            return self._empty_analysis()
        
        try:
            # Clean and prepare text
            cleaned_lyrics = self._clean_text(lyrics)
            lines = self._get_lines(cleaned_lyrics)
            words = self._get_words(cleaned_lyrics)
            
            # Perform all analyses
            analysis = {
                'statistics': self._calculate_statistics(lines, words),
                'rhyme_scheme': self._detect_rhyme_scheme(lines),
                'sentiment': self._analyze_sentiment(words),
                'themes': self._detect_themes(words),
                'quality_score': 0,  # Will be calculated after other metrics
                'readability': self._calculate_readability(cleaned_lyrics),
                'structure': self._analyze_structure(lines),
                'vocabulary': self._analyze_vocabulary(words),
                'flow_analysis': self._analyze_flow(lines)
            }
            
            # Calculate quality score based on all metrics
            analysis['quality_score'] = self._calculate_quality_score(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing lyrics: {str(e)}")
            return self._empty_analysis()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text for analysis"""
        # Remove extra whitespace and normalize line endings
        text = re.sub(r'\s+', ' ', text.strip())
        text = re.sub(r'\n\s*\n', '\n', text)
        return text
    
    def _get_lines(self, text: str) -> List[str]:
        """Extract meaningful lines from text"""
        lines = text.split('\n')
        # Filter out empty lines and section headers
        meaningful_lines = []
        for line in lines:
            line = line.strip()
            if line and not re.match(r'^\[.*\]$', line):  # Skip [Verse], [Chorus] etc.
                meaningful_lines.append(line)
        return meaningful_lines
    
    def _get_words(self, text: str) -> List[str]:
        """Extract words from text"""
        # Extract only alphabetic words, convert to lowercase
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        return words
    
    def _calculate_statistics(self, lines: List[str], words: List[str]) -> Dict[str, Any]:
        """Calculate basic statistics"""
        unique_words = list(set(words))
        
        return {
            'line_count': len(lines),
            'word_count': len(words),
            'unique_word_count': len(unique_words),
            'average_words_per_line': round(len(words) / max(len(lines), 1), 1),
            'vocabulary_richness': round(len(unique_words) / max(len(words), 1) * 100, 1)
        }
    
    def _detect_rhyme_scheme(self, lines: List[str]) -> List[str]:
        """Detect rhyme scheme pattern"""
        if not lines:
            return []
        
        scheme = []
        rhyme_groups = {}
        current_letter = ord('A')
        
        for line in lines:
            # Get the last word of the line
            words = line.strip().split()
            if not words:
                scheme.append('-')
                continue
            
            last_word = re.sub(r'[^a-zA-Z]', '', words[-1].lower())
            if not last_word:
                scheme.append('-')
                continue
            
            # Simple rhyme detection based on ending sounds
            rhyme_key = self._get_rhyme_key(last_word)
            
            if rhyme_key in rhyme_groups:
                scheme.append(rhyme_groups[rhyme_key])
            else:
                letter = chr(current_letter)
                rhyme_groups[rhyme_key] = letter
                scheme.append(letter)
                current_letter += 1
                
                # Reset after Z
                if current_letter > ord('Z'):
                    current_letter = ord('A')
        
        return scheme
    
    def _get_rhyme_key(self, word: str) -> str:
        """Generate a simple rhyme key for a word"""
        if len(word) < 2:
            return word
        
        # Use last 2-3 characters as a simple rhyme key
        if len(word) >= 3:
            return word[-3:]
        return word[-2:]
    
    def _analyze_sentiment(self, words: List[str]) -> Dict[str, Any]:
        """Analyze sentiment of the lyrics"""
        positive_count = sum(1 for word in words if word in self.positive_words)
        negative_count = sum(1 for word in words if word in self.negative_words)
        
        total_sentiment_words = positive_count + negative_count
        
        if total_sentiment_words == 0:
            return {
                'score': 0.0,
                'label': 'Neutral',
                'positive_count': 0,
                'negative_count': 0,
                'confidence': 0.0
            }
        
        # Calculate sentiment score (-1 to 1)
        score = (positive_count - negative_count) / total_sentiment_words
        
        # Determine label
        if score > 0.2:
            label = 'Positive'
        elif score < -0.2:
            label = 'Negative'
        else:
            label = 'Neutral'
        
        # Calculate confidence based on number of sentiment words
        confidence = min(1.0, total_sentiment_words / max(len(words) * 0.1, 1))
        
        return {
            'score': round(score, 2),
            'label': label,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'confidence': round(confidence, 2)
        }
    
    def _detect_themes(self, words: List[str]) -> List[Dict[str, Any]]:
        """Detect themes in the lyrics"""
        theme_scores = {}
        
        for theme_name, keywords in self.theme_keywords.items():
            matches = sum(1 for word in words if word in keywords)
            if matches > 0:
                # Calculate theme strength as percentage of total words
                strength = (matches / len(words)) * 100
                theme_scores[theme_name] = {
                    'count': matches,
                    'strength': round(strength, 2)
                }
        
        # Sort by count and return top themes
        sorted_themes = sorted(
            theme_scores.items(), 
            key=lambda x: x[1]['count'], 
            reverse=True
        )
        
        return [
            {
                'theme': theme,
                'count': data['count'],
                'strength': data['strength']
            }
            for theme, data in sorted_themes[:5]  # Top 5 themes
        ]
    
    def _calculate_readability(self, text: str) -> str:
        """Calculate readability level using simplified Flesch Reading Ease"""
        sentences = len(re.findall(r'[.!?]+', text))
        words = len(re.findall(r'\b\w+\b', text))
        syllables = sum(self._count_syllables(word) for word in re.findall(r'\b\w+\b', text.lower()))
        
        if sentences == 0 or words == 0:
            return 'Unknown'
        
        # Flesch Reading Ease formula
        avg_sentence_length = words / sentences
        avg_syllables_per_word = syllables / words
        
        score = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        if score >= 90:
            return 'Very Easy'
        elif score >= 80:
            return 'Easy'
        elif score >= 70:
            return 'Fairly Easy'
        elif score >= 60:
            return 'Standard'
        elif score >= 50:
            return 'Fairly Difficult'
        elif score >= 30:
            return 'Difficult'
        else:
            return 'Very Difficult'
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word using simple heuristics"""
        word = word.lower()
        if len(word) <= 3:
            return 1
        
        # Remove silent e
        word = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', word)
        word = re.sub(r'^y', '', word)
        
        # Count vowel groups
        matches = re.findall(r'[aeiouy]{1,2}', word)
        syllables = len(matches) if matches else 1
        
        return max(1, syllables)
    
    def _analyze_structure(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze lyrical structure"""
        if not lines:
            return {'sections': [], 'has_chorus': False, 'has_verse': False, 'has_bridge': False}
        
        # Simple structure detection based on repetition
        line_counts = Counter(lines)
        repeated_lines = [line for line, count in line_counts.items() if count > 1]
        
        # Estimate sections based on line patterns
        sections = []
        current_section = []
        
        for i, line in enumerate(lines):
            current_section.append(line)
            
            # New section if we hit a repeated line or every 4-8 lines
            if (line in repeated_lines and len(current_section) > 2) or len(current_section) >= 8:
                sections.append(current_section)
                current_section = []
        
        if current_section:
            sections.append(current_section)
        
        return {
            'sections': len(sections),
            'repeated_lines': len(repeated_lines),
            'has_repetition': len(repeated_lines) > 0,
            'average_section_length': round(len(lines) / max(len(sections), 1), 1)
        }
    
    def _analyze_vocabulary(self, words: List[str]) -> Dict[str, Any]:
        """Analyze vocabulary complexity and diversity"""
        if not words:
            return {'complexity': 0, 'diversity': 0, 'common_words': []}
        
        word_counts = Counter(words)
        unique_words = len(set(words))
        total_words = len(words)
        
        # Calculate vocabulary diversity (Type-Token Ratio)
        diversity = unique_words / total_words if total_words > 0 else 0
        
        # Calculate complexity based on word length and rarity
        avg_word_length = sum(len(word) for word in words) / total_words
        complexity = min(1.0, (avg_word_length - 3) / 5)  # Normalize to 0-1
        
        # Most common words
        common_words = [word for word, count in word_counts.most_common(10)]
        
        return {
            'complexity': round(complexity, 2),
            'diversity': round(diversity, 2),
            'average_word_length': round(avg_word_length, 1),
            'common_words': common_words
        }
    
    def _analyze_flow(self, lines: List[str]) -> Dict[str, Any]:
        """Analyze lyrical flow and rhythm"""
        if not lines:
            return {'consistency': 0, 'rhythm_score': 0}
        
        # Calculate syllable counts per line
        syllable_counts = [
            sum(self._count_syllables(word) for word in re.findall(r'\b\w+\b', line.lower()))
            for line in lines
        ]
        
        if not syllable_counts:
            return {'consistency': 0, 'rhythm_score': 0}
        
        # Calculate flow consistency (how similar line lengths are)
        avg_syllables = sum(syllable_counts) / len(syllable_counts)
        variance = sum((count - avg_syllables) ** 2 for count in syllable_counts) / len(syllable_counts)
        consistency = max(0, 1 - (variance / (avg_syllables ** 2))) if avg_syllables > 0 else 0
        
        # Calculate rhythm score based on syllable patterns
        rhythm_score = self._calculate_rhythm_score(syllable_counts)
        
        return {
            'consistency': round(consistency, 2),
            'rhythm_score': round(rhythm_score, 2),
            'average_syllables_per_line': round(avg_syllables, 1),
            'syllable_variance': round(variance, 2)
        }
    
    def _calculate_rhythm_score(self, syllable_counts: List[int]) -> float:
        """Calculate rhythm score based on syllable patterns"""
        if len(syllable_counts) < 2:
            return 0.5
        
        # Look for patterns in syllable counts
        patterns = 0
        for i in range(len(syllable_counts) - 1):
            if abs(syllable_counts[i] - syllable_counts[i + 1]) <= 2:
                patterns += 1
        
        return patterns / (len(syllable_counts) - 1)
    
    def _calculate_quality_score(self, analysis: Dict[str, Any]) -> int:
        """Calculate overall quality score based on all metrics"""
        score = 50  # Base score
        
        # Rhyme scheme bonus (up to 20 points)
        rhyme_scheme = analysis.get('rhyme_scheme', [])
        if rhyme_scheme:
            rhyme_consistency = len([r for r in rhyme_scheme if r != '-']) / len(rhyme_scheme)
            score += rhyme_consistency * 20
        
        # Vocabulary richness bonus (up to 15 points)
        vocab_richness = analysis.get('statistics', {}).get('vocabulary_richness', 0)
        score += (vocab_richness / 100) * 15
        
        # Structure bonus (up to 10 points)
        structure = analysis.get('structure', {})
        if structure.get('has_repetition', False):
            score += 5
        if structure.get('sections', 0) >= 2:
            score += 5
        
        # Flow consistency bonus (up to 10 points)
        flow = analysis.get('flow_analysis', {})
        score += flow.get('consistency', 0) * 10
        
        # Length appropriateness (up to 5 points)
        line_count = analysis.get('statistics', {}).get('line_count', 0)
        if 8 <= line_count <= 32:
            score += 5
        
        # Sentiment clarity bonus (up to 5 points)
        sentiment = analysis.get('sentiment', {})
        if sentiment.get('confidence', 0) > 0.5:
            score += 5
        
        # Theme focus bonus (up to 5 points)
        themes = analysis.get('themes', [])
        if themes and themes[0].get('strength', 0) > 2:
            score += 5
        
        return max(0, min(100, round(score)))
    
    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure"""
        return {
            'statistics': {
                'line_count': 0,
                'word_count': 0,
                'unique_word_count': 0,
                'average_words_per_line': 0,
                'vocabulary_richness': 0
            },
            'rhyme_scheme': [],
            'sentiment': {
                'score': 0.0,
                'label': 'Neutral',
                'positive_count': 0,
                'negative_count': 0,
                'confidence': 0.0
            },
            'themes': [],
            'quality_score': 0,
            'readability': 'Unknown',
            'structure': {
                'sections': 0,
                'repeated_lines': 0,
                'has_repetition': False,
                'average_section_length': 0
            },
            'vocabulary': {
                'complexity': 0,
                'diversity': 0,
                'common_words': []
            },
            'flow_analysis': {
                'consistency': 0,
                'rhythm_score': 0
            }
        }

# Global analyzer instance
lyric_analyzer = LyricAnalyzer()

def analyze_lyrics_text(lyrics: str) -> Dict[str, Any]:
    """
    Convenience function to analyze lyrics
    
    Args:
        lyrics: The lyrics text to analyze
        
    Returns:
        Dictionary containing analysis results
    """
    return lyric_analyzer.analyze_lyrics(lyrics)