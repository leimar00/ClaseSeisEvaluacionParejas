let nameInput = document.querySelector("#productos-select");
let priceInput = document.querySelector("#precio-pro");
let stockInput = document.querySelector("#stock-pro");
let descripcionInput = document.querySelector("#desc-pro");
let imagen = document.querySelector("#imagen-pro");
let btnCreate = document.querySelector(".btn-create");
let productUpdate

document.addEventListener("DOMContentLoaded", () => {
    productUpdate = JSON.parse(localStorage.getItem("productEdit"));
    console.log(productUpdate);
    if(productUpdate != null){
        updateDataProduct();
    }

});

btnCreate.addEventListener("click", ()=>{
    //alert( "producto: "+nameInput.value);
    let dataProduct = getDataProduct();
    sendDataProduct(dataProduct);
});

// funcion para validar el formulario y
// obtener los datos del formulario

let getDataProduct = () => {
    //validar formulario
    let product;

    if(nameInput.value && priceInput.value && stockInput.value && descripcionInput.value && imagen.src){
        product = {
            nombre: nameInput.value,
            descripcion: descripcionInput.value,
            precio : priceInput.value,
            stock : stockInput.value,
            imagen : imagen.src
        }
        descripcionInput.value = "";
        priceInput.value = "";
        stockInput.value = "";
        imagen.src ="https://m.media-amazon.com/images/I/61XV8PihCwL._SY250_.jpg";
        console.log(product);

    }else{
        alert("Todos los campos son  obligatorios")
    }
    return product;
};


let sendDataProduct = async (data) => {

    let url = "http://localhost:3000/api/productos";
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
        location.href = "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/listado-pro.html";
    }
    

    } catch (error) {
        console.log(error);
    }
};


//funcion para editar el producto
let updateDataProduct = () => {
    // agregar datos a editar en los campos del formulario
    nameInput.value = productUpdate.nombre;
    priceInput.value = productUpdate.precio;
    stockInput.value = productUpdate.stock;
    descripcionInput.value = productUpdate.descripcion;
    imagen.src = productUpdate.imagen;
    let product;
    // alternar el boton de crear y editar
    let btnEdit = document.querySelector(".btn-update");
    btnCreate.classList.toggle("d-none");
    btnEdit.classList.toggle("d-none");
    // agregar evento al boton editar
    btnEdit.addEventListener("click", ()=> {
        product = {
            nombre: nameInput.value,
            descripcion: descripcionInput.value,
            precio : priceInput.value,
            stock : stockInput.value,
            imagen : imagen.src
        }
        // borrar info de localStorage
        localStorage.removeItem("productEdit");
        // pasar los datos del producto a la funcion
        sendUpdateProduct(product);

    });
};

// funcion para realizar la peticion al servidor
let sendUpdateProduct = async ( pro ) => {
    let url = `http://localhost:3000/api/productos/${productUpdate.id}`;
    try {

        let respuesta = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(pro)
        
    });


    if(respuesta.status === 406){
        alert("Los datos enviados no son admitidos");

    }else{
        let mensaje = await respuesta.json();
        alert(mensaje.message);
        location.href = "http://127.0.0.1:5500/ClaseSeisEvaluacionParejas/dashboard-tienda/frontend-apicrud/listado-pro.html";
    }
    

    } catch (error) {
        console.log(error);
    }
}