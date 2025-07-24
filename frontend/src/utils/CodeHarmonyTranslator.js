/**
 * CodeHarmony Translator
 * Converts code structures to musical patterns and analyzes code structure
 */

// Constants for music generation
const BASE_OCTAVE = 4;
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]; // C major scale intervals
const DEFAULT_VELOCITY = 90;
const NOTE_DURATION = 0.5; // Default note duration in beats

/**
 * Maps a string to a sequence of scale degrees based on character values
 * @param {string} str - String to map
 * @param {number[]} scale - Scale intervals to use
 * @returns {number[]} - Array of scale degrees
 */
const stringToScaleDegrees = (str, scale = MAJOR_SCALE) => {
  if (!str) return [];
  
  return str.split('').map(char => {
    // Map ASCII value to scale degree
    const asciiValue = char.charCodeAt(0);
    return scale[asciiValue % scale.length];
  });
};

/**
 * Maps a variable declaration to notes
 * @param {Object} variable - Variable info {name, type}
 * @returns {Object[]} - Array of piano roll notes
 */
const variableToNotes = (variable, startBeat = 0) => {
  const { name, type } = variable;
  const octave = BASE_OCTAVE;
  
  // Map data type to velocity (representing different "instruments")
  let velocity = DEFAULT_VELOCITY;
  if (type === 'string') velocity = 100;
  if (type === 'number') velocity = 85;
  if (type === 'boolean') velocity = 110;
  if (type === 'object') velocity = 75;
  
  // Create a melodic pattern from the variable name
  const intervals = stringToScaleDegrees(name);
  
  // Generate notes with increasing start times
  return intervals.map((interval, i) => {
    const midiNote = 60 + interval; // C4 (60) + interval
    return {
      id: `var_${name}_${i}`,
      midiNote,
      start: startBeat + (i * 0.25), // Each note 1/16th note apart
      duration: NOTE_DURATION,
      velocity
    };
  });
};

/**
 * Maps a function declaration to a melodic phrase
 * @param {Object} func - Function info {name, params}
 * @returns {Object[]} - Array of piano roll notes
 */
const functionToNotes = (func, startBeat = 0) => {
  const { name, params = [] } = func;
  
  // Create base function motif
  const nameIntervals = stringToScaleDegrees(name);
  const baseMidiNote = 60; // C4
  
  const functionNotes = nameIntervals.map((interval, i) => {
    return {
      id: `func_${name}_${i}`,
      midiNote: baseMidiNote + interval,
      start: startBeat + (i * 0.5), // Each note 1/8th note apart
      duration: 0.5, // 1/8th note
      velocity: 100 // Strong velocity for function declaration
    };
  });
  
  // Add parameter variations if present
  let paramNotes = [];
  if (params.length > 0) {
    const paramStartBeat = startBeat + nameIntervals.length * 0.5;
    
    params.forEach((param, paramIndex) => {
      const paramIntervals = stringToScaleDegrees(param);
      
      const paramMelody = paramIntervals.map((interval, i) => {
        return {
          id: `func_${name}_param_${paramIndex}_${i}`,
          midiNote: baseMidiNote + 7 + interval, // 5th up from base
          start: paramStartBeat + paramIndex + (i * 0.25),
          duration: 0.25, // 1/16th note
          velocity: 85 // Slightly softer for parameters
        };
      });
      
      paramNotes = [...paramNotes, ...paramMelody];
    });
  }
  
  // Create a resolving cadence for the function
  const cadenceNotes = [
    {
      id: `func_${name}_cadence_1`,
      midiNote: baseMidiNote + 7, // G4 (dominant)
      start: startBeat + functionNotes.length * 0.5 + paramNotes.length * 0.25 + 0.5,
      duration: 0.5,
      velocity: 90
    },
    {
      id: `func_${name}_cadence_2`,
      midiNote: baseMidiNote, // C4 (tonic)
      start: startBeat + functionNotes.length * 0.5 + paramNotes.length * 0.25 + 1,
      duration: 1.0, // Longer final note
      velocity: 95
    }
  ];
  
  return [...functionNotes, ...paramNotes, ...cadenceNotes];
};

/**
 * Maps a conditional statement to a questioning phrase
 * @param {Object} conditional - Conditional info {condition}
 * @returns {Object[]} - Array of piano roll notes
 */
