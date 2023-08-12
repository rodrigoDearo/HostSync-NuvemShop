// IMPORTÇÂO DE MÒDULOS
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');
const { response } = require('express');
const { Resolver } = require('dns');

var store_id, config, data, imagemProduto;

async function gerarAccessToken(){
    return new Promise(async(resolve, reject) => {
        try {
            
        }
        catch(error){
            reject(error)
        }
    })
}


async function cadastroImagem(img, caminho){
  return new Promise(async (resolve, reject) => {
    try {
      const imageFilePath = `${caminho}/${img}`;
      const imageData = fs.readFileSync(imageFilePath);

      const base64Image = imageData.toString('base64');
      const data = {
        "filename": img,
        "position": 1,
        "attachment": base64Image
      }
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}


async function definirRequisicaoCadastroProduto(nome, estoque, preco, descricao, categoria){
    return new Promise(async(resolve, reject) => {
        await retornaCampo('app_token')
        .then(response => {
            config = {
                headers: {
                  Authentication: `bearer ${response}`,
                  'User-Agent': `HostSync (7752)`,
                  'Content-Type': 'application/json'
                },
              };
        })
        .then(async () => {
            await retornaCampo('store_id')
            .then(response => {
                store_id = response;
            })
        })
        .then(() => {
            data = {
                name: nome,
                variants: [{
                    price: `${preco}`,
                    stock: estoque
                }],
                description: descricao,
            }
        })
        .then(() => {
            if(categoria != null){
              data.categories = [categoria]
            }
        })
        .then(() => {
            resolve();
        })
    })
}


async function cadastrarCategoriaNuvem(nome){
  return new Promise(async (resolve, reject) => {
    try {
      
      await retornaCampo('app_token')
        .then(response => {
            config = {
                headers: {
                  Authentication: `bearer ${response}`,
                  'User-Agent': `HostSync (7752)`,
                  'Content-Type': 'application/json'
                },
              };
        })
        .then(async () => {
            await retornaCampo('store_id')
            .then(response => {
                store_id = response;
            })
        })
        .then(() => {
            data = {
                name: nome
            }
        })
        .then(() => {
          axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/categories`, data, config)
          .then(response => {
            console.log(`CATEGORIA ${nome} CRIADA COM SUCESSO`);
            gravarLog(`CATEGORIA ${nome} CRIADA COM SUCESSO`)
            resolve(response.data)
          })
        })
        .catch(() => {
          reject(error);
        })

    } catch (error) {
      reject(error)
    }
  })
}


async function cadastrarSubCategoriaNuvem(nome, idGrupo){
  return new Promise(async (resolve, reject) => {
    try {
      
      await retornaCampo('app_token')
        .then(response => {
            config = {
                headers: {
                  Authentication: `bearer ${response}`,
                  'User-Agent': `HostSync (7752)`,
                  'Content-Type': 'application/json'
                },
              };
        })
        .then(async () => {
            await retornaCampo('store_id')
            .then(response => {
                store_id = response;
            })
        })
        .then(() => {
            data = {
                name: nome,
                parent: idGrupo   
            }
        })
        .then(() => {
          axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/categories`, data, config)
          .then(response => {
            console.log(`SUBCATEGORIA ${nome} CRIADA COM SUCESSO`);
            gravarLog(`SUBCATEGORIA ${nome} CRIADA COM SUCESSO`)
            resolve(response.data)
          })
        })
        .catch(() => {
          reject(error);
        })

    } catch (error) {
      reject(error)
    }
  })
}


async function cadastrarProdutoNuvem(nome, estoque, preco, foto, descricao, categoria){
    return new Promise(async (resolve, reject) => {
        try {
            await definirRequisicaoCadastroProduto(nome, estoque, preco, descricao, categoria);

            axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, data, config)
            .then((response) => {
              if(foto!=null){
                retornaCampo('caminho_imagens')
                .then(responseCaminho => {
                  cadastroImagem(foto, responseCaminho)
                  .then(dataEnvio => {
                    axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products/${response.data.id}/images`, dataEnvio, config)
                  })
                })
              }
                resolve(response.data);
            })
            .catch((error) => {
                console.log(error.response.data);
                resolve({ error: true });
            });
        } catch(error) {
            console.error('Error in cadastrarProdutoNuvem:', error);
            // Trate o erro sem rejeitar a Promessa principal.
            resolve({ error: true });
        }
    });
}


async function tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, CARACTERISTICA, GRUPO, SUBGRUPO){
    return new Promise(async (resolve, reject) => {
      try {
        const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));
        const categorias = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));
        let CATEGORIA_PRODUTO;

        if((SUBGRUPO==null)&&(GRUPO=='0')){
          CATEGORIA_PRODUTO == null;
        }
        else if(SUBGRUPO==null){
          CATEGORIA_PRODUTO = categorias.categorias[GRUPO].id;
        }
        else{
          CATEGORIA_PRODUTO = categorias.categorias[GRUPO].subcategorias[SUBGRUPO];
        }

        if(CARACTERISTICA==null){
          CARACTERISTICA = "";
        }

        // VERIFICA SE O PRODUTO EXISTE NO BANCO DE PRODUTOS NUVEM
        if (dados.produtos[ID_PRODUTO]){
          // [...] AQUI DEVE SER PROSSEGUIDO COM A TRATATIVA DE ALTERAÇÃODE UM PRODUTO OU DELETE
          console.log(`${PRODUTO} JA ESTA CADASTRADO, SERA ATUALIZADO`);
        }
        else{
          if(STATUS=='ATIVO'){
            await cadastrarProdutoNuvem(PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, CARACTERISTICA, CATEGORIA_PRODUTO)
            .then(response => {
                if (response.error) {
                    // [...] CASO OCORRA ISTO DEVERÁ ABRIR O POP UP POSTERIORMENTE
                    console.log('Erro ao cadastrar produto:', PRODUTO);
                } else {
                    // [...] CADASTRO BEM SUCEDIDO NA PLATAFORMA
                  console.log(`${PRODUTO} FOI CADASTRADO COM SUCESSO`)
                  dados.produtos[ID_PRODUTO] = response.id;
                  fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados));
                  resolve();
                }
            })
            .catch((err) => {
                console.log('Erro ao cadastrar o produto de ID:', ID_PRODUTO);
            });
          }
          else{
            console.log(`O PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADO POIS SE ENCONTRA INATIVADO OU COM STATUS NÃO ESPERADO`)
            gravarLog(`O PRODUTO DE ID ${ID_PRODUTO} NÃO FOI CADASTRADO POIS SE ENCONTRA INATIVADO OU COM STATUS NÃO ESPERADO`);
            resolve();
          }
      
        }
        
        resolve();

      } catch (error) {
          reject(error)
      }
    })
  }
  
  
  
async function tratativaDeCategoriasNuvem(ID, NOME) {
    try {
        const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

        if (categoriasjson.categorias[ID]) {
            console.log(`CATEGORIA ${NOME} JA ESTA CADASTRADA`);
        } else {
            try {
                const response = await cadastrarCategoriaNuvem(NOME);
                categoriasjson.categorias[ID] = {
                    "id": response.id,
                    "nome": NOME,
                    "subcategorias": {}
                };

                fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
                console.log(`CATEGORIA ${NOME} CADASTRADA COM SUCESSO`);
            } catch (error) {
                console.log(`ERRO AO CRIAR CATEGORIA ${NOME}`);
                gravarLogErro(`ERRO AO CRIAR CATEGORIA ${NOME}`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
  
  
  
  async function tratativaDeSubCategoriasNuvem(ID, ID_GRUPO, SUBGRUPO){
    try {
      const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

      if (!categoriasjson.categorias[ID_GRUPO]) {
          console.log(`SUBCATEGORIA ${SUBGRUPO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO SEU RESPECTIVO GRUPO`)
          gravarLogErro(`SUBCATEGORIA ${SUBGRUPO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO SEU RESPECTIVO GRUPO`);
          reject(`SUBCATEGORIA DE ${SUBGRUPO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO SEU RESPECTIVO GRUPO`);
      } else {
          try {
              if(categoriasjson.categorias[ID_GRUPO].subcategorias[ID]){
                console.log(`SUBCATEGORIA ${SUBGRUPO} JA ESTA CADASTRADA`)
              }
              else{
                let idGrupoNuvem = categoriasjson.categorias[ID_GRUPO].id;
                const response = await cadastrarSubCategoriaNuvem(SUBGRUPO, idGrupoNuvem);
                categoriasjson.categorias[ID_GRUPO].subcategorias[ID] = response.id;

                fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
                console.log(`SUBCATEGORIA ${SUBGRUPO} CADASTRADA COM SUCESSO`);
              }
          } catch (error) {
              console.log(`ERRO AO CRIAR SUBCATEGORIA ${SUBGRUPO}`);
              gravarLogErro(`ERRO AO CRIAR SUBCATEGORIA ${SUBGRUPO}`);
          }
      }
    } catch (error) {
        console.error(error);
    }
  }



  // FUNÇÃO PARA GRAVAR MENSAGEM NO ARQUIVO LOG
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
  
  // FUNÇÃO PARA GRAVAR MENSAGEM DE ERRO NO ARQUIVO LOG
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

module.exports = {
    tratativaDeProdutosNuvem,
    tratativaDeCategoriasNuvem,
    tratativaDeSubCategoriasNuvem
}