
/* ── Selectores del HTML existente ──────────────────────── */
const clienteSelect    = document.querySelector("#id_cliente");
const metodoPagoSelect = document.querySelector("#metodo_pago");
const tablaCarrito     = document.querySelector("#tabla-carrito tbody");
const descuentoInput   = document.querySelector("#descuento");   // descuento en $
const aumentoInput     = document.querySelector("#aumento");     // envío / aumento en $
const totalDisplay     = document.querySelector("#total-pedido");
const formulario       = document.querySelector("#formulario-pedido");

/* ── Variables inyectadas dinámicamente (ver injectSelectorUI) */
let productSelect = null;
let cantidadInput = null;
let btnAgregarPro = null;

/* ── Estado interno ─────────────────────────────────────── */
let productosDisponibles = []; // catálogo completo desde GET /api/productos
let itemsPedido          = []; // líneas del pedido activo

/* ═══════════════════════════════════════════════════════════
 *  INICIALIZACIÓN
 * ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {

    // 1. Inyectar UI de selección de productos (faltante en el HTML)
    injectSelectorUI();

    // 2. Cargar datos remotos
    await Promise.all([cargarClientes(), cargarProductos()]);

    // 3. Recalcular total al cambiar descuento o aumento
    descuentoInput.addEventListener("input", actualizarTotal);
    aumentoInput.addEventListener("input",   actualizarTotal);

    // 4. Si venimos de listado con un pedido guardado (vista detalle)
    const pedidoGuardado = JSON.parse(localStorage.getItem("pedidoDetalle"));
    if (pedidoGuardado) {
        console.info("Pedido cargado desde localStorage:", pedidoGuardado);
        // ⚠️  PENDIENTE: implementar precarga de campos si el backend
        //     soporta edición completa de pedidos (PUT /api/pedidos/:id).
        localStorage.removeItem("pedidoDetalle");
    }

    // 5. Escuchar el submit del formulario
    formulario.addEventListener("submit", (e) => {
        e.preventDefault(); // evitar recarga de página
        handleCrearPedido();
    });
});

/* ═══════════════════════════════════════════════════════════
 *  INYECCIÓN DE UI — selector de producto + cantidad + botón
 *  Se inserta justo antes de la sección de #tabla-carrito.
 * ═══════════════════════════════════════════════════════════ */
const injectSelectorUI = () => {
    const tablaWrapper = document.querySelector("#tabla-carrito").closest(".form-outline");

    const selectorHTML = `
        <div id="selector-producto-ui" class="form-outline mb-3">
            <h5>Agregar Producto</h5>
            <div class="input-group">
                <select id="select-producto" class="form-control">
                    <option value="">-- Seleccionar producto --</option>
                </select>
                <input
                    id="cantidad-pro"
                    type="number"
                    class="form-control"
                    placeholder="Cantidad"
                    value="1"
                    min="1"
                    style="max-width:100px"
                />
                <div class="input-group-append">
                    <button
                        id="btn-agregar-pro"
                        type="button"
                        class="btn btn-success"
                    >
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    `;

    tablaWrapper.insertAdjacentHTML("beforebegin", selectorHTML);

    // Apuntar las variables a los elementos recién inyectados
    productSelect = document.querySelector("#select-producto");
    cantidadInput = document.querySelector("#cantidad-pro");
    btnAgregarPro = document.querySelector("#btn-agregar-pro");

    btnAgregarPro.addEventListener("click", agregarProducto);
};

/* ═══════════════════════════════════════════════════════════
 *  GET /api/clientes  →  llena #id_cliente
 * ═══════════════════════════════════════════════════════════ */
const cargarClientes = async () => {
    const url = "http://localhost:3000/api/clientes";
    try {
        const respuesta = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!respuesta.ok) {
            console.warn("No se pudieron cargar clientes:", respuesta.status);
            return;
        }

        const clientes = await respuesta.json();

        clienteSelect.innerHTML = `<option value="">-- Seleccionar Cliente --</option>`;
        clientes.forEach((c) => {
            const opt       = document.createElement("option");
            opt.value       = c.id_cliente;
            opt.textContent = `${c.nombre} ${c.apellido}`;
            clienteSelect.appendChild(opt);
        });

    } catch (error) {
        console.error("cargarClientes →", error);
        alert("Error al cargar la lista de clientes");
    }
};