const conditionalToNotes = (conditional, startBeat = 0) => {
  const { condition, body } = conditional;
  const baseMidiNote = 65; // F4
  
  // Create a questioning phrase for the condition
  const conditionIntervals = [0, 2, 4, 7, 4]; // Question-like pattern
  
  const conditionNotes = conditionIntervals.map((interval, i) => {
    return {
      id: `if_${i}`,
      midiNote: baseMidiNote + interval,
      start: startBeat + (i * 0.5),
      duration: 0.5,
      velocity: 85 + (i * 3) // Crescendo 
    };
  });
  
  // If body is provided, create a brief answering phrase
  let bodyNotes = [];
  if (body) {
    // Create a resolving phrase
    const bodyIntervals = [7, 5, 4, 0];
    bodyNotes = bodyIntervals.map((interval, i) => {
      return {
        id: `if_body_${i}`,
        midiNote: baseMidiNote + interval,
        start: startBeat + conditionNotes.length * 0.5 + (i * 0.5),
        duration: 0.5,
        velocity: 80
      };
    });
  }
  
  return [...conditionNotes, ...bodyNotes];
};

/**
 * Maps a loop statement to a repeating pattern
 * @param {Object} loop - Loop info {type, iterations}
 * @returns {Object[]} - Array of piano roll notes
 */
const loopToNotes = (loop, startBeat = 0) => {
  const { type, iterations = 4 } = loop;
  const baseMidiNote = 72; // C5
  
  // Create a repeating pattern based on loop type
  let pattern = [];
  if (type === 'for') {
    pattern = [0, 4, 7, 4];
  } else if (type === 'while') {
    pattern = [0, 3, 7, 3];
  } else {
    pattern = [0, 5, 7, 5];
  }
  
  let notes = [];
  // Repeat the pattern based on iterations
  for (let i = 0; i < iterations; i++) {
    const iteration = pattern.map((interval, j) => {
      return {
        id: `loop_${type}_${i}_${j}`,
        midiNote: baseMidiNote + interval,
        start: startBeat + (i * pattern.length * 0.25) + (j * 0.25),
        duration: 0.25,
        velocity: 90 - (i * 5) // Decrescendo on each iteration
      };
    });
    notes = [...notes, ...iteration];
  }
  
  return notes;
};

/**
 * Parse a code snippet and translate it to musical notes
 * @param {string} code - Code snippet to translate
 * @returns {Object[]} - Array of piano roll notes
 */
const codeToNotes = (code) => {
  let notes = [];
  let currentBeat = 0;
  
  // Simple parsing to identify basic structures
  // A real implementation would use a proper parser
  const lines = code.split('\n');
  
  lines.forEach(line => {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('//')) {
      currentBeat += 0.5;
      return;
    }
    
    // Variable declarations
    if (line.includes('const ') || line.includes('let ') || line.includes('var ')) {
      const match = line.match(/(const|let|var) +(\w+)/);
      if (match) {
        const varName = match[2];
        // Try to detect type from context
        let type = 'unknown';
        if (line.includes('"') || line.includes("'")) type = 'string';
        else if (line.includes('true') || line.includes('false')) type = 'boolean';
        else if (line.match(/\d+(\.\d+)?/)) type = 'number';
        else if (line.includes('{') || line.includes('[')) type = 'object';
        
        const varNotes = variableToNotes({ name: varName, type }, currentBeat);
        notes = [...notes, ...varNotes];
        currentBeat += Math.max(2, varNotes.length * 0.25);
      }
    }
    
    // Function declarations
    else if (line.includes('function ') || line.match(/\w+\s*\([^)]*\)\s*{/)) {
      const funcMatch = line.match(/function (\w+)|(\w+)\s*\(/);
      if (funcMatch) {
        const funcName = funcMatch[1] || funcMatch[2];
        const paramsMatch = line.match(/\(([^)]*)\)/);
        const params = paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()) : [];
        
        const funcNotes = functionToNotes({ name: funcName, params }, currentBeat);
        notes = [...notes, ...funcNotes];
        currentBeat += Math.max(4, funcNotes.length * 0.5);
      }
    }
    
    // If statements
    else if (line.includes('if (') || line.includes('if(')) {
      const ifMatch = line.match(/if\s*\(([^)]+)\)/);
      if (ifMatch) {
        const condition = ifMatch[1];
        const ifNotes = conditionalToNotes({ condition }, currentBeat);
        notes = [...notes, ...ifNotes];
        currentBeat += Math.max(3, ifNotes.length * 0.5);
      }
    }
    
    // Loops
    else if (line.includes('for (') || line.includes('while (')) {
      const loopType = line.includes('for ') ? 'for' : 'while';
      const loopNotes = loopToNotes({ type: loopType, iterations: 3 }, currentBeat);
      notes = [...notes, ...loopNotes];
      currentBeat += Math.max(3, loopNotes.length * 0.25);
    }
    
    // Default for other lines
    else {
      // Simple melodic pattern for other code
      const intervals = stringToScaleDegrees(line.trim().substring(0, 8));
      const otherNotes = intervals.map((interval, i) => {
        return {
          id: `line_${currentBeat}_${i}`,
          midiNote: 60 + interval,
          start: currentBeat + (i * 0.25),
          duration: 0.25,
          velocity: 70
        };
      });
      
      notes = [...notes, ...otherNotes];
      currentBeat += Math.max(1, otherNotes.length * 0.25);
    }
  });
  
  return notes;
};

