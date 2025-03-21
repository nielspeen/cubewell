/**
 * Polycubes - 3D block shapes for CubeWell
 */
class Polycube {
    constructor(blocks, color) {
        this.blocks = blocks;  // Array of relative positions [x, y, z]
        this.position = [999, 999, 999];  // Start offscreen to avoid flashing at wrong position
        this.rotation = new THREE.Quaternion(); // Current rotation
        this.mesh = null;  // THREE.js Group containing the block meshes
        this.color = color;
    }
    
    /**
     * Create THREE.js mesh for the polycube
     */
    createMesh() {
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color,
            emissive: new THREE.Color(this.color).multiplyScalar(0.2), // Add some self-illumination
            transparent: true,
            opacity: 0.95
        });
        
        this.mesh = new THREE.Group();
        
        // Make the mesh initially invisible
        this.mesh.visible = false;
        
        for (const [x, y, z] of this.blocks) {
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, y, z);
            this.mesh.add(cube);
        }
        
        // Apply the current position and rotation
        this.updateMesh();
        
        // Now make it visible
        this.mesh.visible = true;
        
        return this.mesh;
    }
    
    /**
     * Update the mesh position and rotation
     */
    updateMesh() {
        if (!this.mesh) return;
        
        this.mesh.position.set(...this.position);
        this.mesh.quaternion.copy(this.rotation);
    }
    
    /**
     * Get absolute positions of all cubes in the polycube
     */
    getWorldPositions() {
        const worldPositions = [];
        const tempVector = new THREE.Vector3();
        
        for (const [x, y, z] of this.blocks) {
            tempVector.set(x, y, z);
            tempVector.applyQuaternion(this.rotation);
            
            worldPositions.push([
                Math.round(tempVector.x + this.position[0]),
                Math.round(tempVector.y + this.position[1]),
                Math.round(tempVector.z + this.position[2])
            ]);
        }
        
        return worldPositions;
    }
    
    /**
     * Move the polycube
     */
    move(dx, dy, dz) {
        this.position[0] += dx;
        this.position[1] += dy;
        this.position[2] += dz;
        this.updateMesh();
    }
    
    /**
     * Rotate the polycube around an axis (immediate rotation, not animated)
     */
    rotate(axis, angle) {
        const q = new THREE.Quaternion();
        q.setFromAxisAngle(new THREE.Vector3(...axis), angle);
        this.rotation.multiply(q);
        this.updateMesh();
    }
    
    /**
     * Clone this polycube
     */
    clone() {
        const newPolycube = new Polycube([...this.blocks], this.color);
        newPolycube.position = [...this.position];
        newPolycube.rotation = this.rotation.clone();
        return newPolycube;
    }
}

/**
 * PolycubeGenerator - Generate random polycubes
 */
class PolycubeGenerator {
    constructor() {
        // Define all possible shapes
        this.shapes = {
            I3: { blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0]] },                 // I-shape (3 blocks)
            I4: { blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]] },      // I-shape (4 blocks)
            L3: { blocks: [[0, 0, 0], [1, 0, 0], [1, 1, 0]] },                 // L-shape (3 blocks)
            T3: { blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0]] },      // T-shape
            Cube2: { blocks: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]] },   // 2x2 square
            Cube8: {                                                            // 2x2x2 cube
                blocks: [
                    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
                    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]
                ]
            },
            Z3: { blocks: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]] },      // Z-shape in 3D
            Corner3: { blocks: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] }, // 3D corner
        };
        
        // Initially available shapes (simpler ones for early game)
        this.availableShapes = ['I3', 'L3', 'Cube2'];
        
        // Bag for shape selection (to avoid repetition)
        this.bag = [...this.availableShapes];
        
        // Current level (for introducing new shapes)
        this.level = 1;
    }
    
    /**
     * Update available shapes based on level
     */
    updateLevel(level) {
        this.level = level;
        
        // Add more complex shapes as level increases
        if (level >= 2 && !this.availableShapes.includes('I4')) {
            this.availableShapes.push('I4');
        }
        if (level >= 3 && !this.availableShapes.includes('T3')) {
            this.availableShapes.push('T3');
        }
        if (level >= 4 && !this.availableShapes.includes('Z3')) {
            this.availableShapes.push('Z3');
        }
        if (level >= 5 && !this.availableShapes.includes('Corner3')) {
            this.availableShapes.push('Corner3');
        }
        if (level >= 7 && !this.availableShapes.includes('Cube8')) {
            this.availableShapes.push('Cube8');
        }
        
        // Refill bag if needed
        if (this.bag.length === 0) {
            this.bag = [...this.availableShapes];
        }
    }
    
    /**
     * Generate a new random polycube
     */
    generate() {
        // If bag is empty, refill it
        if (this.bag.length === 0) {
            this.bag = [...this.availableShapes];
        }
        
        // Pick a random shape from the bag
        const index = Math.floor(Math.random() * this.bag.length);
        const shapeKey = this.bag.splice(index, 1)[0];
        const shape = this.shapes[shapeKey];
        
        // Select a random color
        const colorIndex = Math.floor(Math.random() * CONFIG.BLOCK_COLORS.length);
        const color = CONFIG.BLOCK_COLORS[colorIndex];
        
        // Create new polycube
        return new Polycube(shape.blocks, color);
    }
} 