import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  CircularProgress, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  IconButton,
  Tooltip
} from '@mui/material';
import { useSnackbar } from 'notistack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'csharp',
  'go', 'ruby', 'php', 'swift', 'kotlin', 'rust', 'scala', 'dart'
];

const DEFAULT_PARAMS = {
  temperature: 0.5,
  max_tokens: 1024
};

const GeminiCodeGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [copied, setCopied] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleParamChange = (param) => (event, newValue) => {
    setParams(prev => ({
      ...prev,
      [param]: newValue
    }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    enqueueSnackbar('Code copied to clipboard!', { variant: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      enqueueSnackbar('Please enter a prompt', { variant: 'warning' });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gemini/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          language,
          ...params
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code');
      }

      setGeneratedCode(data.code || data.text || '');
      enqueueSnackbar('Code generated successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error generating code:', error);
      enqueueSnackbar(error.message || 'Failed to generate code', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gemini Code Generator
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isGenerating}
              label="Language"
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Temperature: {params.temperature.toFixed(1)}
            </Typography>
            <Slider
              value={params.temperature}
              onChange={handleParamChange('temperature')}
              min={0}
              max={1}
              step={0.1}
              disabled={isGenerating}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value.toFixed(1)}
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label={`Describe the ${language} code you want to generate`}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
          fullWidth
          size="large"
        >
          {isGenerating ? 'Generating Code...' : 'Generate Code'}
        </Button>
      </Paper>

      {generatedCode && (
        <Paper elevation={3} sx={{ p: 0, mt: 2, position: 'relative' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle2" sx={{ ml: 1, color: 'text.secondary' }}>
              {language}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy code'}>
              <IconButton 
                size="small" 
                onClick={handleCopy}
                sx={{ mr: 0.5 }}
              >
                {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          
          <SyntaxHighlighter 
            language={language} 
            style={atomDark}
            customStyle={{
              margin: 0,
              borderRadius: '0 0 4px 4px',
              fontSize: '0.9em',
              maxHeight: '500px'
            }}
            showLineNumbers
            wrapLongLines
          >
            {generatedCode}
          </SyntaxHighlighter>
        </Paper>
      )}
    </Box>
  );
};

export default GeminiCodeGenerator;