/**
 * Translate a specific code example to predefined musical pattern
 * Used for demonstration examples
 */
const translateSampleFunction = () => {
  // Example for calculate_average function
  return [
    // Function Declaration - "calculate_average"
    { id: 'fn_1', midiNote: 60, start: 0.0, duration: 0.5, velocity: 100 },
    { id: 'fn_2', midiNote: 64, start: 0.5, duration: 0.25, velocity: 85 },
    { id: 'fn_3', midiNote: 67, start: 0.75, duration: 0.25, velocity: 90 },
    { id: 'fn_4', midiNote: 69, start: 1.0, duration: 0.5, velocity: 80 },
    { id: 'fn_5', midiNote: 67, start: 1.5, duration: 0.25, velocity: 75 },
    { id: 'fn_6', midiNote: 72, start: 1.75, duration: 0.5, velocity: 95 },

    // Variable Assignment - "total = sum(numbers)"
    { id: 'var_1', midiNote: 64, start: 2.5, duration: 0.25, velocity: 80 },
    { id: 'var_2', midiNote: 67, start: 2.75, duration: 0.25, velocity: 80 },
    { id: 'var_3', midiNote: 72, start: 3.0, duration: 0.5, velocity: 85 },
    { id: 'var_4', midiNote: 71, start: 3.5, duration: 0.25, velocity: 70 },

    // Variable Assignment - "count = len(numbers)"
    { id: 'var_5', midiNote: 62, start: 4.0, duration: 0.25, velocity: 80 },
    { id: 'var_6', midiNote: 65, start: 4.25, duration: 0.25, velocity: 80 },
    { id: 'var_7', midiNote: 69, start: 4.5, duration: 0.5, velocity: 85 },
    { id: 'var_8', midiNote: 67, start: 5.0, duration: 0.25, velocity: 70 },

    // Conditional - "if count == 0:"
    { id: 'if_1', midiNote: 65, start: 5.5, duration: 0.25, velocity: 90 },
    { id: 'if_2', midiNote: 69, start: 5.75, duration: 0.25, velocity: 85 },
    { id: 'if_3', midiNote: 67, start: 6.0, duration: 0.5, velocity: 80 },
    { id: 'if_4', midiNote: 64, start: 6.5, duration: 0.75, velocity: 95 },

    // Return Statement - "return 0"
    { id: 'ret_1', midiNote: 60, start: 7.25, duration: 0.5, velocity: 90 },
    { id: 'ret_2', midiNote: 55, start: 7.75, duration: 0.75, velocity: 85 },

    // Return Statement - "return total / count"
    { id: 'ret_3', midiNote: 67, start: 8.5, duration: 0.25, velocity: 100 },
    { id: 'ret_4', midiNote: 72, start: 8.75, duration: 0.5, velocity: 90 },
    { id: 'ret_5', midiNote: 71, start: 9.25, duration: 0.25, velocity: 85 },
    { id: 'ret_6', midiNote: 69, start: 9.5, duration: 0.25, velocity: 80 },
    { id: 'ret_7', midiNote: 60, start: 9.75, duration: 1.0, velocity: 100 },
  ];
};

/**
 * Translate the DataAnalyzer class from the sample
 */
