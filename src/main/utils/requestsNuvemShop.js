const axios = require('axios');
const { successHandlingRequests, errorHandlingRequest, saveNewUniqueIdInProduct } = require('./auxFunctions');


function registerProduct(store_id, header, body, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, body, header)
        .then(async (answer) => {
            await successHandlingRequests('product', 'post', idHost, answer.data.id, answer.data.variants[0].id)
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


function putVariantsInProduct(store_id, header, body, idproduct, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}/variants/`, body, header)
        .then(async(answer) => {
            resolve(answer.data[0].id)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idProductHost, idproduct, error.response.data, body)
            .then(() => {
                reject()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}


function updateProduct(store_id, header, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}`, body, header)
        .then(async (response) => {
            await successHandlingRequests('product', 'update', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'PUT', idHost, idproduct, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function deleteProduct(store_id, header, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}`, body, header)
        .then(async () => {
            await successHandlingRequests('product', 'delete', idHost, idproduct, null)
        })
        .catch(async (error) => {
            await errorHandlingRequest('product', 'DELETE', idHost, idproduct, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}


function undeleteProduct(store_id, header, body, idproduct, idHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}`, body, header)
        .then(async (response) => {
            await successHandlingRequests('product', 'undelete', idHost, idproduct, null)
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
                await successHandlingRequests(type, 'post', body.name, answer.data.id, [body.name, category])
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
            await successHandlingRequests('category', 'delete', idHost, idcustomer)
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


function getVariants(store_id, header, idproduct, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.get(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}/variants`, header)
        .then(async (answer) => {
                resolve(answer.data)
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'GET', idProductHost, null, error.response.data, null)
            .then(() => {
                reject()
            })
        })
        .finally(() => {
            resolve()
        })    
    })
}


function registerVariation(store_id, header, body, idproduct, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}/variants`, body, header)
        .then(async (answer) => {
            await successHandlingRequests('variation', 'post', idProductHost, answer.data.id, [body.values[0].pt])
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


function updateVariation(store_id, header, body, idproduct, idVariant, idProductHost){
    return new Promise(async (resolve, reject) => {
        await axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}/variants/${idVariant}`, body, header)
        .then(async() => {
            if(body.values){
                await successHandlingRequests('variation', 'update', idProductHost, idVariant, [body.values[0].pt])
            }else{
                await successHandlingRequests('product', 'update', idProductHost, idproduct, null)
            }
            
        })
        .catch(async (error) => {
            await errorHandlingRequest('variation', 'PUT', idProductHost, idVariant, error.response.data, body)
        })
        .finally(() => {
            resolve()
        })    
    })
}



function deleteVariation(store_id, header, idproduct, idVariant, idProductHost, nameVariant){
    return new Promise(async (resolve, reject) => {
        await axios.delete(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idproduct}/variants/${idVariant}`, header)
        .then(async () => {
            await successHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
        })
        .catch(async (error) => {
            if(error.response.data.description=="The last variant of a product cannot be deleted."){
                await updateProduct(store_id, header, {"attributes": ["","",""]}, idproduct, idProductHost)
                .then(async () => {
                    await getVariants(store_id, header, idproduct, idProductHost)
                    .then(async (response) => {
                        response[0].values = []
                        let bodyPutVariants = response
                        await putVariantsInProduct(store_id, header, bodyPutVariants, idproduct, idProductHost)
                        .then(async (response) => {
                            await saveNewUniqueIdInProduct(idProductHost, response)
                        })
                    })
                    .then(() => {

                    })
                })
                .then(async () => {
                    await successHandlingRequests('variation', 'delete', idProductHost, idVariant, [nameVariant])
                })
                .catch(async () => {
                    await errorHandlingRequest('variation', 'DELETE', idProductHost, idVariant, error.response.data, null)
                    resolve()
                })
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
            await successHandlingRequests('image', 'post', idProductHost, null, null)
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
            await successHandlingRequests('token', 'post', null, null, [
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