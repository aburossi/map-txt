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
    let eraserLineWidth = eraserWidth.value; // Dynamisch aus dem Slider

    // Funktion zum Abrufen eines URL-Parameters
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Funktion zum Extrahieren des Seitentitels aus der Referrer-URL
    function getParentPageTitle() {
        const referrer = document.referrer;
        if (!referrer) {
            console.warn('Kein Referrer gefunden. Elternseitentitel kann nicht abgerufen werden.');
            return '';
        }

        try {
            const url = new URL(referrer);
            const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

            // Finde den Index von 'allgemeinbildung'
            const targetSegment = 'allgemeinbildung';
            const targetIndex = pathSegments.indexOf(targetSegment);

            if (targetIndex === -1) {
                console.warn(`Segment '${targetSegment}' wurde im Pfad der Referrer-URL nicht gefunden.`);
                return '';
            }

            // Extrahiere alle Segmente nach 'allgemeinbildung'
            const relevantSegments = pathSegments.slice(targetIndex + 1);

            if (relevantSegments.length === 0) {
                console.warn('Keine Pfadsegmente nach dem Zielsegment gefunden.');
                return '';
            }

            // Ersetze '+', '-', '_' durch Leerzeichen und dekodiere URI-Komponenten
            const formattedSegments = relevantSegments.map(segment => {
                return decodeURIComponent(segment.replace(/[-_+]/g, ' ')).replace(/\b\w/g, char => char.toUpperCase());
            });

            // Verbinde die Segmente mit ' - ' als Trennzeichen
            const formattedTitle = formattedSegments.join(' - ');

            return formattedTitle;
        } catch (e) {
            console.error('Fehler beim Parsen der Referrer-URL:', e);
            return '';
        }
    }

    const assignmentId = getQueryParam('assignmentId') || 'defaultAssignment';
    const parentTitle = getParentPageTitle();

    // Entferne das Präfix 'assignment', um das Suffix zu erhalten
    const assignmentSuffix = assignmentId.replace(/^assignment[_-]?/, '');

    // Setze den dynamischen Titel für die Mindmap
    mindmapTitle.textContent = assignmentSuffix ? `Mindmap: ${assignmentSuffix}` : 'Mindmap Generator';

    // Initialisiere die Größe der Leinwand
    function setupCanvas() {
        // Setze die Leinwandgröße entsprechend dem Container
        const container = document.getElementById('mindmap-canvas-container');
        const containerWidth = container.clientWidth;
        const aspectRatio = 16 / 9; // Landschaftsformat
        const canvasWidth = containerWidth;
        const canvasHeight = containerWidth / aspectRatio;

        // Berücksichtige hohe DPI-Bildschirme
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
        ctx.globalCompositeOperation = 'source-over'; // Standardmodus
    }

    setupCanvas();

    // Lade gespeicherte Leinwand aus localStorage
    function loadCanvas() {
        const dataURL = localStorage.getItem('mindmap');
        if (dataURL) {
            const img = new Image();
            img.onload = function() {
                // Leere die Leinwand, bevor das Bild gezeichnet wird
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
            };
            img.src = dataURL;
        }
    }

    // Speichere die Leinwand in localStorage
    function saveCanvas() {
        const dataURL = canvas.toDataURL();
        localStorage.setItem('mindmap', dataURL);
    }

    // Exponiere die saveCanvas Funktion
    window.saveMindmap = saveCanvas;

    // Aktualisiere die Zeichenfarbe, wenn der Farbwähler sich ändert
    colorPicker.addEventListener('change', (e) => {
        currentColor = e.target.value;
        if (!isEraser) {
            ctx.strokeStyle = currentColor;
        }
    });

    // Aktualisiere die Linienbreite, wenn der Slider sich ändert
    lineWidth.addEventListener('input', (e) => {
        currentLineWidth = e.target.value;
        if (!isEraser) {
            ctx.lineWidth = currentLineWidth;
        }
    });

    // Aktualisiere die Eraser-Linienbreite, wenn der Eraser-Slider sich ändert
    eraserWidth.addEventListener('input', (e) => {
        eraserLineWidth = e.target.value;
        if (isEraser) {
            ctx.lineWidth = eraserLineWidth;
        }
    });

    // Event Listener für die Radiergummi-Schaltfläche
    eraserBtn.addEventListener('click', () => {
        isEraser = !isEraser;
        if (isEraser) {
            // Aktivieren des Radiermodus
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = eraserLineWidth; // Radiergröße festlegen
            eraserBtn.classList.add('active');
            canvas.classList.add('destination-out');
            canvas.classList.remove('source-over');
        } else {
            // Deaktivieren des Radiermodus
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentLineWidth; // Zeichenbreite beibehalten
            eraserBtn.classList.remove('active');
            canvas.classList.add('source-over');
            canvas.classList.remove('destination-out');
        }
    });

    // Event Listener für die Vollbild-Schaltfläche
    fullscreenBtn.addEventListener('click', () => {
        const mindmapContainer = document.getElementById('mindmap-container');

        if (!document.fullscreenElement) {
            // Versuche, den Vollbildmodus zu aktivieren
            if (mindmapContainer.requestFullscreen) {
                mindmapContainer.requestFullscreen();
            } else if (mindmapContainer.webkitRequestFullscreen) { /* Safari */
                mindmapContainer.webkitRequestFullscreen();
            } else if (mindmapContainer.msRequestFullscreen) { /* IE11 */
                mindmapContainer.msRequestFullscreen();
            }
        } else {
            // Vollbildmodus beenden
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    });

    // Event Listener für den Vollbildmodus-Änderungen
    document.addEventListener('fullscreenchange', () => {
        const mindmapContainer = document.getElementById('mindmap-container');
        const isFullscreen = document.fullscreenElement === mindmapContainer;

        if (isFullscreen) {
            // Vollbildmodus aktiviert
            mindmapContainer.classList.add('fullscreen');
            fullscreenBtn.textContent = 'Vollbild verlassen';
            fullscreenBtn.classList.add('active');
        } else {
            // Vollbildmodus deaktiviert
            mindmapContainer.classList.remove('fullscreen');
            fullscreenBtn.textContent = 'Vollbild';
            fullscreenBtn.classList.remove('active');
        }
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

    // Touch Events für mobile Geräte
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

    // Clear Canvas und Modus zurücksetzen
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    // Print Canvas als Bild
    printBtn.addEventListener('click', () => {
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.focus();
                    printWindow.print();
                    // Optional: revoke the object URL after printing
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

    // Lade die Leinwand beim Laden der Seite
    window.addEventListener('load', loadCanvas);

    // Behandle Fenstergrößenänderungen, um die Leinwandgröße beizubehalten
    window.addEventListener('resize', () => {
        // Speichere die aktuelle Leinwand
        const dataURL = canvas.toDataURL();

        // Richten die Leinwand neu ein
        setupCanvas();

        // Lade die gespeicherte Leinwand
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        };
        img.src = dataURL;
    });
})();
