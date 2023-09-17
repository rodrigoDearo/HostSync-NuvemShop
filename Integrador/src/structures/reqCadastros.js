/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const conexao = require('node-firebird');
const path = require('path');
const { exec } = require('child_process');
const _ = require('lodash');
const iconv = require('iconv-lite');

const { retornaCampo } = require('./manipulacaoJSON');
const { tratativaDeProdutosNuvem, tratativaDeCategoriasNuvem, tratativaDeSubCategoriasNuvem,deletarVariacao, alterarSubCategoriaNuvem, atualizarVariacao, tratativaDeVariacaoNuvem, novoRegistroProdutoNuvem, deletarCategoriaNuvem, alterarCategoriaNuvem } = require('./configNuvem');
const { criarTabela, criarGeneratorID, criarTriggerUpdateProduto, criarTriggerInsertProduto, criarTriggerInsertGrupo, criarTriggerUpdateGrupo, criarTriggerDeleteGrupo, criarTriggerInsertSubGrupo, criarTriggerUpdateSubGrupo, criarTriggerDeleteSubGrupo, criarTriggerInsertVariacao, criarTriggerUpdateVariacao, criarTriggerDeleteVariacao, criarTriggerInsertGrade, criarTriggerUpdateGrade, criarTriggerDeleteGrade } = require('./dependenciasSQL');

var caminho, config, hora = 0;



/**
 * FUNÇÃO RESPONSÁVEL POR ESTRUTURAR O SEQUENCIAMENTO DO PROGRAMA
 */
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
      await criarTabela(config)
      .then(async () => {
        await criarGeneratorID(config);
      })
      .then(async () => {
        await criarTriggerInsertProduto(config);
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
        await criarTriggerDeleteGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerUpdateSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerDeleteSubGrupo(config);
      })
      .then(async () => {
        await criarTriggerInsertVariacao(config);
      })
      .then(async () => {
        await criarTriggerUpdateVariacao(config);
      })
      .then(async () => {
        await criarTriggerDeleteVariacao(config);
      })
      .then(async () => {
        await criarTriggerInsertGrade(config)
      })
      .then(async () => {
        await criarTriggerUpdateGrade(config);
      })
      .then(async () => {
        await criarTriggerDeleteGrade(config)
      })
      .catch(() => {
        console.log('Erro ao criar/verificar as dependências SQL necessárias no banco FDB. Consultar o desenvolvedor do sistema com URGÊNCIA');
        gravarLogErro('Erro ao criar/verificar as dependências SQL necessárias no banco FDB. Consultar o desenvolvedor do sistema com URGÊNCIA');
      })
  })
  .then(async () => {
    await sincronizacaoInicialGrades();
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
  .then(async () => { 
    await sincronizacaoInicialVariantes();
  })
  .then(async () => {
    hello();
    await sincronizarBanco();
  })
  .catch(() => {
    console.log('Terminal do erro');
  })
}



async function funcaoAtualizarTodasVariacoesProduto(variantes){
  
}



/**
 * FUNÇÃO RESPONSAVEL POR FAZER A LEITURA RECORRENTE DA TABELA DE NOTIFICAÇÕES DO SISTEMA E APLICAR O TRATAMENTO NECESSÁRIO
 */
async function sincronizarBanco(){
  const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));

  conexao.attach(config, function (err, db) {
    if (err)
      throw err;
 
    db.query('SELECT COUNT(*) AS numeroRegistros FROM NOTIFICACOES_HOSTSYNC', function (err, result) {
      if (err)
        throw err;

      let totalRegistros = result[0].NUMEROREGISTROS;

      if (totalRegistros > 0) {
        db.query('SELECT FIRST 1 ID as row, TIPO as tabela, OBS AS obsproduto, IDITEM AS id FROM NOTIFICACOES_HOSTSYNC', async function (err, resultNotificacao) {
          if (err)
            console.log(err);

          let registroLido = resultNotificacao[0].ROW
          let tabelaRegistro = resultNotificacao[0].TABELA;
          let obsDoRegistro = resultNotificacao[0].OBSPRODUTO;
          let idRegistro = resultNotificacao[0].ID;


          switch (tabelaRegistro) {
            case "PRODUTO":
              db.query(`SELECT ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, DESCRICAO_COMPLEMENTAR, FOTO, STATUS, MARCA, GRUPO, SUBGRUPO, GRADE, BARRAS FROM PRODUTOS WHERE ID_PRODUTO=${idRegistro}`, async function (err, result) {
                db.detach();
                if (err)
                    throw err;
    
                const { ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, DESCRICAO_COMPLEMENTAR, FOTO, STATUS, MARCA, GRUPO, SUBGRUPO, GRADE, BARRAS } = result[0];
                if(dados.produtos[ID_PRODUTO]!=undefined){
                  const variantes = dados.produtos[ID_PRODUTO].variantes;

                  for (const varianteId in variantes) {
                    novaAlteracaoVariacao(varianteId)
                  }
                }

                await novoRegistroProdutoNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, DESCRICAO_COMPLEMENTAR, GRUPO, SUBGRUPO, BARRAS)
                
              }) 
              break;
          

            case "VARIACAO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  await novoCadastroVariacao(idRegistro)
                  break;
                
                case "ATUALIZADO":
                  await novaAlteracaoVariacao(idRegistro)
                  break;

                case "DELETADO":
                  await novoDelete(idRegistro)
                  break;

              }
              break;


            case "GRADE":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  await cadastrarGrade(idRegistro)
                  break;
                
                case "ATUALIZADO":
                  
                  break;

                case "DELETADO":
                  await deletarGrade(idRegistro)
                  break;

              }
              break;


            case "GRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  await novoCadastroGrupo(idRegistro)
                  break;
                
                case "ATUALIZADO":
                  await novaAlteracaoGrupo(idRegistro)
                  break;

                case "DELETADO":
                  await novoDeleteGrupo(idRegistro)
                  break;

              }
              break;


            case "SUBGRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  await novoCadastroSubGrupo(idRegistro)
                  break;
                
                case "ATUALIZADO":
                  await novaAlteracaoSubGrupo(idRegistro)
                  break;

                case "DELETADO":
                  await novoDeleteSubGrupo(idRegistro)
                  break;

              }
              break;

            default:
              console.log('ERRO FATAL CRÍTICO, ENTRE IMEDIATAMENTE EM CONTATO COM DESENVOLVIMENTO, O INTEGRADO POSSIVELMENTE NÃO ESTÁ EM FUNCIONAMENTO DE FORMA ADEQUADA')
              break;
          }

          db.query(`DELETE FROM NOTIFICACOES_HOSTSYNC WHERE ID = ${registroLido}`);
          setTimeout(sincronizarBanco, 5000);
  
          
        });
      } else {
        console.log('Nenhum registro encontrado para leitura.');
        gravarLog('Nenhum registro encontrado para leitura.');
        db.detach(function (err) {
          if (err)
            throw err;
          setTimeout(sincronizarBanco, 3000);
        });
      }
    });
  });
}


