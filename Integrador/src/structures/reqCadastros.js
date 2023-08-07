/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');

var caminho, config;

// main.js
const conexao = require('node-firebird');

retornaCampo('caminho_banco').then(response => {
  caminho = response;
})
.then(() => {
  config = {
    "host": 'localhost',
    "port": 3050,
    "database": `${caminho}/HOST.FDB`,
    "user": 'SYSDBA',
    "password": 'masterkey'
  };
})
.then(() => {
  sincronizacaoInicial();
})
.then(() => {
  sincronizarBanco();
})



function sincronizarBanco(){
  conexao.attach(config, function (err, db) {
    if (err)
      throw err;

    db.query('SELECT COUNT(*) AS numeroRegistros FROM NOTIFICACOES_HOSTSYNC', function (err, result) {
      if (err)
        throw err;

      let totalRegistros = result[0].NUMEROREGISTROS;

      if (totalRegistros > 0) {
        db.query('SELECT FIRST 1 OBS AS obsproduto, IDPRODUTO AS id FROM NOTIFICACOES_HOSTSYNC', function (err, resultNotificacao) {
          if (err)
            console.log(err);

          let obsDoRegistro = resultNotificacao[0].OBSPRODUTO;
          let idProdutoRegistro = resultNotificacao[0].ID;

          console.log("O produto de ID " + idProdutoRegistro + " foi " + obsDoRegistro + " com sucesso!");

          db.query('DELETE FROM NOTIFICACOES_HOSTSYNC WHERE IDPRODUTO = ?', [idProdutoRegistro], function (err, result) {
            if (err)
              throw err;

            console.log('Deletado o registro já lido');
            db.detach(function (err) {
              if (err)
                throw err;
              setTimeout(sincronizarBanco, 5000);
            });
          });
        });
      } else {
        console.log('Nenhum registro encontrado para leitura.');
        db.detach(function (err) {
          if (err)
            throw err;
          setTimeout(sincronizarBanco, 5000);
        });
      }
    });
  });
}



async function sincronizacaoInicial(){
  return new Promise(async (resolve, reject) => {
    try {
      conexao.attach(config, function(err, db){
        if (err)
          throw err;

        db.query('SELECT ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, VALOR_COMPRA FROM PRODUTOS', function(err, result){
            
            db.detach()
            if (err)
              throw err;

           
            result.forEach((row) => {
              const { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, VALOR_COMPRA } = row;
          console.log(`ID: ${ID_PRODUTO}, Descrição: ${PRODUTO}, Estoque: ${ESTOQUE}, Preço: ${VALOR_VENDA}, Custo: ${VALOR_COMPRA}`);
            });

        })
      })  

      resolve();
    }
    catch(error){
      reject();
    }
  })
}






function gravarLog(mensagem) {
  if (!fs.existsSync('../logs')) {
    fs.mkdirSync('../logs');
  }
  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `../../../logs/log_${dataFormatada}.txt`;
  const logFilePath = path.join(__dirname, logFileName);
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Erro ao gravar o log:', err);
    } else {
      console.log('Log gravado com sucesso!');
    }
  });
}

function gravarLogErro(mensagem) {
  if (!fs.existsSync('../logs')) {
    fs.mkdirSync('../logs');
  }
  
  if (!fs.existsSync('../logs/logsErr')) {
    fs.mkdirSync('../logs/logsErr');
  }

  const data = new Date();
  data.setHours(data.getHours() - 3);
  const dataFormatada = `${data.getFullYear()}-${data.getMonth() + 1}-${data.getDate()}`;
  const logMessage = `[${data.toISOString()}]: ${mensagem}\n`;
  const logFileName = `../../../logs/logsErr/log_${dataFormatada}Err.txt`;
  const logFilePath = path.join(__dirname, logFileName);

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Erro ao gravar o log:', err);
    } else {
      console.log('Log gravado com sucesso!');
    }
  });
}