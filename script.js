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

// Canvas temporaire pour scanner
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// 📷 Démarrer la caméra (aperçu permanent)
async function initCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        video.srcObject = stream;
        video.play();
        statusMsg.textContent = "📷 Caméra activée (en attente d’un scan).";

    } catch (err) {
        console.error(err);
        statusMsg.textContent = "⚠️ Erreur caméra : " + err.message;
    }
}

// 🔎 Scanner un code quand on clique sur Scan
async function scanOnce() {
    if (isScanning || !deviceId) return;
    isScanning = true;
    statusMsg.textContent = "🔎 Scannez un code-barres...";

    // Copier image de la vidéo dans le canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        const result = codeReader.decodeFromImage(canvas); // Scan unique depuis le canvas
        const code = result.getText();
        const now = new Date();
        const date = now.toLocaleDateString("fr-FR");
        const heure = now.toLocaleTimeString("fr-FR");

        scannedCodes.push({ code, date, heure });
        const lastThree = scannedCodes.slice(-3);
        lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");

        statusMsg.textContent = "✅ Scan réussi : " + code;

        // Effets sonores et visuels
        beepSound.currentTime = 0;
        beepSound.play().catch(() => console.log("Audio bloqué"));
        if (navigator.vibrate) navigator.vibrate(200);

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

// ⚡ Scan seulement au clic
scanBtn.addEventListener('click', scanOnce);

// 🔥 Démarre la caméra dès le début
initCamera();
