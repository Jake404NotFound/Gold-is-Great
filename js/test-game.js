// Test script to verify game loading and debugging
console.log("Running test script to verify game loading and debugging");

// Function to test game initialization
function testGameInitialization() {
    console.log("Testing game initialization...");
    
    // Create test world data
    const testWorldData = {
        name: "Test World",
        seed: "12345",
        size: "small"
    };
    
    // Create test settings
    const testSettings = {
        vsync: true,
        fpsCounter: true,
        maxFramerate: 60,
        renderDistance: 3, // Reduced render distance for testing
        fog: true,
        mouseSensitivity: 5
    };
    
    try {
        // Initialize game with test data
        console.log("Initializing game with test data...");
        const game = initGame(testWorldData, testSettings);
        
        // Check if game instance was created
        if (game) {
            console.log("✅ Game instance created successfully");
        } else {
            console.error("❌ Failed to create game instance");
        }
        
        // Check if Babylon engine was initialized
        if (game && game.engine) {
            console.log("✅ Babylon engine initialized successfully");
        } else {
            console.error("❌ Failed to initialize Babylon engine");
        }
        
        // Check if scene was created
        if (game && game.scene) {
            console.log("✅ Scene created successfully");
        } else {
            console.error("❌ Failed to create scene");
        }
        
        // Check if chunk manager was initialized
        if (game && game.chunkManager) {
            console.log("✅ Chunk manager initialized successfully");
        } else {
            console.error("❌ Failed to initialize chunk manager");
        }
        
        // Check if terrain generator was initialized
        if (game && game.terrainGenerator) {
            console.log("✅ Terrain generator initialized successfully");
            
            // Test terrain generation
            const height = game.terrainGenerator.getHeightAt(0, 0);
            console.log(`Test terrain height at (0,0): ${height}`);
            if (height > 0) {
                console.log("✅ Terrain generation working correctly");
            } else {
                console.error("❌ Terrain generation not working correctly");
            }
        } else {
            console.error("❌ Failed to initialize terrain generator");
        }
        
        return game;
    } catch (error) {
        console.error("❌ Error during game initialization test:", error);
        console.error("Stack trace:", error.stack);
        return null;
    }
}

// Function to test chunk generation
function testChunkGeneration(game) {
    if (!game || !game.chunkManager) {
        console.error("❌ Cannot test chunk generation: Game or chunk manager not available");
        return;
    }
    
    console.log("Testing chunk generation...");
    
    try {
        // Test generating a single chunk
        const testChunkX = 0;
        const testChunkZ = 0;
        
        console.log(`Generating test chunk at (${testChunkX}, ${testChunkZ})...`);
        game.chunkManager.generateChunk(testChunkX, testChunkZ);
        
        // Check if chunk was created
        const chunkKey = `${testChunkX},${testChunkZ}`;
        if (game.chunkManager.chunks[chunkKey]) {
            console.log(`✅ Chunk ${chunkKey} generated successfully`);
            
            // Check if chunk mesh was created
            if (game.chunkManager.chunks[chunkKey].mesh) {
                console.log(`✅ Chunk mesh created successfully`);
            } else {
                console.error(`❌ Failed to create chunk mesh for ${chunkKey}`);
            }
        } else {
            console.error(`❌ Failed to generate chunk ${chunkKey}`);
        }
    } catch (error) {
        console.error("❌ Error during chunk generation test:", error);
        console.error("Stack trace:", error.stack);
    }
}

// Function to test progressive loading
function testProgressiveLoading(game) {
    if (!game || !game.chunkManager) {
        console.error("❌ Cannot test progressive loading: Game or chunk manager not available");
        return;
    }
    
    console.log("Testing progressive chunk loading...");
    
    try {
        // Clear any existing chunks
        game.chunkManager.chunks = {};
        game.chunkManager.loadedChunks.clear();
        game.chunkManager.chunkQueue = [];
        
        // Queue several chunks
        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                game.chunkManager.queueChunk(x, z);
            }
        }
        
        console.log(`Queued ${game.chunkManager.chunkQueue.length} chunks for testing`);
        
        // Start progressive loading
        console.log("Starting progressive chunk generation...");
        game.chunkManager.startChunkGeneration();
        
        // We can't wait for completion in this test script,
        // but we can check if the process started correctly
        if (game.chunkManager.isGenerating) {
            console.log("✅ Progressive chunk generation started successfully");
        } else {
            console.error("❌ Failed to start progressive chunk generation");
        }
    } catch (error) {
        console.error("❌ Error during progressive loading test:", error);
        console.error("Stack trace:", error.stack);
    }
}

// Run tests when document is ready
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, running tests...");
    
    // Add a delay to ensure all scripts are loaded
    setTimeout(() => {
        // Run game initialization test
        const game = testGameInitialization();
        
        // Run chunk generation test if game initialization succeeded
        if (game) {
            testChunkGeneration(game);
            testProgressiveLoading(game);
        }
        
        console.log("All tests completed");
    }, 1000);
});

console.log("Test script loaded successfully");
