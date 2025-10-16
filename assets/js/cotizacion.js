// === ARRAY PRINCIPAL DE COTIZACIÓN ===
let cotizacion = [];

// === AGREGAR ITEM A LA COTIZACIÓN ===
function agregarItem(seccion) {
  let select, cantidad, valor;

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
    // Para categorías nuevas dinámicas
    const idBase = seccion.toLowerCase().replace(/\s+/g, "-");
    select = document.getElementById(`${idBase}-select`);
    cantidad = document.getElementById(`${idBase}-cantidad`);
    valor = document.getElementById(`${idBase}-valor`);
  }

  if (!select || !cantidad || !valor) {
    alert("No se encontraron los campos de la sección seleccionada.");
    return;
  }

  if (!select.value || !cantidad.value || !valor.value) {
    alert("Por favor completa todos los campos antes de agregar.");
    return;
  }

  const item = {
    id: Date.now(),
    seccion,
    elemento: select.value,
    cantidad: parseInt(cantidad.value),
    valor: parseFloat(valor.value),
    total: parseInt(cantidad.value) * parseFloat(valor.value),
  };

  cotizacion.push(item);
  actualizarTabla();

  select.value = "";
  cantidad.value = "";
  valor.value = "";
}

// === ACTUALIZAR TABLA ===
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
  cotizacion = cotizacion.filter((i) => i.id !== id);
  actualizarTabla();
}

// === GENERAR ACTA PDF ===
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

  // === ENCABEZADO ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(153, 15, 12);
  doc.text("ACTA DE COTIZACIÓN", 105, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Sistema de Gestión de Recursos - Gadier Sistemas", 105, 27, { align: "center" });
  doc.line(20, 30, 190, 30);

  // === FECHA ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Cota, ${fecha}`, 20, 45);

  // === CUERPO ===
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

  // === AGRUPAR POR SECCIONES ===
  const secciones = Object.keys(listas);
  secciones.forEach((seccion) => {
    const items = cotizacion.filter((i) => i.seccion === seccion);
    if (items.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(153, 15, 12);
      doc.text(seccion.toUpperCase() + ":", 20, y);
      y += 8;

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      items.forEach((item) => {
        const texto = `- ${item.cantidad} ${item.elemento}${item.cantidad > 1 ? "s" : ""}`;
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

  // === TOTAL GENERAL ===
  const total = document.getElementById("totalGeneral").textContent;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.line(20, y, 190, y);
  y += 8;
  doc.text(`TOTAL GENERAL: $${total}`, 20, y);

  // === CIERRE ===
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

  // === PIE ===
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("© Gadier Sistemas | Sistema de Cotización Interna", 105, 285, { align: "center" });

  doc.save("acta_cotizacion.pdf");
}

// === NAVEGACIÓN ENTRE TABS ===
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      sections.forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });

  const boton = document.getElementById("btnActa");
  if (boton) boton.addEventListener("click", generarPDF);

  inicializarListas();
});

// === LISTAS DINÁMICAS ===
let listas = {
  Infraestructura: ["Oficina equipada", "Vehículo de transporte", "Equipos tecnológicos", "Espacio de almacenamiento"],
  Suministros: ["Papelería", "Herramientas", "Material de limpieza", "Combustible"],
  Empleados: ["Auxiliar técnico", "Ingeniero de soporte", "Coordinador logístico", "Supervisor"],
};

// === INICIALIZAR LISTAS ===
function inicializarListas() {
  const guardadas = JSON.parse(localStorage.getItem("listas"));
  if (guardadas) listas = guardadas;

  reconstruirNavbar();
  cargarListas();

  const btnCategoria = document.getElementById("btnAgregarCategoria");
  if (btnCategoria) {
    btnCategoria.addEventListener("click", () => {
      const nueva = document.getElementById("nuevaCategoria").value.trim();
      if (!nueva) return alert("Escribe un nombre para la nueva categoría.");
      if (listas[nueva]) return alert("Esa categoría ya existe.");

      listas[nueva] = [];
      localStorage.setItem("listas", JSON.stringify(listas));
      document.getElementById("nuevaCategoria").value = "";
      agregarCategoriaAlNavbar(nueva);
      cargarListas();
      alert(`Categoría agregada: "${nueva}"`);
    });
  }

  const btnElemento = document.getElementById("btnAgregarElemento");
  if (btnElemento) {
    btnElemento.addEventListener("click", () => {
      const tipo = document.getElementById("tipoLista").value;
      const nuevo = document.getElementById("nuevoElemento").value.trim();

      if (!tipo) return alert("Selecciona una categoría primero.");
      if (!nuevo) return alert("Escribe un nombre para el nuevo elemento.");
      if (listas[tipo].includes(nuevo)) return alert("Ese elemento ya existe.");

      listas[tipo].push(nuevo);
      localStorage.setItem("listas", JSON.stringify(listas));
      document.getElementById("nuevoElemento").value = "";
      cargarListas();
      alert(`Elemento agregado a ${tipo}: "${nuevo}"`);
    });
  }
}

// === CARGAR LISTAS ===
function cargarListas() {
  if (document.getElementById("infraSelect") && listas.Infraestructura)
    document.getElementById("infraSelect").innerHTML = generarOpciones(listas.Infraestructura);
  if (document.getElementById("suministroSelect") && listas.Suministros)
    document.getElementById("suministroSelect").innerHTML = generarOpciones(listas.Suministros);
  if (document.getElementById("empleadoSelect") && listas.Empleados)
    document.getElementById("empleadoSelect").innerHTML = generarOpciones(listas.Empleados);

  const selectTipo = document.getElementById("tipoLista");
  if (selectTipo) {
    selectTipo.innerHTML = Object.keys(listas)
      .map((cat) => `<option value="${cat}">${cat}</option>`)
      .join("");
  }

  actualizarVistaListas();
}

// === ACTUALIZAR VISTA ADMIN ===
function actualizarVistaListas() {
  const contenedor = document.getElementById("vistaListas");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  Object.entries(listas).forEach(([categoria, items]) => {
    const bloque = document.createElement("div");
    bloque.classList.add("bloque-categoria");
    bloque.innerHTML = `
      <div class="categoria-header">
        <h4>${categoria}</h4>
        <div class="categoria-actions">
          <button class="btnEditarCat" data-cat="${categoria}">📝</button>
          <button class="btnEliminarCat" data-cat="${categoria}">🗑️</button>
        </div>
      </div>
      <ul>
        ${
          items
            .map(
              (i) => `
          <li>${i}
            <button class="btnEliminarItem" data-cat="${categoria}" data-item="${i}">✖</button>
          </li>`
            )
            .join("") || "<li><em>Vacío</em></li>"
        }
      </ul>
    `;
    contenedor.appendChild(bloque);
  });

  document.querySelectorAll(".btnEliminarCat").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const cat = e.target.dataset.cat;
      if (confirm(`¿Eliminar la categoría "${cat}" y todos sus elementos?`)) {
        delete listas[cat];
        localStorage.setItem("listas", JSON.stringify(listas));
        cargarListas();
        reconstruirNavbar();
      }
    })
  );

  document.querySelectorAll(".btnEditarCat").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const cat = e.target.dataset.cat;
      const nuevoNombre = prompt(`Editar nombre de la categoría "${cat}":`, cat);
      if (!nuevoNombre || nuevoNombre.trim() === "" || nuevoNombre === cat) return;
      if (listas[nuevoNombre]) return alert("Ya existe una categoría con ese nombre.");

      listas[nuevoNombre] = [...listas[cat]];
      delete listas[cat];
      localStorage.setItem("listas", JSON.stringify(listas));
      cargarListas();
      reconstruirNavbar();
      alert(`Categoría renombrada a "${nuevoNombre}"`);
    })
  );

  document.querySelectorAll(".btnEliminarItem").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const cat = e.target.dataset.cat;
      const item = e.target.dataset.item;
      listas[cat] = listas[cat].filter((i) => i !== item);
      localStorage.setItem("listas", JSON.stringify(listas));
      cargarListas();
    })
  );
}

