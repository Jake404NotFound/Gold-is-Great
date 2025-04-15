// Integration of PlayerController with Game class
class Game {
    constructor(worldData, settings) {
        // Apply default settings if settings is undefined
        if (!settings) {
            console.warn("Settings parameter is undefined, using default settings");
            settings = {
                vsync: false,
                fpsCounter: true,
                maxFramerate: 60,
                renderDistance: 8,
                fog: true,
                mouseSensitivity: 5
            };
        }
        
        this.worldData = worldData;
        this.settings = settings;
        this.canvas = document.getElementById('game-canvas');
        this.engine = null;
        this.scene = null;
        this.camera = null;
        this.light = null;
        this.ground = null;
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
        this.chunkSize = 16;
        this.terrainGenerator = new TerrainGenerator(this.seed, this.worldSize);
        this.playerController = null;
        
        // Initialize debug logger if available
        if (window.debugLogger) {
            console.log("Debug logger detected, enabling detailed logging");
        }
        
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
            
            // Initialize chunk manager
            console.log("Initializing chunk manager...");
            this.chunkManager = new ChunkManager(this);
            console.log("Chunk manager initialized");
            
            // Initialize player controller
            console.log("Initializing player controller...");
            this.playerController = new PlayerController(this);
            console.log("Player controller initialized");
            
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
                    if (this.chunkManager) {
                        this.chunkManager.updateChunks();
                    }
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
            
            // Start generating chunks
            console.log("Starting initial chunk generation...");
            this.chunkManager.generateInitialChunks();
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
            
            // Create FPS counter if enabled
            if (this.settings.fpsCounter) {
                console.log("Creating FPS counter");
                this.createFpsCounter();
                console.log("FPS counter created");
            }
            
            console.log("Scene creation completed successfully");
        } catch (error) {
            console.error("Error during scene creation:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    createBlockMaterial() {
        try {
            // Create material for blocks
            this.blockMaterial = new BABYLON.StandardMaterial('blockMaterial', this.scene);
            
            // Create texture from block.png
            const blockTexture = new BABYLON.Texture('images/block.png', this.scene);
            this.blockMaterial.diffuseTexture = blockTexture;
            
            // Enable backface culling for better performance
            this.blockMaterial.backFaceCulling = true;
        } catch (error) {
            console.error("Error creating block material:", error);
            // Create a fallback material if texture loading fails
            this.blockMaterial = new BABYLON.StandardMaterial('fallbackMaterial', this.scene);
            this.blockMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1); // Brown color
        }
    }

    createHighlightMesh() {
        try {
            // Create wireframe box for block highlight
            this.highlightMesh = BABYLON.MeshBuilder.CreateBox('highlightMesh', {
                size: this.blockSize + 0.01,
                updatable: false
            }, this.scene);
            
            // Create highlight material
            const highlightMaterial = new BABYLON.StandardMaterial('highlightMaterial', this.scene);
            highlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
            highlightMaterial.alpha = 0.3;
            highlightMaterial.wireframe = true;
            
            // Apply material
            this.highlightMesh.material = highlightMaterial;
            
            // Initially hide highlight
            this.highlightMesh.isVisible = false;
        } catch (error) {
            console.error("Error creating highlight mesh:", error);
        }
    }

    createCrosshair() {
        try {
            // Create crosshair using GUI if available
            if (BABYLON.GUI && BABYLON.GUI.AdvancedDynamicTexture) {
                const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
                
                // Create crosshair image
                const crosshair = new BABYLON.GUI.Image('crosshair', 'images/crosshair.png');
                crosshair.width = '20px';
                crosshair.height = '20px';
                
                advancedTexture.addControl(crosshair);
            } else {
                console.warn("GUI module not available, using fallback crosshair");
                // Create fallback crosshair using HTML
                const crosshairElement = document.createElement('div');
                crosshairElement.id = 'fallback-crosshair';
                crosshairElement.style.position = 'absolute';
                crosshairElement.style.top = '50%';
                crosshairElement.style.left = '50%';
                crosshairElement.style.transform = 'translate(-50%, -50%)';
                crosshairElement.style.width = '20px';
                crosshairElement.style.height = '20px';
                crosshairElement.style.backgroundColor = 'transparent';
                crosshairElement.style.border = '2px solid white';
                crosshairElement.style.borderRadius = '50%';
                crosshairElement.style.pointerEvents = 'none';
                
                document.body.appendChild(crosshairElement);
            }
        } catch (error) {
            console.error("Error creating crosshair:", error);
        }
    }

