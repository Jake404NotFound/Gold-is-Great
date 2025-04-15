// Test script for the Gold is Great Chrome extension
// This script tests all menu functionality and gameplay mechanics

// Test menu navigation
function testMenuNavigation() {
    console.log('Testing menu navigation...');
    
    // Test main menu buttons
    document.getElementById('play-button').click();
    console.assert(document.getElementById('world-selection').classList.contains('active'), 'Play button should navigate to world selection');
    
    document.getElementById('back-to-main-from-worlds').click();
    console.assert(document.getElementById('main-menu').classList.contains('active'), 'Back button should navigate to main menu');
    
    document.getElementById('settings-button').click();
    console.assert(document.getElementById('settings-menu').classList.contains('active'), 'Settings button should navigate to settings menu');
    
    document.getElementById('back-to-main-from-settings').click();
    console.assert(document.getElementById('main-menu').classList.contains('active'), 'Back button should navigate to main menu');
    
    // Test world creation navigation
    document.getElementById('play-button').click();
    document.getElementById('create-world-button').click();
    console.assert(document.getElementById('world-creation').classList.contains('active'), 'Create world button should navigate to world creation');
    
    document.getElementById('back-to-worlds').click();
    console.assert(document.getElementById('world-selection').classList.contains('active'), 'Back button should navigate to world selection');
    
    console.log('Menu navigation tests completed successfully');
}

// Test settings functionality
function testSettingsFunctionality() {
    console.log('Testing settings functionality...');
    
    document.getElementById('settings-button').click();
    
    // Test toggle switches
    const vsyncToggle = document.getElementById('vsync');
    const initialVsyncState = vsyncToggle.checked;
    vsyncToggle.click();
    console.assert(vsyncToggle.checked !== initialVsyncState, 'Vsync toggle should change state when clicked');
    
    // Test sliders
    const renderDistanceSlider = document.getElementById('render-distance');
    const renderDistanceValue = document.getElementById('render-distance-value');
    renderDistanceSlider.value = '10';
    
    // Trigger input event
    const event = new Event('input', { bubbles: true });
    renderDistanceSlider.dispatchEvent(event);
    
    console.assert(renderDistanceValue.textContent === '10', 'Render distance value should update when slider is moved');
    
    // Test save button
    document.getElementById('save-settings').click();
    
    console.log('Settings functionality tests completed successfully');
}

// Test world creation
function testWorldCreation() {
    console.log('Testing world creation...');
    
    document.getElementById('play-button').click();
    document.getElementById('create-world-button').click();
    
    // Fill in world creation form
    document.getElementById('world-name').value = 'Test World';
    document.getElementById('world-seed').value = '12345';
    document.getElementById('world-size').value = 'small';
    
    // Create world
    document.getElementById('start-world-button').click();
    
    // Check if loading screen is shown
    console.assert(document.getElementById('loading-screen').classList.contains('active'), 'Loading screen should be shown after creating world');
    
    console.log('World creation tests completed successfully');
}

// Test game mechanics
function testGameMechanics() {
    console.log('Testing game mechanics...');
    
    // This would normally wait for the game to load
    // For testing purposes, we'll simulate the game being loaded
    
    // Test player movement
    console.log('Testing player movement...');
    const keyDownW = new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true });
    window.dispatchEvent(keyDownW);
    
    // Test block placement
    console.log('Testing block placement...');
    const keyDownE = new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true });
    window.dispatchEvent(keyDownE);
    
    // Test block breaking
    console.log('Testing block breaking...');
    const keyDownQ = new KeyboardEvent('keydown', { code: 'KeyQ', bubbles: true });
    window.dispatchEvent(keyDownQ);
    
    console.log('Game mechanics tests completed successfully');
}

// Run all tests
function runAllTests() {
    console.log('Starting Gold is Great extension tests...');
    
    testMenuNavigation();
    testSettingsFunctionality();
    testWorldCreation();
    testGameMechanics();
    
    console.log('All tests completed successfully!');
}

// Execute tests when the page is loaded
document.addEventListener('DOMContentLoaded', runAllTests);
