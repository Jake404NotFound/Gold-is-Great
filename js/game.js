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
        this.seed = parseInt(worldData.seed) || Math.floor(Math.random() * 1000000);
        this.noiseGenerator = new SimplexNoise(this.seed.toString());
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
        // Initialize Babylon.js engine
        this.engine = new BABYLON.Engine(this.canvas, this.settings.vsync, { preserveDrawingBuffer: true, stencil: true });
        
        // Set max framerate if not unlimited
        if (this.settings.maxFramerate > 0) {
            this.engine.setHardwareScalingLevel(1 / (this.settings.maxFramerate / 60));
        }
        
        // Create scene
        this.createScene();
        
        // Register event handlers
        this.registerEventHandlers();
        
        // Start the render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
            
            // Update FPS counter if enabled
            if (this.settings.fpsCounter && this.fpsCounter) {
                this.fpsCounter.text = `FPS: ${Math.round(this.engine.getFps())}`;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }

    createScene() {
        // Create a new scene
        this.scene = new BABYLON.Scene(this.engine);
        
        // Set gravity for physics
        this.scene.gravity = new BABYLON.Vector3(0, this.gravity, 0);
        this.scene.collisionsEnabled = true;
        
        // Create camera
        this.camera = new BABYLON.FreeCamera('playerCamera', new BABYLON.Vector3(0, this.playerHeight, 0), this.scene);
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
        this.camera.minZ = 0.1;
        this.camera.attachControl(this.canvas, true);
        this.camera.speed = 0.2 * (this.settings.mouseSensitivity / 5);
        this.camera.angularSensibility = 1000 / this.settings.mouseSensitivity;
        
        // Create lights
        this.light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        this.light.intensity = 0.7;
        
        // Create block material
        this.createBlockMaterial();
        
        // Generate world
        this.generateWorld();
        
        // Create FPS counter if enabled
        if (this.settings.fpsCounter) {
            this.createFpsCounter();
        }
        
        // Create block highlight mesh
        this.createHighlightMesh();
        
        // Set fog if enabled
        if (this.settings.fog) {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
            this.scene.fogDensity = 0.01;
            this.scene.fogColor = new BABYLON.Color3(0.8, 0.8, 0.8);
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

    generateWorld() {
        // Generate terrain based on simplex noise
        const halfSize = Math.floor(this.worldSize / 2);
        const heightScale = 10; // Maximum height variation
        
        // Create ground
        this.ground = BABYLON.MeshBuilder.CreateGround('ground', { width: this.worldSize, height: this.worldSize }, this.scene);
        this.ground.position = new BABYLON.Vector3(0, -1, 0);
        this.ground.checkCollisions = true;
        
        // Create ground material
        const groundMaterial = new BABYLON.StandardMaterial('groundMaterial', this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.3);
        this.ground.material = groundMaterial;
        
        // Generate blocks based on render distance
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                // Get height from noise
                const worldX = x;
                const worldZ = z;
                
                // Generate height using simplex noise
                const nx = worldX / this.worldSize;
                const nz = worldZ / this.worldSize;
                const height = Math.floor(this.noiseGenerator.noise2D(nx, nz) * heightScale);
                
                // Create block at position
                this.createBlock(worldX, height, worldZ);
                
                // Add some blocks below the surface
                for (let y = height - 1; y > height - 3; y--) {
                    if (Math.random() > 0.3) { // 70% chance to create a block
                        this.createBlock(worldX, y, worldZ);
                    }
                }
            }
        }
        
        // Position player above the terrain
        const playerX = 0;
        const playerZ = 0;
        const nx = playerX / this.worldSize;
        const nz = playerZ / this.worldSize;
        const height = Math.floor(this.noiseGenerator.noise2D(nx, nz) * heightScale);
        this.camera.position = new BABYLON.Vector3(playerX, height + this.playerHeight + 1, playerZ);
    }

    createBlock(x, y, z) {
        // Create a unique key for this block position
        const key = `${x},${y},${z}`;
        
        // Check if block already exists at this position
        if (this.blocks[key]) {
            return;
        }
        
        // Create block mesh
        const block = BABYLON.MeshBuilder.CreateBox(`block_${key}`, { size: this.blockSize }, this.scene);
        block.position = new BABYLON.Vector3(x, y, z);
        block.material = this.blockMaterial;
        block.checkCollisions = true;
        
        // Store block in blocks object
        this.blocks[key] = block;
        
        return block;
    }

    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        
        if (this.blocks[key]) {
            this.blocks[key].dispose();
            delete this.blocks[key];
            return true;
        }
        
        return false;
    }

    registerEventHandlers() {
        // Pointer lock change handler
        const pointerLockChange = () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        };
        
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        
        // Click handler for canvas
        this.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.canvas.requestPointerLock();
            }
        });
        
        // Key down handler
        window.addEventListener('keydown', (event) => {
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
            // Handle player movement
            this.handlePlayerMovement();
            
            // Handle block selection
            this.handleBlockSelection();
        });
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
        // This would require regenerating chunks which is complex
        // For simplicity, we'll just update the property
        this.renderDistance = this.settings.renderDistance;
        
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
