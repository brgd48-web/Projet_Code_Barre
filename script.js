const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');
const beepSound = document.getElementById('beepSound');
const scanBtn = document.getElementById('Scan');

const codeReader = new ZXing.BrowserMultiFormatReader();
let isScanning = false;

// Créer un canvas caché pour capturer les frames
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

// 📷 Démarrer la caméra (aperçu permanent)
async function initCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        const deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        video.srcObject = stream;
        await video.play();
        statusMsg.textContent = "📷 Caméra activée (en attente d’un scan).";

    } catch (error) {
        console.error(error);
        statusMsg.textContent = "⚠️ Erreur caméra : " + error.message;
    }
}

// 🔎 Scanner au clic sans arrêter la vidéo
async function scanOnce() {
    if (isScanning) return;
    isScanning = true;
    statusMsg.textContent = "🔎 Scannez un code-barres...";

    // Copier l'image du video dans le canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        const result = codeReader.decodeFromCanvas(canvas);
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

    } catch (err) {
        statusMsg.textContent = "⚠️ Aucun code détecté.";
    } finally {
        isScanning = false;
    }
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

// ⚡ Scan uniquement au clic
scanBtn.addEventListener('click', scanOnce);

// 🔥 Démarrage de la caméra
initCamera();
