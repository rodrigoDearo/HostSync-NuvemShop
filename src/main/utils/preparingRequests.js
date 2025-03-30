const { registerProduct, updateProduct, deleteProduct, undeleteProduct, registerCategory, deleteCategory, registerVariation, updateVariation, deleteVariation, uploadImage } = require('./requestsTray');
const { returnValueFromJson } = require('./manageInfoUser');
const { returnInfo } = require('../envManager');

async function preparingPostProduct(product){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await registerProduct(infosTray[0], infosTray[1], body, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await updateProduct(infosTray[0], infosTray[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await deleteProduct(infosTray[0], infosTray[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingUndeleteProduct(product, idproduct){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = product
        })
        .then(async () => {
            let idHost = body.Product.codigo
            delete body.Product.codigo
            await undeleteProduct(infosTray[0], infosTray[1], body, idproduct, idHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


//


async function preparingPostCategory(category){
    return new Promise(async (resolve, reject) => {
        let infosTray;
        let body = {
            "Category": {
                "name": category
              }
          }

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
        })
        .then(async () => {
            await registerCategory(infosTray[0], infosTray[1], body, 'category', category)
            .then((id) => {
                resolve(id ?? null)
            })
        }) 
    })  
}


async function preparingPostSubCategory(category, subcategory, category_id){
    return new Promise(async (resolve, reject) => {
        let infosTray;
        let body = {
            "Category": {
                "name": subcategory,
                "parent_id": category_id
              }
          }

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
        })
        .then(async () => {
            await registerCategory(infosTray[0], infosTray[1], body, 'subcategory', category)
            .then((id) => {
                resolve(id ?? null)
            })
        }) 
    })  
}


async function preparingPostVariation(variant){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = variant
        })
        .then(async () => {
            let idProductHost = body.Variant.codigo
            delete body.Variant.codigo
            await registerVariation(infosTray[0], infosTray[1], body, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function preparingUpdateVariation(variant, idVariant){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = variant
        })
        .then(async () => {
            let idProductHost = body.Variant.codigo
            delete body.Variant.codigo
            await updateVariation(infosTray[0], infosTray[1], body, idVariant, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })
}


async function preparingDeleteVariation(idVariant, idProdutoHost, grade){
    return new Promise(async (resolve, reject) => {
        let infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
        })
        .then(async () => {
            await deleteVariation(infosTray[0], infosTray[1], idVariant, idProdutoHost, grade)
            .then(() => {
                resolve();
            })
        }) 
    })
}

async function preparingUploadImage(image, idProductTray, idProductHost){
    return new Promise(async (resolve, reject) => {
        let body, infosTray;

        await returnURLandAccessToken()
        .then(async (response) => {
            infosTray = response;
            body = {
                "Images":  {
                     "picture_source_1":image,
                 }
             }
        })
        .then(async () => {
            await uploadImage(infosTray[0], infosTray[1], body, idProductTray, idProductHost)
            .then(() => {
                resolve();
            })
        }) 
    })  
}


async function returnURLandAccessToken(){
    return new Promise(async (resolve, reject) => {
        let url, access_token;

        await returnValueFromJson('access_token')
        .then(async accessTray => {
            access_token = accessTray
            await returnValueFromJson('urltray')
            .then(async urlTray => {
                url = urlTray
                resolve([url, access_token])
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
    preparingUploadImage
}