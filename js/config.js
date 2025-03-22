/**
 * CubeWell Game Configuration
 */
const CONFIG = {
    // Pit dimensions
    PIT_WIDTH: 5,
    PIT_DEPTH: 5,
    PIT_HEIGHT: 15,
    
    // Game settings
    INITIAL_FALL_SPEED: 1.0, // Units per second
    LEVEL_UP_SCORE: 500,     // Score threshold for increasing level
    SPEED_INCREASE: 0.2,     // How much to increase speed per level
    MAX_FALL_SPEED: 5.0,     // Maximum falling speed
    
    // Scoring
    POINTS_PER_BLOCK: 10,    // Points for placing a block
    POINTS_PER_LAYER: 100,   // Points for clearing a layer
    
    // Colors
    PIT_COLOR: 0x00aaff,     // Neon blue for pit wireframe
    BLOCK_COLORS: [
        0xff0000, // Charizard Red - Vibrant red
        0x00ff00, // Bulbasaur Green - Bright green
        0x0000ff, // Squirtle Blue - Pure blue
        0xffd700, // Pikachu Yellow - Bright gold
        0xff00ff, // Mewtwo Purple - Magenta
        0x00ffff, // Lapras Cyan - Bright cyan
        0xff4500, // Charmander Orange - Orange-red
        0x9400d3, // Gengar Purple - Deep purple
        0x32cd32, // Ivysaur Green - Lime green
        0x4169e1, // Gyarados Blue - Royal blue
    ],
    
    // Multiplayer
    PLAYER_NAME_KEY: 'cubewell_player_name', // localStorage key for player name
    HIGH_SCORE_KEY: 'cubewell_high_scores',  // localStorage key for high scores
    
    // Device detection
    IS_MOBILE: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    
    // Physics
    ROTATION_SPEED: Math.PI / 2, // Rotation speed (90 degrees in radians)
    DROP_SPEED_MULTIPLIER: 10,    // How much faster blocks fall when dropping
    
    // Visual settings
    BLOCK_EDGE_WIDTH: 4,          // Width of block edges in pixels
    
    // Starfield background settings
    STARFIELD: {
        INITIAL_STARS: 800,       // Number of stars to start with
        MIN_STARS: 750,           // Minimum number of stars to maintain
        SPAWN_RATE: 0.4,          // Chance to spawn a new star each frame (0-1)
        BASE_SIZE: 0.1,           // Base size of stars
        SIZE_RANGE: 0.2,          // Random size variation (0-1)
        MIN_SIZE: 0.05,           // Minimum star size
        SPEED_RANGE: 1.5,         // Random speed variation
        MIN_SPEED: 0.8,           // Minimum star speed
        OPACITY_RANGE: 0.3,       // Random opacity variation (0-1)
        MIN_OPACITY: 0.3,         // Minimum star opacity
        SPAWN_AREA: 120,          // Area where stars can spawn
        DESPAWN_DISTANCE: 100,    // Distance at which stars are removed
        Z_POSITION: -60           // Z position of stars (further from camera)
    }
}; 