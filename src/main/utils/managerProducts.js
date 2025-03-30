const conexao = require('node-firebird');
const fs = require ('fs')
const path = require('node:path')
const { app } = require('electron')

const { preparingPostProduct , preparingUpdateProduct, preparingDeleteProduct, preparingUndeleteProduct } = require('./preparingRequests.js');
const { returnCategoryId } = require('./managerCategories.js');
const { requireAllVariationsOfAProduct } = require('./managerVariations.js')
const { uploadOrDeleteImageImgur, uploadOrDeleteImageTray } = require('./managerImages.js')

//const userDataPath = 'src/build';
const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathProducts = path.join(userDataPath, 'products.json');

async function requireAllProducts(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT 
                                P.ID_PRODUTO,
                                P.PRODUTO,
                                P.BARRAS,
                                P.DESCRICAO_COMPLEMENTAR,
                                P.OBS,
                                P.VALOR_VENDA,
                                P.CUSTO,
                                M.MARCA,
                                P.ESTOQUE,
                                P.STATUS,
                                P.FOTO,
                                P.GRADE,
                                G.GRUPO,
                                SG.SUBGRUPO
                            FROM PRODUTOS P
                            LEFT JOIN PRODUTOS_MARCA M ON P.MARCA = M.ID
                            LEFT JOIN PRODUTOS_GRUPO G ON P.GRUPO = G.ID
                            LEFT JOIN PRODUTOS_SUBGRUPO SG ON P.SUBGRUPO = SG.ID;
                            `;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA PRODUTOS, CONTATAR SUPORTE TECNICO'});
                
                await readingAllRecordProducts(result, 0)
                .then(() => {
                    resolve({code: 200, msg:'PRODUTOS CONSULTADOS COM SUCESSO'});
                })
                
            });
          
        db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
}


async function readingAllRecordProducts(productsRecords, index){
    return new Promise(async (resolve, reject) => {
        let record = productsRecords[index]
        let i = index + 1;

        if(i > productsRecords.length){
            resolve()
        }
        else{
            let product = {
                "Product": {
                    "codigo": record.ID_PRODUTO,
                    "ean": record.BARRAS,
                    "name": record.PRODUTO,
                    "description": record.DESCRICAO_COMPLEMENTAR,
                    "description_small": record.OBS,
                    "price": parseFloat(String(record.VALOR_VENDA ?? '').replace(',', '.')).toFixed(2),
                    "cost_price": parseFloat(String(record.CUSTO ?? '').replace(',', '.')).toFixed(2),
                    "brand": record.MARCA,
                    "stock": parseInt(record.ESTOQUE),
                    "available": ((record.STATUS=='ATIVO')&&(parseInt(record.ESTOQUE)>0))? 1 : 0
                }
            }
            
            await returnCategoryId(record.GRUPO, record.SUBGRUPO)
            .then(async (idCategory) => {
                product.Product.category_id	= idCategory
                await registerOrUpdateProduct(product)
            })
            .then(async () => {
                await uploadOrDeleteImageImgur(record.ID_PRODUTO, record.FOTO)
                .then(async () => {
                    await uploadOrDeleteImageTray(record.ID_PRODUTO)
                })
                
            })
            .then(async() => {
                setTimeout(async() => {
                    await readingAllRecordProducts(productsRecords, i)
                    .then(() => {
                        resolve()
                    })
                }, 600);
            })

        }

    })
}


async function registerOrUpdateProduct(product){
    return new Promise(async (resolve, reject) => {
        let productsDB = JSON.parse(fs.readFileSync(pathProducts))
        let idProductHost = product.Product.codigo;

        var productAlreadyRegister = productsDB[`${product.Product.codigo}`] ? true : false;
        var productIsActiveOnHost = product.Product.available == 1 ? true : false;

        const functionReturnStatusOnTray = () => {if(productAlreadyRegister){ return productsDB[`${product.Product.codigo}`].status }else{return null}}
        const functionReturnIdProductOnTray = () => {if(productAlreadyRegister){ return productsDB[`${product.Product.codigo}`].idTray }else{return null}}
        
        var statusProductOnTray = await functionReturnStatusOnTray()

        var productIsActiveOnTray =  statusProductOnTray == 'ATIVO' ? true : false;
        var idProductOnTray = functionReturnIdProductOnTray()

        if(!productAlreadyRegister&&productIsActiveOnHost){
            await preparingPostProduct(product)
            .then(async () => {
                await requireAllVariationsOfAProduct(idProductHost)
                .then(() => {
                    resolve();
                })
            })
        }else
        if(!productAlreadyRegister&&(!productIsActiveOnHost)){
            resolve()
        }else
        if(productAlreadyRegister&&productIsActiveOnHost){
            if(productIsActiveOnTray){
                await preparingUpdateProduct(product, idProductOnTray)
                .then(async () => {
                    await requireAllVariationsOfAProduct(idProductHost)
                    .then(() => {
                        resolve();
                    })
                })
            }
            else{
                await preparingUndeleteProduct(product, idProductOnTray)
                .then(async () => {
                    await requireAllVariationsOfAProduct(idProductHost)
                    .then(() => {
                        resolve();
                    })
                })
            }
        }else
        if(productAlreadyRegister&&(!productIsActiveOnHost)){
            if(productIsActiveOnTray){
                await preparingDeleteProduct(product, idProductOnTray)
                .then(() => {
                    resolve()
                })
            }
            else{
                resolve()
            }
        }
        
    })
}



module.exports = {
    requireAllProducts,
    readingAllRecordProducts
}
