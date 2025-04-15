// Game functionality using Babylon.js
let gameInstance = null;

class Game {
    constructor(worldData, settings) {
        this.worldData = worldData;
        this.settings = settings;
        this.canvas = document.getElementById('game-canvas');
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.light = null;
        this.ground = null;
        this.blocks = {};
        this.blockMaterial = null;
        this.blockSize = 1;
        this.worldSize = this.getWorldSizeValue(worldData.size);
        this.renderDistance = settings.renderDistance;
        this.isPointerLocked = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.jump = false;
        this.gravity = -9.81;
        this.playerHeight = 1.8;
        this.playerSpeed = 0.2;
        this.jumpForce = 0.3;
        this.selectedBlockPosition = null;
        this.highlightMesh = null;
        this.fpsCounter = null;
        this.pauseMenu = null;
        this.isPaused = false;
        this.seed = parseInt(worldData.seed) || Math.floor(Math.random() * 1000000);
        this.chunks = {};
        this.chunkSize = 16;
        this.loadedChunks = new Set();
        this.terrainGenerator = new TerrainGenerator(this.seed, this.worldSize);
        this.init();
    }

    getWorldSizeValue(size) {
        switch(size) {
            case 'small': return 64;
            case 'large': return 256;
            case 'medium':
            default: return 128;
        }
    }

