/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const path = require('path');
const conexao = require('node-firebird');

const configBanco = {
  "host": 'localhost',
  "port": 3050,
  "database": 'C:/TSD/HOST/HOST.FDB',
  "user": 'SYSDBA',
  "password": 'masterkey'
}

function sincronizarBanco() {
  conexao.attach(configBanco, function (err, db) {
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



function cargaInicial(){
  conexao.attach(configBanco, function(err, db){
      if(err)
        throw err

      db.query("SELECT CoUNT(*) as numeroRegistros FROM PRODUTOS", function*(err, result){
        if(err)
        throw err

        let numeroRegistros 
      })
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