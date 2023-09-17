process.stdin.setEncoding('utf-8');

/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const conexao = require('node-firebird');


/**
 * ESSA FUNÇÃO CRIA EM CASO DE AUSÊNCIA, UM GERADOR DE ID A SER USADO NA TABELA NOTIFICACOES_HOSTSYNC
 * @param {*} config 
 * @returns 
 */
async function criarGeneratorID(config){
  return new Promise(async (resolve, reject) => {
    try {
      
      conexao.attach(config, function (err, db){
        if(err)
          throw err

        let codigo = `EXECUTE BLOCK
        AS
        BEGIN
            IF (NOT EXISTS (
                SELECT 1
                FROM RDB$GENERATORS
                WHERE RDB$GENERATOR_NAME = 'GEN_NOTIFICACOES_HOSTSYNC_ID'
            ))
            THEN
            BEGIN
                EXECUTE STATEMENT 'CREATE SEQUENCE GEN_NOTIFICACOES_HOSTSYNC_ID';
            END
        END
        `;

        db.query(codigo, function (err, result){
          if (err)
            throw err;

          console.log('GERADOR DE ID GEN_NOTIFICACOES_HOSTSYNC_ID FOI CRIADA EM CASO DE AUSÊNCIA');
          resolve();
        })

        db.detach();
      })

    } catch (error) {
      reject(error)
    }
  })
}


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
                      ID INTEGER NOT NULL PRIMARY KEY,
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
            resolve();
          })
  
          db.detach();
        })
      } catch (error) {
        reject(error);
      }
    })
  }
  
  








