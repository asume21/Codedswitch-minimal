"""
CodeHarmony Proof of Concept Demo
=================================

This simple demo translates Python code structures into musical patterns
using the Python music library 'mingus' for note generation.

Requirements:
- Python 3.7+
- mingus (pip install mingus)
- fluidsynth (for playback)
- A sound font file (default expected at "./soundfont.sf2")

Basic Usage:
1. Run this script with a Python file as input
2. Listen to the musical representation of your code
3. Experiment with different code structures to hear how they sound

Example:
    python code_harmony_demo.py my_script.py
"""

import sys
import ast
import time
import random
from mingus.midi import fluidsynth
from mingus.containers import Note, Track, Composition, Bar
from mingus.containers.instrument import MidiInstrument

# Initialize FluidSynth
try:
    fluidsynth.init("./soundfont.sf2", "alsa")
    SYNTH_LOADED = True
except:
    print("Warning: FluidSynth initialization failed. Will generate notes but can't play audio.")
    SYNTH_LOADED = False

# Musical mapping configuration
SCALES = {
    'major': [0, 2, 4, 5, 7, 9, 11],  # Major scale intervals
    'minor': [0, 2, 3, 5, 7, 8, 10],  # Natural minor scale intervals
    'pentatonic': [0, 2, 4, 7, 9],    # Major pentatonic
}

INSTRUMENTS = {
    'variable': 0,      # Piano for variables
    'function': 24,     # Guitar for functions
    'class': 48,        # Strings for classes
    'loop': 73,         # Flute for loops
    'conditional': 61,  # Brass for conditionals
    'error': 122,       # Sci-Fi effects for errors
}

BASE_OCTAVE = 4
TEMPO = 120

