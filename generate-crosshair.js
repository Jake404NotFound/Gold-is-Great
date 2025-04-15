// Generate crosshair.png texture file
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create canvas
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Draw crosshair
function drawCrosshair() {
    // Clear canvas
    ctx.clearRect(0, 0, 32, 32);
    
    // Set style
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Draw horizontal line
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(24, 16);
    ctx.stroke();
    
    // Draw vertical line
    ctx.beginPath();
    ctx.moveTo(16, 8);
    ctx.lineTo(16, 24);
    ctx.stroke();
    
    // Add outer circle
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw the crosshair
drawCrosshair();

// Save to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./images/crosshair.png', buffer);

console.log('Crosshair texture created successfully!');
