// === ARRAYS PRINCIPALES ===
let cotizacion = [];
let inventarios = JSON.parse(localStorage.getItem("inventarios") || "{}");
let precios = JSON.parse(localStorage.getItem("precios_detallados") || "{}");

// === FUSIONAR INVENTARIOS Y PRECIOS ===
let recursosCombinados = {};
Object.keys(inventarios).forEach((cat) => {
  recursosCombinados[cat] = {};
  Object.keys(inventarios[cat]).forEach((sub) => {
    recursosCombinados[cat][sub] = inventarios[cat][sub].map((item) => {
      const precio = precios[cat]?.[sub]?.find((p) => p.nombre === item.nombre);
      return {
        nombre: item.nombre,
        cantidad: item.cantidad,
        valor: precio ? precio.valor : 0,
      };
    });
  });
});

// === AGREGAR ITEM A LA COTIZACIÓN ===
function agregarItem(seccion) {
  let select, cantidad, valor;

  // Identificar los inputs por sección
  if (seccion === "Infraestructura") {
    select = document.getElementById("infraSelect");
    cantidad = document.getElementById("infraCantidad");
    valor = document.getElementById("infraValor");
  } else if (seccion === "Suministros") {
    select = document.getElementById("suministroSelect");
    cantidad = document.getElementById("suministroCantidad");
    valor = document.getElementById("suministroValor");
  } else if (seccion === "Empleados") {
    select = document.getElementById("empleadoSelect");
    cantidad = document.getElementById("empleadoCantidad");
    valor = document.getElementById("empleadoValor");
  } else {
    // Categorías dinámicas
    const idBase = seccion.toLowerCase().replace(/\s+/g, "-");
    select = document.getElementById(`${idBase}-select`);
    cantidad = document.getElementById(`${idBase}-cantidad`);
    valor = document.getElementById(`${idBase}-valor`);
  }

  if (!select || !cantidad) return alert("No se encontraron los campos de la sección seleccionada.");
  if (!select.value || !cantidad.value) return alert("Completa todos los campos.");

  const itemSeleccionado = select.selectedOptions[0];
  const stock = parseInt(itemSeleccionado?.dataset.stock || 0);
  const valorAuto = parseFloat(itemSeleccionado?.dataset.valor || valor.value || 0);

  const item = {
    id: Date.now(),
    seccion,
    elemento: select.value,
    cantidad: parseInt(cantidad.value),
    valor: valorAuto,
    total: parseInt(cantidad.value) * parseFloat(valorAuto),
  };

  if (item.cantidad > stock) return alert(`Solo hay ${stock} unidades disponibles de "${item.elemento}"`);

  // === DESCONTAR DEL INVENTARIO ===
  descontarInventario(seccion, item.elemento, item.cantidad);

  cotizacion.push(item);
  actualizarTabla();

  select.value = "";
  cantidad.value = "";
  if (valor) valor.value = "";
}

// === DESCONTAR CANTIDAD DEL INVENTARIO ===
function descontarInventario(seccion, nombre, cantidad) {
  const catKey = seccion.toLowerCase();
  Object.keys(inventarios[catKey] || {}).forEach((sub) => {
    inventarios[catKey][sub] = inventarios[catKey][sub].map((it) => {
      if (it.nombre === nombre) it.cantidad -= cantidad;
      return it;
    });
  });
  localStorage.setItem("inventarios", JSON.stringify(inventarios));
}

