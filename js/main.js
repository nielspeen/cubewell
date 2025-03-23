/**
 * Main script - Initialize Space Cubes game
 */
document.addEventListener('DOMContentLoaded', () => {
    // Create game instance
    const game = new Game();
    
    // Initialize game elements (UI, controls, etc.)
    game.initialize();
    
    // Ensure game starts paused
    game.pause();
    
    // Create instructions box
    const instructionsBox = document.createElement('div');
    instructionsBox.className = 'game-message';
    
    // Different instructions based on device
    const isMobile = CONFIG.IS_MOBILE;
    
    if (isMobile) {
        instructionsBox.innerHTML = `
            <h2>Space Cubes</h2>
            <p>Stack blocks to form complete layers!</p>
            <p style="margin-top: 25px;">Controls:</p>
            <ul>
                <li>Arrow buttons: Move block</li>
                <li>Rotate X/Y/Z: Rotate around axes</li>
                <li>Drop: Drop block quickly</li>
                <li>Pause/Resume: Pause the game</li>
            </ul>
            <p class="start-prompt">Press SPACE to start!</p>
        `;
    } else {
        instructionsBox.innerHTML = `
            <h2>Space Cubes</h2>
            <p>Stack blocks to form complete layers!</p>
            <p style="margin-top: 25px;">Controls:</p>
            <ul>
                <li>Arrow keys: Move block</li>
                <li>Q/W/E: Rotate around X/Y/Z axis</li>
                <li>A/S/D: Rotate around X/Y/Z axis (inverse)</li>
                <li>Space: Drop block</li>
                <li>P: Pause/Resume game</li>
            </ul>
            <p class="start-prompt">Press SPACE to start!</p>
        `;
    }
    
    document.getElementById('game-container').appendChild(instructionsBox);
    
    // Create high scores section in the same box
    const highScores = JSON.parse(localStorage.getItem(CONFIG.HIGH_SCORE_KEY) || '[]');
    if (highScores.length > 0) {
        const highScoresSection = document.createElement('div');
        highScoresSection.className = 'high-scores-section';
        highScoresSection.innerHTML = `
            <h2>High Scores</h2>
            <ol>
                ${highScores.map(score => `<li>${score.name}: ${score.score}</li>`).join('')}
            </ol>
        `;
        instructionsBox.appendChild(highScoresSection);
    }
    
    // Hide instructions box and start game
    const startGame = () => {
        instructionsBox.style.display = 'none';
        game.resume(); // Explicitly resume the game
    };
    
    // Event listeners to hide instructions and start game
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && instructionsBox.style.display !== 'none') {
            startGame();
        }
    });
    
    instructionsBox.addEventListener('click', startGame);
    
    // Create game title
    const title = document.createElement('h2');
    title.textContent = 'Space Cubes';

    // Create game over title
    const gameOverTitle = document.createElement('h2');
    gameOverTitle.textContent = 'Space Cubes';
}); 