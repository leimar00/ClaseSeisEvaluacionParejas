// =====================================================
// CONFIGURACIÓN GLOBAL
// =====================================================
const API_URL = 'http://localhost:3000/api';
const TASA_CAMBIO = 4000; // 1 USD = 4000 COP (aprox)
const AUMENTO_CONTRA_ENTREGA = 0.05; // 5%
const VALOR_DOMICILIO = 10000; // Pesos Colombianos
const INTERVALO_VERIFICACION = 10000; // 10 segundos para verificar nuevos productos

// Variable para almacenar productos actuales
let productosActuales = [];
let productosListadoActual = [];  // ← NUEVO: Guardar lista completa para búsquedas
let idIntervaloMonitoreo = null;  // ID del intervalo para poder detenerlo si es necesario

// =====================================================
// CARGAR PRODUCTOS EN INDEX.HTML
// =====================================================
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const productos = await response.json();
        renderizarProductos(productos);
        
        // Guardar productos actuales para comparación posterior
        productosActuales = productos.map(p => p.id);
        
        // Iniciar monitoreo automático solo en index.html
        if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
            iniciarMonitoreoProductos();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar productos. Intenta más tarde.', 'error');
    }
}

// =====================================================
// MONITOREO AUTOMÁTICO DE NUEVOS PRODUCTOS
// =====================================================
function iniciarMonitoreoProductos() {
    // Verificar cada X segundos si hay nuevos productos
    if (!idIntervaloMonitoreo) {
        idIntervaloMonitoreo = setInterval(() => {
            verificarNuevosProductos();
        }, INTERVALO_VERIFICACION);
        console.log('✅ Monitoreo de productos iniciado (cada 10 segundos)');
    }
}

function detenerMonitoreoProductos() {
    if (idIntervaloMonitoreo) {
        clearInterval(idIntervaloMonitoreo);
        idIntervaloMonitoreo = null;
        console.log('⛔ Monitoreo de productos detenido');
    }
}

async function verificarNuevosProductos() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        if (!response.ok) return; // Solo comparar si la respuesta es válida
        
        const productosNuevos = await response.json();
        const idsNuevos = productosNuevos.map(p => p.id);
        
        // Comparar: ¿hay productos nuevos o eliminados?
        const productosActualesSet = new Set(productosActuales);
        const idsNuevosSet = new Set(idsNuevos);
        
        // Detectar nuevos productos (en idsNuevos pero no en productosActuales)
        const productosAgregados = idsNuevos.filter(id => !productosActualesSet.has(id));
        
        // Detectar productos eliminados
        const productosEliminados = productosActuales.filter(id => !idsNuevosSet.has(id));
        
        // Si hay cambios, actualizar el DOM
        if (productosAgregados.length > 0 || productosEliminados.length > 0) {
            console.log(`🔄 Cambios detectados: ${productosAgregados.length} agregados, ${productosEliminados.length} eliminados`);
            
            // Actualizar productos en memoria
            productosActuales = idsNuevos;
            
            // Re-renderizar todos los productos
            renderizarProductos(productosNuevos);
            
            // Mostrar notificación si hay productos nuevos
            if (productosAgregados.length > 0) {
                const cantidad = productosAgregados.length;
                mostrarMensaje(
                    `✨ ${cantidad} nuevo${cantidad > 1 ? 's' : ''} producto${cantidad > 1 ? 's' : ''} agregado${cantidad > 1 ? 's' : ''} al menú!`,
                    'info'
                );
                
                // Opcional: hacer scroll suave al catálogo para que vea los nuevos
                // document.getElementById('burger')?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        console.warn('Advertencia en verificación de productos:', error.message);
        // No mostrar alerta de error, solo registrar en consola
    }
}

