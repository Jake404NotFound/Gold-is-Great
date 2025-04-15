// Debug logger for Gold is Great game
class DebugLogger {
    constructor(enabled = true) {
        this.enabled = enabled;
        this.logs = [];
        this.maxLogs = 1000;
        this.domElement = null;
        this.consoleOutput = true;
        this.fileOutput = false;
        this.displayOnScreen = true;
        this.init();
    }

    init() {
        if (this.displayOnScreen) {
            this.createDebugDisplay();
        }
        
        // Override console methods to capture logs
        if (this.enabled) {
            const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
            };
            
            console.log = (...args) => {
                this.log('LOG', ...args);
                if (this.consoleOutput) originalConsole.log(...args);
            };
            
            console.warn = (...args) => {
                this.log('WARN', ...args);
                if (this.consoleOutput) originalConsole.warn(...args);
            };
            
            console.error = (...args) => {
                this.log('ERROR', ...args);
                if (this.consoleOutput) originalConsole.error(...args);
            };
            
            console.info = (...args) => {
                this.log('INFO', ...args);
                if (this.consoleOutput) originalConsole.info(...args);
            };
            
            // Add global error handling
            window.addEventListener('error', (event) => {
                this.log('UNCAUGHT', event.message, 'at', event.filename, 'line', event.lineno, 'col', event.colno);
                this.log('STACK', event.error ? event.error.stack : 'No stack available');
            });
            
            // Add unhandled promise rejection handling
            window.addEventListener('unhandledrejection', (event) => {
                this.log('PROMISE_REJECTION', event.reason);
            });
            
            this.log('INFO', 'Debug logger initialized');
        }
    }

    createDebugDisplay() {
        // Create debug overlay
        this.domElement = document.createElement('div');
        this.domElement.id = 'debug-overlay';
        this.domElement.style.position = 'fixed';
        this.domElement.style.bottom = '0';
        this.domElement.style.left = '0';
        this.domElement.style.width = '100%';
        this.domElement.style.maxHeight = '200px';
        this.domElement.style.overflowY = 'auto';
        this.domElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.domElement.style.color = '#fff';
        this.domElement.style.fontFamily = 'monospace';
        this.domElement.style.fontSize = '12px';
        this.domElement.style.padding = '5px';
        this.domElement.style.zIndex = '9999';
        this.domElement.style.display = 'none'; // Hidden by default
        
        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Debug';
        toggleButton.style.position = 'fixed';
        toggleButton.style.bottom = '0';
        toggleButton.style.right = '0';
        toggleButton.style.zIndex = '10000';
        toggleButton.style.padding = '5px';
        toggleButton.style.backgroundColor = '#333';
        toggleButton.style.color = '#fff';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '3px';
        toggleButton.style.cursor = 'pointer';
        
        toggleButton.addEventListener('click', () => {
            if (this.domElement.style.display === 'none') {
                this.domElement.style.display = 'block';
                toggleButton.textContent = 'Hide Debug';
            } else {
                this.domElement.style.display = 'none';
                toggleButton.textContent = 'Show Debug';
            }
        });
        
        // Add to document when DOM is ready
        if (document.body) {
            document.body.appendChild(this.domElement);
            document.body.appendChild(toggleButton);
        } else {
            window.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(this.domElement);
                document.body.appendChild(toggleButton);
            });
        }
    }

    log(level, ...args) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');
        
        const logEntry = {
            timestamp,
            level,
            message
        };
        
        this.logs.push(logEntry);
        
        // Limit log size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Update display
        if (this.displayOnScreen && this.domElement) {
            const logLine = document.createElement('div');
            logLine.className = `debug-log debug-${level.toLowerCase()}`;
            logLine.style.borderBottom = '1px solid #333';
            logLine.style.padding = '2px 0';
            
            // Color based on level
            switch(level) {
                case 'ERROR':
                case 'UNCAUGHT':
                case 'PROMISE_REJECTION':
                    logLine.style.color = '#ff5555';
                    break;
                case 'WARN':
                    logLine.style.color = '#ffaa55';
                    break;
                case 'INFO':
                    logLine.style.color = '#55aaff';
                    break;
                default:
                    logLine.style.color = '#ffffff';
            }
            
            logLine.textContent = `[${timestamp.split('T')[1].split('.')[0]}] [${level}] ${message}`;
            this.domElement.appendChild(logLine);
            this.domElement.scrollTop = this.domElement.scrollHeight;
        }
        
        // Save to file if enabled
        if (this.fileOutput) {
            // In a real implementation, we would save to a file
            // For Chrome extension, we'll use local storage
            this.saveToStorage();
        }
    }

    saveToStorage() {
        if (chrome && chrome.storage) {
            chrome.storage.local.set({ 'debugLogs': JSON.stringify(this.logs) });
        }
    }

    downloadLogs() {
        const logText = this.logs.map(log => 
            `[${log.timestamp}] [${log.level}] ${log.message}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `gold-is-great-debug-${new Date().toISOString().replace(/:/g, '-')}.log`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    clear() {
        this.logs = [];
        if (this.domElement) {
            this.domElement.innerHTML = '';
        }
    }
}

// Create global debug logger instance
window.debugLogger = new DebugLogger(true);

// Add performance monitoring
class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameTime = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.updateInterval = 1000; // Update every second
        this.lastUpdate = this.lastTime;
        this.memoryUsage = {};
        this.active = true;
        
        this.init();
    }
    
    init() {
        this.update();
        console.info('Performance monitor initialized');
    }
    
    update() {
        if (!this.active) return;
        
        const now = performance.now();
        const elapsed = now - this.lastTime;
        
        this.frames++;
        this.frameTime = elapsed;
        this.lastTime = now;
        
        // Update stats every second
        if (now - this.lastUpdate >= this.updateInterval) {
            this.fps = Math.round((this.frames * 1000) / (now - this.lastUpdate));
            
            // Get memory info if available
            if (performance.memory) {
                this.memoryUsage = {
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
            }
            
            // Log performance data
            console.info(`Performance: ${this.fps} FPS, Frame time: ${this.frameTime.toFixed(2)}ms`);
            if (this.memoryUsage.usedJSHeapSize) {
                console.info(`Memory: ${Math.round(this.memoryUsage.usedJSHeapSize / 1048576)}MB / ${Math.round(this.memoryUsage.jsHeapSizeLimit / 1048576)}MB`);
            }
            
            this.frames = 0;
            this.lastUpdate = now;
        }
        
        requestAnimationFrame(() => this.update());
    }
    
    stop() {
        this.active = false;
    }
    
    start() {
        if (!this.active) {
            this.active = true;
            this.lastTime = performance.now();
            this.lastUpdate = this.lastTime;
            this.update();
        }
    }
}

// Create global performance monitor
window.performanceMonitor = new PerformanceMonitor();

// Add scene debugger for Babylon.js
class BabylonDebugger {
    constructor() {
        this.scene = null;
        this.inspector = false;
    }
    
    initialize(scene) {
        if (!scene) {
            console.error('Cannot initialize Babylon debugger: No scene provided');
            return;
        }
        
        this.scene = scene;
        console.info('Babylon debugger initialized with scene');
        
        // Add keyboard shortcut for inspector (Ctrl+Alt+I)
        window.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.altKey && event.key === 'i') {
                this.toggleInspector();
            }
        });
    }
    
    toggleInspector() {
        if (!this.scene) {
            console.error('Cannot toggle inspector: No scene available');
            return;
        }
        
        if (this.inspector) {
            this.scene.debugLayer.hide();
            this.inspector = false;
            console.info('Babylon inspector hidden');
        } else {
            this.scene.debugLayer.show();
            this.inspector = true;
            console.info('Babylon inspector shown');
        }
    }
    
    showSceneExplorer() {
        if (!this.scene) return;
        
        console.info('Scene statistics:');
        console.info(`- Total meshes: ${this.scene.meshes.length}`);
        console.info(`- Total materials: ${this.scene.materials.length}`);
        console.info(`- Total textures: ${this.scene.textures.length}`);
        console.info(`- Total lights: ${this.scene.lights.length}`);
        console.info(`- Total cameras: ${this.scene.cameras.length}`);
        
        // Log active meshes
        console.info('Active meshes:');
        this.scene.meshes.forEach((mesh, index) => {
            console.info(`${index}: ${mesh.name} (Visible: ${mesh.isVisible}, Enabled: ${mesh.isEnabled()})`);
        });
    }
}

// Create global Babylon debugger
window.babylonDebugger = new BabylonDebugger();
