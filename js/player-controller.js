// Player controller for Gold is Great game
// This file handles player movement, interaction, and controls

console.log("Loading player-controller.js...");

class PlayerController {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;
        this.scene = game.scene;
        this.moveSpeed = 0.2;
        this.jumpForce = 0.3;
        this.gravity = -0.01;
        this.verticalVelocity = 0;
        this.isGrounded = false;
        this.raycastDistance = 1.1; // Distance to check for ground
        this.selectedBlockPosition = null;
        this.selectedBlockFace = null;
        this.blockReachDistance = 5; // How far player can reach to interact with blocks
        
        // Initialize controller
        this.init();
    }
    
    init() {
        try {
            console.log("Initializing player controller");
            
            // Set up keyboard controls
            this.setupKeyboardControls();
            
            // Set up mouse controls
            this.setupMouseControls();
            
            // Set up physics and movement
            this.setupPhysics();
            
            console.log("Player controller initialized successfully");
        } catch (error) {
            console.error("Error initializing player controller:", error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    setupKeyboardControls() {
        // Movement keys
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        
        // W key (forward)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'w' },
                () => { this.game.moveForward = true; }
            )
        );
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: 'w' },
                () => { this.game.moveForward = false; }
            )
        );
        
        // S key (backward)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 's' },
                () => { this.game.moveBackward = true; }
            )
        );
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: 's' },
                () => { this.game.moveBackward = false; }
            )
        );
        
        // A key (left)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'a' },
                () => { this.game.moveLeft = true; }
            )
        );
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: 'a' },
                () => { this.game.moveLeft = false; }
            )
        );
        
        // D key (right)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'd' },
                () => { this.game.moveRight = true; }
            )
        );
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyUpTrigger, parameter: 'd' },
                () => { this.game.moveRight = false; }
            )
        );
        
        // Space key (jump)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: ' ' },
                () => { 
                    if (this.isGrounded) {
                        this.verticalVelocity = this.jumpForce;
                        this.isGrounded = false;
                    }
                }
            )
        );
        
        // Q key (break block)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'q' },
                () => { this.breakBlock(); }
            )
        );
        
        // E key (place block)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'e' },
                () => { this.placeBlock(); }
            )
        );
        
        // ESC key (pause)
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'Escape' },
                () => { this.togglePause(); }
            )
        );
    }
    
    setupMouseControls() {
        // Mouse look is handled by Babylon's camera system
        
        // Lock pointer on click
        this.scene.onPointerDown = () => {
            if (!this.game.isPointerLocked) {
                this.game.lockPointer();
            }
        };
    }
    
    setupPhysics() {
        // Register before render to handle physics and movement
        this.scene.registerBeforeRender(() => {
            if (this.game.isPaused) return;
            
            // Apply gravity
            this.verticalVelocity += this.gravity;
            this.camera.position.y += this.verticalVelocity;
            
            // Check if grounded
            const ray = new BABYLON.Ray(this.camera.position, new BABYLON.Vector3(0, -1, 0), this.raycastDistance);
            const hit = this.scene.pickWithRay(ray);
            
            if (hit.hit) {
                // If we're falling and hit the ground
                if (this.verticalVelocity < 0) {
                    this.isGrounded = true;
                    this.verticalVelocity = 0;
                    
                    // Adjust position to be exactly on the ground
                    const groundY = hit.pickedPoint.y + this.game.playerHeight / 2;
                    this.camera.position.y = groundY;
                }
            } else {
                this.isGrounded = false;
            }
            
            // Handle movement
            const cameraSpeed = this.moveSpeed;
            
            if (this.game.moveForward) {
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Axis.Z).scale(cameraSpeed));
            }
            if (this.game.moveBackward) {
                this.camera.position.subtractInPlace(this.camera.getDirection(BABYLON.Axis.Z).scale(cameraSpeed));
            }
            if (this.game.moveLeft) {
                this.camera.position.subtractInPlace(this.camera.getDirection(BABYLON.Axis.X).scale(cameraSpeed));
            }
            if (this.game.moveRight) {
                this.camera.position.addInPlace(this.camera.getDirection(BABYLON.Axis.X).scale(cameraSpeed));
            }
            
            // Update block highlighting
            this.updateBlockHighlight();
        });
    }
    
    updateBlockHighlight() {
        // Cast ray from camera to find block under crosshair
        const ray = this.camera.getForwardRay(this.blockReachDistance);
        const hit = this.scene.pickWithRay(ray);
        
        if (hit.hit && hit.pickedMesh) {
            // Get block position
            const worldPos = hit.pickedPoint;
            const faceNormal = hit.getNormal(true);
            
            // Convert to block coordinates
            const blockX = Math.floor(worldPos.x);
            const blockY = Math.floor(worldPos.y);
            const blockZ = Math.floor(worldPos.z);
            
            // Adjust position based on face normal to get correct block
            const adjustedX = faceNormal.x < 0 ? blockX : (faceNormal.x > 0 ? blockX - 1 : blockX);
            const adjustedY = faceNormal.y < 0 ? blockY : (faceNormal.y > 0 ? blockY - 1 : blockY);
            const adjustedZ = faceNormal.z < 0 ? blockZ : (faceNormal.z > 0 ? blockZ - 1 : blockZ);
            
            this.selectedBlockPosition = new BABYLON.Vector3(adjustedX, adjustedY, adjustedZ);
            this.selectedBlockFace = faceNormal;
            
            // Update highlight mesh
            if (this.game.highlightMesh) {
                this.game.highlightMesh.position = new BABYLON.Vector3(
                    adjustedX + 0.5,
                    adjustedY + 0.5,
                    adjustedZ + 0.5
                );
                this.game.highlightMesh.isVisible = true;
            }
        } else {
            this.selectedBlockPosition = null;
            this.selectedBlockFace = null;
            
            // Hide highlight mesh
            if (this.game.highlightMesh) {
                this.game.highlightMesh.isVisible = false;
            }
        }
    }
    
    breakBlock() {
        if (!this.selectedBlockPosition) return;
        
        try {
            console.log(`Breaking block at ${this.selectedBlockPosition.x}, ${this.selectedBlockPosition.y}, ${this.selectedBlockPosition.z}`);
            
            // Find chunk containing this block
            const chunkX = Math.floor(this.selectedBlockPosition.x / this.game.chunkSize);
            const chunkZ = Math.floor(this.selectedBlockPosition.z / this.game.chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Get chunk
            const chunk = this.game.chunkManager.chunks[chunkKey];
            if (!chunk) {
                console.warn("Cannot break block: Chunk not found");
                return;
            }
            
            // Get block within chunk
            const localX = Math.floor(this.selectedBlockPosition.x) - chunkX * this.game.chunkSize;
            const localY = Math.floor(this.selectedBlockPosition.y);
            const localZ = Math.floor(this.selectedBlockPosition.z) - chunkZ * this.game.chunkSize;
            const blockKey = `${localX},${localY},${localZ}`;
            
            // Remove block
            if (chunk.blocks[blockKey]) {
                delete chunk.blocks[blockKey];
                
                // Rebuild chunk mesh
                if (chunk.mesh) {
                    chunk.mesh.dispose();
                }
                this.game.chunkManager.createChunkMesh(chunk);
                
                console.log("Block broken successfully");
            }
        } catch (error) {
            console.error("Error breaking block:", error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    placeBlock() {
        if (!this.selectedBlockPosition || !this.selectedBlockFace) return;
        
        try {
            // Calculate new block position (adjacent to selected block)
            const newBlockX = Math.floor(this.selectedBlockPosition.x + this.selectedBlockFace.x);
            const newBlockY = Math.floor(this.selectedBlockPosition.y + this.selectedBlockFace.y);
            const newBlockZ = Math.floor(this.selectedBlockPosition.z + this.selectedBlockFace.z);
            
            console.log(`Placing block at ${newBlockX}, ${newBlockY}, ${newBlockZ}`);
            
            // Find chunk for new block
            const chunkX = Math.floor(newBlockX / this.game.chunkSize);
            const chunkZ = Math.floor(newBlockZ / this.game.chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Get or create chunk
            let chunk = this.game.chunkManager.chunks[chunkKey];
            if (!chunk) {
                console.warn("Cannot place block: Chunk not found");
                return;
            }
            
            // Get block position within chunk
            const localX = newBlockX - chunkX * this.game.chunkSize;
            const localY = newBlockY;
            const localZ = newBlockZ - chunkZ * this.game.chunkSize;
            const blockKey = `${localX},${localY},${localZ}`;
            
            // Check if block already exists
            if (chunk.blocks[blockKey]) {
                console.warn("Cannot place block: Block already exists");
                return;
            }
            
            // Check if block would intersect with player
            const playerPos = this.camera.position;
            const playerMinX = playerPos.x - 0.3;
            const playerMaxX = playerPos.x + 0.3;
            const playerMinY = playerPos.y - 1.6;
            const playerMaxY = playerPos.y + 0.2;
            const playerMinZ = playerPos.z - 0.3;
            const playerMaxZ = playerPos.z + 0.3;
            
            if (
                newBlockX >= playerMinX && newBlockX <= playerMaxX &&
                newBlockY >= playerMinY && newBlockY <= playerMaxY &&
                newBlockZ >= playerMinZ && newBlockZ <= playerMaxZ
            ) {
                console.warn("Cannot place block: Would intersect with player");
                return;
            }
            
            // Add new block
            chunk.blocks[blockKey] = {
                x: localX,
                y: localY,
                z: localZ,
                type: 'stone' // Default block type
            };
            
            // Rebuild chunk mesh
            if (chunk.mesh) {
                chunk.mesh.dispose();
            }
            this.game.chunkManager.createChunkMesh(chunk);
            
            console.log("Block placed successfully");
        } catch (error) {
            console.error("Error placing block:", error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    togglePause() {
        this.game.isPaused = !this.game.isPaused;
        
        if (this.game.isPaused) {
            // Show pause menu
            if (this.game.pauseMenu) {
                this.game.pauseMenu.isVisible = true;
            }
            
            // Unlock pointer
            document.exitPointerLock();
            this.game.isPointerLocked = false;
        } else {
            // Hide pause menu
            if (this.game.pauseMenu) {
                this.game.pauseMenu.isVisible = false;
            }
            
            // Lock pointer
            this.game.lockPointer();
        }
    }
}

// Export PlayerController class
window.PlayerController = PlayerController;

console.log("player-controller.js loaded successfully");