// === RECONSTRUIR NAVBAR ===
function reconstruirNavbar() {
  if (!listas) return;
  const categorias = Object.keys(listas);
  categorias.forEach((cat) => {
    const idTab = cat.toLowerCase().replace(/\s+/g, "-");
    if (document.querySelector(`[data-tab="${idTab}"]`)) return;
    if (["infraestructura", "suministros", "empleados", "admin", "resumen"].includes(idTab)) return;
    agregarCategoriaAlNavbar(cat);
  });
}

// === AGREGAR NUEVA CATEGORÍA AL NAVBAR ===
function agregarCategoriaAlNavbar(nombreCategoria) {
  const navbar = document.querySelector(".navbar ul");
  const main = document.querySelector("main") || document.querySelector(".content");
  if (!navbar || !main) return console.error("No se encontró el navbar o el contenedor principal");

  const idTab = nombreCategoria.toLowerCase().replace(/\s+/g, "-");
  if (document.querySelector(`[data-tab="${idTab}"]`)) return;

  const nuevaTab = document.createElement("li");
  nuevaTab.classList.add("tab");
  nuevaTab.dataset.tab = idTab;
  nuevaTab.textContent = nombreCategoria;

  const adminTab = document.querySelector('[data-tab="admin"]');
  if (adminTab) navbar.insertBefore(nuevaTab, adminTab);
  else navbar.appendChild(nuevaTab);

  const nuevaSeccion = document.createElement("section");
  nuevaSeccion.classList.add("tab-content");
  nuevaSeccion.id = `tab-${idTab}`;
  nuevaSeccion.innerHTML = `
    <h2>${nombreCategoria}</h2>
    <div class="form-row">
      <select id="${idTab}-select"></select>
      <input type="number" id="${idTab}-cantidad" placeholder="Cantidad">
      <input type="number" id="${idTab}-valor" placeholder="Valor (COP)">
      <button onclick="agregarItem('${nombreCategoria}')">Agregar</button>
    </div>
  `;
  const adminSection = document.getElementById("tab-admin");
  if (adminSection) main.insertBefore(nuevaSeccion, adminSection);
  else main.appendChild(nuevaSeccion);

  cargarListas();

  // Reactivar eventos de navegación
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });

  // Activar nueva pestaña automáticamente
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
  nuevaTab.classList.add("active");
  nuevaSeccion.classList.add("active");
}

// === GENERAR OPCIONES DE SELECT ===
function generarOpciones(array) {
  return `<option value="">Seleccionar...</option>` + array.map((el) => `<option>${el}</option>`).join("");
}
