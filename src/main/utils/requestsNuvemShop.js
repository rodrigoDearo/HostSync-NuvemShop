const axios = require('axios');
const { succesHandlingRequests, errorHandlingRequest, } = require('./auxFunctions');


function registerProduct(store_id, header, body, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body, header)
        .then(async (answer) => {
            await succesHandlingRequests('product', 'post', idHost, answer.data.id, answer.data.variants[0].id)
        })
        .catch(async (error) => {
            console.log(error)
            await errorHandlingRequest('product', 'POST', idHost, null, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateProduct(store_id, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'update', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(store_id, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async () => {
            await succesHandlingRequests('product', 'delete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(store_id, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async (response) => {
            await succesHandlingRequests('product', 'undelete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'UNDELETE', idHost, idproduct, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


// ---------------------------------------------------------------------


function registerCategory(store_id, header, body, type, category){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/categories`, body, header)
        .then(async (answer) => {
            if(answer.data.id){
                await succesHandlingRequests(type, 'post', body.name, answer.data.id, [body.name, category])
                .then(async () => {
                    resolve(answer.data.id)
                })
            }else{
                await errorHandlingRequest(type, 'POST', body.name, null, error.response.data, body)
                .then(() => {
                    resolve()
                })
            }
            
        })
        .catch(async (error) => {
            await errorHandlingRequest(type, 'POST', body.name, null, error.response.data, body)
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
            await errorHandlingRequest('category', 'DELETE', idHost, idcustomer, error.response.data, null)
        })
        .finally(() => {
            resolve()
        })    
    })
}*/


// ---------------------------------------------------------------------


function registerVariation(store_id, body, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async (answer) => {
            await succesHandlingRequests('variation', 'post', idProductHost, answer.data.id, [body.Variant.value_1])
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'POST', idProductHost, null, error.response.data, body)
            .then(() => {
                resolve()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateVariation(store_id, body, idVariant, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async() => {
            await succesHandlingRequests('variation', 'update', idProductHost, idVariant, [body.Variant.value_1])
        })
        .catch(async (error) => {
            if(error.response.data==undefined){
                await errorHandlingRequest('variation', 'PUT', idProductHost, idVariant, error.response.data, body)
            }else
            if(error.response.data[0]=="Invalid parameter id."){
                await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [body.Variant.value_1])
            }else{
                await errorHandlingRequest('variation', 'PUT', idProductHost, idVariant, error.response.data, body)
            }
            
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteVariation(store_id, idVariant, idProductHost, nameVariant){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.nuvemshop.com.br/v1/${store_id}/products`)
        .then(async () => {
            await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
        })
        .catch(async (error) => {
            if(error.response.data==undefined){
                await errorHandlingRequest('variation', 'DELETE', idProductHost, idVariant, error.response.data, null)
            }else
            if(error.response.data[0]=="Invalid parameter id."){
                await succesHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
            }else{
                await errorHandlingRequest('variation', 'DELETE', idProductHost, idVariant, error.response.data, null)
            }
            
        })
        .finally(() => {
            resolve()
        })    
    })
}


function uploadImage(store_id, body, idProductTray, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body)
        .then(async (answer) => {
            await succesHandlingRequests('image', 'post', idProductHost, null, null)
        })
        .catch(async (error) => {
            console.log(`${url}/products/${idProductTray}/images/?access_token=${access_token}`)
            console.log(body)

            await errorHandlingRequest('image', 'POST', idProductHost, null, error.response.data, body)
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


function generateToken(body){
    return new Promise(async (resolve, reject) => {
        let success;

        await axios.post('https://www.nuvemshop.com.br/apps/authorize/token', body, {
            'User-Agent': `HostSync (${body.client_id})`, 
            'Content-Type': 'application/json'
          })
        .then(async (answer) => {
           if(answer.data.access_token){
            success = true
            await succesHandlingRequests('token', 'post', null, null, [
                answer.data.access_token,
                answer.data.user_id,
                body.code
            ])
           }
           else{
            success = false
            await errorHandlingRequest('token', 'POST', 1, 1, answer.data.error_description, body.code)
           }
           
        })
        .catch(async () => {
            resolve(false)
        })
        .finally(() => {
            resolve(success)
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
    generateToken
}