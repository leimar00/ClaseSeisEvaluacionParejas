/* ── Selectores ─────────────────────────────────────────── */
const tablaUsuarios = document.querySelector("#tabla-usuarios");
const searchInput = document.querySelector(".form-control[placeholder='Buscar Usuario']");

/* ── Estado interno ─────────────────────────────────────── */
let usuariosCache = [];

/* ── Inicialización ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    getUsuarios();
    iniciarBusca();
});

/* ─────────────────────────────────────────────────────────
 *  GET  /api/usuarios
 *  Carga todos los usuarios y los muestra en la tabla.
 * ───────────────────────────────────────────────────────── */
const getUsuarios = async () => {
    const url = "http://localhost:3000/api/usuarios";
    try {
        const respuesta = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (respuesta.status === 204) {
            usuariosCache = [];
            renderUsuarios([]);
            return;
        }

        if (!respuesta.ok) {
            alert(`Error del servidor: ${respuesta.status}`);
            return;
        }

        const datos = await respuesta.json();
        usuariosCache = datos;
        renderUsuarios(datos);
    } catch (error) {
        console.error("getUsuarios →", error);
        alert("Error de conexión al servidor");
    }
};

/* ─────────────────────────────────────────────────────────
 *  Renderiza los usuarios en la tabla HTML.
 *  Columnas: #, Usuario, Rol, Creado, Acciones
 * ───────────────────────────────────────────────────────── */
const renderUsuarios = (usuarios) => {
    tablaUsuarios.innerHTML = "";

    if (!usuarios || usuarios.length === 0) {
        tablaUsuarios.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No hay usuarios para mostrar.
                </td>
            </tr>`;
        return;
    }

    usuarios.forEach((usuario, i) => {
        const badgeClass = getBadgeRol(usuario.rol);
        const fechaFormateada = formatearFecha(usuario.creado_en);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${usuario.usuario}</td>
            <td>
                <span class="badge ${badgeClass}">
                    ${usuario.rol}
                </span>
            </td>
            <td>${fechaFormateada}</td>
            <td>
                <button onclick="editarUsuario(${usuario.id})" type="button" class="btn btn-warning btn-sm me-1" title="Editar usuario">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarUsuario(${usuario.id})" type="button" class="btn btn-danger btn-sm" title="Eliminar usuario">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaUsuarios.appendChild(row);
    });
};

/* ─────────────────────────────────────────────────────────
 *  Busca eventos en tiempo real
 * ───────────────────────────────────────────────────────── */
const iniciarBusca = () => {
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = usuariosCache.filter((u) =>
            u.usuario.toLowerCase().includes(termino) ||
            u.rol.toLowerCase().includes(termino)
        );
        renderUsuarios(filtrados);
    });
};

/* ─────────────────────────────────────────────────────────
 *  DELETE  /api/usuarios/:id
 *  Elimina un usuario.
 * ───────────────────────────────────────────────────────── */
const eliminarUsuario = async (idUsuario) => {
    if (!confirm("¿Está seguro de que desea eliminar este usuario?")) {
        return;
    }

    const url = `http://localhost:3000/api/usuarios/${idUsuario}`;
    try {
        const respuesta = await fetch(url, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });

        if (!respuesta.ok) {
            alert(`Error al eliminar: ${respuesta.status}`);
            return;
        }

        const mensaje = await respuesta.json();
        alert(mensaje.message ?? "Usuario eliminado con éxito");
        
        // Actualizar cache local
        usuariosCache = usuariosCache.filter(u => u.id !== idUsuario);
        renderUsuarios(usuariosCache);
    } catch (error) {
        console.error("eliminarUsuario →", error);
        alert("Error al eliminar usuario");
    }
};

/* ─────────────────────────────────────────────────────────
 *  Llevar a página de edición/editar usuario
 * ───────────────────────────────────────────────────────── */
const editarUsuario = (idUsuario) => {
    const usuario = usuariosCache.find(u => u.id === idUsuario);
    if (!usuario) {
        alert("Usuario no encontrado");
        return;
    }

    // Guardar en localStorage para acceso desde crear-usuario.html
    localStorage.setItem("usuarioEditar", JSON.stringify(usuario));
    
    // Redirigir a página de edición
    window.location.href = "crear-usuario.html?edit=" + idUsuario;
};

/* ─────────────────────────────────────────────────────────
 *  Utilidades: Clases de badges por rol
 * ───────────────────────────────────────────────────────── */
const getBadgeRol = (rol) => {
    const clases = {
        administrador: "bg-danger",
        vendedor: "bg-warning text-dark",
        cajero: "bg-info",
    };
    return clases[rol] ?? "bg-secondary";
};

/* ─────────────────────────────────────────────────────────
 *  Utilidades: Formato de fecha ISO a dd/mm/yyyy
 * ───────────────────────────────────────────────────────── */
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