function hello(){
  console.log(`Ola, estou rodando a ${hora} horas`)
  gravarLog(`Ola, estou rodando a ${hora} horas`);
  hora++
  setTimeout(hello, 3600000)
}










//    #####    ####    ##   ##    ####             ####    ##   ##   ####      ####    ####      ##     ####
//   ##   ##    ##     ###  ##   ##  ##             ##     ###  ##    ##      ##  ##    ##      ####     ##
//   #          ##     #### ##  ##                  ##     #### ##    ##     ##         ##     ##  ##    ##
//    #####     ##     ## ####  ##                  ##     ## ####    ##     ##         ##     ##  ##    ##
//        ##    ##     ##  ###  ##                  ##     ##  ###    ##     ##         ##     ######    ##   #
//   ##   ##    ##     ##   ##   ##  ##             ##     ##   ##    ##      ##  ##    ##     ##  ##    ##  ##
//    #####    ####    ##   ##    ####             ####    ##   ##   ####      ####    ####    ##  ##   #######


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
  
                const PRODUTO_UTF8 = iconv.decode(PRODUTO, 'ISO-8859-1').toString('utf8');

                  if(ESTOQUE>=0){
                    await tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO_UTF8, ESTOQUE, VALOR_VENDA, FOTO, STATUS, DESCRICAO_COMPLEMENTAR, GRUPO, SUBGRUPO, BARRAS)
                    .catch(() => {
                      gravarLog(`O PRODUTO ${PRODUTO_UTF8} NÃO FOI CADASTRADO DEVIDO A UM ERRO, ENTRE EM CONTATO COM SUPORTE TÉCNICO`) 
                      // ERRO AO CADASTRAR PRODUTO - retornar POP-UP
                    })
                  }
                  else{
                    gravarLog(`O PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADO DEVIDO A ESTOQUE NEGATIVO`);
                    // FALHA AO CADASTRAR PRODUTO - retornar POP UP
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



/**
 * FUNÇÃO RESPONSÁVEL POR SALVAR NO ARQUIVO JSON TODA A RELAÇÃO DE ID D OHOST COM O NOME DA GRADE NO HOST 
 */
async function sincronizacaoInicialGrades(){
  return new Promise(async (resolve, reject) => {
    const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
    try {
      conexao.attach(config, function(err, db){
        if(err)
          throw err

        db.query('SELECT ID, GRADE FROM GRADE', async function(err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID, GRADE } = row;

            if(grades[ID]){
              console.log(`GRADE ${GRADE} JA EXISTE`)
            }
            else{
              grades[ID] = {
                "NOME": GRADE,
                "PRODUTOS": {

                }
              }
            }

            fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades));
            console.log('ADICIONADO AO ARQUIVO A GRADE: ' + GRADE)
          }
        })
      })
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}