// =====================================================
// FUNCIÓN AUXILIAR: DETECTAR CATEGORÍA
// =====================================================
function detectarCategoria(nombre) {
    const nameLower = nombre.toLowerCase();
    
    if (nameLower.includes('hamburguesa') || nameLower.includes('burger') || nameLower.includes('chesse')) {
        return 'hamburguesa';
    } else if (nameLower.includes('pizza')) {
        return 'pizza';
    } else if (nameLower.includes('pollo') || nameLower.includes('fried chicken')) {
        return 'pollo';
    } else if (nameLower.includes('papas') || nameLower.includes('fries')) {
        return 'papas';
    }
    
    return 'otro';
}

function renderizarProductos(productos) {
    // Limpiar secciones existentes de productos
    const burgersContainer = document.getElementById('burger');
    const otrosContainer = document.getElementById('otros-productos');
    
    if (!burgersContainer || !otrosContainer) return;
    
    // Mappear productos con estructura esperada
    const productosFormateados = productos.map(p => ({
        id_producto: p.id,
        nombre_producto: p.nombre,
        descripcion_producto: p.descripcion,
        precio_producto: p.precio,
        imagen_producto: p.imagen
    }));
    
    // NUEVO: Guardar lista de productos para búsquedas por categoría
    productosListadoActual = productosFormateados;
    
    // Separar productos por categoría
    const burgers = productosFormateados.filter(p => detectarCategoria(p.nombre_producto) === 'hamburguesa');
    const otros = productosFormateados.filter(p => detectarCategoria(p.nombre_producto) !== 'hamburguesa');
    
    // Renderizar hamburguesas en su contenedor
    const burgersHTML = burgers.map(p => crearCardProducto(p)).join('');
    const burgersRow = burgersContainer.querySelector('.row');
    if (burgersRow) {
        burgersRow.innerHTML = burgersHTML;
    }
    
    // Renderizar otros productos (pizzas, pollos, papas) en su contenedor
    const otrosHTML = otros.map(p => crearCardProducto(p)).join('');
    const otrosRow = otrosContainer.querySelector('.row');
    if (otrosRow) {
        otrosRow.innerHTML = otrosHTML;
    }
    
    // Agregar event listeners
    agregarEventListenersProductos();
    agregarEventListenersBotonesCategorias();  // ← NUEVO: Event listeners para botones "Order Now"
    actualizarContadorCarrito();
}

function crearCardProducto(producto) {
    const precioFormateado = formatearPrecio(producto.precio_producto);
    return `
        <div class="col-md-3 py-3 py-md-0">
            <div class="card producto" data-id="${producto.id_producto}" data-price="${producto.precio_producto}" data-name="${producto.nombre_producto}" data-image="${producto.imagen_producto || './images/default.png'}">
                <img src="${producto.imagen_producto || './images/default.png'}" alt="${producto.nombre_producto}">
                <div class="card-body">
                    <h3>${producto.nombre_producto}</h3>
                    <p>${producto.descripcion_producto || 'Delicioso y sabroso'}</p>
                    <h5>${precioFormateado} <span class="btn-product"><i class="fa-solid fa-basket-shopping"></i></span></h5>
                </div>
            </div>
        </div>
    `;
}

function agregarEventListenersProductos() {
    document.querySelectorAll('.btn-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const card = btn.closest('.card.producto');
            agregarAlCarrito(card);
        });
    });
    
    // También permitir click en toda la card
    document.querySelectorAll('.card.producto').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-product')) return;
            agregarAlCarrito(card);
        });
    });
}

// =====================================================
// EVENT LISTENERS PARA BOTONES DE CATEGORÍAS (Order Now)
// =====================================================
function agregarEventListenersBotonesCategorias() {
    document.querySelectorAll('.btn-orden-categoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const categoria = btn.getAttribute('data-categoria');
            agregarProductoPorCategoria(categoria);
        });
    });
}

