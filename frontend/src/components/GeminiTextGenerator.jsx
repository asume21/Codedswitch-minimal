import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Switch } from '@mui/material';
import { useSnackbar } from 'notistack';

const DEFAULT_PARAMS = {
  temperature: 0.7,
  max_tokens: 1024,
  top_p: 0.9,
  top_k: 40
};

const GeminiTextGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const { enqueueSnackbar } = useSnackbar();

  const handleParamChange = (param) => (event, newValue) => {
    setParams(prev => ({
      ...prev,
      [param]: newValue
    }));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      enqueueSnackbar('Please enter a prompt', { variant: 'warning' });
      return;
    }

    setIsGenerating(true);
    setGeneratedText('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/gemini/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          ...params
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate text');
      }

      setGeneratedText(data.text);
      enqueueSnackbar('Text generated successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error generating text:', error);
      enqueueSnackbar(error.message || 'Failed to generate text', { variant: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gemini Text Generator
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Enter your prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography gutterBottom>Temperature: {params.temperature.toFixed(1)}</Typography>
          <Slider
            value={params.temperature}
            onChange={handleParamChange('temperature')}
            min={0}
            max={1}
            step={0.1}
            disabled={isGenerating}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => value.toFixed(1)}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Max Tokens</InputLabel>
            <Select
              value={params.max_tokens}
              onChange={(e) => handleParamChange('max_tokens')(null, e.target.value)}
              disabled={isGenerating}
              label="Max Tokens"
            >
              {[256, 512, 1024, 2048, 4096].map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
          fullWidth
          size="large"
        >
          {isGenerating ? 'Generating...' : 'Generate Text'}
        </Button>
      </Paper>

      {generatedText && (
        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Generated Text
          </Typography>
          <Box
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              maxHeight: 400,
              overflow: 'auto'
            }}
          >
            {generatedText}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                navigator.clipboard.writeText(generatedText);
                enqueueSnackbar('Copied to clipboard!', { variant: 'success' });
              }}
            >
              Copy Text
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default GeminiTextGenerator;
