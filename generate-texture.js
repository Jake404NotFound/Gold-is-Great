// Generate block.png texture file
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create canvas
const canvas = createCanvas(128, 128);
const ctx = canvas.getContext('2d');

// Draw dirt block texture
function drawDirtTexture() {
    // Base color
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(0, 0, 128, 128);
    
    // Add texture/noise
    for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const size = Math.random() * 3 + 1;
        const color = Math.random() > 0.5 ? '#6B3300' : '#9B5523';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, size, size);
    }
    
    // Add subtle grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 128; i += 16) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(128, i);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 128);
        ctx.stroke();
    }
}

// Draw the texture
drawDirtTexture();

// Save to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./images/block.png', buffer);

console.log('Block texture created successfully!');
