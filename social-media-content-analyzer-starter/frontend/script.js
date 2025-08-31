// frontend/script.js
const drop = document.getElementById("drop");
const fileInput = document.getElementById("file");
const uploadBtn = document.getElementById("uploadBtn");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const meta = document.getElementById("meta");
const preview = document.getElementById("preview");
const suggestions = document.getElementById("suggestions");

let fileToUpload = null;

drop.addEventListener("click", () => fileInput.click());

drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("dragover");
});

drop.addEventListener("dragleave", () => {
  drop.classList.remove("dragover");
});

drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    fileToUpload = e.dataTransfer.files[0];
    drop.querySelector("p").textContent = `Selected: ${fileToUpload.name}`;
  }
});

fileInput.addEventListener("change", (e) => {
  if (e.target.files.length) {
    fileToUpload = e.target.files[0];
    drop.querySelector("p").textContent = `Selected: ${fileToUpload.name}`;
  }
});

uploadBtn.addEventListener("click", async () => {
  if (!fileToUpload) {
    alert("Please select a PDF or image first.");
    return;
  }
  loading.classList.remove("hidden");
  result.classList.add("hidden");

    try {
    const form = new FormData();
    form.append("file", fileToUpload);

    // Force same-origin (no CORS, no wrong port)
    const url = "/api/analyze";
    console.log("POSTing to:", url);
    const resp = await fetch(url, { method: "POST", body: form }); // no mode:"cors" needed same-origin



    const data = await resp.json();
    loading.classList.add("hidden");

    meta.textContent = `${data.filename} • ${Math.round(data.size/1024)} KB • ${data.type.toUpperCase()} • ${data.chars} chars`;
    preview.textContent = (data.fullText || data.preview || "(no text detected)");
    suggestions.innerHTML = "";
    (data.suggestions || []).forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      suggestions.appendChild(li);
    });
    result.classList.remove("hidden");
  } catch (e) {
    loading.classList.add("hidden");
    alert(e.message || "Failed to analyze file"); // now includes backend details
    console.error(e);
  }
});
