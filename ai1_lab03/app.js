const puzzleCols = 4;
const puzzleRows = 3;

let map, puzzleImage, locationMarker;
let hasLocation = false;

let notificationRequested = false;

function requestNotificationPermission() {
    if (notificationRequested) return;
    notificationRequested = true;
    
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✓ Zgoda na powiadomienia udzielona');
            } else if (permission === 'denied') {
                console.log('✗ Zgoda na powiadomienia odrzucona');
            }
        });
    }
}

function initMap() {
    map = L.map("map", {
        center: [52.23, 21.01],
        zoom: 15,
    });

    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { 
            maxZoom: 19,
            attribution: '© Esri'
        }
    ).addTo(map);

    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { 
            maxZoom: 19, 
            opacity: 0.6 
        }
    ).addTo(map);
}

initMap();


document.getElementById("location-btn").onclick = () => {
    requestNotificationPermission();
    
    if (!navigator.geolocation) {
        alert("Twoja przeglądarka nie wspiera geolokacji.");
        return;
    }

    document.getElementById("coordinates").textContent = "Pobieranie lokalizacji...";

    navigator.geolocation.getCurrentPosition(
        pos => {
            const { latitude, longitude } = pos.coords;

            document.getElementById("coordinates").textContent =
                `Lat: ${latitude.toFixed(6)} | Lng: ${longitude.toFixed(6)}`;

            map.setView([latitude, longitude], 17);
            
            if (locationMarker) {
                map.removeLayer(locationMarker);
            }
            
            locationMarker = L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup('Twoja lokalizacja')
                .openPopup();
            
            hasLocation = true;
        },
        err => {
            let message = "Błąd lokalizacji: ";
            switch(err.code) {
                case err.PERMISSION_DENIED:
                    message += "Odmówiono dostępu.";
                    break;
                case err.POSITION_UNAVAILABLE:
                    message += "Niedostępna.";
                    break;
                case err.TIMEOUT:
                    message += "Przekroczono czas.";
                    break;
                default:
                    message += "Nieznany błąd.";
            }
            alert(message);
            document.getElementById("coordinates").textContent = message;
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
    );
};


document.getElementById("create-puzzle").onclick = async () => {
    if (!hasLocation) {
        alert("Najpierw pobierz swoją lokalizację!");
        return;
    }

    document.getElementById("create-puzzle").textContent = "⏳ Generowanie...";
    document.getElementById("create-puzzle").disabled = true;

    setTimeout(() => {
        html2canvas(document.getElementById("map"), { 
            useCORS: true,
            allowTaint: true,
            logging: false,
            scale: 1
        }).then(canvas => {
            puzzleImage = canvas;
            createPuzzle();
            document.getElementById("create-puzzle").textContent = "Stwórz puzzle";
            document.getElementById("create-puzzle").disabled = false;
        }).catch(err => {
            console.error("Błąd html2canvas:", err);
            alert("Nie udało się wygenerować puzzli. Spróbuj ponownie.");
            document.getElementById("create-puzzle").textContent = "Stwórz puzzle";
            document.getElementById("create-puzzle").disabled = false;
        });
    }, 300);
};


function createPuzzle() {
    const box = document.getElementById("puzzle-container");
    const table = document.getElementById("table");
    const status = document.getElementById("status");

    box.innerHTML = "";
    table.innerHTML = "";
    status.classList.remove("show");

    const pieceW = puzzleImage.width / puzzleCols;
    const pieceH = puzzleImage.height / puzzleRows;

    const positions = [];
    for (let y = 0; y < puzzleRows; y++) {
        for (let x = 0; x < puzzleCols; x++) {
            positions.push({ x, y });
        }
    }

    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    positions.forEach(pos => {
        const piece = document.createElement("div");
        piece.classList.add("puzzle-piece");
        piece.style.backgroundImage = `url(${puzzleImage.toDataURL()})`;
        piece.style.backgroundPosition = `-${pos.x * (420 / puzzleCols)}px -${pos.y * (320 / puzzleRows)}px`;
        piece.setAttribute("data-x", pos.x);
        piece.setAttribute("data-y", pos.y);

        piece.draggable = true;
        enableDrag(piece);

        box.appendChild(piece);
    });

    for (let y = 0; y < puzzleRows; y++) {
        for (let x = 0; x < puzzleCols; x++) {
            const slot = document.createElement("div");
            slot.classList.add("slot");
            slot.setAttribute("data-x", x);
            slot.setAttribute("data-y", y);

            enableDrop(slot);

            table.appendChild(slot);
        }
    }
}


let draggedPiece = null;

function enableDrag(piece) {
    piece.addEventListener("dragstart", (e) => {
        draggedPiece = piece;
        piece.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
    });

    piece.addEventListener("dragend", () => {
        piece.classList.remove("dragging");
    });
}

function enableDrop(slot) {
    slot.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    });

    slot.addEventListener("dragenter", e => {
        e.preventDefault();
        if (slot.children.length === 0) {
            slot.style.background = "rgba(176, 216, 182, 0.4)";
        }
    });

    slot.addEventListener("dragleave", () => {
        slot.style.background = "";
    });

    slot.addEventListener("drop", (e) => {
        e.preventDefault();
        slot.style.background = "";
        
        if (!draggedPiece) return;

        if (slot.children.length > 0) {
            return; // Slot zajęty
        }

        slot.appendChild(draggedPiece);

        const pieceX = parseInt(draggedPiece.dataset.x);
        const pieceY = parseInt(draggedPiece.dataset.y);
        const slotX = parseInt(slot.dataset.x);
        const slotY = parseInt(slot.dataset.y);

        if (pieceX === slotX && pieceY === slotY) {
            slot.classList.add("correct");
        } else {
            slot.classList.remove("correct");
        }

        draggedPiece = null;
        
        checkWin();
    });
}