// =====================================================
// AGREGAR PRODUCTO POR CATEGORÍA (Hamburguesa, Pizza, Pollo, etc)
// =====================================================
function agregarProductoPorCategoria(categoria) {
    // Buscar el primer producto que coincida con la categoría
    const producto = productosListadoActual.find(p => 
        detectarCategoria(p.nombre_producto) === categoria
    );
    
    if (!producto) {
        mostrarMensaje(`No hay ${categoria}s disponibles en este momento.`, 'warning');
        return;
    }
    
    // Crear card virtual para reutilizar agregarAlCarrito
    const cardVirtual = crearCardVirtual(producto);
    agregarAlCarrito(cardVirtual);
}

// Función auxiliar para crear un "card virtual" que simule la estructura HTML
function crearCardVirtual(producto) {
    const div = document.createElement('div');
    div.setAttribute('data-id', producto.id_producto);
    div.setAttribute('data-name', producto.nombre_producto);
    div.setAttribute('data-price', producto.precio_producto);
    div.setAttribute('data-image', producto.imagen_producto || './images/default.png');
    return div;
}

function agregarAlCarrito(card) {
    const id = card.getAttribute('data-id');
    const name = card.getAttribute('data-name');
    const price = parseFloat(card.getAttribute('data-price'));
    const image = card.getAttribute('data-image');
    
    const producto = {
        id_producto: id,
        nombre_producto: name,
        precio_producto: price,
        imagen_producto: image,
        cantidad: 1
    };
    
    let carrito = obtenerCarrito();
    const productoExistente = carrito.find(p => p.id_producto == id);
    
    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push(producto);
    }
    
    guardarCarrito(carrito);
    actualizarContadorCarrito();
    mostrarMensaje(`${name} agregado al carrito!`, 'success');
}

function obtenerCarrito() {
    const carrito = localStorage.getItem('carrito');
    return carrito ? JSON.parse(carrito) : [];
}

function guardarCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalProductos = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    const contadores = document.querySelectorAll('.contar-pro');
    contadores.forEach(contador => {
        contador.textContent = totalProductos;
    });
}

// =====================================================
// CARRITO (cart.html)
// =====================================================
function cargarCarrito() {
    const carrito = obtenerCarrito();
    const tbody = document.getElementById('carrito-items');
    
    if (!tbody) return;
    
    if (carrito.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">El carrito está vacío</td></tr>';
        actualizarResumenCarrito([]);
        return;
    }
    
    tbody.innerHTML = carrito.map((producto, index) => `
        <tr data-index="${index}">
            <td class="product-block">
                <a href="#" class="remove-from-cart-btn" data-index="${index}"><i class="fa-solid fa-x"></i></a>
                <img src="${producto.imagen_producto || './images/default.png'}" alt="">
                <a href="#" class="h6">${producto.nombre_producto}</a>
            </td>
            <td>    
                <p class="lead color-black">${formatearPrecio(producto.precio_producto)}</p>
            </td>
            <td>
                <div class="quantity quantity-wrap">
                    <div class="decrement" data-index="${index}"><i class="fa-solid fa-minus"></i></div>
                    <input type="text" name="quantity" value="${producto.cantidad}" maxlength="2" size="1" class="number" data-index="${index}" readonly>
                    <div class="increment" data-index="${index}"><i class="fa-solid fa-plus"></i></div>
                </div>
            </td>
            <td>
                <h6>${formatearPrecio(producto.precio_producto * producto.cantidad)}</h6>
            </td>
        </tr>
    `).join('');
    
    agregarEventListenersCarrito();
    actualizarResumenCarrito(carrito);
}

function agregarEventListenersCarrito() {
    // Eventos de incremento
    document.querySelectorAll('.increment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.getAttribute('data-index');
            modificarCantidad(index, 1);
        });
    });
    
    // Eventos de decremento
    document.querySelectorAll('.decrement').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = btn.getAttribute('data-index');
            modificarCantidad(index, -1);
        });
    });
    
    // Eventos de eliminar
    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const index = btn.getAttribute('data-index');
            eliminarDelCarrito(index);
        });
    });
}

