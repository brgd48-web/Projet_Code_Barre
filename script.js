const scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const statusMsg = document.getElementById('status');
const downloadBtn = document.getElementById('downloadCsv');
const beepSound = document.getElementById('beepSound');
const scanBtn = document.getElementById('Scan');

const codeReader = new ZXing.BrowserMultiFormatReader();
let deviceId = null;
let scanActive = false; // scan uniquement quand bouton cliqué

// 📷 Démarrer la caméra (aperçu seulement, sans scan actif)
async function initCamera() {
    try {
        const devices = await codeReader.listVideoInputDevices();

        // 🎯 contraintes par défaut pour iOS
        let constraints = { video: { facingMode: "environment" } };

        if (devices.length > 0) {
            deviceId = devices.length > 1 ? devices[devices.length - 1].deviceId : devices[0].deviceId;
            constraints = { video: { deviceId: { exact: deviceId } } };
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // indispensable iOS
        video.muted = true; // autoplay iOS
        await video.play();

        // Décode en continu mais ignore tant que scanActive = false
        codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
            if (!scanActive) return; // 👈 bloque tant qu’on n’a pas cliqué

            if (result) {
                handleResult(result.getText());
                scanActive = false; // désactive après un scan
            } else if (err && !(err instanceof ZXing.NotFoundException)) {
                statusMsg.textContent = "⚠️ Erreur lecture code : " + err;
            }
        });

        statusMsg.textContent = "📷 Caméra activée (aperçu permanent).";

    } catch (error) {
        console.error(error);
        statusMsg.textContent = "⚠️ Erreur caméra : " + error.message;
    }
}

// 🔎 Gestion d’un résultat
function handleResult(code) {
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

// ⚡ Active le scan seulement au clic
scanBtn.addEventListener('click', () => {
    scanActive = true;
    statusMsg.textContent = "🔎 Scannez un code-barres...";
});

// 🚀 Lancement de la caméra au chargement
initCamera();
