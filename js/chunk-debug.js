// Add debugging to generateInitialChunks and generateChunk methods
class Game {
    // ... existing code ...

    generateInitialChunks() {
        try {
            console.log("Starting initial chunk generation");
            
            // Generate chunks around player
            const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
            console.log(`Player position: ${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`);
            console.log(`Player chunk: ${playerChunkX}, ${playerChunkZ}`);
            console.log(`Render distance: ${this.settings.renderDistance}, Chunk size: ${this.chunkSize}`);
            
            // Generate chunks within render distance
            let chunksGenerated = 0;
            for (let x = playerChunkX - this.settings.renderDistance; x <= playerChunkX + this.settings.renderDistance; x++) {
                for (let z = playerChunkZ - this.settings.renderDistance; z <= playerChunkZ + this.settings.renderDistance; z++) {
                    console.log(`Generating chunk at ${x}, ${z}`);
                    this.generateChunk(x, z);
                    chunksGenerated++;
                }
            }
            console.log(`Generated ${chunksGenerated} initial chunks`);
            
            // Position player above the terrain
            const playerX = 0;
            const playerZ = 0;
            const height = this.terrainGenerator.getHeightAt(playerX, playerZ);
            console.log(`Terrain height at player position: ${height}`);
            this.camera.position = new BABYLON.Vector3(playerX, height + this.playerHeight + 1, playerZ);
            console.log(`Final player position: ${this.camera.position.x}, ${this.camera.position.y}, ${this.camera.position.z}`);
        } catch (error) {
            console.error("Error during initial chunk generation:", error);
            console.error("Stack trace:", error.stack);
        }
    }

    updateChunks() {
        try {
            // Get current player chunk
            const playerChunkX = Math.floor(this.camera.position.x / this.chunkSize);
            const playerChunkZ = Math.floor(this.camera.position.z / this.chunkSize);
            
            // Check which chunks need to be loaded or unloaded
            const chunksToLoad = new Set();
            const chunksToUnload = new Set(this.loadedChunks);
            
            // Determine chunks to load
            for (let x = playerChunkX - this.settings.renderDistance; x <= playerChunkX + this.settings.renderDistance; x++) {
                for (let z = playerChunkZ - this.settings.renderDistance; z <= playerChunkZ + this.settings.renderDistance; z++) {
                    const chunkKey = `${x},${z}`;
                    chunksToLoad.add(chunkKey);
                    chunksToUnload.delete(chunkKey);
                }
            }
            
            // Load new chunks
            chunksToLoad.forEach(chunkKey => {
                if (!this.loadedChunks.has(chunkKey)) {
                    console.log(`Loading new chunk: ${chunkKey}`);
                    const [x, z] = chunkKey.split(',').map(Number);
                    this.generateChunk(x, z);
                    this.loadedChunks.add(chunkKey);
                }
            });
            
            // Unload distant chunks
            chunksToUnload.forEach(chunkKey => {
                console.log(`Unloading distant chunk: ${chunkKey}`);
                this.unloadChunk(chunkKey);
                this.loadedChunks.delete(chunkKey);
            });
        } catch (error) {
            console.error("Error during chunk update:", error);
            console.error("Stack trace:", error.stack);
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
            console.log(`Generating terrain for chunk ${chunkKey}`);
            this.generateTerrain(chunk);
            
            // Create mesh for this chunk
            console.log(`Creating mesh for chunk ${chunkKey}`);
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

    // ... rest of the class ...
}
