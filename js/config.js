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
        0xff0088, // Pink
        0x00ff88, // Cyan
        0xff8800, // Orange
        0xffff00, // Yellow
        0x8800ff, // Purple
        0x00ff00, // Green
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