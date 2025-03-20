/**
 * Polycubes.js
 * Defines the 3D block shapes (polycubes) for the game
 */

class Polycube {
    constructor(id, name, cubes, colorIndex) {
        this.id = id;
        this.name = name;
        this.cubes = cubes; // Array of positions relative to pivot: [{x, y, z}, ...]
        this.colorIndex = colorIndex; // Index into the colors array
        this.mesh = null; // Will hold the Three.js mesh
        this.position = { x: 0, y: 0, z: 0 }; // Current position in the pit
        this.rotation = { x: 0, y: 0, z: 0 }; // Current rotation
    }

    // Clone this polycube to create a new instance
    clone() {
        const newCubes = this.cubes.map(cube => ({ x: cube.x, y: cube.y, z: cube.z }));
        return new Polycube(this.id, this.name, newCubes, this.colorIndex);
    }

    // Get the world positions of all cubes in this polycube
    getWorldPositions() {
        // Apply rotation and translation to each cube
        return this.cubes.map(cube => {
            // Apply rotation matrices
            const rotated = this._applyRotation(cube);
            return {
                x: Math.round(rotated.x + this.position.x),
                y: Math.round(rotated.y + this.position.y),
                z: Math.round(rotated.z + this.position.z),
                colorIndex: this.colorIndex
            };
        });
    }

    // Apply current rotation to a cube position
    _applyRotation(cube) {
        // Use proper 3D rotation matrices
        let x = cube.x;
        let y = cube.y;
        let z = cube.z;
        
        // Apply rotations in X, Y, Z order
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

    // Get the rotation as a THREE.Matrix4 for Three.js
    getRotationMatrix() {
        // Create a new rotation matrix
        const matrix = new THREE.Matrix4();
        
        // Create individual rotation matrices
        const rotX = new THREE.Matrix4().makeRotationX(this.rotation.x);
        const rotY = new THREE.Matrix4().makeRotationY(this.rotation.y);
        const rotZ = new THREE.Matrix4().makeRotationZ(this.rotation.z);
        
        // Combine rotations (in X, Y, Z order)
        matrix.multiply(rotZ).multiply(rotY).multiply(rotX);
        
        return matrix;
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
            0 // colorIndex
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
            1 // colorIndex
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
            2 // colorIndex
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
            3 // colorIndex
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
            4 // colorIndex
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
            5 // colorIndex
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
            6 // colorIndex
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