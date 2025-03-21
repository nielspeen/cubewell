/**
 * Main script - Initialize CubeWell game
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new Game();
    
    // Initialize game elements (UI, controls, etc.)
    game.initialize();
    
    // Ensure game starts paused
    game.pause();
    
    // Show a simple welcome message (in a real game, this would be more elaborate)
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'game-message';
    
    // Different instructions based on device
    const isMobile = CONFIG.IS_MOBILE;
    
    if (isMobile) {
        welcomeMessage.innerHTML = `
            <h2>CubeWell</h2>
            <p>Stack blocks to form complete layers!</p>
            <p>Controls:<br>
               Arrow buttons: Move block<br>
               Rotate X/Y/Z: Rotate around axes<br>
               Drop: Drop block quickly<br>
               Pause/Resume: Pause the game</p>
            <p>Tap anywhere to start</p>
        `;
    } else {
        welcomeMessage.innerHTML = `
            <h2>CubeWell</h2>
            <p>Stack blocks to form complete layers!</p>
            <p>Controls:<br>
               Arrow keys: Move block<br>
               Q/W/E: Rotate around X/Y/Z axis<br>
               Space: Drop block / Start game<br>
               P: Pause/Resume game</p>
            <p>Press SPACE to start</p>
        `;
    }
    
    // Add to the game container
    document.getElementById('game-container').appendChild(welcomeMessage);
    
    // Hide welcome message and start game
    const startGame = () => {
        welcomeMessage.style.display = 'none';
        game.resume(); // Explicitly resume the game
    };
    
    // Event listeners to hide welcome and start game
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && welcomeMessage.style.display !== 'none') {
            startGame();
        }
    });
    
    welcomeMessage.addEventListener('click', startGame);
}); 