/* ═══════════════════════════════════════════════════════════
 *  GET /api/productos  →  llena #select-producto (inyectado)
 * ═══════════════════════════════════════════════════════════ */
const cargarProductos = async () => {
    const url = "http://localhost:3000/api/productos";
    try {
        const respuesta = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!respuesta.ok) {
            console.warn("No se pudieron cargar productos:", respuesta.status);
            return;
        }

        productosDisponibles = await respuesta.json();

        productSelect.innerHTML = `<option value="">-- Seleccionar producto --</option>`;
        productosDisponibles.forEach((p) => {
            if (p.disponible === 0) return; // omitir no disponibles
            const opt       = document.createElement("option");
            // ⚠️  La API puede devolver "id" o "id_producto" según el backend.
            // Se usa el que esté definido para evitar que opt.value sea "undefined"
            // y que Number(productSelect.value) devuelva NaN al agregar.
            opt.value       = p.id_producto ?? p.id;
            opt.textContent = `${p.nombre} — $${Number(p.precio).toFixed(2)}`;
            productSelect.appendChild(opt);
        });

    } catch (error) {
        console.error("cargarProductos →", error);
        alert("Error al cargar la lista de productos");
    }
};

/* ═══════════════════════════════════════════════════════════
 *  Agrega un producto a los items del pedido
 * ═══════════════════════════════════════════════════════════ */
const agregarProducto = () => {
    const idProducto = Number(productSelect.value);
    const cantidad   = Number(cantidadInput.value);

    if (!idProducto) {
        alert("Selecciona un producto");
        return;
    }
    if (!cantidad || cantidad < 1) {
        alert("La cantidad debe ser al menos 1");
        return;
    }

    const productoInfo = productosDisponibles.find(
        (p) => (p.id_producto ?? p.id) === idProducto
    );
    if (!productoInfo) {
        alert("Producto no encontrado en el catálogo");
        return;
    }

    // Si ya existe en el pedido, sumar cantidad
    const existente = itemsPedido.find((item) => item.id_producto === idProducto);
    if (existente) {
        existente.cantidad += cantidad;
        existente.subtotal  = existente.cantidad * existente.precio;
    } else {
        itemsPedido.push({
            id_producto: productoInfo.id_producto ?? productoInfo.id,
            nombre:      productoInfo.nombre,
            precio:      Number(productoInfo.precio),
            cantidad,
            subtotal:    Number(productoInfo.precio) * cantidad,
        });
    }

    renderCarrito();
    actualizarTotal();

    // Limpiar selectores tras agregar
    productSelect.value = "";
    cantidadInput.value = 1;
};

/* ═══════════════════════════════════════════════════════════
 *  Renderiza las filas del carrito en #tabla-carrito tbody
 * ═══════════════════════════════════════════════════════════ */
const renderCarrito = () => {
    tablaCarrito.innerHTML = "";

    if (itemsPedido.length === 0) {
        tablaCarrito.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-3">
                    Aún no has agregado productos.
                </td>
            </tr>`;
        return;
    }

    itemsPedido.forEach((item, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.nombre}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>
                <input
                    type="number"
                    min="1"
                    value="${item.cantidad}"
                    class="form-control form-control-sm"
                    style="width:80px"
                    onchange="actualizarCantidad(${i}, this.value)"
                />
            </td>
            <td>$${item.subtotal.toFixed(2)}</td>
            <td>
                <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    onclick="quitarItem(${i})"
                >✕</button>
            </td>
        `;
        tablaCarrito.appendChild(row);
    });
};

/* ═══════════════════════════════════════════════════════════
 *  Actualiza la cantidad de un item ya en el carrito
 * ═══════════════════════════════════════════════════════════ */
