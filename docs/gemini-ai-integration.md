# Gemini AI Tools Integration

This document provides an overview of the Gemini AI Tools integration in the CodedSwitch platform, including setup instructions, usage guidelines, and API documentation.

## Table of Contents
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Frontend Components](#frontend-components)
- [Backend API Endpoints](#backend-api-endpoints)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

The Gemini AI Tools integration brings Google's powerful AI capabilities to the CodedSwitch platform, enabling users to generate text and code through an intuitive interface. The integration consists of:

1. **Frontend Components**:
   - `GeminiAITools`: Main container with tabbed interface
   - `GeminiTextGenerator`: Text generation component
   - `GeminiCodeGenerator`: Code generation component with syntax highlighting

2. **Backend Endpoints**:
   - `/api/gemini/generate`: For text generation
   - `/api/gemini/generate-code`: For code generation

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- Redis (for job queue)
- Google Gemini API key

### Backend Setup

1. Add your Gemini API key to `.env`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   python -m backend.web_backend
   ```

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Frontend Components

### GeminiAITools

The main container component that provides a tabbed interface for switching between text and code generation.

**Props**: None

**Usage**:
```jsx
<GeminiAITools />
```

### GeminiTextGenerator

A form component for generating text with configurable parameters.

**Props**: None

**Features**:
- Prompt input with multiline support
- Adjustable generation parameters (temperature, max tokens, etc.)
- Loading states and error handling
- Copy to clipboard functionality

### GeminiCodeGenerator

A specialized component for generating code with syntax highlighting.

**Props**: None

**Features**:
- Language selection from popular programming languages
- Syntax highlighting for generated code
- Copy to clipboard functionality
- Adjustable generation parameters

## Backend API Endpoints

### POST /api/gemini/generate

Generate text based on a prompt.

**Request Body**:
```json
{
  "prompt": "Write a poem about AI",
  "temperature": 0.7,
  "max_tokens": 1024,
  "top_p": 0.9,
  "top_k": 40
}
```

**Response**:
```json
{
  "success": true,
  "text": "Generated text here...",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 50,
    "total_tokens": 60
  },
  "model": "gemini-pro"
}
```

### POST /api/gemini/generate-code

Generate code based on a prompt and language.

**Request Body**:
```json
{
  "prompt": "Create a Python function to reverse a string",
  "language": "python",
  "temperature": 0.5,
  "max_tokens": 1024
}
```

**Response**:
```json
{
  "success": true,
  "code": "def reverse_string(s):\n    return s[::-1]",
  "language": "python",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 30,
    "total_tokens": 45
  },
  "model": "gemini-pro"
}
```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid input parameters
- `401 Unauthorized`: Missing or invalid API key
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server-side error

## Testing

Run the test suite:

```bash
# Backend tests
pytest

# Frontend tests
cd frontend
npm test
```

## Troubleshooting

### API Key Issues
- Ensure the `GEMINI_API_KEY` is set in your `.env` file
- Verify the key has the correct permissions
- Check for typos in the key

### Connection Issues
- Ensure the backend server is running
- Check CORS configuration if accessing from a different origin
- Verify network connectivity

### Generation Issues
- Try adjusting the temperature parameter
- Check the prompt for clarity and specificity
- Verify the selected language is supported

## License

This integration is part of the CodedSwitch platform. See the main LICENSE file for details.
