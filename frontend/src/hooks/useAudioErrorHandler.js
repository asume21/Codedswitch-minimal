import { useState, useCallback } from 'react';

/**
 * Custom hook for handling audio-related errors in React components.
 * Provides consistent error handling and user feedback for audio operations.
 * 
 * @returns {Object} - Object containing error state and handler functions
 */
const useAudioErrorHandler = () => {
  const [error, setError] = useState(null);

  /**
   * Handle audio context related errors
   */
  const handleAudioContextError = useCallback((error) => {
    console.error('Audio Context Error:', error);
    
    let userMessage = 'Failed to initialize audio. ';
    
    // Handle specific error cases
    if (error.name === 'NotAllowedError') {
      userMessage += 'Please allow audio permissions in your browser settings.';
    } else if (error.name === 'NotSupportedError') {
      userMessage += 'Your browser does not support the Web Audio API. Please try a modern browser like Chrome or Firefox.';
    } else {
      userMessage += 'Please try refreshing the page or check your audio settings.';
    }
    
    setError({
      type: 'audio_context',
      message: userMessage,
      originalError: error,
      timestamp: new Date().toISOString()
    });
    
    return userMessage;
  }, []);

  /**
   * Handle audio playback errors
   */
  const handlePlaybackError = useCallback((error, audioSource = 'unknown') => {
    console.error(`Playback Error (${audioSource}):`, error);
    
    let userMessage = 'Failed to play audio. ';
    
    if (error.name === 'NotAllowedError') {
      userMessage = 'Audio playback was blocked. Please interact with the page first or check your browser settings.';
    } else if (error.name === 'NotSupportedError') {
      userMessage = 'The audio format is not supported by your browser.';
    } else if (error.message && error.message.includes('fetch')) {
      userMessage = 'Could not load audio file. Please check your internet connection.';
    }
    
    setError({
      type: 'playback',
      source: audioSource,
      message: userMessage,
      originalError: error,
      timestamp: new Date().toISOString()
    });
    
    return userMessage;
  }, []);

  /**
   * Handle audio processing errors
   */
  const handleProcessingError = useCallback((error, context = 'audio processing') => {
    console.error(`Processing Error (${context}):`, error);
    
    const userMessage = `Error during ${context}. ${error.message || 'Please try again.'}`;
    
    setError({
      type: 'processing',
      context,
      message: userMessage,
      originalError: error,
      timestamp: new Date().toISOString()
    });
    
    return userMessage;
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    clearError,
    handleAudioContextError,
    handlePlaybackError,
    handleProcessingError,
    hasError: error !== null
  };
};

export default useAudioErrorHandler;
