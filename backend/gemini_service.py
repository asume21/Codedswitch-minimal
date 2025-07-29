"""
Gemini API Service for CodedSwitch

This module provides an interface to Google's Gemini API for generating text and code.
"""
import os
import logging
import json
from typing import Optional, Dict, Any, Union, cast
try:
    import google.generativeai as genai
    from google.generativeai.types import GenerationConfig
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GenerationConfig = None
    GENAI_AVAILABLE = False

# Configure logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    """A service class to interact with Google's Gemini API."""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the Gemini service with an API key.
        
        Args:
            api_key: Optional API key. If not provided, will use GEMINI_API_KEY from environment.
        """
        if not GENAI_AVAILABLE:
            raise ImportError("Google Generative AI package not available")
            
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("Gemini API key not provided and GEMINI_API_KEY environment variable not set")
        
        try:
            # Configure the API key first
            genai.configure(api_key=self.api_key)
            
            # Initialize the model
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("Gemini service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini service: {e}")
            raise
    
    def generate_text(self, prompt: str, **generation_config) -> Dict[str, Any]:
        """Generate text using the Gemini API.
        
        Args:
            prompt: The prompt to send to the model
            **generation_config: Additional generation parameters (temperature, max_tokens, etc.)
            
        Returns:
            Dict containing the generated text and metadata
            
        Raises:
            ImportError: If the Google Generative AI package is not available
        """
        if not GENAI_AVAILABLE or not hasattr(self, 'model') or self.model is None:
            raise ImportError("Google Generative AI service is not available")
            
        try:
            # Create generation config
            config = GenerationConfig(
                temperature=float(generation_config.get('temperature', 0.7)),
                max_output_tokens=int(generation_config.get('max_output_tokens', 2048)),
                top_p=float(generation_config.get('top_p', 0.9)),
                top_k=int(generation_config.get('top_k', 40))
            )
            
            # Generate content
            response = self.model.generate_content(prompt, generation_config=config)
            
            # Get response text safely
            response_text = ''
            if hasattr(response, 'text'):
                response_text = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # Handle response format with candidates
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    response_text = ' '.join(part.text for part in candidate.content.parts if hasattr(part, 'text'))
            
            # Format the response
            return {
                'success': True,
                'text': response_text,
                'usage': {
                    'prompt_tokens': len(prompt.split()),
                    'completion_tokens': len(response_text.split()) if response_text else 0,
                    'total_tokens': len(prompt.split()) + (len(response_text.split()) if response_text else 0)
                },
                'model': 'gemini-pro',
                'raw_response': str(response)
            }
            
        except Exception as e:
            logger.error(f"Error generating text with Gemini: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'model': 'gemini-pro'
            }
    
    def generate_code(self, prompt: str, language: str = 'python', **kwargs) -> Dict[str, Any]:
        """Generate code using the Gemini API.
        
        Args:
            prompt: The coding prompt or problem description
            language: The programming language to generate code in
            **kwargs: Additional parameters for text generation
            
        Returns:
            Dict containing the generated code and metadata
        """
        # Format the prompt for code generation
        code_prompt = f"""You are an expert {language} developer. 
        Write clean, efficient, and well-documented code for the following task:
        
        {prompt}
        
        Return only the code without any additional explanation or markdown formatting."""
        
        response = self.generate_text(code_prompt, **kwargs)
        
        if response['success']:
            # Clean up the response to extract just the code
            code = response['text']
            # Remove markdown code blocks if present
            if '```' in code:
                code = code.split('```')[1]  # Get the part after the first ```
                if '\n' in code:
                    code = code.split('\n', 1)[1]  # Remove the language specifier
                code = code.rsplit('```', 1)[0]  # Get the part before the last ```
            
            response['code'] = code.strip()
        
        return response

# Global instance for easier import
try:
    gemini_service = GeminiService()
    GEMINI_AVAILABLE = True
except (ValueError, ImportError) as e:
    print(f"Warning: Could not initialize Gemini service: {e}")
    gemini_service = None
    GEMINI_AVAILABLE = False

# Example usage
if __name__ == "__main__":
    # Initialize with API key from environment
    service = GeminiService()
    
    # Example text generation
    print("Testing text generation...")
    result = service.generate_text("Write a short poem about artificial intelligence")
    if result['success']:
        print("Generated text:", result['text'])
    
    # Example code generation
    print("\nTesting code generation...")
    code_result = service.generate_code(
        "A function that calculates the nth Fibonacci number",
        language="python"
    )
    if code_result['success']:
        print("Generated code:")
        print(code_result['code'])
    else:
        print("Error:", code_result.get('error', 'Unknown error'))
