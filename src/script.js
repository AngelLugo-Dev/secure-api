// Constantes y selectores
const API_URL = "https://68bb0de484055bce63f104b3.mockapi.io/api/v1/Proyecto1";
const deviceForm = document.getElementById("deviceForm");
const deviceList = document.getElementById("deviceList");
const statusGrid = document.getElementById("statusGrid");
const statusTableBody = document.getElementById("statusTableBody");

// Funciones para interactuar con la API
// ---
// CRUD: CREAR dispositivo
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

// CRUD: LEER (obtener todos los dispositivos)
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

// CRUD: ACTUALIZAR dispositivo
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

// CRUD: BORRAR dispositivo
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

// Funciones para renderizar la interfaz de usuario
// ---
// Renderiza la lista de dispositivos para administración
async function renderDeviceList() {
  const devices = await getDevices();
  if (!devices) return;
  deviceList.innerHTML = "";
  devices.forEach((device) => {
    const div = document.createElement("div");
    div.className =
      "flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm";
    div.innerHTML = `
            <div>
                <p class="font-semibold">${device.nombre}</p>
                <p class="text-sm text-gray-500">${device.tipo_dispositivo} en ${device.ubicacion}</p>
            </div>
            <div>
                <button onclick="handleDelete('${device.id}')" class="bg-red-500 text-white p-2 rounded text-xs hover:bg-red-600">Borrar</button>
            </div>
        `;
    deviceList.appendChild(div);
  });
}

// Renderiza el estado gráfico de los dispositivos
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
                <span class="ml-3 font-medium">${device.nombre}</span>
            </div>
            <p class="text-sm font-bold text-gray-600">${statusText}</p>
        `;
    statusGrid.appendChild(card);
  });
}

// Renderiza la tabla con los últimos 10 estados
async function renderStatusTable() {
  const devices = await getDevices();
  if (!devices) return;
  statusTableBody.innerHTML = "";

  // Obtener los últimos 10 estados (o menos si hay menos de 10)
  const recentUpdates = devices
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  recentUpdates.forEach((device) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 border-b";
    row.innerHTML = `
            <td class="py-3 px-6 text-left">${device.nombre}</td>
            <td class="py-3 px-6 text-left">${device.estado}</td>
            <td class="py-3 px-6 text-left">${new Date(
              device.timestamp
            ).toLocaleString()}</td>
        `;
    statusTableBody.appendChild(row);
  });
}

// Manejadores de eventos
// ---
// Maneja el envío del formulario para crear un nuevo dispositivo
deviceForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const tipo_dispositivo = document.getElementById("tipo_dispositivo").value;
  const ubicacion = document.getElementById("ubicacion").value;

  const newDeviceData = {
    nombre,
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
  };

  await createDevice(newDeviceData);
  await renderDeviceList();
  deviceForm.reset();
});

// Maneja la acción de borrar un dispositivo
async function handleDelete(id) {
  if (confirm("¿Estás seguro de que quieres borrar este dispositivo?")) {
    await deleteDevice(id);
    await renderDeviceList();
  }
}

// Lógica de monitoreo: Peticiones cada 2 segundos
// ---
// Renderiza el estado inicial al cargar la página
window.onload = async () => {
  await renderDeviceList();
  await renderStatusGrid();
  await renderStatusTable();

  // Configura la tasa de refresco de 2 segundos
  setInterval(async () => {
    await renderStatusGrid();
    await renderStatusTable();
  }, 2000);
};

// Funciones de control del actuador
async function controlActuador(accion) {
  const ubicacion = prompt(
    "¿Qué puerta deseas " +
      (accion === "cerrar" ? "cerrar" : "abrir") +
      "? (entrada_frontal o entrada_trasera)"
  );
  if (ubicacion) {
    const actuator = (await getDevices()).find(
      (d) => d.tipo_dispositivo === "actuador" && d.ubicacion === ubicacion
    );
    if (actuator) {
      await updateDevice(actuator.id, {
        comando: accion,
        estado: accion === "cerrar" ? "cerrada" : "abierta",
        timestamp: new Date().toISOString(),
      });
    } else {
      alert(`No se encontró un actuador para la ${ubicacion}.`);
    }
  }
}
