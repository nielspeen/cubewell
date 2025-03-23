/**
 * UI - Handle game user interface
 */
class UI {
    constructor(game) {
        this.game = game;
        
        // UI elements
        this.scoreElement = document.getElementById('score-value');
        this.levelElement = document.getElementById('level-value');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverPanel = document.getElementById('game-over');
        this.nextBlockPreview = document.getElementById('next-block');
        
        // Initialize UI
        this.updateScore(0);
        this.updateLevel(1);
        this.hideGameOver();
        
        // Create scene for next block preview
        this.setupNextBlockPreview();
    }
    
    /**
     * Set up the 3D preview for the next block
     */
    setupNextBlockPreview() {
        // Create a small Three.js scene for the next block preview
        this.previewScene = new THREE.Scene();
        
        // Camera for preview - adjusted position to show more of the block
        this.previewCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        this.previewCamera.position.set(4, 4, 4); // Moved camera back further
        this.previewCamera.lookAt(0, 0, 0);
        
        // Renderer for preview with transparent background
        this.previewRenderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true, // Enable transparency
            premultipliedAlpha: false // Important for proper transparency
        });
        this.previewRenderer.setClearColor(0x000000, 0); // Set clear color with 0 alpha
        this.previewRenderer.setPixelRatio(window.devicePixelRatio);
        
        // Get the canvas element and set its style
        const canvas = this.previewRenderer.domElement;
        canvas.style.background = 'transparent';
        
        this.updatePreviewSize();
        this.nextBlockPreview.innerHTML = '';
        this.nextBlockPreview.appendChild(canvas);
        
        // Add lights to the preview scene
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.previewScene.add(light);
        
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.previewScene.add(ambientLight);

        // Add resize handler
        window.addEventListener('resize', () => this.updatePreviewSize());
    }
    
    /**
     * Update the preview renderer size to match container
     */
    updatePreviewSize() {
        const rect = this.nextBlockPreview.getBoundingClientRect();
        this.previewRenderer.setSize(rect.width, rect.height);
    }
    
    /**
     * Update the next block preview
     */
    updateNextBlockPreview(nextBlock) {
        // Cancel any existing animation
        if (this.previewAnimation) {
            cancelAnimationFrame(this.previewAnimation);
            this.previewAnimation = null;
        }
        
        // Remove existing preview mesh if it exists
        if (this.previewMesh) {
            this.previewScene.remove(this.previewMesh);
            this.previewMesh = null;
        }
        
        if (nextBlock) {
            // Clone the block for preview
            const previewBlock = nextBlock.clone();
            
            // Reset position to center before creating mesh
            previewBlock.position = [0, 0, 0];
            
            // Create the mesh but don't add to main scene
            this.previewMesh = previewBlock.createMesh();
            
            // Ensure the mesh is properly positioned before adding to the preview scene
            this.previewMesh.visible = false;
            
            // Center the block in view
            const bbox = new THREE.Box3().setFromObject(this.previewMesh);
            const center = bbox.getCenter(new THREE.Vector3());
            this.previewMesh.position.sub(center);
            
            // Add to preview scene
            this.previewScene.add(this.previewMesh);
            
            // Make visible
            this.previewMesh.visible = true;
            
            // Animate rotation
            const animate = (time) => {
                this.previewMesh.rotation.y = time / 2000;
                this.previewMesh.rotation.x = time / 3000;
                this.previewRenderer.render(this.previewScene, this.previewCamera);
                this.previewAnimation = requestAnimationFrame(animate);
            };
            
            this.previewAnimation = requestAnimationFrame(animate);
        }
    }
    
    /**
     * Update the score display
     */
    updateScore(score) {
        this.scoreElement.textContent = score;
    }
    
    /**
     * Update the level display
     */
    updateLevel(level) {
        this.levelElement.textContent = level;
    }
    
    /**
     * Show game over screen
     */
    showGameOver(score) {
        this.finalScoreElement.textContent = score;
        this.gameOverPanel.classList.remove('hidden');
        
        // Show high scores
        this.displayHighScores(score);
    }
    
    /**
     * Hide game over screen
     */
    hideGameOver() {
        this.gameOverPanel.classList.add('hidden');
    }
    
    /**
     * Display high scores
     */
    displayHighScores(currentScore) {
        // Check if high score element already exists and remove it
        const existingHighScores = document.getElementById('high-scores');
        if (existingHighScores) {
            existingHighScores.remove();
        }
        
        // Create high score panel
        const highScoresPanel = document.createElement('div');
        highScoresPanel.id = 'high-scores';
        
        // Get high scores from localStorage
        const highScores = this.getHighScores();
        
        // Check if current score qualifies as high score
        if (currentScore > 0 && (highScores.length < 5 || currentScore > highScores[highScores.length - 1].score)) {
            const playerName = this.getPlayerName();
            this.saveHighScore(playerName, currentScore);
        }
        
        // Get updated high scores
        const updatedHighScores = this.getHighScores();
        
        // Create high scores list
        const title = document.createElement('h3');
        title.textContent = 'High Scores';
        highScoresPanel.appendChild(title);
        
        const list = document.createElement('ol');
        updatedHighScores.forEach((scoreEntry) => {
            const item = document.createElement('li');
            item.textContent = `${scoreEntry.name}: ${scoreEntry.score}`;
            list.appendChild(item);
        });
        
        highScoresPanel.appendChild(list);
        this.gameOverPanel.appendChild(highScoresPanel);
    }
    
    /**
     * Get player name from localStorage or prompt
     */
    getPlayerName() {
        const playerName = prompt('Enter your name for the high score:', 'Player');
        if (playerName && playerName.trim()) {
            return playerName.trim();
        }
        return 'Anonymous';
    }
    
    /**
     * Save high score to localStorage
     */
    saveHighScore(name, score) {
        const highScores = this.getHighScores();
        
        // Add new score
        highScores.push({ name, score });
        
        // Sort by score (descending)
        highScores.sort((a, b) => b.score - a.score);
        
        // Keep only top 5
        const topScores = highScores.slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem(CONFIG.HIGH_SCORE_KEY, JSON.stringify(topScores));
    }
    
    /**
     * Get high scores from localStorage
     */
    getHighScores() {
        const scores = localStorage.getItem(CONFIG.HIGH_SCORE_KEY);
        return scores ? JSON.parse(scores) : [];
    }
} 