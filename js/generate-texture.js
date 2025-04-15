// Create a simple block texture for testing
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');

// Draw dirt texture
ctx.fillStyle = '#8B4513'; // Brown
ctx.fillRect(0, 0, 128, 128);

// Add some noise/texture
for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = Math.random() * 3 + 1;
    const color = Math.random() > 0.5 ? '#6B3300' : '#9B5523';
    
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
}

// Add a grid pattern
ctx.strokeStyle = '#00000022';
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

// Convert to blob and save
canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    document.body.appendChild(img);
    
    // You can download this image and save it as block.png
    const a = document.createElement('a');
    a.href = url;
    a.download = 'block.png';
    a.click();
});
