const { registerProduct, updateProduct, deleteProduct, undeleteProduct, registerCategory, deleteCategory, registerVariation, updateVariation, deleteVariation, uploadImagem, generateToken } = require('./requestsNuvemShop');
const { returnValueFromJson } = require('./manageInfoUser');
const { returnInfo } = require('../envManager');

async function preparingPostProduct(product){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.codigo
            delete body.codigo
            await registerProduct(infosNuvem[0], infosNuvem[1], body, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateProduct(idproduct, product){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.codigo
            delete body.codigo
            await updateProduct(infosNuvem[0], infosNuvem[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteProduct(idHost, idproduct, product){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            delete product.codigo;
            product.published = false
            body = product
        })
        .then(async () => {
            await deleteProduct(infosNuvem[0], infosNuvem[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingUndeleteProduct(idHost, idproduct, product){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            delete product.codigo;
            product.published = true
            body = product
        })
        .then(async () => {
            await undeleteProduct(infosNuvem[0], infosNuvem[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


//


async function preparingPostCategory(category){
    return new Promise(async (resolve, reject) => {
        let infosNuvem;
        let body = {
            "name": category 
          }

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
        })
        .then(async () => {
            await registerCategory(infosNuvem[0], infosNuvem[1], body, 'category', category)
            .then((id) => {
                resolve(id ?? null)
            })
        }) 
    })  
}


async function preparingPostSubCategory(category, subcategory, category_id){
    return new Promise(async (resolve, reject) => {
        let infosNuvem;
        let body = {
                "name": subcategory,
                "parent": category_id
          }

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
        })
        .then(async () => {
            await registerCategory(infosNuvem[0], infosNuvem[1], body, 'subcategory', category)
            .then((id) => {
                resolve(id ?? null)
            })
        }) 
    })  
}


async function preparingPostVariation(variant, idProduct, idProductHost){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            body = variant
        })
        .then(async () => {
            delete body.codigo
            await registerVariation(infosNuvem[0], infosNuvem[1], body, idProduct, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateVariation(variant, idVariant, idProduct, idProductHost){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            body = variant
            delete body.codigo
        })
        .then(async () => {
            await updateVariation(infosNuvem[0], infosNuvem[1], body, idProduct, idVariant, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteVariation(idVariant, idProduct, idProductHost, grade){
    return new Promise(async (resolve, reject) => {
        let infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
        })
        .then(async () => {
            await deleteVariation(infosNuvem[0], infosNuvem[1], idProduct, idVariant, idProductHost, grade)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingUploadImage(image, idProductTray, idProductHost){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnHeaderandStoreID()
        .then(async (response) => {
            infosNuvem = response;
            body = {
                "Images":  {
                     "picture_source_1":image,
                 }
             }
        })
        .then(async () => {
            await uploadImage(infosNuvem[0], infosNuvem[1], body, idProductTray, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingGenerateToken(code){
    return new Promise(async (resolve, reject) => {
        let client_secret;
        let client_id;
        let body;

        await returnInfo('client_secret')
        .then(async (response) => {
            client_secret = response;
            client_id = await returnInfo('client_id')
        })
        .then(async () => {
            body = {
                "client_id": client_id,
                "client_secret": client_secret,
                "grant_type": "authorization_code",
                "code": code
            }
        }) 
        .then(async () => {
            await generateToken(body)
            .then(response => {
                resolve(response)
            })
        })
    })
}


async function returnHeaderandStoreID(){
    return new Promise(async (resolve, reject) => {
        let storeid, access_token, config;

        let cli_id = await returnInfo('client_id')
        await returnValueFromJson('tokennuvemshop')
        .then(async accessNuvem => {
            access_token = accessNuvem
            await returnValueFromJson('storeidnuvemshop')
            .then(async storeidNuvem => {
                storeid = storeidNuvem
            })
            .then(async () => {
                config = {
                    headers: {
                        'Authentication':`bearer ${access_token}`,
                        'User-Agent':`HostSync (${cli_id})`,
                        'Content-Type':'application/json'
                    }
                }   
            })
            .then(() => {
                resolve([storeid, config])
            })
        })

    })
}





module.exports = {
    preparingPostProduct,
    preparingUpdateProduct,
    preparingDeleteProduct,
    preparingUndeleteProduct,
    preparingPostCategory,
    preparingPostSubCategory,
    preparingPostVariation,
    preparingUpdateVariation,
    preparingDeleteVariation,
    preparingUploadImage,
    preparingGenerateToken
}