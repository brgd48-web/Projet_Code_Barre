const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');
const beepSound = document.getElementById('beepSound');
const scanBtn = document.getElementById('Scan');

const codeReader = new ZXing.BrowserMultiFormatReader();

async function startCameraOnce() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        const deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;
        statusMsg.textContent = "📷 Caméra activée, en attente d’un code...";

        // Démarrer le scan mais arrêter après le premier code trouvé
        codeReader.decodeOnceFromVideoDevice(deviceId, video).then(result => {
            const code = result.getText();
            const now = new Date();
            const date = now.toLocaleDateString("fr-FR");
            const heure = now.toLocaleTimeString("fr-FR");

            scannedCodes.push({ code, date, heure });

            const lastThree = scannedCodes.slice(-3);
            lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");

            statusMsg.textContent = "✅ Scan réussi : " + code;

            // bip
            beepSound.currentTime = 0;
            beepSound.play().catch(() => console.log("Audio bloqué"));

            // vibration (Android)
            if (navigator.vibrate) navigator.vibrate(200);

            // flash visuel
            video.style.border = "5px solid lime";
            setTimeout(() => video.style.border = "2px solid #333", 500);

            // 👉 Stop caméra après un scan
            codeReader.reset();
        }).catch(err => {
            statusMsg.textContent = "⚠️ Erreur : " + err;
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

// ⚡ Scan seulement sur clic et une seule fois
scanBtn.addEventListener('click', () => {
    startCameraOnce();
});
