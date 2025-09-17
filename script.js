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

        // On essaie de forcer la caméra arrière
        const constraints = {
            video: {
                facingMode: { exact: "environment" } // "environment" = caméra arrière
            }
        };

        // Lance la caméra arrière
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;

        statusMsg.textContent = "📷 Caméra arrière activée, scannez un code-barres...";

        // Décodage via le flux
        codeReader.decodeFromVideoDevice(null, video, (result, err) => {
            if (result) {
                const code = result.getText();
                const now = new Date();
                const date = now.toLocaleDateString("fr-FR");
                const heure = now.toLocaleTimeString("fr-FR");

                scannedCodes.push({ code, date, heure });
                const lastThree = scannedCodes.slice(-3);
                lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");

                statusMsg.textContent = "✅ Scan réussi : " + code;
            } else if (err && !(err instanceof ZXing.NotFoundException)) {
                statusMsg.textContent = "⚠️ Erreur lecture code : " + err;
            }
        });

    } catch (error) {
        console.error(error);
        if (error.name === "OverconstrainedError") {
            statusMsg.textContent = "⚠️ Impossible de forcer la caméra arrière, utilisation par défaut.";
            codeReader.decodeFromVideoDevice(undefined, video, (result, err) => {
                if (result) {
                    const code = result.getText();
                    const now = new Date();
                    scannedCodes.push({ code, date: now.toLocaleDateString("fr-FR"), heure: now.toLocaleTimeString("fr-FR") });
                    const lastThree = scannedCodes.slice(-3);
                    lastCode.innerHTML = lastThree.map(item => `${item.code} (${item.heure})`).join("<br>");
                    statusMsg.textContent = "✅ Scan réussi : " + code;
                }
            });
        } else if (error.name === "NotAllowedError") {
            statusMsg.textContent = "⚠️ Autorise l’accès caméra dans ton navigateur Android.";
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

    let csvContent = "Code,Date,Heure\n";
    scannedCodes.forEach(item => {
        csvContent += `${item.code},${item.date},${item.heure}\n`;
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
