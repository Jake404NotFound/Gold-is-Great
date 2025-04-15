// Integrate ChunkManager with Game class
class TerrainGenerator {
    constructor(seed, worldSize) {
        this.seed = seed;
        this.worldSize = worldSize;
        this.simplex = new SimplexNoise(seed.toString());
        console.log(`TerrainGenerator initialized with seed: ${seed}, worldSize: ${worldSize}`);
    }
    
    getHeightAt(x, z) {
        try {
            // Normalize coordinates to 0-1 range
            const nx = x / this.worldSize + 0.5;
            const nz = z / this.worldSize + 0.5;
            
            // Generate height using multiple octaves of noise
            let height = 0;
            let amplitude = 1;
            let frequency = 1;
            let maxHeight = 0;
            
            for (let i = 0; i < 4; i++) {
                height += this.simplex.noise2D(nx * frequency, nz * frequency) * amplitude;
                maxHeight += amplitude;
                amplitude *= 0.5;
                frequency *= 2;
            }
            
            // Normalize height to 0-1 range
            height = (height + maxHeight) / (maxHeight * 2);
            
            // Scale height to desired range (1-20 blocks)
            return Math.floor(height * 19) + 1;
        } catch (error) {
            console.error("Error in getHeightAt:", error);
            // Return a default height if there's an error
            return 5;
        }
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

// Modified Game class to use ChunkManager
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
            this.lockPointer();
            
            console.log("Loading screen hidden, game started");
        }
    }

    // Rest of the Game class methods...
    // (createBlockMaterial, createFpsCounter, createCrosshair, createPauseMenu, etc.)
}

// Initialize game when world is created
function initGame(worldData, settings) {
    try {
        console.log("Initializing game with world data:", worldData);
        console.log("Game settings:", settings);
        
        // Show loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const gameCanvas = document.getElementById('game-canvas');
        
        if (loadingScreen && gameCanvas) {
            loadingScreen.classList.add('active');
            gameCanvas.style.display = 'none';
        }
        
        // Create new game instance
        gameInstance = new Game(worldData, settings);
        console.log("Game instance created");
        
        return gameInstance;
    } catch (error) {
        console.error("Error initializing game:", error);
        console.error("Stack trace:", error.stack);
    }
}