const actualizarCantidad = (pos, nuevaCantidad) => {
    const cant = Number(nuevaCantidad);
    if (!cant || cant < 1) {
        alert("Cantidad inválida");
        renderCarrito();
        return;
    }
    itemsPedido[pos].cantidad = cant;
    itemsPedido[pos].subtotal = cant * itemsPedido[pos].precio;
    renderCarrito();
    actualizarTotal();
};

/* ═══════════════════════════════════════════════════════════
 *  Quita un item del carrito
 * ═══════════════════════════════════════════════════════════ */
const quitarItem = (pos) => {
    itemsPedido.splice(pos, 1);
    renderCarrito();
    actualizarTotal();
};

/* ═══════════════════════════════════════════════════════════
 *  Recalcula el total y actualiza #total-pedido
 *  Total = suma(subtotales) − descuento($) + aumento($)
 * ═══════════════════════════════════════════════════════════ */
const actualizarTotal = () => {
    const subtotalBruto = itemsPedido.reduce((acc, item) => acc + item.subtotal, 0);
    const descuento     = Number(descuentoInput.value) || 0;
    const aumento       = Number(aumentoInput.value)   || 0;
    const total         = subtotalBruto - descuento + aumento;

    totalDisplay.textContent = `$${total.toFixed(2)}`;

    return total;
};

/* ═══════════════════════════════════════════════════════════
 *  Valida el formulario antes de enviar
 * ═══════════════════════════════════════════════════════════ */
const validarFormulario = () => {
    if (!clienteSelect.value) {
        alert("Selecciona un cliente");
        clienteSelect.focus();
        return false;
    }
    if (!metodoPagoSelect.value || metodoPagoSelect.value === "Seleccionar Método de Pago") {
        alert("Selecciona un método de pago");
        metodoPagoSelect.focus();
        return false;
    }
    if (itemsPedido.length === 0) {
        alert("Debes agregar al menos un producto al pedido");
        return false;
    }
    return true;
};

/* ═══════════════════════════════════════════════════════════
 *  Construye el payload para POST /api/pedidos
 * ═══════════════════════════════════════════════════════════ */
const buildPayload = () => {
    
    return {
        id_cliente:  Number(clienteSelect.value),
        metodo_pago: metodoPagoSelect.value,
        descuento:   Number(descuentoInput.value) || 0,
        aumento:     Number(aumentoInput.value)   || 0,
        productos: itemsPedido.map((item) => ({
            id_producto: item.id_producto,
            precio:      Number(item.precio),        // el backend espera precio, no subtotal
            cantidad:    item.cantidad,
        })),
    };
};

/* ═══════════════════════════════════════════════════════════
 *  POST /api/pedidos  —  handler del submit del formulario
 * ═══════════════════════════════════════════════════════════ */
const handleCrearPedido = async () => {
    if (!validarFormulario()) return;

    const payload = buildPayload();
    console.log("Payload pedido →", payload);

    const url = "http://localhost:3000/api/pedidos";
    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
            console.log("Payload being sent:", payload); // Add this line
            console.log("Payload JSON string:", JSON.stringify(payload)); 

        if (respuesta.status === 406) {
            alert("Los datos enviados no son admitidos por el servidor");
            return;
        }

        if (!respuesta.ok) {
            alert(`Error del servidor: ${respuesta.status}`);
            return;
        }

        const mensaje = await respuesta.json();
        alert(mensaje.message ?? "¡Pedido creado con éxito!");
        limpiarFormulario();

        // Misma convención de rutas relativas que usa el HTML
        location.href = "listado-pedidos.html";

    } catch (error) {
        console.error("handleCrearPedido →", error);
        alert("Error de conexión al servidor");
    }
};

/* ═══════════════════════════════════════════════════════════
 *  Limpia el formulario tras crear el pedido exitosamente
 * ═══════════════════════════════════════════════════════════ */
const limpiarFormulario = () => {
    clienteSelect.value    = "";
    metodoPagoSelect.value = "";
    productSelect.value    = "";
    cantidadInput.value    = 1;
    descuentoInput.value   = 0;
    aumentoInput.value     = 0;
    itemsPedido            = [];
    renderCarrito();
    actualizarTotal();
};