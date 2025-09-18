const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');
const beepSound = document.getElementById('beepSound');
const scanBtn = document.getElementById('Scan');

const codeReader = new ZXing.BrowserMultiFormatReader();
let deviceId = null;
let isScanning = false;

// 📷 Démarrer la caméra (aperçu seulement, pas de scan)
async function initCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        // Choisir caméra arrière si dispo
        deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        // Afficher flux vidéo sans lecture
        await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
            .then(stream => {
                video.srcObject = stream;
                video.play();
                statusMsg.textContent = "📷 Caméra activée (en attente d’un scan).";
            });
    } catch (error) {
        console.error(error);
        statusMsg.textContent = "⚠️ Erreur caméra : " + error.message;
    }
}

// 🔎 Scanner un seul code quand on appuie sur SCAN
async function scanOnce() {
    if (isScanning || !deviceId) return;
    isScanning = true;

    statusMsg.textContent = "🔎 Scannez un code-barres...";

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

        // vibration
        if (navigator.vibrate) navigator.vibrate(200);

        // flash visuel
        video.style.border = "5px solid lime";
        setTimeout(() => video.style.border = "2px solid #333", 500);

        // arrêter le scan mais garder la caméra ouverte
        codeReader.reset();
        isScanning = false;

    }).catch(err => {
        statusMsg.textContent = "⚠️ Erreur : " + err;
        isScanning = false;
    });
}

// 💾 Télécharger CSV
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

// ⚡ Scan seulement quand tu cliques
scanBtn.addEventListener('click', () => {
    scanOnce();
});

// 🔥 Démarre la caméra dès le début (aperçu permanent)
initCameraPreview();
