/* --- Answers Section Script --- */
(function() {
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
    const assignmentInfo = document.getElementById('answers-assignmentInfo');

    // Remove the 'assignment' prefix to get the suffix
    const assignmentSuffix = assignmentId.replace(/^assignment[_-]?/, '');

    // Set the text to 'Auftrag: {Suffix}' if the element exists
    if (assignmentInfo) {
        assignmentInfo.textContent = assignmentSuffix ? `Auftrag: ${assignmentSuffix}` : 'Auftrag';
    }

    // Initialize Quill editor
    const quill = new Quill('#answers-answerBox', {
        theme: 'snow',
        placeholder: 'Gib hier deine Antworten ein...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        }
    });

    // Display elements
    const savedAnswerContainer = document.getElementById('savedAnswerContainer');
    const savedAssignmentTitle = document.getElementById('answers-savedAssignmentTitle');
    const savedAnswer = document.getElementById('answers-savedAnswer');
    const copyAnswerBtn = document.getElementById('answers-copyAnswerBtn');

    // Load saved content and set it in Quill
    const savedText = localStorage.getItem(assignmentId);
    if (savedText) {
        quill.root.innerHTML = savedText;
        console.log(`Loaded saved text for ${assignmentId}`);
        displaySavedAnswer(savedText);
    } else {
        console.log(`No saved text found for ${assignmentId}`);
    }

    // Function to display the saved answer
    function displaySavedAnswer(content) {
        // Combine parentTitle and assignmentSuffix, if available
        const titleText = parentTitle
            ? `${parentTitle}\nAuftrag: ${assignmentSuffix}`
            : `Auftrag: ${assignmentSuffix}`;
        savedAssignmentTitle.textContent = titleText;
        savedAnswer.innerHTML = content;
        savedAnswerContainer.style.display = 'block';
    }

    // Function to copy the answer to the clipboard
    copyAnswerBtn.addEventListener('click', function() {
        // To ensure plain text is copied, strip HTML tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quill.root.innerHTML;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        const textToCopy = parentTitle
            ? `${parentTitle}\nAuftrag: ${assignmentSuffix}\n${plainText}`
            : `Auftrag: ${assignmentSuffix}\n${plainText}`;
        copyTextToClipboard(textToCopy);
    });

    // Function to copy text to the clipboard
    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                // Confirmation removed
                console.log("Antwort erfolgreich kopiert");
            }, function(err) {
                console.error('Fehler beim Kopieren der Antwort: ', err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            // Fallback to execCommand
            fallbackCopyTextToClipboard(text);
        }
    }

    // Fallback function to copy text to the clipboard
    function fallbackCopyTextToClipboard(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // Hide the textarea element
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                // Confirmation removed
                console.log("Antwort erfolgreich kopiert (Fallback)");
            } else {
                throw new Error("Fallback copy unsuccessful");
            }
        } catch (err) {
            console.error('Fehler beim Kopieren der Antwort (Fallback): ', err);
            // Confirmation removed
        }

        document.body.removeChild(textarea);
    }

    // Function to save the answer to localStorage
    function saveToLocal() {
        const htmlContent = quill.root.innerHTML;
        const textContent = quill.getText().trim();
        if (textContent === "") {
            // Confirmation removed
            console.log("Versuch, mit leerem Textfeld zu speichern");
            return;
        }
        localStorage.setItem(assignmentId, htmlContent);
        // Confirmation removed
        console.log(`Text für ${assignmentId} gespeichert`);
        displaySavedAnswer(htmlContent); // Update the display of the saved answer
    }

    // Function to clear all saved answers from localStorage
    function clearLocalStorage() {
        // Confirmation removed
        localStorage.clear();
        quill.setText(''); // Clear Quill editor
        savedAnswerContainer.style.display = 'none';
        console.log("Alle gespeicherten Antworten wurden gelöscht");
    }

    // Event Listener for the "Print All Answers / Save as PDF" button
    document.getElementById("answers-downloadAllBtn").addEventListener('click', function() {
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('assignment'));

        console.log(`Gefundene gespeicherte Aufträge zum Drucken: ${storageKeys.length}`);
        if(storageKeys.length === 0) {
            console.log("Versuch, alle Antworten zu drucken, aber keine sind gespeichert");
            return;
        }

        console.log("Starte das Drucken aller Antworten");

        // Create a temporary div for printing all answers along with the Mindmap
        const printAllContent = document.getElementById('printAllContent');

        // Set Mindmap Title
        const printAllMindmapTitle = document.getElementById('printAll-mindmap-title');
        printAllMindmapTitle.textContent = document.getElementById('mindmap-title').textContent;

        // Convert the canvas to an image and append it
        const mindmapImageContainer = document.getElementById('printAll-mindmap-image');
        mindmapImageContainer.innerHTML = ''; // Clear previous image if any

        const canvas = document.getElementById('mindmap-canvas');

        canvas.toBlob(function(blob) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.style.width = '100%';
            img.style.height = 'auto';
            img.onload = function() {
                URL.revokeObjectURL(img.src);
            };
            mindmapImageContainer.appendChild(img);

            // Populate Answers
            const answersContainer = document.getElementById('printAll-answers');
            answersContainer.innerHTML = ''; // Clear previous content

            // Sort the storageKeys based on the numerical component or suffix
            storageKeys.sort((a, b) => {
                const suffixA = a.replace(/^assignment[_-]?/, '');
                const suffixB = b.replace(/^assignment[_-]?/, '');
                return suffixA.localeCompare(suffixB, undefined, {numeric: true, sensitivity: 'base'});
            });

            storageKeys.forEach(assignmentKey => {
                const text = localStorage.getItem(assignmentKey);
                if(text) {
                    const draftDiv = document.createElement("div");
                    draftDiv.className = "draft";
                    
                    const assignmentSuffix = assignmentKey.replace(/^assignment[_-]?/, '');
                    const title = document.createElement("h3");
                    title.textContent = assignmentSuffix ? `Auftrag: ${assignmentSuffix}` : 'Auftrag';
                    draftDiv.appendChild(title);
                    
                    const answerDiv = document.createElement("div");
                    answerDiv.innerHTML = text; // Render HTML content
                    draftDiv.appendChild(answerDiv);
                    
                    answersContainer.appendChild(draftDiv);
                }
            });

            // Show the printAllContent
            printAllContent.style.display = 'block';

            // Add 'print-all' class to body
            document.body.classList.add('print-all');

            window.print();

            // Remove 'print-all' class and hide printAllContent after printing
            window.onafterprint = function() {
                document.body.classList.remove('print-all');
                printAllContent.style.display = 'none';
                // Revoke all object URLs if any
                const images = printAllContent.querySelectorAll('img');
                images.forEach(img => URL.revokeObjectURL(img.src));
            };
        }, 'image/png');
    });

    // Event Listener for the "Save Answer" button
    document.getElementById("answers-saveBtn").addEventListener('click', saveToLocal);

    // Event Listener for the "Clear All Answers" button
    document.getElementById("answers-clearBtn").addEventListener('click', clearLocalStorage);

    // Optional: Log the initial state of localStorage for debugging
    console.log("Initial state of localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }

    // **New Code to Prevent Pasting Content**

    // Prevent pasting into Quill editor beyond basic formatting
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, function(node, delta) {
        // Customize as needed, e.g., strip unwanted formats
        return delta;
    });

    quill.root.addEventListener('paste', function(e) {
        e.preventDefault();
        alert('Das Einfügen von Inhalten ist nicht erlaubt.');
        // Optionally, allow plain text pasting without formatting
        const text = e.clipboardData.getData('text/plain');
        quill.insertText(quill.getSelection().index, text);
    });

    // Prevent drag-and-drop into Quill editor
    quill.root.addEventListener('drop', function(e) {
        e.preventDefault();
    });

    // Prevent context menu in Quill editor
    quill.root.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Additionally, prevent Ctrl+V and Cmd+V
    quill.root.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            alert('Das Einfügen von Inhalten ist nicht erlaubt.');
        }
    });

    // Event Listener for the "Print Both" button
    document.getElementById("print-both-btn").addEventListener('click', function() {
        const printBothContent = document.getElementById('printBothContent');
        const mindmapTitle = document.getElementById('mindmap-title').textContent;
        const printBothMindmapTitle = document.getElementById('printBoth-mindmap-title');
        const printBothMindmapImage = document.getElementById('printBoth-mindmap-image');
        const printBothAnswers = document.getElementById('printBoth-answers');

        // Set the mindmap title
        printBothMindmapTitle.textContent = mindmapTitle;

        // Get the mindmap canvas as image
        const canvas = document.getElementById('mindmap-canvas');
        canvas.toBlob(function(blob) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.style.width = '100%';
            img.style.height = 'auto';
            img.onload = function() {
                URL.revokeObjectURL(img.src);
            };
            printBothMindmapImage.innerHTML = ''; // Clear previous image
            printBothMindmapImage.appendChild(img);

            // Get the saved answers (assuming they are in savedAnswerContainer)
            const savedAssignmentTitle = document.getElementById('answers-savedAssignmentTitle').textContent;
            const savedAnswerHTML = document.getElementById('answers-savedAnswer').innerHTML;

            // Populate the printBothAnswers div
            printBothAnswers.innerHTML = `
                <h3>${savedAssignmentTitle}</h3>
                ${savedAnswerHTML}
            `;

            // Show the printBothContent
            printBothContent.style.display = 'block';

            // Add 'print-all' class to body to trigger print CSS
            document.body.classList.add('print-all');

            // Define the afterprint handler
            function afterPrintHandler() {
                // Remove 'print-all' class from body
                document.body.classList.remove('print-all');

                // Hide the printBothContent
                printBothContent.style.display = 'none';

                // Remove the event listener
                window.removeEventListener('afterprint', afterPrintHandler);
            }

            // Add the event listener
            window.addEventListener('afterprint', afterPrintHandler);

            // Trigger print
            window.print();
        }, 'image/png');
    });
})();
