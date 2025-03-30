const { app } = require('electron')
const path = require('node:path')

//const userDataPath = 'src/build';
const userDataPath = path.join(app.getPath('userData'), 'ConfigFiles');
require('dotenv').config({ path: path.join(userDataPath, '.env') });

function returnInfo(infoRequired){
    return new Promise((resolve, reject) => {

        switch (infoRequired) {
            case 'user_database':
                resolve(process.env.USR_DATABASE) 
                break;
        
            case 'password_database':
                resolve(process.env.PSW_DATABASE) 
                break;

            case 'consumer_key':
                resolve(process.env.CSM_KEY) 
                break;
            
            case 'consumer_secret':
                resolve(process.env.CSM_SECRET) 
                break;

            case 'cliente_id':
                resolve(process.env.CLI_IDIMGUR)
                break

        }
    })
}

module.exports = {
    returnInfo
}