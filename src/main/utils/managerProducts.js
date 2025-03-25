const conexao = require('node-firebird');
const fs = require ('fs')
const path = require('node:path')
const { app } = require('electron')

const { preparingPostProduct , preparingUpdateProduct, preparingDeleteProduct, preparingUndeleteProduct } = require('./preparingRequests.js');

const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathProducts = path.join(userDataPath, 'products.json');

async function requireAllProducts(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT id_produto, obs, barras, PRODUTOS_GRUPO.grupo, produto, estoque, PRODUTOS_MARCA.marca, valor_venda, custo, status FROM PRODUTOS LEFT JOIN PRODUTOS_GRUPO on PRODUTOS.grupo = PRODUTOS_GRUPO.id LEFT JOIN PRODUTOS_MARCA on PRODUTOS.marca = PRODUTOS_MARCA.id`;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA PRODUTOS, CONTATAR SUPORTE TECNICO'});
                
                await readingAllRecordProducts(result, 0)
                .then(() => {
                    resolve({code: 200, msg:'CLIENTES CONSULTADOS COM SUCESSO'});
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

        if(i == productsRecords.length){
            resolve()
        }
        else{
            let product = {
                "codigo": record.ID_PRODUTO,
                "observacao": record.OBS,
                "codigo_barra": record.BARRAS,
                "categoria": record.GRUPO,
                "nome": record.PRODUTO,
                "estoque": record.ESTOQUE,
                "marca": record.MARCA,
                "venda": record.VALOR_VENDA,
                "custo": record.CUSTO,
                "embalagem": 0,
                "status": record.STATUS
            }
    
            registerOrUpdateProduct(product)
            .then(async() => {
                await readingAllRecordProducts(productsRecords, i)
                .then(() => {
                    resolve()
                })
            })
        }

    })
}


async function registerOrUpdateProduct(product){
    return new Promise(async (resolve, reject) => {
        let productsDB = JSON.parse(fs.readFileSync(pathProducts))

        var productAlreadyRegister = productsDB[`${product.codigo}`] ? true : false;
        var productIsActiveOnHost = product.status == 'ATIVO' ? true : false;

        const functionReturnStatusOnPedOk = () => {if(productAlreadyRegister){ return productsDB[`${product.codigo}`].status }else{return null}}
        const functionReturnIdProductOnPedOk = () => {if(productAlreadyRegister){ return productsDB[`${product.codigo}`].idPedidoOk }else{return null}}
        
        var statusProductOnPedidoOk = await functionReturnStatusOnPedOk()

        var productIsActiveOnPedidoOK =  statusProductOnPedidoOk == 'ATIVO' ? true : false;
        var idProductOnPedidoOk = functionReturnIdProductOnPedOk()

        if(!productAlreadyRegister&&productIsActiveOnHost){
            await preparingPostProduct(product)
            .then(() => {
                resolve()
            })
        }else
        if(!productAlreadyRegister&&(!productIsActiveOnHost)){
            resolve()
        }else
        if(productAlreadyRegister&&productIsActiveOnHost){
            if(productIsActiveOnPedidoOK){
                await preparingUpdateProduct(product, idProductOnPedidoOk)
                .then(() => {
                    resolve()
                })
            }
            else{
                await preparingUndeleteProduct(idProductOnPedidoOk, product.codigo)
                .then(() => {
                    resolve()
                })
            }
        }else
        if(productAlreadyRegister&&(!productIsActiveOnHost)){
            if(productIsActiveOnPedidoOK){
                await preparingDeleteProduct(idProductOnPedidoOk, product.codigo)
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
