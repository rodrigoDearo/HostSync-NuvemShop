/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const conexao = require('node-firebird');

/**
 * FUNÇÃO RESPONSÁVEL POR CRIAR CASO NÃO EXISTA A TABELA NOTIFICACOES_HOSTSYNC
 * @param {config} config se trata do JSON com as configurações para se conectar com o banco de dados 
 * @returns void 
 */
async function criarTabela(config){
    return new Promise(async(resolve, reject) => {
      try {
        // CONEXAO ABERTA PARA CRIAR TABELA NOTIFICACOES_HOSTSYNC CASO NAO EXISTA
        conexao.attach(config, function(err, db) {
          if (err)
            console.log('Erro ta aqui');
  
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
                      IDITEM  INTEGER
                  )';
              END
          END`
  
          db.query(codigo, function (err, result){
            if (err)
              throw err;
  
            console.log('TABELA NOTIFICACOES_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
          })
  
          db.detach();
          resolve();
        })
      } catch (error) {
        reject(error);
      }
    })
  }
  
  
  async function criarTriggerInsertProduto(config){
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
                  WHERE RDB$TRIGGER_NAME = 'INSERT_PRODUTO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER INSERT_PRODUTO_HOSTSYNC FOR PRODUTOS
                  ACTIVE AFTER INSERT POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, iditem) VALUES (''PRODUTO'', ''CADASTRADO'', NEW.id_produto);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_PRODUTO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
          });
          
          db.detach();
          resolve()
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }
  
  
  async function criarTriggerUpdateProduto(config){
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
                    WHERE RDB$TRIGGER_NAME = 'UPDATE_PRODUTO_HOSTSYNC'
                ))
                THEN
                BEGIN
                    EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_PRODUTO_HOSTSYNC FOR PRODUTOS
                    ACTIVE AFTER UPDATE POSITION 0
                    AS
                    BEGIN
                        INSERT INTO NOTIFICACOES_HOSTSYNC (tipo, obs, iditem) VALUES (''PRODUTO'', ''ATUALIZADO'', NEW.id_produto);
                    END';
                END
            END`;
                
            db.query(codigoTriggerUpdate, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER UPDATE_PRODUTO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
            });
      
            db.detach();
            resolve();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }


  module.exports = {
    criarTriggerUpdateProduto,
    criarTriggerInsertProduto,
    criarTabela
  };