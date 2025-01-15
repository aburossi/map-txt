/* --- Mindmap Generator Script --- */
(function() {
    const canvas = document.getElementById('mindmap-canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('mindmap-colorPicker');
    const lineWidth = document.getElementById('mindmap-lineWidth');
    const eraserWidth = document.getElementById('mindmap-eraserWidth');
    const clearBtn = document.getElementById('mindmap-clearBtn');
    const printBtn = document.getElementById('mindmap-printBtn');
    const mindmapTitle = document.getElementById('mindmap-title');
    const eraserBtn = document.getElementById('mindmap-eraserBtn'); // Eraser Button
    const fullscreenBtn = document.getElementById('mindmap-fullscreenBtn'); // Fullscreen Button

    let drawing = false;
    let currentColor = colorPicker.value;
    let currentLineWidth = lineWidth.value;
    let lastX = 0;
    let lastY = 0;
    let isEraser = false; // Eraser Mode
    let eraserLineWidth = eraserWidth.value; // Dynamically from the Slider

    // Function to get a query parameter by name
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Function to extract the parent page title from the referrer URL
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
    mindmapTitle.textContent = assignmentSuffix ? `Mindmap: ${assignmentSuffix}` : 'Mindmap Generator';

    // Initialize canvas dimensions and scaling
    function setupCanvas() {
        const container = document.getElementById('mindmap-canvas-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const dpr = window.devicePixelRatio || 1;

        // Set canvas dimensions based on container size and DPR
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;

        // Reset any existing transforms before scaling
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        // Initialize drawing settings
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = isEraser ? eraserLineWidth : currentLineWidth;
        ctx.strokeStyle = isEraser ? 'rgba(0,0,0,0)' : currentColor;
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    }

    setupCanvas();

    // Function to save the current canvas state as a data URL
    function saveCanvas() {
        const dataURL = canvas.toDataURL();
        localStorage.setItem('mindmap', dataURL);
        // Trigger an autosave notification
        showAutosaveNotification();
    }

    // Expose the saveCanvas function globally if needed
    window.saveMindmap = saveCanvas;

    // Function to load the saved canvas state from localStorage
    function loadCanvas() {
        const dataURL = localStorage.getItem('mindmap');
        if (dataURL) {
            const img = new Image();
            img.onload = function() {
                // Clear the canvas before drawing the saved image
                ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
                ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
            };
            img.src = dataURL;
        }
    }

    // Debounce function to limit the rate at which a function can fire.
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Resize handler with debouncing to prevent excessive redraws
    const handleResize = debounce(() => {
        // Save the current canvas state
        const dataURL = canvas.toDataURL();

        // Re-setup the canvas with new dimensions
        setupCanvas();

        // Load the saved canvas state
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = dataURL;
    }, 200); // 200ms debounce interval

    // Update drawing color when the color picker changes
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        if (!isEraser) {
            ctx.strokeStyle = currentColor;
        }
    });

    // Update line width when the slider changes
    lineWidth.addEventListener('input', (e) => {
        currentLineWidth = e.target.value;
        if (!isEraser) {
            ctx.lineWidth = currentLineWidth;
        }
    });

    // Update eraser width when the slider changes
    eraserWidth.addEventListener('input', (e) => {
        eraserLineWidth = e.target.value;
        if (isEraser) {
            ctx.lineWidth = eraserLineWidth;
        }
    });

    // Event Listener for the Eraser Button
    eraserBtn.addEventListener('click', () => {
        isEraser = !isEraser;
        if (isEraser) {
            // Activate Eraser Mode
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = eraserLineWidth; // Set eraser size
            eraserBtn.classList.add('active');
            canvas.classList.add('destination-out');
            canvas.classList.remove('source-over');
        } else {
            // Deactivate Eraser Mode
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentLineWidth; // Maintain current line width
            eraserBtn.classList.remove('active');
            canvas.classList.add('source-over');
            canvas.classList.remove('destination-out');
        }
    });

    // Event Listener for the Fullscreen Button
    fullscreenBtn.addEventListener('click', () => {
        const mindmapContainer = document.getElementById('mindmap-container');

        if (!document.fullscreenElement) {
            // Attempt to enter fullscreen mode
            if (mindmapContainer.requestFullscreen) {
                mindmapContainer.requestFullscreen();
            } else if (mindmapContainer.webkitRequestFullscreen) { /* Safari */
                mindmapContainer.webkitRequestFullscreen();
            } else if (mindmapContainer.msRequestFullscreen) { /* IE11 */
                mindmapContainer.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen mode
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    });

    // Event Listener for Fullscreen Changes
    document.addEventListener('fullscreenchange', () => {
        const mindmapContainer = document.getElementById('mindmap-container');
        const isFullscreen = document.fullscreenElement === mindmapContainer;

        if (isFullscreen) {
            // Fullscreen mode activated
            mindmapContainer.classList.add('fullscreen');
            fullscreenBtn.textContent = 'Vollbild verlassen';
            fullscreenBtn.classList.add('active');
            // Trigger a resize to adjust the canvas
            handleResize();
        } else {
            // Fullscreen mode deactivated
            mindmapContainer.classList.remove('fullscreen');
            fullscreenBtn.textContent = 'Vollbild';
            fullscreenBtn.classList.remove('active');
            // Trigger a resize to adjust the canvas
            handleResize();
        }
    });

    // Start Drawing
    function startDrawing(x, y) {
        drawing = true;
        [lastX, lastY] = [x, y];
    }

    // Draw Line
    function drawLine(x, y) {
        if (!drawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    // Stop Drawing
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

    // Touch Events for Mobile Devices
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

    // Clear Canvas and Reset Mode
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        localStorage.removeItem('mindmap');
        if (isEraser) {
            isEraser = false;
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentLineWidth;
            eraserBtn.classList.remove('active');
            canvas.classList.add('source-over');
            canvas.classList.remove('destination-out');
        }
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
                    // Revoke the object URL after printing
                    printWindow.onafterprint = function() {
                        URL.revokeObjectURL(url);
                        printWindow.close();
                    };
                };
            } else {
                alert('Please allow pop-ups for this website to enable printing.');
            }
        }, 'image/png');
    });

    // Load the canvas when the page loads
    window.addEventListener('load', loadCanvas);

    // Handle window resize to adjust the canvas appropriately
    window.addEventListener('resize', handleResize);

    /* --- Autosave Feature Implementation --- */

    // Function to show autosave notification
    function showAutosaveNotification() {
        let notification = document.getElementById('autosave-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'autosave-notification';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = '#fff';
            notification.style.borderRadius = '5px';
            notification.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            notification.textContent = 'Mindmap autosaved';
            document.body.appendChild(notification);
        }

        // Show the notification
        notification.style.opacity = '1';

        // Hide after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 2000);
    }

    // Set up autosave interval (e.g., every 30 seconds)
    const AUTOSAVE_INTERVAL = 30000; // 30000 milliseconds = 30 seconds

    const autosaveTimer = setInterval(() => {
        saveCanvas();
    }, AUTOSAVE_INTERVAL);

    // Save canvas before the user leaves the page
    window.addEventListener('beforeunload', () => {
        saveCanvas();
    });

})();