    init() {
        try {
            console.log("Game initialization started");
            // Initialize Babylon.js engine
            this.engine = new BABYLON.Engine(this.canvas, this.settings.vsync, { preserveDrawingBuffer: true, stencil: true });
            console.log("Babylon engine created successfully");
            
            // Set max framerate if not unlimited
            if (this.settings.maxFramerate > 0) {
                this.engine.setHardwareScalingLevel(1 / (this.settings.maxFramerate / 60));
                console.log(`Max framerate set to ${this.settings.maxFramerate}`);
            }
            
            // Create scene
            console.log("Creating scene...");
            this.createScene();
            console.log("Scene created successfully");
            
            // Register event handlers
            console.log("Registering event handlers...");
            this.registerEventHandlers();
            console.log("Event handlers registered");
            
            // Start the render loop
            console.log("Starting render loop...");
            this.engine.runRenderLoop(() => {
                if (!this.isPaused) {
                    this.scene.render();
                    
                    // Update FPS counter if enabled
                    if (this.settings.fpsCounter && this.fpsCounter) {
                        this.fpsCounter.text = `FPS: ${Math.round(this.engine.getFps())}`;
                    }
                    
                    // Update chunks based on player position
                    this.updateChunks();
                }
            });
            console.log("Render loop started");
            
            // Handle window resize
            window.addEventListener('resize', () => {
                this.engine.resize();
            });
            console.log("Window resize handler added");
            
            // Initialize Babylon debugger if available
            if (window.babylonDebugger) {
                window.babylonDebugger.initialize(this.scene);
                console.log("Babylon debugger initialized");
            }
        } catch (error) {
            console.error("Error during game initialization:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    createScene() {
        try {
            console.log("Creating new Babylon.js scene");
            // Create a new scene
            this.scene = new BABYLON.Scene(this.engine);
            
            // Set gravity for physics
            this.scene.gravity = new BABYLON.Vector3(0, this.gravity, 0);
            this.scene.collisionsEnabled = true;
            console.log("Scene physics configured");
            
            // Create camera
            console.log("Creating player camera");
            this.camera = new BABYLON.FreeCamera('playerCamera', new BABYLON.Vector3(0, this.playerHeight, 0), this.scene);
            this.camera.applyGravity = true;
            this.camera.checkCollisions = true;
            this.camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
            this.camera.minZ = 0.1;
            this.camera.attachControl(this.canvas, true);
            this.camera.speed = 0.2 * (this.settings.mouseSensitivity / 5);
            this.camera.angularSensibility = 1000 / this.settings.mouseSensitivity;
            console.log("Player camera created and configured");
            
            // Create lights
            console.log("Creating scene lighting");
            this.light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
            this.light.intensity = 0.7;
            
            // Add directional light for shadows
            const directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-0.5, -1, -0.5), this.scene);
            directionalLight.intensity = 0.5;
            console.log("Scene lighting created");
            
            // Create block material
            console.log("Creating block materials");
            this.createBlockMaterial();
            console.log("Block materials created");
            
            // Generate initial world chunks
            console.log("Generating initial world chunks");
            this.generateInitialChunks();
            console.log("Initial world chunks generated");
            
            // Create FPS counter if enabled
            if (this.settings.fpsCounter) {
                console.log("Creating FPS counter");
                this.createFpsCounter();
                console.log("FPS counter created");
            }
            
            // Create block highlight mesh
            console.log("Creating block highlight mesh");
            this.createHighlightMesh();
            console.log("Block highlight mesh created");
            
            // Create crosshair
            console.log("Creating crosshair");
            this.createCrosshair();
            console.log("Crosshair created");
            
            // Create pause menu
            console.log("Creating pause menu");
            this.createPauseMenu();
            console.log("Pause menu created");
            
            // Set fog if enabled
            if (this.settings.fog) {
                console.log("Configuring scene fog");
                this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
                this.scene.fogDensity = 0.01;
                this.scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                console.log("Scene fog configured");
            }
            
            console.log("Scene creation completed successfully");
        } catch (error) {
            console.error("Error during scene creation:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    createBlockMaterial() {
        // Create material for blocks
        this.blockMaterial = new BABYLON.StandardMaterial('blockMaterial', this.scene);
        
        // Create texture from the provided block.png
        const blockTexture = new BABYLON.Texture('images/block.png', this.scene);
        blockTexture.hasAlpha = true;
        
        this.blockMaterial.diffuseTexture = blockTexture;
        this.blockMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    }

    createFpsCounter() {
        try {
            // Check if GUI is properly loaded
            if (!BABYLON.GUI) {
                console.error("BABYLON.GUI is not defined. GUI module may not be loaded properly.");
                return;
            }
            
            // Create a dynamic texture for FPS counter
            const fpsTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
            
            // Create text block for FPS
            this.fpsCounter = new BABYLON.GUI.TextBlock();
            this.fpsCounter.text = 'FPS: 0';
            this.fpsCounter.color = 'white';
            this.fpsCounter.fontSize = 16;
            this.fpsCounter.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.fpsCounter.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.fpsCounter.paddingTop = '10px';
            this.fpsCounter.paddingRight = '10px';
            
            // Add to the UI
            fpsTexture.addControl(this.fpsCounter);
        } catch (error) {
            console.error("Error creating FPS counter:", error);
            // Continue without FPS counter if there's an error
        }
    }

    createCrosshair() {
        try {
            // Check if GUI is properly loaded
            if (!BABYLON.GUI) {
                console.error("BABYLON.GUI is not defined. GUI module may not be loaded properly.");
                return;
            }
            
            // Create a dynamic texture for the crosshair
            const guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
            
            // Create crosshair
            const crosshair = new BABYLON.GUI.Ellipse();
            crosshair.width = "10px";
            crosshair.height = "10px";
            crosshair.color = "white";
            crosshair.thickness = 2;
            crosshair.background = "transparent";
            
            // Add to the UI
            guiTexture.addControl(crosshair);
        } catch (error) {
            console.error("Error creating crosshair:", error);
            // Continue without crosshair if there's an error
        }
    }

    createPauseMenu() {
        try {
            // Check if GUI is properly loaded
            if (!BABYLON.GUI) {
                console.error("BABYLON.GUI is not defined. GUI module may not be loaded properly.");
                return;
            }
            
            // Create a dynamic texture for the pause menu
            const pauseTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('PauseUI');
            
            // Create pause menu container
            this.pauseMenu = new BABYLON.GUI.Rectangle();
            this.pauseMenu.width = "400px";
            this.pauseMenu.height = "300px";
            this.pauseMenu.cornerRadius = 10;
            this.pauseMenu.color = "#FFD700";
            this.pauseMenu.thickness = 2;
            this.pauseMenu.background = "#000000CC";
            this.pauseMenu.isVisible = false;
            pauseTexture.addControl(this.pauseMenu);
            
            // Create pause menu title
            const pauseTitle = new BABYLON.GUI.TextBlock();
            pauseTitle.text = "PAUSED";
            pauseTitle.color = "#FFD700";
            pauseTitle.fontSize = 24;
            pauseTitle.height = "40px";
            pauseTitle.top = "-100px";
            this.pauseMenu.addControl(pauseTitle);
            
            // Create resume button
            const resumeButton = BABYLON.GUI.Button.CreateSimpleButton("resumeButton", "Resume Game");
            resumeButton.width = "200px";
            resumeButton.height = "40px";
            resumeButton.color = "white";
            resumeButton.background = "#3a3a3a";
            resumeButton.cornerRadius = 5;
            resumeButton.top = "-40px";
            resumeButton.onPointerUpObservable.add(() => {
                this.togglePause();
            });
            this.pauseMenu.addControl(resumeButton);
            
            // Create save button
            const saveButton = BABYLON.GUI.Button.CreateSimpleButton("saveButton", "Save World");
            saveButton.width = "200px";
            saveButton.height = "40px";
            saveButton.color = "white";
            saveButton.background = "#3a3a3a";
            saveButton.cornerRadius = 5;
            saveButton.top = "10px";
            saveButton.onPointerUpObservable.add(() => {
                this.saveWorld();
            });
            this.pauseMenu.addControl(saveButton);
            
            // Create quit button
            const quitButton = BABYLON.GUI.Button.CreateSimpleButton("quitButton", "Quit to Menu");
            quitButton.width = "200px";
            quitButton.height = "40px";
            quitButton.color = "white";
            quitButton.background = "#3a3a3a";
            quitButton.cornerRadius = 5;
            quitButton.top = "60px";
            quitButton.onPointerUpObservable.add(() => {
                this.quitToMenu();
            });
            this.pauseMenu.addControl(quitButton);
        } catch (error) {
            console.error("Error creating pause menu:", error);
            // Continue without pause menu if there's an error
        }
    }

    createHighlightMesh() {
        // Create a highlight mesh for block selection
        this.highlightMesh = BABYLON.MeshBuilder.CreateBox('highlight', { size: this.blockSize + 0.01 }, this.scene);
        
        // Create highlight material
        const highlightMaterial = new BABYLON.StandardMaterial('highlightMaterial', this.scene);
        highlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        highlightMaterial.alpha = 0.3;
        highlightMaterial.wireframe = true;
        
        this.highlightMesh.material = highlightMaterial;
        this.highlightMesh.isVisible = false;
    }

    generateInitialChunks() {
        // Generate chunks around player
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        
        // Generate chunks within render distance
        for (let x = playerChunkX - this.settings.renderDistance; x <= playerChunkX + this.settings.renderDistance; x++) {
            for (let z = playerChunkZ - this.settings.renderDistance; z <= playerChunkZ + this.settings.renderDistance; z++) {
                this.generateChunk(x, z);
            }
        }
        
        // Position player above the terrain
        const playerX = 0;
        const playerZ = 0;
        const height = this.terrainGenerator.getHeightAt(playerX, playerZ);
        this.camera.position = new BABYLON.Vector3(playerX, height + this.playerHeight + 1, playerZ);
    }

    updateChunks() {
        // Get current player chunk
        const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
        const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
        
        // Check which chunks need to be loaded or unloaded
        const chunksToLoad = new Set();
        const chunksToUnload = new Set(this.loadedChunks);
        
        // Determine chunks to load
        for (let x = playerChunkX - this.settings.renderDistance; x <= playerChunkX + this.settings.renderDistance; x++) {
            for (let z = playerChunkZ - this.settings.renderDistance; z <= playerChunkZ + this.settings.renderDistance; z++) {
                const chunkKey = `${x},${z}`;
                chunksToLoad.add(chunkKey);
                chunksToUnload.delete(chunkKey);
            }
        }
        
        // Load new chunks
        chunksToLoad.forEach(chunkKey => {
            if (!this.loadedChunks.has(chunkKey)) {
                const [x, z] = chunkKey.split(',').map(Number);
                this.generateChunk(x, z);
                this.loadedChunks.add(chunkKey);
            }
        });
        
        // Unload distant chunks
        chunksToUnload.forEach(chunkKey => {
            this.unloadChunk(chunkKey);
            this.loadedChunks.delete(chunkKey);
        });
    }

    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if chunk already exists
        if (this.chunks[chunkKey]) {
            return;
        }
        
        // Create chunk container
        this.chunks[chunkKey] = {
            blocks: {},
            meshes: []
        };
        
        // Generate terrain for this chunk
        const worldX = chunkX * this.chunkSize;
        const worldZ = chunkZ * this.chunkSize;
        
        // Create blocks for this chunk
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const blockX = worldX + x;
                const blockZ = worldZ + z;
                
                // Get height from terrain generator
                const height = this.terrainGenerator.getHeightAt(blockX, blockZ);
                
                // Create surface block
                this.createBlock(blockX, height, blockZ, chunkKey);
                
                // Add some blocks below the surface
                for (let y = height - 1; y > height - 3; y--) {
                    if (Math.random() > 0.3) { // 70% chance to create a block
                        this.createBlock(blockX, y, blockZ, chunkKey);
                    }
                }
            }
        }
        