function modificarCantidad(index, cantidad) {
    let carrito = obtenerCarrito();
    if (index >= 0 && index < carrito.length) {
        carrito[index].cantidad += cantidad;
        if (carrito[index].cantidad < 1) {
            carrito.splice(index, 1);
        }
        guardarCarrito(carrito);
        cargarCarrito();
    }
}

function eliminarDelCarrito(index) {
    let carrito = obtenerCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    cargarCarrito();
    actualizarContadorCarrito();
}

function actualizarResumenCarrito(carrito) {
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio_producto * p.cantidad), 0);
    const domicilio = VALOR_DOMICILIO;
    const descuento = 0; // Puedes agregar lógica de descuentos aquí
    const total = subtotal + domicilio - descuento;
    
    const subtotalEl = document.getElementById('subtotal-resumen');
    const domicilioEl = document.getElementById('domicilio-resumen');
    const descuentoEl = document.getElementById('descuento-resumen');
    const totalEl = document.getElementById('total-resumen');
    
    if (subtotalEl) subtotalEl.textContent = formatearPrecio(subtotal);
    if (domicilioEl) domicilioEl.textContent = formatearPrecio(domicilio);
    if (descuentoEl) descuentoEl.textContent = formatearPrecio(descuento);
    if (totalEl) totalEl.textContent = formatearPrecio(total);
}