const translateDataAnalyzerClass = () => {
  return [
    // Class Declaration - "DataAnalyzer"
    { id: 'cls_1', midiNote: 67, start: 0.0, duration: 0.75, velocity: 100 },
    { id: 'cls_2', midiNote: 71, start: 0.75, duration: 0.5, velocity: 90 },
    { id: 'cls_3', midiNote: 74, start: 1.25, duration: 0.5, velocity: 95 },
    { id: 'cls_4', midiNote: 79, start: 1.75, duration: 1.0, velocity: 85 },

    // Constructor Method - "__init__"
    { id: 'init_1', midiNote: 67, start: 3.0, duration: 0.25, velocity: 80 },
    { id: 'init_2', midiNote: 69, start: 3.25, duration: 0.25, velocity: 75 },
    { id: 'init_3', midiNote: 71, start: 3.5, duration: 0.25, velocity: 70 },
    { id: 'init_4', midiNote: 74, start: 3.75, duration: 0.5, velocity: 80 },

    // Method Definition - "get_stats"
    { id: 'meth_1', midiNote: 69, start: 4.5, duration: 0.5, velocity: 90 },
    { id: 'meth_2', midiNote: 71, start: 5.0, duration: 0.25, velocity: 85 },
    { id: 'meth_3', midiNote: 74, start: 5.25, duration: 0.5, velocity: 80 },
    
    // Call to calculate_average - echoes the function theme
    { id: 'call_1', midiNote: 60, start: 6.0, duration: 0.25, velocity: 70 },
    { id: 'call_2', midiNote: 64, start: 6.25, duration: 0.25, velocity: 65 },
    { id: 'call_3', midiNote: 67, start: 6.5, duration: 0.25, velocity: 65 },
    
    // Dictionary creation and return
    { id: 'dict_1', midiNote: 74, start: 7.0, duration: 0.5, velocity: 85 },
    { id: 'dict_2', midiNote: 71, start: 7.5, duration: 0.25, velocity: 80 },
    { id: 'dict_3', midiNote: 67, start: 7.75, duration: 0.75, velocity: 95 },
  ];
};

/**
 * Analyze code structure and extract important information
 * @param {string} code - Code to analyze
 * @returns {Object} - Analysis of the code structure
 */
const analyzeCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { maxNestingLevel: 0, lines: 0, complexity: 0 };
  }
  
  // Count basic metrics
  const lines = code.split('\n').length;
  const tokens = code.split(/\s+/).length;
  
  // Analyze nesting level
  let currentNesting = 0;
  let maxNestingLevel = 0;
  
  // Simple parsing for brackets/braces/parens to determine nesting
  for (const char of code) {
    if ('{[('.includes(char)) {
      currentNesting++;
      maxNestingLevel = Math.max(maxNestingLevel, currentNesting);
    } else if ('}])'.includes(char)) {
      currentNesting = Math.max(0, currentNesting - 1);
    }
  }
  
  // Calculate code complexity based on tokens and nesting
  const complexity = Math.min(1, (tokens / 500) * 0.5 + (maxNestingLevel / 10) * 0.5);
  
  return {
    maxNestingLevel,
    lines,
    tokens,
    complexity
  };
};

/**
 * Extract code structure information like functions, loops, conditionals
 * @param {string} code - Code to analyze
 * @returns {Object} - Structure information
 */
const codeToStructure = (code) => {
  if (!code || typeof code !== 'string') {
    return { functions: [], conditionals: [], loops: [], variables: [] };
  }
  
  // Very basic regex-based detection
  // In a real implementation, this would use a proper parser
  const functionMatches = code.match(/function\s+(\w+)\s*\(([^)]*)\)/g) || [];
  const conditionalMatches = code.match(/(if|else if|switch)\s*\(([^)]*)\)/g) || [];
  const loopMatches = code.match(/(for|while|do)\s*\(([^)]*)\)/g) || [];
  const variableMatches = code.match(/(const|let|var)\s+(\w+)\s*=/g) || [];
  
  // Extract functions with basic information
  const functions = functionMatches.map(match => {
    const nameMatch = match.match(/function\s+(\w+)/);
    const paramsMatch = match.match(/\(([^)]*)\)/);
    
    return {
      name: nameMatch ? nameMatch[1] : 'anonymous',
      params: paramsMatch ? paramsMatch[1].split(',').map(p => p.trim()) : []
    };
  });
  
  // Extract conditionals
  const conditionals = conditionalMatches.map(match => {
    const typeMatch = match.match(/(if|else if|switch)/);
    const conditionMatch = match.match(/\(([^)]*)\)/);
    
    return {
      type: typeMatch ? typeMatch[1] : 'if',
      condition: conditionMatch ? conditionMatch[1] : ''
    };
  });
  
  // Extract loops
  const loops = loopMatches.map(match => {
    const typeMatch = match.match(/(for|while|do)/);
    const bodyMatch = match.match(/\(([^)]*)\)/);
    
    return {
      type: typeMatch ? typeMatch[1] : 'for',
      body: bodyMatch ? bodyMatch[1] : ''
    };
  });
  
  // Extract variables
  const variables = variableMatches.map(match => {
    const typeMatch = match.match(/(const|let|var)/);
    const nameMatch = match.match(/\s+(\w+)\s*=/);
    
    return {
      type: typeMatch ? typeMatch[1] : 'var',
      name: nameMatch ? nameMatch[1] : 'unknown'
    };
  });
  
  return {
    functions,
    conditionals,
    loops,
    variables
  };
};

export {
  codeToNotes,
  translateSampleFunction,
  translateDataAnalyzerClass,
  analyzeCode,
  codeToStructure
};