/**
 * FUNÇÃO RESPONSÁVEL POR FAZER A CARGA INICIAL DE GRUPOS
 */
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
                await tratativaDeCategoriasNuvem(ID, GRUPO)
              }

              resolve();
          })
        })
    } catch (error) {
        reject(error)
    }
  })
}


/**
 * FUNÇÃO RESPONSÁVEL POR FAZER A CARGA INICIAL DE SUBGRUPOS
 */
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


async function retornaPrecoId(id){
  return new Promise(async (resolve, reject) => {
    try {
      conexao.attach(config, function(err, db){
        if(err)
          throw err 

        db.query(`SELECT VALOR_VENDA as preco FROM PRODUTOS WHERE ID_PRODUTO=${id}`, async function (err, result){
          db.detach()

          if(err)
            throw err

          let preco = result[0].PRECO;
          resolve(preco)
        })
      })


    } catch (error) {
      reject(error)
    }
  })
}


async function sincronizacaoInicialVariantes() {
  return new Promise(async(resolve, reject) => {
    try {
      const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
      const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query('SELECT ID, ID_PRODUTO, ID_GRADE, ESTOQUE FROM PRODUTOS_GRADE_ITENS', async function (err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID, ID_PRODUTO, ID_GRADE, ESTOQUE } = row;

            if((grades[ID_GRADE]) && (dados.produtos[ID_PRODUTO])){
              let idNuvem = dados.produtos[ID_PRODUTO].id;
              let nomeGrade = grades[ID_GRADE]['NOME'];

              if(grades[ID_GRADE].PRODUTOS[ID_PRODUTO]){
                console.log('PRODUTO JA POSSUI ESTA VARIACAO')
              }
              else{
                if(ESTOQUE<0){
                  console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                  gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                }
                else{
                  await retornaPrecoId(ID_PRODUTO)
                  .then(async preco => {
                      await tratativaDeVariacaoNuvem(ID, nomeGrade, idNuvem, ID_PRODUTO, ESTOQUE, preco)
                      .then(response => {
                        grades[ID_GRADE].PRODUTOS[ID_PRODUTO] = response;
                        fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades, null, 2));
                    })
                  })
                }
              }
            }
            else{
              console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
              gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
            }
          }

          resolve()
        })
        
      })
    } catch (error) {
      reject(error)
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


async function novoCadastroGrupo(id){
  return new Promise(async (resolve, reject) => {
    try {
      
      conexao.attach(config, function(err, db){
        if(err)
          throw err

        db.query(`SELECT GRUPO FROM PRODUTOS_GRUPO WHERE ID=${id}`, async function(err, result){
          if(err)
            throw (err) // O GRUPO DO ID REFERENCIADO QUE ALEGA TER SIDO CADASTRADO NÃO CONSTA 

          db.detach()

          for(const row of result){
            const { GRUPO } = row;
            await tratativaDeCategoriasNuvem(id, GRUPO)
          }
  

        })
      })

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}


async function novaAlteracaoGrupo(id){
  return new Promise(async (resolve, reject) => {
    try {
      
      conexao.attach(config, function(err, db){
        if(err)
          throw err

          db.query(`SELECT GRUPO FROM PRODUTOS_GRUPO WHERE ID=${id}`, async function(err, result){
            if(err)
              throw (err) // O GRUPO DO ID REFERENCIADO QUE ALEGA TER SIDO CADASTRADO NÃO CONSTA 
  
            db.detach()
  
            for(const row of result){
              const { GRUPO } = row;
              await alterarCategoriaNuvem(id, GRUPO)
            }
    
  
          })
      })

      resolve()
    } catch (error) {
      reject(error);
    }
  })
}


async function novoDeleteGrupo(idHost){
  return new Promise(async (resolve, reject) => {
    try {
      const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));
      
      let idNuvem = categoriasjson.categorias[idHost]['id'];

      if(idNuvem==null){
        //registro nao existe por algum motivo, POP UP
      }
      else{
        await deletarCategoriaNuvem(idNuvem)
        .then(() => {
          delete categoriasjson.categorias[idHost];
          fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
        })

      }
      
      resolve()
    } catch (error) {
      reject(error)
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


async function novoCadastroSubGrupo(idHost){
  return new Promise(async (resolve, reject) => {
    try {
      
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query(`SELECT ID_GRUPO, SUBGRUPO FROM PRODUTOS_SUBGRUPO WHERE ID=${idHost}`, async function(err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID_GRUPO, SUBGRUPO } = row;
            await tratativaDeSubCategoriasNuvem(idHost, ID_GRUPO, SUBGRUPO);
          }

          resolve();
        })

      })

    } catch (error) {
      reject(error)
    }
  })
}


async function novaAlteracaoSubGrupo(idHost){
  return new Promise(async (resolve, reject) => {
    try {
      
      conexao.attach(config, function(err, db){
        if(err)
          throw err

          db.query(`SELECT ID_GRUPO, SUBGRUPO FROM PRODUTOS_SUBGRUPO WHERE ID=${idHost}`, async function(err, result){
            if(err)
              throw (err) // O GRUPO DO ID REFERENCIADO QUE ALEGA TER SIDO CADASTRADO NÃO CONSTA 
  
            db.detach()
  
            for(const row of result){
              const { ID_GRUPO, SUBGRUPO } = row;
              await alterarSubCategoriaNuvem(ID_GRUPO, idHost, SUBGRUPO);
            }
    
            resolve()
          })
      })

    } catch (error) {
      reject(error);
    }
  })
}


async function novoDeleteSubGrupo(idHost){
  return new Promise(async (resolve, reject) => {
    try {
      const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

      let idGrupo = _.findKey(categoriasjson.categorias, (categoria) => {
        return categoria.subcategorias && categoria.subcategorias[idHost];
      });
      
      let idNuvem = categoriasjson.categorias[idGrupo].subcategorias[idHost];
      
      if((idNuvem==null)||(!idNuvem)||(idNuvem==undefined)||(!idGrupo)){
        console.log("registro nao existe por algum motivo, POP UP")
      }
      else{
        await deletarCategoriaNuvem(idNuvem)
        .then(() => {
          delete categoriasjson.categorias[idGrupo].subcategorias[idHost];
          fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
          resolve()
        })
      
      }
    
    } catch (error) {
      reject(error)
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


async function deletarGrade(ID){
  return new Promise(async (resolve, reject) => {
    const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
    try {
      

      delete grades[ID]

      fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades));
      console.log('DELETADO DO ARQUIVO A GRADE DE ID: ' + ID);
      gravarLog('DELETADO DO ARQUIVO A GRADE DE ID: ' + ID)
    
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}


async function cadastrarGrade(ID){
  return new Promise(async (resolve, reject) => {
    const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
    try {
      conexao.attach(config, function(err, db){
        if(err)
          throw err

        db.query(`SELECT GRADE FROM GRADE WHERE ID=${ID}`, async function(err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { GRADE } = row;
            grades[ID] = {
              "NOME": GRADE,
              "PRODUTOS": {

              }
            }

            fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades));
            console.log('ADICIONADO AO ARQUIVO A GRADE: ' + GRADE)
          }
        })
      })
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}


async function novaAlteracaoGrade(idGrade){
  return new Promise(async (resolve, reject) => {
    try {
      const dadosGrades = JSON.parse(fs.readFileSync('./src/bulid/nuvem/grades.json', 'utf-8'));
      const dadosProdutos = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf-8'))
    } catch (error) {
      reject(error)
    }
  })
}


// EM DESENVOLVIMENTO
async function novoDeleteGrade(idGrade){
  return new Promise(async (resolve, reject) => {
    try {
      const dadosGrades = JSON.parse(fs.readFileSync('./src/bulid/nuvem/grades.json', 'utf-8'));
      const dadosProdutos = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf-8'))
      
      const variantes = dadosGrades[idGrade].PRODUTOS;

      for (const varianteId in variantes) {


        deletarVariacao(idProdutoNuvem, idDaVarianteNuvem)
        .then(() => {
          delete dadosGrades[idGrade].PRODUTOS[`${idProdutoHost}`]
          fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades));
        })
        .then(() => {
          delete dadosProdutos[`${idProdutoHost}`].variantes;
        })
      }

    } catch (error) {
      reject(error)
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


function novoCadastroVariacao(idVariacao){
  return new Promise(async(resolve, reject) => {
    try {
      const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
      const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query(`SELECT ID_PRODUTO, ID_GRADE, ESTOQUE FROM PRODUTOS_GRADE_ITENS WHERE ID=${idVariacao}`, async function (err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID_PRODUTO, ID_GRADE, ESTOQUE } = row;

            if((grades[ID_GRADE]) && (dados.produtos[ID_PRODUTO])){
              let idNuvem = dados.produtos[ID_PRODUTO].id;
              let nomeGrade = grades[ID_GRADE]['NOME'];

              if(grades[ID_GRADE].PRODUTOS[ID_PRODUTO]){
                console.log('PRODUTO JA POSSUI ESTA VARIACAO')
              }
              else{
                if(ESTOQUE<0){
                  console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                  gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                }
                else{
                  await retornaPrecoId(ID_PRODUTO)
                  .then(async preco => {
                      await tratativaDeVariacaoNuvem(idVariacao, nomeGrade, idNuvem, ID_PRODUTO, ESTOQUE, preco)
                      .then((response) => {
                      grades[ID_GRADE].PRODUTOS[ID_PRODUTO] = response;
                    })
                  })
                }
              }
            }
            else{
              console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
              gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
            }
            fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades, null, 2));
          }

          resolve()
        })
        
      })
    } catch (error) {
      reject(error)
    }
  })
}


async function novaAlteracaoVariacao(idVariacao){
  return new Promise((resolve, reject) => {
    try {
      const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
      const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query(`SELECT ID_PRODUTO, ID_GRADE, ESTOQUE FROM PRODUTOS_GRADE_ITENS WHERE ID=${idVariacao}`, async function (err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID_PRODUTO, ID_GRADE, ESTOQUE } = row;

            if((grades[ID_GRADE]) && (dados.produtos[ID_PRODUTO])){
              let idNuvem = dados.produtos[ID_PRODUTO].id;
              let idVariacaoNuvem = dados.produtos[ID_PRODUTO].variantes[idVariacao]
             

              if(grades[ID_GRADE].PRODUTOS[ID_PRODUTO]){
                if(ESTOQUE<0){
                  console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI ALTERADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                  gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI ALTERADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                }
                else{
                  retornaPrecoId(ID_PRODUTO)
                  .then(async preco => {
                      await atualizarVariacao(idVariacaoNuvem, idNuvem, ESTOQUE, preco)
                  })
                }
              }
              else{
                console.log('PRODUTO  POSSUI ESTA VARIACAO')
              }
            }
            else{
              console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI ALTERADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
              gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI ALTERADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
            }
            fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades, null, 2));
          }

          resolve()
        })
        
      })
    } catch (error) {
      reject(error)
    }
  })
}


