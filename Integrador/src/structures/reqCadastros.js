/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const conexao = require('node-firebird');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');
const { tratativaDeProdutosNuvem, tratativaDeCategoriasNuvem, tratativaDeSubCategoriasNuvem, tratativaDeGradeNuvem } = require('./configNuvem');
const { criarTriggerUpdateProduto, criarTriggerInsertProduto, criarTriggerInsertGrupo, criarTriggerUpdateGrupo, criarTriggerInsertSubGrupo, criarTriggerUpdateSubGrupo, criarTriggerInsertGrade, criarTriggerUpdateGrade, criarTabela } = require('./dependenciasSQL');

var caminho, config;


function esqueletoDoSistema(){
  retornaCampo('caminho_banco')
  .then(response => {
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
  .then(async() => {
    console.log('Cheguei aqui');
      await criarTabela(config)
      .then(async () => {
        await criarTriggerInsertProduto(config)
      })
      .then(async () => {
        await criarTriggerUpdateProduto(config);
      })
      .then(async () => {
        await criarTriggerInsertGrupo(config)
      })
      .then(async () => {
        await criarTriggerUpdateGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertSubGrupo(config)
      })
      .then(async () => {
        await criarTriggerUpdateSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertGrade(config)
      })
      .then(async () => {
        await criarTriggerUpdateGrade(config);
      })
      .catch(() => {
        console.log('Erro na consulta das trigger e tabela NOTIFICACAO_HOSTSYNC');
        gravarLogErro('Erro ao criar/verificar as dependências SQL necessárias no banco FDB. Consultar o desenvolvedor do sistema com URGÊNCIA');
      })
  })
  .then(async () => {
    await sincronizacaoInicialGrupo();
  })
  .then(async () => {
    await sincronizacaoInicialSubGrupo();
  })
  .then(async () => {
    await sincronizacaoInicialProdutos();
  })
  /*.then(async () => { EM DESENVOLVIMENTO
    await sincronizacaoInicialGrade();
  })*/
  .then(async () => {
    await sincronizarBanco();
  })
  .catch(() => {
    console.log('Terminal do erro');
  })
}


async function sincronizarBanco(){
  conexao.attach(config, function (err, db) {
    if (err)
      throw err;
 
    db.query('SELECT COUNT(*) AS numeroRegistros FROM NOTIFICACOES_HOSTSYNC', function (err, result) {
      if (err)
        throw err;

      let totalRegistros = result[0].NUMEROREGISTROS;

      if (totalRegistros > 0) {
        db.query('SELECT FIRST 1 OBS AS obsproduto, IDITEM AS id FROM NOTIFICACOES_HOSTSYNC', function (err, resultNotificacao) {
          if (err)
            console.log(err);

          let obsDoRegistro = resultNotificacao[0].OBSPRODUTO;
          let idProdutoRegistro = resultNotificacao[0].ID;

          console.log("O produto de ID " + idProdutoRegistro + " foi " + obsDoRegistro + " com sucesso!");

          db.query('DELETE FROM NOTIFICACOES_HOSTSYNC WHERE IDITEM = ?', [idProdutoRegistro], function (err, result) {
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




async function sincronizacaoInicialProdutos() {
  return new Promise(async (resolve, reject) => {
      try {
          conexao.attach(config, function (err, db) {
              if (err)
                  throw err;

              db.query('SELECT ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, DESCRICAO_COMPLEMENTAR, FOTO, STATUS, MARCA, GRUPO, SUBGRUPO, GRADE, BARRAS FROM PRODUTOS', async function (err, result) {
                // ver codigo de barras
              db.detach();
              if (err)
                  throw err;

              // ABERTURA DO ARQUIVO DE PRODUTOS
              for (const row of result) {
                const { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, DESCRICAO_COMPLEMENTAR, FOTO, STATUS, MARCA, GRUPO, SUBGRUPO, GRADE, BARRAS } = row;
  
                  if(ESTOQUE>=0){
                    await tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, DESCRICAO_COMPLEMENTAR, GRUPO, SUBGRUPO, BARRAS)
                  }
                  else{
                    gravarLog(`O PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADO DEVIDO A ESTOQUE NEGATIVO`);
                  }

              }

              resolve();
              });
          });
      } catch (error) {
          reject(error);
      }
  });
}




async function sincronizacaoInicialGrupo(){
  return new Promise(async(resolve, reject) => {
    try {

        conexao.attach(config, function(err, db){
          if(err)
            throw err

          db.query('SELECT ID, GRUPO FROM PRODUTOS_GRUPO', async function (err, result){
              db.detach()

              if(err)
                throw err

              for(const row of result){
                const {ID, GRUPO} = row;
                await tratativaDeCategoriasNuvem(ID, GRUPO);
              }

              resolve();
          })
        })
    } catch (error) {
        reject(error)
    }
  })
}



async function sincronizacaoInicialSubGrupo(){
  return new Promise(async(resolve, reject) => {
    try {
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query('SELECT ID, ID_GRUPO, SUBGRUPO FROM PRODUTOS_SUBGRUPO', async function(err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID, ID_GRUPO, SUBGRUPO } = row;
            await tratativaDeSubCategoriasNuvem(ID, ID_GRUPO, SUBGRUPO);
          }

          resolve();
        })

      })


    } catch (error) {
      reject(error)
    }
  })
}



async function sincronizacaoInicialGrade() {
  try {
    const db = await new Promise((resolve, reject) => {
      conexao.attach(config, (err, db) => {
        if (err)
          reject(err);
        else
          resolve(db);
      });
    });

    const result = await new Promise((resolve, reject) => {
      db.query('SELECT ID_PRODUTO, ID_GRADE, ESTOQUE FROM PRODUTOS_GRADE_ITENS', (err, result) => {
        if (err)
          reject(err);
        else
          resolve(result);
      });
    });

    for (const row of result) {
      const { ID_PRODUTO, ID_GRADE, ESTOQUE } = row;
      const nomeGrade = await new Promise((resolve, reject) => {
        db.query(`SELECT GRADE FROM GRADE WHERE ID=${ID_GRADE}`, (err, nomeGrade) => {
          if (err)
            console.log('GRADE DA RELAÇÃO NÃO EXISTE' + err);
          resolve(nomeGrade[0]['GRADE']);
        });
      });
      await tratativaDeGradeNuvem(nomeGrade, ID_PRODUTO, ID_GRADE, ESTOQUE);
    }

    db.detach();
  } catch (error) {
    console.error(error);
  }
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

/*

CRIAR TRIGGERS PARA GRUPO E SUBRGRUPO, MARCAS E QUALQIER CHAVE ESTRANGEIRA

LER PRIMEIRO CHAVES ESTRANGEIRAS E DEPOIS PRODUTOS
VER GRADE NA NUVEM


TENTAR ARRUMAR IPCRENDERER E MECHER COM POP UP
VER PRA HOMOLGOAR


DAR AÇÃO PARA O NOTIFICAO_HOSTSYNC
PLANEJAR MELHOR O ESQUELETO DO SISTEMA PARA DIFERENTES OCASIÕES
VER VISUAL

*/ 


esqueletoDoSistema();

module.exports = { 
  esqueletoDoSistema,
}
