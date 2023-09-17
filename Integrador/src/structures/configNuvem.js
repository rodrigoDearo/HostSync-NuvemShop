process.stdin.setEncoding('utf-8');

// IMPORTÇÂO DE MÒDULOS
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { retornaCampo } = require('./manipulacaoJSON');
const { response } = require('express');
const { Resolver } = require('dns');
const { Console } = require('console');


var store_id, config, data;

async function gerarAccessToken(){
    return new Promise(async(resolve, reject) => {
        try {
            
        }
        catch(error){
            reject(error)
        }
    })
}


//   ######   ######    #####   #####    ##   ##  ######    #####    #####
//    ##  ##   ##  ##  ##   ##   ## ##   ##   ##  # ## #   ##   ##  ##   ##
//    ##  ##   ##  ##  ##   ##   ##  ##  ##   ##    ##     ##   ##  #
//    #####    #####   ##   ##   ##  ##  ##   ##    ##     ##   ##   #####
//    ##       ## ##   ##   ##   ##  ##  ##   ##    ##     ##   ##       ##
//    ##       ##  ##  ##   ##   ## ##   ##   ##    ##     ##   ##  ##   ##
//   ####     #### ##   #####   #####     #####    ####     #####    #####


/**
 * ESSA FUNÇÃO SERVE PARA LER E CRIPTOGRAFAR EM BASE 64 A IMAGEM E DEVOLVELA CODIFICADA
 * @param {*} img O NOME DA IMAGEM NO CAMINHO INFORMADO
 * @param {*} caminho O CAMINHO PARA PASTA HOST EM QUE SE DEVE FAZER A LEITURA DAS IMAGENS
 * @returns {data} STRING COM A IMAGEM CODIFICADA EM BASE64
 */
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