function encontrarInformacoesVariacao(json, idVariacaoHost) {
  const produtoEncontrado = _.find(json.produtos, (produto) => {
    return produto.variantes.hasOwnProperty(idVariacaoHost);
  });
  
  if (produtoEncontrado) {
    const idProdutoNuvem = produtoEncontrado.id;
    const idVariacaoNuvem = produtoEncontrado.variantes[idVariacaoHost];
    const idProdutoHost = _.findKey(json.produtos, produtoEncontrado);
    
    return {
      idProdutoNuvem,
      idVariacaoNuvem,
      idProdutoHost
    };
  }
  
  return null; // Se não encontrar correspondência, retorne null ou outra indicação de que não foi encontrado.
}


function encontrarIdGradePorVariacao(json, idProdutoHost) {
  const produtoEncontrado = _.find(json, (grade) => {
    return grade.PRODUTOS.hasOwnProperty(idProdutoHost);
  });

  if (produtoEncontrado) {
    const idGradeHost = _.findKey(json, produtoEncontrado);
    
    return idGradeHost
  }
}
  

async function novoDelete(idVariacaoHost){
  return new Promise(async (resolve, reject) => {
    try {
      const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
      const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      
      const dadosProdutos = encontrarInformacoesVariacao(dados, idVariacaoHost);
      let idProdutoNuvem = dadosProdutos.idProdutoNuvem;
      let idDaVarianteNuvem = dadosProdutos.idVariacaoNuvem;
      let idProdutoHost = dadosProdutos.idProdutoHost;

      const idGradeHost = encontrarIdGradePorVariacao(grades, idProdutoHost);

      if (idDaVarianteNuvem) {
        await deletarVariacao(idProdutoNuvem, idDaVarianteNuvem)
        .then(() => {
          delete dados.produtos[`${idProdutoHost}`].variantes[`${idVariacaoHost}`];
          fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados, null, 2));
        })
        .then(() => {
          delete grades[`${idGradeHost}`].PRODUTOS[`${idProdutoHost}`];
          fs.writeFileSync('./src/build/nuvem/grades.json', JSON.stringify(grades, null, 2));
        })
      } else {
        console.log(`A variante ${idVariacaoHost} não foi encontrada em nenhum produto.`);
        resolve()
      }

        
  
    } catch (error) {
      reject(error)
    }
  })
}










