const { app } = require('electron')
const path = require('node:path')

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

            case 'client_id':
                resolve(process.env.CLIENT_ID) 
                break;
            
            case 'client_secret':
                resolve(process.env.CLIENT_SECRET) 
                break;
        }
    })
}

module.exports = {
    returnInfo
}