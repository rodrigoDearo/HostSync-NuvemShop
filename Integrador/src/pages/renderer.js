const axios = require('axios');

    axios.get('http://localhost:3000/mensagem')
    .then(response => {
        console.log('Resposta do servidor:', response.data);
    })
    .catch(error => {
        console.error('Erro ao fazer a requisição:', error);
    });
