/**
 * Renderer.js
 * Handles the 3D rendering of the game using Three.js
 */

class Renderer {
    constructor(canvasContainer, previewContainer) {
        // Container elements
        this.canvasContainer = canvasContainer || document.getElementById('canvas-container');
        this.previewContainer = previewContainer || document.getElementById('preview-container');
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.previewScene = null;
        this.previewCamera = null;
        this.previewRenderer = null;
        
        // Game objects
        this.pit = null;
        this.game = null;
        this.currentBlock = null;
        this.nextBlock = null;
        
        // Object meshes
        this.pitMesh = null;
        this.blockMeshes = [];  // All placed blocks
        this.currentBlockMesh = null;
        this.previewBlockMesh = null;
        
        // Materials and geometries
        this.cubeGeometry = null;
        this.pitMaterial = null;
        
        // Lighting
        this.lights = [];
        
        // Animation frame
        this.animationFrame = null;
        
        // Debug mode
        this.debug = true;
        
        // Cube size (for scaling)
        this.cubeSize = 1.0;
        
        // Colors for blocks and the pit
        this.colors = {
            background: 0x111111,
            pit: 0x444444,
            pitEdge: 0x666666,
            wireframe: 0xaaaaaa,
            blockColors: [
                0xff4444, // red
                0x44ff44, // green
                0x4444ff, // blue
                0xffff44, // yellow
                0xff44ff, // magenta
                0x44ffff, // cyan
                0xff8844, // orange
            ]
        };
    }
    
    // Initialize the renderer with game objects
    init(pit, game) {
        if (this.debug) console.log("Renderer.init() - Initializing renderer");
        
        this.pit = pit;
        this.game = game;
        
        this._setupThreeJs();
        this._setupMaterials();
        this._setupLights();
        this._setupPit();
        this._setupPreview();
        
        // Start the render loop
        this._animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this._handleResize());
        this._handleResize();
        
