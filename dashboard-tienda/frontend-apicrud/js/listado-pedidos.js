/* ── Selectores ─────────────────────────────────────────── */
const tablaPedidos = document.querySelector("#tabla-pedidos"); // <tbody> de la tabla
const searchInputPedidos = document.querySelector("input[placeholder='Buscar Pedido']");

/* ── Estado interno ─────────────────────────────────────── */
let pedidosCache = []; // copia local para editar/eliminar sin re-fetch
let filtroEstado = "todos"; // filtro activo de estado

/* ── Inicialización ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    getPedidos();
    iniciarFiltros();
    iniciarBuscaPedidos();
});

/* ─────────────────────────────────────────────────────────
 *  Búsqueda en tiempo real
 * ───────────────────────────────────────────────────────── */
const iniciarBuscaPedidos = () => {
    if (!searchInputPedidos) return;
    searchInputPedidos.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = pedidosCache.filter((p) =>
            (p.nombre?.toLowerCase().includes(termino)) ||
            (p.apellido?.toLowerCase().includes(termino)) ||
            (p.email?.toLowerCase().includes(termino)) ||
            (p.id?.toString().includes(termino))
        );
        
        // Aplicar filtro de estado también
        let filtradosFinal = filtrados;
        if (filtroEstado !== "todos") {
            filtradosFinal = filtrados.filter((p) => p.estado === filtroEstado);
        }
        
        renderPedidos(filtradosFinal);
    });
};

/* ─────────────────────────────────────────────────────────
 *  GET  /api/pedidos
 *  Carga todos los pedidos y los muestra en la tabla.
 * ───────────────────────────────────────────────────────── */
const getPedidos = async () => {
    const url = "http://localhost:3000/api/pedidos";
    try {
        const respuesta = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (respuesta.status === 204) {
            pedidosCache = [];
            renderPedidos([]);
            return;
        }

        if (!respuesta.ok) {
            alert(`Error del servidor: ${respuesta.status}`);
            return;
        }

        const datos = await respuesta.json();
        pedidosCache = datos; // guardar en memoria local
        renderPedidos(datos);
    } catch (error) {
        console.error("getPedidos →", error);
        alert("Error de conexión al servidor");
    }
};

/* ─────────────────────────────────────────────────────────
 *  Renderiza los pedidos en la tabla HTML.
 *  Columnas: #, Cliente, Email, Fecha, Total, Estado, Acciones
 * ───────────────────────────────────────────────────────── */
const renderPedidos = (pedidos) => {
    tablaPedidos.innerHTML = "";

    if (!pedidos || pedidos.length === 0) {
        tablaPedidos.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    No hay pedidos para mostrar.
                </td>
            </tr>`;
    return;
    }

    pedidos.forEach((pedido, i) => {
    const badgeClass = getBadgeClass(pedido.estado);
    const fechaFormateada = formatearFecha(pedido.fecha);
    
    // Construir nombre completo del cliente
    const nombreCliente = `${pedido.nombre ?? ""} ${pedido.apellido ?? ""}`.trim() || "—";
    const email = pedido.email ?? "—";
    
    // Calcular total: suma de detalles - descuento + aumento
    // Solo calcular si tenemos detalles, de lo contrario mostrar "$0.00"
    let total = 0;
    if (pedido.detalles && Array.isArray(pedido.detalles) && pedido.detalles.length > 0) {
        total = pedido.detalles.reduce((sum, det) => sum + (det.precio * det.cantidad), 0);
        total = total - (Number(pedido.descuento) || 0) + (Number(pedido.aumento) || 0);
    }

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${i + 1}</td>
        <td>${nombreCliente}</td>
        <td>${email}</td>
        <td>${fechaFormateada}</td>
        <td>$${total.toFixed(2)}</td>
        <td>
        <span class="badge ${badgeClass}">
            ${pedido.estado}
        </span>
        </td>
        <td>
            <!-- Selector de estado para cambio rápido -->
            <select
                class="form-select form-select-sm d-inline-block w-auto me-2"
                onchange="cambiarEstado(${pedido.id}, this.value)"
                title="Cambiar estado"
            >
                <option value="">-- Estado --</option>
                <option value="pendiente"   ${pedido.estado === "pendiente"   ? "selected" : ""}>Pendiente</option>
                <option value="procesando"  ${pedido.estado === "procesando"  ? "selected" : ""}>Procesando</option>
                <option value="completado"  ${pedido.estado === "completado"  ? "selected" : ""}>Completado</option>
                <option value="cancelado"   ${pedido.estado === "cancelado"   ? "selected" : ""}>Cancelado</option>
            </select>
            <button onclick="verDetalle(${pedido.id})" type="button" class="btn btn-info btn-sm me-1" title="Ver detalle"> Ver</button>
            <button onclick="deletePedidoTable(${pedido.id})" type="button" class="btn btn-danger btn-sm" title="Eliminar pedido">Eliminar</button>
        </td>
    `;
    tablaPedidos.appendChild(row);
    });
};

/* ─────────────────────────────────────────────────────────
 *  PATCH  /api/pedidos/:id/estado
 *  Cambia el estado de un pedido.
 *  Estados válidos: pendiente | procesando | completado | cancelado
 * ───────────────────────────────────────────────────────── */