        // Optimize chunk by merging blocks
        this.optimizeChunk(chunkKey);
    }

    optimizeChunk(chunkKey) {
        // This is a simplified optimization
        // In a real implementation, you would merge adjacent blocks with the same material
        // For now, we'll just create a single merged mesh for the chunk
        
        const chunk = this.chunks[chunkKey];
        const blockKeys = Object.keys(chunk.blocks);
        
        if (blockKeys.length === 0) {
            return;
        }
        
        // Create merged mesh
        const mergedMesh = BABYLON.Mesh.MergeMeshes(
            Object.values(chunk.blocks).map(block => block.mesh),
            true,
            true,
            undefined,
            false,
            true
        );
        
        if (mergedMesh) {
            mergedMesh.name = `chunk_${chunkKey}`;
            mergedMesh.checkCollisions = true;
            chunk.meshes.push(mergedMesh);
        }
    }

    unloadChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        if (!chunk) return;
        
        // Dispose all meshes in the chunk
        chunk.meshes.forEach(mesh => {
            if (mesh) {
                mesh.dispose();
            }
        });
        
        // Remove chunk from memory
        delete this.chunks[chunkKey];
    }

    createBlock(x, y, z, chunkKey = null) {
        // Create a unique key for this block position
        const blockKey = `${x},${y},${z}`;
        
        // Check if block already exists at this position
        if (this.blocks[blockKey]) {
            return this.blocks[blockKey];
        }
        
        // Create block mesh
        const block = BABYLON.MeshBuilder.CreateBox(`block_${blockKey}`, { size: this.blockSize }, this.scene);
        block.position = new BABYLON.Vector3(x, y, z);
        block.material = this.blockMaterial;
        block.checkCollisions = true;
        
        // Store block in blocks object
        const blockData = {
            mesh: block,
            position: { x, y, z }
        };
        
        this.blocks[blockKey] = blockData;
        
        // If this block belongs to a chunk, add it to the chunk
        if (chunkKey && this.chunks[chunkKey]) {
            this.chunks[chunkKey].blocks[blockKey] = blockData;
        }
        
        return blockData;
    }

    removeBlock(x, y, z) {
        const blockKey = `${x},${y},${z}`;
        
        if (this.blocks[blockKey]) {
            // Get the block's mesh
            const block = this.blocks[blockKey];
            
            // Dispose the mesh
            if (block.mesh) {
                block.mesh.dispose();
            }
            
            // Remove from blocks object
            delete this.blocks[blockKey];
            
            // Find and remove from chunk if it exists
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            if (this.chunks[chunkKey] && this.chunks[chunkKey].blocks[blockKey]) {
                delete this.chunks[chunkKey].blocks[blockKey];
            }
            
            return true;
        }
        
        return false;
    }

    registerEventHandlers() {
        // Pointer lock change handler
        const pointerLockChange = () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            
            // If we lost pointer lock and not paused, pause the game
            if (!this.isPointerLocked && !this.isPaused) {
                this.togglePause();
            }
        };
        
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        
        // Click handler for canvas
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked && !this.isPaused) {
                this.canvas.requestPointerLock();
            }
        });
        
        // Key down handler
        window.addEventListener('keydown', (event) => {
            if (this.isPaused && event.code !== 'Escape') {
                return; // Ignore most keypresses when paused
            }
            
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    this.jump = true;
                    break;
                case 'KeyE':
                    // Place block
                    if (this.selectedBlockPosition) {
                        const { position, normal } = this.selectedBlockPosition;
                        const newX = Math.round(position.x + normal.x);
                        const newY = Math.round(position.y + normal.y);
                        const newZ = Math.round(position.z + normal.z);
                        this.createBlock(newX, newY, newZ);
                    }
                    break;
                case 'KeyQ':
                    // Remove block
                    if (this.selectedBlockPosition) {
                        const { position } = this.selectedBlockPosition;
                        const x = Math.round(position.x);
                        const y = Math.round(position.y);
                        const z = Math.round(position.z);
                        this.removeBlock(x, y, z);
                    }
                    break;
                case 'Escape':
                    // Toggle pause menu
                    this.togglePause();
                    break;
            }
        });
        
        // Key up handler
        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'KeyD':
                    this.moveRight = false;
                    break;
                case 'Space':
                    this.jump = false;
                    break;
            }
        });
        
        // Register before render observer for player movement and block selection
        this.scene.registerBeforeRender(() => {
            if (!this.isPaused) {
                // Handle player movement
                this.handlePlayerMovement();
                
                // Handle block selection
                this.handleBlockSelection();
            }
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Show pause menu
            this.pauseMenu.isVisible = true;
            
            // Exit pointer lock
            document.exitPointerLock();
        } else {
            // Hide pause menu
            this.pauseMenu.isVisible = false;
            
            // Request pointer lock
            this.canvas.requestPointerLock();
        }
    }

    saveWorld() {
        // In a real implementation, you would save the world state
        // For now, we'll just show a notification
        
        const guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('NotificationUI');
        
        const notification = new BABYLON.GUI.TextBlock();
        notification.text = "World Saved!";
        notification.color = "white";
        notification.fontSize = 24;
        notification.outlineWidth = 1;
        notification.outlineColor = "black";
        
        guiTexture.addControl(notification);
        
        // Remove notification after a delay
        setTimeout(() => {
            guiTexture.dispose();
        }, 2000);
    }

    quitToMenu() {
        // Save world state before quitting
        this.saveWorld();
        
        // Reset game state
        this.isPaused = false;
        
        // Show main menu
        const mainMenu = document.getElementById('main-menu');
        const gameCanvas = document.getElementById('game-canvas');
        
        mainMenu.classList.add('active');
        gameCanvas.style.display = 'none';
        
        // Dispose game resources
        this.dispose();
    }

    dispose() {
        // Stop render loop
        this.engine.stopRenderLoop();
        
        // Dispose scene
        this.scene.dispose();
        
        // Reset game instance
        gameInstance = null;
        window.gameInstance = null;
    }

    handlePlayerMovement() {
        if (!this.isPointerLocked) {
            return;
        }
        
        const cameraDirection = this.camera.getDirection(new BABYLON.Vector3(0, 0, 1));
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const right = BABYLON.Vector3.Cross(cameraDirection, BABYLON.Vector3.Up());
        
        // Calculate movement direction
        const moveDirection = BABYLON.Vector3.Zero();
        
        if (this.moveForward) {
            moveDirection.addInPlace(cameraDirection.scale(this.playerSpeed));
        }
        
        if (this.moveBackward) {
            moveDirection.subtractInPlace(cameraDirection.scale(this.playerSpeed));
        }
        
        if (this.moveRight) {
            moveDirection.addInPlace(right.scale(this.playerSpeed));
        }
        
        if (this.moveLeft) {
            moveDirection.subtractInPlace(right.scale(this.playerSpeed));
        }
        
        // Apply movement
        if (moveDirection.length() > 0) {
            this.camera.position.addInPlace(moveDirection);
        }
        
        // Handle jumping
        if (this.jump && this.isGrounded()) {
            this.camera.cameraDirection.y += this.jumpForce;
        }
    }

    isGrounded() {
        // Check if player is on the ground
        const origin = this.camera.position.clone();
        const direction = new BABYLON.Vector3(0, -1, 0);
        const length = this.playerHeight * 0.5 + 0.1;
        
        const ray = new BABYLON.Ray(origin, direction, length);
        const hit = this.scene.pickWithRay(ray);
        
        return hit.hit;
    }

    handleBlockSelection() {
        // Cast ray from camera to find block under crosshair
        const ray = this.scene.createPickingRay(
            this.canvas.width / 2,
            this.canvas.height / 2,
            BABYLON.Matrix.Identity(),
            this.camera
        );
        
        const hit = this.scene.pickWithRay(ray);
        
        if (hit.hit && hit.pickedMesh && hit.pickedMesh.name.startsWith('block_')) {
            // Show highlight mesh at selected block
            this.selectedBlockPosition = {
                position: hit.pickedMesh.position,
                normal: hit.getNormal()
            };
            
            this.highlightMesh.position = hit.pickedMesh.position;
            this.highlightMesh.isVisible = true;
        } else {
            // Hide highlight mesh if no block selected
            this.selectedBlockPosition = null;
            this.highlightMesh.isVisible = false;
        }
    }

    applySettings(settings) {
        this.settings = settings;
        
        // Apply vsync setting
        this.engine.setHardwareScalingLevel(1);
        if (this.settings.maxFramerate > 0) {
            this.engine.setHardwareScalingLevel(1 / (this.settings.maxFramerate / 60));
        }
        
        // Apply camera sensitivity
        this.camera.speed = 0.2 * (this.settings.mouseSensitivity / 5);
        this.camera.angularSensibility = 1000 / this.settings.mouseSensitivity;
        
        // Apply render distance
        this.renderDistance = this.settings.renderDistance;
        this.updateChunks(); // Update chunks based on new render distance
        
        // Apply fog setting
        if (this.settings.fog) {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
            this.scene.fogDensity = 0.01;
            this.scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        } else {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
        }
        
        // Apply FPS counter setting
        if (this.settings.fpsCounter) {
            if (!this.fpsCounter) {
                this.createFpsCounter();
            }
        } else if (this.fpsCounter) {
            this.fpsCounter.dispose();
            this.fpsCounter = null;
        }
    }
}

