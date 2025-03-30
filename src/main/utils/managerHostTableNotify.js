const conexao = require('node-firebird');

const { readingAllRecordProducts } = require('./managerProducts.js')
const { limparTabela } = require('./dependenciesFDB.js');
const { gravarLog } = require("./auxFunctions.js");

async function readNewRecords(config){
    return new Promise(async(resolve, reject) => {
        var recordsProductsNotify, recordsCustomersNotify;

        await requireAllRecordsProductNotifyTable(config)
        .then(async (response) => {
            recordsProductsNotify = response
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
                            FROM NOTIFICACOES_HOSTSYNC AS nh
                            LEFT JOIN PRODUTOS AS P ON nh.iditem = P.id_produto
                            LEFT JOIN PRODUTOS_MARCA M ON P.MARCA = M.ID
                            LEFT JOIN PRODUTOS_GRUPO G ON P.GRUPO = G.ID
                            LEFT JOIN PRODUTOS_SUBGRUPO SG ON P.SUBGRUPO = SG.ID
                            WHERE nh.tipo='PRODUTO'
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


module.exports = {
    readNewRecords
}