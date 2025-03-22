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
    LEVEL_UP_SCORE: 300,     // Score threshold for increasing level
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
}; 