/**
 * Pit - The 3D grid where blocks are placed
 */
class Pit {
    constructor(width, depth, height) {
        this.width = width;
        this.depth = depth;
        this.height = height;
        
        // Initialize empty grid
        this.grid = new Array(width);
        for (let x = 0; x < width; x++) {
            this.grid[x] = new Array(depth);
            for (let y = 0; y < depth; y++) {
                this.grid[x][y] = new Array(height).fill(null);
            }
        }
        
        // Create Three.js objects
        this.mesh = new THREE.Group();
        this.createPitMesh();
        
        // Placed blocks (for rendering)
        this.placedBlocks = new THREE.Group();
        this.mesh.add(this.placedBlocks);
        
        // Grid visualization and position highlighting
        this.gridLines = new THREE.Group();
        this.mesh.add(this.gridLines);
        this.createGridLines();
        
        // Highlight for current polycube position
        this.positionHighlight = new THREE.Group();
        this.mesh.add(this.positionHighlight);
        
        // Layer clearing animation effects
        this.clearingEffects = new THREE.Group();
        this.mesh.add(this.clearingEffects);
        
        // Track animation state
        this.clearAnimationInProgress = false;
        this.layersToClear = [];
    }
    
    /**
     * Create the visual representation of the pit
     */
    createPitMesh() {
        // We no longer create a wireframe for the pit boundaries
        // The grid lines will provide the visual structure
    }
    
