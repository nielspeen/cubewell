/**
 * Polycubes - 3D block shapes for Space Cubes
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
        const edgeGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0); // Slightly larger for edges
        
        // Create main material for the cube faces
        const material = new THREE.MeshLambertMaterial({ 
            color: this.color,
            transparent: true,
            opacity: CONFIG.BLOCK_OPACITY,
            side: THREE.DoubleSide
        });
        
        // Create white edge material
        const edgeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: CONFIG.BLOCK_OPACITY + 0.1, // Slightly more opaque than the main material
            side: THREE.BackSide // Only render the back faces for edge effect
        });
        
        this.mesh = new THREE.Group();
        
        // Make the mesh initially invisible
        this.mesh.visible = false;
        
        for (const [x, y, z] of this.blocks) {
            // Create the main cube
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(x, y, z);
            this.mesh.add(cube);
            
            // Add white edges using a larger cube
            const edges = new THREE.Mesh(edgeGeometry, edgeMaterial);
            edges.position.set(x, y, z);
            this.mesh.add(edges);
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
        // Define all possible shapes with their specific colors
        this.shapes = {
            I3: { 
                blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0]],  // I-shape (3 blocks)
                color: CONFIG.BLOCK_COLORS[0]  // Charizard Red
            },
            I4: { 
                blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],  // I-shape (4 blocks)
                color: CONFIG.BLOCK_COLORS[1]  // Bulbasaur Green
            },
            L3: { 
                blocks: [[0, 0, 0], [1, 0, 0], [1, 1, 0]],  // L-shape (3 blocks)
                color: CONFIG.BLOCK_COLORS[2]  // Squirtle Blue
            },
            T3: { 
                blocks: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0]],  // T-shape
                color: CONFIG.BLOCK_COLORS[3]  // Pikachu Yellow
            },
            Cube2: { 
                blocks: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]],  // 2x2 square
                color: CONFIG.BLOCK_COLORS[4]  // Mewtwo Purple
            },
            Cube8: {  // 2x2x2 cube
                blocks: [
                    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
                    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]
                ],
                color: CONFIG.BLOCK_COLORS[5]  // Lapras Cyan
            },
            Z3: { 
                blocks: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]],  // Z-shape in 3D
                color: CONFIG.BLOCK_COLORS[6]  // Charmander Orange
            },
            Corner3: { 
                blocks: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],  // 3D corner
                color: CONFIG.BLOCK_COLORS[7]  // Gengar Purple
            }
        };
        
        // Initially available shapes (simpler ones for early game)
        this.availableShapes = ['I3', 'L3', 'T3', 'Cube2'];
        
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
        
        // Create new polycube with the shape's specific color
        return new Polycube(shape.blocks, shape.color);
    }
} 