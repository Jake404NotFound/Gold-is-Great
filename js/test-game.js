// Test script for Gold is Great game
// This file contains functions to test various aspects of the game

console.log("Loading test-game.js...");

// Test function to verify game initialization
function testGameInitialization() {
    console.log("=== TESTING GAME INITIALIZATION ===");
    
    try {
        // Create test world data
        const testWorld = {
            name: "Test World",
            seed: "12345",
            size: "small"
        };
        
        // Create test settings
        const testSettings = {
            vsync: false,
            fpsCounter: true,
            maxFramerate: 60,
            renderDistance: 4, // Use smaller render distance for testing
            fog: true,
            mouseSensitivity: 5
        };
        
        console.log("Test world data:", testWorld);
        console.log("Test settings:", testSettings);
        
        // Initialize game with test data
        console.log("Initializing game with test data...");
        const game = initGame(testWorld, testSettings);
        
        // Verify game instance was created
        if (!game) {
            console.error("Game initialization failed: No game instance returned");
            return false;
        }
        
        console.log("Game instance created successfully");
        
        // Verify essential game properties
        const essentialProperties = [
            'worldData', 'settings', 'canvas', 'engine', 'scene', 
            'camera', 'light', 'blockMaterial', 'chunkManager'
        ];
        
        let missingProperties = [];
        essentialProperties.forEach(prop => {
            if (game[prop] === undefined) {
                missingProperties.push(prop);
            }
        });
        
        if (missingProperties.length > 0) {
            console.error("Game initialization failed: Missing properties:", missingProperties.join(', '));
            return false;
        }
        
        console.log("All essential game properties are present");
        
        // Verify settings were properly applied
        if (game.settings.renderDistance !== testSettings.renderDistance) {
            console.error(`Settings not properly applied: renderDistance is ${game.settings.renderDistance}, expected ${testSettings.renderDistance}`);
            return false;
        }
        
        console.log("Settings were properly applied");
        
        // Test passed
        console.log("Game initialization test PASSED");
        return true;
    } catch (error) {
        console.error("Game initialization test FAILED with error:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Test function to verify chunk generation
function testChunkGeneration() {
    console.log("=== TESTING CHUNK GENERATION ===");
    
    try {
        // Get game instance
        const game = window.gameInstance;
        
        if (!game) {
            console.error("Chunk generation test FAILED: No game instance found");
            return false;
        }
        
        // Verify chunk manager exists
        if (!game.chunkManager) {
            console.error("Chunk generation test FAILED: No chunk manager found");
            return false;
        }
        
        console.log("Chunk manager found");
        
        // Verify chunks are being generated
        const chunkCount = Object.keys(game.chunkManager.chunks).length;
        console.log(`Current chunk count: ${chunkCount}`);
        
        if (chunkCount === 0) {
            console.error("Chunk generation test FAILED: No chunks generated");
            return false;
        }
        
        console.log(`${chunkCount} chunks generated successfully`);
        
        // Verify chunk meshes are created
        let meshCount = 0;
        Object.values(game.chunkManager.chunks).forEach(chunk => {
            if (chunk.mesh) meshCount++;
        });
        
        console.log(`Chunk meshes created: ${meshCount}/${chunkCount}`);
        
        if (meshCount === 0) {
            console.error("Chunk generation test FAILED: No chunk meshes created");
            return false;
        }
        
        // Test passed
        console.log("Chunk generation test PASSED");
        return true;
    } catch (error) {
        console.error("Chunk generation test FAILED with error:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Test function to verify player controls
function testPlayerControls() {
    console.log("=== TESTING PLAYER CONTROLS ===");
    
    try {
        // Get game instance
        const game = window.gameInstance;
        
        if (!game) {
            console.error("Player controls test FAILED: No game instance found");
            return false;
        }
        
        // Verify camera exists
        if (!game.camera) {
            console.error("Player controls test FAILED: No camera found");
            return false;
        }
        
        console.log("Camera found");
        
        // Record initial position
        const initialPosition = {
            x: game.camera.position.x,
            y: game.camera.position.y,
            z: game.camera.position.z
        };
        
        console.log("Initial player position:", initialPosition);
        
        // Simulate movement controls
        console.log("Simulating forward movement...");
        game.moveForward = true;
        
        // Wait for movement to occur (next render frame)
        setTimeout(() => {
            // Stop movement
            game.moveForward = false;
            
            // Check new position
            const newPosition = {
                x: game.camera.position.x,
                y: game.camera.position.y,
                z: game.camera.position.z
            };
            
            console.log("New player position:", newPosition);
            
            // Verify position changed
            const positionChanged = 
                newPosition.x !== initialPosition.x ||
                newPosition.y !== initialPosition.y ||
                newPosition.z !== initialPosition.z;
            
            if (!positionChanged) {
                console.error("Player controls test FAILED: Position did not change after movement");
                return false;
            }
            
            console.log("Player position changed successfully");
            
            // Test passed
            console.log("Player controls test PASSED");
            return true;
        }, 100);
        
    } catch (error) {
        console.error("Player controls test FAILED with error:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Test function to verify GUI components
function testGUIComponents() {
    console.log("=== TESTING GUI COMPONENTS ===");
    
    try {
        // Get game instance
        const game = window.gameInstance;
        
        if (!game) {
            console.error("GUI components test FAILED: No game instance found");
            return false;
        }
        
        // Check if BABYLON.GUI is available
        if (!window.BABYLON || !window.BABYLON.GUI) {
            console.warn("BABYLON.GUI not available, using fallback system");
            
            // Verify fallback system is working
            if (window.createDOMCrosshair && window.createDOMFPSCounter) {
                console.log("GUI fallback system is available");
            } else {
                console.error("GUI components test FAILED: GUI fallback system not available");
                return false;
            }
        } else {
            console.log("BABYLON.GUI is available");
        }
        
        // Check for crosshair
        const hasCrosshair = game.crosshair || document.getElementById('dom-crosshair');
        if (!hasCrosshair) {
            console.error("GUI components test FAILED: No crosshair found");
            return false;
        }
        
        console.log("Crosshair found");
        
        // Check for FPS counter if enabled
        if (game.settings.fpsCounter) {
            const hasFPSCounter = game.fpsCounter || document.getElementById('dom-fps-counter');
            if (!hasFPSCounter) {
                console.error("GUI components test FAILED: No FPS counter found");
                return false;
            }
            
            console.log("FPS counter found");
        }
        
        // Test passed
        console.log("GUI components test PASSED");
        return true;
    } catch (error) {
        console.error("GUI components test FAILED with error:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log("=== RUNNING ALL GAME TESTS ===");
    
    // Wait for game to be fully loaded
    const checkGameLoaded = setInterval(() => {
        if (window.gameInstance) {
            clearInterval(checkGameLoaded);
            console.log("Game instance found, starting tests...");
            
            // Run tests
            const initResult = testGameInitialization();
            const chunkResult = testChunkGeneration();
            const controlsResult = testPlayerControls();
            const guiResult = testGUIComponents();
            
            // Report results
            console.log("=== TEST RESULTS ===");
            console.log("Game Initialization:", initResult ? "PASSED" : "FAILED");
            console.log("Chunk Generation:", chunkResult ? "PASSED" : "FAILED");
            console.log("Player Controls:", controlsResult ? "PASSED" : "FAILED");
            console.log("GUI Components:", guiResult ? "PASSED" : "FAILED");
            
            const allPassed = initResult && chunkResult && controlsResult && guiResult;
            console.log("Overall Result:", allPassed ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
        }
    }, 1000);
    
    // Timeout after 30 seconds
    setTimeout(() => {
        clearInterval(checkGameLoaded);
        console.error("Test timeout: Game instance not found after 30 seconds");
    }, 30000);
}

// Export test functions
window.testGameInitialization = testGameInitialization;
window.testChunkGeneration = testChunkGeneration;
window.testPlayerControls = testPlayerControls;
window.testGUIComponents = testGUIComponents;
window.runAllTests = runAllTests;

console.log("test-game.js loaded successfully");
