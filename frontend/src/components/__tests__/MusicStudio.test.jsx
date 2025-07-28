import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import MusicStudio from '../MusicStudio';

// Mock Tone.js and other browser APIs
jest.mock('tone', () => ({
  start: jest.fn().mockResolvedValue(),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
    bpm: {
      value: 120,
      rampTo: jest.fn()
    }
  },
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn()
  })),
  Sampler: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn()
  })),
  Player: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  context: {
    resume: jest.fn().mockResolvedValue(),
    state: 'suspended'
  }
}));

// Mock the fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MusicStudio Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock AudioContext
    global.AudioContext = jest.fn().mockImplementation(() => ({
      suspend: jest.fn().mockResolvedValue(),
      resume: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
      state: 'suspended'
    }));
  });

  test('renders without crashing', () => {
    render(<MusicStudio />);
    expect(screen.getByText(/Music Studio/i)).toBeInTheDocument();
  });

  test('initializes audio context on user interaction', async () => {
    const { getByText } = render(<MusicStudio />);
    const initButton = getByText(/Initialize Audio/i);
    
    await act(async () => {
      fireEvent.click(initButton);
    });
    
    expect(Tone.start).toHaveBeenCalled();
  });

  test('handles piano key press', async () => {
    const { container } = render(<MusicStudio />);
    const pianoKey = container.querySelector('.piano-key.white');
    
    await act(async () => {
      fireEvent.mouseDown(pianoKey);
    });
    
    // Check if the key gets the active class
    expect(pianoKey).toHaveClass('active');
  });

  test('toggles play/pause transport', async () => {
    const { getByLabelText } = render(<MusicStudio />);
    const playButton = getByLabelText(/Play/i);
    
    // First click should play
    await act(async () => {
      fireEvent.click(playButton);
    });
    
    expect(Tone.Transport.start).toHaveBeenCalled();
    
    // Second click should pause
    await act(async () => {
      fireEvent.click(playButton);
    });
    
    expect(Tone.Transport.stop).toHaveBeenCalled();
  });

  test('handles AI music generation', async () => {
    // Mock a successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'test-job-123',
        status: 'queued'
      })
    });
    
    // Mock the polling response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'completed',
        file_url: '/path/to/generated.mp3'
      })
    });
    
    const { getByText, getByPlaceholderText } = render(<MusicStudio />);
    
    // Fill in the prompt
    const promptInput = getByPlaceholderText('Enter a prompt for AI music generation...');
    fireEvent.change(promptInput, { target: { value: 'Test music prompt' } });
    
    // Click generate button
    const generateButton = getByText(/Generate Music/i);
    
    await act(async () => {
      fireEvent.click(generateButton);
    });
    
    // Check if the API was called with the correct data
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate-music'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test music prompt',
          duration: 15,
          temperature: 0.7
        })
      })
    );
    
    // Check if the polling mechanism was triggered
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/music-status/test-job-123')
      );
    });
  });

  test('handles audio initialization errors', async () => {
    // Mock a failed audio context initialization
    Tone.start.mockRejectedValueOnce(new Error('Audio initialization failed'));
    
    const { getByText } = render(<MusicStudio />);
    const initButton = getByText(/Initialize Audio/i);
    
    // Suppress console error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    await act(async () => {
      fireEvent.click(initButton);
    });
    
    // Check if error message is displayed
    expect(screen.getByText(/Failed to initialize audio/i)).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalError;
  });
});
