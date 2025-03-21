/**
 * Pit.js
 * Manages the 3D grid where blocks fall and layers are cleared
 */

class Pit {
    constructor(width, depth, height) {
        this.width = width;
        this.depth = depth;
        this.height = height;
        this.grid = this._createEmptyGrid();
        this.debug = true; // Debug mode
    }
    
    // Create an empty 3D grid
    _createEmptyGrid() {
        const grid = [];
        for (let x = 0; x < this.width; x++) {
            grid[x] = [];
            for (let y = 0; y < this.depth; y++) {
                grid[x][y] = [];
                for (let z = 0; z < this.height; z++) {
                    grid[x][y][z] = null; // null means empty
                }
            }
        }
        return grid;
    }
    
    // Check if a position is inside the pit bounds
    isInBounds(x, y, z) {
        return x >= 0 && x < this.width && 
               y >= 0 && y < this.depth && 
               z >= 0 && z < this.height;
    }
    
    // Check if a position is empty
    isEmpty(x, y, z) {
        if (!this.isInBounds(x, y, z)) return false;
        return this.grid[x][y][z] === null;
    }
    
    // Check if a position is filled
    isFilled(x, y, z) {
        if (!this.isInBounds(x, y, z)) return false;
        return this.grid[x][y][z] !== null;
    }
    
    // Check if a polycube can be placed at its current position
    canPlacePolycube(polycube) {
        if (!polycube) return false;
        
        if (this.debug) console.log(`Checking if block can be placed at ${polycube.position.x}, ${polycube.position.y}, ${polycube.position.z}`);
        if (this.debug) console.log(`Block has ${polycube.cubes.length} cubes`);
        
        // Get world positions of all cubes in the polycube
        const worldPositions = polycube.getWorldPositions();
        
        // Check if all positions are valid and empty
        for (const worldPos of worldPositions) {
            // Check if position is within pit bounds
            if (worldPos.x < 0 || worldPos.x >= this.width ||
                worldPos.y < 0 || worldPos.y >= this.depth ||
                worldPos.z < 0) {
                
                // Allow blocks to extend beyond the top of the pit when spawning
                if (worldPos.z >= this.height) {
                    // Only allow this when the block is at the very top of the pit
                    // This is to help with spawning blocks that might extend beyond the top
                    if (polycube.position.z < this.height - 1) {
                        if (this.debug) console.log(`Position ${worldPos.x}, ${worldPos.y}, ${worldPos.z} is out of bounds (z too high and not at spawn position)`);
                        return false;
                    }
                    // Otherwise, allow blocks to spawn with parts outside the top
                    continue;
                }
                
                if (this.debug) console.log(`Position ${worldPos.x}, ${worldPos.y}, ${worldPos.z} is out of bounds`);
                return false;
            }
            
            // Check if position is empty (for z positions within the pit)
            if (worldPos.z < this.height && this.isFilled(worldPos.x, worldPos.y, worldPos.z)) {
                if (this.debug) console.log(`Position ${worldPos.x}, ${worldPos.y}, ${worldPos.z} is not empty`);
                return false;
            }
        }
        
        return true;
    }
    
    // Place a polycube in the grid
    placePolycube(polycube) {
        const positions = polycube.getWorldPositions();
        
        if (this.debug) {
            console.log(`Placing block with ${positions.length} cubes`);
        }
        
        for (const pos of positions) {
            if (this.isInBounds(pos.x, pos.y, pos.z)) {
                this.grid[pos.x][pos.y][pos.z] = {
                    colorIndex: pos.colorIndex
                };
                
                if (this.debug) {
                    console.log(`Placed cube at ${pos.x}, ${pos.y}, ${pos.z} with colorIndex ${pos.colorIndex}`);
                }
            }
        }
    }
    
