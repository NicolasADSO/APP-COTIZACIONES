document.addEventListener("DOMContentLoaded", () => {
  // === LECTURA DE BASES ===
  const inventarios = JSON.parse(localStorage.getItem("inventarios") || "{}");
  const precios = JSON.parse(localStorage.getItem("precios_detallados") || "{}");
  const tiempos = JSON.parse(localStorage.getItem("tiempos") || "{}");
  const asignaciones = JSON.parse(localStorage.getItem("asignaciones_fases") || "{}");

  // === FORMULARIO DE SIMULADOR ===
  document.getElementById("formSimulador").addEventListener("submit", (e) => {
    e.preventDefault();

    const proceso = document.getElementById("proceso").value.trim().toLowerCase();
    const cantidad = parseInt(document.getElementById("cantidad").value);
    const tiempoDisponible = parseInt(document.getElementById("tiempo").value);
    const presupuesto = parseInt(document.getElementById("presupuesto").value) || null;
    const tabla = document.getElementById("tablaResultados");

    tabla.innerHTML = "";

    if (!proceso || !cantidad || !tiempoDisponible) {
      alert("Por favor complete todos los campos obligatorios.");
      return;
    }

    // === PREDICCIÓN DE COSTOS ===
    const productividad = tiempos[proceso]?.productividad || 20; // documentos/día
    const resultados = [];
    let total = 0;
    let esViable = true;

    const recursosFase = asignaciones[proceso] || [];

    if (recursosFase.length === 0) {
      tabla.innerHTML = `<tr><td colspan="5">⚠️ No hay recursos asignados a esta fase en el organizador.</td></tr>`;
      document.getElementById("resultado").classList.remove("hidden");
      document.getElementById("total").textContent = `Costo total estimado: $0`;
      document.getElementById("recomendacionFinal").textContent = `Asigna recursos en el módulo "Organizador de Fases".`;
      return;
    }

    recursosFase.forEach(r => {
      const { categoria, subgrupo, nombre } = r;

      const invCant = obtenerCantidadInventario(categoria, subgrupo, nombre);
      const valorUnitario = obtenerPrecio(categoria, subgrupo, nombre);

      // Cálculo base según tipo
      let cantidadNecesaria = 1;
      if (categoria === "equipos") cantidadNecesaria = Math.ceil(cantidad / productividad / tiempoDisponible);
      if (categoria === "suministros" || categoria === "insumos") cantidadNecesaria = cantidad;
      if (categoria === "funcionarios" || categoria === "personal") cantidadNecesaria = 1;

      const costo = cantidadNecesaria * valorUnitario;
      total += costo;

      let estado = "✅ Disponible";
      if (invCant < cantidadNecesaria) {
        estado = `❌ Solo hay ${invCant} disponibles`;
        esViable = false;
      }

      resultados.push({
        tipo: formatearTipo(categoria),
        recurso: nombre,
        cantidad: cantidadNecesaria,
        costo: costo,
        just: estado
      });
    });

    // === MOSTRAR RESULTADOS ===
    resultados.forEach(r => {
      tabla.innerHTML += `
        <tr>
          <td>${r.tipo}</td>
          <td>${r.recurso}</td>
          <td>${r.cantidad}</td>
          <td>$${r.costo.toLocaleString("es-CO")}</td>
          <td>${r.just}</td>
        </tr>
      `;
    });

    // === EVALUAR PRESUPUESTO ===
    let mensajeFinal = "";
    if (presupuesto && total > presupuesto) {
      mensajeFinal = `⚠️ El costo estimado ($${total.toLocaleString("es-CO")}) supera el presupuesto ($${presupuesto.toLocaleString("es-CO")}).`;
      esViable = false;
    } else if (presupuesto && total < presupuesto * 0.8) {
      mensajeFinal = `✅ El costo está por debajo del presupuesto ($${presupuesto.toLocaleString("es-CO")}).`;
    } else {
      mensajeFinal = esViable
        ? "✅ Proyecto viable según recursos y tiempos disponibles."
        : "❌ Proyecto no viable: recursos insuficientes.";
    }

    document.getElementById("resultado").classList.remove("hidden");
    document.getElementById("total").textContent = `Costo total estimado: $${total.toLocaleString("es-CO")}`;
    document.getElementById("recomendacionFinal").textContent = mensajeFinal;

    // === PDF ===
    document.getElementById("btnPDF").onclick = () => {
      generarActaLicitacionPDF(proceso, cantidad, tiempoDisponible, presupuesto, resultados);
    };
  });

  // === FUNCIONES AUXILIARES ===
  function obtenerCantidadInventario(cat, sub, nombre) {
    try {
      const lista = inventarios[cat]?.[sub] || [];
      const item = lista.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
      return item ? parseFloat(item.cantidad) || 0 : 0;
    } catch {
      return 0;
    }
  }

  function obtenerPrecio(cat, sub, nombre) {
    try {
      const lista = precios[cat]?.[sub] || [];
      const item = lista.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
      return item ? parseFloat(item.valor) || 0 : 0;
    } catch {
      return 0;
    }
  }

  function formatearTipo(t) {
    if (t === "equipos") return "Equipo";
    if (t === "suministros") return "Suministro";
    if (t === "infraestructura") return "Infraestructura";
    if (t === "funcionarios" || t === "personal") return "Personal";
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
});
