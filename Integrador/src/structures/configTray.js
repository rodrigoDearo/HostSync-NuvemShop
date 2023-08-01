/* ---------------------- IMPORTAÇÃO DE MÓDULOS ----------------------*/
const axios = require('axios');
const { Console } = require('console');
const fs = require('fs');
const { resolve } = require('path');

var consumerSecret, consumerKey, code, url, tokenRefresh, acessToken;


/**
 * Função para gravar no arquivo dados.JSOn as informações retornadas na requisição
 * @param {*} dados 
 */
function gravarDados(dados) {
    fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
      if (err) {
        console.error(err);
      }
  
      let arquivoJSON = JSON.parse(data);
  
      arquivoJSON.dadosApp.tray.access_token = dados.access_token;
      arquivoJSON.dadosApp.tray.refresh_token = dados.refresh_token;
      arquivoJSON.dadosApp.tray.date_expiration_access_token = dados.date_expiration_access_token;
      arquivoJSON.dadosApp.tray.date_expiration_refresh_token = dados.date_expiration_refresh_token;
      
      fs.writeFile('./src/build/dados.json', JSON.stringify(arquivoJSON), (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Dados Gravados com Sucesso');
        }
      });
    });
  }  
  


/**
 * Função para ler dados.json e parametrizar valores a serem enviados nas requisições
 * @returns gravação dos valores usados na requisição
 */
function leituraDosDados() {
    return new Promise((resolve, reject) => {
      fs.readFile('./src/build/dados.json', 'utf-8', (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
  
        let dados = JSON.parse(data);
  
        try {
          consumerKey = "9f52214d3ff8cf0629d1fcfa3bd6a5b5e4fbc21a62305a7d6b450dc64a90cf68";
          consumerSecret = "68e7ba3319a5b96eece177867a3c6212e7ec930c0ac89b719e1adcaaa6bc380f";
          code = dados.dadosApp.tray.code;
          url = dados.dadosApp.tray.url;
          tokenRefresh = dados.dadosApp.tray.refresh_token;
          acessToken = dados.dadosApp.tray.access_token;
          
          resolve();
        } catch {
          console.log('Erro na leitura');
          reject(new Error('Erro na leitura dos dados'));
        }
      });
    });
  }


  
/**
 * Função para gerar o token de acesso, função executado quando será gerado o acess_token do cliente pela primeira vez ou quando refresh_token vence
 */