class CodeToMusicTranslator:
    def __init__(self, scale_type='major', root_note='C'):
        self.scale_type = scale_type
        self.root_note = root_note
        self.composition = Composition()
        self.indent_level = 0
        self.current_track = None
        self.error_count = 0
    
    def parse_file(self, filename):
        """Parse a Python file and convert to music"""
        try:
            with open(filename, 'r') as f:
                code = f.read()
            
            print(f"Translating code from {filename} to music...")
            tree = ast.parse(code)
            self._process_node(tree)
            return self.composition
        except SyntaxError as e:
            print(f"Syntax error in {filename}: {e}")
            self._add_error_sound()
            return self.composition
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            return None
    
    def _process_node(self, node):
        """Process an AST node and convert to musical elements"""
        if isinstance(node, ast.Module):
            # Create a track for the module
            track = Track()
            instrument = MidiInstrument()
            instrument.instrument_nr = INSTRUMENTS['variable']
            track.instrument = instrument
            
            # Add a musical introduction - root chord
            self._add_intro(track)
            
            # Process all statements in the module
            for child in node.body:
                self._process_node(child)
                
            self.composition.add_track(track)
            
        elif isinstance(node, ast.FunctionDef):
            # Function definitions get their own track with unique instrument
            self._start_new_track('function')
            
            # Function name becomes a melodic motif
            self._add_name_motif(node.name, 'function')
            
            # Process function body with increased indent
            self.indent_level += 1
            for child in node.body:
                self._process_node(child)
            self.indent_level -= 1
            
            # Function end sound
            self._add_closing_sound('function')
            
        elif isinstance(node, ast.ClassDef):
            # Classes get their own track with unique instrument
            self._start_new_track('class')
            
            # Class name becomes a grander motif
            self._add_name_motif(node.name, 'class')
            
            # Process class body with increased indent
            self.indent_level += 1
            for child in node.body:
                self._process_node(child)
            self.indent_level -= 1
            
            # Class end sound
            self._add_closing_sound('class')
            
        elif isinstance(node, ast.Assign):
            # Variable assignments create a short melody
            if self.current_track is None:
                self._start_new_track('variable')
            
            # Generate a simple note sequence for assignment
            self._add_variable_notes(node)
            
        elif isinstance(node, ast.For) or isinstance(node, ast.While):
            # Loops create repeated patterns
            self._start_new_track('loop')
            
            # Loop intro sound
            self._add_loop_pattern(node)
            
            # Process loop body with increased indent
            self.indent_level += 1
            for child in node.body:
                self._process_node(child)
            self.indent_level -= 1
            
        elif isinstance(node, ast.If):
            # Conditionals create branching melodies
            self._start_new_track('conditional')
            
            # Conditional test sound
            self._add_conditional_sound(node)
            
            # Process if body with increased indent
            self.indent_level += 1
            for child in node.body:
                self._process_node(child)
            self.indent_level -= 1
            
            # If there's an else clause, add "else" sound and process
            if hasattr(node, 'orelse') and node.orelse:
                self._add_else_sound()
                
                self.indent_level += 1
                for child in node.orelse:
                    self._process_node(child)
                self.indent_level -= 1
        
        # Handle other node types as needed
        # This is a simplified demo, so we're only handling common node types
    
    def _start_new_track(self, track_type):
        """Create a new track with the appropriate instrument"""
        self.current_track = Track()
        instrument = MidiInstrument()
        instrument.instrument_nr = INSTRUMENTS[track_type]
        self.current_track.instrument = instrument
        self.composition.add_track(self.current_track)
    
    def _add_intro(self, track):
        """Add an introductory chord to establish the key"""
        bar = Bar()
        root_note = Note(self.root_note, BASE_OCTAVE)
        third = self._get_scale_note(2)
        fifth = self._get_scale_note(4)
        
        bar.place_notes(root_note, 1)
        bar.place_notes(third, 1)
        bar.place_notes(fifth, 1)
        track.add_bar(bar)
    
    def _add_name_motif(self, name, node_type):
        """Convert a name to a melodic motif"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # Use the name's characters to generate a melodic pattern
        for i, char in enumerate(name):
            # Map character to a scale degree
            scale_degree = ord(char) % len(SCALES[self.scale_type])
            note = self._get_scale_note(scale_degree)
            
            # Adjust octave based on indent level
            note.octave = BASE_OCTAVE + (self.indent_level % 3)
            
            # Different note lengths based on position
            duration = 4 if i == 0 else 8 if i == len(name) - 1 else 16
            
            bar.place_notes(note, duration)
        
        self.current_track.add_bar(bar)
    
    def _add_variable_notes(self, node):
        """Generate notes for a variable assignment"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # For each target in the assignment
        for target in node.targets:
            if isinstance(target, ast.Name):
                # Map name to a short melody
                for i, char in enumerate(target.id[:5]):  # Limit to first 5 chars
                    scale_degree = ord(char) % len(SCALES[self.scale_type])
                    note = self._get_scale_note(scale_degree)
                    note.octave = BASE_OCTAVE + self.indent_level
                    bar.place_notes(note, 8)
        
        # Add a final "assignment" note
        assignment_note = self._get_scale_note(0)  # Root note
        assignment_note.octave = BASE_OCTAVE + self.indent_level
        bar.place_notes(assignment_note, 4)
        
        self.current_track.add_bar(bar)
    
    def _add_loop_pattern(self, node):
        """Create a repetitive pattern for loops"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # Create a short repeating pattern
        pattern = []
        for i in range(4):
            scale_degree = (i * 2) % len(SCALES[self.scale_type])
            note = self._get_scale_note(scale_degree)
            note.octave = BASE_OCTAVE + self.indent_level
            pattern.append(note)
        
        # Repeat the pattern twice
        for _ in range(2):
            for note in pattern:
                bar.place_notes(note, 8)
        
        self.current_track.add_bar(bar)
    
    def _add_conditional_sound(self, node):
        """Create a sound for conditional statements"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # Create a "questioning" sound for the condition
        root = self._get_scale_note(0)
        fifth = self._get_scale_note(4)
        
        bar.place_notes(root, 4)
        bar.place_notes(fifth, 4)
        
        self.current_track.add_bar(bar)
    
    def _add_else_sound(self):
        """Add a sound for else clauses"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # Create a contrasting sound for the else
        seventh = self._get_scale_note(6)
        second = self._get_scale_note(1)
        
        bar.place_notes(seventh, 4)
        bar.place_notes(second, 4)
        
        self.current_track.add_bar(bar)
    
    def _add_closing_sound(self, node_type):
        """Add a closing sound for function/class definitions"""
        if not self.current_track:
            return
            
        bar = Bar()
        
        # Create a resolving cadence
        if node_type == 'function':
            # V-I cadence
            fifth = self._get_scale_note(4)
            root = self._get_scale_note(0)
            
            bar.place_notes(fifth, 4)
            bar.place_notes(root, 2)
        else:
            # IV-V-I cadence for classes
            fourth = self._get_scale_note(3)
            fifth = self._get_scale_note(4)
            root = self._get_scale_note(0)
            
            bar.place_notes(fourth, 4)
            bar.place_notes(fifth, 4)
            bar.place_notes(root, 2)
        
        self.current_track.add_bar(bar)
    
    def _add_error_sound(self):
        """Add an error sound"""
        track = Track()
        instrument = MidiInstrument()
        instrument.instrument_nr = INSTRUMENTS['error']
        track.instrument = instrument
        
        bar = Bar()
        
        # Create a dissonant sound
        note1 = Note('C', 4)
        note2 = Note('C#', 4)
        
        bar.place_notes(note1, 4)
        bar.place_notes(note2, 4)
        bar.place_notes(note1, 4)
        bar.place_notes(note2, 4)
        
        track.add_bar(bar)
        self.composition.add_track(track)
        self.error_count += 1
    
    def _get_scale_note(self, degree):
        """Get a note from the current scale at the given degree"""
        scale = SCALES[self.scale_type]
        root_value = Note(self.root_note).measure - 60  # Convert to semitone value
        
        # Calculate the semitone based on scale degree
        semitone = scale[degree % len(scale)]
        
        # Adjust for octaves if the degree is beyond the scale length
        octave_adjust = degree // len(scale)
        
        # Calculate the actual note value
        note_value = root_value + semitone + (12 * octave_adjust)
        
        # Convert back to a note name
        note = Note().from_int(note_value + 60)
        note.octave = BASE_OCTAVE
        
        return note
    
    def play(self):
        """Play the composition"""
        if not SYNTH_LOADED:
            print("Cannot play music: FluidSynth not properly initialized")
            return
        
        print("Playing musical representation of the code...")
        
        for track in self.composition:
            instrument = track.instrument.instrument_nr
            fluidsynth.set_instrument(1, instrument)
            
            for bar in track:
                for note_container in bar:
                    # Get the note, duration, and volume
                    if hasattr(note_container, 'notes'):
                        notes = note_container.notes
                        duration = 4.0 / note_container[1]  # Convert to seconds
                        
                        # Play the notes
                        for note in notes:
                            fluidsynth.play_Note(note, 1, 80)
                        
                        time.sleep(duration)
                        
                        # Stop the notes
                        for note in notes:
                            fluidsynth.stop_Note(note, 1)
        
        # Allow time for final notes to play out
        time.sleep(1.0)
        
    def save_midi(self, filename):
        """Save the composition as a MIDI file"""
        try:
            from mingus.midi import midi_file_out
            midi_file_out.write_Composition(filename, self.composition)
            print(f"Saved musical representation to {filename}")
            return True
        except Exception as e:
            print(f"Error saving MIDI file: {e}")
            return False


def main():
    if len(sys.argv) < 2:
        print("Usage: python code_harmony_demo.py <python_file>")
        return
    
    filename = sys.argv[1]
    
    # Create the translator with default scale
    translator = CodeToMusicTranslator(scale_type='major', root_note='C')
    
    # Parse the file and generate music
    translator.parse_file(filename)
    
    # Save to MIDI
    translator.save_midi("code_music.mid")
    
    # Play the music if synth is available
    if SYNTH_LOADED:
        translator.play()
    else:
        print("Music saved to MIDI file, but playback not available.")
        print("Install FluidSynth and a sound font to enable playback.")


if __name__ == "__main__":
    main()
