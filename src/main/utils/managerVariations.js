const conexao = require('node-firebird');
const fs = require ('fs')
const path = require('node:path')
const { app } = require('electron')

const { preparingPostVariation, preparingUpdateVariation, preparingDeleteVariation } = require('./preparingRequests.js');
const { returnConfigToAccessDB } = require('./auxFunctions.js')

var variationsModificateds = []
//const userDataPath = 'src/build';
const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathProducts = path.join(userDataPath, 'products.json');

async function requireAllVariationsOfAProduct(idProduct){
    return new Promise(async(resolve, reject) => {
        try {
        variationsModificateds = []

        let config;

        await returnConfigToAccessDB()
        .then(response => {
            config = response
        })

        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT 
                                PG.ID_PRODUTO,
                                PG.BARRAS,
                                P.VALOR_VENDA,
                                P.CUSTO,
                                G.GRADE,
                                PG.ESTOQUE,
                                P.STATUS
                            FROM PRODUTOS_GRADE_ITENS PG
                            LEFT JOIN PRODUTOS P ON PG.ID_PRODUTO = P.ID_PRODUTO
                            LEFT JOIN GRADE G ON PG.ID_GRADE = G.ID
                            WHERE PG.ID_PRODUTO='${idProduct}'
                            AND G.GRADE!='null';`;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA VARIACOES, CONTATAR SUPORTE TECNICO'});
                
                await readingAllRecordVariations(result, 0, idProduct)
                .then(() => {
                    resolve({code: 200, msg:'VARIACOES CONSULTADAS COM SUCESSO'});
                })
                
            });
          
        db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
}


async function readingAllRecordVariations(variationsRecords, index, idProdutoHost){
    return new Promise(async (resolve, reject) => {
        let productsDB = JSON.parse(fs.readFileSync(pathProducts))

        let record = variationsRecords[index]
        let i = index + 1;


        if(i > variationsRecords.length){
            if(productsDB[`${idProdutoHost}`]){
                await deleteUnlistedVariations(productsDB[`${idProdutoHost}`], idProdutoHost, variationsModificateds)
                .then(async () => {
                    resolve()
                })
            }else{
                resolve()
            }
        }
        else{
            let variant = {
                "Variant": {
                    "codigo": record.ID_PRODUTO,
                    "ean": record.BARRAS,
                    "price": parseFloat(String(record.VALOR_VENDA ?? '').replace(',', '.')).toFixed(2),
                    //"cost_price": parseFloat(String(record.CUSTO ?? '').replace(',', '.')).toFixed(2),
                    "stock": parseInt(record.ESTOQUE),
                    "minimum_stock": "1",
                    "type_1": "Variação",
                    "value_1": record.GRADE,
                }
            }
            
            if(productsDB[`${record.ID_PRODUTO}`]){
                variant.Variant.product_id = productsDB[`${record.ID_PRODUTO}`].idTray
                await registerUpdateOrDeleteVariant(variant)
                .then(async() => {
                    await readingAllRecordVariations(variationsRecords, i, idProdutoHost)
                    .then(() => {
                        resolve()
                    })
                })
            }

        }

    })
}


async function registerUpdateOrDeleteVariant(variant){
    return new Promise(async (resolve, reject) => {
        let productsDB = JSON.parse(fs.readFileSync(pathProducts))

        var variantAlreadyRegister = productsDB[`${variant.Variant.codigo}`].variations[`${variant.Variant.value_1}`] ? true : false;

        const functionReturnIdProductOnTray = () => {if(variantAlreadyRegister){ return productsDB[`${variant.Variant.codigo}`].variations[`${variant.Variant.value_1}`] }else{return null}}
        let idVariantTray = functionReturnIdProductOnTray()

        if(variantAlreadyRegister){
            await preparingUpdateVariation(variant, idVariantTray)
            .then(() => {
                variationsModificateds.push(variant.Variant.value_1)
                resolve()
            })
        }else
        if(!variantAlreadyRegister){
            await preparingPostVariation(variant)
            .then(() => {
                variationsModificateds.push(variant.Variant.value_1)
                resolve()
            })
        }
        
    })
}


async function deleteUnlistedVariations(product, idHost, arrayVariations) {
    return new Promise(async (resolve, reject) => {
        let variations = product.variations

        for(let i=0; i<arrayVariations.length; i++){
            delete variations[`${arrayVariations[i]}`]
        }

        for (const [grade, id] of Object.entries(variations)) {
            setTimeout(async () => {
                await preparingDeleteVariation(id, idHost, grade)
            }, 1000);
        }
        

        resolve()
    })
}

module.exports = {
    requireAllVariationsOfAProduct,
}