//  ####      #####     ####    #####
//   ##      ##   ##   ##  ##  ##   ##
//   ##      ##   ##  ##       #
//   ##      ##   ##  ##        #####
//   ##   #  ##   ##  ##  ###       ##
//   ##  ##  ##   ##   ##  ##  ##   ##
//  #######   #####     #####   #####


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
    }
  });
}



function iniciarElectron(){
  const electronAppPath = path.join(__dirname, '../../../visualIntegrador');

  // Comando para iniciar o Electron a partir da pasta do seu programa Electron
  const startElectronCommand = 'npm start';
  
  // Executa o comando para iniciar o Electron
  const electronProcess = exec(startElectronCommand, { cwd: electronAppPath });
  
  electronProcess.stdout.on('data', (data) => {
    console.log(`Saída do Electron: ${data}`);
  });
  
  electronProcess.stderr.on('data', (data) => {
    console.error(`Erro do Electron: ${data}`);
  });
  
  electronProcess.on('close', (code) => {
    console.log(`O processo Electron foi encerrado com código ${code}`);
  });
}

iniciarElectron()
esqueletoDoSistema()





/*

CRIAR TRIGGERS PARA GRUPO E SUBRGRUPO, MARCAS E QUALQIER CHAVE ESTRANGEIRA

LER PRIMEIRO CHAVES ESTRANGEIRAS E DEPOIS PRODUTOS
VER GRADE NA NUVEM


TENTAR ARRUMAR IPCRENDERER E MECHER COM POP UP
VER PRA HOMOLGOAR


DAR AÇÃO PARA O NOTIFICAO_HOSTSYNC
PLANEJAR MELHOR O ESQUELETO DO SISTEMA PARA DIFERENTES OCASIÕES
VER VISUAL


// ARRUMAR QUANDO COLOCAR VARIANTS, ARRUMAR EXCLUSAO DE REGISTRO
// ARRUMAR RETORNOS, ARRUMAR PARA PROGRAMA CONTINUAR RODANDO

*/ 

//esqueletoDoSistema()



/*
ta sendo chamado função de grupo para um subgrupo do notificacoes
comentar codigo
*/ 