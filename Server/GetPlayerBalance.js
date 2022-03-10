require('dotenv').config({path: './.env'});
const AWS = require('aws-sdk');
const DynamoDb = new AWS.DynamoDB({region:process.env.REGION});
const ethers = require('ethers');  


exports.handler = async (event) => {
    let balance;
    let response;
    let LastBalance;
    let weibalance;
    let changed = false;
    const provider = new ethers.providers.InfuraProvider(network, {
        projectId: process.env.PROJECT_ID,
        projectSecret: process.env.PROJECT_SECRET
      });
    
    if (event.pubkey) {
        weibalance = await provider.getBalance(event.pubkey);
        
        balance = ethers.utils.formatEther(weibalance);
        
        
        const dynamoDbRequestParams = {
            TableName: 'Balances',
            Key: {
                Pubkey: {S: event.pubkey}
            }
        };
        await DynamoDb.getItem(dynamoDbRequestParams)
        .promise().then(data => {
            if (data && data.Item) {
                LastBalance = data.Item.LastBalance.S;
            } 
        });
        
        if (weibalance._hex != LastBalance) {
            changed = true;
            response = {
                body: JSON.stringify({
                    'Changed': changed,
                    'Balance': balance
                })
            };
        
        }else{
            response = {
                body: JSON.stringify({
                    'Changed': changed,
                    'Balance': balance
                })
            };
        }
    }
    
        if (changed) {
            
            const dynamoDbRequestParamsUpdate = {
                TableName: 'Balances',
                Key: {
                    Pubkey: {S: event.pubkey}
                },
                UpdateExpression: "set LastBalance = :s",
                ExpressionAttributeValues:{
                    ":s": {S: weibalance._hex}
                },
                ReturnValues:"UPDATED_NEW"
            };
            
            await DynamoDb.updateItem(dynamoDbRequestParamsUpdate)
            .promise().then(data => {
                if (data) {
                    console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                } 
            });
            
            
            
        }
        
    
            
    
    return response;
}