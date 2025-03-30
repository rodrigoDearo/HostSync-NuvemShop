const { generateToken, updateToken } = require('./requestsTray.js')
const { returnInfo } = require('../envManager.js')
const { returnValueFromJson } = require('./manageInfoUser.js');

async function creatingAndUpdateAccessToken(){
        let consumer_key, consumer_secret, code, url;

        await returnInfo('consumer_key')
        .then(response => {
            consumer_key = response
        })
    
        await returnInfo('consumer_secret')
        .then(response => {
            consumer_secret = response
        })
    
        await returnValueFromJson('codetray')
        .then(response => {
            code = response
        })
    
        await returnValueFromJson('urltray')
        .then(response => {
            url = response
        })
    
        let body = {
            "consumer_key": consumer_key,
            "consumer_secret": consumer_secret,
            "code": code
        }
    
        await generateToken(url, body)
        .then(async () => {
            setInterval(async () => {
                await returnValueFromJson('refresh_token')
                .then(async response => {
                    await updateToken(url, response)
                })
            }, 9000000);
        })
}

module.exports = {
    creatingAndUpdateAccessToken
}