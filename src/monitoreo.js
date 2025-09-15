// src/monitoreo.js

const API_URL = "https://68bb0de484055bce63f104b3.mockapi.io/api/v1/Proyecto1";
const statusGrid = document.getElementById("statusGrid");
const statusTableBody = document.getElementById("statusTableBody");

let monitorInterval = null;

// Funciones de API (duplicadas para evitar la necesidad de otro archivo)
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
  const devices = await getDevices();
  if (!devices) return;
  statusGrid.innerHTML = "";
  devices.forEach((device) => {
    let statusColor = "bg-gray-400";
    let statusText = device.estado.toUpperCase();
    if (device.estado === "detectada" || device.estado === "abierta") {
      statusColor = "bg-red-500 animate-pulse";
      if (device.tipo_dispositivo === "puerta") statusText = "ABIERTA";
    } else if (
      device.estado === "no_detectada" ||
      device.estado === "cerrada"
    ) {
      statusColor = "bg-green-500";
      if (device.tipo_dispositivo === "puerta") statusText = "CERRADA";
    }
    const card = document.createElement("div");
    card.className =
      "bg-white p-4 rounded-lg shadow-md flex items-center justify-between";
    card.innerHTML = `
        <div class="flex items-center">
            <span class="dot ${statusColor}"></span>
            <span class="ml-3 font-medium">${device.ubicacion}</span>
        </div>
        <p class="text-sm font-bold text-gray-600">${statusText}</p>
    `;
    statusGrid.appendChild(card);
  });
}

async function renderStatusTable() {
  const devices = await getDevices();
  if (!devices) return;
  statusTableBody.innerHTML = "";
  const recentUpdates = devices
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  recentUpdates.forEach((device) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 border-b";
    row.innerHTML = `
            <td class="py-3 px-6 text-left">${device.ubicacion} (${
      device.tipo_dispositivo
    })</td>
            <td class="py-3 px-6 text-left">${device.estado}</td>
            <td class="py-3 px-6 text-left">${new Date(
              device.timestamp
            ).toLocaleString()}</td>
            <td class="py-3 px-6 text-left">${device.ip || "N/A"}</td>
        `;
    statusTableBody.appendChild(row);
  });
}

// Carga inicial y refresco
document.addEventListener("DOMContentLoaded", () => {
  renderStatusGrid();
  renderStatusTable();
  monitorInterval = setInterval(() => {
    renderStatusGrid();
    renderStatusTable();
  }, 2000);
});

// Detener el intervalo cuando se sale de la página
window.addEventListener("beforeunload", () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }
});
