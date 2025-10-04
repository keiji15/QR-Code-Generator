let qrHistory = JSON.parse(localStorage.getItem("qrHistory")) || [];
const previewArea = document.getElementById("preview-area");

window.addEventListener("load", showHistory);
document.getElementById("generateBtn").addEventListener("click", generateQRs);
document.getElementById("clearHistory").addEventListener("click", clearHistory);

async function generateQRs() {
  const mode = document.getElementById("modeSelect").value;
  const texts = document.getElementById("qrText").value.trim();
  if (!texts) return alert("Please enter some text or links.");

  const width = parseInt(document.getElementById("qrWidth").value);
  const height = parseInt(document.getElementById("qrHeight").value);
  const margin = parseInt(document.getElementById("qrMargin").value);
  const colorDark = document.getElementById("qrColorDark").value;
  const colorLight = document.getElementById("qrColorLight").value;
  const shape = document.getElementById("qrShape").value;
  const fileInput = document.getElementById("centerImage");

  const entries = mode === "bulk" ? texts.split("\n").filter(t => t.trim()) : [texts];
  previewArea.innerHTML = "";
  document.getElementById("downloadAll").style.display = entries.length > 1 ? "block" : "none";

  for (let i = 0; i < entries.length; i++) {
    const text = entries[i];
    const options = {
      width, height, margin,
      type: "canvas",
      data: text,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color: colorDark, type: shape },
      backgroundOptions: { color: colorLight },
      imageOptions: { crossOrigin: "anonymous", margin: 4 }
    };

    // Load image if chosen
    if (fileInput.files.length > 0) {
      const imgData = await readFile(fileInput.files[0]);
      options.image = imgData;
    }

    const qrCode = new QRCodeStyling(options);
    const qrItem = document.createElement("div");
    qrItem.className = "qr-item";
    const caption = document.createElement("p");
    caption.textContent = text.length > 40 ? text.slice(0, 37) + "..." : text;

    qrCode.append(qrItem);
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download PNG";
    downloadBtn.style.marginTop = "5px";
    downloadBtn.style.width = "80%";
    downloadBtn.style.background = "#16a34a";
    downloadBtn.onclick = () => qrCode.download({ name: text.substring(0,20) || "qr", extension: "png" });

    qrItem.appendChild(caption);
    qrItem.appendChild(downloadBtn);
    previewArea.appendChild(qrItem);

    // Save to history
    const imgBlob = await qrCode.getRawData("png");
    const reader = new FileReader();
    reader.onload = () => {
      qrHistory.push({ data: reader.result, text });
      localStorage.setItem("qrHistory", JSON.stringify(qrHistory));
    };
    reader.readAsDataURL(imgBlob);
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function showHistory() {
  previewArea.innerHTML = "";
  if (qrHistory.length === 0) return;
  qrHistory.forEach(qr => {
    const qrItem = document.createElement("div");
    qrItem.className = "qr-item";
    const img = document.createElement("img");
    img.src = qr.data;
    img.width = 150;
    const caption = document.createElement("p");
    caption.textContent = qr.text.length > 40 ? qr.text.slice(0,37)+"..." : qr.text;
    qrItem.appendChild(img);
    qrItem.appendChild(caption);
    previewArea.appendChild(qrItem);
  });
}

function clearHistory() {
  if (confirm("Are you sure you want to clear QR history?")) {
    qrHistory = [];
    localStorage.removeItem("qrHistory");
    previewArea.innerHTML = "";
  }
}

document.getElementById("downloadAll").addEventListener("click", async () => {
  const zip = new JSZip();
  const canvases = previewArea.querySelectorAll("canvas");
  for (let i = 0; i < canvases.length; i++) {
    const dataUrl = canvases[i].toDataURL("image/png");
    const base64 = dataUrl.split(",")[1];
    zip.file(`qr_${i + 1}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "QR_Bulk.zip");
});
