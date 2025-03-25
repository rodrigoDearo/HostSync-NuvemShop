const conexao = require('node-firebird');
const fs = require ('fs')
const { app } = require('electron')
const path = require('node:path')

const { preparingPostCustomer , preparingUpdateCustomer, preparingDeleteCustomer, preparingUndeleteCustomer } = require('./preparingRequests.js');

const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
const pathCustomers = path.join(userDataPath, 'customers.json');

async function requireAllCustomers(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT id_cliente, fone, obs, uf, municipio, complemento, numero, logradouro, bairro, cep, cliente, raz_social, cpf_cnpj, status FROM CLIENTES`;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA CLIENTES, CONTATAR SUPORTE TECNICO'});

                await readingAllRecordCustomers(result, 0)
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


async function readingAllRecordCustomers(customersRecords, index){
    return new Promise(async (resolve, reject) => {
        let record = customersRecords[index]
        let i = index + 1;

        if(i == customersRecords.length){
            resolve()
        }
        else{
            let customer = {
                "codigo": record.ID_CLIENTE,
                "telefone": record.FONE,
                "observacao": record.OBS,
                "endereco": {
                        "uf": record.UF,
                        "cidade": record.MUNICIPIO,
                        "complemento": record.COMPLEMENTO,
                        "numero": record.NUMERO,
                        "logradouro": record.LOGRADOURO,
                        "bairro": record.BAIRRO,
                        "cep": record.CEP
                },
                "fantasia": record.CLIENTE,
                "razao_social": record.RAZ_SOCIAL,
                "cnpj_cpf": record.CPF_CNPJ,
                "status": record.STATUS
            }
    
            if(record.RAZ_SOCIAL==null){
                await readingAllRecordCustomers(customersRecords, i)
                .then(() => {
                    resolve()
                })
            }
            else if((record.RAZ_SOCIAL).length==0){
                await readingAllRecordCustomers(customersRecords, i)
                .then(() => {
                    resolve()
                })
            }
            else{
                registerOrUpdateCustomer(customer)
                .then(async() => {
                    await readingAllRecordCustomers(customersRecords, i)
                    .then(() => {
                        resolve()
                    })
                })
            }
        }

    })
}


async function registerOrUpdateCustomer(customer){
    return new Promise(async (resolve, reject) => {
        let customersDB = JSON.parse(fs.readFileSync(pathCustomers))

        var customerAlreadyRegister = customersDB[`${customer.codigo}`] ? true : false;
        var customerIsActiveOnHost = customer.status == 'ATIVO' ? true : false;

        const functionReturnStatusOnPedOk = async () => {if(customerAlreadyRegister){ return customersDB[`${customer.codigo}`].status }else{return null}} 
        const functionReturnIdCustomerOnPedOk = async () => {if(customerAlreadyRegister){ return customersDB[`${customer.codigo}`].idPedidoOk }else{return null}}
       
        var statusCustomerOnPedidoOk = await functionReturnStatusOnPedOk()

        var customerIsActiveOnPedidoOK =  statusCustomerOnPedidoOk == 'ATIVO' ? true : false;
        var idCustomerOnPedidoOk = await functionReturnIdCustomerOnPedOk()

        if(!customerAlreadyRegister&&customerIsActiveOnHost){
            await preparingPostCustomer(customer)
            .then(() => {
                resolve()
            })
        }else
        if(!customerAlreadyRegister&&(!customerIsActiveOnHost)){
            resolve()
        }else
        if(customerAlreadyRegister&&customerIsActiveOnHost){
            if(customerIsActiveOnPedidoOK){
                await preparingUpdateCustomer(customer, idCustomerOnPedidoOk)
                .then(() => {
                    resolve()
                })
            }
            else{
                await preparingUndeleteCustomer(idCustomerOnPedidoOk, customer.codigo)
                .then(() => {
                    resolve()
                })
            }
        }else
        if(customerAlreadyRegister&&(!customerIsActiveOnHost)){
            if(customerIsActiveOnPedidoOK){
                await preparingDeleteCustomer(idCustomerOnPedidoOk, customer.codigo)
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
    requireAllCustomers,
    readingAllRecordCustomers
}
