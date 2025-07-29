import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import GeminiTextGenerator from './GeminiTextGenerator';
import GeminiCodeGenerator from './GeminiCodeGenerator';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
  '& .MuiTabs-indicator': {
    backgroundColor: theme.palette.primary.main,
    height: 3,
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: theme.typography.fontWeightMedium,
  fontSize: theme.typography.pxToRem(15),
  marginRight: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    fontWeight: theme.typography.fontWeightBold,
  },
  '&:hover': {
    color: theme.palette.primary.main,
    opacity: 1,
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gemini-tabpanel-${index}`}
      aria-labelledby={`gemini-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const GeminiAITools = () => {
  const [value, setValue] = useState(0);
  const theme = useTheme();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Gemini AI Tools
      </Typography>
      
      <Paper elevation={3} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <StyledTabs
          value={value}
          onChange={handleChange}
          aria-label="Gemini AI Tools Tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <StyledTab label="Text Generation" id="gemini-tab-0" aria-controls="gemini-tabpanel-0" />
          <StyledTab label="Code Generation" id="gemini-tab-1" aria-controls="gemini-tabpanel-1" />
        </StyledTabs>

        <TabPanel value={value} index={0}>
          <GeminiTextGenerator />
        </TabPanel>
        
        <TabPanel value={value} index={1}>
          <GeminiCodeGenerator />
        </TabPanel>
      </Paper>
      
      <Box sx={{ 
        mt: 4, 
        p: 3, 
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: 2,
        borderLeft: `4px solid ${theme.palette.primary.main}`
      }}>
        <Typography variant="h6" gutterBottom>About Gemini AI</Typography>
        <Typography variant="body1" color="text.secondary">
          Powered by Google's Gemini AI, these tools help you generate high-quality text and code with advanced AI capabilities.
          The models understand and generate human-like text based on your prompts, making them useful for a variety of creative and technical tasks.
        </Typography>
      </Box>
    </Box>
  );
};

export default GeminiAITools;
