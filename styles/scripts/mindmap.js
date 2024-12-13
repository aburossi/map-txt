/* --- Mindmap Generator Script --- */
(function() {
    const canvas = document.getElementById('mindmap-canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('mindmap-colorPicker');
    const lineWidth = document.getElementById('mindmap-lineWidth');
    const clearBtn = document.getElementById('mindmap-clearBtn');
    const printBtn = document.getElementById('mindmap-printBtn');
    const mindmapTitle = document.getElementById('mindmap-title');

    let drawing = false;
    let currentColor = colorPicker.value;
    let currentLineWidth = lineWidth.value;
    let lastX = 0;
    let lastY = 0;

    // Function to retrieve a query parameter by name
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Function to extract the page title from the referrer URL
    function getParentPageTitle() {
        const referrer = document.referrer;
        if (!referrer) {
            console.warn('No referrer found. Cannot retrieve parent page title.');
            return '';
        }

        try {
            const url = new URL(referrer);
            const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

            // Find the index of 'allgemeinbildung'
            const targetSegment = 'allgemeinbildung';
            const targetIndex = pathSegments.indexOf(targetSegment);

            if (targetIndex === -1) {
                console.warn(`Segment '${targetSegment}' not found in referrer URL path.`);
                return '';
            }

            // Extract all segments after 'allgemeinbildung'
            const relevantSegments = pathSegments.slice(targetIndex + 1);

            if (relevantSegments.length === 0) {
                console.warn('No path segments found after the target segment.');
                return '';
            }

            // Replace '+', '-', '_' with spaces and decode URI components
            const formattedSegments = relevantSegments.map(segment => {
                return decodeURIComponent(segment.replace(/[-_+]/g, ' ')).replace(/\b\w/g, char => char.toUpperCase());
            });

            // Join the segments with ' - ' as a separator
            const formattedTitle = formattedSegments.join(' - ');

            return formattedTitle;
        } catch (e) {
            console.error('Error parsing referrer URL:', e);
            return '';
        }
    }

    const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
    const parentTitle = getParentPageTitle();

    // Remove the 'assignment' prefix to get the suffix
    const assignmentSuffix = assignmentId.replace(/^assignment[_-]?/, '');

    // Set the dynamic title for the Mindmap
    mindmapTitle.textContent = assignmentSuffix ? `Mindmap: Auftrag ${assignmentSuffix}` : 'Mindmap Generator';

    // Initialize canvas size
    function setupCanvas() {
        // Set canvas size to match container
        const container = document.getElementById('mindmap-canvas-container');
        const containerWidth = container.clientWidth;
        const aspectRatio = 16 / 9; // Landscape
        const canvasWidth = containerWidth;
        const canvasHeight = containerWidth / aspectRatio;

        // Handle high DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
        ctx.scale(dpr, dpr);

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = currentLineWidth;
        ctx.strokeStyle = currentColor;
    }

    setupCanvas();

    // Load saved canvas from localStorage
    function loadCanvas() {
        const dataURL = localStorage.getItem('mindmap');
        if (dataURL) {
            const img = new Image();
            img.onload = function() {
                // Clear the canvas before drawing the image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
            };
            img.src = dataURL;
        }
    }

    // Save canvas to localStorage
    function saveCanvas() {
        const dataURL = canvas.toDataURL();
        localStorage.setItem('mindmap', dataURL);
    }

    // Update stroke color when color picker changes
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        ctx.strokeStyle = currentColor;
    });

    // Update line width when slider changes
    lineWidth.addEventListener('input', (e) => {
        currentLineWidth = e.target.value;
        ctx.lineWidth = currentLineWidth;
    });

    // Start drawing
    function startDrawing(x, y) {
        drawing = true;
        [lastX, lastY] = [x, y];
    }

    // Draw line
    function drawLine(x, y) {
        if (!drawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    // Stop drawing
    function stopDrawing() {
        if (drawing) {
            drawing = false;
            saveCanvas();
        }
    }

    // Mouse Events
    canvas.addEventListener('mousedown', (e) => {
        startDrawing(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
        drawLine(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch Events for mobile devices
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left);
        const y = (touch.clientY - rect.top);
        startDrawing(x, y);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left);
        const y = (touch.clientY - rect.top);
        drawLine(x, y);
    });

    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // Clear Canvas and localStorage
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        localStorage.removeItem('mindmap');
    });

    // Print Canvas as Image
    printBtn.addEventListener('click', () => {
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.focus();
                    printWindow.print();
                    // Optionally, revoke the object URL after printing
                    printWindow.onafterprint = function() {
                        URL.revokeObjectURL(url);
                        printWindow.close();
                    };
                };
            } else {
                alert('Bitte erlaube Pop-ups für diese Webseite, um das Drucken zu ermöglichen.');
            }
        }, 'image/png');
    });

    // Load the canvas when the page loads
    window.addEventListener('load', loadCanvas);

    // Handle window resize to maintain canvas size
    window.addEventListener('resize', () => {
        // Save current canvas
        const dataURL = canvas.toDataURL();

        // Re-setup the canvas
        setupCanvas();

        // Load the saved canvas
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = dataURL;
    });
})();