    /**
     * Create grid lines on the walls of the pit
     */
    createGridLines() {
        // Clear any existing grid lines
        while (this.gridLines.children.length > 0) {
            this.gridLines.remove(this.gridLines.children[0]);
        }
        
        // Subtle grid line material
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.PIT_COLOR,
            opacity: 0.3,
            transparent: true
        });
        
        // In the pit creation, we position at (width-1)/2, (depth-1)/2, (height-1)/2
        // So we need to adjust our grid lines to match
        
        // Back wall (y = depth)
        for (let x = 0; x <= this.width; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - 0.5, this.depth - 0.5, -0.5),
                new THREE.Vector3(x - 0.5, this.depth - 0.5, this.height - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        for (let z = 0; z <= this.height; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, this.depth - 0.5, z - 0.5),
                new THREE.Vector3(this.width - 0.5, this.depth - 0.5, z - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        // Left wall (x = 0)
        for (let y = 0; y <= this.depth; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, y - 0.5, -0.5),
                new THREE.Vector3(-0.5, y - 0.5, this.height - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        for (let z = 0; z <= this.height; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, -0.5, z - 0.5),
                new THREE.Vector3(-0.5, this.depth - 0.5, z - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        // Right wall (x = width)
        for (let y = 0; y <= this.depth; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(this.width - 0.5, y - 0.5, -0.5),
                new THREE.Vector3(this.width - 0.5, y - 0.5, this.height - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        // Add horizontal grid lines for the right wall (missing z-axis)
        for (let z = 0; z <= this.height; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(this.width - 0.5, -0.5, z - 0.5),
                new THREE.Vector3(this.width - 0.5, this.depth - 0.5, z - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        // Front wall (y = 0)
        for (let x = 0; x <= this.width; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - 0.5, -0.5, -0.5),
                new THREE.Vector3(x - 0.5, -0.5, this.height - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
        
        // Add horizontal grid lines for the front wall (missing z-axis)
        for (let z = 0; z <= this.height; z++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, -0.5, z - 0.5),
                new THREE.Vector3(this.width - 0.5, -0.5, z - 0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }

        // Add grid lines to the bottom of the pit
        // Horizontal lines (along x-axis)
        for (let x = 0; x <= this.width; x++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x - 0.5, -0.5, -0.5),
                new THREE.Vector3(x - 0.5, this.depth - 0.5, -0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }

        // Vertical lines (along y-axis)
        for (let y = 0; y <= this.depth; y++) {
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.5, y - 0.5, -0.5),
                new THREE.Vector3(this.width - 0.5, y - 0.5, -0.5)
            ]);
            const line = new THREE.Line(geometry, material);
            this.gridLines.add(line);
        }
    }
    
    /**
     * Highlight the current position of a polycube
     */
    highlightPosition(polycube) {
        // Clear previous highlights
        while (this.positionHighlight.children.length > 0) {
            this.positionHighlight.remove(this.positionHighlight.children[0]);
        }
        
        if (!polycube) return;
        
        // Get world positions of the polycube
        const positions = polycube.getWorldPositions();
        
        // Create highlight material - solid white with slight transparency
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.7,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create grid cell highlights for walls
        for (const [x, y, z] of positions) {
            // Only create highlights for positions that are on the edges of the pit
            
            // Front wall (y = 0)
            if (y === 0) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95); // Slightly smaller to match grid
                const plane = new THREE.Mesh(geometry, material);
                plane.position.set(x, -0.5, z);
                // Rotate to lie flat against the front wall (90 degrees around X axis)
                plane.rotation.set(Math.PI/2, 0, 0);
                this.positionHighlight.add(plane);
            }
            
            // Back wall (y = depth-1)
            if (y === this.depth - 1) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, material);
                plane.position.set(x, this.depth - 0.5, z);
                // Rotate to lie flat against the back wall (negative 90 degrees around X axis)
                plane.rotation.set(-Math.PI/2, 0, 0);
                this.positionHighlight.add(plane);
            }
            
            // Left wall (x = 0)
            if (x === 0) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, material);
                plane.position.set(-0.5, y, z);
                // Rotate to lie flat against the left wall
                plane.rotation.set(0, Math.PI / 2, 0);
                this.positionHighlight.add(plane);
            }
            
            // Right wall (x = width-1)
            if (x === this.width - 1) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, material);
                plane.position.set(this.width - 0.5, y, z);
                // Rotate to lie flat against the right wall
                plane.rotation.set(0, -Math.PI / 2, 0);
                this.positionHighlight.add(plane);
            }
            
            // Also highlight all positions to help with visibility - project to all walls
            // This helps see blocks that aren't directly touching a wall
            
            // Project to left wall
            if (x > 0) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3, // Lower opacity for projected highlights
                    transparent: true,
                    side: THREE.DoubleSide
                }));
                plane.position.set(-0.5, y, z);
                // Rotate to lie flat against the left wall
                plane.rotation.set(0, Math.PI / 2, 0);
                this.positionHighlight.add(plane);
            }
            
            // Project to right wall
            if (x < this.width - 1) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3,
                    transparent: true,
                    side: THREE.DoubleSide
                }));
                plane.position.set(this.width - 0.5, y, z);
                // Rotate to lie flat against the right wall
                plane.rotation.set(0, -Math.PI / 2, 0);
                this.positionHighlight.add(plane);
            }
            
            // Project to front wall
            if (y > 0) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3,
                    transparent: true,
                    side: THREE.DoubleSide
                }));
                plane.position.set(x, -0.5, z);
                // Rotate to lie flat against the front wall (90 degrees around X axis)
                plane.rotation.set(Math.PI/2, 0, 0);
                this.positionHighlight.add(plane);
            }
            
            // Project to back wall
            if (y < this.depth - 1) {
                const geometry = new THREE.PlaneGeometry(0.95, 0.95);
                const plane = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3,
                    transparent: true,
                    side: THREE.DoubleSide
                }));
                plane.position.set(x, this.depth - 0.5, z);
                // Rotate to lie flat against the back wall (negative 90 degrees around X axis)
                plane.rotation.set(-Math.PI/2, 0, 0);
                this.positionHighlight.add(plane);
            }
        }
    }
    
    /**
     * Check if a position is valid (inside the pit and not occupied)
     */
    isValidPosition(x, y, z) {
        return (
            x >= 0 && x < this.width &&
            y >= 0 && y < this.depth &&
            z >= 0 && z < this.height &&
            this.grid[x][y][z] === null
        );
    }
    
    /**
     * Check if a polycube can be placed at its current position and rotation
     */
    canPlacePolycube(polycube) {
        const positions = polycube.getWorldPositions();
        
        for (const [x, y, z] of positions) {
            if (!this.isValidPosition(x, y, z)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Place a polycube in the pit
     */
    placePolycube(polycube) {
        const positions = polycube.getWorldPositions();
        
        // Add each cube of the polycube to the grid
        for (const [x, y, z] of positions) {
            if (x >= 0 && x < this.width && 
                y >= 0 && y < this.depth && 
                z >= 0 && z < this.height) {
                this.grid[x][y][z] = polycube.color;
            } else {
                console.warn('Block placed outside pit bounds', x, y, z);
                return false;
            }
        }
        
        // Add visual blocks to the scene
        this.updateVisualBlocks();
        
        return true;
    }
    
    /**
     * Update the visual representation of placed blocks
     */
    updateVisualBlocks() {
        // Remove all existing blocks
        while (this.placedBlocks.children.length > 0) {
            this.placedBlocks.remove(this.placedBlocks.children[0]);
        }
        
        // Create geometry and materials once for performance
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        const edgeGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0); // Slightly larger for edges
        const materials = {};
        
        // Create white edge material
        const edgeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: CONFIG.BLOCK_OPACITY + 0.1, // Slightly more opaque than the main material
            side: THREE.BackSide // Only render the back faces for edge effect
        });
        
        // Add blocks for all occupied cells
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                for (let z = 0; z < this.height; z++) {
                    const color = this.grid[x][y][z];
                    
                    if (color !== null) {
                        // Create or reuse material with darker bottom face and layer-based tinting
                        if (!materials[color]) {
                            materials[color] = new THREE.MeshLambertMaterial({
                                color: color,
                                transparent: true,
                                opacity: CONFIG.BLOCK_OPACITY,
                                side: THREE.DoubleSide,
                                // Create a custom shader for the bottom face and layer tinting
                                onBeforeCompile: (shader) => {
                                    shader.fragmentShader = shader.fragmentShader.replace(
                                        'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
                                        `
                                        if (vNormal.y < -0.9) { // Bottom face
                                            gl_FragColor = vec4(outgoingLight * 0.5, diffuseColor.a);
                                        } else {
                                            // Add brightness based on height (z position)
                                            float heightFactor = 1.0 + (vPosition.z / ${this.height}) * 0.3; // Up to 30% brighter at top
                                            gl_FragColor = vec4(outgoingLight * heightFactor, diffuseColor.a);
                                        }
                                        `
                                    );
                                }
                            });
                        }
                        
                        // Create the main cube
                        const cube = new THREE.Mesh(geometry, materials[color]);
                        cube.position.set(x, y, z);
                        this.placedBlocks.add(cube);
                        
                        // Add white edges using a larger cube
                        const edges = new THREE.Mesh(edgeGeometry, edgeMaterial);
                        edges.position.set(x, y, z);
                        this.placedBlocks.add(edges);
                    }
                }
            }
        }
    }
    
    /**
     * Check if a layer is complete (all cells filled)
     */
    isLayerComplete(z) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                if (this.grid[x][y][z] === null) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Clear a layer with animation and shift all layers above down
     */
    clearLayerWithAnimation(z, callback) {
        // Get blocks in the layer to animate
        const layerBlocks = [];
        const blockPositions = [];
        const blockColors = [];
        
        // Store block data for animation
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                const color = this.grid[x][y][z];
                if (color !== null) {
                    blockPositions.push([x, y, z]);
                    blockColors.push(color);
                }
            }
        }
        
        // Create animation effect blocks
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
        
        // Create glowing blocks for the flash effect
        for (let i = 0; i < blockPositions.length; i++) {
            const [x, y, z] = blockPositions[i];
            const color = blockColors[i];
            
            // Create a glowing material
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.7
            });
            
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, y, z);
            block.userData.originalColor = color;
            block.userData.originalPos = [x, y, z];
            layerBlocks.push(block);
            this.clearingEffects.add(block);
        }
        
        // Animation sequence:
        // 1. Wave and flash effect
        // 2. Colorful glow
        // 3. Shrink blocks and create enhanced particles
        // 4. Remove layer and shift
        
        // Flash and wave effect
        const flashDuration = 0.6; // seconds
        const startTime = performance.now();
        const centerX = this.width / 2;
        const centerY = this.depth / 2;
        
        const flashAnimation = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(elapsed / flashDuration, 1);
            
            if (progress < 1) {
                // Color transition effect
                const hue = progress * 360; // Full color cycle
                const pulseIntensity = 0.7 + 0.3 * Math.sin(progress * Math.PI * 6);
                
                for (const block of layerBlocks) {
                    // Get distance from center for wave effect
                    const [x, y, z] = block.userData.originalPos;
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                    
                    // Wave effect - blocks rise and fall in a ripple pattern
                    const waveOffset = progress * 6 - distanceFromCenter * 0.8;
                    const waveHeight = 0.2 * Math.sin(waveOffset * Math.PI * 2);
                    block.position.z = z + waveHeight;
                    
                    // Color cycling with HSL
                    const cycleHue = (hue + distanceFromCenter * 30) % 360;
                    block.material.color.setHSL(cycleHue/360, 1, 0.7);
                    block.material.opacity = 0.7 + 0.3 * pulseIntensity;
                    
                    // Scale pulsing
                    const scale = 1 + 0.15 * Math.sin((progress + distanceFromCenter * 0.1) * Math.PI * 6);
                    block.scale.set(scale, scale, scale);
                }
                
                requestAnimationFrame(flashAnimation);
            } else {
                // Flash done, start enhanced particles and shrink
                startShrinkAndParticles();
            }
        };
        
        const startShrinkAndParticles = () => {
            // Create particle system
            const particles = new THREE.Group();
            this.clearingEffects.add(particles);
            
            // Create more particles with better distribution and varied sizes
            for (let i = 0; i < layerBlocks.length; i++) {
                const [x, y, z] = blockPositions[i];
                const color = blockColors[i];
                
                // Create between 8-12 particles per block
                const particleCount = 8 + Math.floor(Math.random() * 5);
                
                for (let j = 0; j < particleCount; j++) {
                    // Varied particle sizes
                    const particleSize = 0.08 + Math.random() * 0.18;
                    
                    // Use different geometries for visual variety
                    let particleGeometry;
                    const geoType = Math.floor(Math.random() * 3);
                    if (geoType === 0) {
                        particleGeometry = new THREE.BoxGeometry(
                            particleSize, particleSize, particleSize
                        );
                    } else if (geoType === 1) {
                        particleGeometry = new THREE.SphereGeometry(particleSize/2, 4, 4);
                    } else {
                        particleGeometry = new THREE.TetrahedronGeometry(particleSize/2);
                    }
                    
                    // Particle with glow effect
                    const particleMaterial = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.9
                    });
                    
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    
                    // Position with slightly more scatter
                    particle.position.set(
                        x + (Math.random() - 0.5) * 0.7,
                        y + (Math.random() - 0.5) * 0.7,
                        z + (Math.random() - 0.5) * 0.7
                    );
                    
                    // More varied velocity for particles
                    const speed = 1 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    const elevation = Math.random() * Math.PI - Math.PI/2;
                    
                    particle.userData.velocity = [
                        speed * Math.cos(angle) * Math.cos(elevation),
                        speed * Math.sin(angle) * Math.cos(elevation),
                        speed * Math.sin(elevation)
                    ];
                    
                    // Add rotation to particles
                    particle.userData.rotation = [
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2,
                        (Math.random() - 0.5) * 0.2
                    ];
                    
                    // Different lifespans for particles
                    particle.userData.lifespan = 0.7 + Math.random() * 0.3;
                    
                    particles.add(particle);
                }
            }
            
            // Shrink and particle animation
            const shrinkDuration = 0.7; // slightly longer
            const shrinkStartTime = performance.now();
            
            const shrinkAndParticlesAnimation = () => {
                const elapsed = (performance.now() - shrinkStartTime) / 1000;
                const progress = Math.min(elapsed / shrinkDuration, 1);
                
                // Shrink the original blocks with improved effect
                for (const block of layerBlocks) {
                    const scale = Math.max(0, 1 - progress * 1.2); // Faster shrink
                    block.scale.set(scale, scale, scale);
                    
                    // Add slight spin during shrink
                    block.rotation.x += 0.03;
                    block.rotation.y += 0.02;
                    
                    // Color fade to white
                    const currentHue = block.material.color.getHSL({h:0, s:0, l:0}).h;
                    block.material.color.setHSL(currentHue, 1 - progress, 0.7 + progress * 0.3);
                    block.material.opacity = Math.max(0, 1 - progress * 1.5);
                }
                
                // Enhanced particle effects
                if (particles) {
                    // Create a list of particles to remove
                    const particlesToRemove = [];
                    
                    for (let i = 0; i < particles.children.length; i++) {
                        const particle = particles.children[i];
                        const velocity = particle.userData.velocity;
                        const rotation = particle.userData.rotation;
                        const particleLifespan = particle.userData.lifespan;
                        
                        // Each particle has its own lifespan
                        const particleProgress = Math.min(elapsed / particleLifespan, 1);
                        
                        // Apply velocity with increasing speed
                        const speedFactor = 0.02 * (1 + particleProgress);
                        particle.position.x += velocity[0] * speedFactor;
                        particle.position.y += velocity[1] * speedFactor;
                        particle.position.z += velocity[2] * speedFactor;
                        
                        // Add rotation to particles
                        particle.rotation.x += rotation[0];
                        particle.rotation.y += rotation[1];
                        particle.rotation.z += rotation[2];
                        
                        // Scale particles down as they move
                        const particleScale = 1 - particleProgress;
                        particle.scale.set(particleScale, particleScale, particleScale);
                        
                        // Fade out particle with slight pulsing
                        const fade = Math.max(0, 1 - particleProgress * 1.2);
                        const pulse = 0.2 * Math.sin(particleProgress * 10);
                        particle.material.opacity = fade + pulse;
                        
                        // Mark particles for removal if they've completed their lifespan
                        if (particleProgress >= 1) {
                            particlesToRemove.push(particle);
                        }
                    }
                    
                    // Remove marked particles after iteration
                    for (const particle of particlesToRemove) {
                        particles.remove(particle);
                    }
                }
                
                if (progress < 1) {
                    requestAnimationFrame(shrinkAndParticlesAnimation);
                } else {
                    // Animation complete - now update the grid
                    
                    // Remove animation objects
                    this.clearingEffects.remove(particles);
                    for (const block of layerBlocks) {
                        this.clearingEffects.remove(block);
                    }
                    
                    // Perform the actual grid update
                    this.clearLayer(z);
                    
                    // Invoke callback when done
                    if (callback) callback();
                }
            };
            
            requestAnimationFrame(shrinkAndParticlesAnimation);
        };
        
        // Start the animation sequence
        requestAnimationFrame(flashAnimation);
    }
    
    /**
     * Clear a layer and shift all layers above down
     */
    clearLayer(z) {
        // Shift all layers above z down by one
        for (let k = z; k < this.height - 1; k++) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.depth; y++) {
                    this.grid[x][y][k] = this.grid[x][y][k + 1];
                }
            }
        }
        
        // Clear the top layer
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                this.grid[x][y][this.height - 1] = null;
            }
        }
        
        // Update visual blocks
        this.updateVisualBlocks();
    }
    
    /**
     * Check for and clear completed layers
     * Returns the number of layers cleared
     */
    checkAndClearLayers(callback) {
        // If animation already in progress, don't start a new one
        if (this.clearAnimationInProgress) {
            return 0;
        }
        
        // Find completed layers
        this.layersToClear = [];
        for (let z = 0; z < this.height; z++) {
            if (this.isLayerComplete(z)) {
                this.layersToClear.push(z);
            }
        }
        
        const layersCount = this.layersToClear.length;
        
        // If layers to clear, start animation
        if (layersCount > 0) {
            this.clearAnimationInProgress = true;
            
            // Add safety timeout to prevent infinite loops
            const safetyTimeout = setTimeout(() => {
                console.warn('Layer clearing animation timed out - forcing completion');
                this.clearAnimationInProgress = false;
                if (callback) callback(layersCount);
            }, 5000); // 5 second timeout
            
            // Process one layer at a time with animation
            const processNextLayer = () => {
                if (this.layersToClear.length > 0) {
                    const z = this.layersToClear.shift();
                    // Adjust z index for layers that have already been cleared
                    const adjustedZ = z - (layersCount - this.layersToClear.length - 1);
                    this.clearLayerWithAnimation(adjustedZ, () => {
                        clearTimeout(safetyTimeout); // Clear timeout on successful completion
                        processNextLayer();
                    });
                } else {
                    // All layers processed
                    clearTimeout(safetyTimeout); // Clear timeout on successful completion
                    this.clearAnimationInProgress = false;
                    if (callback) callback(layersCount);
                }
            };
            
            // Start processing layers
            processNextLayer();
        } else if (callback) {
            // No layers to clear, but still call callback with 0
            callback(0);
        }
        
        return layersCount;
    }
    
    /**
     * Check if the game is over (blocks reach the top)
     */
    isGameOver(nextPolycube) {
        // Position the next polycube at the top center
        nextPolycube.position = [
            Math.floor(this.width / 2), 
            Math.floor(this.depth / 2), 
            this.height - 1
        ];
        
        // Try to place it - if can't place, game over
        return !this.canPlacePolycube(nextPolycube);
    }
    
    /**
     * Check if the pit is completely empty (all cells null)
     * This can be used for special bonuses or effects
     */
    isPitEmpty() {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                for (let z = 0; z < this.height; z++) {
                    if (this.grid[x][y][z] !== null) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * Reset the pit for a new game
     */
    reset() {
        // Clear the grid
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.depth; y++) {
                for (let z = 0; z < this.height; z++) {
                    this.grid[x][y][z] = null;
                }
            }
        }
        
        // Reset visual blocks
        this.updateVisualBlocks();
    }
} 