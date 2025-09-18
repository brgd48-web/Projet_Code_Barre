const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');
const beepSound = document.getElementById('beepSound');
const scanBtn = document.getElementById('Scan');

const codeReader = new ZXing.BrowserMultiFormatReader();
let deviceId = null;
let scanActive = false; // active uniquement quand on clique sur Scan

// Démarrer la caméra (aperçu permanent)
async function initCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();
        if (devices.length === 0) {
            statusMsg.textContent = "❌ Aucune caméra détectée.";
            return;
        }

        deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;

        // Flux vidéo en continu
        await codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
            if (!scanActive) return; // n'analyse que si Scan est actif

            if (result) {
                handleResult(result.getText());
            } else if (err && !(err instanceof ZXing.NotFoundException)) {
                statusMsg.textContent = "⚠️ Erreur lecture code : " + err;
            }
        });

        statusMsg.textContent = "📷 Caméra activée (en attente d’un scan).";

    } catch (err) {
        console.error(err);
        statusMsg.textContent = "⚠️ Erreur caméra : " + err.message;
    }
}

// Traiter le code scanné
function handleResult(code) {
    scanActive = false; // désactive le scan après lecture

    const now = new Date();
    const date = now.toLocaleDateString("fr-FR");
    const heure = now.toLocaleTimeString("fr-FR");

    scannedCodes.push({ code, date, heure });

    const lastThree = scannedCodes.slice(-3);
    lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");

    statusMsg.textContent = "✅ Scan réussi : " + code;

    // bip et vibration
    beepSound.currentTime = 0;
    beepSound.play().catch(() => console.log("Audio bloqué"));
    if (navigator.vibrate) navigator.vibrate(200);

    // flash visuel
    video.style.border = "5px solid lime";
    setTimeout(() => video.style.border = "2px solid #333", 500);
}

// Scan seulement quand on clique
scanBtn.addEventListener('click', () => {
    if (!deviceId) return;
    scanActive = true;
    statusMsg.textContent = "🔎 Scannez un code-barres...";
});

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

// Démarrer la caméra dès le début
initCamera();
