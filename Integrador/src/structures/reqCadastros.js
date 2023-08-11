/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const conexao = require('node-firebird');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');
const { cadastrarProdutoNuvem } = require('./configNuvem');
const { rejects } = require('assert');

var caminho, config;

// main.js

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
    await criarTabela()
    .then(async () => {
      await criarTriggerInsert();
    })
    .then(async () => {
      await criarTriggerUpdate();
    })
    .catch(() => {
      console.log('Erro na consulta das trigger e tabela NOTIFICACAO_HOSTSYNC');
      gravarLogErro('Erro ao criar/verificar as dependências SQL necessárias no banco FDO. Consultar o desenvolvedor do sistema com URGÊNCIA');
    })
})
/*.then(async () => {
  await sincronizacaoInicial();
})
.then(async () => {
  await sincronizarBanco();
})*/
.then(() => {
  console.log('Fim do THEN');
})
.catch(() => {
  console.log('Terminal do erro');
})


async function criarTabela(){
  return new Promise(async(resolve, reject) => {
    try {
      // CONEXAO ABERTA PARA CRIAR TABELA NOTIFICACOES_HOSTSYNC CASO NAO EXISTA
      conexao.attach(config, function(err, db) {
        if (err)
          throw err

        let codigo = `EXECUTE BLOCK
        AS
        BEGIN
            IF (NOT EXISTS (
                SELECT 1
                FROM RDB$RELATIONS
                WHERE RDB$RELATION_NAME = 'NOTIFICACOES_HOSTSYNC'
            ))
            THEN
            BEGIN
                EXECUTE STATEMENT 'CREATE TABLE NOTIFICACOES_HOSTSYNC (
                    TIPO       VARCHAR(100),
                    OBS        VARCHAR(100),
                    IDPRODUTO  INTEGER
                )';
            END
        END`

        db.query(codigo, function (err, result){
          if (err)
            throw err;

          console.log('TABELA NOTIFICACOES_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
          gravarLog('TABELA NOTIFICACOES_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
        })

        db.detach();
        resolve();
      })
    } catch (error) {
      reject(error);
    }
  })
}


async function criarTriggerInsert(){
  return new Promise(async(resolve, reject) => {
    try {
      
      // CONEXAO ABERTA NOVAMENTE PARA ESTAR ATUALIZADA COM A TABELA CRIADA, USADA PARA CRIAR A TRIGGER INSERT
      conexao.attach(config, function (err, db){
        if (err)
          throw err;

        let codigoTriggerInsert = `EXECUTE BLOCK
        AS
        BEGIN
            IF (NOT EXISTS (
                SELECT 1
                FROM RDB$TRIGGERS
                WHERE RDB$TRIGGER_NAME = 'INSERT_HOSTSYNC'
            ))
            THEN
            BEGIN
                EXECUTE STATEMENT 'CREATE TRIGGER INSERT_HOSTSYNC FOR PRODUTOS
                ACTIVE AFTER INSERT POSITION 0
                AS
                BEGIN
                    INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, idproduto) VALUES (''CADASTRO'', ''cadastrado'', NEW.id_produto);
                END';
            END
        END`;

        db.query(codigoTriggerInsert, function (err, result){
          if (err)
            throw err;

          console.log('TRIGGER INSERT_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
          gravarLog('TRIGGER INSERT_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
        });
        
        db.detach();
        resolve()
      });

    } catch (error) {
      reject(error);
    }
  })
}


async function criarTriggerUpdate(){
  return new Promise(async(resolve, reject) => {
    try {
      
      // CONEXAO ABERTA NOVAMENTE PARA ESTAR ATUALIZADA COM A TABELA CRIADA, USADA PARA CRIAR A TRIGGER INSERT
      conexao.attach(config, function(err, db){
        if (err)
          throw err;

          let codigoTriggerUpdate = `EXECUTE BLOCK
          AS
          BEGIN
              IF (NOT EXISTS (
                  SELECT 1
                  FROM RDB$TRIGGERS
                  WHERE RDB$TRIGGER_NAME = 'UPDATE_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_HOSTSYNC FOR PRODUTOS
                  ACTIVE AFTER UPDATE POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, idproduto) VALUES (''ATUALIZACAO'', ''atualizado'', NEW.id_produto);
                  END';
              END
          END`;
              
          db.query(codigoTriggerUpdate, function (err, result){
            if (err)
              throw err;
    
            console.log('TRIGGER UPDATE_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
            gravarLog('TRIGGER UPDATE_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
          });
    
          db.detach();
          resolve();
      })

    } catch (error) {
      reject(error);
    }
  })
}


async function configurarEconsultarDependenciasSQL(){
  return new Promise(async(resolve, reject) => {
    try {
  
  

    } catch (error) {
      reject(error)
    }
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
            
            // ABERTURA DO ARQUIVO DE PRODUTOS
            const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      
            result.forEach(async (row) => {
              const { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, VALOR_COMPRA } = row;
              await tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA)
              .then(response => {
                dados.produtos.ID_PRODUTO = response;
              })
            });
            fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados));
        })
      })  

      resolve();
    }
    catch(error){
      reject();
    }
  })
}


async function tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA){
  return new Promise(async (resolve, reject) => {
    try {
      // VERIFICA SE O PRODUTO EXISTE NO BANCO DE PRODUTOS NUVEM
      if (dados.produtos[ID_PRODUTO]){
        // [...] AQUI DEVE SER PROSSEGUIDO COM A TRATATIVA DE ALTERAÇÃODE UM PRODUTO OU DELETE
      }
      else{
        await cadastrarProdutoNuvem(PRODUTO, ESTOQUE, VALOR_VENDA)
        .then(response => {
            if (response.error) {
                // [...] CASO OCORRA ISTO DEVERÁ ABRIR O POP UP POSTERIORMENTE
                console.log('Erro ao cadastrar produto:', PRODUTO);
            } else {
                // [CADASTRO BEM SUCEDIDO NA PLATAFORMA]
               resolve(response.id);
            }
        })
        .catch((err) => {
            console.log('Erro ao cadastrar o produto de ID:', ID_PRODUTO);
        });
      }
    } catch (error) {
        reject(error)
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

/*

AFTER INSERT NA TABELA PRODUTOS:
AS
begin
  INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, idproduto) VALUES ('CADASTRO', 'cadastrado', NEW.id_produto);
end

NOME DA TRIGGER INSERT_HOSTSYNC



AFTER UPDATE NA TABELA PRODUTOS:
AS
begin
  INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, idproduto) VALUES ('ATUALIZACAO', 'atualizado', NEW.id_produto);
end

NOME DA TRIGGER UPDATE_HOSTSYNC


*/ 