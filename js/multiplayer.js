/**
 * Multiplayer - Simple multiplayer functionality
 * 
 * This implementation uses localStorage for simplicity as a demo.
 * In a real game, you'd use WebSockets or a similar technology.
 */
class Multiplayer {
    constructor(game) {
        this.game = game;
        this.playerName = null;
        this.players = new Map();
        this.playerId = this.generatePlayerId();
        this.connected = false;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize multiplayer
     */
    init() {
        // Get or create player name
        this.playerName = localStorage.getItem(CONFIG.PLAYER_NAME_KEY);
        if (!this.playerName) {
            this.playerName = `Player-${Math.floor(Math.random() * 9999)}`;
            localStorage.setItem(CONFIG.PLAYER_NAME_KEY, this.playerName);
        }
        
        // Create UI for player list
        this.createPlayerListUI();
        
        // For a real implementation, you would connect to a server here
        // This is a simplified version that simulates multiplayer
        this.simulateConnection();
    }
    
    /**
     * Generate a unique player ID
     */
    generatePlayerId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    /**
     * Create UI for player list
     */
    createPlayerListUI() {
        // Create player list container
        const playerList = document.createElement('div');
        playerList.id = 'player-list';
        playerList.className = 'player-list';
        playerList.innerHTML = '<h3>Players</h3><ul id="players"></ul>';
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .player-list {
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 5px;
                border: 1px solid var(--primary-color);
                color: white;
                z-index: 10;
            }
            .player-list h3 {
                margin-top: 0;
                font-size: 1rem;
                text-align: center;
            }
            .player-list ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .player-list li {
                padding: 3px 5px;
                margin-bottom: 3px;
                border-radius: 3px;
                font-size: 0.9rem;
            }
            .player-list .current-player {
                background: rgba(0, 170, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
        
        // Add to the game container
        document.getElementById('game-container').appendChild(playerList);
    }
    
    /**
     * Simulate connection to server
     * In a real implementation, this would connect to a WebSocket server
     */
    simulateConnection() {
        // Add self to player list
        this.players.set(this.playerId, {
            name: this.playerName,
            score: 0,
            isActive: true,
            lastActive: Date.now()
        });
        
        // Simulate other players
        const simulatedPlayers = [
            { id: 'player1', name: 'Alice', score: Math.floor(Math.random() * 5000) },
            { id: 'player2', name: 'Bob', score: Math.floor(Math.random() * 5000) },
            { id: 'player3', name: 'Charlie', score: Math.floor(Math.random() * 5000) }
        ];
        
        simulatedPlayers.forEach(player => {
            this.players.set(player.id, {
                name: player.name,
                score: player.score,
                isActive: true,
                lastActive: Date.now()
            });
        });
        
        // Update player list
        this.updatePlayerListUI();
        
        // Simulate periodic updates
        setInterval(() => {
            // Update scores for simulated players
            this.players.forEach((player, id) => {
                if (id !== this.playerId && Math.random() > 0.7) {
                    player.score += Math.floor(Math.random() * 100);
                }
            });
            
            // Update player list
            this.updatePlayerListUI();
        }, 5000);
        
        this.connected = true;
    }
    
    /**
     * Update the player list UI
     */
    updatePlayerListUI() {
        const playersList = document.getElementById('players');
        if (!playersList) return;
        
        // Clear current list
        playersList.innerHTML = '';
        
        // Sort players by score
        const sortedPlayers = Array.from(this.players.entries())
            .sort((a, b) => b[1].score - a[1].score);
        
        // Add players to list
        sortedPlayers.forEach(([id, player]) => {
            const playerItem = document.createElement('li');
            playerItem.textContent = `${player.name}: ${player.score}`;
            
            if (id === this.playerId) {
                playerItem.classList.add('current-player');
            }
            
            playersList.appendChild(playerItem);
        });
    }
    
    /**
     * Update your score
     */
    updateScore(score) {
        if (!this.connected) return;
        
        // Update local player score
        const player = this.players.get(this.playerId);
        if (player) {
            player.score = score;
            player.lastActive = Date.now();
            
            // Update UI
            this.updatePlayerListUI();
        }
    }
    
    /**
     * Disconnect from multiplayer
     */
    disconnect() {
        this.connected = false;
        // In a real implementation, you would disconnect from the server here
    }
} 