const cambiarEstado = async (idPedido, nuevoEstado) => {
    if (!nuevoEstado) return; // opción vacía seleccionada

    const estadosValidos = ["pendiente", "procesando", "completado", "cancelado"];
    if (!estadosValidos.includes(nuevoEstado)) {
        alert("Estado no válido");
    return;
    }

    const url = `http://localhost:3000/api/pedidos/${idPedido}/estado`;
    try {
        const respuesta = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado }),
        });

        if (respuesta.status === 406) {
            alert("El estado enviado no fue aceptado por el servidor");
            return;
        }

        if (!respuesta.ok) {
            alert(`Error al cambiar estado: ${respuesta.status}`);
            return;
        }

        const mensaje = await respuesta.json();
        alert(mensaje.message ?? "Estado actualizado: " + nuevoEstado);
        
        // Actualizar el cache local
        const pedidoActualizado = pedidosCache.find(p => p.id === idPedido);
        if (pedidoActualizado) {
            pedidoActualizado.estado = nuevoEstado;
        }
        
        getPedidos(); // refrescar tabla
    } catch (error) {
        console.error("cambiarEstado →", error);
        alert("Error de conexión al servidor");
    }
};

/* ─────────────────────────────────────────────────────────
 *  DELETE  /api/pedidos/:id
 *  Elimina un pedido con confirmación previa.
 * ───────────────────────────────────────────────────────── */
const deletePedidoTable = async (idPedido) => {
    const pedido = pedidosCache.find((p) => p.id === idPedido);
    const nombreCliente = pedido ? `${pedido.nombre ?? ""} ${pedido.apellido ?? ""}`.trim() : `pedido #${idPedido}`;

    const confirmar = confirm(`¿Deseas eliminar el pedido de ${nombreCliente}?`);
    if (!confirmar) return;

    const url = `http://localhost:3000/api/pedidos/${idPedido}`;
    try {
        const respuesta = await fetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (respuesta.status === 406) {
            alert("El ID enviado no fue admitido");
            return;
        }

        if (!respuesta.ok) {
            alert(`Error al eliminar: ${respuesta.status}`);
            return;
        }

        const mensaje = await respuesta.json();
        alert(mensaje.message ?? "Pedido eliminado");
        getPedidos();
    } catch (error) {
        console.error("deletePedidoTable →", error);
        alert("Error de conexión al servidor");
    }
};

/* 
 *  Ver detalle de un pedido
 *  Carga el pedido completo con detalles y lo guarda en localStorage
 *  para mostrar en un modal o vista detallada.
 * */
const verDetalle = async (idPedido) => {
    try {
        // Obtener el pedido completo con detalles
        const url = `http://localhost:3000/api/pedidos/${idPedido}`;
        const respuesta = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!respuesta.ok) {
            alert(`Error al cargar detalle: ${respuesta.status}`);
            return;
        }

        const pedidoDetalle = await respuesta.json();
        
        // Guardar en localStorage
        localStorage.setItem("pedidoDetalle", JSON.stringify(pedidoDetalle));
        
        // Construir mensaje de detalle
        const nombreCliente = `${pedidoDetalle.nombre ?? ""} ${pedidoDetalle.apellido ?? ""}`.trim();
        const cantidadProductos = pedidoDetalle.detalles?.length ?? 0;
        
        const mensaje = `
Pedido #${pedidoDetalle.id}
─────────────────────
Cliente: ${nombreCliente}
Email: ${pedidoDetalle.email}
Fecha: ${formatearFecha(pedidoDetalle.fecha)}
Estado: ${pedidoDetalle.estado}
Productos: ${cantidadProductos}
        `.trim();
        
        alert(mensaje);
        
    } catch (error) {
        console.error("verDetalle →", error);
        alert("Error al cargar detalle del pedido");
    }
};

/* ─────────────────────────────────────────────────────────
 *  Filtros por estado (botones en el HTML)
 *  Agrega un listener a cada botón con data-estado="..."
 * ───────────────────────────────────────────────────────── */
const iniciarFiltros = () => {
    const btnsFiltro = document.querySelectorAll("[data-estado]");
    btnsFiltro.forEach((btn) => {
        btn.addEventListener("click", () => {
        filtroEstado = btn.dataset.estado;

        // marcar botón activo
        btnsFiltro.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        let filtrados = pedidosCache;
        
        // Aplicar filtro de estado
        if (filtroEstado !== "todos") {
            filtrados = filtrados.filter((p) => p.estado === filtroEstado);
        }
        
        // Aplicar búsqueda si existe
        if (searchInputPedidos && searchInputPedidos.value.trim()) {
            const termino = searchInputPedidos.value.toLowerCase();
            filtrados = filtrados.filter((p) =>
                (p.nombre?.toLowerCase().includes(termino)) ||
                (p.apellido?.toLowerCase().includes(termino)) ||
                (p.email?.toLowerCase().includes(termino)) ||
                (p.id?.toString().includes(termino))
            );
        }

        renderPedidos(filtrados);
        });
    });
    
    // Marcar "todos" como activo por defecto
    const btnTodos = document.querySelector('[data-estado="todos"]');
    if (btnTodos) btnTodos.classList.add("active");
};

/* ─────────────────────────────────────────────────────────
 *  Utilidades
 * ───────────────────────────────────────────────────────── */

/** Devuelve la clase Bootstrap del badge según el estado */
const getBadgeClass = (estado) => {
    const clases = {
        pendiente:  "bg-warning text-dark",
        procesando: "bg-primary",
        completado: "bg-success",
        cancelado:  "bg-danger",
    };
    return clases[estado] ?? "bg-secondary";
};

/** Formatea una fecha ISO a dd/mm/yyyy */
const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "—";
    const d = new Date(fechaISO);
    if (isNaN(d)) return fechaISO;
    return d.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};