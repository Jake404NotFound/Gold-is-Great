// GUI Fallback System
// This file provides fallback implementations for GUI components
// when the BABYLON.GUI module fails to load properly

console.log("Loading GUI fallback system...");

// Create fallback GUI namespace if it doesn't exist
if (!window.BABYLON) {
    window.BABYLON = {};
}

if (!window.BABYLON.GUI) {
    console.warn("BABYLON.GUI not found, using fallback implementation");
    
    // Create fallback GUI namespace
    window.BABYLON.GUI = {
        AdvancedDynamicTexture: class AdvancedDynamicTexture {
            constructor() {
                console.log("Using fallback AdvancedDynamicTexture");
                this.rootContainer = {
                    addControl: function(control) {
                        console.log("Fallback addControl called", control);
                    }
                };
            }
            
            static CreateFullscreenUI(name, foreground, scene) {
                console.log("Creating fallback fullscreen UI:", name);
                return new window.BABYLON.GUI.AdvancedDynamicTexture();
            }
        },
        
        TextBlock: class TextBlock {
            constructor(name) {
                console.log("Creating fallback TextBlock:", name);
                this.name = name;
                this.text = "";
                this.color = "white";
                this.fontSize = 18;
                this.horizontalAlignment = 0;
                this.verticalAlignment = 0;
                this.width = "200px";
                this.height = "50px";
                this.top = "10px";
                this.left = "10px";
            }
        },
        
        Rectangle: class Rectangle {
            constructor(name) {
                console.log("Creating fallback Rectangle:", name);
                this.name = name;
                this.width = "200px";
                this.height = "200px";
                this.thickness = 1;
                this.cornerRadius = 0;
                this.color = "black";
                this.background = "white";
                this.horizontalAlignment = 0;
                this.verticalAlignment = 0;
                this.top = "0px";
                this.left = "0px";
                this.children = [];
                this.isVisible = true;
            }
            
            addControl(control) {
                console.log("Adding control to fallback Rectangle:", control);
                this.children.push(control);
            }
        },
        
        Button: class Button {
            constructor(name) {
                console.log("Creating fallback Button:", name);
                this.name = name;
                this.width = "150px";
                this.height = "40px";
                this.color = "white";
                this.background = "green";
                this.horizontalAlignment = 0;
                this.verticalAlignment = 0;
                this.top = "0px";
                this.left = "0px";
                this.children = [];
                this.isVisible = true;
                this.onPointerClickObservable = {
                    add: function(callback) {
                        console.log("Adding click callback to fallback Button");
                    }
                };
            }
            
            addControl(control) {
                console.log("Adding control to fallback Button:", control);
                this.children.push(control);
            }
        },
        
        Control: {
            HORIZONTAL_ALIGNMENT_LEFT: 0,
            HORIZONTAL_ALIGNMENT_CENTER: 1,
            HORIZONTAL_ALIGNMENT_RIGHT: 2,
            VERTICAL_ALIGNMENT_TOP: 0,
            VERTICAL_ALIGNMENT_CENTER: 1,
            VERTICAL_ALIGNMENT_BOTTOM: 2
        }
    };
    
    console.log("GUI fallback system initialized");
}

// Create a DOM-based fallback for the crosshair if needed
function createDOMCrosshair() {
    // Check if crosshair already exists
    if (document.getElementById('dom-crosshair')) {
        return;
    }
    
    console.log("Creating DOM-based crosshair fallback");
    
    const crosshair = document.createElement('div');
    crosshair.id = 'dom-crosshair';
    crosshair.style.position = 'fixed';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.width = '20px';
    crosshair.style.height = '20px';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.pointerEvents = 'none';
    crosshair.style.zIndex = '1000';
    
    // Create crosshair lines
    const verticalLine = document.createElement('div');
    verticalLine.style.position = 'absolute';
    verticalLine.style.top = '0';
    verticalLine.style.left = '50%';
    verticalLine.style.width = '2px';
    verticalLine.style.height = '100%';
    verticalLine.style.backgroundColor = 'white';
    verticalLine.style.transform = 'translateX(-50%)';
    
    const horizontalLine = document.createElement('div');
    horizontalLine.style.position = 'absolute';
    horizontalLine.style.top = '50%';
    horizontalLine.style.left = '0';
    horizontalLine.style.width = '100%';
    horizontalLine.style.height = '2px';
    horizontalLine.style.backgroundColor = 'white';
    horizontalLine.style.transform = 'translateY(-50%)';
    
    crosshair.appendChild(verticalLine);
    crosshair.appendChild(horizontalLine);
    
    // Add to document when DOM is ready
    if (document.body) {
        document.body.appendChild(crosshair);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(crosshair);
        });
    }
}

// Create a DOM-based fallback for the FPS counter if needed
function createDOMFPSCounter() {
    // Check if FPS counter already exists
    if (document.getElementById('dom-fps-counter')) {
        return;
    }
    
    console.log("Creating DOM-based FPS counter fallback");
    
    const fpsCounter = document.createElement('div');
    fpsCounter.id = 'dom-fps-counter';
    fpsCounter.style.position = 'fixed';
    fpsCounter.style.top = '10px';
    fpsCounter.style.right = '10px';
    fpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsCounter.style.color = 'white';
    fpsCounter.style.padding = '5px 10px';
    fpsCounter.style.fontFamily = 'monospace';
    fpsCounter.style.fontSize = '14px';
    fpsCounter.style.zIndex = '1000';
    fpsCounter.textContent = 'FPS: 0';
    
    // Add to document when DOM is ready
    if (document.body) {
        document.body.appendChild(fpsCounter);
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(fpsCounter);
        });
    }
    
    // Update FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    
    function updateFPS() {
        frameCount++;
        const now = performance.now();
        
        if (now - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (now - lastTime));
            fpsCounter.textContent = `FPS: ${fps}`;
            frameCount = 0;
            lastTime = now;
        }
        
        requestAnimationFrame(updateFPS);
    }
    
    updateFPS();
}

// Export functions for use in other modules
window.createDOMCrosshair = createDOMCrosshair;
window.createDOMFPSCounter = createDOMFPSCounter;

console.log("GUI fallback system loaded successfully");
