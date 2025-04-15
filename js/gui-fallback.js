// Initialize Babylon.js GUI module
window.addEventListener('DOMContentLoaded', function() {
    // Check if Babylon.js is loaded
    if (typeof BABYLON === 'undefined') {
        console.error('Babylon.js is not loaded!');
        return;
    }
    
    // Create a global GUI namespace if it doesn't exist
    if (!BABYLON.GUI) {
        console.log('Creating BABYLON.GUI namespace');
        BABYLON.GUI = {};
        
        // Define basic GUI classes to prevent errors
        BABYLON.GUI.AdvancedDynamicTexture = {
            CreateFullscreenUI: function(name) {
                console.log('Creating fallback AdvancedDynamicTexture:', name);
                return {
                    addControl: function() {
                        console.log('Fallback addControl called');
                    }
                };
            }
        };
        
        BABYLON.GUI.Rectangle = function() {
            this.width = "100px";
            this.height = "100px";
            this.cornerRadius = 0;
            this.color = "white";
            this.thickness = 1;
            this.background = "black";
            this.isVisible = true;
            this.addControl = function() {
                console.log('Fallback Rectangle.addControl called');
            };
        };
        
        BABYLON.GUI.TextBlock = function() {
            this.text = "";
            this.color = "white";
            this.fontSize = 12;
            this.textHorizontalAlignment = 0;
            this.textVerticalAlignment = 0;
            this.paddingTop = "0px";
            this.paddingRight = "0px";
        };
        
        BABYLON.GUI.Ellipse = function() {
            this.width = "10px";
            this.height = "10px";
            this.color = "white";
            this.thickness = 1;
            this.background = "transparent";
        };
        
        BABYLON.GUI.Button = {
            CreateSimpleButton: function(name, text) {
                console.log('Creating fallback Button:', name, text);
                return {
                    width: "100px",
                    height: "40px",
                    color: "white",
                    background: "black",
                    cornerRadius: 0,
                    top: "0px",
                    onPointerUpObservable: {
                        add: function(callback) {
                            console.log('Fallback Button.onPointerUpObservable.add called');
                        }
                    }
                };
            }
        };
        
        BABYLON.GUI.Control = {
            HORIZONTAL_ALIGNMENT_LEFT: 0,
            HORIZONTAL_ALIGNMENT_CENTER: 1,
            HORIZONTAL_ALIGNMENT_RIGHT: 2,
            VERTICAL_ALIGNMENT_TOP: 0,
            VERTICAL_ALIGNMENT_CENTER: 1,
            VERTICAL_ALIGNMENT_BOTTOM: 2
        };
    }
    
    console.log('Babylon.js GUI module initialization complete');
});
