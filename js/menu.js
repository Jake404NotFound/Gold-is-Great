// Menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const mainMenu = document.getElementById('main-menu');
    const worldSelection = document.getElementById('world-selection');
    const worldCreation = document.getElementById('world-creation');
    const settingsMenu = document.getElementById('settings-menu');
    const loadingScreen = document.getElementById('loading-screen');
    const gameCanvas = document.getElementById('game-canvas');
    
    // Main menu buttons
    const playButton = document.getElementById('play-button');
    const settingsButton = document.getElementById('settings-button');
    const exitButton = document.getElementById('exit-button');
    
    // World selection buttons
    const createWorldButton = document.getElementById('create-world-button');
    const backToMainFromWorlds = document.getElementById('back-to-main-from-worlds');
    const worldsList = document.getElementById('worlds-list');
    
    // World creation buttons
    const startWorldButton = document.getElementById('start-world-button');
    const backToWorlds = document.getElementById('back-to-worlds');
    
    // Settings buttons
    const saveSettings = document.getElementById('save-settings');
    const backToMainFromSettings = document.getElementById('back-to-main-from-settings');
    
    // Settings elements
    const vsyncToggle = document.getElementById('vsync');
    const fpsCounterToggle = document.getElementById('fps-counter');
    const maxFramerateSelect = document.getElementById('max-framerate');
    const renderDistanceSlider = document.getElementById('render-distance');
    const renderDistanceValue = document.getElementById('render-distance-value');
    const fogToggle = document.getElementById('fog');
    const mouseSensitivitySlider = document.getElementById('mouse-sensitivity');
    const mouseSensitivityValue = document.getElementById('mouse-sensitivity-value');
    
    // Loading screen elements
    const progressBar = document.getElementById('progress-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    
    // Default settings
    const defaultSettings = {
        vsync: false,
        fpsCounter: false,
        maxFramerate: 60,
        renderDistance: 8,
        fog: true,
        mouseSensitivity: 5
    };
    
    // Current settings
    let currentSettings = {...defaultSettings};
    
    // Worlds storage
    let worlds = [];
    
    // Initialize
    init();
    
    function init() {
        // Load settings from storage
        chrome.storage.local.get('settings', function(data) {
            if (data.settings) {
                currentSettings = data.settings;
                updateSettingsUI();
            }
        });
        
        // Load worlds from storage
        chrome.storage.local.get('worlds', function(data) {
            if (data.worlds) {
                worlds = data.worlds;
                updateWorldsList();
            }
        });
        
        // Add event listeners
        addEventListeners();
    }
    
    function addEventListeners() {
        // Main menu
        playButton.addEventListener('click', showWorldSelection);
        settingsButton.addEventListener('click', showSettingsMenu);
        exitButton.addEventListener('click', exitGame);
        
        // World selection
        createWorldButton.addEventListener('click', showWorldCreation);
        backToMainFromWorlds.addEventListener('click', showMainMenu);
        
        // World creation
        startWorldButton.addEventListener('click', createAndLoadWorld);
        backToWorlds.addEventListener('click', showWorldSelection);
        
        // Settings
        saveSettings.addEventListener('click', saveSettingsToStorage);
        backToMainFromSettings.addEventListener('click', showMainMenu);
        
        // Settings sliders
        renderDistanceSlider.addEventListener('input', function() {
            renderDistanceValue.textContent = this.value;
        });
        
        mouseSensitivitySlider.addEventListener('input', function() {
            mouseSensitivityValue.textContent = this.value;
        });
    }
    
    // Navigation functions
    function showScreen(screen) {
        // Hide all screens
        mainMenu.classList.remove('active');
        worldSelection.classList.remove('active');
        worldCreation.classList.remove('active');
        settingsMenu.classList.remove('active');
        loadingScreen.classList.remove('active');
        gameCanvas.style.display = 'none';
        
        // Show selected screen
        screen.classList.add('active');
    }
    
    function showMainMenu() {
        showScreen(mainMenu);
    }
    
    function showWorldSelection() {
        updateWorldsList();
        showScreen(worldSelection);
    }
    
    function showWorldCreation() {
        showScreen(worldCreation);
    }
    
    function showSettingsMenu() {
        updateSettingsUI();
        showScreen(settingsMenu);
    }
    
    function showLoadingScreen() {
        showScreen(loadingScreen);
        progressBar.style.width = '0%';
        loadingPercentage.textContent = '0%';
    }
    
    function showGame() {
        mainMenu.classList.remove('active');
        worldSelection.classList.remove('active');
        worldCreation.classList.remove('active');
        settingsMenu.classList.remove('active');
        loadingScreen.classList.remove('active');
        gameCanvas.style.display = 'block';
    }
    
    // World functions
    function updateWorldsList() {
        // Clear the list
        worldsList.innerHTML = '';
        
        // Add worlds to the list
        if (worlds.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-worlds-message';
            emptyMessage.textContent = 'No worlds found. Create a new world to get started!';
            worldsList.appendChild(emptyMessage);
        } else {
            worlds.forEach((world, index) => {
                const worldItem = document.createElement('div');
                worldItem.className = 'world-item';
                worldItem.innerHTML = `
                    <div class="world-item-info">
                        <div class="world-item-name">${world.name}</div>
                        <div class="world-item-details">Created: ${new Date(world.created).toLocaleDateString()}</div>
                    </div>
                    <div class="world-item-actions">
                        <button class="play-world-button">Play</button>
                    </div>
                `;
                
                // Add event listener to play button
                worldItem.querySelector('.play-world-button').addEventListener('click', function() {
                    loadWorld(index);
                });
                
                worldsList.appendChild(worldItem);
            });
        }
    }
    
    function createAndLoadWorld() {
        const worldName = document.getElementById('world-name').value.trim() || 'My World';
        const worldSeed = document.getElementById('world-seed').value.trim() || Math.floor(Math.random() * 1000000).toString();
        const worldSize = document.getElementById('world-size').value;
        
        const newWorld = {
            name: worldName,
            seed: worldSeed,
            size: worldSize,
            created: Date.now()
        };
        
        // Add world to storage
        worlds.push(newWorld);
        chrome.storage.local.set({ 'worlds': worlds });
        
        // Show loading screen and start loading the world
        showLoadingScreen();
        loadWorldWithProgress(worlds.length - 1);
    }
    
    function loadWorld(worldIndex) {
        if (worldIndex >= 0 && worldIndex < worlds.length) {
            showLoadingScreen();
            loadWorldWithProgress(worldIndex);
        }
    }
    
    function loadWorldWithProgress(worldIndex) {
        const world = worlds[worldIndex];
        let progress = 0;
        
        // Simulate loading progress
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                // Start the game after loading is complete
                setTimeout(() => {
                    showGame();
                    initGame(world, currentSettings);
                }, 500);
            }
            
            // Update loading UI
            progressBar.style.width = progress + '%';
            loadingPercentage.textContent = Math.floor(progress) + '%';
        }, 100);
    }
    
    // Settings functions
    function updateSettingsUI() {
        vsyncToggle.checked = currentSettings.vsync;
        fpsCounterToggle.checked = currentSettings.fpsCounter;
        maxFramerateSelect.value = currentSettings.maxFramerate;
        renderDistanceSlider.value = currentSettings.renderDistance;
        renderDistanceValue.textContent = currentSettings.renderDistance;
        fogToggle.checked = currentSettings.fog;
        mouseSensitivitySlider.value = currentSettings.mouseSensitivity;
        mouseSensitivityValue.textContent = currentSettings.mouseSensitivity;
    }
    
    function saveSettingsToStorage() {
        // Update current settings from UI
        currentSettings = {
            vsync: vsyncToggle.checked,
            fpsCounter: fpsCounterToggle.checked,
            maxFramerate: parseInt(maxFramerateSelect.value),
            renderDistance: parseInt(renderDistanceSlider.value),
            fog: fogToggle.checked,
            mouseSensitivity: parseInt(mouseSensitivitySlider.value)
        };
        
        // Save to storage
        chrome.storage.local.set({ 'settings': currentSettings }, function() {
            // Show a saved notification
            const notification = document.createElement('div');
            notification.className = 'settings-saved-notification';
            notification.textContent = 'Settings saved!';
            settingsMenu.appendChild(notification);
            
            // Remove notification after a delay
            setTimeout(() => {
                notification.remove();
            }, 2000);
        });
        
        // Apply settings if game is running
        if (gameCanvas.style.display === 'block' && window.gameInstance) {
            window.gameInstance.applySettings(currentSettings);
        }
    }
    
    // Exit game function
    function exitGame() {
        // For Chrome extension, we'll close the popup
        window.close();
    }
});
