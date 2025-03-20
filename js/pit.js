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
        this.mesh = null; // Will hold the Three.js mesh for the pit walls
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
    
    // Check if a polycube can be placed at its current position
    canPlacePolycube(polycube) {
        const positions = polycube.getWorldPositions();
        
        for (const pos of positions) {
            if (!this.isEmpty(pos.x, pos.y, pos.z)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Place a polycube in the grid
    placePolycube(polycube) {
        const positions = polycube.getWorldPositions();
        
        for (const pos of positions) {
            if (this.isInBounds(pos.x, pos.y, pos.z)) {
                this.grid[pos.x][pos.y][pos.z] = {
                    color: polycube.color,
                    mesh: null // Will be set by the renderer
                };
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
        
        return filled;
    }
    
    // Check if game is over (if the top layer has any filled positions)
    isGameOver() {
        // Check top few layers for any filled positions
        const checkLayers = 3; // Check top 3 layers
        const startZ = this.height - checkLayers;
        
        for (let z = startZ; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.depth; y++) {
                    if (!this.isEmpty(x, y, z)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Reset the pit to empty
    reset() {
        this.grid = this._createEmptyGrid();
    }
} 