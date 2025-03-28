You are tasked with developing Space Cubes, a web-based 3D puzzle game inspired by the classic "Blockout." In this game, players stack falling 3D blocks (polycubes) into a pit to form solid layers without gaps. Completing a layer clears it and awards points, while the game ends if blocks stack up to the top of the pit. Below are detailed, actionable instructions to implement this game using modern web technologies, ensuring compatibility with both desktop and mobile devices.

Technology Stack

* HTML5
* CSS3
* JavaScript
* Three.js

Use additional libraries if needed.


Game Overview

Objective: Stack falling polycubes into a 3D pit to create complete layers, which then clear to earn points.

View: Players look down into a pit from the top. As if they are looking into a well from above. The bottom should be 5x5. The pit should be 12 levels deep.

Controls: Move blocks horizontally, rotate them around all three axes (x, y, z), and drop them quickly.

Scoring: Earn points for placing blocks, clearing layers, and achieving combos (e.g., clearing multiple layers at once).

Game Over: The game ends when a new block cannot be placed because the pit is too full.

Step-by-Step Implementation

1. Set Up the 3D Environment

Scene Creation:

Use Three.js to initialize a 3D scene with a camera, renderer, and lighting.

Pit Design:

Define the pit as a 3D grid (e.g., 5 width x 5 depth x 12 height). Each cell is a 1x1x1 cube.

Represent the pit internally as a 3D array, where each position is either empty or filled.

Render the pit's boundaries as a neon-blue wiregrid.

2. Generate Polycube Blocks

Polycube Definition:

Create a library of polycube shapes (3D block configurations), starting with simple ones:

* Straight line (3 or 4 cubes in a row)
* 3D L-shape (e.g., 3 cubes in a line with 1 cube branching off)
* 2x2x2 cube
* Add more complex shapes for higher difficulty later.

Represent each polycube as a set of cube positions relative to a central pivot point (e.g., [(0,0,0), (1,0,0), (2,0,0)] for a 3-cube line).


Randomization:

Implement a randomizer to select the next block, ensuring no shape repeats too often (e.g., use a bag system like in Tetris).

3. Implement Block Controls

Movement:

Allow horizontal movement (left, right, forward, backward) within the pit's boundaries.


Desktop: Use arrow keys.
Mobile: Add on-screen buttons or swipe gestures.


Rotation:

Enable rotation around x, y, and z axes using quaternions or Euler angles.
Desktop: Use keys like Q (x-axis), W (y-axis), E (z-axis).
Mobile: Provide on-screen rotation buttons or pinch/twist gestures.

The rotation sould be animated.


Drop:

Add a fast-drop feature (e.g., Spacebar on desktop, tap on mobile).


Validation:

Check that movements and rotations don't cause the block to overlap with filled cells or exit the pit.


4. Handle Block Falling and Landing

Falling Mechanics:

Make the block fall automatically at a set speed (e.g., 1 cube per second initially).

Increase the speed as the game progresses (e.g., every 5 layers cleared).


Collision Detection:

Check for collisions with the pit bottom or other blocks. When a collision occurs, stop the block.


Landing:

Add the block's cubes to the pit's grid.
Trigger layer-checking logic (see step 5).
Spawn a new block at the top center of the pit.


Game Over:

If the new block's starting position is occupied, end the game.


5. Layer Clearing Logic

Layer Check:

After each block lands, scan each z-level (layer) in the pit.
If a layer is fully filled (no empty cells), clear it:
Remove all cubes in that layer.
Shift all layers above it down by one level.


Multiple Layers:

Handle cases where multiple layers clear simultaneously.


Visual Feedback:

Before clearing, briefly highlight the layer (e.g., flash or glow) and animate its removal (e.g., cubes fading out).


6. Scoring and Progression

Scoring System:

10 points per block placed.



100 points per layer cleared.



Bonus for multiple layers: 100 * number of layers * (number of layers + 1) / 2 (e.g., 300 points for 2 layers).



Optional: Large bonus (e.g., 1000 points) for clearing the entire pit.


Progression:

Increase falling speed after milestones (e.g., every 500 points or 5 layers).



Introduce new polycube shapes at higher levels.


7. User Interface (UI)

Elements:

Display score, level, and a preview of the next block.
Show a game over screen with the final score and a restart option.



There should be no menu whatsoever. Upon loading the page the game should start immediately,
be it in a paused state. Hitting spacebar should then start (or really resume) the game.


High Scores (stored via localStorage)


Mobile Optimization:

Ensure buttons and text are large enough for touch input.


8. Visual and Audio Enhancements

Visuals:

Use distinct colors or textures for different polycubes.



Add particle effects when blocks land or layers clear (e.g., Three.js particle system).



Highlight completed layers before clearing.


Audio:

Include sound effects for:

Block movement
Rotation
Landing

Have an exciting music in the background. MSX-style retro sounds.

Layer clearing


Add background music that speeds up with game progression (use Web Audio API).


9. Game State Management

State Tracking:

Current falling block



Pit grid (filled/empty cells)
Score, level, cleared layers



Game over status


Persistence:

Save high scores locally using localStorage.


10. Optimize for Performance

Use efficient rendering (e.g., instanced meshes for cubes).
Minimize draw calls and optimize shaders.
Test frame rate on low-end devices to ensure smoothness.


11. Testing and Compatibility

Test on major browsers (Chrome, Firefox, Safari) and devices (desktop, mobile).
Verify that keyboard and touch controls work intuitively.



Debug rendering or collision issues.


Additional Features (Optional)

Power-Ups: Add special blocks (e.g., clear a layer, slow fall speed).



Challenges: Include daily goals (e.g., clear 10 layers in 2 minutes).



Themes: Unlock new pit designs or block colors as players progress.


Game Loop Summary

Spawn a new polycube at the pit's top center.



While falling:

Process player input (move, rotate, drop).



Move the block down at the current speed.



Check for collisions.


On landing:

Add block to pit.



Clear completed layers and update score.



Spawn a new block.


Repeat until game over.


Additional rules to comply with the 2025 Vibe Coding Game Jam that we are joining:

- anyone can enter with their game
- at least 80% code has to be written by AI 
- game has to be accessible on web without any login or signup and free-to-play (preferrably its own domain or subdomain)
- game has to be multiplayer by default
- can use any engine but usually ThreeJS is recommended
- NO loading screens and heavy downloads (!!!) has to be almost instantly in the game (except maybe ask username if you want)

