const fs = require('fs');
const axios = require('axios');


// Função para ler o arquivo JSON e realizar a requisição POST
async function lerArquivoEEnviar() {
  try {
    // Lê o conteúdo do arquivo JSON
    const dados = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
    const code = dados.code;

    // Dados para a requisição POST
    const dadosPost = {
      client_id: "7752",
      client_secret: "9f9d89cf0c0b20bcdcbba4874a16baa8c16028ef01e2b3fe",
      grant_type: "authorization_code",
      code: `${code}`
    };

    // URL para a requisição POST
    const urlPost = 'https://www.nuvemshop.com.br/apps/authorize/token';

    const headers = {
      'User-Agent': 'HostSync (7752)', // Exemplo de token de autorização
      'Content-Type': 'application/json', // Tipo de conteúdo da requisição
    };

    // Realiza a requisição POST usando o módulo axios
    const resposta = await axios.post(urlPost, dadosPost, { headers });

    // Exibe a resposta da requisição
    console.log('User ID:', resposta.data.user_id);
    console.log('Access Token:', resposta.data.access_token);


    const configuracaoIntegrador = JSON.parse(fs.readFileSync('../Integrador/src/build/dados.json', 'utf-8'));
    configuracaoIntegrador.dadosApp.nuvem.store_id = resposta.data.user_id;
    configuracaoIntegrador.dadosApp.nuvem.app_token = resposta.data.access_token;
    fs.writeFileSync('../Integrador/src/build/dados.json', JSON.stringify(configuracaoIntegrador, null, 2), 'utf-8');

  } catch (erro) {
    console.error('Erro:', erro);
  }
}

// Chama a função para ler o arquivo e enviar a requisição
lerArquivoEEnviar();
