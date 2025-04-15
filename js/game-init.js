// Default settings to use if settings parameter is undefined
const DEFAULT_SETTINGS = {
    vsync: false,
    fpsCounter: true,
    maxFramerate: 60,
    renderDistance: 8,
    fog: true,
    mouseSensitivity: 5
};

// Initialize game when world is created
function initGame(worldData, settings) {
    try {
        console.log("Initializing game with world data:", worldData);
        
        // Apply default settings if settings is undefined
        if (!settings) {
            console.warn("Settings parameter is undefined, using default settings");
            settings = DEFAULT_SETTINGS;
        }
        
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
