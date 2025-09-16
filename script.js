const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');

const codeReader = new ZXing.BrowserMultiFormatReader();


// Fonction pour démarrer le flux vidéo
async function startCamera() {
    try {
        // Demande d'accès à la caméra
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.play();

        statusMsg.textContent = "📷 Caméra activée, scannez un code-barres...";

        // Récupère les périphériques vidéo disponibles
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        // Choisir la caméra arrière si disponible
        const deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        // Lancer le scan en direct sur le <video>
        codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
            if (result) {
                const code = result.getText();
                lastCode.textContent = code;
                scannedCodes.push({ code, date: new Date().toISOString() });
                statusMsg.textContent = "✅ Scan réussi : " + code;
            } else if (err && !(err instanceof ZXing.NotFoundException)) {
                statusMsg.textContent = "⚠️ Erreur lecture code : " + err;
            }
        });

    } catch (error) {
        console.error(error);
        if (error.name === "NotAllowedError") {
            statusMsg.textContent = "⚠️ Accès caméra refusé. Autorisez l'accès dans votre navigateur.";
        } else {
            statusMsg.textContent = "⚠️ Erreur caméra : " + error.message;
        }
    }
}

// Télécharger CSV
downloadBtn.addEventListener('click', () => {
    if (scannedCodes.length === 0) {
        alert("Aucun scan enregistré !");
        return;
    }

    let csvContent = "Code,Date\n";
    scannedCodes.forEach(item => {
        csvContent += `${item.code},${item.date}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "scans.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Démarrage automatique
startCamera();
