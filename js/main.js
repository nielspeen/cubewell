/**
 * Main.js
 * Entry point for the game that initializes and connects all modules
 */

// Import required modules
import UI from './ui.js';
import AudioManager from './audio.js';
import Game from './game.js';
import Renderer from './renderer.js';

// Add key state tracking to prevent key repeats
const keyState = {
    lastKeyTime: {},
    keyDebounceTime: 250, // Consistent debounce time for all keys
    keysPressed: {}, // Track if keys are currently pressed down
    handlingKeyDown: false, // Flag to prevent overlapping keydown handling
    processingAllowed: true // Global flag to allow or block all key processing
};

// Helper function to determine if a key should be processed
function shouldProcessKey(key) {
    key = key.toLowerCase();
    
    // Always block if key is already pressed
    if (keyState.keysPressed[key]) {
        console.log(`${key} key already pressed - blocking repeat`);
        return false;
    }
    
    // Check if we're in a global cooldown period
    if (!keyState.processingAllowed) {
        console.log(`Key processing globally disabled - blocking ${key}`);
        return false;
    }
    
    // Check timing
    const now = Date.now();
    if (keyState.lastKeyTime[key] && now - keyState.lastKeyTime[key] <= keyState.keyDebounceTime) {
        console.log(`${key} key pressed too soon (${now - keyState.lastKeyTime[key]}ms) - blocking`);
        return false;
    }
    
    // Update key state
    keyState.lastKeyTime[key] = now;
    keyState.keysPressed[key] = true;
    console.log(`${key} key allowed at ${now}`);
    
    return true;
}

