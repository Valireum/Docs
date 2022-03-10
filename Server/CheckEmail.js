require('dotenv').config({path: './.env'});
const AWS = require('aws-sdk');
const Cognito = new AWS.CognitoIdentityServiceProvider({region:process.env.REGION});


exports.handler = async (event) => {
    if (event.userName && event.userPoolId && event.request && event.request.userAttributes && event.request.userAttributes.email) {
        const cognitoRequestParams = {
            UserPoolId: event.userPoolId,
            Filter: 'email = "' + event.request.userAttributes.email + '"'
        };
        
        await Cognito.listUsers(cognitoRequestParams)
        .promise().then(data => {
            if(data.Users.length > 0 && data.Users[0].Username.toLowerCase() != event.userName.toLowerCase()){
                throw new Error('An Account already exist with this email');
            }
        })
        .catch(err => {
            throw(err);
        });
        
    }
    return event;
};