//  ######   ######    #####   #####    ##   ##  ######    #####
//   ##  ##   ##  ##  ##   ##   ## ##   ##   ##  # ## #   ##   ##
//   ##  ##   ##  ##  ##   ##   ##  ##  ##   ##    ##     ##   ##
//   #####    #####   ##   ##   ##  ##  ##   ##    ##     ##   ##
//   ##       ## ##   ##   ##   ##  ##  ##   ##    ##     ##   ##
//   ##       ##  ##  ##   ##   ## ##   ##   ##    ##     ##   ##
//  ####     #### ##   #####   #####     #####    ####     #####


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
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''PRODUTO'', ''CADASTRADO'', NEW.id_produto);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_PRODUTO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
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
                        INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''PRODUTO'', ''ATUALIZADO'', NEW.id_produto);
                    END';
                END
            END`;
                
            db.query(codigoTriggerUpdate, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER UPDATE_PRODUTO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
              resolve();
            });
      
            db.detach();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }










//    ####   ######   ##   ##  ######    #####
//   ##  ##   ##  ##  ##   ##   ##  ##  ##   ##
//  ##        ##  ##  ##   ##   ##  ##  ##   ##
//  ##        #####   ##   ##   #####   ##   ##
//  ##  ###   ## ##   ##   ##   ##      ##   ##
//   ##  ##   ##  ##  ##   ##   ##      ##   ##
//    #####  #### ##   #####   ####      #####


  async function criarTriggerInsertGrupo(config){
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
                  WHERE RDB$TRIGGER_NAME = 'INSERT_GRUPO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER INSERT_GRUPO_HOSTSYNC FOR PRODUTOS_GRUPO
                  ACTIVE AFTER INSERT POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRUPO'', ''CADASTRADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_GRUPO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerUpdateGrupo(config){
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
                    WHERE RDB$TRIGGER_NAME = 'UPDATE_GRUPO_HOSTSYNC'
                ))
                THEN
                BEGIN
                    EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_GRUPO_HOSTSYNC FOR PRODUTOS_GRUPO
                    ACTIVE AFTER UPDATE POSITION 0
                    AS
                    BEGIN
                        INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRUPO'', ''ATUALIZADO'', NEW.ID);
                    END';
                END
            END`;
                
            db.query(codigoTriggerUpdate, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER UPDATE_GRUPO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
              resolve();
            });
      
            db.detach();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerDeleteGrupo(config){
    return new Promise(async(resolve, reject) => {
      try {
        
        // CONEXAO ABERTA NOVAMENTE PARA ESTAR ATUALIZADA COM A TABELA CRIADA, USADA PARA CRIAR A TRIGGER INSERT
        conexao.attach(config, function(err, db){
          if (err)
            throw err;
  
            let codigoTriggerDelete = `EXECUTE BLOCK
            AS
            BEGIN
                IF (NOT EXISTS (
                    SELECT 1
                    FROM RDB$TRIGGERS
                    WHERE RDB$TRIGGER_NAME = 'DELETE_GRUPO_HOSTSYNC'
                ))
                THEN
                BEGIN
                    EXECUTE STATEMENT 'CREATE TRIGGER DELETE_GRUPO_HOSTSYNC FOR PRODUTOS_GRUPO
                    ACTIVE AFTER DELETE POSITION 0
                    AS
                    BEGIN
                        INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRUPO'', ''DELETADO'', OLD.ID);
                    END';
                END
            END`;
                
            db.query(codigoTriggerDelete, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER DELETE_GRUPO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
              resolve();
            });
      
            db.detach();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }










//   #####   ##   ##  ######              ####   ######   ##   ##  ######    #####
//  ##   ##  ##   ##   ##  ##            ##  ##   ##  ##  ##   ##   ##  ##  ##   ##
//  #        ##   ##   ##  ##           ##        ##  ##  ##   ##   ##  ##  ##   ##
//   #####   ##   ##   #####            ##        #####   ##   ##   #####   ##   ##
//       ##  ##   ##   ##  ##           ##  ###   ## ##   ##   ##   ##      ##   ##
//  ##   ##  ##   ##   ##  ##            ##  ##   ##  ##  ##   ##   ##      ##   ##
//   #####    #####   ######              #####  #### ##   #####   ####      #####


  async function criarTriggerInsertSubGrupo(config){
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
                  WHERE RDB$TRIGGER_NAME = 'INSERT_SUBGRUPO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER INSERT_SUBGRUPO_HOSTSYNC FOR PRODUTOS_SUBGRUPO
                  ACTIVE AFTER INSERT POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''SUBGRUPO'', ''CADASTRADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_SUBGRUPO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerUpdateSubGrupo(config){
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
                    WHERE RDB$TRIGGER_NAME = 'UPDATE_SUBGRUPO_HOSTSYNC'
                ))
                THEN
                BEGIN
                    EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_SUBGRUPO_HOSTSYNC FOR PRODUTOS_SUBGRUPO
                    ACTIVE AFTER UPDATE POSITION 0
                    AS
                    BEGIN
                        INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''SUBGRUPO'', ''ATUALIZADO'', NEW.ID);
                    END';
                END
            END`;
                
            db.query(codigoTriggerUpdate, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER UPDATE_SUBGRUPO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
              resolve();
            });
      
            db.detach();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerDeleteSubGrupo(config){
    return new Promise(async(resolve, reject) => {
      try {
        
        // CONEXAO ABERTA NOVAMENTE PARA ESTAR ATUALIZADA COM A TABELA CRIADA, USADA PARA CRIAR A TRIGGER INSERT
        conexao.attach(config, function(err, db){
          if (err)
            throw err;
  
            let codigoTriggerDelete = `EXECUTE BLOCK
            AS
            BEGIN
                IF (NOT EXISTS (
                    SELECT 1
                    FROM RDB$TRIGGERS
                    WHERE RDB$TRIGGER_NAME = 'DELETE_SUBGRUPO_HOSTSYNC'
                ))
                THEN
                BEGIN
                    EXECUTE STATEMENT 'CREATE TRIGGER DELETE_SUBGRUPO_HOSTSYNC FOR PRODUTOS_SUBGRUPO
                    ACTIVE AFTER DELETE POSITION 0
                    AS
                    BEGIN
                        INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''SUBGRUPO'', ''DELETADO'', OLD.ID);
                    END';
                END
            END`;
                
            db.query(codigoTriggerDelete, function (err, result){
              if (err)
                throw err;
      
              console.log('TRIGGER DELETE_SUBGRUPO_HOSTSYNC FOI CRIADO EM CASO DE AUSÊNCIA');
              resolve();
            });
      
            db.detach();
        })
  
      } catch (error) {
        reject(error);
      }
    })
  }










//  ##   ##    ##     ######    ####      ##       ####     ##      #####
//  ##   ##   ####     ##  ##    ##      ####     ##  ##   ####    ##   ##
//   ## ##   ##  ##    ##  ##    ##     ##  ##   ##       ##  ##   ##   ##
//   ## ##   ##  ##    #####     ##     ##  ##   ##       ##  ##   ##   ##
//    ###    ######    ## ##     ##     ######   ##       ######   ##   ##
//    ###    ##  ##    ##  ##    ##     ##  ##    ##  ##  ##  ##   ##   ##
//     #     ##  ##   #### ##   ####    ##  ##     ####   ##  ##    #####


  async function criarTriggerInsertVariacao(config){
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
                  WHERE RDB$TRIGGER_NAME = 'INSERT_VARIACAO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER INSERT_VARIACAO_HOSTSYNC FOR PRODUTOS_GRADE_ITENS
                  ACTIVE AFTER INSERT POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''VARIACAO'', ''CADASTRADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_VARIACAO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerUpdateVariacao(config){
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
                  WHERE RDB$TRIGGER_NAME = 'UPDATE_VARIACAO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_VARIACAO_HOSTSYNC FOR PRODUTOS_GRADE_ITENS
                  ACTIVE AFTER UPDATE POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''VARIACAO'', ''ATUALIZADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER UPDATE_VARIACAO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerDeleteVariacao(config){
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
                  WHERE RDB$TRIGGER_NAME = 'DELETE_VARIACAO_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER DELETE_VARIACAO_HOSTSYNC FOR PRODUTOS_GRADE_ITENS
                  ACTIVE AFTER DELETE POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''VARIACAO'', ''DELETADO'', OLD.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER DELETE_VARIACAO_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }









  
//    ####   ######     ##     #####    #######
//   ##  ##   ##  ##   ####     ## ##    ##   #
//  ##        ##  ##  ##  ##    ##  ##   ## #
//  ##        #####   ##  ##    ##  ##   ####
//  ##  ###   ## ##   ######    ##  ##   ## #
//   ##  ##   ##  ##  ##  ##    ## ##    ##   #
//    #####  #### ##  ##  ##   #####    #######


  async function criarTriggerInsertGrade(config){
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
                  WHERE RDB$TRIGGER_NAME = 'INSERT_GRADE_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER INSERT_GRADE_HOSTSYNC FOR GRADE
                  ACTIVE AFTER INSERT POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRADE'', ''CADASTRADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER INSERT_GRADE_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerUpdateGrade(config){
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
                  WHERE RDB$TRIGGER_NAME = 'UPDATE_GRADE_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER UPDATE_GRADE_HOSTSYNC FOR GRADE
                  ACTIVE AFTER UPDATE POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRADE'', ''ATUALIZADO'', NEW.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER UPDATE_GRADE_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }


  async function criarTriggerDeleteGrade(config){
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
                  WHERE RDB$TRIGGER_NAME = 'DELETE_GRADE_HOSTSYNC'
              ))
              THEN
              BEGIN
                  EXECUTE STATEMENT 'CREATE TRIGGER DELETE_GRADE_HOSTSYNC FOR GRADE
                  ACTIVE AFTER DELETE POSITION 0
                  AS
                  BEGIN
                      INSERT INTO NOTIFICACOES_HOSTSYNC (id, tipo, obs, iditem) VALUES (NEXT VALUE FOR GEN_NOTIFICACOES_HOSTSYNC_ID, ''GRADE'', ''DELETADO'', OLD.ID);
                  END';
              END
          END`;
  
          db.query(codigoTriggerInsert, function (err, result){
            if (err)
              throw err;
  
            console.log('TRIGGER DELETE_GRADE_HOSTSYNC FOI CRIADA EM CASO DE AUSÊNCIA');
            resolve();
          });
          
          db.detach();
        });
  
      } catch (error) {
        reject(error);
      }
    })
  }

  module.exports = {
    criarTabela,
    criarGeneratorID,
    criarTriggerUpdateProduto,
    criarTriggerInsertProduto,
    criarTriggerInsertGrupo,
    criarTriggerUpdateGrupo,
    criarTriggerDeleteGrupo,
    criarTriggerInsertSubGrupo,
    criarTriggerUpdateSubGrupo,
    criarTriggerDeleteSubGrupo,
    criarTriggerInsertVariacao,
    criarTriggerUpdateVariacao,
    criarTriggerDeleteVariacao,
    criarTriggerInsertGrade,
    criarTriggerUpdateGrade,
    criarTriggerDeleteGrade
  };