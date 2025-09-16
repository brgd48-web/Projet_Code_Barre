const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');

const codeReader = new ZXing.BrowserMultiFormatReader();

// Démarrage de la caméra et scan
async function startCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        // Choisir la caméra arrière si disponible
        const deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        statusMsg.textContent = "📷 Caméra activée, scannez un code-barres...";

        // Lance le scan en direct
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
            statusMsg.textContent = "⚠️ Accès caméra refusé.";
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

    let csvContent = "data:text/csv;charset=utf-8,Code,Date\n";
    scannedCodes.forEach(item => {
        csvContent += `${item.code},${item.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scans.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Démarrage automatique
startCamera();