    createFpsCounter() {
        try {
            // Create FPS counter using GUI if available
            if (BABYLON.GUI && BABYLON.GUI.AdvancedDynamicTexture) {
                const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('FpsUI');
                
                this.fpsCounter = new BABYLON.GUI.TextBlock();
                this.fpsCounter.text = "FPS: 0";
                this.fpsCounter.color = "white";
                this.fpsCounter.fontSize = 16;
                this.fpsCounter.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
                this.fpsCounter.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
                this.fpsCounter.paddingTop = "10px";
                this.fpsCounter.paddingRight = "10px";
                
                advancedTexture.addControl(this.fpsCounter);
            } else {
                console.warn("GUI module not available, using fallback FPS counter");
                // Create fallback FPS counter using HTML
                const fpsElement = document.createElement('div');
                fpsElement.id = 'fallback-fps';
                fpsElement.style.position = 'absolute';
                fpsElement.style.top = '10px';
                fpsElement.style.right = '10px';
                fpsElement.style.color = 'white';
                fpsElement.style.fontFamily = 'Arial, sans-serif';
                fpsElement.style.fontSize = '16px';
                fpsElement.style.pointerEvents = 'none';
                
                document.body.appendChild(fpsElement);
                
                // Update FPS counter in render loop
                this.fpsCounter = {
                    text: "FPS: 0",
                    update: function(fps) {
                        this.text = `FPS: ${fps}`;
                        fpsElement.textContent = this.text;
                    }
                };
            }
        } catch (error) {
            console.error("Error creating FPS counter:", error);
        }
    }

