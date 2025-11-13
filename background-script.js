// Background boxes animation script
document.addEventListener('DOMContentLoaded', function() {
    const boxesContainer = document.querySelector('.boxes-container');
    
    if (!boxesContainer) return;
    
    const rows = 45;
    const cols = 31;
    
    // Pre-calculate which lines to hide based on stripe patterns (exactly like React)
    const hiddenRightLines = new Set();
    const hiddenTopLines = new Set();
    
    // Generate sparse line removal patterns
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cellKey = `${i},${j}`;
            
            // Horizontal stripes - every 20 rows, hide right lines
            const horizontal = i % 20;
            // Vertical stripes - every 15 columns, hide top lines
            const vertical = j % 15;
            
            // Hide lines based on sparse stripe pattern
            if (horizontal < 2) {
                hiddenRightLines.add(cellKey);
            }
            if (vertical < 2) {
                hiddenTopLines.add(cellKey);
            }
        }
    }
    
    const shouldHideRightLine = (i, j) => hiddenRightLines.has(`${i},${j}`);
    const shouldHideTopLine = (i, j) => hiddenTopLines.has(`${i},${j}`);
    
    // Color palette
    const colors = [
        'rgb(125 211 252)', // sky-300
        'rgb(249 168 212)', // pink-300
        'rgb(134 239 172)', // green-300
        'rgb(253 224 71)',  // yellow-300
        'rgb(252 165 165)', // red-300
        'rgb(216 180 254)', // purple-300
        'rgb(147 197 253)', // blue-300
        'rgb(165 180 252)', // indigo-300
        'rgb(196 181 253)', // violet-300
    ];
    
    const getRandomColor = () => {
        return colors[Math.floor(Math.random() * colors.length)];
    };
    
    // Create rows
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'box-row';
        
        // Create columns for this row
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.className = 'box-cell';
            
            // Add border classes based on pattern
            if (!shouldHideRightLine(i, j)) {
                cell.classList.add('border-r');
            }
            if (!shouldHideTopLine(i, j)) {
                cell.classList.add('border-t');
            }
            
            // Add SVG icon for certain cells - exactly like React version
            if (j % 2 === 0 && i % 2 === 0) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('stroke-width', '1.5');
                svg.setAttribute('stroke', 'currentColor');
                svg.className = 'box-icon';
                svg.style.color = '#ffffff'; // White plus icons
                svg.style.strokeWidth = '1px'; // Thin stroke like React
                
                // Small size like React - set directly
                svg.style.width = '12px';
                svg.style.height = '12px';
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('d', 'M12 6v12m6-6H6');
                svg.appendChild(path);
                
                cell.appendChild(svg);
            }
            
            // Individual cell hover removed for performance
            
            row.appendChild(cell);
        }
        
        boxesContainer.appendChild(row);
    }
    
    // Grid generation complete
    
    // CURSOR BUBBLE EFFECT - Warp lines inside bubble
    let mouseX = 0;
    let mouseY = 0;
    const bubbleRadius = 200; // Bubble size in pixels
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Get all grid cells
        const cells = boxesContainer.querySelectorAll('.box-cell');
        
        cells.forEach(cell => {
            const rect = cell.getBoundingClientRect();
            const cellCenterX = rect.left + rect.width / 2;
            const cellCenterY = rect.top + rect.height / 2;
            
            // Calculate distance from cursor to cell center
            const distance = Math.sqrt(
                Math.pow(mouseX - cellCenterX, 2) + Math.pow(mouseY - cellCenterY, 2)
            );
            
            if (distance < bubbleRadius) {
                // Inside bubble - apply warp effect
                const warpStrength = (bubbleRadius - distance) / bubbleRadius; // Stronger closer to center
                const angle = Math.atan2(mouseY - cellCenterY, mouseX - cellCenterX);
                const warpX = Math.cos(angle) * warpStrength * 40; // Warp distance
                const warpY = Math.sin(angle) * warpStrength * 40;
                
                cell.style.transform = `translate(${warpX}px, ${warpY}px) scale(${1 + warpStrength * 0.4})`;
                cell.style.transition = 'transform 0.1s ease-out';
            } else {
                // Outside bubble - reset to normal
                cell.style.transform = 'translate(0px, 0px) scale(1)';
                cell.style.transition = 'transform 0.3s ease-out';
            }
        });
    });
});