// Function to temporarily block all key processing
function blockAllKeyProcessing(duration = 200) { // Increase default duration from 150ms to 200ms
    keyState.processingAllowed = false;
    console.log(`Blocking all key processing for ${duration}ms`);
    setTimeout(() => {
        keyState.processingAllowed = true;
        console.log('Key processing re-enabled');
    }, duration);
}

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("=== Cubewell Game Initializing ===");
    
    let audioInitialized = false;
    let gameInitialized = false;
    let rendererInitialized = false;
    
    try {
        // Initialize audio system first
        console.log("1. Initializing audio system");
        AudioManager.init();
        audioInitialized = true;
        console.log("✓ Audio system initialized");
    } catch (e) {
        console.error("! Audio initialization failed:", e);
    }
    
    // Create the game and renderer
    console.log("2. Creating game and renderer");
    let game, renderer;
    
    try {
        // Create game instance
        game = new Game({ debug: true }); 
        gameInitialized = true;
        console.log("✓ Game instance created");
        
        // Create renderer instance
        const canvasContainer = document.getElementById('canvas-container');
        const previewContainer = document.getElementById('preview-container');
        renderer = new Renderer(canvasContainer, previewContainer);
        
        // Set the renderer on the game
        game.setRenderer(renderer);
        
        // Initialize the renderer with the pit
        renderer.init(game.pit, game);
        rendererInitialized = true;
        console.log("✓ Renderer initialized");
        console.log("3. Game and renderer connected");
    } catch (e) {
        console.error("! Game/Renderer creation failed:", e);
    }
    
    if (gameInitialized && rendererInitialized) {
        // Make game globally available for debugging
        window.game = game;
    } else {
        console.error("Cannot continue - game or renderer failed to initialize");
    }
    
    // Set up UI with the game instance
    console.log("4. Setting up UI");
    try {
        if (gameInitialized) {
            // Check if UI.setGame is a function
            if (typeof UI.setGame === 'function') {
                UI.setGame(game);
                console.log("✓ UI game reference set");
            } else {
                console.error("! UI.setGame is not a function");
                // Assign directly as fallback
                UI.game = game;
                console.log("? Used UI.game direct assignment as fallback");
            }
            
            // Initialize UI components
            if (typeof UI.init === 'function') {
                UI.init();
                console.log("✓ UI initialized");
            } else {
                console.error("! UI.init is not a function");
            }
        } else {
            console.error("Cannot set up UI - game not initialized");
        }
    } catch (e) {
        console.error("! UI setup failed:", e);
    }
    
    // Final check to start the game
    console.log("5. Starting the game");
    if (gameInitialized) {
        try {
            if (!game.isRunning()) {
                game.start();
                console.log("✓ Game started");
                
                // Check if a block was spawned
                if (!game.currentBlock) {
                    console.warn("! No current block after starting - attempting to spawn one");
                    game._spawnBlock();
                }
            } else {
                console.log("Game already running");
            }
        } catch (e) {
            console.error("! Game start failed:", e);
        }
    }
    
    // Set up keyboard events for controlling the block
    console.log("6. Setting up keyboard controls");
    try {
        document.addEventListener('keydown', function(event) {
            // Prevent overlapping keydown handling
            if (keyState.handlingKeyDown) {
                console.log(`Already handling a key event - blocking ${event.key}`);
                event.preventDefault();
                return;
            }
            
            keyState.handlingKeyDown = true;
            
            // Special case for space to unpause/start the game
            if (event.key === ' ' && game && game.isPaused()) {
                console.log("SPACE pressed - starting game from paused state");
                
                // Update status display to show game is starting
                if (UI.elements.gameStateDisplay) {
                    UI.elements.gameStateDisplay.textContent = "STARTING...";
                }
                
                // Remove any dimming overlay if it exists
                const dimOverlay = document.getElementById('dim-overlay');
                if (dimOverlay) {
                    dimOverlay.style.display = 'none';
                }
                
                // Remove any start message if it exists
                const startMessage = document.getElementById('start-message');
                if (startMessage) {
                    startMessage.style.display = 'none';
                }
                
                // Unpause the game
                game.unpause();
                event.preventDefault();
                keyState.handlingKeyDown = false;
                return;
            }
            
            // Only handle other keys if game is running and not paused
            if (!game || !game.isRunning() || game.isPaused()) {
                console.log(`Game not running or paused, ignoring key: ${event.key}`);
                keyState.handlingKeyDown = false;
                return;
            }
            
            console.log(`Key pressed: ${event.key}`);
            
            // Update last key pressed display
            if (UI.elements.lastKeyDisplay) {
                UI.elements.lastKeyDisplay.textContent = event.key;
            }
            
            // Check if we should process this key
            if (!shouldProcessKey(event.key)) {
                console.log(`Key ${event.key} blocked by debounce system`);
                keyState.handlingKeyDown = false;
                event.preventDefault();
                return;
            }
            
            // Movement keys
            switch(event.key) {
                case 'ArrowLeft':
                case 'a':
                    game.moveCurrentBlock(-1, 0, 0);
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                    game.moveCurrentBlock(1, 0, 0);
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                case 'w':
                    // W key rotates the block around Y axis
                    if (event.key.toLowerCase() === 'w') {
                        game.rotateCurrentBlock('y', Math.PI/2);
                    } else {
                        // Arrow Up is for forward movement
                        game.moveCurrentBlock(0, 0, -1);
                    }
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                    // Arrow Down is for backward movement
                    game.moveCurrentBlock(0, 0, 1);
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case 'q':
                    // Q rotates around X axis
                    game.rotateCurrentBlock('x', Math.PI/2);
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case 'e':
                    // E rotates around Z axis
                    game.rotateCurrentBlock('z', Math.PI/2);
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
                case ' ':
                    // Space drops the block
                    game.dropCurrentBlock();
                    blockAllKeyProcessing(300); // Longer cooldown for dropping
                    event.preventDefault();
                    break;
                case 'p':
                    // P toggles pause
                    if (game.isPaused()) {
                        game.unpause();
                    } else {
                        game.pause();
                    }
                    blockAllKeyProcessing(300); // Longer cooldown for pause
                    event.preventDefault();
                    break;
                case 'r':
                    // R resets the game
                    game.reset();
                    game.start();
                    blockAllKeyProcessing(500); // Even longer cooldown for reset
                    event.preventDefault();
                    break;
                case 'm':
                    // M toggles music
                    AudioManager.toggleMusic();
                    blockAllKeyProcessing();
                    event.preventDefault();
                    break;
            }
            
            keyState.handlingKeyDown = false;
        });
        
        document.addEventListener('keyup', function(event) {
            // Mark key as released
            const key = event.key.toLowerCase();
            keyState.keysPressed[key] = false;
        });
        
        console.log("✓ Keyboard controls set up");
    } catch (e) {
        console.error("! Keyboard setup failed:", e);
    }
    
    // Set up status update interval
    console.log("7. Setting up status display updates");
    try {
        // Initial status display
        if (UI.elements.gameStateDisplay) {
            UI.elements.gameStateDisplay.textContent = "PRESS SPACE TO START";
            
            // Add a blinking effect to draw attention
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                if (blinkCount > 10 || !game.isPaused()) {
                    clearInterval(blinkInterval);
                    if (UI.elements.gameStateDisplay && game.isPaused()) {
                        UI.elements.gameStateDisplay.style.opacity = "1";
                    }
                    return;
                }
                
                if (UI.elements.gameStateDisplay) {
                    UI.elements.gameStateDisplay.style.opacity = 
                        UI.elements.gameStateDisplay.style.opacity === "0.3" ? "1" : "0.3";
                    blinkCount++;
                }
            }, 500);
        }
        
        // Regular status updates
        setInterval(function() {
            if (!game) return;
            
            // Update game state display
            if (UI.elements.gameStateDisplay) {
                UI.elements.gameStateDisplay.textContent = game.isRunning() ? 
                    (game.isPaused() ? "PAUSED" : "RUNNING") : "STOPPED";
            }
            
            // Update position display if exists
            if (UI.elements.positionDisplay && game.currentBlock) {
                const pos = game.currentBlock.position;
                UI.elements.positionDisplay.textContent = 
                    `x: ${pos.x}, y: ${pos.y}, z: ${pos.z}`;
            }
        }, 100);
        
        console.log("✓ Status updates initialized");
    } catch (e) {
        console.error("! Status update setup failed:", e);
    }
    
    console.log("=== Initialization Complete ===");
});

