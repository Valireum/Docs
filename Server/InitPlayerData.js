const AWS = require('aws-sdk');
const DynamoDb = new AWS.DynamoDB({region:process.env.REGION});
const ethers = require('ethers');  
const crypto = require('crypto');


exports.handler = async (event) => {
    if (event.triggerSource && event.triggerSource == 'PostConfirmation_ConfirmSignUp') {
        
        if (event.request && event.request.userAttributes && event.request.userAttributes.sub) {
            
            const playerId = event.request.userAttributes.sub;
            
            
            const id = crypto.randomBytes(32).toString('hex');
            const privateKey = "0x"+id;
            const wallet = new ethers.Wallet(privateKey);
            
            const dynamoDbRequestParams = {
                TableName: 'Wallets',
                Item: {
                    Id: {S: playerId},
                    Privkey: {S: privateKey},
                    Pubkey: {S: wallet.address},
                }
            };
            
            await DynamoDb.putItem(dynamoDbRequestParams)
            .promise().then(data => {
                
            })
            .catch(err => {
                throw(err);
            });
            
            const dynamoDbRequestParams1 = {
                TableName: 'Players',
                Item: {
                    Id: {S: playerId},
                    Pubkey: {S: wallet.address},
                    VPoints: {N: "150"},
                    Level: {N: "1"},
                    Rank: {S: "Newbie"},
                    Icon: {N: "0"},
                    Friends: {SS: ["0"]}
                }
            };
            
            await DynamoDb.putItem(dynamoDbRequestParams1)
            .promise().then(data => {
                
            })
            .catch(err => {
                throw(err);
            });
            
            
            const dynamoDbRequestParams2 = {
                TableName: 'Balances',
                Item: {
                    Pubkey: {S: wallet.address},
                    LastBalance: {S: "0x00"},
                    LastBlock: {N: "25215742"},
                }
            };
            
           
            await DynamoDb.putItem(dynamoDbRequestParams2)
            .promise().then(data => {
                
            })
            .catch(err => {
                throw(err);
            });
            
            
        }
    }
    
    
    return event
};
