const { registerProduct, updateProduct, deleteProduct, undeleteProduct, registerCategory, deleteCategory, registerVariation, updateVariation, deleteVariation, uploadImagem, generateToken } = require('./requestsNuvemShop');
const { returnValueFromJson } = require('./manageInfoUser');
const { returnInfo } = require('../envManager');

async function preparingPostProduct(product){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await registerProduct(infosNuvem[0], infosNuvem[1], body, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await updateProduct(infosNuvem[0], infosNuvem[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await deleteProduct(infosNuvem[0], infosNuvem[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingUndeleteProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
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
            "Category": {
                "name": category
              }
          }

        await returnStoreIdandAccessToken()
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
            "Category": {
                "name": subcategory,
                "parent_id": category_id
              }
          }

        await returnStoreIdandAccessToken()
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


async function preparingPostVariation(variant){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = variant
        })
        .then(async () => {
            let idProductHost = body.Variant.codigo
            delete body.Variant.codigo
            await registerVariation(infosNuvem[0], infosNuvem[1], body, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateVariation(variant, idVariant){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
            body = variant
        })
        .then(async () => {
            let idProductHost = body.Variant.codigo
            delete body.Variant.codigo
            await updateVariation(infosNuvem[0], infosNuvem[1], body, idVariant, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteVariation(idVariant, idProdutoHost, grade){
    return new Promise(async (resolve, reject) => {
        let infosNuvem;

        await returnStoreIdandAccessToken()
        .then(async (response) => {
            infosNuvem = response;
        })
        .then(async () => {
            await deleteVariation(infosNuvem[0], infosNuvem[1], idVariant, idProdutoHost, grade)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingUploadImage(image, idProductTray, idProductHost){
    return new Promise(async (resolve, reject) => {
        let body, infosNuvem;

        await returnStoreIdandAccessToken()
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


async function returnStoreIdandAccessToken(){
    return new Promise(async (resolve, reject) => {
        let storeid, access_token;

        await returnValueFromJson('tokennuvemshop')
        .then(async accessNuvem => {
            access_token = accessNuvem
            await returnValueFromJson('storeidnuvemshop')
            .then(async storeidNuvem => {
                storeid = storeidNuvem
                resolve([storeid, access_token])
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