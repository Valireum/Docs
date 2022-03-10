require('dotenv').config({path: './.env'});
const AWS = require('aws-sdk');
const Cognito = new AWS.CognitoIdentityServiceProvider({region: process.env.REGION});
const DynamoDb = new AWS.DynamoDB({region: process.env.REGION});

exports.handler = async (event) => {
    let response;
    let raisedError;
    let accessToken;
    
    if (event.token) {
        accessToken = event.token;
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
        TableName: 'Players',
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
                'Level': playerData.Level.N,
                'Rank' : playerData.Rank.S,
                'ID' : playerData.Id.S,
                'Pubkey' : playerData.Pubkey.S,
                'VPoints' : playerData.VPoints.N,
                'Icon' : playerData.Icon.N,
                'Friends' : playerData.Friends.SS
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
    
    return response;
};