let tablaClientes = document.querySelector("#tabla-clientes");
const searchInputClientes = document.querySelector("input[placeholder='Buscar Cliente']");
let clientesCache = [];

document.addEventListener("DOMContentLoaded", () => {
    getClientes();
    iniciarBuscaClientes();
});

// Función para iniciar búsqueda en tiempo real
const iniciarBuscaClientes = () => {
    if (!searchInputClientes) return;
    searchInputClientes.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = clientesCache.filter((c) =>
            c.nombre.toLowerCase().includes(termino) ||
            c.apellido.toLowerCase().includes(termino) ||
            c.email.toLowerCase().includes(termino) ||
            c.celular.toLowerCase().includes(termino)
        );
        mostrarClientes(filtrados);
    });
};

// Función para obtener los clientes desde la API
let getClientes = async () => {
    let url = "http://localhost:3000/api/clientes";
    try {
        let respuesta = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (respuesta.status === 200) {
            let datos = await respuesta.json();
            clientesCache = datos;
            mostrarClientes(datos);
        } else {
            alert("Error al obtener los clientes");
        }
    } catch (error) {
        console.log(error);
        alert("Error de conexión al servidor");
    }
};

// Función para mostrar/renderizar los clientes en la tabla
let mostrarClientes = (clientes) => {

    tablaClientes.innerHTML = ""; 

  // guardar lo que se está mostrando (importantísimo para editar/eliminar)
    localStorage.setItem("clientesTabla", JSON.stringify(clientes));

    if (!clientes || clientes.length === 0) {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="7" class="text-center text-muted py-4">
            No hay productos para mostrar.
            </td>
        `;
        tablaClientes.appendChild(row);
        return;
    }

    
    
    clientes.forEach((cliente,i) => {
        let row = document.createElement("tr");
        row.innerHTML = `
                <td>${i+1}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.apellido}</td>
                <td>${cliente.email}</td>
                <td>${cliente.celular}</td>
                <td>${cliente.direccion}</td>
                <td>
                    <button onclick="editClientTable(${i})" type="button" class="btn btn-warning m-3"> Editar </button>
                    <button class="btn btn-danger" onclick="deleteClientTable(${i})" type="button"> Eliminar </button>
                </td>
        `;

        tablaClientes.appendChild(row);
    });
};

function editClientTable (pos) {
    let clientes = [];
    let clientsSaved = JSON.parse(localStorage.getItem("clientesTabla"));
    if (clientsSaved != null) {
        clientes = clientsSaved;
    }

    let singleClient = clientes[pos];
    localStorage.setItem("clientEdit", JSON.stringify(singleClient));

    location.href =
    "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/crear-cliente.html";
}; 

function deleteClientTable(pos){

    let clientes = [];
    let clientesSaved = JSON.parse(localStorage.getItem("clientesTabla"));
    if (clientesSaved != null) {
        clientes = clientesSaved;
    }

    let singleClient = clientes[pos];

    let IDClient = {
    id: singleClient.id_cliente,
    };

    let confirmar = confirm(`¿Deseas eliminar ${singleClient.nombre} ?`);
    if (confirmar) {
        sendDeleteProduct(IDClient);
    }
};

async function sendDeleteProduct(id){
    let url = `http://localhost:3000/api/clientes/${id.id}`;
    try {
    let respuesta = await fetch(url, {
        method: "DELETE",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(id),
    });

    if (respuesta.status === 406) {
        alert("El ID enviado no fue admitido");
    } else {
        let mensaje = await respuesta.json();
        alert(mensaje.message);

      // recargar tabla sin recargar toda la página
        getClientes();
    }
    } catch (error) {
        console.log(error);
    }
};