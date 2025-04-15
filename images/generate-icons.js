// Create simple placeholder icons for the extension
const sizes = [16, 48, 128];
const iconColor = '#ffd700'; // Gold color

sizes.forEach(size => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw gold background
    ctx.fillStyle = iconColor;
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
    
    // Save as PNG
    const dataURL = canvas.toDataURL('image/png');
    console.log(`Icon ${size}x${size} created`);
});
