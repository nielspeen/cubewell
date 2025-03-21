/**
 * Main.js
 * Entry point for the game that initializes and connects all modules
 */

// Import required modules
import UI from './ui.js';
import AudioManager from './audio.js';
import Game from './game.js';
import Renderer from './renderer.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing game...");
    
    // Create game instance (do not initialize audio yet - wait for user interaction)
    const game = new Game();
    
    // Get container elements
    const canvasContainer = document.getElementById('canvas-container');
    const previewContainer = document.getElementById('preview-container');
    
    // Create renderer with containers
    const renderer = new Renderer(canvasContainer, previewContainer);
    
    // Set the renderer in the game - IMPORTANT: do this before game.init()
    game.renderer = renderer;
    
    // Initialize the game first
    game.init();
    
    // Initialize the UI with the game
    UI.init(game);
    
    // Explicitly ensure game is properly initialized and in paused state
    console.log("Setting initial paused state...");
    game.state.isRunning = false;
    game.state.isPaused = true;
    game.state.isGameOver = false;
    
    // Make sure we have a current block
    if (!game.currentBlock) {
        console.log("No current block after initialization - spawning first block");
        game._spawnBlock();
    }
    
    // Update the UI to reflect paused state
    const gameStateDisplay = document.getElementById('game-running-status');
    if (gameStateDisplay) {
        gameStateDisplay.textContent = 'Paused';
        gameStateDisplay.style.color = '#FFA500';
    }
    
    // Show start message with improved visibility
    const startMessage = document.getElementById('start-message');
    if (startMessage) {
        startMessage.textContent = 'Press SPACE to Start';
        startMessage.style.display = 'block';
    }
    
    // Add paused class to game screen to show overlay
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.classList.add('paused');
    }
    
    // Log the initial state
    console.log("Initial game state set:", {
        isRunning: game.state.isRunning,
        isPaused: game.state.isPaused,
        isGameOver: game.state.isGameOver
    });
    
    // Function to initialize audio after user interaction
    const initAudio = () => {
        // Only initialize once
        if (AudioManager.initialized) return;
        
        AudioManager.init();
        console.log("Audio initialized after user interaction");
        
        // Remove the initialization listeners
        document.removeEventListener('click', initAudio);
        document.removeEventListener('keydown', initAudio);
    };
    
    // Add event listeners for user interaction to initialize audio
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
    
    // Define the key handler function
    function handleKeyDown(event) {
        console.log("Main.js handling key:", event.key);
        // Prevent default behavior for arrow keys to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
        }
        
        // Pass the key to the game
        game.handleKeyInput(event.key);
        
        // Update the status overlay
        const lastKeyElement = document.getElementById('last-key-pressed');
        if (lastKeyElement) {
            lastKeyElement.textContent = event.key;
        }
        
        // Special handling for SPACE to start the game from initial paused state
        if (event.key === ' ') {
            console.log("SPACE key pressed with game state:", {
                isRunning: game.state.isRunning,
                isPaused: game.state.isPaused,
                isGameOver: game.state.isGameOver,
                hasCurrentBlock: !!game.currentBlock,
                hasNextBlock: !!game.nextBlock
            });
            
            // Start the game if it's in paused state (either initial or after pressing P)
            if (game.state.isPaused && !game.state.isRunning) {
                console.log("Starting game from paused state...");
                
                // Ensure we have a block
                if (!game.currentBlock) {
                    console.log("No current block - spawning one before starting");
                    game._spawnBlock();
                }
                
                // Update game state
                game.state.isPaused = false;
                game.state.isRunning = true;
                
                // Hide the start message
                const startMessage = document.getElementById('start-message');
                if (startMessage) {
                    startMessage.style.display = 'none';
                }
                
                // Remove paused class from game screen to hide overlay
                const gameScreen = document.getElementById('game-screen');
                if (gameScreen) {
                    gameScreen.classList.remove('paused');
                }
                
                // Update status display
                const gameStateDisplay = document.getElementById('game-running-status');
                if (gameStateDisplay) {
                    gameStateDisplay.textContent = 'Running';
                    gameStateDisplay.style.color = '#4CAF50';
                }
                
                // Start the fall timer
                console.log("Starting fall timer...");
                game._startFallTimer();
                
                // Log final state after all changes
                console.log("Game started - final state:", {
                    isRunning: game.state.isRunning,
                    isPaused: game.state.isPaused,
                    hasBlock: !!game.currentBlock
                });
                
                event.preventDefault();
                return;
            } else if (game.state.isRunning && game.currentBlock) {
                // If game is already running, drop the block
                console.log("Game running - dropping block");
                game.dropBlock();
                event.preventDefault();
                return;
            } else if (game.state.isGameOver) {
                // If game is over, restart it
                console.log("Game over - restarting on SPACE");
                
                // Reset styles on start message
                const startMessage = document.getElementById('start-message');
                if (startMessage) {
                    startMessage.style.border = '3px solid #4CAF50';
                    startMessage.style.color = '#4CAF50';
                }
                
                UI.restartGame();
                event.preventDefault();
                return;
            }
        }
        
        // Additional hotkeys
        // R key - restart game
        if (event.key === 'r' || event.key === 'R') {
            UI.restartGame();
            event.preventDefault();
        }
        
        // P key - pause/resume game
        if (event.key === 'p' || event.key === 'P') {
            if (game.state.isRunning) {
                game.pause();
                document.getElementById('game-running-status').textContent = 'Paused';
            } else if (game.state.isPaused) {
                game.resume();
                document.getElementById('game-running-status').textContent = 'Running';
            }
            event.preventDefault();
        }
        
        // M key - toggle music
        if (event.key === 'm' || event.key === 'M') {
            if (AudioManager.initialized) {
                UI.toggleMusic();
            }
            event.preventDefault();
        }
    }
    
    // Add the event listener to window for better key capture
    window.addEventListener('keydown', handleKeyDown);
    
    // Set up a status update interval
    setInterval(() => {
        // Update the game running status
        const runningStatusElement = document.getElementById('game-running-status');
        if (runningStatusElement) {
            runningStatusElement.textContent = game.state.isRunning ? "Running" : (game.state.isPaused ? "Paused" : "Game Over");
            runningStatusElement.style.color = game.state.isRunning ? "#4CAF50" : "#FF5252";
        }
        
        // Update the block position if a block exists
        if (game.currentBlock) {
            const pos = game.currentBlock.position;
            const positionElement = document.getElementById('position');
            if (positionElement) {
                positionElement.textContent = `X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
            }
        }
    }, 100);
    
    // Create a global reference for debugging
    window.cubewell = {
        game: game,
        renderer: renderer,
        audio: AudioManager,
        ui: UI,
        // Add debug functions
        forceSpawn: function() {
            console.log("Forcing block spawn...");
            game._spawnBlock();
        },
        moveTest: function() {
            console.log("Testing block movement...");
            game.moveBlock(1, 0, 0); // Try moving right
            console.log("Current block position:", game.currentBlock.position);
        }
    };
    
    // Log helpful information
    console.log("CubeWell initialized!");
    console.log("Controls:");
    console.log("  Arrow keys: Move block");
    console.log("  Q, W, E: Rotate block around X, Y, Z axes");
    console.log("  Spacebar: Drop block quickly");
    console.log("  P: Pause/Resume game");
    console.log("  R: Restart game");
    console.log("  M: Toggle music");
}); 