        if (this.debug) {
            console.log(`Pit dimensions: ${pit.width} x ${pit.depth} x ${pit.height}`);
            console.log(`Camera position:`, this.camera.position);
            console.log(`Pit mesh position:`, this.pitMesh.position);
        }
    }
    
    // Set up Three.js scene, camera, and renderer
    _setupThreeJs() {
        // Main scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.colors.background);
        
        // Create a perspective camera
        const aspect = this.canvasContainer.clientWidth / this.canvasContainer.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        
        // Position the camera directly above the pit looking down
        // Like looking into the trunk of an SUV
        this.camera.position.set(0, 0, 15);  // Centered above the pit
        this.camera.lookAt(0, 0, 0);         // Looking straight down into the pit
        
        if (this.debug) {
            console.log("Camera position set to:", this.camera.position);
            console.log("Camera looking at: 0, 0, 0");
        }
        
        // Create the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.canvasContainer.clientWidth, this.canvasContainer.clientHeight);
        this.renderer.shadowMap.enabled = true;
        
        // Add to DOM
        this.canvasContainer.appendChild(this.renderer.domElement);
        
        // Preview scene
        this.previewScene = new THREE.Scene();
        this.previewScene.background = new THREE.Color(this.colors.background);
        
        // Preview camera
        this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        this.previewCamera.position.set(0, 0, 5);
        this.previewCamera.lookAt(0, 0, 0);
        
        // Preview renderer
        this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.previewRenderer.setSize(100, 100);
        
        // Add preview to DOM
        this.previewContainer.appendChild(this.previewRenderer.domElement);
    }
    
    // Set up materials and geometries
    _setupMaterials() {
        // Cube geometry for blocks
        this.cubeGeometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        
        // Material for pit walls
        this.pitMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.pit,
            transparent: true,
            opacity: 0.3
        });
    }
    
    // Set up lights
    _setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        this.previewScene.add(ambientLight.clone());
        
        // Main overhead light for top-down view
        const topLight = new THREE.SpotLight(0xffffff, 1.0);
        topLight.position.set(0, 0, 18);  // Positioned above the pit
        topLight.angle = Math.PI / 4;     // Narrower angle for more focused light
        topLight.penumbra = 0.2;          // Soft edges
        topLight.castShadow = true;
        topLight.shadow.mapSize.width = 1024;
        topLight.shadow.mapSize.height = 1024;
        this.scene.add(topLight);
        
        // Side lights to provide dimension and help see the blocks better
        const sideLight1 = new THREE.DirectionalLight(0xffffcc, 0.6);
        sideLight1.position.set(5, 5, 10);
        this.scene.add(sideLight1);
        
        const sideLight2 = new THREE.DirectionalLight(0xccffff, 0.6);
        sideLight2.position.set(-5, -5, 10);
        this.scene.add(sideLight2);
        
        // Preview light
        const previewLight = new THREE.DirectionalLight(0xffffff, 0.8);
        previewLight.position.set(3, 5, 3);
        this.previewScene.add(previewLight);
    }
    
    // Set up the pit visualization
    _setupPit() {
        if (!this.pit) return;
        
        // Create a group for the pit
        this.pitMesh = new THREE.Group();
        
        // Width, depth, height from the pit
        const width = this.pit.width;
        const depth = this.pit.depth;
        const height = this.pit.height;
        
        // Center the pit
        const offsetX = -width / 2;
        const offsetY = -depth / 2;
        const offsetZ = 0;
        
        // Create walls with clear but visible material
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: 0x4488CC,
            transparent: true,
            opacity: 0.3,  // More transparent
            side: THREE.DoubleSide
        });
        
        // Create a darker bottom for better contrast with blocks
        const bottomMaterial = new THREE.MeshLambertMaterial({
            color: 0x222233,
            transparent: false,
            opacity: 1.0
        });
        
        // Create walls to make the pit visible
        const walls = [
            // Bottom (now darker)
            { size: [width, depth, 0.1], position: [0, 0, offsetZ - 0.05], material: bottomMaterial },
            
            // Sides
            { size: [0.1, depth, height], position: [offsetX - 0.05, 0, height / 2 + offsetZ], material: wallMaterial },
            { size: [0.1, depth, height], position: [width + offsetX + 0.05, 0, height / 2 + offsetZ], material: wallMaterial },
            { size: [width, 0.1, height], position: [0, offsetY - 0.05, height / 2 + offsetZ], material: wallMaterial },
            { size: [width, 0.1, height], position: [0, depth + offsetY + 0.05, height / 2 + offsetZ], material: wallMaterial }
        ];
        
        // Create each wall
        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
            const mesh = new THREE.Mesh(geometry, wall.material || wallMaterial);
            mesh.position.set(wall.position[0], wall.position[1], wall.position[2]);
            this.pitMesh.add(mesh);
        });
        
        // Add more visible grid lines for a top-down view
        const gridHelper = new THREE.GridHelper(Math.max(width, depth), Math.max(width, depth), 0xFFFFFF, 0x888888);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = -0.04;  // Slightly above bottom for visibility
        this.pitMesh.add(gridHelper);
        
        // Add grid cell numbers for better orientation
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < depth; y++) {
                // Skip center cells to avoid cluttering
                if (x === Math.floor(width/2) && y === Math.floor(depth/2)) continue;
                
                // Create a small indicator at each grid cell
                const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const markerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x888888,
                    transparent: true,
                    opacity: 0.7
                });
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                
                const posX = x - (width / 2) + 0.5;
                const posY = y - (depth / 2) + 0.5;
                marker.position.set(posX, posY, -0.03);  // Just above the bottom
                this.pitMesh.add(marker);
            }
        }
        
        // Add a central marker at the spawn point for better orientation
        const startX = Math.floor(this.pit.width / 2) - 1;
        const startY = Math.floor(this.pit.depth / 2) - 1;
        const startZ = this.pit.height - 1;
        
        const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        const posX = startX - (width / 2) + 0.5;
        const posY = startY - (depth / 2) + 0.5;
        const posZ = startZ + 0.5;
        
        marker.position.set(posX, posY, posZ);
        this.scene.add(marker);
        
        console.log(`Added marker at spawn point: ${posX}, ${posY}, ${posZ}`);
        
        // Center the pit in the scene
        this.pitMesh.position.set(0, 0, 0);
        this.scene.add(this.pitMesh);
        
        // Add a visible axis helper to debug coordinate system
        if (this.debug) {
            const axisHelper = new THREE.AxesHelper(5);
            this.scene.add(axisHelper);
        }
        
        if (this.debug) {
            console.log('Pit dimensions:', width, depth, height);
            console.log('Pit position:', this.pitMesh.position);
        }
    }
    
    // Set up the preview display
    _setupPreview() {
        // Add a simple platform
        const platformGeometry = new THREE.BoxGeometry(3, 3, 0.2);
        const platformMaterial = new THREE.MeshStandardMaterial({ color: this.colors.pit });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 0, -0.5);
        this.previewScene.add(platform);
    }
    
    // Handle window resize
    _handleResize() {
        if (!this.renderer || !this.camera) return;
        
        // Update main renderer
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;
        
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Preview doesn't need resizing as it's fixed size
    }
    
    // Animation loop
    _animate() {
        this.animationFrame = requestAnimationFrame(() => this._animate());
        
        // Rotate the preview block for better visibility
        if (this.previewBlockMesh) {
            this.previewBlockMesh.rotation.y += 0.01;
        }
        
        // Update spotlight helper if it exists
        if (this.blockSpotlightHelper) {
            this.blockSpotlightHelper.update();
        }
        
        // Render the scenes
        this.renderer.render(this.scene, this.camera);
        this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
    
    // Clear all meshes from the scene
    _clearScene() {
        // Remove all block meshes
        this.blockMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.blockMeshes = [];
        
        // Remove current block mesh
        if (this.currentBlockMesh) {
            this.scene.remove(this.currentBlockMesh);
            this.currentBlockMesh = null;
        }
    }
    
    // Update the renderer with the current state of the pit
    updatePit(pit) {
        if (this.debug) console.log("Updating pit visualization");
        
        if (!pit) return;
        this.pit = pit;
        
        // Clear all existing block meshes
        this._clearScene();
        
        // Get all filled positions
        const filled = pit.getFilledPositions();
        
        if (this.debug) {
            console.log(`Rendering ${filled.length} filled positions`);
        }
        
        // Create new meshes for each filled position
        filled.forEach(item => {
            const { position, data } = item;
            
            // Create a cube mesh with emissive material to make it glow slightly
            const material = new THREE.MeshLambertMaterial({ 
                color: this.colors.blockColors[data.colorIndex],
                emissive: this.colors.blockColors[data.colorIndex],
                emissiveIntensity: 0.2
            });
            
            const mesh = new THREE.Mesh(this.cubeGeometry, material);
            
            // Add wireframe for better visibility
            const wireframe = new THREE.LineSegments(
                new THREE.EdgesGeometry(this.cubeGeometry),
                new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 })
            );
            mesh.add(wireframe);
            
            // Position with offset to center the pit
            mesh.position.set(
                position.x - (pit.width / 2) + 0.5,
                position.y - (pit.depth / 2) + 0.5,
                position.z + 0.5
            );
            
            // Add to scene and track
            this.scene.add(mesh);
            this.blockMeshes.push(mesh);
            
            if (this.debug) {
                console.log(`Added fixed block at: ${mesh.position.x}, ${mesh.position.y}, ${mesh.position.z}, color: ${data.colorIndex}`);
            }
        });
    }
    
    // Set and render the current falling block
    setCurrentBlock(block) {
        if (!block) {
            if (this.currentBlockMesh) {
                this.scene.remove(this.currentBlockMesh);
                this.currentBlockMesh = null;
            }
            console.log("Removing current block (null block passed)");
            return;
        }
        
        console.log("Setting current block:", block);
        console.log("Block position:", block.position);
        console.log("Block cubes:", block.cubes);
        
        // Create a new group for the current block mesh
        if (this.currentBlockMesh) {
            this.scene.remove(this.currentBlockMesh);
        }
        
        this.currentBlockMesh = new THREE.Group();
        
        // Get the color for this block
        const colorIndex = block.colorIndex % this.colors.blockColors.length;
        const blockColor = this.colors.blockColors[colorIndex];
        
        // Create a material with the block's color
        const blockMaterial = new THREE.MeshStandardMaterial({
            color: blockColor,
            emissive: blockColor,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Create a wireframe material
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff
        });
        
        // Add cubes for each filled position
        block.cubes.forEach(pos => {
            // Create the cube
            const cube = new THREE.Mesh(this.cubeGeometry, blockMaterial);
            
            // Create wireframe
            const wireframeGeometry = new THREE.EdgesGeometry(this.cubeGeometry);
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            
            // Position the cube
            cube.position.set(pos.x, pos.y, pos.z);
            wireframe.position.copy(cube.position);
            
            // Add to group
            this.currentBlockMesh.add(cube);
            this.currentBlockMesh.add(wireframe);
        });
        
        // Set position based on block position
        this.updateCurrentBlock(block);
        
        // Add to scene
        this.scene.add(this.currentBlockMesh);
        
        console.log("Added currentBlockMesh to scene:", this.currentBlockMesh);
    }
    
    // Update the position of the current block
    updateCurrentBlock(block) {
        if (!block) {
            console.log("Cannot update current block - block is null");
            return;
        }
        
        // If mesh doesn't exist yet, create it first
        if (!this.currentBlockMesh) {
            console.log("Creating block mesh first since it doesn't exist yet");
            this.setCurrentBlock(block);
            return;
        }
        
        // Get the block position
        const pos = block.position;
        
        // Calculate position relative to pit center
        // Add +0.5 offset to x and y coordinates for proper alignment with walls
        const offsetX = -(this.pit.width / 2) + 0.5;
        const offsetY = -(this.pit.depth / 2) + 0.5;
        
        // Set the position of the block mesh
        this.currentBlockMesh.position.set(
            pos.x + offsetX,
            pos.y + offsetY,
            pos.z + 0.5  // Add 0.5 offset to match the fixed blocks
        );
        
        // Apply block rotation
        if (block.getRotationMatrix) {
            const rotMatrix = block.getRotationMatrix();
            if (rotMatrix) {
                this.currentBlockMesh.rotation.setFromRotationMatrix(rotMatrix);
            }
        } else {
            this.currentBlockMesh.rotation.x = block.rotation.x;
            this.currentBlockMesh.rotation.y = block.rotation.y;
            this.currentBlockMesh.rotation.z = block.rotation.z;
        }
    }
    
    // Update the next block preview
    updateNextBlockPreview(block) {
        if (!block) {
            if (this.previewBlockMesh) {
                this.previewScene.remove(this.previewBlockMesh);
                this.previewBlockMesh = null;
            }
            return;
        }
        
        console.log("Updating next block preview:", block);
        
        // Create a new group for the preview mesh
        if (this.previewBlockMesh) {
            this.previewScene.remove(this.previewBlockMesh);
        }
        
        this.previewBlockMesh = new THREE.Group();
        
        // Get the color for this block
        const colorIndex = block.colorIndex % this.colors.blockColors.length;
        const blockColor = this.colors.blockColors[colorIndex];
        
        // Create a material with the block's color
        const blockMaterial = new THREE.MeshStandardMaterial({
            color: blockColor,
            emissive: blockColor,
            emissiveIntensity: 0.4
        });
        
        // Create a wireframe material
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff
        });
        
        // Add cubes for each filled position using block.cubes
        block.cubes.forEach(pos => {
            // Create the cube
            const cube = new THREE.Mesh(this.cubeGeometry, blockMaterial);
            
            // Create wireframe
            const wireframeGeometry = new THREE.EdgesGeometry(this.cubeGeometry);
            const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
            
            // Position the cube
            cube.position.set(pos.x, pos.y, pos.z);
            wireframe.position.copy(cube.position);
            
            // Add to group
            this.previewBlockMesh.add(cube);
            this.previewBlockMesh.add(wireframe);
        });
        
        // Center the preview
        const box = new THREE.Box3().setFromObject(this.previewBlockMesh);
        const center = box.getCenter(new THREE.Vector3());
        this.previewBlockMesh.position.sub(center);
        
        // Add to preview scene
        this.previewScene.add(this.previewBlockMesh);
        
        console.log("Added previewBlockMesh to scene:", this.previewBlockMesh);
    }
    
    // Clean up resources
    dispose() {
        // Stop animation loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this._handleResize);
        
        // Dispose of Three.js resources
        this.scene = null;
        this.camera = null;
        
        if (this.renderer) {
            this.renderer.dispose();
            this.canvasContainer.removeChild(this.renderer.domElement);
            this.renderer = null;
        }
        
        if (this.previewRenderer) {
            this.previewRenderer.dispose();
            this.previewContainer.removeChild(this.previewRenderer.domElement);
            this.previewRenderer = null;
        }
    }
}

export default Renderer; 