function checkWin() {
    const slots = document.querySelectorAll("#table .slot");
    let allFilled = true;
    let allCorrect = true;

    slots.forEach(slot => {
        const piece = slot.firstElementChild;
        
        if (!piece) {
            allFilled = false;
            return;
        }

        const pieceX = parseInt(piece.dataset.x);
        const pieceY = parseInt(piece.dataset.y);
        const slotX = parseInt(slot.dataset.x);
        const slotY = parseInt(slot.dataset.y);

        if (pieceX !== slotX || pieceY !== slotY) {
            allCorrect = false;
        }
    });

    if (allFilled && allCorrect) {
        document.getElementById("status").classList.add("show");
        
        showSystemNotification();
        
        createConfetti();
    }
}


function showSystemNotification() {
    console.log('Wywołano showSystemNotification, permission:', Notification.permission);
    
    if (!('Notification' in window)) {
        console.log('Przeglądarka nie wspiera powiadomień');
        alert('Brawo! Ułożyłeś puzzle!');
        return;
    }

    if (Notification.permission === 'granted') {
        try {
            console.log('Tworzenie powiadomienia...');
            const notification = new Notification('Brawo! Ułożyłeś puzzle!', {
                body: 'Gratulacje!',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🧩</text></svg>',
                tag: 'puzzle-complete'
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            console.log('✓ Powiadomienie systemowe utworzone');
        } catch (error) {
            console.error('Błąd tworzenia powiadomienia:', error);
            alert('Brawo! Ułożyłeś puzzle!');
        }
    } else {
        // Jeśli nie ma zgody, pokaż alert
        console.log('Brak zgody na powiadomienia, pokazuję alert');
        alert('Brawo! Ułożyłeś puzzle!\n\n(Odśwież stronę i kliknij "Zezwól" na powiadomienia, aby zobaczyć je systemowo)');
    }
}


// --- EFEKT KONFETTI ---
function createConfetti() {
    const container = document.querySelector('.container');
    const emojis = ['🎉', '🎊', '⭐', '✨', '🎈', '🎁'];
    
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-50px';
            confetti.style.fontSize = (20 + Math.random() * 20) + 'px';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            
            const duration = 3 + Math.random() * 2;
            const rotation = Math.random() * 720 - 360;
            
            confetti.style.transition = `all ${duration}s linear`;
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.style.top = window.innerHeight + 'px';
                confetti.style.transform = `rotate(${rotation}deg)`;
                confetti.style.opacity = '0';
            }, 50);
            
            setTimeout(() => confetti.remove(), duration * 1000);
        }, i * 100);
    }
}