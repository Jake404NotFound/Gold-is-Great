// Create placeholder icons for the extension
function createIcon(size) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    
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
    
    return canvas.toDataURL('image/png');
}

// Create icons for all required sizes
const icon16 = createIcon(16);
const icon48 = createIcon(48);
const icon128 = createIcon(128);

// Create img elements to display the icons
const img16 = document.createElement('img');
img16.src = icon16;
img16.width = 16;
img16.height = 16;
document.body.appendChild(img16);

const img48 = document.createElement('img');
img48.src = icon48;
img48.width = 48;
img48.height = 48;
document.body.appendChild(img48);

const img128 = document.createElement('img');
img128.src = icon128;
img128.width = 128;
img128.height = 128;
document.body.appendChild(img128);

// Download links for the icons
function downloadIcon(dataURL, size) {
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `icon${size}.png`;
    link.click();
}

// Download all icons
downloadIcon(icon16, 16);
downloadIcon(icon48, 48);
downloadIcon(icon128, 128);
