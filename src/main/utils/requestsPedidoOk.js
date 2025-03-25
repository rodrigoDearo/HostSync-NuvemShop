const axios = require('axios');
const { succesHandlingRequests, errorHandlingRequest, } = require('./auxFunctions')

function postProduct(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/produtos/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('product', 'post', body.codigo, answer.data.produto.id)
        })
        .catch(async (error) => {
            if(error.response.data.erros[0].codigo==24){
                reject({code:24})
            }
            else{
                await errorHandlingRequest('product', 'POST', body.codigo, null, error.response.data.erros, body)
            }
        })
        .finally(() => {
            resolve()
        })    
    })
}


function patchProduct(body, header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.patch(`https://api.pedidook.com.br/v1/produtos/${idproduct}`, body, header)
        .then(async (response) => {
            await succesHandlingRequests('product', 'update', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data.erros, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.pedidook.com.br/v1/produtos/${idproduct}`, header)
        .then(async () => {
            await succesHandlingRequests('product', 'delete', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(header, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.patch(`https://api.pedidook.com.br/v1/produtos/${idproduct}/undelete`, '', header)
        .then(async (response) => {
            await succesHandlingRequests('product', 'undelete', idHost, idproduct)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'UNDELETE', idHost, idproduct, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function postCustomer(body, header){
    return new Promise(async (resolve, reject) => {
        await axios.post('https://api.pedidook.com.br/v1/clientes/', body, header)
        .then(async (answer) => {
            await succesHandlingRequests('customer', 'post', body.codigo, answer.data.cliente.id)
        })
        .catch(async (error) => {
            if(error.response.data.erros[0].codigo==24){
                reject({code:24})
            }
            else{
                await errorHandlingRequest('customer', 'POST', body.codigo, null, error.response.data.erros, body)
                .then(() => {
                    resolve()
                })
            }
        })
        .finally(() => {
            resolve()
        })    
    })
}


function patchCustomer(body, header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, body, header)
        .then(async() => {
            await succesHandlingRequests('customer', 'put', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('customer', 'PUT', idHost, idcustomer, error.response.data.erros, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteCustomer(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.pedidook.com.br/v1/clientes/${idcustomer}`, header)
        .then(async () => {
            await succesHandlingRequests('customer', 'delete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('customer', 'DELETE', idHost, idcustomer, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteCustomer(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.patch(`https://api.pedidook.com.br/v1/clientes/${idcustomer}/undelete`, '', header)
        .then(async (response) => {
            await succesHandlingRequests('customer', 'undelete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('customer', 'UNDELETE', idHost, idcustomer, error.response.data.erros, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function getSales(dateTime, page, header){
    return new Promise(async (resolve, reject) => {
        await axios.get(`https://api.pedidook.com.br/v1/pedidos/?alterado_apos=${dateTime}&pagina=${page}&excluido=false`, header)
        .then((response) => {
            resolve([response.data.pedidos, response.data.href_proxima_pagina])
        })
        .catch(async (error) => {
            await errorHandlingRequest('sale', 'GET', 0, 0, error.response.data.erros, null)
        })
        .finally(() => {

        })    
    })
}



module.exports = {
    postProduct,
    patchProduct,
    deleteProduct,
    undeleteProduct,
    postCustomer,
    patchCustomer,
    deleteCustomer,
    undeleteCustomer,
    getSales
}