// Terrain Generator class
class TerrainGenerator {
    constructor(seed, worldSize) {
        this.seed = seed;
        this.worldSize = worldSize;
        this.noiseGenerator = new SimplexNoise(this.seed.toString());
    }
    
    getHeightAt(x, z) {
        // Generate height using simplex noise
        const nx = x / this.worldSize;
        const nz = z / this.worldSize;
        
        // Use multiple octaves of noise for more natural terrain
        let height = 0;
        let amplitude = 10;
        let frequency = 1;
        let persistence = 0.5;
        
        for (let i = 0; i < 4; i++) {
            height += this.noiseGenerator.noise2D(nx * frequency, nz * frequency) * amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return Math.floor(height);
    }
}

// SimplexNoise implementation
class SimplexNoise {
    constructor(seed) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        
        // Initialize the permutation table with values based on the seed
        this.seed(seed);
    }
    
    seed(seed) {
        // Simple hash function
        const hash = (s) => {
            let h = 0;
            for(let i = 0; i < s.length; i++) {
                h = ((h << 5) - h) + s.charCodeAt(i);
                h |= 0;
            }
            return h;
        };
        
        // Initialize permutation table
        for(let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        
        // Shuffle based on the seed
        const seedValue = hash(seed);
        for(let i = 255; i > 0; i--) {
            const j = (seedValue + i) % (i + 1);
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        
        // Extend permutation table
        for(let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    
    // 2D simplex noise
    noise2D(x, y) {
        // Noise contributions from the three corners
        let n0, n1, n2;
        
        // Skew the input space to determine which simplex cell we're in
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        const G2 = (3 - Math.sqrt(3)) / 6;
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        // Determine which simplex we are in
        let i1, j1;
        if(x0 > y0) {
            i1 = 1; j1 = 0;
        } else {
            i1 = 0; j1 = 1;
        }
        
        // Offsets for corners
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.permMod12[ii + this.perm[jj]];
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
        
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if(t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if(t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if(t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value
        // The result is scaled to return values in the interval [-1,1]
        return 70 * (n0 + n1 + n2);
    }
    
    // Dot product helper
    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }
    
    // Gradient vectors for 2D
    grad3 = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [1, 0], [-1, 0],
        [0, 1], [0, -1], [0, 1], [0, -1]
    ];
}

// Initialize game when a world is loaded
function initGame(worldData) {
    // Get settings from storage
    chrome.storage.local.get('settings', function(data) {
        const settings = data.settings || {
            vsync: false,
            fpsCounter: false,
            maxFramerate: 60,
            renderDistance: 8,
            fog: true,
            mouseSensitivity: 5
        };
        
        // Create game instance
        gameInstance = new Game(worldData, settings);
        
        // Store game instance in window for access from menu.js
        window.gameInstance = gameInstance;
    });
}
