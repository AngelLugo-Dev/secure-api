// src/monitoreo.js

const API_URL = "https://68bb0de484055bce63f104b3.mockapi.io/api/v1/Proyecto1";

// Selectores para la página de Monitoreo
const statusGrid = document.getElementById("statusGrid");
const statusTableBody = document.getElementById("statusTableBody");

let monitorInterval = null;

// Funciones de API (solo lectura)
async function getDevices() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener los dispositivos.");
    const devices = await response.json();
    return devices;
  } catch (error) {
    console.error("Error:", error);
  }
}

// Funciones de renderizado
async function renderStatusGrid() {
  if (!statusGrid) return;
  const devices = await getDevices();
  if (!devices) return;

  // Obtener el estado más reciente de cada ubicación
  const latestStatusByLocation = {};
  devices
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((device) => {
      if (!latestStatusByLocation[device.ubicacion]) {
        latestStatusByLocation[device.ubicacion] = device;
      }
    });

  statusGrid.innerHTML = "";
  Object.values(latestStatusByLocation).forEach((device) => {
    let statusColor = "bg-slate-400";
    let statusBgColor = "bg-slate-400/20";
    let statusText = device.estado.toUpperCase();

    if (device.estado === "detectada" || device.estado === "abierta") {
      statusColor = "bg-red-500 animate-pulse";
      statusBgColor = "bg-red-500/20";
      if (device.tipo_dispositivo === "puerta") statusText = "ABIERTA";
    } else if (
      device.estado === "no_detectada" ||
      device.estado === "cerrada"
    ) {
      statusColor = "bg-green-500";
      statusBgColor = "bg-green-500/20";
      if (device.tipo_dispositivo === "puerta") statusText = "CERRADA";
    }

    const card = document.createElement("div");
    card.className =
      "glass-effect rounded-xl p-4 flex items-center justify-between hover-glass";
    card.innerHTML = `
      <div class="flex items-center space-x-3">
        <span class="dot ${statusColor}"></span>
        <div>
          <h3 class="font-medium text-white">${device.ubicacion}</h3>
          <p class="text-sm text-slate-400">${device.tipo_dispositivo}</p>
        </div>
      </div>
      <span class="px-3 py-1 text-sm rounded-full ${statusBgColor} ${
      device.estado === "detectada" || device.estado === "abierta"
        ? "text-red-300"
        : "text-green-300"
    }">${statusText}</span>
    `;
    statusGrid.appendChild(card);
  });
}

async function renderStatusTable() {
  if (!statusTableBody) return;
  const devices = await getDevices();
  if (!devices) return;
  statusTableBody.innerHTML = "";

  const recentUpdates = devices
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  recentUpdates.forEach((device, index) => {
    const row = document.createElement("tr");
    const isDetected =
      device.estado === "detectada" || device.estado === "abierta";
    row.className = `border-b border-slate-700 hover:bg-navy-light/50 transition-colors ${
      index === 0 ? "bg-navy-light/30" : ""
    }`;

    let statusClass = isDetected ? "text-red-300" : "text-green-300";
    let statusText = device.estado.toUpperCase();
    if (device.tipo_dispositivo === "puerta") {
      statusText = isDetected ? "ABIERTA" : "CERRADA";
    }

    row.innerHTML = `
      <td class="py-4 px-6 text-slate-300">${device.ubicacion} 
        <span class="text-slate-400">(${device.tipo_dispositivo})</span>
      </td>
      <td class="py-4 px-6">
        <span class="px-2 py-1 rounded-full text-sm ${statusClass} ${
      isDetected ? "bg-red-500/20" : "bg-green-500/20"
    }">${statusText}</span>
      </td>
      <td class="py-4 px-6 text-slate-400">${new Date(
        device.timestamp
      ).toLocaleString()}</td>
      <td class="py-4 px-6 text-slate-400">${device.ip || "N/A"}</td>
    `;
    statusTableBody.appendChild(row);
  });
}

// Carga inicial y refresco
document.addEventListener("DOMContentLoaded", async () => {
  await renderStatusGrid();
  await renderStatusTable();
  monitorInterval = setInterval(async () => {
    await renderStatusGrid();
    await renderStatusTable();
  }, 2000);
});

// Detener el intervalo cuando se sale de la página
window.addEventListener("beforeunload", () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }
});
