// src/script.js

const API_URL = "https://68bb0de484055bce63f104b3.mockapi.io/api/v1/Proyecto1";

// Selectores para la página de Administración
const deviceForm = document.getElementById("deviceForm");
const deviceList = document.getElementById("deviceList");
const actuatorControls = document.getElementById("actuatorControls");

// Selectores para la página de Monitoreo
const statusGrid = document.getElementById("statusGrid");
const statusTableBody = document.getElementById("statusTableBody");

let monitorInterval = null;

// Funciones de API
function generateRandomIP() {
  const octet = () => Math.floor(Math.random() * 256);
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

async function createDevice(device) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });
    if (!response.ok) throw new Error("Error al crear el dispositivo.");
    const newDevice = await response.json();
    console.log("Dispositivo creado:", newDevice);
    return newDevice;
  } catch (error) {
    console.error("Error:", error);
  }
}

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

async function updateDevice(id, data) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error al actualizar el dispositivo.");
    const updatedDevice = await response.json();
    console.log("Dispositivo actualizado:", updatedDevice);
    return updatedDevice;
  } catch (error) {
    console.error("Error:", error);
  }
}

async function deleteDevice(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error al borrar el dispositivo.");
    console.log("Dispositivo borrado.");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Funciones de renderizado
async function renderDeviceList() {
  if (!deviceList) return;
  const devices = await getDevices();
  if (!devices) return;

  const uniqueDevices = [
    ...new Map(
      devices.map((item) => [
        `${item.ubicacion}-${item.tipo_dispositivo}`,
        item,
      ])
    ).values(),
  ];

  deviceList.innerHTML = "";
  uniqueDevices.forEach((device) => {
    const div = document.createElement("div");
    div.className =
      "glass-effect rounded-xl p-4 flex justify-between items-center hover-glass";
    div.innerHTML = `
        <div>
            <p class="font-medium text-white">${device.ubicacion}</p>
            <p class="text-sm text-slate-400">${device.tipo_dispositivo}</p>
        </div>
        <div>
            <button onclick="handleDelete('${device.id}')" 
                    class="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition-colors">
                Borrar
            </button>
        </div>
    `;
    deviceList.appendChild(div);
  });
  renderActuatorControls();
}

async function renderActuatorControls() {
  if (!actuatorControls) return;
  const devices = await getDevices();
  const actuators = devices.filter((d) => d.tipo_dispositivo === "actuador");
  actuatorControls.innerHTML = "";
  if (actuators.length === 0) {
    actuatorControls.innerHTML =
      '<p class="text-slate-400">No hay actuadores registrados.</p>';
    return;
  }
  const uniqueActuators = [
    ...new Map(actuators.map((item) => [item["ubicacion"], item])).values(),
  ];

  uniqueActuators.forEach((actuator) => {
    const estadoActual = actuator.estado;
    const nuevoEstado = estadoActual === "cerrada" ? "abrir" : "cerrar";
    const botonColor =
      estadoActual === "cerrada"
        ? "bg-red-500/90 hover:bg-red-600"
        : "bg-green-500/90 hover:bg-green-600";
    const botonTexto =
      estadoActual === "cerrada" ? "Abrir Puerta" : "Cerrar Puerta";
    const controlDiv = document.createElement("div");
    controlDiv.className =
      "glass-effect rounded-xl p-6 flex flex-col items-center hover-glass";
    controlDiv.innerHTML = `
        <div class="text-center mb-4">
            <h3 class="font-medium text-white mb-1">${actuator.ubicacion}</h3>
            <p class="text-sm text-slate-400">${actuator.tipo_dispositivo}</p>
        </div>
        <button 
            onclick="controlActuador('${actuator.ubicacion}', '${nuevoEstado}')" 
            class="${botonColor} text-white px-6 py-2 rounded-lg transition-colors w-full">
            ${botonTexto}
        </button>
    `;
    actuatorControls.appendChild(controlDiv);
  });
}

async function renderStatusGrid() {
  if (!statusGrid) return;
  const devices = await getDevices();
  if (!devices) return;

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
  if (!statusTableBody) return;
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

// Manejadores de eventos
window.handleDelete = async (id) => {
  if (confirm("¿Estás seguro de que quieres borrar este dispositivo?")) {
    await deleteDevice(id);
    await renderDeviceList();
  }
};

// ** LÓGICA DE VALIDACIÓN AÑADIDA **
window.controlActuador = async (ubicacion, accion) => {
  const devices = await getDevices();
  const actuator = devices.find(
    (d) => d.tipo_dispositivo === "actuador" && d.ubicacion === ubicacion
  );
  const sensorPuerta = devices.find(
    (d) => d.tipo_dispositivo === "puerta" && d.ubicacion === ubicacion
  );

  if (actuator && sensorPuerta) {
    await createDevice({
      tipo_dispositivo: "actuador",
      ubicacion: ubicacion,
      comando: accion,
      estado: accion === "cerrar" ? "cerrada" : "abierta",
      timestamp: new Date().toISOString(),
      ip: generateRandomIP(),
    });

    await createDevice({
      tipo_dispositivo: "puerta",
      ubicacion: ubicacion,
      estado: accion === "cerrar" ? "cerrada" : "abierta",
      timestamp: new Date().toISOString(),
      ip: generateRandomIP(),
    });

    console.log(
      `Acción '${accion}' registrada para los dispositivos en ${ubicacion}`
    );
    await renderDeviceList();
  } else {
    alert(
      `No se encontró un actuador y/o sensor de puerta para la ubicación: ${ubicacion}.`
    );
  }
};

if (deviceForm) {
  deviceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipo_dispositivo = document.getElementById("tipo_dispositivo").value;
    const ubicacion = document.getElementById("ubicacion").value;
    const newDeviceData = {
      tipo_dispositivo,
      ubicacion,
      comando: tipo_dispositivo === "actuador" ? "cerrar" : "",
      estado:
        tipo_dispositivo === "presencia"
          ? "no_detectada"
          : tipo_dispositivo === "puerta"
          ? "cerrada"
          : "cerrada",
      timestamp: new Date().toISOString(),
      ip: generateRandomIP(),
    };
    await createDevice(newDeviceData);
    await renderDeviceList();
    deviceForm.reset();
  });
}

// Lógica de carga inicial de la página
window.onload = async () => {
  const path = window.location.pathname;

  if (path.endsWith("index.html") || path === "/") {
    await renderDeviceList();
  } else if (path.endsWith("monitoreo.html")) {
    await renderStatusGrid();
    await renderStatusTable();
    monitorInterval = setInterval(async () => {
      await renderStatusGrid();
      await renderStatusTable();
    }, 2000);
  }
};

// Detener el intervalo cuando se sale de la página
window.onbeforeunload = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }
};
