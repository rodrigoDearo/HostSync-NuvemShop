// IMPORTÇÂO DE MÒDULOS
const axios = require('axios');
const { retornaCampo } = require('./manipulacaoJSON');

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


async function definirRequisicao(nome, estoque, preco){
    return new Promise(async(resolve, reject) => {
        await retornaCampo('app_token')
        .then(response => {
            config = {
                headers: {
                  Authorization: `bearer ${response}`,
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
                    price: preco,
                    stock: estoque
                }]
            }
        })
        .then(() => {
            resolve();
        })
    })
}


async function cadastrarProdutoNuvem(nome, estoque, preco){
    return new Promise(async (resolve, reject) => {
        try {
            await definirRequisicao(nome, estoque, preco);

            axios.post(`https://api.nuvemshop.com.br/v1/${store_id}/products`, data, config)
            .then((response) => {
                console.log('Product created:', response.data);
                resolve(response.data);
            })
            .catch((error) => {
                // Trate o erro sem rejeitar a Promessa principal.
                resolve({ error: true });
            });
        } catch(error) {
            console.error('Error in cadastrarProdutoNuvem:', error);
            // Trate o erro sem rejeitar a Promessa principal.
            resolve({ error: true });
        }
    });
}


module.exports = {
    cadastrarProdutoNuvem
}