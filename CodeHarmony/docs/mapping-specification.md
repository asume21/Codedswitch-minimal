# Code-to-Music Mapping Specification

This document provides a detailed specification of how CodeHarmony maps programming concepts to musical elements. This mapping forms the foundation of the code sonification process.

## Basic Elements

### Variables

| Code Aspect | Musical Element | Description |
|-------------|-----------------|-------------|
| Declaration | Single note | The first introduction of a variable plays a distinct note |
| Data Type | Instrument | Different data types use different instruments:<br>- Strings: Piano (warm, expressive)<br>- Integers: Bass (solid, foundational)<br>- Floats: Electric Piano (fluid, continuous)<br>- Booleans: Percussion (binary, distinct)<br>- Objects: Ensemble (complex, layered) |
| Variable Name | Melodic motif | Characters in the name map to notes in the current scale |
| Scope | Octave | Local variables: middle octave<br>Global variables: lower octave<br>Constants: higher octave |
| Assignment | Note sequence | Value assignment creates a short descending pattern |
| Usage | Echo | When a variable is used, its theme briefly repeats at lower volume |

### Functions

| Code Aspect | Musical Element | Description |
|-------------|-----------------|-------------|
| Declaration | Melodic phrase | Function name determines the main melodic theme |
| Parameters | Variations | Each parameter adds variations to the theme |
| Function Body | Development | Code within the function develops the melodic theme |
| Return | Resolution | Return statement creates a cadence (V-I resolution) |
| Recursive Calls | Nested repetition | The function's theme repeats at different octaves |
| Complexity | Harmonic richness | More complex functions use more chord extensions |

### Control Flow

| Code Aspect | Musical Element | Description |
|-------------|-----------------|-------------|
| If Statement | Question phrase | The condition creates a "questioning" melodic pattern |
| If Body | Answer phrase | The body code resolves the question |
| Else | Contrasting phrase | Else clause uses contrasting harmony (often minor) |
| For Loop | Repeating pattern | Creates a cyclic pattern that repeats |
| While Loop | Ostinato | Background repeating pattern with subtle variations |
| Break | Sudden stop | Abrupt end to the current musical phrase |
| Continue | Brief pause | Short rest before continuing the pattern |

### Classes and Objects

| Code Aspect | Musical Element | Description |
|-------------|-----------------|-------------|
| Class Declaration | Main theme | Establishes the primary musical identity |
| Methods | Related phrases | Methods share musical motifs related to the class theme |
| Properties | Recurring motifs | Properties are represented by short recognizable patterns |
| Inheritance | Theme variation | Child classes build on parent class themes |
| Interfaces | Chord progressions | Define harmonic structures that implementations follow |

### Error and Exception Handling

| Code Aspect | Musical Element | Description |
|-------------|-----------------|-------------|
| Try Block | Tension build-up | Increasing harmonic tension during risky operations |
| Catch | Resolution | The tension resolves when exception is handled |
| Exception Type | Dissonance pattern | Different exception types create unique dissonant patterns |
| Finally | Coda | Closing musical phrase that always plays |
| Syntax Error | Sharp dissonance | Immediate, jarring disharmony |
| Runtime Error | Growing dissonance | Gradually building disharmony |

## Musical Scales for Different Languages

Each programming language has its own "musical personality" reflected in base scale choice:

| Language | Scale | Characteristics |
|----------|-------|-----------------|
| Python | Pentatonic Major | Clean, accessible, few dissonances |
| JavaScript | Blues Scale | Flexible, with characteristic "blue notes" |
| Java | Diatonic Major | Structured, conventional, complete |
| C++ | Harmonic Minor | Complex, powerful, with distinctive intervals |
| Rust | Dorian Mode | Modern, balanced, with unique character |
| Haskell | Lydian Mode | Mathematical, ethereal, abstract |
| Ruby | Mixolydian Mode | Playful, slightly unconventional |

## Tempo and Rhythm

Code structure affects the temporal aspects of the music:

| Code Aspect | Rhythmic Element | Description |
|-------------|------------------|-------------|
| Statement Density | Tempo | More statements per line increase the tempo |
| Nesting Depth | Rhythmic Complexity | Deeper nesting creates more complex rhythmic patterns |
| Code Blocks | Phrases | Each block forms a complete musical phrase |
| Comments | Rests | Brief musical pauses |
| Line Length | Note Duration | Longer lines may use longer notes |

## Advanced Features

### Code Quality Indicators

| Quality Aspect | Musical Element | Description |
|----------------|-----------------|-------------|
| Cyclomatic Complexity | Harmonic Density | More complex code uses denser harmonies |
| Duplicate Code | Repeated Phrases | Obvious repetition in the music |
| Poor Naming | Awkward Intervals | Variable/function names with low information create awkward melodic jumps |
| Optimized Code | Flowing Melody | Well-optimized code creates smooth, flowing musical lines |

### Performance Metrics

| Performance Aspect | Musical Element | Description |
|---------------------|-----------------|-------------|
| Execution Time | Tempo | Faster code plays at higher tempo |
| Memory Usage | Texture Density | Higher memory usage creates denser textures |
| CPU Utilization | Dynamic Level | Higher CPU usage increases volume |

## Implementation Notes

### Key Selection

The musical key should be:
- Consistent within a single file
- Relatable between files in the same project (e.g., using relative keys)
- Customizable by the user based on preference

### Instrument Selection

Instruments should be:
- Distinctive enough to identify different code elements
- Pleasant to listen to for extended periods
- Configurable based on user preference
- Compatible with common MIDI soundfonts and synthesizers

### Balance

The mapping system must balance several concerns:
- Informational content vs. musical aesthetics
- Complexity vs. clarity
- Consistency vs. variety
- Immediate feedback vs. developing patterns