// === ACTUALIZAR TABLA DE RESUMEN ===
function actualizarTabla() {
  const tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";
  let totalGeneral = 0;

  cotizacion.forEach((item) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.seccion}</td>
      <td>${item.elemento}</td>
      <td>${item.cantidad}</td>
      <td>$${item.valor.toLocaleString()}</td>
      <td>$${item.total.toLocaleString()}</td>
      <td><button class="btnEliminar" onclick="eliminarItem(${item.id})">✖</button></td>
    `;
    tbody.appendChild(fila);
    totalGeneral += item.total;
  });

  document.getElementById("totalGeneral").textContent = totalGeneral.toLocaleString();
}

// === ELIMINAR ITEM ===
function eliminarItem(id) {
  const item = cotizacion.find((i) => i.id === id);
  if (item) {
    // Devolver stock al inventario
    reponerInventario(item.seccion, item.elemento, item.cantidad);
  }
  cotizacion = cotizacion.filter((i) => i.id !== id);
  actualizarTabla();
}

// === REPONER STOCK AL ELIMINAR ===
function reponerInventario(seccion, nombre, cantidad) {
  const catKey = seccion.toLowerCase();
  Object.keys(inventarios[catKey] || {}).forEach((sub) => {
    inventarios[catKey][sub] = inventarios[catKey][sub].map((it) => {
      if (it.nombre === nombre) it.cantidad += cantidad;
      return it;
    });
  });
  localStorage.setItem("inventarios", JSON.stringify(inventarios));
}

// === GENERAR PDF DE COTIZACIÓN ===
function generarPDF() {
  if (cotizacion.length === 0) {
    alert("No hay elementos en la cotización.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ENCABEZADO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(153, 15, 12);
  doc.text("ACTA DE COTIZACIÓN", 105, 20, { align: "center" });
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Sistema de Gestión de Recursos - Gadier Sistemas", 105, 27, { align: "center" });
  doc.line(20, 30, 190, 30);

  doc.setFontSize(12);
  doc.text(`Cota, ${fecha}`, 20, 45);

  let y = 55;
  const intro = [
    "De acuerdo con los requerimientos presentados, se realiza la siguiente",
    "cotización de recursos necesarios para la ejecución de actividades,",
    "clasificados por secciones:",
  ];
  intro.forEach((line) => {
    doc.text(line, 20, y);
    y += 7;
  });
  y += 5;

  const secciones = [...new Set(cotizacion.map((i) => i.seccion))];
  secciones.forEach((seccion) => {
    const items = cotizacion.filter((i) => i.seccion === seccion);
    if (items.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(153, 15, 12);
      doc.text(seccion.toUpperCase() + ":", 20, y);
      y += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      items.forEach((item) => {
        const texto = `- ${item.cantidad} ${item.elemento}`;
        const valorTexto = `$${item.total.toLocaleString()}`;
        doc.text(texto, 25, y);
        doc.text(valorTexto, 180, y, { align: "right" });
        y += 6;
        if (y > 260) {
          doc.addPage();
          y = 30;
        }
      });
      y += 6;
    }
  });

  const total = document.getElementById("totalGeneral").textContent;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.line(20, y, 190, y);
  y += 8;
  doc.text(`TOTAL GENERAL: $${total}`, 20, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const cierre = [
    "El presente documento se expide como constancia de los recursos y valores",
    "asociados a la cotización solicitada. Este documento no representa una",
    "obligación contractual, sino un estimado de los costos relacionados.",
  ];
  cierre.forEach((line) => {
    doc.text(line, 20, y);
    y += 6;
  });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("© Gadier Sistemas | Sistema de Cotización Interna", 105, 285, { align: "center" });

  doc.save("acta_cotizacion.pdf");
}

// === INICIALIZAR ===
document.addEventListener("DOMContentLoaded", () => {
  cargarInventariosEnSelects();
  const boton = document.getElementById("btnActa");
  if (boton) boton.addEventListener("click", generarPDF);
});

// === CARGAR ITEMS DE INVENTARIO EN LOS SELECTS ===
function cargarInventariosEnSelects() {
  // Recorremos todas las categorías
  Object.keys(recursosCombinados).forEach((cat) => {
    Object.keys(recursosCombinados[cat]).forEach((sub) => {
      const items = recursosCombinados[cat][sub];
      items.forEach((item) => {
        const idSelect = cat === "suministros" ? "suministroSelect" : cat === "infraestructura" ? "infraSelect" : null;
        if (idSelect && document.getElementById(idSelect)) {
          const opt = document.createElement("option");
          opt.value = item.nombre;
          opt.textContent = `${item.nombre} (${item.cantidad} disp.)`;
          opt.dataset.valor = item.valor;
          opt.dataset.stock = item.cantidad;
          document.getElementById(idSelect).appendChild(opt);
        }
      });
    });
  });
}