    createPauseMenu() {
        try {
            // Create pause menu using GUI if available
            if (BABYLON.GUI && BABYLON.GUI.AdvancedDynamicTexture) {
                // Create a dynamic texture for the pause menu
                const pauseTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI('PauseUI');
                
                // Create container for pause menu
                const pausePanel = new BABYLON.GUI.StackPanel();
                pausePanel.width = "300px";
                pausePanel.isVisible = false;
                pausePanel.background = "#333333CC";
                pausePanel.paddingTop = "20px";
                pausePanel.paddingBottom = "20px";
                
                // Create title
                const title = new BABYLON.GUI.TextBlock();
                title.text = "PAUSED";
                title.color = "white";
                title.fontSize = 24;
                title.height = "40px";
                pausePanel.addControl(title);
                
                // Create resume button
                const resumeButton = BABYLON.GUI.Button.CreateSimpleButton("resumeButton", "Resume");
                resumeButton.width = "200px";
                resumeButton.height = "40px";
                resumeButton.color = "white";
                resumeButton.background = "#4CAF50";
                resumeButton.paddingTop = "10px";
                resumeButton.paddingBottom = "10px";
                resumeButton.thickness = 0;
                resumeButton.cornerRadius = 5;
                resumeButton.onPointerUpObservable.add(() => {
                    this.togglePause();
                });
                pausePanel.addControl(resumeButton);
                
                // Create save button
                const saveButton = BABYLON.GUI.Button.CreateSimpleButton("saveButton", "Save & Quit");
                saveButton.width = "200px";
                saveButton.height = "40px";
                saveButton.color = "white";
                saveButton.background = "#2196F3";
                saveButton.paddingTop = "10px";
                saveButton.paddingBottom = "10px";
                saveButton.thickness = 0;
                saveButton.cornerRadius = 5;
                saveButton.onPointerUpObservable.add(() => {
                    this.saveAndQuit();
                });
                pausePanel.addControl(saveButton);
                
                // Add panel to texture
                pauseTexture.addControl(pausePanel);
                
                // Store reference to pause menu
                this.pauseMenu = {
                    texture: pauseTexture,
                    panel: pausePanel
                };
                
                // Register ESC key to toggle pause
                this.scene.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(
                        {
                            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                            parameter: 'Escape'
                        },
                        () => {
                            this.togglePause();
                        }
                    )
                );
            } else {
                console.warn("GUI module not available, using fallback pause menu");
                // Create fallback pause menu using HTML
                const pauseElement = document.createElement('div');
                pauseElement.id = 'fallback-pause';
                pauseElement.style.position = 'absolute';
                pauseElement.style.top = '50%';
                pauseElement.style.left = '50%';
                pauseElement.style.transform = 'translate(-50%, -50%)';
                pauseElement.style.width = '300px';
                pauseElement.style.padding = '20px';
                pauseElement.style.backgroundColor = 'rgba(51, 51, 51, 0.8)';
                pauseElement.style.color = 'white';
                pauseElement.style.fontFamily = 'Arial, sans-serif';
                pauseElement.style.textAlign = 'center';
                pauseElement.style.display = 'none';
                
                pauseElement.innerHTML = `
                    <h2>PAUSED</h2>
                    <button id="resume-button" style="width: 200px; height: 40px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; margin: 10px 0;">Resume</button>
                    <button id="save-quit-button" style="width: 200px; height: 40px; background-color: #2196F3; color: white; border: none; border-radius: 5px; margin: 10px 0;">Save & Quit</button>
                `;
                
                document.body.appendChild(pauseElement);
                
                // Add event listeners
                document.getElementById('resume-button').addEventListener('click', () => {
                    this.togglePause();
                });
                
                document.getElementById('save-quit-button').addEventListener('click', () => {
                    this.saveAndQuit();
                });
                
                // Store reference to pause menu
                this.pauseMenu = {
                    element: pauseElement,
                    show: function() {
                        this.element.style.display = 'block';
                    },
                    hide: function() {
                        this.element.style.display = 'none';
                    }
                };
                
                // Register ESC key to toggle pause
                window.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        this.togglePause();
                    }
                });
            }
        } catch (error) {
            console.error("Error creating pause menu:", error);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            // Show pause menu
            if (this.pauseMenu) {
                if (this.pauseMenu.panel) {
                    this.pauseMenu.panel.isVisible = true;
                } else if (this.pauseMenu.show) {
                    this.pauseMenu.show();
                }
            }
            
            // Unlock pointer
            document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
            document.exitPointerLock();
        } else {
            // Hide pause menu
            if (this.pauseMenu) {
                if (this.pauseMenu.panel) {
                    this.pauseMenu.panel.isVisible = false;
                } else if (this.pauseMenu.hide) {
                    this.pauseMenu.hide();
                }
            }
            
            // Lock pointer
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
            this.canvas.requestPointerLock();
        }
    }

    saveAndQuit() {
        // Save world data
        // For now, just return to main menu
        this.quitToMenu();
    }

    quitToMenu() {
        // Hide game canvas
        this.canvas.style.display = 'none';
        
        // Show main menu
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.classList.add('active');
        }
        
        // Dispose of game resources
        this.dispose();
    }

    dispose() {
        // Stop render loop
        this.engine.stopRenderLoop();
        
        // Dispose of scene
        if (this.scene) {
            this.scene.dispose();
        }
        
        // Dispose of engine
        if (this.engine) {
            this.engine.dispose();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.engine.resize);
        
        // Reset game instance
        window.gameInstance = null;
    }

    registerEventHandlers() {
        // Register ESC key to toggle pause
        this.scene.actionManager = new BABYLON.ActionManager(this.scene);
        
        this.scene.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                {
                    trigger: BABYLON.ActionManager.OnKeyDownTrigger,
                    parameter: 'Escape'
                },
                () => {
                    this.togglePause();
                }
            )
        );
    }

    // Update loading progress
    updateLoadingProgress(progress) {
        const progressBar = document.getElementById('progress-bar');
        const loadingPercentage = document.getElementById('loading-percentage');
        
        if (progressBar && loadingPercentage) {
            progressBar.style.width = `${progress}%`;
            loadingPercentage.textContent = `${Math.round(progress)}%`;
        }
    }
    
    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameCanvas = document.getElementById('game-canvas');
        
        if (loadingScreen && gameCanvas) {
            loadingScreen.classList.remove('active');
            gameCanvas.style.display = 'block';
            
            // Lock pointer when game starts
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
            this.canvas.requestPointerLock();
            
            console.log("Loading screen hidden, game started");
        }
    }
}

// Export the Game class
if (typeof module !== 'undefined') {
    module.exports = { Game };
}
