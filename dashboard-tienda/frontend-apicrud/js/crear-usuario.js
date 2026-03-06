/* ── Selectores ─────────────────────────────────────────── */
const formularioUsuario = document.querySelector("#formulario-usuario");
const rolInput = document.querySelector("#rol");
const usuarioInput = document.querySelector("#usuario");
const contrasenaInput = document.querySelector("#contrasena");
const confirmarContrasenaInput = document.querySelector("#confirmar_contrasena");
const botonSubmit = formularioUsuario?.querySelector("button[type='submit']");

/* ── Estado interno ─────────────────────────────────────── */
let usuarioEnEdicion = null;
const urlParams = new URLSearchParams(window.location.search);
const editMode = urlParams.has("edit");

/* ── Inicialización ─────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
    if (editMode) {
        cargarDatosEdicion();
    }
    formularioUsuario?.addEventListener("submit", handleSubmitFormulario);
});

/* ─────────────────────────────────────────────────────────
 *  Cargar datos si estamos en modo edición
 * ───────────────────────────────────────────────────────── */
const cargarDatosEdicion = () => {
    const datosGuardados = localStorage.getItem("usuarioEditar");
    if (!datosGuardados) {
        console.warn("No hay datos de usuario para editar");
        return;
    }

    usuarioEnEdicion = JSON.parse(datosGuardados);
    
    // Rellenar formulario con datos existentes
    rolInput.value = usuarioEnEdicion.rol;
    usuarioInput.value = usuarioEnEdicion.usuario;
    
    // En modo edición, la contraseña es opcional
    contrasenaInput.placeholder = "Dejar en blanco para mantener la actual";
    confirmarContrasenaInput.placeholder = "Dejar en blanco para mantener la actual";
    
    // Cambiar título y botón
    document.querySelector(".h3.mb-0.text-gray-800").textContent = "Editar Usuario";
    botonSubmit.textContent = "Actualizar Usuario";
    
    // Limpiar localStorage
    localStorage.removeItem("usuarioEditar");
};

/* ─────────────────────────────────────────────────────────
 *  POST /api/usuarios o PUT /api/usuarios/:id
 *  Maneja el envío del formulario
 * ───────────────────────────────────────────────────────── */
const handleSubmitFormulario = async (e) => {
    e.preventDefault();

    // Obtener valores
    const rol = rolInput.value.trim();
    const usuario = usuarioInput.value.trim();
    const contrasena = contrasenaInput.value.trim();
    const confirmarContrasena = confirmarContrasenaInput.value.trim();

    // Validar campos requeridos
    if (!rol || rol === "Seleccionar Rol") {
        alert("Por favor selecciona un rol");
        return;
    }

    if (!usuario) {
        alert("Por favor ingresa un nombre de usuario");
        return;
    }

    // En modo creación, contraseña es requerida
    // En modo edición, es opcional
    if (!editMode) {
        if (!contrasena) {
            alert("Por favor ingresa una contraseña");
            return;
        }

        if (contrasena.length < 6) {
            alert("La contraseña debe tener mínimo 6 caracteres");
            return;
        }
    } else {
        // En edición, si se proporciona contraseña, debe tener 6+ caracteres
        if (contrasena && contrasena.length < 6) {
            alert("La contraseña debe tener mínimo 6 caracteres");
            return;
        }
    }

    // Validar coincidencia de contraseñas (solo si se ingresa contraseña)
    if (contrasena || confirmarContrasena) {
        if (contrasena !== confirmarContrasena) {
            alert("Las contraseñas no coinciden");
            return;
        }
    }

    // Preparar payload
    const payload = {
        rol,
        usuario,
    };

    // Si hay contraseña, incluirla
    if (contrasena) {
        payload.contrasena = contrasena;
    }

    // Realizar solicitud
    if (editMode) {
        await actualizarUsuario(usuarioEnEdicion.id, payload);
    } else {
        await crearUsuario(payload);
    }
};

/* ─────────────────────────────────────────────────────────
 *  POST /api/usuarios
 *  Crea un nuevo usuario
 * ───────────────────────────────────────────────────────── */
const crearUsuario = async (payload) => {
    const url = "http://localhost:3000/api/usuarios";
    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (respuesta.status === 409) {
            alert("El usuario ya existe");
            return;
        }

        if (!respuesta.ok) {
            const error = await respuesta.json();
            alert(`Error: ${error.message}`);
            return;
        }

        const resultado = await respuesta.json();
        alert(resultado.message ?? "Usuario creado con éxito");
        
        // Limpiar formulario
        formularioUsuario.reset();
        
        // Redirigir a listado después de 1 segundo
        setTimeout(() => {
            window.location.href = "listado-usuarios.html";
        }, 1000);
    } catch (error) {
        console.error("crearUsuario →", error);
        alert("Error al crear usuario");
    }
};

/* ─────────────────────────────────────────────────────────
 *  PUT /api/usuarios/:id
 *  Actualiza un usuario existente
 * ───────────────────────────────────────────────────────── */
const actualizarUsuario = async (idUsuario, payload) => {
    const url = `http://localhost:3000/api/usuarios/${idUsuario}`;
    try {
        const respuesta = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!respuesta.ok) {
            const error = await respuesta.json();
            alert(`Error: ${error.message}`);
            return;
        }

        const resultado = await respuesta.json();
        alert(resultado.message ?? "Usuario actualizado con éxito");
        
        // Redirigir a listado
        setTimeout(() => {
            window.location.href = "listado-usuarios.html";
        }, 1000);
    } catch (error) {
        console.error("actualizarUsuario →", error);
        alert("Error al actualizar usuario");
    }
};
