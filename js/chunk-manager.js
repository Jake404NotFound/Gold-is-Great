// Fix game freezing and black screen issues
class ChunkManager {
    constructor(game) {
        this.game = game;
        this.chunks = {};
        this.loadedChunks = new Set();
        this.chunkSize = game.chunkSize;
        this.renderDistance = game.settings.renderDistance;
        this.worldSize = game.worldSize;
        this.terrainGenerator = game.terrainGenerator;
        this.scene = game.scene;
        this.blockMaterial = game.blockMaterial;
        this.blockSize = game.blockSize;
        this.maxChunksPerFrame = 1; // Only generate one chunk per frame to prevent freezing
        this.chunkQueue = []; // Queue of chunks to be generated
        this.isGenerating = false;
    }

    generateInitialChunks() {
        try {
            console.log("Starting initial chunk generation with progressive loading");
            
            // Generate chunks around player
            const playerChunkX = Math.floor(this.game.camera.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.game.camera.position.z / this.chunkSize);
            console.log(`Player position: ${this.game.camera.position.x}, ${this.game.camera.position.y}, ${this.game.camera.position.z}`);
            console.log(`Player chunk: ${playerChunkX}, ${playerChunkZ}`);
            console.log(`Render distance: ${this.renderDistance}, Chunk size: ${this.chunkSize}`);
            
            // Clear any existing queue
            this.chunkQueue = [];
            
            // Add chunks to queue in spiral pattern (closest first)
            for (let layer = 0; layer <= this.renderDistance; layer++) {
                // Add chunks in a square ring around the player
                for (let i = -layer; i <= layer; i++) {
                    // Top and bottom edges of the square
                    this.queueChunk(playerChunkX + i, playerChunkZ - layer);
                    if (layer > 0) { // Avoid duplicating the top row
                        this.queueChunk(playerChunkX + i, playerChunkZ + layer);
                    }
                }
                
                // Left and right edges of the square (excluding corners which are already added)
                for (let i = -layer + 1; i <= layer - 1; i++) {
                    this.queueChunk(playerChunkX - layer, playerChunkZ + i);
                    this.queueChunk(playerChunkX + layer, playerChunkZ + i);
                }
            }
            
            console.log(`Queued ${this.chunkQueue.length} chunks for generation`);
            
            // Position player above the terrain
            const playerX = 0;
            const playerZ = 0;
            const height = this.terrainGenerator.getHeightAt(playerX, playerZ);
            console.log(`Terrain height at player position: ${height}`);
            this.game.camera.position = new BABYLON.Vector3(playerX, height + this.game.playerHeight + 1, playerZ);
            console.log(`Final player position: ${this.game.camera.position.x}, ${this.game.camera.position.y}, ${this.game.camera.position.z}`);
            
            // Start progressive chunk generation
            this.startChunkGeneration();
        } catch (error) {
            console.error("Error during initial chunk generation:", error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    queueChunk(chunkX, chunkZ) {
        // Skip if outside world bounds
        if (chunkX < -this.worldSize/this.chunkSize/2 || chunkX >= this.worldSize/this.chunkSize/2 ||
            chunkZ < -this.worldSize/this.chunkSize/2 || chunkZ >= this.worldSize/this.chunkSize/2) {
            return;
        }
        
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Skip if chunk already exists
        if (this.chunks[chunkKey]) {
            return;
        }
        
        // Add to queue
        this.chunkQueue.push({x: chunkX, z: chunkZ});
    }
    
    startChunkGeneration() {
        if (this.isGenerating) return;
        
        this.isGenerating = true;
        this.processChunkQueue();
    }
    
    processChunkQueue() {
        try {
            // Update loading progress
            if (this.game.updateLoadingProgress) {
                const total = this.chunkQueue.length + Object.keys(this.chunks).length;
                const completed = Object.keys(this.chunks).length;
                const progress = total > 0 ? (completed / total) * 100 : 100;
                this.game.updateLoadingProgress(progress);
                console.log(`Chunk loading progress: ${progress.toFixed(2)}% (${completed}/${total})`);
            }
            
            // Process chunks in queue
            let chunksProcessed = 0;
            while (this.chunkQueue.length > 0 && chunksProcessed < this.maxChunksPerFrame) {
                const chunk = this.chunkQueue.shift();
                this.generateChunk(chunk.x, chunk.z);
                chunksProcessed++;
            }
            
            // Continue processing in next frame if there are more chunks
            if (this.chunkQueue.length > 0) {
                requestAnimationFrame(() => this.processChunkQueue());
            } else {
                console.log("All chunks generated successfully");
                this.isGenerating = false;
                
                // Ensure we have at least one chunk before showing the game
                if (Object.keys(this.chunks).length === 0) {
                    console.error("No chunks were generated! Generating emergency chunk at origin");
                    this.generateChunk(0, 0);
                }
                
                // Add a small delay before hiding loading screen to ensure everything is rendered
                console.log("Preparing to hide loading screen...");
                setTimeout(() => {
                    try {
                        // Hide loading screen when done
                        if (this.game && typeof this.game.hideLoadingScreen === 'function') {
                            console.log("Hiding loading screen now using game.hideLoadingScreen()");
                            this.game.hideLoadingScreen();
                        } else {
                            console.error("Cannot hide loading screen: hideLoadingScreen method not found or not a function");
                            // Fallback method to hide loading screen
                            const loadingScreen = document.getElementById('loading-screen');
                            const gameCanvas = document.getElementById('game-canvas');
                            if (loadingScreen && gameCanvas) {
                                console.log("Using fallback method to hide loading screen");
                                loadingScreen.classList.remove('active');
                                gameCanvas.style.display = 'block';
                                
                                // Force scene render if possible
                                if (this.game && this.game.scene && this.game.engine) {
                                    console.log("Forcing scene render from fallback");
                                    this.game.scene.render();
                                    this.game.engine.resize();
                                }
                                
                                // Initialize player controller if possible
                                if (this.game && typeof window.PlayerController === 'function') {
                                    console.log("Creating PlayerController from fallback");
                                    new window.PlayerController(this.game);
                                }
                            }
                        }
                    } catch (error) {
                        console.error("Error while hiding loading screen:", error);
                        console.error("Stack trace:", error.stack);
                        
                        // Ultimate fallback
                        const loadingScreen = document.getElementById('loading-screen');
                        const gameCanvas = document.getElementById('game-canvas');
                        if (loadingScreen && gameCanvas) {
                            console.log("Using ultimate fallback to hide loading screen after error");
                            loadingScreen.classList.remove('active');
                            gameCanvas.style.display = 'block';
                        }
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("Error in processChunkQueue:", error);
            console.error("Stack trace:", error.stack);
            
            // Emergency fallback to hide loading screen even if there's an error
            const loadingScreen = document.getElementById('loading-screen');
            const gameCanvas = document.getElementById('game-canvas');
            if (loadingScreen && gameCanvas) {
                console.log("Emergency: Hiding loading screen after error");
                loadingScreen.classList.remove('active');
                gameCanvas.style.display = 'block';
            }
        }
    }

    generateChunk(chunkX, chunkZ) {
        try {
            const chunkKey = `${chunkX},${chunkZ}`;
            
            // Skip if chunk already exists
            if (this.chunks[chunkKey]) {
                console.log(`Chunk ${chunkKey} already exists, skipping generation`);
                return;
            }
            
            console.log(`Generating chunk ${chunkKey}`);
            
            // Create chunk container
            const chunk = {
                x: chunkX,
                z: chunkZ,
                blocks: {},
                mesh: null
            };
            
            // Generate terrain for this chunk
            this.generateTerrain(chunk);
            
            // Create mesh for this chunk
            this.createChunkMesh(chunk);
            
            // Store chunk
            this.chunks[chunkKey] = chunk;
            this.loadedChunks.add(chunkKey);
            
            console.log(`Chunk ${chunkKey} generation complete`);
        } catch (error) {
            console.error(`Error generating chunk at ${chunkX}, ${chunkZ}:`, error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    generateTerrain(chunk) {
        // Generate terrain using the terrain generator
        const startX = chunk.x * this.chunkSize;
        const startZ = chunk.z * this.chunkSize;
        
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = startX + x;
                const worldZ = startZ + z;
                
                // Get height at this position
                const height = this.terrainGenerator.getHeightAt(worldX, worldZ);
                
                // Create blocks from bedrock to surface
                for (let y = 0; y < height; y++) {
                    const blockKey = `${x},${y},${z}`;
                    chunk.blocks[blockKey] = {
                        x: x,
                        y: y,
                        z: z,
                        type: y === Math.floor(height) - 1 ? 'grass' : (y > height - 4 ? 'dirt' : 'stone')
                    };
                }
            }
        }
    }
    
    createChunkMesh(chunk) {
        // Create merged mesh for all blocks in chunk
        const positions = [];
        const indices = [];
        const uvs = [];
        
        let indexOffset = 0;
        
        // Add each block to the mesh
        Object.values(chunk.blocks).forEach(block => {
            const x = block.x;
            const y = block.y;
            const z = block.z;
            
            // Only create faces for visible blocks (not surrounded by other blocks)
            const blockKey = `${x},${y},${z}`;
            const topKey = `${x},${y+1},${z}`;
            const bottomKey = `${x},${y-1},${z}`;
            const leftKey = `${x-1},${y},${z}`;
            const rightKey = `${x+1},${y},${z}`;
            const frontKey = `${x},${y},${z+1}`;
            const backKey = `${x},${y},${z-1}`;
            
            const hasTop = chunk.blocks[topKey] !== undefined;
            const hasBottom = chunk.blocks[bottomKey] !== undefined;
            const hasLeft = chunk.blocks[leftKey] !== undefined;
            const hasRight = chunk.blocks[rightKey] !== undefined;
            const hasFront = chunk.blocks[frontKey] !== undefined;
            const hasBack = chunk.blocks[backKey] !== undefined;
            
            // Only add faces that are visible
            if (!hasTop) this.addBlockFace('top', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasBottom) this.addBlockFace('bottom', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasLeft) this.addBlockFace('left', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasRight) this.addBlockFace('right', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasFront) this.addBlockFace('front', x, y, z, positions, indices, uvs, indexOffset);
            if (!hasBack) this.addBlockFace('back', x, y, z, positions, indices, uvs, indexOffset);
            
            // Update index offset
            indexOffset = positions.length / 3;
        });
        
        // Create mesh if there are any vertices
        if (positions.length > 0) {
            // Create vertex data
            const vertexData = new BABYLON.VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.uvs = uvs;
            
            // Calculate normals
            BABYLON.VertexData.ComputeNormals(positions, indices, vertexData.normals);
            
            // Create mesh
            const worldX = chunk.x * this.chunkSize;
            const worldZ = chunk.z * this.chunkSize;
            chunk.mesh = new BABYLON.Mesh(`chunk_${chunk.x}_${chunk.z}`, this.scene);
            chunk.mesh.position = new BABYLON.Vector3(worldX, 0, worldZ);
            
            // Apply vertex data
            vertexData.applyToMesh(chunk.mesh);
            
            // Apply material
            chunk.mesh.material = this.blockMaterial;
            
            // Enable collisions
            chunk.mesh.checkCollisions = true;
        }
    }
    
    addBlockFace(face, x, y, z, positions, indices, uvs, indexOffset) {
        const size = this.blockSize / 2;
        const worldX = x * this.blockSize;
        const worldY = y * this.blockSize;
        const worldZ = z * this.blockSize;
        
        // Define vertices for each face
        let faceVertices = [];
        let faceIndices = [];
        let faceUVs = [];
        
        switch(face) {
            case 'top':
                faceVertices = [
                    worldX - size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'bottom':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'left':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY - size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'right':
                faceVertices = [
                    worldX + size, worldY - size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'front':
                faceVertices = [
                    worldX - size, worldY - size, worldZ + size,
                    worldX + size, worldY - size, worldZ + size,
                    worldX + size, worldY + size, worldZ + size,
                    worldX - size, worldY + size, worldZ + size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
            case 'back':
                faceVertices = [
                    worldX - size, worldY - size, worldZ - size,
                    worldX - size, worldY + size, worldZ - size,
                    worldX + size, worldY + size, worldZ - size,
                    worldX + size, worldY - size, worldZ - size
                ];
                faceUVs = [0, 0, 1, 0, 1, 1, 0, 1];
                break;
        }
        
        // Add vertices to positions array
        positions.push(...faceVertices);
        
        // Add indices (two triangles per face)
        indices.push(
            indexOffset, indexOffset + 1, indexOffset + 2,
            indexOffset, indexOffset + 2, indexOffset + 3
        );
        
        // Add UVs
        uvs.push(...faceUVs);
    }
    
    updateChunks() {
        try {
            // Get current player chunk
            const playerChunkX = Math.floor(this.game.camera.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.game.camera.position.z / this.chunkSize);
            
            // Check which chunks need to be loaded or unloaded
            const chunksToLoad = new Set();
            const chunksToUnload = new Set(this.loadedChunks);
            
            // Determine chunks to load
            for (let x = playerChunkX - this.renderDistance; x <= playerChunkX + this.renderDistance; x++) {
                for (let z = playerChunkZ - this.renderDistance; z <= playerChunkZ + this.renderDistance; z++) {
                    const chunkKey = `${x},${z}`;
                    chunksToLoad.add(chunkKey);
                    chunksToUnload.delete(chunkKey);
                }
            }
            
            // Queue new chunks for loading
            chunksToLoad.forEach(chunkKey => {
                if (!this.loadedChunks.has(chunkKey)) {
                    const [x, z] = chunkKey.split(',').map(Number);
                    this.queueChunk(x, z);
                }
            });
            
            // Start chunk generation if needed
            if (this.chunkQueue.length > 0 && !this.isGenerating) {
                this.startChunkGeneration();
            }
            
            // Unload distant chunks
            chunksToUnload.forEach(chunkKey => {
                this.unloadChunk(chunkKey);
                this.loadedChunks.delete(chunkKey);
            });
        } catch (error) {
            console.error("Error during chunk update:", error);
            console.error("Stack trace:", error.stack);
        }
    }
    
    unloadChunk(chunkKey) {
        const chunk = this.chunks[chunkKey];
        if (chunk && chunk.mesh) {
            chunk.mesh.dispose();
        }
        delete this.chunks[chunkKey];
    }
}

// Export the ChunkManager class
if (typeof module !== 'undefined') {
    module.exports = { ChunkManager };
}
