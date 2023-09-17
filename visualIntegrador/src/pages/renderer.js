const express = require('express');
const app = express();
const port = 3000;

app.get('/erroProduto/:mensagem', (req, res) => {
  const mensagem = req.params.mensagem;
  res.send(`Mensagem de erro do produto: ${mensagem}`);
});

app.listen(port, () => {
  console.log(`Servidor Express está ouvindo na porta ${port}`);
});