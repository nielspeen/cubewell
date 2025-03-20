/**
 * Polycubes.js
 * Defines the 3D block shapes (polycubes) for the game
 */

class Polycube {
    constructor(id, name, cubes, color) {
        this.id = id;
        this.name = name;
        this.cubes = cubes; // Array of positions relative to pivot: [{x, y, z}, ...]
        this.color = color;
        this.mesh = null; // Will hold the Three.js mesh
        this.position = { x: 0, y: 0, z: 0 }; // Current position in the pit
        this.rotation = { x: 0, y: 0, z: 0 }; // Current rotation
    }

    // Clone this polycube to create a new instance
    clone() {
        const newCubes = this.cubes.map(cube => ({ x: cube.x, y: cube.y, z: cube.z }));
        return new Polycube(this.id, this.name, newCubes, this.color);
    }

    // Get the world positions of all cubes in this polycube
    getWorldPositions() {
        // Apply rotation and translation to each cube
        return this.cubes.map(cube => {
            // In a real implementation, apply rotation matrices
            // This is a simplified placeholder
            const rotated = this._applyRotation(cube);
            return {
                x: Math.round(rotated.x + this.position.x),
                y: Math.round(rotated.y + this.position.y),
                z: Math.round(rotated.z + this.position.z)
            };
        });
    }

    // Apply current rotation to a cube position
    _applyRotation(cube) {
        // In a full implementation, use proper 3D rotation matrices
        // For simplicity, we'll use a placeholder
        // Note: This is not mathematically correct and should be replaced with quaternion or matrix-based rotation
        let x = cube.x;
        let y = cube.y;
        let z = cube.z;
        
        // Apply rotations in X, Y, Z order
        // (Real implementation would use matrices or quaternions)
        const cosX = Math.cos(this.rotation.x);
        const sinX = Math.sin(this.rotation.x);
        const cosY = Math.cos(this.rotation.y);
        const sinY = Math.sin(this.rotation.y);
        const cosZ = Math.cos(this.rotation.z);
        const sinZ = Math.sin(this.rotation.z);
        
        // X rotation
        let tempY = y * cosX - z * sinX;
        let tempZ = y * sinX + z * cosX;
        y = tempY;
        z = tempZ;
        
        // Y rotation
        let tempX = x * cosY + z * sinY;
        tempZ = -x * sinY + z * cosY;
        x = tempX;
        z = tempZ;
        
        // Z rotation
        tempX = x * cosZ - y * sinZ;
        tempY = x * sinZ + y * cosZ;
        x = tempX;
        y = tempY;
        
        return { x, y, z };
    }

    // Move the polycube
    move(dx, dy, dz) {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
    }

    // Rotate the polycube
    rotate(axis, angle) {
        this.rotation[axis] += angle;
    }
}

// Define the polycube library
const PolycubeLibrary = {
    // Collection of all polycubes
    polycubes: [],
    
    // Initialize the library with default shapes
    init() {
        // I-Shape (line of 4 cubes)
        this.polycubes.push(new Polycube(
            "i4",
            "I-Tetracube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 3, y: 0, z: 0 }
            ],
            0x00AAFF
        ));
        
        // L-Shape
        this.polycubes.push(new Polycube(
            "l4",
            "L-Tetracube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }
            ],
            0xFFAA00
        ));
        
        // T-Shape
        this.polycubes.push(new Polycube(
            "t4",
            "T-Tetracube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 1, y: 1, z: 0 }
            ],
            0xAA00FF
        ));
        
        // Cube (2x2x1)
        this.polycubes.push(new Polycube(
            "square",
            "Square-Tetracube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 1, y: 1, z: 0 }
            ],
            0xFFFF00
        ));
        
        // Cube (2x2x2)
        this.polycubes.push(new Polycube(
            "cube",
            "Cube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
                { x: 1, y: 1, z: 0 },
                { x: 0, y: 0, z: 1 },
                { x: 1, y: 0, z: 1 },
                { x: 0, y: 1, z: 1 },
                { x: 1, y: 1, z: 1 }
            ],
            0xFF0000
        ));
        
        // Z-Shape
        this.polycubes.push(new Polycube(
            "z4",
            "Z-Tetracube",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 1, y: 1, z: 0 },
                { x: 2, y: 1, z: 0 }
            ],
            0x00FF00
        ));
        
        // 3D L-Shape
        this.polycubes.push(new Polycube(
            "l3d",
            "3D L-Shape",
            [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 2, y: 0, z: 1 }
            ],
            0x8800FF
        ));
    },
    
    // Get a random polycube from the library
    getRandomPolycube() {
        const randomIndex = Math.floor(Math.random() * this.polycubes.length);
        return this.polycubes[randomIndex].clone();
    },
    
    // Create a "bag" of polycubes for fair distribution
    createBag() {
        const bag = [...this.polycubes];
        
        // Shuffle the bag
        for (let i = bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        
        return bag.map(polycube => polycube.clone());
    }
}; 