// Ensure player movement and block interaction work properly
class PlayerController {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;
        this.scene = game.scene;
        this.canvas = game.canvas;
        this.moveSpeed = game.playerSpeed;
        this.jumpForce = game.jumpForce;
        this.gravity = game.gravity;
        this.playerHeight = game.playerHeight;
        this.isGrounded = false;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.highlightMesh = game.highlightMesh;
        this.selectedBlockPosition = null;
        
        // Movement flags
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        
        // Pointer lock state
        this.isPointerLocked = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        try {
            console.log("[PlayerController] Initializing player controls");
            this.registerInputHandlers();
            this.setupPhysicsUpdate();
            console.log("[PlayerController] Player controls initialized successfully");
        } catch (error) {
            console.error("[PlayerController] Error initializing player controls:", error);
        }
    }
    
    registerInputHandlers() {
        // Handle keyboard input
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        
        // WASD movement
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'w'
                },
                () => { this.moveForward = true; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    parameter: 'w'
                },
                () => { this.moveForward = false; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 's'
                },
                () => { this.moveBackward = true; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    parameter: 's'
                },
                () => { this.moveBackward = false; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'a'
                },
                () => { this.moveLeft = true; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    parameter: 'a'
                },
                () => { this.moveLeft = false; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'd'
                },
                () => { this.moveRight = true; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    parameter: 'd'
                },
                () => { this.moveRight = false; }
            )
        );
        
        // Jump with space
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: ' '
                },
                () => { 
                    if (this.isGrounded) {
                        this.jump = true;
                        this.velocity.y = this.jumpForce;
                        this.isGrounded = false;
                    }
                }
            )
        );
        
        // Place block with E
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'e'
                },
                () => { this.placeBlock(); }
            )
        );
        
        // Break block with Q
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'q'
                },
                () => { this.breakBlock(); }
            )
        );
        
        // Handle mouse click for pointer lock
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && !this.game.isPaused) {
                this.lockPointer();
            }
        });
        
        // Handle pointer lock change
        document.addEventListener('pointerlockchange', this.pointerLockChanged.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.pointerLockChanged.bind(this), false);
    }
    
    setupPhysicsUpdate() {
        // Update player movement and physics
        this.scene.registerBeforeRender(() => {
            if (this.isPointerLocked && !this.game.isPaused) {
                this.updateMovement();
                this.updatePhysics();
                this.updateBlockHighlight();
            }
        });
    }
    
    updateMovement() {
        // Calculate movement direction
        const cameraDirection = this.camera.getDirection(BABYLON.Vector3.Forward());
        const cameraSide = this.camera.getDirection(BABYLON.Vector3.Right());
        
        // Remove vertical component for horizontal movement
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        // Apply movement based on input
        if (this.moveForward) {
            this.velocity.x += cameraDirection.x * this.moveSpeed;
            this.velocity.z += cameraDirection.z * this.moveSpeed;
        }
        if (this.moveBackward) {
            this.velocity.x -= cameraDirection.x * this.moveSpeed;
            this.velocity.z -= cameraDirection.z * this.moveSpeed;
        }
        if (this.moveLeft) {
            this.velocity.x -= cameraSide.x * this.moveSpeed;
            this.velocity.z -= cameraSide.z * this.moveSpeed;
        }
        if (this.moveRight) {
            this.velocity.x += cameraSide.x * this.moveSpeed;
            this.velocity.z += cameraSide.z * this.moveSpeed;
        }
        
        // Apply friction to horizontal movement
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }
    
    updatePhysics() {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * 0.01; // Scale gravity by delta time
        }
        
        // Check if player is on ground
        const ray = new BABYLON.Ray(this.camera.position, new BABYLON.Vector3(0, -1, 0), 1.1);
        const hit = this.scene.pickWithRay(ray);
        
        if (hit.hit) {
            // Player is on ground
            if (this.velocity.y <= 0) {
                this.isGrounded = true;
                this.velocity.y = 0;
            }
        } else {
            this.isGrounded = false;
        }
        
        // Apply velocity to camera position
        this.camera.position.addInPlace(this.velocity);
        
        // Collision detection with blocks
        this.handleCollisions();
    }
    
    handleCollisions() {
        // Simple collision detection with blocks
        // Check in 6 directions (up, down, left, right, front, back)
        const directions = [
            new BABYLON.Vector3(0, 1, 0),   // Up
            new BABYLON.Vector3(0, -1, 0),  // Down
            new BABYLON.Vector3(1, 0, 0),   // Right
            new BABYLON.Vector3(-1, 0, 0),  // Left
            new BABYLON.Vector3(0, 0, 1),   // Front
            new BABYLON.Vector3(0, 0, -1)   // Back
        ];
        
        for (const direction of directions) {
            const ray = new BABYLON.Ray(this.camera.position, direction, 0.6);
            const hit = this.scene.pickWithRay(ray);
            
            if (hit.hit) {
                // Move player away from collision
                const pushVector = direction.scale(-0.1);
                this.camera.position.addInPlace(pushVector);
                
                // Zero out velocity in this direction
                if (direction.x !== 0) this.velocity.x = 0;
                if (direction.y !== 0) this.velocity.y = 0;
                if (direction.z !== 0) this.velocity.z = 0;
            }
        }
    }
    
    updateBlockHighlight() {
        // Cast ray from camera to find block under crosshair
        const ray = this.scene.createPickingRay(
            this.canvas.width / 2,
            this.canvas.height / 2,
            BABYLON.Matrix.Identity(),
            this.camera
        );
        
        const hit = this.scene.pickWithRay(ray, null, false);
        
        if (hit.hit && hit.pickedMesh) {
            // Get hit position
            const hitPosition = hit.pickedPoint;
            
            // Get block position
            const blockX = Math.floor(hitPosition.x);
            const blockY = Math.floor(hitPosition.y);
            const blockZ = Math.floor(hitPosition.z);
            
            // Update highlight position
            this.highlightMesh.position = new BABYLON.Vector3(blockX + 0.5, blockY + 0.5, blockZ + 0.5);
            this.highlightMesh.isVisible = true;
            
            // Store selected block position
            this.selectedBlockPosition = { x: blockX, y: blockY, z: blockZ };
        } else {
            this.highlightMesh.isVisible = false;
            this.selectedBlockPosition = null;
        }
    }
    
    placeBlock() {
        if (this.selectedBlockPosition && this.game.chunkManager) {
            // Get normal vector from hit face
            const ray = this.scene.createPickingRay(
                this.canvas.width / 2,
                this.canvas.height / 2,
                BABYLON.Matrix.Identity(),
                this.camera
            );
            
            const hit = this.scene.pickWithRay(ray);
            
            if (hit.hit && hit.pickedMesh) {
                // Get hit normal
                const normal = hit.getNormal();
                
                // Calculate new block position
                const newBlockX = Math.floor(this.selectedBlockPosition.x + normal.x);
                const newBlockY = Math.floor(this.selectedBlockPosition.y + normal.y);
                const newBlockZ = Math.floor(this.selectedBlockPosition.z + normal.z);
                
                // Check if new position is valid (not inside player)
                const playerPos = this.camera.position;
                const playerBlockX = Math.floor(playerPos.x);
                const playerBlockY = Math.floor(playerPos.y);
                const playerBlockZ = Math.floor(playerPos.z);
                
                if (newBlockX === playerBlockX && newBlockY === playerBlockY && newBlockZ === playerBlockZ) {
                    return; // Don't place block inside player
                }
                
                if (newBlockX === playerBlockX && newBlockY === playerBlockY + 1 && newBlockZ === playerBlockZ) {
                    return; // Don't place block inside player's head
                }
                
                // Get chunk coordinates
                const chunkSize = this.game.chunkSize;
                const chunkX = Math.floor(newBlockX / chunkSize);
                const chunkZ = Math.floor(newBlockZ / chunkSize);
                const chunkKey = `${chunkX},${chunkZ}`;
                
                // Get local block coordinates within chunk
                const localX = ((newBlockX % chunkSize) + chunkSize) % chunkSize;
                const localY = newBlockY;
                const localZ = ((newBlockZ % chunkSize) + chunkSize) % chunkSize;
                const blockKey = `${localX},${localY},${localZ}`;
                
                // Get chunk from chunk manager
                let chunk = this.game.chunkManager.chunks[chunkKey];
                
                // Create or get chunk
                if (!chunk) {
                    this.game.chunkManager.generateChunk(chunkX, chunkZ);
                    chunk = this.game.chunkManager.chunks[chunkKey];
                }
                
                if (chunk) {
                    // Add block to chunk
                    chunk.blocks[blockKey] = {
                        x: localX,
                        y: localY,
                        z: localZ,
                        type: 'dirt'
                    };
                    
                    // Recreate chunk mesh
                    if (chunk.mesh) {
                        chunk.mesh.dispose();
                    }
                    this.game.chunkManager.createChunkMesh(chunk);
                    
                    console.log(`[PlayerController] Block placed at ${newBlockX}, ${newBlockY}, ${newBlockZ}`);
                }
            }
        }
    }
    
    breakBlock() {
        if (this.selectedBlockPosition && this.game.chunkManager) {
            // Get chunk coordinates
            const blockX = this.selectedBlockPosition.x;
            const blockY = this.selectedBlockPosition.y;
            const blockZ = this.selectedBlockPosition.z;
            
            const chunkSize = this.game.chunkSize;
            const chunkX = Math.floor(blockX / chunkSize);
            const chunkZ = Math.floor(blockZ / chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Get local block coordinates within chunk
            const localX = ((blockX % chunkSize) + chunkSize) % chunkSize;
            const localY = blockY;
            const localZ = ((blockZ % chunkSize) + chunkSize) % chunkSize;
            const blockKey = `${localX},${localY},${localZ}`;
            
            // Get chunk
            const chunk = this.game.chunkManager.chunks[chunkKey];
            
            if (chunk && chunk.blocks[blockKey]) {
                // Remove block from chunk
                delete chunk.blocks[blockKey];
                
                // Recreate chunk mesh
                if (chunk.mesh) {
                    chunk.mesh.dispose();
                }
                this.game.chunkManager.createChunkMesh(chunk);
                
                console.log(`[PlayerController] Block broken at ${blockX}, ${blockY}, ${blockZ}`);
            }
        }
    }
    
    lockPointer() {
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
        this.canvas.requestPointerLock();
    }
    
    pointerLockChanged() {
        if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas) {
            this.isPointerLocked = true;
            console.log("[PlayerController] Pointer locked");
        } else {
            this.isPointerLocked = false;
            console.log("[PlayerController] Pointer unlocked");
        }
    }
}

// Export the PlayerController class
if (typeof module !== 'undefined') {
    module.exports = { PlayerController };
}
