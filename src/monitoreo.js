// src/monitoreo.js

const API_URL = "https://68bb0de484055bce63f104b3.mockapi.io/api/v1/Proyecto1";
const statusGrid = document.getElementById("statusGrid");
const statusTableBody = document.getElementById("statusTableBody");

let monitorInterval = null;
let deviceHistory = new Map(); // Para almacenar el historial de cada dispositivo

// Funciones de API (duplicadas para evitar la necesidad de otro archivo)
async function getDevices() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener los dispositivos.");
    const devices = await response.json();
    return devices;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Funciones de renderizado
async function renderStatusGrid() {
  const devices = await getDevices();
  if (!devices.length) return;

  statusGrid.innerHTML = "";
  devices.forEach((device) => {
    const statusColor = getStatusColor(device.estado, device.tipo_dispositivo);
    const statusText = getStatusText(device.estado, device.tipo_dispositivo);

    const card = document.createElement("div");
    card.className =
      "bg-white p-4 rounded-lg shadow-md flex items-center justify-between";
    card.innerHTML = `
      <div class="flex items-center">
        <span class="dot ${statusColor}"></span>
        <span class="ml-3 font-medium">${device.ubicacion}</span>
      </div>
      <div class="flex flex-col items-end">
        <p class="text-sm font-bold text-gray-600">${statusText}</p>
        <p class="text-xs text-gray-400">${device.tipo_dispositivo}</p>
      </div>
    `;
    statusGrid.appendChild(card);
  });
}

async function renderStatusTable() {
  const devices = await getDevices();
  if (!devices.length) return;

  // Actualizar historial de dispositivos
  devices.forEach((device) => {
    const deviceKey = `${device.ubicacion}-${device.tipo_dispositivo}`;
    if (!deviceHistory.has(deviceKey)) {
      deviceHistory.set(deviceKey, []);
    }
    const history = deviceHistory.get(deviceKey);
    history.unshift({ ...device });
    while (history.length > 10) {
      history.pop();
    }
  });

  // Renderizar tabla
  statusTableBody.innerHTML = "";
  deviceHistory.forEach((history, deviceKey) => {
    history.forEach((device, index) => {
      const row = document.createElement("tr");
      row.className = `hover:bg-gray-50 border-b ${
        index === 0 ? "bg-gray-50" : ""
      }`;
      row.innerHTML = `
        <td class="py-3 px-6 text-left">${device.ubicacion} (${
        device.tipo_dispositivo
      })</td>
        <td class="py-3 px-6 text-left">${getStatusText(
          device.estado,
          device.tipo_dispositivo
        )}</td>
        <td class="py-3 px-6 text-left">${new Date(
          device.timestamp
        ).toLocaleString()}</td>
        <td class="py-3 px-6 text-left">${device.ip || "N/A"}</td>
      `;
      statusTableBody.appendChild(row);
    });
  });
}

function getStatusColor(estado, tipo_dispositivo) {
  if (estado === "detectada" || estado === "abierta") {
    return "bg-red-500 animate-pulse";
  } else if (estado === "no_detectada" || estado === "cerrada") {
    return "bg-green-500";
  }
  return "bg-gray-400";
}

function getStatusText(estado, tipo_dispositivo) {
  if (tipo_dispositivo === "puerta") {
    return estado === "abierta" ? "ABIERTA" : "CERRADA";
  }
  return estado.toUpperCase();
}

// Inicialización y actualización
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