// Make debugGame function globally available
window.debugGame = function() {
    if (!window.game) {
        console.error("Game not initialized");
        return;
    }
    
    console.log("Game State:", {
        running: window.game.isRunning(),
        paused: window.game.isPaused(),
        gameOver: window.game.isGameOver(),
        score: window.game.getScore(),
        level: window.game.getLevel(),
        fallSpeed: window.game.state.fallSpeed,
        currentBlock: window.game.currentBlock ? {
            id: window.game.currentBlock.id,
            position: window.game.currentBlock.position,
            rotation: window.game.currentBlock.rotation,
            cubes: window.game.currentBlock.cubes.length
        } : null,
        nextBlock: window.game.nextBlock ? {
            id: window.game.nextBlock.id,
            cubes: window.game.nextBlock.cubes.length
        } : null,
        blockBag: window.game.blockBag ? window.game.blockBag.length : 0,
        pit: {
            width: window.game.pit.width,
            height: window.game.pit.height,
            depth: window.game.pit.depth,
            filledCount: window.game.pit.getFilledCount()
        }
    });
    
    // Check renderer state
    if (window.game.renderer) {
        console.log("Renderer State:", {
            initialized: !!window.game.renderer,
            scene: window.game.renderer.scene ? {
                children: window.game.renderer.scene.children.length,
                background: window.game.renderer.scene.background
            } : null,
            camera: window.game.renderer.camera ? {
                position: window.game.renderer.camera.position,
                rotation: window.game.renderer.camera.rotation
            } : null,
            pitMesh: window.game.renderer.pitMesh ? {
                position: window.game.renderer.pitMesh.position,
                children: window.game.renderer.pitMesh.children.length,
                visible: window.game.renderer.pitMesh.visible
            } : null,
            currentBlockMesh: window.game.renderer.currentBlockMesh ? {
                position: window.game.renderer.currentBlockMesh.position,
                children: window.game.renderer.currentBlockMesh.children.length,
                visible: window.game.renderer.currentBlockMesh.visible
            } : null,
            canvas: window.game.renderer.renderer ? {
                size: {
                    width: window.game.renderer.renderer.domElement.width,
                    height: window.game.renderer.renderer.domElement.height
                },
                parent: window.game.renderer.renderer.domElement.parentElement ? 
                    window.game.renderer.renderer.domElement.parentElement.id : "none"
            } : null
        });
        
        // Force a render to help diagnose issues
        try {
            window.game.renderer.renderer.render(
                window.game.renderer.scene,
                window.game.renderer.camera
            );
            console.log("Forced renderer update completed");
        } catch (e) {
            console.error("Error forcing renderer update:", e);
        }
    } else {
        console.error("No renderer attached to game");
    }
    
    // Check DOM elements
    console.log("DOM Elements:", {
        canvasContainer: document.getElementById('canvas-container') ? {
            size: {
                width: document.getElementById('canvas-container').clientWidth,
                height: document.getElementById('canvas-container').clientHeight
            },
            children: document.getElementById('canvas-container').children.length,
            visible: document.getElementById('canvas-container').style.display !== 'none'
        } : "Not found",
        previewContainer: document.getElementById('preview-container') ? {
            size: {
                width: document.getElementById('preview-container').clientWidth,
                height: document.getElementById('preview-container').clientHeight
            },
            children: document.getElementById('preview-container').children.length,
            visible: document.getElementById('preview-container').style.display !== 'none'
        } : "Not found"
    });
    
    // Force a new block to spawn if no current block
    if (!window.game.currentBlock && window.game.isRunning()) {
        console.log("No current block, forcing block spawn...");
        window.game._spawnBlock();
        console.log("Block spawn attempted, current block:", window.game.currentBlock ? 
            window.game.currentBlock.id : "still null");
    }
};

