/* --- Answers Section Script --- */
(function() {
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
    const assignmentInfo = document.getElementById('answers-assignmentInfo');

    // Entferne das Präfix 'assignment', um das Suffix zu erhalten
    const assignmentSuffix = assignmentId.replace(/^assignment[_-]?/, '');

    // Setze den Text auf 'Auftrag: {Suffix}', falls vorhanden
    if (assignmentInfo) {
        assignmentInfo.textContent = assignmentSuffix ? `Auftrag: ${assignmentSuffix}` : 'Auftrag';
    }

    // Initialisiere den Quill-Editor
    const quill = new Quill('#answers-answerBox', {
        theme: 'snow',
        modules: {
            toolbar: '#custom-toolbar'
        }
    });


    // Anzeigeelemente
    const savedAnswerContainer = document.getElementById('savedAnswerContainer');
    const savedAssignmentTitle = document.getElementById('answers-savedAssignmentTitle');
    const savedAnswer = document.getElementById('answers-savedAnswer');
    const copyAnswerBtn = document.getElementById('answers-copyAnswerBtn');

    // Lade gespeicherten Inhalt und setze ihn im Quill-Editor
    const savedText = localStorage.getItem(assignmentId);
    if (savedText) {
        quill.root.innerHTML = savedText;
        console.log(`Gespeicherter Text für ${assignmentId} geladen.`);
        displaySavedAnswer(savedText);
    } else {
        console.log(`Kein gespeicherter Text für ${assignmentId} gefunden.`);
    }

    // Funktion zur Anzeige der gespeicherten Antwort
    function displaySavedAnswer(content) {
        // Kombiniere parentTitle und assignmentSuffix, falls vorhanden
        const titleText = parentTitle
            ? `${parentTitle}\nAuftrag: ${assignmentSuffix}`
            : `Auftrag: ${assignmentSuffix}`;
        savedAssignmentTitle.textContent = titleText;
        savedAnswer.innerHTML = content;
        savedAnswerContainer.style.display = 'block';
    }

    // Funktion zum Kopieren der Antwort in die Zwischenablage
    copyAnswerBtn.addEventListener('click', function() {
        // Um sicherzustellen, dass nur reiner Text kopiert wird, entferne HTML-Tags
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quill.root.innerHTML;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';

        const textToCopy = parentTitle
            ? `${parentTitle}\nAuftrag: ${assignmentSuffix}\n${plainText}`
            : `Auftrag: ${assignmentSuffix}\n${plainText}`;
        copyTextToClipboard(textToCopy);
    });

    // Funktion zum Kopieren von Text in die Zwischenablage
    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                // Bestätigung entfernt
                console.log("Antwort erfolgreich kopiert.");
            }, function(err) {
                console.error('Fehler beim Kopieren der Antwort:', err);
                fallbackCopyTextToClipboard(text);
            });
        } else {
            // Fallback zu execCommand
            fallbackCopyTextToClipboard(text);
        }
    }

    // Fallback-Funktion zum Kopieren von Text in die Zwischenablage
    function fallbackCopyTextToClipboard(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        // Verstecke das Textarea-Element
        textarea.style.position = "fixed";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                // Bestätigung entfernt
                console.log("Antwort erfolgreich kopiert (Fallback).");
            } else {
                throw new Error("Fallback-Kopieren fehlgeschlagen.");
            }
        } catch (err) {
            console.error('Fehler beim Kopieren der Antwort (Fallback):', err);
            // Bestätigung entfernt
        }

        document.body.removeChild(textarea);
    }

    // Funktion zum Speichern der Antwort in localStorage
    function saveToLocal() {
        const htmlContent = quill.root.innerHTML;
        const textContent = quill.getText().trim();
        if (textContent === "") {
            // Bestätigung entfernt
            console.log("Versuch, mit leerem Textfeld zu speichern.");
            return;
        }
        localStorage.setItem(assignmentId, htmlContent);
        // Bestätigung entfernt
        console.log(`Text für ${assignmentId} gespeichert.`);
        displaySavedAnswer(htmlContent); // Aktualisiere die Anzeige der gespeicherten Antwort
    }

    // Exponieren der saveToLocal Funktion, um sie global zugänglich zu machen
    window.saveAnswers = saveToLocal;

    // Funktion zum Löschen aller gespeicherten Antworten aus localStorage
    function clearLocalStorage() {
        // Bestätigung entfernt
        localStorage.clear();
        quill.setText(''); // Lösche den Quill-Editor
        savedAnswerContainer.style.display = 'none';
        console.log("Alle gespeicherten Antworten wurden gelöscht.");
    }

    // Event Listener für die "Alle Antworten drucken / Als PDF speichern" Schaltfläche
    document.getElementById("answers-downloadAllBtn").addEventListener('click', function() {
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('assignment'));

        console.log(`Gefundene gespeicherte Aufträge zum Drucken: ${storageKeys.length}`);
        if(storageKeys.length === 0) {
            console.log("Versuch, alle Antworten zu drucken, aber keine sind gespeichert.");
            return;
        }

        console.log("Starte das Drucken aller Antworten.");

        // Erstelle ein temporäres Div für das Drucken aller Antworten zusammen mit der Mindmap
        const printAllContent = document.getElementById('printAllContent');

        // Setze den Mindmap-Titel
        const printAllMindmapTitle = document.getElementById('printAll-mindmap-title');
        printAllMindmapTitle.textContent = document.getElementById('mindmap-title').textContent;

        // Konvertiere die Canvas zu einem Bild und füge es hinzu
        const mindmapImageContainer = document.getElementById('printAll-mindmap-image');
        mindmapImageContainer.innerHTML = ''; // Vorheriges Bild löschen

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

            // Fülle die Antworten
            const answersContainer = document.getElementById('printAll-answers');
            answersContainer.innerHTML = ''; // Vorherigen Inhalt löschen

            // Sortiere die storageKeys basierend auf dem numerischen Teil oder Suffix
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
                    answerDiv.innerHTML = text; // Rendere HTML-Inhalt
                    draftDiv.appendChild(answerDiv);
                    
                    answersContainer.appendChild(draftDiv);
                }
            });

            // Zeige den printAllContent Bereich an
            printAllContent.style.display = 'block';

            // Füge die 'print-all' Klasse hinzu, um die Druckstile zu aktivieren
            document.body.classList.add('print-all');

            window.print();

            // Entferne die 'print-all' Klasse und verstecke printAllContent nach dem Drucken
            window.onafterprint = function() {
                document.body.classList.remove('print-all');
                printAllContent.style.display = 'none';
                // Revoking der Object URLs, falls vorhanden
                const images = printAllContent.querySelectorAll('img');
                images.forEach(img => URL.revokeObjectURL(img.src));
            };
        }, 'image/png');
    });

    // Event Listener für die "Antwort zwischenspeichern" Schaltfläche
    document.getElementById("answers-saveBtn").addEventListener('click', saveToLocal);

    // Event Listener für die "Alle Antworten löschen" Schaltfläche
    document.getElementById("answers-clearBtn").addEventListener('click', clearLocalStorage);

    // Optional: Logge den anfänglichen Zustand von localStorage für Debugging-Zwecke
    console.log("Anfänglicher Zustand von localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }

    // **Neuer Code zum Verhindern des Einfügens von Inhalten**

    // Verhindere das Einfügen in den Quill-Editor über erweiterte Formatierungen
    quill.clipboard.addMatcher(Node.ELEMENT_NODE, function(node, delta) {
        // Passe nach Bedarf an, z.B. entferne unerwünschte Formate
        return delta;
    });

    quill.root.addEventListener('paste', function(e) {
        e.preventDefault();
        alert('Das Einfügen von Inhalten ist nicht erlaubt.');
        // Optional: Erlaube das Einfügen von nur reinem Text ohne Formatierungen
        const text = e.clipboardData.getData('text/plain');
        const range = quill.getSelection();
        if (range) {
            quill.insertText(range.index, text);
        } else {
            quill.insertText(0, text);
        }
    });

    // Verhindere Drag-and-Drop in den Quill-Editor
    quill.root.addEventListener('drop', function(e) {
        e.preventDefault();
    });

    // Verhindere das Kontextmenü im Quill-Editor
    quill.root.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Verhindere zusätzlich Ctrl+V und Cmd+V
    quill.root.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
            e.preventDefault();
            alert('Das Einfügen von Inhalten ist nicht erlaubt.');
        }
    });

    // Event Listener für die "Mindmap und Antworten drucken" Schaltfläche
    document.getElementById("print-both-btn").addEventListener('click', function() {
        const printBothContent = document.getElementById('printBothContent');
        const mindmapTitle = document.getElementById('mindmap-title').textContent;
        const printBothMindmapTitle = document.getElementById('printBoth-mindmap-title');
        const printBothMindmapImage = document.getElementById('printBoth-mindmap-image');
        const printBothAnswers = document.getElementById('printBoth-answers');

        // Speichere zuerst beide Inhalte
        if (typeof window.saveMindmap === 'function') {
            window.saveMindmap();
            console.log("Mindmap zwischengespeichert.");
        } else {
            console.error("saveMindmap Funktion nicht gefunden.");
            return;
        }

        if (typeof window.saveAnswers === 'function') {
            window.saveAnswers();
            console.log("Antworten zwischengespeichert.");
        } else {
            console.error("saveAnswers Funktion nicht gefunden.");
            return;
        }

        // Setze den Mindmap-Titel
        printBothMindmapTitle.textContent = mindmapTitle;

        // Holen Sie sich die Mindmap als Bild
        const canvas = document.getElementById('mindmap-canvas');
        canvas.toBlob(function(blob) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(blob);
            img.style.width = '100%';
            img.style.height = 'auto';
            
            // Sobald das Bild geladen ist, starte den Druck
            img.onload = function() {
                URL.revokeObjectURL(img.src);
                window.print();
            };
            
            // Füge das Bild zur Druckvorlage hinzu
            printBothMindmapImage.innerHTML = ''; // Vorheriges Bild löschen
            printBothMindmapImage.appendChild(img);

            // Fülle die Antworten aus
            const savedAssignmentTitle = document.getElementById('answers-savedAssignmentTitle').textContent;
            const savedAnswerHTML = document.getElementById('answers-savedAnswer').innerHTML;

            // Fülle das printBothAnswers Div
            printBothAnswers.innerHTML = `
                <h3>${savedAssignmentTitle}</h3>
                ${savedAnswerHTML}
            `;

            // Zeige den Druckbereich an
            printBothContent.style.display = 'block';

            // Verstecke andere Druckbereiche, falls vorhanden
            const printAllContent = document.getElementById('printAllContent');
            if (printAllContent) {
                printAllContent.style.display = 'none';
            }

            // Füge die 'print-all' Klasse hinzu, um die Druckstile zu aktivieren
            document.body.classList.add('print-all');

            // Definiere den afterprint Handler
            function afterPrintHandler() {
                // Entferne die 'print-all' Klasse
                document.body.classList.remove('print-all');

                // Verstecke den Druckbereich
                printBothContent.style.display = 'none';

                // Entferne den afterprint Handler
                window.removeEventListener('afterprint', afterPrintHandler);
            }

            // Füge den afterprint Event Listener hinzu
            window.addEventListener('afterprint', afterPrintHandler);

            // Der Druck wird erst gestartet, wenn das Bild geladen ist (im img.onload)
        }, 'image/png');
    });

    // Optional: Logge den anfänglichen Zustand von localStorage für Debugging-Zwecke
    console.log("Anfänglicher Zustand von localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }

})();
