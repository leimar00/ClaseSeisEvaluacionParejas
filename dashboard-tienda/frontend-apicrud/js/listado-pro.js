let tablaProds = document.querySelector("#table-pro tbody");
const searchInputProds = document.querySelector("input[placeholder*='uscar']");
let prodsCache = [];

document.addEventListener("DOMContentLoaded", () => {
    getTableData();
    iniciarBuscaProductos();
});

// Función para iniciar búsqueda en tiempo real
const iniciarBuscaProductos = () => {
    if (!searchInputProds) return;
    searchInputProds.addEventListener("input", (e) => {
        const termino = e.target.value.toLowerCase();
        const filtrados = prodsCache.filter((p) =>
            p.nombre.toLowerCase().includes(termino) ||
            p.descripcion.toLowerCase().includes(termino) ||
            p.precio.toString().includes(termino)
        );
        renderTable(filtrados);
    });
};

let getTableData = async () => {
    let url = "http://localhost:3000/api/productos";
    try {
    let respuesta = await fetch(url, {
        method: "GET",
        headers: {
        "Content-Type": "application/json",
        },
    });

    if (respuesta.status === 204) {
        console.log("No hay datos en la BD");
        renderTable([]);
    } else {
        let tableData = await respuesta.json();
        console.log(tableData);

      // agregar los datos a LocalStorage (tabla completa)
        localStorage.setItem("datosTabla", JSON.stringify(tableData));
        prodsCache = tableData;

      // pintar tabla
        renderTable(tableData);
    }
    } catch (error) {
    console.log(error);
    }
};

function renderTable (tableData) {

    tablaProds.innerHTML = ""; 

  // guardar lo que se está mostrando (importantísimo para editar/eliminar)
    localStorage.setItem("datosTablaFiltrada", JSON.stringify(tableData));

    if (!tableData || tableData.length === 0) {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td colspan="7" class="text-center text-muted py-4">
            No hay productos para mostrar.
            </td>
        `;
        tableProds.appendChild(row);
        toggleActionsColumn();
        return;
    }


tableData.forEach((prod, i) => {
    let row = document.createElement("tr");

    row.innerHTML = ` 
        <td> ${i + 1} </td>
        <td> ${prod.nombre} </td>
        <td> ${prod.descripcion} </td>
        <td> ${prod.precio} </td>
        <td> ${prod.stock} </td>
        <td> <img src="${prod.imagen}" width="100px"></td>
        <td>
            <button onclick="editDataTable(${i})" type="button" class="btn btn-warning m-3"> Editar </button>
            <button class="btn btn-danger" onclick="deleteDataTable(${i})" type="button"> Eliminar </button>
        </td>
    `;

    tablaProds.appendChild(row);
    });
}

let editDataTable = (pos) => {

    let products = [];
    let productsSaved = JSON.parse(localStorage.getItem("datosTabla"));
    if (productsSaved != null) {
        products = productsSaved;
    }

    let singleProduct = products[pos];
    localStorage.setItem("productEdit", JSON.stringify(singleProduct));

    location.href =
    "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/crear-pro.html";
}; 

let deleteDataTable = (pos) => {

    let products = [];
    let productsSaved = JSON.parse(localStorage.getItem("datosTabla"));
    if (productsSaved != null) {
        products = productsSaved;
    }

    let singleProduct = products[pos];

    let IDProduct = {
    id: singleProduct.id,
    };

    let confirmar = confirm(`¿Deseas eliminar ${singleProduct.nombre} ?`);
    if (confirmar) {
        sendDeleteProduct(IDProduct);
    }
};

let sendDeleteProduct = async (id) => {
    let url = `http://localhost:3000/api/productos/${id.id}`;
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
        getTableData();
    }
    } catch (error) {
        console.log(error);
    }
};