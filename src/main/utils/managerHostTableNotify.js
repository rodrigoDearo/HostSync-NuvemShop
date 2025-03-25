const conexao = require('node-firebird');

const { readingAllRecordProducts } = require('./managerProducts.js')
const { readingAllRecordCustomers } = require('./managerCustomers.js')
const { limparTabela } = require('./dependenciesFDB.js');
const { gravarLog } = require("./auxFunctions.js");

async function readNewRecords(config){
    return new Promise(async(resolve, reject) => {
        var recordsProductsNotify, recordsCustomersNotify;

        await requireAllRecordsProductNotifyTable(config)
        .then(async (response) => {
            recordsProductsNotify = response
            recordsCustomersNotify = await requireAllRecordsCustomerNotifyTable(config)
        })
        .then(async () => {
            await limparTabela(config);
        })
        .then(async () => {
            if(recordsProductsNotify.length>0){
                await readingAllRecordProducts(recordsProductsNotify, 0)
            }
        })
        .then(async () => {
            if(recordsCustomersNotify.length>0){
                await readingAllRecordCustomers(recordsCustomersNotify, 0)
            }
        })
        .then(async () => {
            gravarLog('------------------------------------------------')
            if((recordsProductsNotify.length==0)&&(recordsCustomersNotify.length==0)){
                gravarLog('SEM NOVO REGISTROS PARA LER')
                gravarLog('------------------------------------------------')
            }
            else{
                gravarLog('FINALIZADO LEITURA DA TABELA DE NOVOS REGISTRO !')
                gravarLog('------------------------------------------------')
            }
        })
        .then(() => {
            resolve({code: 200, msg:'NOVOS REGISTROS CONSULTADOS COM SUCESSO'});
        })
        .catch(() => {
            resolve({code: 500, msg:'ERRO AO CONSULTAR TABELA NOTIFICACOES, CONTATAR SUPORTE TECNICO'})
        })

    })
}


async function requireAllRecordsProductNotifyTable(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT
                                produto_tabela.id_produto,
                                produto_tabela.obs,
                                produto_tabela.barras,
                                produto_grupo.grupo,
                                produto_tabela.produto,
                                produto_tabela.estoque,
                                produto_marca.marca,
                                produto_tabela.valor_venda,
                                produto_tabela.custo,
                                produto_tabela.status
                            FROM NOTIFICACOES_HOSTSYNC AS nh
                            LEFT JOIN PRODUTOS AS produto_tabela ON nh.iditem = produto_tabela.id_produto
                            LEFT JOIN PRODUTOS_GRUPO AS produto_grupo ON produto_tabela.grupo = produto_grupo.id
                            LEFT JOIN PRODUTOS_MARCA AS produto_marca ON produto_tabela.marca = produto_marca.id
                            WHERE nh.tipo = 'PRODUTO'
                            AND nh.id IN (
                                SELECT MIN(id)
                                FROM NOTIFICACOES_HOSTSYNC
                                WHERE tipo = 'PRODUTO'
                                GROUP BY iditem
                            );
                        `;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    reject({code: 500, msg:'ERRO AO CONSULTAR TABELA NOTIFICACOES, CONTATAR SUPORTE TECNICO'});
                
                resolve(result)
            });
          
        db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
}


async function requireAllRecordsCustomerNotifyTable(config){
    return new Promise(async(resolve, reject) => {
        try {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;
  
            let codigoSQL = `SELECT
                                cliente_tabela.id_cliente,
                                cliente_tabela.fone,
                                cliente_tabela.obs,
                                cliente_tabela.uf,
                                cliente_tabela.municipio,
                                cliente_tabela.complemento,
                                cliente_tabela.numero,
                                cliente_tabela.logradouro,
                                cliente_tabela.bairro,
                                cliente_tabela.cep,
                                cliente_tabela.cliente,
                                cliente_tabela.raz_social,
                                cliente_tabela.cpf_cnpj,
                                cliente_tabela.status
                            FROM NOTIFICACOES_HOSTSYNC AS nh
                            LEFT JOIN CLIENTES AS cliente_tabela ON nh.iditem = cliente_tabela.id_cliente
                            WHERE nh.tipo = 'CLIENTE'
                            AND nh.id IN (
                                SELECT MIN(id)
                                FROM NOTIFICACOES_HOSTSYNC
                                WHERE tipo = 'CLIENTE'
                                GROUP BY iditem
                            );
                        `;
  
            db.query(codigoSQL, async function (err, result){
                if (err)
                    reject({code: 500, msg:'ERRO AO CONSULTAR TABELA NOTIFICACOES, CONTATAR SUPORTE TECNICO'});

                resolve(result)
                
            });
          
        db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
}



module.exports = {
    readNewRecords
}