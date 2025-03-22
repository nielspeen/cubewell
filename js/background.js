/**
 * DynamicBackground - Creates a starfield effect
 */
class DynamicBackground {
    constructor(scene) {
        this.scene = scene;
        this.stars = [];
        this.isActive = false;  // Start inactive
        
        // Create initial stars but don't add them to scene yet
        for (let i = 0; i < CONFIG.STARFIELD.INITIAL_STARS; i++) {
            this.createStar();
        }
    }
    
    createStar() {
        // Random size between min and max
        const size = CONFIG.STARFIELD.MIN_SIZE + 
            Math.random() * (CONFIG.STARFIELD.BASE_SIZE + CONFIG.STARFIELD.SIZE_RANGE);
        
        // Create star geometry
        const geometry = new THREE.SphereGeometry(size, 4, 4);
        
        // Random opacity
        const opacity = CONFIG.STARFIELD.MIN_OPACITY + 
            Math.random() * CONFIG.STARFIELD.OPACITY_RANGE;
        
        // Create star material
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: opacity
        });
        
        // Create star mesh
        const star = new THREE.Mesh(geometry, material);
        
        // Random position in spawn area
        star.position.x = (Math.random() - 0.5) * CONFIG.STARFIELD.SPAWN_AREA;
        star.position.y = (Math.random() - 0.5) * CONFIG.STARFIELD.SPAWN_AREA;
        star.position.z = CONFIG.STARFIELD.Z_POSITION;
        
        // Random speed
        star.userData.speed = CONFIG.STARFIELD.MIN_SPEED + 
            Math.random() * CONFIG.STARFIELD.SPEED_RANGE;
        
        // Add to stars array
        this.stars.push(star);
        
        // Add to scene if active
        if (this.isActive) {
            this.scene.add(star);
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Update existing stars
        for (let i = this.stars.length - 1; i >= 0; i--) {
            const star = this.stars[i];
            
            // Move star towards edges
            const speed = star.userData.speed;
            star.position.x += (star.position.x > 0 ? 1 : -1) * speed;
            star.position.y += (star.position.y > 0 ? 1 : -1) * speed;
            
            // Remove stars that have moved too far
            if (Math.abs(star.position.x) > CONFIG.STARFIELD.DESPAWN_DISTANCE || 
                Math.abs(star.position.y) > CONFIG.STARFIELD.DESPAWN_DISTANCE) {
                this.scene.remove(star);
                this.stars.splice(i, 1);
            }
        }
        
        // Spawn new stars if needed
        if (this.stars.length < CONFIG.STARFIELD.MIN_STARS) {
            if (Math.random() < CONFIG.STARFIELD.SPAWN_RATE) {
                this.createStar();
            }
        }
    }
    
    setActive(active) {
        if (this.isActive === active) return;
        
        this.isActive = active;
        if (active) {
            // Add all stars to scene
            this.stars.forEach(star => this.scene.add(star));
        } else {
            // Remove all stars from scene
            this.stars.forEach(star => this.scene.remove(star));
        }
    }
} 