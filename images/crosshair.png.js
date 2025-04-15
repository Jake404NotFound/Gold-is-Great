// Create a simple crosshair image
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 32;
canvas.height = 32;

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

drawCrosshair();

// Export as PNG
const dataURL = canvas.toDataURL('image/png');
