# CubeWell - 3D Puzzle Game

CubeWell is a web-based 3D puzzle game inspired by the classic "Blockout." Players stack falling 3D blocks (polycubes) into a pit to form solid layers without gaps. Completing a layer clears it, causing the layers above to drop down, and the goal is to score points while preventing the pit from filling up completely.

## Play the Game

1. Simply open `index.html` in a modern web browser.
2. No installation is needed - the game runs entirely in the browser.

## Controls

- **Movement**: Arrow keys to move the block horizontally
- **Rotation**: 
  - `Q` to rotate around X-axis
  - `W` to rotate around Y-axis
  - `E` to rotate around Z-axis
- **Drop**: Spacebar to quickly drop the block
- **Pause/Resume**: `P` key

On mobile devices, on-screen controls are provided for all these actions.

## Game Features

- 3D graphics using Three.js
- Different block shapes (polycubes)
- Layer clearing mechanics
- Score tracking and high scores
- Difficulty settings
- Sound effects and background music
- Mobile-friendly controls

## Project Structure

- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `js/` - JavaScript files:
  - `audio.js` - Handles game sounds using Web Audio API
  - `polycubes.js` - Defines the 3D block shapes
  - `pit.js` - Manages the game grid
  - `game.js` - Core game logic
  - `renderer.js` - 3D rendering with Three.js
  - `ui.js` - User interface management
  - `main.js` - Initialization and setup

## Technical Notes

- The game uses Three.js for 3D rendering.
- Web Audio API is used for sound effects and music.
- Game state (high scores, settings) is saved in localStorage.
- No additional dependencies are required.

## Performance Considerations

- If the game runs slowly on your device, try:
  1. Selecting "Easy" difficulty
  2. Using a more powerful device or desktop computer
  3. Closing other tabs/applications

## Browser Compatibility

The game should work in all modern browsers that support WebGL:
- Chrome
- Firefox
- Safari
- Edge

## Credits

This game was built as an implementation of the CubeWell specification. 