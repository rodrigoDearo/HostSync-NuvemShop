const axios = require('axios');
const { succesHandlingRequests, errorHandlingRequest, } = require('./auxFunctions');


function registerProduct(url, access_token, body, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/products?access_token=${access_token}`, body)
        .then(async (answer) => {
            await succesHandlingRequests('product', 'post', idHost, answer.data.id, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'POST', idHost, null, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'update', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async () => {
            await succesHandlingRequests('product', 'delete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(url, access_token, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/${idproduct}?access_token=${access_token}`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'undelete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'UNDELETE', idHost, idproduct, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function registerCategory(url, access_token, body, type, category){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/categories?access_token=${access_token}`, body)
        .then(async (answer) => {
            await succesHandlingRequests(type, 'post', body.Category.name, answer.data.id, [body.Category.name, category])
            .then(async () => {
                resolve(answer.data.id)
            })
        })
        .catch(async (error) => {
            await errorHandlingRequest(type, 'POST', body.Category.name, null, error.response.data.causes, body)
            .then(() => {
                resolve()
            })
        })  
    })
}

/* VER DEPOIS
function deleteCategory(header, idcustomer, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`${url}/categories/:id`, header)
        .then(async () => {
            await succesHandlingRequests('category', 'delete', idHost, idcustomer)
        })
        .catch(async (error) => {
            await errorHandlingRequest('category', 'DELETE', idHost, idcustomer, error.response.data.causes, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}*/


// ---------------------------------------------------------------------


function registerVariation(url, access_token, body, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/products/variants/?access_token=${access_token}`, body)
        .then(async (answer) => {
            await succesHandlingRequests('variation', 'post', idProductHost, answer.data.id, [body.Variant.value_1])
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'POST', idProductHost, null, error.response.data.causes, body)
            .then(() => {
                resolve()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateVariation(url, access_token, body, idVariant, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`${url}/products/variants/${idVariant}?access_token=${access_token}`, body)
        .then(async() => {
            await succesHandlingRequests('variation', 'update', idProductHost, idVariant, [body.Variant.value_1])
        })
        .catch(async (error) => {
            if(error.response.data.causes==undefined){
                await errorHandlingRequest('variation', 'PUT', idProductHost, idVariant, error.response.data.causes, body)
            }else
            if(error.response.data.causes[0]=="Invalid parameter id."){
                await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [body.Variant.value_1])
            }else{
                await errorHandlingRequest('variation', 'PUT', idProductHost, idVariant, error.response.data.causes, body)
            }
            
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteVariation(url, access_token, idVariant, idProductHost, nameVariant){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`${url}/products/variants/${idVariant}?access_token=${access_token}`)
        .then(async () => {
            await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
        })
        .catch(async (error) => {
            if(error.response.data.causes==undefined){
                await errorHandlingRequest('variation', 'DELETE', idProductHost, idVariant, error.response.data.causes, null)
            }else
            if(error.response.data.causes[0]=="Invalid parameter id."){
                await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
            }else{
                await errorHandlingRequest('variation', 'DELETE', idProductHost, idVariant, error.response.data.causes, null)
            }
            
        })
        .finally(() => {
            resolve()
        })    
    })
}


function uploadImage(url, access_token, body, idProductTray, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/products/${idProductTray}/images/?access_token=${access_token}`, body)
        .then(async (answer) => {
            await succesHandlingRequests('image', 'post', idProductHost, null, null)
        })
        .catch(async (error) => {
            console.log(`${url}/products/${idProductTray}/images/?access_token=${access_token}`)
            console.log(body)

            await errorHandlingRequest('image', 'POST', idProductHost, null, error.response.data.causes, body)
            .then(() => {
                resolve()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}

// ---------------------------------------------------------------------


function generateToken(url, body){
    return new Promise(async (resolve, reject) => {
        await axios.post(`${url}/auth`, body)
        .then(async (answer) => {
            await succesHandlingRequests('token', 'post', null, null, [
                answer.data.access_token,
                answer.data.refresh_token
            ])
        })
        .catch(async (error) => {
            await errorHandlingRequest('token', 'POST', 1, 1, error.response.data.causes, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateToken(url, refresh_token){
    return new Promise(async (resolve, reject) => {
        await axios.get(`${url}/auth?refresh_token=${refresh_token}`)
        .then(async (answer) => {
            await succesHandlingRequests('token', 'get', null, null, [answer.data.access_token])
        })
        .catch(async (error) => {
            await errorHandlingRequest('token', 'GET', 1, 1, error.response.data.causes, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}


module.exports = { 
    registerProduct,
    updateProduct,
    deleteProduct,
    undeleteProduct,
    registerCategory,
    //deleteCategory,
    registerVariation,
    updateVariation,
    deleteVariation,
    uploadImage,
    generateToken,
    updateToken,
}