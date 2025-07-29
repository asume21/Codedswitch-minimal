import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import GeminiAITools from '../GeminiAITools';

// Mock the child components
jest.mock('../GeminiTextGenerator', () => () => (
  <div data-testid="gemini-text-generator">Text Generator</div>
));

jest.mock('../GeminiCodeGenerator', () => () => (
  <div data-testid="gemini-code-generator">Code Generator</div>
));

describe('GeminiAITools', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <GeminiAITools />
      </BrowserRouter>
    );
  };

  it('renders the component with title and tabs', () => {
    renderComponent();
    
    // Check title
    expect(screen.getByText('Gemini AI Tools')).toBeInTheDocument();
    
    // Check tabs
    expect(screen.getByRole('tab', { name: /text generation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /code generation/i })).toBeInTheDocument();
  });

  it('shows text generator by default', () => {
    renderComponent();
    
    // Default tab should be active
    expect(screen.getByRole('tab', { name: /text generation/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('gemini-text-generator')).toBeInTheDocument();
  });

  it('switches to code generator tab when clicked', async () => {
    renderComponent();
    
    // Click code generation tab
    fireEvent.click(screen.getByRole('tab', { name: /code generation/i }));
    
    // Check if code generator is shown
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /code generation/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('gemini-code-generator')).toBeInTheDocument();
    });
  });

  it('shows about section with correct content', () => {
    renderComponent();
    
    // Check about section
    expect(screen.getByText('About Gemini AI')).toBeInTheDocument();
    expect(screen.getByText(/powered by google's gemini ai/i)).toBeInTheDocument();
  });
});
