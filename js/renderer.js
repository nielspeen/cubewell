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
        
        // Block rotation animation properties
        this.animationState = {
            rotating: false,
            startRotation: new THREE.Euler(),
            targetRotation: new THREE.Euler(),
            startTime: 0,
            duration: 200, // milliseconds for rotation animation
            axis: null,
            angle: 0,
            lastAppliedRotation: new THREE.Euler(0, 0, 0) // Track the last applied rotation
        };
        
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
        if (this.debug) console.log("Renderer.init() - Initializing renderer with pit:", pit);
        
        if (!pit) {
            console.error("No pit provided to renderer.init()!");
            return;
        }
        
        this.pit = pit;
        this.game = game;  // Store reference to the game for checking deliberate rotations
        
        // Clean up any existing elements
        this._clearScene();
        
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
        
        // Force a first render
        this.renderer.render(this.scene, this.camera);
        if (this.previewRenderer) {
            this.previewRenderer.render(this.previewScene, this.previewCamera);
        }
        
        if (this.debug) {
            console.log(`Pit dimensions: ${pit.width} x ${pit.depth} x ${pit.height}`);
            console.log(`Camera position:`, this.camera.position);
            console.log(`Pit mesh position:`, this.pitMesh ? this.pitMesh.position : "No pit mesh");
            
            // Additional debug - check if there are any objects in the scene
            console.log(`Scene objects: ${this.scene.children.length}`);
            this.scene.children.forEach((child, index) => {
                console.log(`Scene child ${index}:`, child.type, child.position);
            });
        }
    }
    
    // Set up Three.js scene, camera, and renderer
    _setupThreeJs() {
        console.log("Setting up Three.js environment");
        
        // Main scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.colors.background);
        
        // Create a perspective camera
        const aspect = this.canvasContainer ? 
            (this.canvasContainer.clientWidth / this.canvasContainer.clientHeight) : 
            window.innerWidth / window.innerHeight;
            
        console.log("Canvas container:", this.canvasContainer ? 
            `${this.canvasContainer.clientWidth}x${this.canvasContainer.clientHeight}` : 
            "Not found, using window dimensions");
            
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        
        // Position the camera for a good 3D view of the pit
        // X is left/right, Y is forward/backward, Z is up/down
        this.camera.position.set(0, 0, 18);  // Positioned directly above the pit
        this.camera.lookAt(0, 0, 0);         // Looking straight down into the pit
        
        if (this.debug) {
            console.log("Camera position set to:", this.camera.position);
            console.log("Camera looking at: 0, 0, 0");
        }
        
        // Create the renderer
        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            
            // Check if container exists, otherwise use document.body
            if (!this.canvasContainer) {
                console.warn("Canvas container not found, creating fallback container");
                this.canvasContainer = document.createElement('div');
                this.canvasContainer.id = 'canvas-container-fallback';
                this.canvasContainer.style.width = '100%';
                this.canvasContainer.style.height = '400px';
                document.body.appendChild(this.canvasContainer);
            }
            
            const width = this.canvasContainer.clientWidth || 800;
            const height = this.canvasContainer.clientHeight || 600;
            
            this.renderer.setSize(width, height);
            this.renderer.shadowMap.enabled = true;
            
            // Add to DOM
            this.canvasContainer.innerHTML = ''; // Clear any existing content
            this.canvasContainer.appendChild(this.renderer.domElement);
            
            console.log(`Renderer created with size ${width}x${height}`);
        } catch (e) {
            console.error("Failed to create WebGL renderer:", e);
        }
        
        // Preview scene - add error handling
        try {
            this.previewScene = new THREE.Scene();
            this.previewScene.background = new THREE.Color(this.colors.background);
            
            // Preview camera
            this.previewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
            this.previewCamera.position.set(3, -3, 5);
            this.previewCamera.lookAt(0, 0, 0);
            
            // Preview renderer
            if (this.previewContainer) {
                this.previewRenderer = new THREE.WebGLRenderer({ antialias: true });
                this.previewRenderer.setSize(100, 100);
                
                // Add preview to DOM
                this.previewContainer.innerHTML = ''; // Clear any existing content
                this.previewContainer.appendChild(this.previewRenderer.domElement);
                
                console.log("Preview renderer created");
            } else {
                console.warn("Preview container not found, skipping preview renderer");
            }
        } catch (e) {
            console.error("Failed to create preview renderer:", e);
        }
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
        // Ambient light - slightly reduced to allow directional lights to create shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.previewScene.add(ambientLight.clone());
        
        // Main overhead light - more focused on the pit
        const topLight = new THREE.SpotLight(0xffffff, 1.2);
        topLight.position.set(0, 0, 20);  // Positioned above the pit
        topLight.angle = Math.PI / 4;     // Narrower angle for more focused light
        topLight.penumbra = 0.2;          // Soft edges
        topLight.castShadow = true;
        topLight.shadow.mapSize.width = 1024;
        topLight.shadow.mapSize.height = 1024;
        this.scene.add(topLight);
        
        // Side lights to provide dimension and help see the 3D structure
        // Front-right light with warmer tone
        const frontLight = new THREE.DirectionalLight(0xffffcc, 0.7);
        frontLight.position.set(8, -8, 12);
        this.scene.add(frontLight);
        
        // Back-left light with cooler tone
        const backLight = new THREE.DirectionalLight(0xccffff, 0.7);
        backLight.position.set(-8, 8, 12);
        this.scene.add(backLight);
        
        // Lower side light to illuminate the pit walls
        const sideLight = new THREE.DirectionalLight(0xffffee, 0.5);
        sideLight.position.set(15, 0, 5);
        this.scene.add(sideLight);
        
        // Preview light
        const previewLight = new THREE.DirectionalLight(0xffffff, 0.8);
        previewLight.position.set(3, 5, 3);
        this.previewScene.add(previewLight);
    }
    
    // Set up the pit visualization
    _setupPit() {
        if (!this.pit) {
            console.error("Cannot setup pit - this.pit is null");
            return;
        }
        
        console.log("Setting up pit visualization with dimensions:", 
            this.pit.width, this.pit.depth, this.pit.height);
        
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
            opacity: 0.4,  // More visible but still transparent
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
        
        console.log("Creating pit walls...");
        
        // Create each wall
        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
            const mesh = new THREE.Mesh(geometry, wall.material || wallMaterial);
            mesh.position.set(wall.position[0], wall.position[1], wall.position[2]);
            this.pitMesh.add(mesh);
        });
        
        // Add more visible grid lines for bottom
        const gridHelper = new THREE.GridHelper(Math.max(width, depth), Math.max(width, depth), 0xFFFFFF, 0x888888);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = -0.04;  // Slightly above bottom for visibility
        this.pitMesh.add(gridHelper);
        
        // Add grid lines on the walls to emphasize 3D structure
        // Back wall grid (Y axis)
        const backGridHelper = new THREE.GridHelper(Math.max(width, height), Math.max(width, height), 0xFFFFFF, 0x888888);
        backGridHelper.rotation.x = 0; // No rotation needed
        backGridHelper.position.set(0, depth / 2 + 0.05, height / 2);
        this.pitMesh.add(backGridHelper);
        
        // Side wall grid (X axis)
        const sideGridHelper = new THREE.GridHelper(Math.max(depth, height), Math.max(depth, height), 0xFFFFFF, 0x888888);
        sideGridHelper.rotation.z = Math.PI / 2; // Rotate to be vertical on side wall
        sideGridHelper.position.set(width / 2 + 0.05, 0, height / 2);
        this.pitMesh.add(sideGridHelper);
        
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
        
        // Center the pit in the scene
        this.pitMesh.position.set(0, 0, 0);
        this.scene.add(this.pitMesh);
        
        console.log("Pit visualization complete, added to scene");
        
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
        
        // Update any animations
        this._updateAnimations();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
        
        // Render the preview scene if it exists
        if (this.previewRenderer && this.previewScene && this.previewCamera) {
            this.previewRenderer.render(this.previewScene, this.previewCamera);
        }
    }
    
    // Update animations
    _updateAnimations() {
        // Handle block rotation animation
        if (this.animationState.rotating && this.currentBlockMesh) {
            const now = Date.now();
            const elapsed = now - this.animationState.startTime;
            const progress = Math.min(elapsed / this.animationState.duration, 1);
            
            if (progress < 1) {
                // Apply eased rotation
                const easedProgress = this._easeInOutQuad(progress);
                
                if (this.animationState.axis) {
                    // Interpolate rotation using axis and angle
                    const currentAngle = this.animationState.angle * easedProgress;
                    const quaternion = new THREE.Quaternion();
                    quaternion.setFromAxisAngle(this.animationState.axis, currentAngle);
                    this.currentBlockMesh.quaternion.copy(quaternion);
                } else {
                    // Fallback to Euler interpolation
                    this.currentBlockMesh.rotation.x = this._lerp(
                        this.animationState.startRotation.x,
                        this.animationState.targetRotation.x,
                        easedProgress
                    );
                    this.currentBlockMesh.rotation.y = this._lerp(
                        this.animationState.startRotation.y,
                        this.animationState.targetRotation.y,
                        easedProgress
                    );
                    this.currentBlockMesh.rotation.z = this._lerp(
                        this.animationState.startRotation.z,
                        this.animationState.targetRotation.z,
                        easedProgress
                    );
                }
                
                // Force render for smoother animation
                this.renderer.render(this.scene, this.camera);
            } else {
                // Animation complete
                this.animationState.rotating = false;
                
                // Set final rotation
                if (this.animationState.axis) {
                    const finalQuaternion = new THREE.Quaternion();
                    finalQuaternion.setFromAxisAngle(this.animationState.axis, this.animationState.angle);
                    this.currentBlockMesh.quaternion.copy(finalQuaternion);
                } else {
                    this.currentBlockMesh.rotation.copy(this.animationState.targetRotation);
                }
            }
        }
        
        // Rotate the preview block for better visibility
        if (this.previewBlockMesh) {
            this.previewBlockMesh.rotation.y += 0.01;
        }
        
        // Update spotlight helper if it exists
        if (this.blockSpotlightHelper) {
            this.blockSpotlightHelper.update();
        }
    }
    
    // Easing function for smoother animation
    _easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    // Linear interpolation helper
    _lerp(start, end, t) {
        return start * (1 - t) + end * t;
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
            console.log("Removing current block (null block passed)");
            if (this.currentBlockMesh) {
                this.scene.remove(this.currentBlockMesh);
                this.currentBlockMesh = null;
            }
            return;
        }
        
        console.log("Setting current block:", {
            id: block.id,
            name: block.name,
            position: block.position,
            numCubes: block.cubes ? block.cubes.length : 'no cubes'
        });
        
        // Check if the block is valid
        if (!block.cubes || !Array.isArray(block.cubes) || block.cubes.length === 0) {
            console.error("Invalid block - missing or empty cubes array:", block);
            return;
        }
        
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
        
        console.log("Added currentBlockMesh to scene:", {
            numChildren: this.currentBlockMesh.children.length
        });
        
        // Initialize the last applied rotation to the block's current rotation
        if (block) {
            this.animationState.lastAppliedRotation.set(
                block.rotation.x,
                block.rotation.y,
                block.rotation.z
            );
        }
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
        
        // Skip if we're in the middle of an animation
        if (this.animationState.rotating) {
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
        
        // ONLY animate rotations when deliberately initiated by the user
        // This is the key part that prevents unwanted rotations
        const isDeliberateRotation = this.game && this.game.isDeliberateRotation;
        
        if (isDeliberateRotation) {
            // Start rotation animation for deliberate user rotations only
            this._startRotationAnimation(block);
            
            // Update last applied rotation to prevent repeats
            this.animationState.lastAppliedRotation.set(
                block.rotation.x,
                block.rotation.y,
                block.rotation.z
            );
        } else {
            // Just update rotation directly without animation
            // For any non-deliberate updates, including falling and position changes
            if (block.getRotationMatrix) {
                // Use rotation matrix if available (more accurate)
                const rotMatrix = block.getRotationMatrix();
                if (rotMatrix) {
                    this.currentBlockMesh.quaternion.setFromRotationMatrix(rotMatrix);
                }
            } else {
                // Direct rotation update
                this.currentBlockMesh.rotation.set(
                    block.rotation.x,
                    block.rotation.y,
                    block.rotation.z
                );
            }
            
            // Update last applied rotation to prevent future animations
            this.animationState.lastAppliedRotation.set(
                block.rotation.x,
                block.rotation.y,
                block.rotation.z
            );
        }
    }
    
    // Start rotation animation for the current block
    _startRotationAnimation(block) {
        // Determine rotation axis and angle based on what changed
        let axis = null, angle = 0;
        
        // Store the current rotation as the starting point
        this.animationState.startRotation.copy(this.currentBlockMesh.rotation);
        
        // Save the target rotation
        this.animationState.targetRotation.set(
            block.rotation.x,
            block.rotation.y,
            block.rotation.z
        );
        
        // Calculate the differences for each axis
        const diffX = Math.abs(block.rotation.x - this.animationState.startRotation.x);
        const diffY = Math.abs(block.rotation.y - this.animationState.startRotation.y);
        const diffZ = Math.abs(block.rotation.z - this.animationState.startRotation.z);
        
        // Use a higher threshold to prevent tiny unintended rotations
        const threshold = 0.1; // Radians (~5.7 degrees)
        
        // Only rotate on the axis with the largest change, if it exceeds the threshold
        if (diffX > threshold && diffX >= diffY && diffX >= diffZ) {
            axis = new THREE.Vector3(1, 0, 0);
            angle = block.rotation.x - this.animationState.startRotation.x;
            
            // Reset other rotations to avoid compound rotations
            this.animationState.targetRotation.y = this.animationState.startRotation.y;
            this.animationState.targetRotation.z = this.animationState.startRotation.z;
            
        } else if (diffY > threshold && diffY >= diffX && diffY >= diffZ) {
            axis = new THREE.Vector3(0, 1, 0);
            angle = block.rotation.y - this.animationState.startRotation.y;
            
            // Reset other rotations
            this.animationState.targetRotation.x = this.animationState.startRotation.x;
            this.animationState.targetRotation.z = this.animationState.startRotation.z;
            
        } else if (diffZ > threshold && diffZ >= diffX && diffZ >= diffY) {
            axis = new THREE.Vector3(0, 0, 1);
            angle = block.rotation.z - this.animationState.startRotation.z;
            
            // Reset other rotations
            this.animationState.targetRotation.x = this.animationState.startRotation.x;
            this.animationState.targetRotation.y = this.animationState.startRotation.y;
        } else {
            // No significant rotation detected, skip animation
            if (this.debug) console.log("No significant rotation detected, skipping animation");
            return;
        }
        
        // Check if angle is close to a standard 90-degree rotation (±small error margin)
        const isStandardRotation = Math.abs(Math.abs(angle) - Math.PI/2) < 0.1;
        
        if (!isStandardRotation) {
            if (this.debug) console.log("Non-standard rotation angle, adjusting to nearest 90°");
            // Round to nearest 90 degrees (π/2 radians)
            angle = Math.sign(angle) * Math.PI/2;
        }
        
        // Set the animation state
        this.animationState.rotating = true;
        this.animationState.startTime = Date.now();
        this.animationState.axis = axis;
        this.animationState.angle = angle;
        
        if (this.debug) {
            console.log("Starting rotation animation:", {
                axis: axis ? `${axis.x},${axis.y},${axis.z}` : 'none',
                angle: angle,
                diffX: diffX,
                diffY: diffY,
                diffZ: diffZ,
                from: `${this.animationState.startRotation.x}, ${this.animationState.startRotation.y}, ${this.animationState.startRotation.z}`,
                to: `${this.animationState.targetRotation.x}, ${this.animationState.targetRotation.y}, ${this.animationState.targetRotation.z}`
            });
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

    /**
     * Force a refresh of the renderer display
     * Call this when the game state changes and UI needs updating
     */
    refreshDisplay() {
        if (!this.scene || !this.camera || !this.renderer) {
            console.warn("Cannot refresh display - renderer not fully initialized");
            return;
        }
        
        // Force an immediate render
        this.renderer.render(this.scene, this.camera);
        
        // Update preview if available
        if (this.previewScene && this.previewCamera && this.previewRenderer) {
            this.previewRenderer.render(this.previewScene, this.previewCamera);
        }
        
        console.log("Renderer display refreshed");
    }

    /**
     * Update the current block visualization
     * @param {THREE.Object3D} block - The block object to visualize
     */
    _updateCurrentBlockMesh() {
        if (!this.currentBlock || !this.currentBlockMesh) {
            console.warn("Cannot update current block mesh - no block or mesh found");
            return;
        }
        
        // Clear existing mesh
        this.currentBlockMesh.clear();
        
        // Get the block position
        const pos = this.currentBlock.position;
        
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
        
        // ONLY animate rotations when deliberately initiated by the user
        // This is the key part that prevents unwanted rotations
        const isDeliberateRotation = this.game && this.game.isDeliberateRotation;
        
        if (isDeliberateRotation) {
            // Start rotation animation for deliberate user rotations only
            this._startRotationAnimation(this.currentBlock);
            
            // Update last applied rotation to prevent repeats
            this.animationState.lastAppliedRotation.set(
                this.currentBlock.rotation.x,
                this.currentBlock.rotation.y,
                this.currentBlock.rotation.z
            );
        } else {
            // Just update rotation directly without animation
            // For any non-deliberate updates, including falling and position changes
            if (this.currentBlock.getRotationMatrix) {
                // Use rotation matrix if available (more accurate)
                const rotMatrix = this.currentBlock.getRotationMatrix();
                if (rotMatrix) {
                    this.currentBlockMesh.quaternion.setFromRotationMatrix(rotMatrix);
                }
            } else {
                // Direct rotation update
                this.currentBlockMesh.rotation.set(
                    this.currentBlock.rotation.x,
                    this.currentBlock.rotation.y,
                    this.currentBlock.rotation.z
                );
            }
            
            // Update last applied rotation to prevent future animations
            this.animationState.lastAppliedRotation.set(
                this.currentBlock.rotation.x,
                this.currentBlock.rotation.y,
                this.currentBlock.rotation.z
            );
        }
    }
}

export default Renderer; 