// Add an initGame function that can be called from the console
window.initGame = function() {
    console.log("Manual game initialization requested");
    
    try {
        // Get canvas containers
        const canvasContainer = document.getElementById('canvas-container');
        const previewContainer = document.getElementById('preview-container');
        
        if (!canvasContainer) {
            console.error("Canvas container not found!");
            return;
        }
        
        console.log("Canvas containers:", {
            main: canvasContainer ? `${canvasContainer.clientWidth}x${canvasContainer.clientHeight}` : "not found",
            preview: previewContainer ? `${previewContainer.clientWidth}x${previewContainer.clientHeight}` : "not found"
        });
        
        // Initialize THREE
        if (typeof THREE === 'undefined') {
            console.error("THREE.js not loaded!");
            return;
        }
        
        console.log("THREE.js is loaded");
        
        // Initialize the game
        console.log("Creating game instance");
        window.game = new Game({ debug: true });
        
        // Create and initialize the renderer
        console.log("Creating renderer");
        const renderer = new Renderer(canvasContainer, previewContainer);
        
        // Set the renderer on the game
        console.log("Setting renderer on game");
        window.game.setRenderer(renderer);
        
        // Initialize the pit
        console.log("Initializing renderer with pit");
        renderer.init(window.game.pit, window.game);
        
        // Set up UI
        if (typeof UI !== 'undefined') {
            console.log("Setting up UI");
            UI.setGame(window.game);
            UI.init();
        } else {
            console.warn("UI not found, skipping UI setup");
        }
        
        // Start the game
        console.log("Starting game");
        window.game.start();
        
        // Spawn a block if needed
        if (!window.game.currentBlock) {
            console.log("No current block, spawning one");
            window.game._spawnBlock();
        }
        
        // Debug the final state
        console.log("Game initialized, final state:");
        window.debugGame();
        
        return "Game initialized successfully";
    } catch (e) {
        console.error("Error initializing game:", e);
        return "Failed to initialize game: " + e.message;
    }
}; 