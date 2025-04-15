// Test script for loading screen and game initialization
console.log("Running loading screen test...");

// Function to test if the loading screen is properly hidden
function testLoadingScreenHiding() {
    console.log("=== TESTING LOADING SCREEN HIDING ===");
    
    try {
        // Create a test observer to monitor DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'loading-screen' || 
                    mutation.target.id === 'game-canvas') {
                    console.log(`DOM change detected: ${mutation.target.id} - ${mutation.attributeName} changed to ${mutation.target.style.display || mutation.target.className}`);
                }
            });
        });
        
        // Start observing the loading screen and game canvas
        const loadingScreen = document.getElementById('loading-screen');
        const gameCanvas = document.getElementById('game-canvas');
        
        if (loadingScreen && gameCanvas) {
            observer.observe(loadingScreen, { attributes: true });
            observer.observe(gameCanvas, { attributes: true });
            console.log("DOM observers attached to loading screen and game canvas");
        } else {
            console.error("Could not find loading screen or game canvas elements");
            return false;
        }
        
        // Create a test world
        const testWorld = {
            name: "Test World",
            seed: "12345",
            size: "small"
        };
        
        // Create test settings with minimal render distance for faster loading
        const testSettings = {
            vsync: false,
            fpsCounter: true,
            maxFramerate: 60,
            renderDistance: 2, // Minimal render distance for testing
            fog: false,
            mouseSensitivity: 5
        };
        
        console.log("Starting game with test world and settings");
        
        // Show loading screen manually
        loadingScreen.classList.add('active');
        gameCanvas.style.display = 'none';
        
        // Set a timeout to check if loading screen is still visible after 10 seconds
        const timeoutCheck = setTimeout(() => {
            if (loadingScreen.classList.contains('active')) {
                console.error("LOADING SCREEN TEST FAILED: Loading screen still visible after 10 seconds");
                
                // Force hide loading screen
                console.log("Forcing loading screen to hide");
                loadingScreen.classList.remove('active');
                gameCanvas.style.display = 'block';
                
                // Disconnect observer
                observer.disconnect();
            }
        }, 10000);
        
        // Initialize game
        console.log("Initializing game...");
        if (typeof initGame === 'function') {
            const game = initGame(testWorld, testSettings);
            
            // Check if game instance was created
            if (!game) {
                console.error("LOADING SCREEN TEST FAILED: Game initialization failed");
                clearTimeout(timeoutCheck);
                observer.disconnect();
                return false;
            }
            
            console.log("Game initialized, waiting for loading screen to hide...");
            
            // Set up an interval to check if loading screen is hidden
            const checkInterval = setInterval(() => {
                if (!loadingScreen.classList.contains('active') && 
                    gameCanvas.style.display === 'block') {
                    console.log("LOADING SCREEN TEST PASSED: Loading screen hidden successfully");
                    clearInterval(checkInterval);
                    clearTimeout(timeoutCheck);
                    observer.disconnect();
                }
            }, 500);
            
            return true;
        } else {
            console.error("LOADING SCREEN TEST FAILED: initGame function not found");
            clearTimeout(timeoutCheck);
            observer.disconnect();
            return false;
        }
    } catch (error) {
        console.error("Error in loading screen test:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Function to test chunk generation and rendering
function testChunkGeneration() {
    console.log("=== TESTING CHUNK GENERATION ===");
    
    try {
        // Wait for game instance to be available
        if (!window.gameInstance) {
            console.error("CHUNK GENERATION TEST FAILED: No game instance found");
            return false;
        }
        
        const game = window.gameInstance;
        
        // Check if chunk manager exists
        if (!game.chunkManager) {
            console.error("CHUNK GENERATION TEST FAILED: No chunk manager found");
            return false;
        }
        
        console.log("Chunk manager found");
        
        // Set up an interval to check chunk generation progress
        let checkCount = 0;
        const maxChecks = 20; // Check for up to 10 seconds (20 * 500ms)
        
        const checkInterval = setInterval(() => {
            checkCount++;
            
            // Get current chunk count
            const chunkCount = Object.keys(game.chunkManager.chunks).length;
            console.log(`Chunk count: ${chunkCount} (check ${checkCount}/${maxChecks})`);
            
            // Check if any chunks have been generated
            if (chunkCount > 0) {
                console.log("CHUNK GENERATION TEST PASSED: Chunks generated successfully");
                clearInterval(checkInterval);
                return true;
            }
            
            // Stop checking after max attempts
            if (checkCount >= maxChecks) {
                console.error("CHUNK GENERATION TEST FAILED: No chunks generated after 10 seconds");
                clearInterval(checkInterval);
                return false;
            }
        }, 500);
        
        return true;
    } catch (error) {
        console.error("Error in chunk generation test:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Function to test player controller initialization
function testPlayerController() {
    console.log("=== TESTING PLAYER CONTROLLER ===");
    
    try {
        // Wait for game instance to be available
        if (!window.gameInstance) {
            console.error("PLAYER CONTROLLER TEST FAILED: No game instance found");
            return false;
        }
        
        const game = window.gameInstance;
        
        // Check if camera exists
        if (!game.camera) {
            console.error("PLAYER CONTROLLER TEST FAILED: No camera found");
            return false;
        }
        
        console.log("Camera found");
        
        // Test if player can move
        console.log("Testing player movement...");
        
        // Record initial position
        const initialX = game.camera.position.x;
        const initialY = game.camera.position.y;
        const initialZ = game.camera.position.z;
        
        console.log(`Initial position: ${initialX.toFixed(2)}, ${initialY.toFixed(2)}, ${initialZ.toFixed(2)}`);
        
        // Simulate forward movement
        game.moveForward = true;
        
        // Check position after a short delay
        setTimeout(() => {
            // Stop movement
            game.moveForward = false;
            
            // Get new position
            const newX = game.camera.position.x;
            const newY = game.camera.position.y;
            const newZ = game.camera.position.z;
            
            console.log(`New position: ${newX.toFixed(2)}, ${newY.toFixed(2)}, ${newZ.toFixed(2)}`);
            
            // Check if position changed
            const positionChanged = 
                Math.abs(newX - initialX) > 0.01 || 
                Math.abs(newY - initialY) > 0.01 || 
                Math.abs(newZ - initialZ) > 0.01;
            
            if (positionChanged) {
                console.log("PLAYER CONTROLLER TEST PASSED: Player movement detected");
                return true;
            } else {
                console.error("PLAYER CONTROLLER TEST FAILED: No player movement detected");
                return false;
            }
        }, 1000);
        
        return true;
    } catch (error) {
        console.error("Error in player controller test:", error);
        console.error("Stack trace:", error.stack);
        return false;
    }
}

// Run all tests
function runLoadingTests() {
    console.log("=== RUNNING ALL LOADING TESTS ===");
    
    // Run tests in sequence
    testLoadingScreenHiding();
    
    // Set up interval to check for game instance
    const checkGameInterval = setInterval(() => {
        if (window.gameInstance) {
            clearInterval(checkGameInterval);
            
            // Run remaining tests after game is loaded
            setTimeout(() => {
                testChunkGeneration();
                testPlayerController();
            }, 2000);
        }
    }, 1000);
    
    // Set timeout to stop checking after 15 seconds
    setTimeout(() => {
        clearInterval(checkGameInterval);
        console.log("Stopped checking for game instance after 15 seconds");
    }, 15000);
}

// Export test functions
window.testLoadingScreenHiding = testLoadingScreenHiding;
window.testChunkGeneration = testChunkGeneration;
window.testPlayerController = testPlayerController;
window.runLoadingTests = runLoadingTests;

console.log("Loading tests ready to run");
