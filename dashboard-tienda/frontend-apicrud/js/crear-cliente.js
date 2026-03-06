// Selectores del DOM para los inputs del formulario de clientes
let nombreInput = document.querySelector("#nombre-cli");
let apellidoInput = document.querySelector("#apellido-cli");
let emailInput = document.querySelector("#email-cli");
let celularInput = document.querySelector("#celular-cli");
let direccionInput = document.querySelector("#direccion-cli");
let direccion2Input = document.querySelector("#direccion2-cli");
let descNotas = document.querySelector("#descripcion-cli");
let btnCreate = document.querySelector(".btn-create");
let clientUpdate;

document.addEventListener("DOMContentLoaded", () => {
    // Obtener datos de cliente a editar desde localStorage
    clientUpdate = JSON.parse(localStorage.getItem("clientEdit"));
    console.log(clientUpdate);
    if(clientUpdate != null){
        updateDataClient();
    } else {
        // Limpiar formulario si no hay datos de edición
        limpiarFormulario();
    }
});

// Función para limpiar el formulario
let limpiarFormulario = () => {
    nombreInput.value = "";
    apellidoInput.value = "";
    emailInput.value = "";
    celularInput.value = "";
    direccionInput.value = "";
    direccion2Input.value = "";
    descNotas.value = "";
    // Asegurar que localStorage esté limpio
    localStorage.removeItem("clientEdit");
};

btnCreate.addEventListener("click", ()=>{
    let dataClient = getDataClient();
    if(dataClient) {
        sendDataClient(dataClient);
    }
});

// Función para validar el formulario y obtener los datos del cliente
let getDataClient = () => {
    let client;

    if(nombreInput.value && apellidoInput.value && emailInput.value && celularInput.value && direccionInput.value){
        client = {
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            email: emailInput.value,
            celular: celularInput.value,
            direccion: direccionInput.value,
            direccion2: direccion2Input.value,
            descNotas: descNotas.value,
        }
        // Limpiar los campos del formulario después de obtener los datos
        nombreInput.value = "";
        apellidoInput.value = "";
        emailInput.value = "";
        celularInput.value = "";
        direccionInput.value = "";
        direccion2Input.value = "";
        descNotas.value="";
        console.log(client);

    }else{
        alert("Todos los campos son obligatorios");
        return null;
    }
    return client;
};

// Función para enviar datos del nuevo cliente al servidor (POST)
// API endpoint: POST http://localhost:3000/api/clientes
let sendDataClient = async (data) => {
    let url = "http://localhost:3000/api/clientes";
    try {
        let respuesta = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if(respuesta.status === 406){
            alert("Los datos enviados no son admitidos");
        }else{
            let mensaje = await respuesta.json();
            alert(mensaje.message);
            location.href = "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/listado-clientes.html";
        }

    } catch (error) {
        console.log(error);
        alert("Error al crear el cliente");
    }
};

// Función para cargar datos del cliente a editar en los campos del formulario
let updateDataClient = () => {
    // Agregar datos a editar en los campos del formulario
    nombreInput.value = clientUpdate.nombre;
    apellidoInput.value = clientUpdate.apellido;
    emailInput.value = clientUpdate.email;
    celularInput.value = clientUpdate.celular;
    direccionInput.value = clientUpdate.direccion;
    direccion2Input.value = clientUpdate.direccion2;
    descNotas.value = clientUpdate.descripcion;
    
    let client;
    // Alternar el botón de crear y editar
    let btnEdit = document.querySelector(".btn-update");
    btnCreate.classList.toggle("d-none");
    btnEdit.classList.toggle("d-none");
    
    localStorage.removeItem("clientEdit");

    // Agregar evento al botón editar
    btnEdit.addEventListener("click", ()=> {
        client = {
            nombre: nombreInput.value,
            apellido: apellidoInput.value,
            email: emailInput.value,
            celular: celularInput.value,
            direccion: direccionInput.value,
            direccion2 : direccion2Input.value,
            descripcion : descNotas.value
        }
        // Borrar info de localStorage
        
        // Pasar los datos del cliente a la función de actualización
        sendUpdateClient(client);
    });
};

// Función para realizar la petición al servidor para editar el cliente (PUT)
// API endpoint: PUT http://localhost:3000/api/clientes/{id}
let sendUpdateClient = async (client) => {
    let url = `http://localhost:3000/api/clientes/${clientUpdate.id_cliente}`;
    try {
        let respuesta = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(client)
        });

        if(respuesta.status === 406){
            alert("Los datos enviados no son admitidos");
        }else{
            let mensaje = await respuesta.json();
            alert(mensaje.message);
            // Limpiar localStorage antes de redirigir
            localStorage.removeItem("clientEdit");
            location.href = "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/listado-clientes.html";
        }

    } catch (error) {
        console.log(error);
        alert("Error al actualizar el cliente");
    }
};