async function createToken() {
    try {
        await leituraDosDados();
  
        let keysValue = new URLSearchParams();
        keysValue.append('consumer_key', consumerKey);
        keysValue.append('consumer_secret', consumerSecret);
        keysValue.append('code', code);
  
        const config = {
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        axios.post(`${url}/auth`, keysValue, config)
        .then((response) => {
            gravarDados(response.data);
        })
        .catch((error) => {
            console.log(error);
        });

    } catch (error) {
      console.log(error);
    }
}


/**
 * Função para renovar token de acesso, será executada qando expirar data valida para o acess_token
 */
async function refreshToken(){
    try {
        await leituraDosDados();
        axios.get(`${url}/auth`, { params:{
            refresh_token: tokenRefresh
        } })
        .then((response) => {
            gravarDados(response.data);
        })
        .catch((error) => {
            console.error(error);
        });
    }
    catch(error){
        console.err(error);
    }
}


async function definirProduto(nome, estoque, precoCompra, categoria) {
  return new Promise((resolve, reject) => {
    try {
      const produto = {
        "Product": {
          "ean": "",
          "name": `${nome}`,
          "description": "",
          "description_small": "",
          "price": `0`,
          "cost_price": `${precoCompra}`,
          "promotional_price": "",
          "start_promotion": "",
          "end_promotion": "",
          "brand": "",
          "model": "",
          "weight": "1",
          "length": "",
          "width": "",
          "height": "",
          "stock": `${estoque}`,
          "category_id": `${categoria}`,
          "available": "1",
          "availability": "",
          "availability_days": "",
          "reference": "",
          "hot": "",
          "release": "",
          "additional_button": "",
          "related_categories": "",
          "release_date": "",
          "shortcut": "",
          "virtual_product": ""
        }
      };
      resolve(produto);
    } catch (error) {
      reject(error);
    }
  });
}



async function definirProdutoAtualizado(nome, preco, estoque, precoCompra, categoria, codigo) {
  return new Promise((resolve, reject) => {
    try {
      let produto = {
        "Product": {

        }
      };

      if(nome != null){
        produto.Product["name"] = `${nome}`;
      }

      if(preco != null){
        produto.Product["price"] = `${preco}`;
      }

      if(precoCompra != null){
        produto.Product["cost_price"] = `${precoCompra}`
      }

      if(estoque != null){
        produto.Product["stock"] = `${estoque}`;
      }

      if(codigo != null){
        produto.Product["ean"] = `${codigo}`
      }

      if(categoria != null){
        produto.Product["category_id"] = `${categoria}`
      }

      resolve(produto);
    } catch (error) {
      reject(error);
    }
  });
}


async function cadastrarProduto(thisnome, thisestoque, thisprecoCompra, thiscategoria) {
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados();
      const produto = await definirProduto(thisnome, thisestoque, thisprecoCompra, thiscategoria);
      const response = await axios.post(`${url}/products?access_token=${acessToken}`, produto);
      const id = response.data.id
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}




async function atualizarProduto(thisnome, thispreco, thisestoque, thisprecoCompra, thiscategoria, thisCodigo, thisid) {
  try {
    let id;
    await leituraDosDados()
      .then(() => {
        id = thisid;
      })
      .then(() => definirProdutoAtualizado(thisnome, thispreco, thisestoque, thisprecoCompra, thiscategoria, thisCodigo))
      .then(produtoAtualizado => {
        axios.put(`${url}/products/${id}?access_token=${acessToken}`, produtoAtualizado)
          .then(response => {
          })
          .catch(error => {
            console.log(error);
          });
      });
  } catch (error) {
    console.error(error);
  }
}


async function criarCategoria(name){
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados()
      .then(() => {
        const requestData = {
          Category: {
            name: name,
            description: '',
            slug: '',
            order: '',
            title: name,
            small_description: '',
            has_acceptance_term: '',
            acceptance_term: '',
            metatag: {
              keywords: '',
              description: '',
            },
            property: '',
          },
        };
    
        axios.post(`${url}/categories?access_token=${acessToken}`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${acessToken}`,
          },
        })
          .then((response) => {
            resolve(response.data.id);
          })
          .catch((error) => {
            console.error(error);
          });
      })

    } catch (error) {
      reject(error)
    }
  })
}


async function criarSubCategoria(name, idFather){
  return new Promise(async (resolve, reject) => {
    try {
      await leituraDosDados()
      .then(() => {
        const requestData = {
          Category: {
            name: name,
            description: '',
            slug: '',
            order: '',
            title: name,
            small_description: '',
            has_acceptance_term: '',
            acceptance_term: '',
            metatag: {
              keywords: '',
              description: '',
            },
            property: '',
            parent_id: idFather
          },
        };
    
        axios.post(`${url}/categories?access_token=${acessToken}`, requestData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${acessToken}`,
          },
        })
          .then((response) => {
            resolve(response.data.id);
          })
          .catch((error) => {
            console.error(error);
          });
      })

    } catch (error) {
      reject(error)
    }
  })
}


async function deletarProduto(thisid) {
  try {
    let id = thisid;
    await leituraDosDados()
      .then(() => {
        axios.delete(`${url}/products/${id}?access_token=${acessToken}`)
          .then(response => {
            
          })
          .catch(error => {
            console.error('Erro ao fazer requisição:', error);
          });
      });
  } catch (error) {
    console.error(error);
  }
}


async function cadastrarImagem(id, img){
  await leituraDosDados();
  return new Promise(async (resolve, reject) => {
    try {
      await axios.post(`${url}/products/${id}/images?access_token=${acessToken}`, {
        "Images": {
          "picture_source_1": img
        }
      })
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
    createToken,
    refreshToken,
    cadastrarProduto,
    atualizarProduto,
    deletarProduto,
    cadastrarImagem,
    criarCategoria,
    criarSubCategoria
};

//