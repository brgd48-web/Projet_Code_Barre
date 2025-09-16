let scannedCodes = [];
const video = document.getElementById('preview');
const lastCode = document.getElementById('lastCode');
const downloadBtn = document.getElementById('downloadCsv');

// Zone d’affichage des messages
const statusMsg = document.createElement("p");
statusMsg.style.color = "red";
document.body.insertBefore(statusMsg, video);

// Initialisation ZXing
const codeReader = new ZXing.BrowserMultiFormatReader();

// Fonction pour démarrer la caméra
async function startCamera() {
  try {
    // Demande la liste des caméras vidéo
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");

    if (videoDevices.length === 0) {
      statusMsg.textContent = "❌ Aucune caméra détectée.";
      return;
    }

    // Choisit la caméra arrière si dispo, sinon la première
    let deviceId = videoDevices[0].deviceId;
    if (videoDevices.length > 1) {
      deviceId = videoDevices[videoDevices.length - 1].deviceId;
    }

    // Lance le scan vidéo
    codeReader.decodeFromVideoDevice(deviceId, 'preview', (result, err) => {
      if (result) {
        const code = result.getText();
        lastCode.textContent = code;
        scannedCodes.push({ code, date: new Date().toISOString() });
        statusMsg.textContent = "✅ Scan réussi.";
      } else if (err && !(err instanceof ZXing.NotFoundException)) {
        statusMsg.textContent = "⚠️ Erreur lecture code : " + err;
      }
    });

    statusMsg.textContent = "📷 Caméra activée, scannez un code-barres...";
  } catch (error) {
    console.error(error);
    if (error.name === "NotAllowedError") {
      statusMsg.textContent = "⚠️ Accès caméra refusé. Autorise l’accès dans ton navigateur.";
    } else if (error.name === "NotFoundError") {
      statusMsg.textContent = "❌ Aucune caméra trouvée.";
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
console.log("Version 1.0 chargée");
// Démarrer automatiquement
startCamera();
