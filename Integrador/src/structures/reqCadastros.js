process.stdin.setEncoding('utf-8');

/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const fs = require('fs');
const conexao = require('node-firebird');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');
const { tratativaDeProdutosNuvem, tratativaDeCategoriasNuvem, tratativaDeSubCategoriasNuvem, tratativaDeVariacaoNuvem, novoRegistroProdutoNuvem } = require('./configNuvem');
const { criarTabela, criarTriggerUpdateProduto, criarTriggerInsertProduto, criarTriggerInsertGrupo, criarTriggerUpdateGrupo, criarTriggerInsertSubGrupo, criarTriggerUpdateSubGrupo, criarTriggerInsertVariacao, criarTriggerUpdateVariacao, criarTriggerDeleteVariacao, criarTriggerInsertGrade, criarTriggerUpdateGrade, criarTriggerDeleteGrade } = require('./dependenciasSQL');
const { rejects } = require('assert');

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
  //.then(async () => { 
    //await sincronizacaoInicialVariantes();
  //})
  .then(async () => {
    hello();
    await sincronizarBanco();
  })
  .catch(() => {
    console.log('Terminal do erro');
  })
}



/**
 * FUNÇÃO RESPONSAVEL POR FAZER A LEITURA RECORRENTE DA TABELA DE NOTIFICAÇÕES DO SISTEMA E APLICAR O TRATAMENTO NECESSÁRIO
 */
async function sincronizarBanco(){
  conexao.attach(config, function (err, db) {
    if (err)
      throw err;
 
    db.query('SELECT COUNT(*) AS numeroRegistros FROM NOTIFICACOES_HOSTSYNC', function (err, result) {
      if (err)
        throw err;

      let totalRegistros = result[0].NUMEROREGISTROS;

      if (totalRegistros > 0) {
        db.query('SELECT FIRST 1 TIPO as tabela, OBS AS obsproduto, IDITEM AS id FROM NOTIFICACOES_HOSTSYNC', async function (err, resultNotificacao) {
          if (err)
            console.log(err);

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
                await novoRegistroProdutoNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, DESCRICAO_COMPLEMENTAR, GRUPO, SUBGRUPO, BARRAS)
              }) 
              break;
          

            case "VARIACAO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  break;
                
                case "ATUALIZADO":
                  break;

                case "DELETADO":
                  break;

              }
              break;


            case "GRADE":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  await cadastrarGrade(idRegistro)
                  break;
                
                case "ATUALIZADO":
                  await cadastrarGrade(idRegistro)
                  break;

                case "DELETADO":
                  break;

              }
              break;


            case "GRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  break;
                
                case "ATUALIZADO":
                  break;

                case "DELETADO":
                  break;

              }
              break;


            case "SUBGRUPO":
              switch (obsDoRegistro) {
                case "CADASTRADO":
                  break;
                
                case "ATUALIZADO":
                  break;

                case "DELETADO":
                  break;

              }
              break;

            default:
              console.log('ERRO FATAL CRÍTICO, ENTRE IMEDIATAMENTE EM CONTATO COM DESENVOLVIMENTO, O INTEGRADO POSSIVELMENTE NÃO ESTÁ EM FUNCIONAMENTO DE FORMA ADEQUADA')
              break;
          }

      
          db.query('DELETE FROM NOTIFICACOES_HOSTSYNC WHERE IDITEM = ?', [idProdutoRegistro]);
          setTimeout(sincronizarBanco, 5000);
        });
      } else {
        console.log('Nenhum registro encontrado para leitura.');
        gravarLog('Nenhum registro encontrado para leitura.');
        db.detach(function (err) {
          if (err)
            throw err;
          setTimeout(sincronizarBanco, 5000);
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





async function deletarGrade(ID){
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
  
                  if(ESTOQUE>=0){
                    await tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, DESCRICAO_COMPLEMENTAR, GRUPO, SUBGRUPO, BARRAS)
                    .catch(() => {
                      gravarlog(`O PRODUTO ${PRODUTO} NÃO FOI CADASTRADO DEVIDO A UM ERRO, ENTRE EM CONTATO COM SUPORTE TÉCNICO`) 
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



async function sincronizacaoInicialVariantes() {
  return new Promise(async(resolve, reject) => {
    try {
      const grades = JSON.parse(fs.readFileSync('./src/build/nuvem/grades.json', 'utf8'));
      const produtos = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
      conexao.attach(config, function(err, db){
        if(err)
          throw err;

        db.query('SELECT ID_PRODUTO, ID_GRADE, ESTOQUE FROM PRODUTOS_GRADE_ITENS', async function (err, result){
          db.detach();

          if(err)
            throw err;

          for(const row of result){
            const { ID_PRODUTO, ID_GRADE, ESTOQUE } = row;

            if((grades[ID_GRADE]) && (produtos.produtos[ID_PRODUTO])){
              let idNuvem = produtos.produtos[ID_PRODUTO];
              let nomeGrade = grades[ID_GRADE]['NOME'];


              if(grades[ID_GRADE].PRODUTOS[idNuvem]){
                console.log('PRODUTO JA POSSUI ESTA VARIACAO')
              }
              else{
                if(ESTOQUE<0){
                  console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO AO ESTOQUE ESTAR NEGATIVADO`)
                }
                else{
                  await tratativaDeVariacaoNuvem(nomeGrade, idNuvem, ESTOQUE)
                  .then(response => {
                    console.log(response)
                  })
                }
              }
            }
            else{
              console.log(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
              gravarLogErro(`A VARIAÇÃO DE ID ${ID_GRADE} DO PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO PRODUTO OU GRADE `)
            }

          }
        })
        
      })

      resolve()
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

esqueletoDoSistema()

module.exports = { 
  esqueletoDoSistema
}