    // Check if a layer is completely filled
    isLayerFilled(z) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                if (this.isEmpty(x, y, z)) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Clear a layer and move everything above down
    clearLayer(z) {
        if (this.debug) {
            console.log(`Clearing layer at z=${z}`);
        }
        
        // Clear the layer
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                this.grid[x][y][z] = null;
            }
        }
        
        // Move everything above down
        for (let zAbove = z + 1; zAbove < this.height; zAbove++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.depth; y++) {
                    this.grid[x][y][zAbove - 1] = this.grid[x][y][zAbove];
                    this.grid[x][y][zAbove] = null;
                }
            }
        }
    }
    
    // Check and clear all filled layers
    // Returns the number of layers cleared
    checkAndClearLayers() {
        let layersCleared = 0;
        let z = 0;
        
        while (z < this.height) {
            if (this.isLayerFilled(z)) {
                this.clearLayer(z);
                layersCleared++;
                // Don't increment z since we need to check the same layer again
                // (since everything moved down)
            } else {
                z++;
            }
        }
        
        if (this.debug && layersCleared > 0) {
            console.log(`Cleared ${layersCleared} layers`);
        }
        
        return layersCleared;
    }
    
    // Get all filled cube positions for rendering
    getFilledPositions() {
        const filled = [];
        
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                for (let z = 0; z < this.height; z++) {
                    if (!this.isEmpty(x, y, z)) {
                        filled.push({
                            position: { x, y, z },
                            data: this.grid[x][y][z]
                        });
                    }
                }
            }
        }
        
        if (this.debug) {
            console.log(`Found ${filled.length} filled positions`);
        }
        
        return filled;
    }
    
    // Check if game is over (if too many blocks are in the top layers)
    isGameOver() {
        // Check top 2 layers for filled positions
        const checkLayers = 2; // Check top 2 layers
        const startZ = this.height - checkLayers;
        
        // Count filled positions in top layers
        let filledCount = 0;
        const threshold = 3; // Need at least 3 filled spaces to consider game over
        
        for (let z = startZ; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.depth; y++) {
                    if (!this.isEmpty(x, y, z)) {
                        filledCount++;
                        
                        if (filledCount >= threshold) {
                            if (this.debug) {
                                console.log(`Game over: found ${filledCount} blocks in top ${checkLayers} layers`);
                            }
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // Reset the pit to empty
    reset() {
        if (this.debug) {
            console.log(`Resetting pit`);
        }
        this.grid = this._createEmptyGrid();
    }
    
    // Check if we have a position filled
    isPositionFilled(x, y, z) {
        // Check if the position is out of bounds
        if (x < 0 || x >= this.width || y < 0 || y >= this.depth || z < 0 || z >= this.height) {
            // Out of bounds is considered filled
            return true;
        }
        
        // Check if the position is filled
        return this.grid[x][y][z] !== null;
    }
    
    // Check if a block can be placed at its current position
    isPositionValid(block) {
        if (!block || !block.cubes) {
            console.error("Invalid block provided to isPositionValid", block);
            return false;
        }
        
        // Get the world positions of each cube in the block
        let positions = [];
        
        try {
            if (typeof block.getWorldPositions === 'function') {
                positions = block.getWorldPositions();
            } else {
                // Fallback for older blocks - manually calculate positions
                positions = block.cubes.map(cube => {
                    return {
                        x: Math.round(cube.x + block.position.x),
                        y: Math.round(cube.y + block.position.y),
                        z: Math.round(cube.z + block.position.z)
                    };
                });
            }
        } catch (e) {
            console.error("Error getting world positions:", e);
            return false;
        }
        
        // Check each position
        for (const pos of positions) {
            // Check if the position is out of bounds or filled
            if (pos.x < 0 || pos.x >= this.width || 
                pos.y < 0 || pos.y >= this.depth || 
                pos.z < 0 || pos.z >= this.height) {
                // Position is out of bounds
                return false;
            }
            
            // Check if the position is already filled
            if (this.grid[pos.x][pos.y][pos.z] !== null) {
                // Position is already filled
                return false;
            }
        }
        
        // All positions are valid
        return true;
    }

    /**
     * Check if a position is occupied by a block
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @returns {boolean} True if position is occupied, false otherwise
     */
    isOccupied(x, y, z) {
        return this.isFilled(x, y, z);
    }

    /**
     * Add a cube to the pit at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     * @param {number} colorIndex - Color index for the cube
     */
    addCube(x, y, z, colorIndex = 0) {
        if (this.isInBounds(x, y, z)) {
            this.grid[x][y][z] = { colorIndex };
            if (this.debug) {
                console.log(`Added cube at ${x}, ${y}, ${z} with colorIndex ${colorIndex}`);
            }
        }
    }

    /**
     * Check completed layers in the pit
     * @returns {Array<number>} Array of Y-indices of completed layers
     */
    checkCompletedLayers() {
        const completedLayers = [];
        
        for (let z = 0; z < this.height; z++) {
            if (this.isLayerFilled(z)) {
                completedLayers.push(z);
            }
        }
        
        return completedLayers;
    }

    /**
     * Remove completed layers and drop blocks above them
     * @param {Array<number>} layers - Array of Y-indices of layers to remove
     */
    removeLayers(layers) {
        // Sort layers in descending order (top to bottom)
        layers.sort((a, b) => b - a);
        
        // Process each layer
        for (const z of layers) {
            this.clearLayer(z);
        }
    }
}

export default Pit; 