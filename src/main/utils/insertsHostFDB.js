const conexao = require('node-firebird');

const { gravarLog } = require('./auxFunctions.js')




async function insertOrcamento(dadosSale, dadosCustomer, config){
    return new Promise(async (resolve, reject) => {

        conexao.attach(config, function (err, db){
            if (err)
                throw err;

            let codigoSQL = `INSERT INTO ORCAMENTO (ID_CLIENTE, ID_USUARIO, DATA_VENDA, HORA_VENDA, DESCONTO, ACRESCIMO, VALOR_FINAL, TOTAL_PRODUTOS, ACRESCIMO_ITENS, STATUS_VENDA, NOME_CLIENTE, ENDERECO_CLIENTE, FONE_CLIENTE, CPF_CNPJ_CLIENTE, CANCELADO, SITUACAO, OBS, MUNICIPIO, UF) VALUES (${dadosCustomer.ID_CLIENTE}, ${dadosSale.ID_USUARIO}, '${dadosSale.DATA_VENDA}', '${dadosSale.HORA_VENDA}', ${dadosSale.DESCONTO}, ${dadosSale.ACRESCIMO}, ${dadosSale.VALOR_FINAL}, ${dadosSale.TOTAL_PRODUTOS}, ${dadosSale.ACRESCIMO_ITENS}, '${dadosSale.STATUS_VENDA}', '${dadosCustomer.CLIENTE}', '${dadosCustomer.ENDERECO}', '${dadosCustomer.FONE}', '${dadosCustomer.CPF_CNPJ}', '${dadosSale.CANCELADO}', '${dadosSale.SITUACAO}', '${dadosSale.OBS}', '${dadosCustomer.MUNICIPIO}', '${dadosCustomer.UF}')`;

            db.query(codigoSQL, async function (err, result){
                if (err)
                    reject({code: 500, msg:'ERRO AO TENTAR INSERIR REGISTRO NA TABELA ORCAMENTO, CONTATAR SUPORTE TECNICO'});
                
                resolve()
            });
          
            db.detach();
        })

    })
}


async function insertItemOrcamento(dadosProduct, config){
    return new Promise(async (resolve, reject) => {
        conexao.attach(config, function (err, db){
            if (err)
                throw err;

            let codigoSQL = `INSERT INTO ORCAMENTO_ITENS (ITEM, ID_PRODUTO, ID_ORCAMENTO, QUANTIDADE, VALOR_UNITARIO, VALOR_CUSTO, VALOR_PRODUTOS, TOTAL_ITEM, DESCONTO, ACRESCIMO, ACRESCIMO_RATEIO, DESCONTO_RATEIO, CANCELADO, MOVIMENTA_ESTOQUE, DESC_ACRES, ID_GRADE_ITENS, VALOR_UNITARIO_APRAZO, TOTAL_ITEM_APRAZO) VALUES (${dadosProduct.ITEM}, ${dadosProduct.ID_PRODUTO}, ${dadosProduct.ID_ORCAMENTO}, ${dadosProduct.QUANTIDADE}, ${dadosProduct.VALOR_UNITARIO}, ${dadosProduct.VALOR_CUSTO}, ${dadosProduct.VALOR_PRODUTOS}, ${dadosProduct.TOTAL_ITEM}, ${dadosProduct.DESCONTO}, ${dadosProduct.ACRESCIMO}, ${dadosProduct.ACRESCIMO_RATEIO}, ${dadosProduct.DESCONTO_RATEIO}, '${dadosProduct.CANCELADO}', '${dadosProduct.MOVIMENTA_ESTOQUE}', '${dadosProduct.DESC_ACRES}', ${dadosProduct.ID_GRADE_ITENS}, ${dadosProduct.VALOR_UNITARIO_APRAZO}, ${dadosProduct.TOTAL_ITEM_APRAZO})`;
            
            db.query(codigoSQL, async function (err, result){
                if (err)
                    console.log(err)
                    //reject({code: 500, msg:'ERRO AO TENTAR INSERIR REGISTRO NA TABELA ORCAMENTO_ITENS, CONTATAR SUPORTE TECNICO'});
                
                gravarLog('REALIZADO INSERT NA TABELA DE ORCAMENTO_ITENS COM SUCESSO');
                resolve()
            });
          
            db.detach();
        })
    })
}


module.exports = {
    insertOrcamento,
    insertItemOrcamento
}




/*
async function insertMovimento(config){
    return new Promise(async (resolve, reject) => {
        const now = new Date();

        let dataAbertura = String(now.getDate()).padStart(2, '0') + "." +
        String(now.getMonth() + 1).padStart(2, '0') + "." +
        String(now.getFullYear()
        ) 

        let horaAbertura = String(now.getHours()).padStart(2, '0') + "." +
        String(now.getMinutes()).padStart(2, '0') + ".00";

        conexao.attach(config, function (err, db){
            if (err)
                throw err;


            let codigoSQL = `INSERT INTO MOVIMENTO (DATA_ABERTURA, HORA_ABERTURA, TOTAL_SUPRIMENTO, TOTAL_SANGRIA, TOTAL_NAO_FISCAL, TOTAL_VENDA, TOTAL_DESCONTO, TOTAL_ACRESCIMO, TOTAL_FINAL, TOTAL_RECEBIDO, TOTAL_TROCO, TOTAL_CANCELADO, STATUS_MOVIMENTO) VALUES ('${dataAbertura}', '${horaAbertura}', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'A')`;

            db.query(codigoSQL, async function (err, result){
                if (err)
                    reject({code: 500, msg:'ERRO AO CONSULTAR TABELA DE MOVIMENTOS, CONTATAR SUPORTE TECNICO'});
                
                gravarLog('REALIZADO INSERT NA TABELA DE MOVIMENTO COM SUCESSO');
                resolve()
            });
          
            db.detach();
        })
    })
}*/
