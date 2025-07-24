const fs = require('fs');
const path = require('path');

// Process MusicStudio.jsx
const musicStudioPath = path.join(__dirname, 'frontend', 'src', 'components', 'MusicStudio.jsx');
const musicContent = fs.readFileSync(musicStudioPath, 'utf8');

// We need to keep the entire component content but fix only the export part
// Identify the component definition and the export separately
const musicMatch = musicContent.match(/const\s+MusicStudio\s*=\s*\(\)\s*=>\s*{[\s\S]+?\n}/);
if (musicMatch) {
  const componentCode = musicMatch[0];
  
  // Create a new file with proper ES Module syntax
  const newMusicContent = musicContent.slice(0, musicMatch.index) + 
    componentCode + 
    '\n\nexport default MusicStudio;\n';
  
  fs.writeFileSync(musicStudioPath, newMusicContent);
  console.log('MusicStudio.jsx fixed for ES modules');
} else {
  console.error('Could not find MusicStudio component definition');
}

// Process BeatStudio.jsx
const beatStudioPath = path.join(__dirname, 'frontend', 'src', 'components', 'BeatStudio.jsx');
const beatContent = fs.readFileSync(beatStudioPath, 'utf8');

// We need to keep the entire component content but fix only the export part
const beatMatch = beatContent.match(/const\s+BeatStudio\s*=\s*\(\)\s*=>\s*{[\s\S]+?\n}/);
if (beatMatch) {
  const componentCode = beatMatch[0];
  
  // Create a new file with proper ES Module syntax
  const newBeatContent = beatContent.slice(0, beatMatch.index) + 
    componentCode + 
    '\n\nexport default BeatStudio;\n';
  
  fs.writeFileSync(beatStudioPath, newBeatContent);
  console.log('BeatStudio.jsx fixed for ES modules');
} else {
  console.error('Could not find BeatStudio component definition');
}
