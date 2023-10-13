// Importar a biblioteca node-firebird
const Firebird = require('node-firebird');
const readline = require('readline')

// Configuração do  readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
// Configuração do banco de dados
const config = {
    "host": 'localhost',
    "port": 3050,
    "database": `C:/TSD/Host/HOST.FDB`,
    "user": 'SYSDBA',
    "password": 'masterkey'
};

// Tentar executar a operação de attach
Firebird.attach(config, function (err, db) {
  if (err) {
    console.error('Erro durante a chamada attach:', err);
    return;
  }

  console.log('Conexão bem-sucedida ao banco de dados:', config.database);

  // Agora você pode executar operações no banco de dados usando a conexão "db"

  // Feche a conexão quando terminar
  db.detach(function(err) {
    if (err) {
      console.error('Erro ao fechar a conexão:', err);
    } else {
      console.log('Conexão fechada com sucesso.');
    }
    
    rl.question('Pressione "Enter" para fechar este módulo ', {

    });
  });
});
