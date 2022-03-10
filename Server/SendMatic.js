
require('dotenv').config({path: './.env'});
const AWS = require('aws-sdk');
const DynamoDb = new AWS.DynamoDB({region: process.env.REGION});
const Cognito = new AWS.CognitoIdentityServiceProvider({region: process.env.REGION});
const ethers = require('ethers');  
const crypto = require('crypto');

const network = "maticmum"; // Polygon Mumbai Testnet
exports.handler = async (event) => {
    let response;
    let accessToken;
    let raisedError;
    
    if (event.headers) {
        if (event.headers['Authorization']) {
            accessToken = event.headers['Authorization'];
        }
    }
    
    const cognitoRequestParams = {
        AccessToken: accessToken
    };
    
    let sub;
    
    await Cognito.getUser(cognitoRequestParams)
    .promise().then(data => {
        if (data && data.UserAttributes) {
            for (const attribute of data.UserAttributes) {
                if (attribute.Name == 'sub') {
                    sub = attribute.Value;
                    break;
                }
            }
        } 
    })
    .catch(err => {
        raisedError = err;
    });
    
    if (raisedError) {
        response = {
            statusCode: 400,
            body: JSON.stringify({
                error: raisedError
            })
        };
        return response;
    }
    
    
    const dynamoDbRequestParams = {
        TableName: 'Wallets',
        Key: {
            Id: {S: sub}
        }
    };
    
    let playerData;
    
    await DynamoDb.getItem(dynamoDbRequestParams)
    .promise().then(data => {
        if (data && data.Item) {
            playerData = data.Item;
        } 
        response = {
            statusCode: 200,
            body: JSON.stringify({
                'playerData': playerData
            })
        };
    })
    .catch(err => {
        response = {
            statusCode: 400,
            body: JSON.stringify({
                error: err
            })
        };
    });
    
    
    if (event.sendto) {
        const sendto = event.sendto;
        if (event.amount) {
            const amount = event.amount;
        
        
        const connection = new ethers.providers.InfuraProvider(network, {
        projectId: process.env.PROJECT_ID,
        projectSecret: process.env.PROJECT_SECRET
      });
    
    
    
    // Get private key
    const privateKey = playerData.Privkey.S;
    const wallet = new ethers.Wallet(privateKey, connection);
    const signer = wallet.connect(connection);
    

    // Get gas and nonce
    const gasPrice = await connection.getGasPrice();
    const nonce = await connection.getTransactionCount(wallet.address);


    // build a transaction
    const tx = {
        from: wallet.address,
        to: sendto,
        value: ethers.utils.parseEther(amount),
        gasPrice: gasPrice,
        nonce: nonce,
        gasLimit: ethers.utils.hexlify(1000000),
    };

    const transaction = await signer.sendTransaction(tx);
    
    response =  transaction.hash;
        }
    }
    
    
    return response;
};