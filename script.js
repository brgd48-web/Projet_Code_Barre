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

        // Choisir la caméra arrière si dispo
        const deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        statusMsg.textContent = "📷 Caméra activée, scannez un code-barres...";

       const beepSound = document.getElementById('beepSound'); // récupère le son

codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
    if (result) {
        const code = result.getText();
        const now = new Date();

        const date = now.toLocaleDateString("fr-FR");
        const heure = now.toLocaleTimeString("fr-FR");

        scannedCodes.push({ code, date, heure });

        const lastThree = scannedCodes.slice(-3);
        lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");

        statusMsg.textContent = "✅ Scan réussi : " + code;

        // 🔊 joue un bip
        beepSound.currentTime = 0; // remet au début si déjà en lecture
        beepSound.play();
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

// Télécharger CSV avec Code, Date, Heure
downloadBtn.addEventListener('click', () => {
    if (scannedCodes.length === 0) {
        alert("Aucun scan enregistré !");
        return;
    }

    let csvContent = "Code;Date;Heure\n";
    scannedCodes.forEach(item => {
        csvContent += `${item.code};${item.date};${item.heure}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "scans.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Démarrage auto
startCamera();
