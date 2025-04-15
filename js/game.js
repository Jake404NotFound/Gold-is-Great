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
        console.log("[Game] Initializing...");
        try {
            console.log("[Game] Finding canvas element...");
            this.canvas = document.getElementById('game-canvas');
            console.log("[Game] Canvas element:", this.canvas);
            if (!this.canvas) {
                console.error("[Game] Canvas element 'game-canvas' not found!");
                return; // Stop initialization if canvas is missing
            }

            console.log("[Game] Creating Babylon.js engine...");
            // Initialize Babylon.js engine
            this.engine = new BABYLON.Engine(this.canvas, this.settings.vsync, { preserveDrawingBuffer: true, stencil: true });
            console.log("[Game] Engine created:", this.engine);
            
            // Set max framerate if not unlimited
            if (this.settings.maxFramerate > 0) {
                this.engine.setHardwareScalingLevel(1 / (this.settings.maxFramerate / 60));
                console.log(`Max framerate set to ${this.settings.maxFramerate}`);
            }
            
            // Create scene
            console.log("[Game] Creating scene...");
            this.createScene();
            console.log("[Game] Scene created successfully");
            
            // Register event handlers
            console.log("[Game] Registering event handlers...");
            this.registerEventHandlers();
            console.log("[Game] Event handlers registered");
            
            // Start the render loop
            console.log("[Game] Starting render loop...");
            this.engine.runRenderLoop(() => {
                // console.log("[Game] Render loop tick"); // Optional: Uncomment for very verbose logging
                if (!this.isPaused) {
                    try {
                        this.scene.render();
                    } catch (renderError) {
                        console.error("[Game] Error during scene.render():", renderError);
                        this.engine.stopRenderLoop(); // Stop loop on error
                    }
                    
                    // Update FPS counter if enabled
                    if (this.settings.fpsCounter && this.fpsCounter) {
                        this.fpsCounter.text = `FPS: ${Math.round(this.engine.getFps())}`;
                    }
                    
                    // Update chunks based on player position
                    this.updateChunks();
                }
            });
            console.log("[Game] Render loop started");
            
            // Handle window resize
            window.addEventListener('resize', () => {
                if (this.engine) {
                    this.engine.resize();
                }
            });
            console.log("[Game] Window resize handler added");
            
            // Initialize Babylon debugger if available
            if (window.babylonDebugger) {
                window.babylonDebugger.initialize(this.scene);
                console.log("[Game] Babylon debugger initialized");
            }
            
            console.log("[Game] Initialization complete.");
        } catch (error) {
            console.error("[Game] Error during initialization:", error);
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
        try {
            console.log("Starting initial chunk generation with progressive loading");
            
            // Generate chunks around player
            const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
            console.log(`Player position: ${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`);
            console.log(`Player chunk: ${playerChunkX}, ${playerChunkZ}`);
            console.log(`Render distance: ${this.renderDistance}, Chunk size: ${this.chunkSize}`);
            
            // Generate chunks within render distance
            let chunksGenerated = 0;
            for (let x = playerChunkX - this.settings.renderDistance; x <= playerChunkX + this.settings.renderDistance; x++) {
                for (let z = playerChunkZ - this.settings.renderDistance; z <= playerChunkZ + this.settings.renderDistance; z++) {
                    console.log(`Generating chunk at ${x}, ${z}`);
                    this.generateChunk(x, z);
                    chunksGenerated++;
                }
            }
            console.log(`Generated ${chunksGenerated} initial chunks`);
            
            // Position player above the terrain
            const playerX = 0;
            const playerZ = 0;
            const height = this.terrainGenerator.getHeightAt(playerX, playerZ);
            console.log(`Terrain height at player position: ${height}`);
            this.camera.position = new BABYLON.Vector3(playerX, height + this.playerHeight + 1, playerZ);
            console.log(`Final player position: ${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`);
        } catch (error) {
            console.error("Error during initial chunk generation:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    updateChunks() {
        try {
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
                    console.log(`Loading new chunk: ${chunkKey}`);
                    const [x, z] = chunkKey.split(',').map(Number);
                    this.generateChunk(x, z);
                    this.loadedChunks.add(chunkKey);
                }
            });
            
            // Unload distant chunks
            chunksToUnload.forEach(chunkKey => {
                console.log(`Unloading distant chunk: ${chunkKey}`);
                this.unloadChunk(chunkKey);
                this.loadedChunks.delete(chunkKey);
            });
        } catch (error) {
            console.error("Error during chunk update:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    generateChunk(chunkX, chunkZ) {
        try {
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Skip if chunk already exists
            if (this.chunks[chunkKey]) {
                console.log(`Chunk ${chunkKey} already exists, skipping generation`);
                return;
            }
            
            console.log(`Generating chunk ${chunkKey}`);
            
            // Create chunk container
            const chunk = {
                x: chunkX,
                z: chunkZ,
                blocks: {},
                mesh: null
            };
            
            // Generate terrain for this chunk
            console.log(`Generating terrain for chunk ${chunkKey}`);
            this.generateTerrain(chunk);
            
            // Create mesh for this chunk
            console.log(`Creating mesh for chunk ${chunkKey}`);
            this.createChunkMesh(chunk);
            
            // Store chunk
            this.chunks[chunkKey] = chunk;
            this.loadedChunks.add(chunkKey);
            
            console.log(`Chunk ${chunkKey} generation complete`);
        } catch (error) {
            console.error(`Error generating chunk at ${chunkX}, ${chunkZ}:`, error);
            console.error("Stack trace:", error.stack);
        }
    }

    generateTerrain(chunk) {
        // Generate terrain using SimplexNoise
        const startX = chunk.x * this.chunkSize;
        const startZ = chunk.z * this.chunkSize;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // Get height at this position
                const height = this.terrainGenerator.getHeightAt(worldX, worldZ);
                
                // Create blocks from bedrock to surface
                for (let y = 0; y < height; y++) {
                    const blockKey = `${x},${y},${z}`;
                    chunk.blocks[blockKey] = {
                        x: x,
                        y: y,
                        z: z,
                        type: y === Math.floor(height) - 1 ? 'grass' : (y > height - 4 ? 'dirt' : 'stone')
                    };
                }
            }
        }
    }

    createChunkMesh(chunk) {
        // Create merged mesh for all blocks in chunk
        const positions = [];
        const indices = [];
        const uvs = [];
        
        let indexOffset = 0;
        
        // Add each block to the mesh
        Object.values(chunk.blocks).forEach(block => {
            const x = block.x;
            const y = block.y;
            const z = block.z;
            
            // Only create faces for visible blocks (not surrounded by other blocks)
            const blockKey = `${x},${y},${z}`;
            const topKey = `${x},${y+1},${z}`;
            const bottomKey = `${x},${y-1},${z}`;
            const leftKey = `${x-1},${y},${z}`;
            const rightKey = `${x+1},${y},${z}`;
            const frontKey = `${x},${y},${z+1}`;
            const backKey = `${x},${y},${z-1}`;
            
            const hasTop = chunk.blocks[topKey] !== undefined;
            const hasBottom = chunk.blocks[bottomKey] !== undefined;
            const hasLeft = chunk.blocks[leftKey] !== undefined;
            const hasRight = chunk.blocks[rightKey] !== undefined;
            const hasFront = chunk.blocks[frontKey] !== undefined;
            const hasBack = chunk.blocks[backKey] !== undefined;
            
            // Only add faces that are visible
            if (!hasTop) this.addBlockFace('top', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasBottom) this.addBlockFace('bottom', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasLeft) this.addBlockFace('left', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasRight) this.addBlockFace('right', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasFront) this.addBlockFace('front', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasBack) this.addBlockFace('back', x, y, z, positions, indices, uvs, indexOffset);
            
            // Update index offset
            indexOffset = positions.length / 3;
        });
        
        // Create mesh if there are any vertices
        if (positions.length > 0) {
            // Create vertex data
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.uvs = uvs;
            
            // Calculate normals
            BABYLON.VertexData.ComputeNormals(positions, indices, vertexData.normals);
            
            // Create mesh
            const worldX = chunk.x * this.chunkSize;
            const worldZ = chunk.z * this.chunkSize;
            chunk.mesh = new BABYLON.Mesh(`chunk_${chunk.x}_${chunk.z}`, this.scene);
            chunk.mesh.position = new BABYLON.Vector3(worldX, 0, worldZ);
            
            // Apply vertex data
            vertexData.applyToMesh(chunk.mesh);
            
            // Apply material
            chunk.mesh.material = this.blockMaterial;
            
            // Enable collisions
            chunk.mesh.checkCollisions = true;
        }
    }

    addBlockFace(face, x, y, z, positions, indices, uvs, indexOffset) {
        const size = this.blockSize / 2;
        const worldX = x * this.blockSize;
        const worldY = y * this.blockSize;
        const worldZ = z * this.blockSize;
        
        // Define vertices for each face
        let faceVertices = [];
        let faceIndices = [];
        let faceUVs = [];
        
        switch(face) {
            case 'top':
                faceVertices = [
                    worldX - size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'bottom':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'left':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY - size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'right':
                faceVertices = [
                    worldX + size, worldY - size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'front':
                faceVertices = [
                    worldX - size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'back':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY - size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
        }
        
        // Add vertices to positions array
        positions.push(...faceVertices);
        
        // Add indices (two triangles per face)
        indices.push(
            indexOffset, indexOffset + 1, indexOffset + 2,
            indexOffset, indexOffset + 2, indexOffset + 3
        );
        
        // Add UVs
        uvs.push(...faceUVs);
    }

    unloadChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        if (chunk && chunk.mesh) {
            chunk.mesh.dispose();
        }
        delete this.chunks[chunkKey];
    }

    registerEventHandlers() {
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
                () => { this.jump = true; }
            )
        );
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyUpTrigger,
                    parameter: ' '
                },
                () => { this.jump = false; }
            )
        );
        
        // Toggle pause menu with ESC
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'Escape'
                },
                () => { this.togglePause(); }
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
        
        // Handle mouse click for block interaction
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.lockPointer();
            }
        });
        
        // Update player movement
        this.scene.registerBeforeRender(() => {
            if (this.isPointerLocked && !this.isPaused) {
                // Apply movement
                const cameraDirection = this.camera.getDirection(BABYLON.Vector3.Forward());
                const cameraSide = this.camera.getDirection(BABYLON.Vector3.Right());
                
                if (this.moveForward) {
                    this.camera.position.addInPlace(cameraDirection.scale(this.playerSpeed));
                }
                if (this.moveBackward) {
                    this.camera.position.subtractInPlace(cameraDirection.scale(this.playerSpeed));
                }
                if (this.moveLeft) {
                    this.camera.position.subtractInPlace(cameraSide.scale(this.playerSpeed));
                }
                if (this.moveRight) {
                    this.camera.position.addInPlace(cameraSide.scale(this.playerSpeed));
                }
                if (this.jump) {
                    // Only jump if on ground
                    const ray = new BABYLON.Ray(this.camera.position, new BABYLON.Vector3(0, -1, 0), 1.1);
                    const hit = this.scene.pickWithRay(ray);
                    if (hit.hit) {
                        this.camera.cameraDirection.y += this.jumpForce;
                    }
                }
                
                // Update block highlight
                this.updateBlockHighlight();
            }
        });
    }

    lockPointer() {
        this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
        this.canvas.requestPointerLock();
        
        document.addEventListener('pointerlockchange', this.pointerLockChanged.bind(this), false);
        document.addEventListener('mozpointerlockchange', this.pointerLockChanged.bind(this), false);
    }

    pointerLockChanged() {
        if (document.pointerLockElement === this.canvas || document.mozPointerLockElement === this.canvas) {
            this.isPointerLocked = true;
        } else {
            this.isPointerLocked = false;
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
        
        const hit = this.scene.pickWithRay(ray);
        
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
        if (this.selectedBlockPosition) {
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
                const chunkX = Math.floor(newBlockX / this.chunkSize);
                const chunkZ = Math.floor(newBlockZ / this.chunkSize);
                const chunkKey = `${chunkX},${chunkZ}`;
                
                // Get local block coordinates within chunk
                const localX = ((newBlockX % this.chunkSize) + this.chunkSize) % this.chunkSize;
                const localY = newBlockY;
                const localZ = ((newBlockZ % this.chunkSize) + this.chunkSize) % this.chunkSize;
                const blockKey = `${localX},${localY},${localZ}`;
                
                // Create or get chunk
                if (!this.chunks[chunkKey]) {
                    this.generateChunk(chunkX, chunkZ);
                }
                
                const chunk = this.chunks[chunkKey];
                
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
                this.createChunkMesh(chunk);
            }
        }
    }

    breakBlock() {
        if (this.selectedBlockPosition) {
            // Get chunk coordinates
            const blockX = this.selectedBlockPosition.x;
            const blockY = this.selectedBlockPosition.y;
            const blockZ = this.selectedBlockPosition.z;
            
            const chunkX = Math.floor(blockX / this.chunkSize);
            const chunkZ = Math.floor(blockZ / this.chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Get local block coordinates within chunk
            const localX = ((blockX % this.chunkSize) + this.chunkSize) % this.chunkSize;
            const localY = blockY;
            const localZ = ((blockZ % this.chunkSize) + this.chunkSize) % this.chunkSize;
            const blockKey = `${localX},${localY},${localZ}`;
            
            // Get chunk
            const chunk = this.chunks[chunkKey];
            
            if (chunk && chunk.blocks[blockKey]) {
                // Remove block from chunk
                delete chunk.blocks[blockKey];
                
                // Recreate chunk mesh
                if (chunk.mesh) {
                    chunk.mesh.dispose();
                }
                this.createChunkMesh(chunk);
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Show pause menu
            if (this.pauseMenu) {
                this.pauseMenu.isVisible = true;
            }
            
            // Unlock pointer
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        } else {
            // Hide pause menu
            if (this.pauseMenu) {
                this.pauseMenu.isVisible = false;
            }
            
            // Lock pointer
            this.lockPointer();
        }
    }

    saveWorld() {
        // Save world data to localStorage
        const worldData = {
            name: this.worldData.name,
            seed: this.seed,
            size: this.worldData.size,
            playerPosition: {
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            }
        };
        
        localStorage.setItem(`world_${this.worldData.name}`, JSON.stringify(worldData));
        
        // Show save notification
        alert('World saved successfully!');
    }

    quitToMenu() {
        // Save world before quitting
        this.saveWorld();
        
        // Return to menu
        showMenu('main-menu');
        
        // Dispose of game resources
        this.dispose();
    }

    dispose() {
        // Stop render loop
        this.engine.stopRenderLoop();
        
        // Dispose of scene
        this.scene.dispose();
        
        // Dispose of engine
        this.engine.dispose();
        
        // Remove event listeners
        document.removeEventListener('pointerlockchange', this.pointerLockChanged.bind(this));
        document.removeEventListener('mozpointerlockchange', this.pointerLockChanged.bind(this));
        
        // Clear game instance
        gameInstance = null;
    }
}

class TerrainGenerator {
    constructor(seed, worldSize) {
        this.seed = seed;
        this.worldSize = worldSize;
        this.noise = new SimplexNoise(seed.toString());
    }
    
    getHeightAt(x, z) {
        // Normalize coordinates to 0-1 range
        const nx = x / this.worldSize + 0.5;
        const nz = z / this.worldSize + 0.5;
        
        // Generate height using multiple octaves of noise
        let height = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxHeight = 0;
        
        for (let i = 0; i < 4; i++) {
            height += this.noise.noise2D(nx * frequency, nz * frequency) * amplitude;
            maxHeight += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        // Normalize height to 0-1 range
        height = (height + maxHeight) / (maxHeight * 2);
        
        // Scale height to desired range (1-20 blocks)
        return Math.floor(height * 19) + 1;
    }
}

// SimplexNoise implementation
class SimplexNoise {
    constructor(seed) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        
        // Initialize permutation table with values 0-255
        for (let i = 0; i < 256; i++) {
            this.p[i] = i;
        }
        
        // Shuffle permutation table using Fisher-Yates algorithm with seed
        let random = this.createRandom(seed);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        
        // Extend permutation table for faster lookup
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    
    createRandom(seed) {
        // Simple seeded random number generator
        let s = seed || 1;
        return function() {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
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
        
        // Determine which simplex we're in
        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }
        
        // Offsets for corners
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        
        // Hashed gradient indices
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.permMod12[ii + this.perm[jj]];
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
        
        // Calculate contribution from each corner
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
        }
        
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
        }
        
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value
        // The result is scaled to return values in the interval [-1,1]
        return 70 * (n0 + n1 + n2);
    }
    
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

// Initialize game when world is created
function initGame(worldData, settings) {
    try {
        console.log("[Game] Initializing game with world data:", worldData);
        console.log("[Game] Game settings:", settings);
        
        // Show loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const gameCanvas = document.getElementById('game-canvas');
        
        if (loadingScreen && gameCanvas) {
            loadingScreen.classList.add('active');
            gameCanvas.style.display = 'none';
        }
        
        // Create new game instance
        gameInstance = new Game(worldData, settings);
        console.log("[Game] Game instance created");
        
        return gameInstance;
    } catch (error) {
        console.error("[Game] Error initializing game:", error);
        console.error("Stack trace:", error.stack);
    }
}