async function padronziarCadastroVariante(idNuvem){
  return new Promise (async (resolve, reject) => {
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
          attributes: [
            {
              pt: "Variantes"
            }
          ]
        }
      })
      .then(() => {
          axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idNuvem}`, data, config)
          .then(() => {
            resolve()
          })
      })
    } catch (error) {
      reject(error)
    }
  })
}



async function tratativaDeProdutosNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, CARACTERISTICA, GRUPO, SUBGRUPO, BARRAS){
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
        console.log(`PRODUTO ${PRODUTO} JA EXISTE, DEVERA SER ATUALIZADO`);
      }
      else{
        if(STATUS=='ATIVO'){
          await cadastrarProdutoNuvem(PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, CARACTERISTICA, CATEGORIA_PRODUTO, BARRAS)
          .then(async (response) => {
              if (response.error) {
                  // [...] CASO OCORRA ISTO DEVERÁ ABRIR O POP UP POSTERIORMENTE
                  console.log('Erro ao cadastrar produto:', PRODUTO);
              } else {
                  // [...] CADASTRO BEM SUCEDIDO NA PLATAFORMA
                console.log(`${PRODUTO} FOI CADASTRADO COM SUCESSO`)
                dados.produtos[ID_PRODUTO] = {
                  "id": response.id,
                  "variantePrimal": response.variants[0].id,
                  "variantes": {

                  }
                }
                
                fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados));
                await padronziarCadastroVariante(response.id)
                .then(() => {
                  resolve()
                })
              }
          })
          .catch((err) => {
              console.log(err)
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



/**
 * ESSA FUNÇÃO ELA DEFINE O CONTEÚDO E A CONFIGURAÇÃO A SER USADO PARA A REQUISIÇÃO 
 * @param {*} nome DO PRODUTO
 * @param {*} estoque DO PRODUTP
 * @param {*} preco DO PRODUTO
 * @param {*} descricao DO PRODUTO
 * @param {*} categoria DO PRODUTO
 * @param {*} barras DO PRODUTO
 */
async function definirRequisicaoCadastroProduto(nome, estoque, preco, descricao, categoria, barras){
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
              variants: [
                {
                  price: `${preco}`,
                  stock: estoque,  
                }
              ],
              description: descricao,
          }
      })
      .then(() => {
          if(categoria != null){
            data.categories = [categoria]
          }

          if(barras!=null){
            data.variants[0].barcode = barras
          }
      })
      .then(() => {
          resolve();
      })
  })
}



/**
 *  ESSA FUNÇÃO É RESPONSÁVEL POR JUNTAR AS CONFIGURAÇÕES E CONTEUDO E FAZER A REQUISIÇÃO DE CADASTRO
 * @param {*} nome DO PRODUTO
 * @param {*} estoque DO PRODUTO
 * @param {*} preco DO PRODUTO
 * @param {*} foto DO PRODUTO
 * @param {*} descricao DO PRODUTO
 * @param {*} categoria DO PRODUTO
 * @param {*} codigoBarras DO PRODUTO
 */
async function cadastrarProdutoNuvem(nome, estoque, preco, foto, descricao, categoria, codigoBarras){
  return new Promise(async (resolve, reject) => {
      try {
          await definirRequisicaoCadastroProduto(nome, estoque, preco, descricao, categoria, codigoBarras);

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
              resolve({ error: true });
          });
      } catch(error) {
          console.error('Error in cadastrarProdutoNuvem:', error);
          // Trate o erro sem rejeitar a Promessa principal.
          resolve({ error: true });
      }
  });
}



async function novoRegistroProdutoNuvem(ID_PRODUTO, PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, STATUS, CARACTERISTICA, GRUPO, SUBGRUPO, BARRAS){
  return new Promise(async (resolve, reject) => {
    try {
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
              if(STATUS=='ATIVO'){
                await definirRequisicaoAtualizarProduto(PRODUTO, CARACTERISTICA, CATEGORIA_PRODUTO, BARRAS);
  
                let idVariante = dados.produtos[ID_PRODUTO].variantePrimal
                let idNuvem = dados.produtos[ID_PRODUTO].id;
                axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idNuvem}`, data, config)
                .then(async (response) => {

                  console.log(`${PRODUTO} FOI ATUALIZADO COM SUCESSO`)
                  if(FOTO!=null){
                    retornaCampo('caminho_imagens')
                    .then(responseCaminho => {
                      cadastroImagem(FOTO, responseCaminho)
                      .then(dataEnvio => {
                        axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products/${response.data.id}/images`, dataEnvio, config)
                      })
                    })
                  }
                })
                .then(async () => {
                  await definirAtualizacaoEstoqueEpreco(ESTOQUE, VALOR_VENDA)
                  
                  axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idNuvem}/variants/${idVariante}`, data, config)
                  .then(() => {
                    resolve()
                  })
                })
                .catch((error) => {
                    console.log(error.response.data);
                    resolve({ error: true });
                });
              }
              else if(STATUS=="INATIVO"){
                let idNuvem = dados.produtos[ID_PRODUTO].id;
                let config;
                await retornaCampo('app_token')
                .then(response => {
                  config = {
                    headers: {
                      Authentication: `bearer ${response}`,
                      'User-Agent': `HostSync (7752)`
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
                  axios.delete(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idNuvem}`, config)
                  .then(() => {
                    delete dados.produtos[ID_PRODUTO];
                    fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados));
                    console.log(`${PRODUTO} FOI DELETADO COM SUCESSO`);
                  })
                })
                .then(() => {
                  resolve()
                })
                
              }        
          }
          else{
            if(STATUS=='ATIVO'){
              await cadastrarProdutoNuvem(PRODUTO, ESTOQUE, VALOR_VENDA, FOTO, CARACTERISTICA, CATEGORIA_PRODUTO, BARRAS)
              .then(async response => {
                  if (response.error) {
                      // [...] CASO OCORRA ISTO DEVERÁ ABRIR O POP UP POSTERIORMENTE
                      console.log('Erro ao cadastrar produto:', PRODUTO);
                  } else {
                      // [...] CADASTRO BEM SUCEDIDO NA PLATAFORMA
                    console.log(`${PRODUTO} FOI CADASTRADO COM SUCESSO`)
                    dados.produtos[ID_PRODUTO] = {
                      "id": response.id,
                      "variantePrimal": response.variants[0].id,
                      "variantes": {
    
                      }
                    }
                    
                    fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados));
                    await padronziarCadastroVariante(response.id)
                    .then(() => {
                      resolve()
                    })
                  }
                resolve()
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
  
        } catch (error) {
            reject(error)
        }
      })

    } catch (error) {
      reject(error)
    }

  })
}



/**
 *  ESSA FUNÇÃO É RESPONSÁVEL POR JUNTAR AS CONFIGURAÇÕES E CONTEUDO E FAZER A REQUISIÇÃO DE CADASTRO
 * @param {*} nome DO PRODUTO
 * @param {*} estoque DO PRODUTO
 * @param {*} preco DO PRODUTO
 * @param {*} descricao DO PRODUTO
 * @param {*} categoria DO PRODUTO
 * @param {*} barras DO PRODUO
 * @returns 
 */
async function definirRequisicaoAtualizarProduto(nome, descricao, categoria, barras){
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
              description: descricao,
          }
      })
      .then(() => {
          if(categoria != null){
            data.categories = [categoria]
          }

          if(barras!=null){
            data.barcode = barras
          }
      })
      .then(() => {
          resolve();
      })
  })
}



async function definirAtualizacaoEstoqueEpreco(estoque, preco){
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
          price: `${preco}`,
          stock: estoque
    }
    })
    .then(() => {
        resolve();
    })
})
}









  
//    ####     ##     ######   #######    ####    #####   ######    ####      ##      #####
//   ##  ##   ####    # ## #    ##   #   ##  ##  ##   ##   ##  ##    ##      ####    ##   ##
//  ##       ##  ##     ##      ## #    ##       ##   ##   ##  ##    ##     ##  ##   #
//  ##       ##  ##     ##      ####    ##       ##   ##   #####     ##     ##  ##    #####
//  ##       ######     ##      ## #    ##  ###  ##   ##   ## ##     ##     ######        ##
//   ##  ##  ##  ##     ##      ##   #   ##  ##  ##   ##   ##  ##    ##     ##  ##   ##   ##
//    ####   ##  ##    ####    #######    #####   #####   #### ##   ####    ##  ##    #####


/**
 * ESSA FUNÇÃO É ACIONADA PARA CADASTRAR UMA CATEGORIA NA CARGA INICIAL, ELA VERIFICA SE A CATEGORIA JA EXISTE E É RESPONSÁVEL POR ADICIONAR A CATEGORIA AO JSON
 * @param {*} ID DA CATEGORIA NO SISTEMA GOST
 * @param {*} NOME NOME DA CATEGORIA A SER CADASTRADA OU ALTERADO
 */  
async function tratativaDeCategoriasNuvem(ID, NOME) {
  return new Promise(async (resolve, reject) => {
    try {
        const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

        if (categoriasjson.categorias[ID]) {
            console.log(`CATEGORIA ${NOME} JA ESTA CADASTRADA`);
        } else {
            try {
                const response = await cadastrarCategoriaNuvem(NOME);
                categoriasjson.categorias[`${ID}`] = {
                    "id": response.id,
                    "nome": NOME,
                    "subcategorias": {}
                };

                fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
                console.log(`CATEGORIA ${NOME} CADASTRADA COM SUCESSO`);
            } catch (error) {
                console.log(`ERRO AO CRIAR CATEGORIA ${NOME}`);
                gravarLogErro(`ERRO AO CRIAR CATEGORIA ${NOME}`);
                reject(error)
            }
        }
        
        resolve()
    } catch (error) {
      reject(error);
    }
  })
}
  


/**
 * FUNÇÃO RESPONSÁVEL POR PREPARAR O JSON DE ENVIO, DE CONFIGURAÇÃO E REALIZAR A REQUISIAÇÃO
 * @param {*} nome NOME DA CATEGORIA
 * @returns {response.data} BASICAMENTE É A PARTE ESSENCIAL DO JSON DE RETORNO EM CASO POSITIVO
 */
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
      .then(async () => {
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
          .catch(() => {
            reject();
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

  

async function alterarCategoriaNuvem(idHost, novoNome){
  return new Promise(async (resolve, reject) => {
    try {
      const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

      let idNuvem = categoriasjson.categorias[idHost]['id'];

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
              name: novoNome
          }
      })
      .then(() => {
        axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/categories/${idNuvem}`, data, config)
        .then(() => {
          console.log(`CATEGORIA ${novoNome} ALTERADA COM SUCESSO`);
          gravarLog(`CATEGORIA ${novoNome} ALTERADA COM SUCESSO`)
          
          categoriasjson.categorias[idHost]['nome'] = novoNome;
          fs.writeFileSync('./src/build/nuvem/categoriaNuvem.json', JSON.stringify(categoriasjson, null, 2));
        })
      })
      .catch(() => {
        reject(error);
      })

      resolve()
    } catch (error) {
      reject(error)
    }
  })
}



async function deletarCategoriaNuvem(idNuvem){
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
        axios.delete(`https://api.nuvemshop.com.br/v1/${store_id}/categories/${idNuvem}`, config)
        .then(() => {
          console.log(`CATEGORIA DE ID ${idNuvem} DELETADA COM SUCESSO`);
          gravarLog(`CATEGORIA DE ID ${idNuvem} DELETADA COM SUCESSO`)
          
          resolve();
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










//   #####   ##   ##  ######              ####     ##     ######   #######    ####    #####   ######    ####      ##      #####
//  ##   ##  ##   ##   ##  ##            ##  ##   ####    # ## #    ##   #   ##  ##  ##   ##   ##  ##    ##      ####    ##   ##
//  #        ##   ##   ##  ##           ##       ##  ##     ##      ## #    ##       ##   ##   ##  ##    ##     ##  ##   #
//   #####   ##   ##   #####            ##       ##  ##     ##      ####    ##       ##   ##   #####     ##     ##  ##    #####
//       ##  ##   ##   ##  ##           ##       ######     ##      ## #    ##  ###  ##   ##   ## ##     ##     ######        ##
//  ##   ##  ##   ##   ##  ##            ##  ##  ##  ##     ##      ##   #   ##  ##  ##   ##   ##  ##    ##     ##  ##   ##   ##
//   #####    #####   ######              ####   ##  ##    ####    #######    #####   #####   #### ##   ####    ##  ##    #####


/**
 * ESSA FUNÇÃO É ACIONADA PARA CADASTRAR UMA SUBCATEGORIA NA CARGA INICIAL, ELA VERIFICA SE A SUBCATEGORIA JA EXISTE E É RESPONSÁVEL POR ADICIONAR A SUBCATEGORIA AO JSON
 * @param {*} ID DA SUBCATEGORIA
 * @param {*} ID_GRUPO REFERENTE A CATEGORIA AO QUAL ESTA SUBCATEGORIA PROVEM
 * @param {*} SUBGRUPO NOME DA SUBCATEGORIA
 */
async function tratativaDeSubCategoriasNuvem(ID, ID_GRUPO, SUBGRUPO){
  return new Promise(async (resolve, reject) => {
    try {
        const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));

        if (!categoriasjson.categorias[ID_GRUPO]) {
            console.log(`SUBCATEGORIA ${SUBGRUPO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO SEU RESPECTIVO GRUPO`)
            gravarLogErro(`SUBCATEGORIA ${SUBGRUPO} NÃO FOI CADASTRADA DEVIDO A AUSÊNCIA DO SEU RESPECTIVO GRUPO`);
        
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

        resolve()
      } catch (error) {
        reject(error);
      }
    })
  }

  
  
  /**
   * FUNÇÃO RESPONSÁVEL POR PREPARAR O JSON DE ENVIO, DE CONFIGURAÇÃO E REALIZAR A REQUISIAÇÃO
   * @param {*} nome DA SUBCATEGORIA
   * @param {*} idGrupo DA CATEGORIA QUE PROVÉM ESTA SUBCATEGORIA
   * @returns {response.data} BASICAMENTE É A PARTE ESSENCIAL DO JSON DE RETORNO EM CASO POSITIVO
   */
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



  async function alterarSubCategoriaNuvem(idGrupo, idSubGrupo, novoNome){
    return new Promise(async (resolve, reject) => {
      try {
        const categoriasjson = JSON.parse(fs.readFileSync('./src/build/nuvem/categoriaNuvem.json', 'utf8'));
  
        let idNuvem = categoriasjson.categorias[idGrupo].subcategorias[idSubGrupo];
  
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
                name: novoNome
            }
        })
        .then(() => {
          axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/categories/${idNuvem}`, data, config)
          .then(() => {
            console.log(`SUBCATEGORIA ${novoNome} ALTERADA COM SUCESSO`);
            gravarLog(`SUBCATEGORIA ${novoNome} ALTERADA COM SUCESSO`)
          })
        })
        .catch(() => {
          reject(error);
        })
  
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }









  
  //   ##   ##    ##     ######    ####      ##       ####     ##      #####              ####   ######     ##     #####    #######
  //   ##   ##   ####     ##  ##    ##      ####     ##  ##   ####    ##   ##       ##   ##  ##   ##  ##   ####     ## ##    ##   #
  //    ## ##   ##  ##    ##  ##    ##     ##  ##   ##       ##  ##   ##   ##      ##   ##        ##  ##  ##  ##    ##  ##   ## #
  //    ## ##   ##  ##    #####     ##     ##  ##   ##       ##  ##   ##   ##     ##    ##        #####   ##  ##    ##  ##   ####
  //     ###    ######    ## ##     ##     ######   ##       ######   ##   ##    ##     ##  ###   ## ##   ######    ##  ##   ## #
  //     ###    ##  ##    ##  ##    ##     ##  ##    ##  ##  ##  ##   ##   ##   ##       ##  ##   ##  ##  ##  ##    ## ##    ##   #
  //      #     ##  ##   #### ##   ####    ##  ##     ####   ##  ##    #####   ##         #####  #### ##  ##  ##   #####    #######


  async function tratativaDeVariacaoNuvem(id, nome, idProduto, idHost, estoque, preco){
    return new Promise(async (resolve, reject) => {
      try {
        const dados = JSON.parse(fs.readFileSync('./src/build/nuvem/produtosNuvem.json', 'utf8'));

        await criarVariacao(nome, idProduto, estoque, preco)
        .then(response => {
          dados.produtos[idHost].variantes[id] = response.id;
          fs.writeFileSync('./src/build/nuvem/produtosNuvem.json', JSON.stringify(dados, null, 2));
          resolve(response.id)
        })
      } catch (error) {
        reject(error)
      }
    })
  }



  async function criarVariacao(nome, id_produto, estoque, preco){
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
                values: [
                  {
                    "pt": nome
                  }
                ],
                stock: estoque,
                price: `${preco}`
              }
          })
          .then(() => {
            axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products/${id_produto}/variants`, data, config)
            .then(response => {
              console.log(`VARIACAO ${nome} CRIADA COM SUCESSO NO PRODUTO DE ID ${id_produto}`);
              gravarLog(`VARIACAO ${nome} CRIADA COM SUCESSO NO PRODUTO DE ID ${id_produto}`)
              resolve(response.data)
            })
          })
          .catch((err) => {
            reject(err);
          })
  
      } catch (error) {
        reject(error)
      }
    })
  }



  async function atualizarVariacao(idVariacao, id_produto, estoque, preco){
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
                stock: estoque,
                price: `${preco}`
              }
          })
          .then(() => {
            axios.put(`https://api.nuvemshop.com.br/v1/${store_id}/products/${id_produto}/variants/${idVariacao}`, data, config)
            .then(() => {
              console.log(`VARIACAO ALTERADA COM SUCESSO NO PRODUTO DE ID ${id_produto}`);
              gravarLog(`VARIACAO ALTERADA COM SUCESSO NO PRODUTO DE ID ${id_produto}`)
              resolve()
            })
          })
          .catch((err) => {
            reject(err);
          })
  
      } catch (error) {
        reject(error)
      }
    })
  }



  async function deletarVariacao(idProduto, idVariacao){
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
            axios.delete(`https://api.nuvemshop.com.br/v1/${store_id}/products/${idProduto}/variants/${idVariacao}`, config)
            .then(() => {
              console.log(`VARIACAO ${idVariacao} DELETADA COM SUCESSO NO PRODUTO DE ID ${idProduto}`);
              gravarLog(`VARIACAO ${idVariacao} DELETADA COM SUCESSO NO PRODUTO DE ID ${idProduto}`)
              resolve()
            })
          })
          .catch((err) => {
            reject(err);
          })
  
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
      }
    });
  }

module.exports = {
    tratativaDeProdutosNuvem,
    tratativaDeCategoriasNuvem,
    alterarCategoriaNuvem,
    deletarCategoriaNuvem,
    tratativaDeSubCategoriasNuvem,
    alterarSubCategoriaNuvem,
    tratativaDeVariacaoNuvem,
    novoRegistroProdutoNuvem,
    atualizarVariacao,
    deletarVariacao
}