// =====================================================
// CHECKOUT (checkout.html)
// =====================================================
function cargarCheckout() {
    const carrito = obtenerCarrito();
    
    if (carrito.length === 0) {
        mostrarMensaje('Tu carrito está vacío. Vuelve al inicio para agregar productos.', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    mostrarResumenCheckout(carrito);
    agregarEventListenersCheckout();
}

function mostrarResumenCheckout(carrito) {
    const container = document.getElementById('detalle-productos-checkout');
    if (!container) return;
    
    const subtotal = carrito.reduce((sum, p) => sum + (p.precio_producto * p.cantidad), 0);
    let aumento = 0;
    
    // Verificar si está seleccionado "contra entrega"
    const metodoContraEntrega = document.getElementById('cod');
    if (metodoContraEntrega && metodoContraEntrega.checked) {
        aumento = subtotal * AUMENTO_CONTRA_ENTREGA;
    }
    
    const domicilio = VALOR_DOMICILIO;
    const total = subtotal + domicilio + aumento;
    
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-24">
            <p class="lead color-black">SUBTOTAL</p>
            <p class="lead">${formatearPrecio(subtotal)}</p>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-24">
            <p class="lead color-black">VALOR DOMICILIO</p>
            <p class="lead">${formatearPrecio(domicilio)}</p>
        </div>
        ${aumento > 0 ? `
        <div class="d-flex justify-content-between align-items-center mb-24">
            <p class="lead color-black">AUMENTO (5% Contra Entrega)</p>
            <p class="lead">+${formatearPrecio(aumento)}</p>
        </div>
        ` : ''}
    `;
    
    const totalEl = document.getElementById('total-checkout');
    if (totalEl) totalEl.textContent = formatearPrecio(total);
}

function agregarEventListenersCheckout() {
    // Actualizar resumen cuando cambie método de pago
    document.querySelectorAll('input[name="metodo-pago"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const carrito = obtenerCarrito();
            mostrarResumenCheckout(carrito);
        });
    });
    
    // Manejar submit del formulario
    const form = document.getElementById('form-checkout');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            procesarCheckout();
        });
    }
}

async function procesarCheckout() {
    const nombres = document.getElementById('nombres-checkout')?.value;
    const apellidos = document.getElementById('apellidos-checkout')?.value;
    const email = document.getElementById('email-checkout')?.value;
    const celular = document.getElementById('celular-checkout')?.value;
    const direccion = document.getElementById('direccion-checkout')?.value;
    const direccion2 = document.getElementById('direccion2-checkout')?.value;
    const notas = document.getElementById('notas-checkout')?.value;
    const metodo_pago = document.querySelector('input[name="metodo-pago"]:checked')?.value;
    
    // Validar formulario
    if (!nombres || !apellidos || !email || !celular || !direccion) {
        mostrarMensaje('Por favor completa todos los campos requeridos.', 'error');
        return;
    }
    
    const carrito = obtenerCarrito();
    if (carrito.length === 0) {
        mostrarMensaje('Tu carrito está vacío.', 'error');
        return;
    }
    
    try {
        // 1. Crear cliente
        const clienteData = {
            nombre: nombres,
            apellido: apellidos,
            email: email,
            celular: celular,
            direccion: direccion,
            direccion2: direccion2 || '',
            descripcion: notas || ''
        };
        
        const clienteResponse = await fetch(`${API_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(clienteData)
        });
        
        if (!clienteResponse.ok) {
            const errorData = await clienteResponse.json();
            throw new Error(errorData.message || 'Error al crear cliente');
        }
        
        const clienteResult = await clienteResponse.json();
        const id_cliente = clienteResult.id;
        
        // 2. Calcular totales
        const subtotal = carrito.reduce((sum, p) => sum + (parseInt(p.precio_producto) * p.cantidad), 0);
        let aumento = 0;
        let metodo_pago_formateado = metodo_pago;
        
        if (metodo_pago === 'contra-entrega') {
            aumento = Math.round(subtotal * AUMENTO_CONTRA_ENTREGA);
            metodo_pago_formateado = 'Contra Entrega';
        } else if (metodo_pago === 'pse') {
            metodo_pago_formateado = 'PSE';
        } else if (metodo_pago === 'transferencia') {
            metodo_pago_formateado = 'Transferencia';
        }
        
        const descuento = 0; // Puedes agregar lógica de descuentos aquí
        
        // 3. Preparar datos del pedido
        const pedidoData = {
            id_cliente: id_cliente,
            descuento: descuento,
            metodo_pago: metodo_pago_formateado,
            aumento: aumento,
            productos: carrito.map(p => ({
                id_producto: parseInt(p.id_producto),
                precio: parseInt(p.precio_producto),
                cantidad: p.cantidad
            }))
        };
        
        // 4. Crear pedido
        const pedidoResponse = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pedidoData)
        });
        
        if (!pedidoResponse.ok) {
            const errorData = await pedidoResponse.json();
            throw new Error(errorData.message || 'Error al crear pedido');
        }
        
        // 5. Limpiar localStorage y redirigir
        localStorage.removeItem('carrito');
        mostrarMensaje('¡Pedido creado exitosamente!', 'success');
        
        setTimeout(() => {
            window.location.href = 'thankyou.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(`Error al procesar el pedido: ${error.message}`, 'error');
    }
}

// =====================================================
// UTILIDADES
// =====================================================
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
}

function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear alerta temporal
    const alertas = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };
    
    const container = document.querySelector('.container') || document.body;
    const alert = document.createElement('div');
    alert.className = `alert ${alertas[tipo]} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Determinar qué página está cargando
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html') || currentPage.endsWith('/')) {
        cargarProductos();
        
        // NUEVO: Habilitar botón hero "Order Now"
        const btnHeroOrder = document.getElementById('btn-hero-order');
        if (btnHeroOrder) {
            btnHeroOrder.addEventListener('click', (e) => {
                e.preventDefault();
                // Agregar la primera hamburguesa disponible
                agregarProductoPorCategoria('hamburguesa');
            });
        }
    } else if (currentPage.includes('cart.html')) {
        cargarCarrito();
        actualizarContadorCarrito();
    } else if (currentPage.includes('checkout.html')) {
        cargarCheckout();
        actualizarContadorCarrito();
    }
    
    // Actualizar contador en todas las páginas
    actualizarContadorCarrito();
});
