// Simple placeholder icons for the extension
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Create icons for different sizes
function createIcon(size) {
    canvas.width = size;
    canvas.height = size;
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // Draw gold background
    ctx.fillStyle = '#ffd700'; // Gold color
    ctx.fillRect(0, 0, size, size);
    
    // Draw a simple block outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1, size / 16);
    
    // Draw 3D cube
    const margin = size / 4;
    const cubeSize = size - (2 * margin);
    
    // Front face
    ctx.beginPath();
    ctx.rect(margin, margin, cubeSize, cubeSize);
    ctx.stroke();
    
    // Top line
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin + cubeSize/3, margin - cubeSize/4);
    ctx.stroke();
    
    // Right line
    ctx.beginPath();
    ctx.moveTo(margin + cubeSize, margin);
    ctx.lineTo(margin + cubeSize + cubeSize/3, margin - cubeSize/4);
    ctx.stroke();
    
    // Connect top right corners
    ctx.beginPath();
    ctx.moveTo(margin + cubeSize/3, margin - cubeSize/4);
    ctx.lineTo(margin + cubeSize + cubeSize/3, margin - cubeSize/4);
    ctx.stroke();
    
    // Return data URL
    return canvas.toDataURL('image/png');
}

// Create icons for required sizes
const icon16 = createIcon(16);
const icon48 = createIcon(48);
const icon128 = createIcon(128);

// Export icons
console.log('Icons created successfully');
