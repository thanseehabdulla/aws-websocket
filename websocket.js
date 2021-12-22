const AWS = require('aws-sdk');
// Set region
AWS.config.update({region: 'ap-south-1'});

const ENDPOINT = 'https://hy948y07gj.execute-api.ap-south-1.amazonaws.com/production/'
const client = new AWS.ApiGatewayManagementApi({endpoint: ENDPOINT});


const sendToOne = async (id, body) => {
  try {
    await client.postToConnection({
          ConnectionId: id,
          Data: Buffer.from(JSON.stringify(body))
        }).promise()
  } catch (err) {
      console.log(err)
  }
}

const sendToAll = async (ids, body) => {
    console.log('ids', ids)
    const all = (ids||[]).map(i => sendToOne(i, body))
    return Promise.all(all)
}

exports.handler = async (event) => {
    const names = {} 
    
    if(event?.requestContext) {
    
        const connectionId = event.requestContext.connectionId;
        const routeKey = event.requestContext.routeKey;
        let body = {}
        
        try {
            if(event.body) {
                body = JSON.parse(event.body);
            }
            
        } catch (err) {
            
        }
        
        switch(routeKey) {
            case '$connect':
                break
            case '$disconnect':
                delete names[connectionId];
                break
            case 'setName':
                names[connectionId] = body?.name;
                console.log('name', names)
                console.log('name', Object.keys(names))
                await sendToAll(Object.keys(names), { members: Object.values(names) })
                await sendToAll(Object.keys(names), { message: `${names[connectionId]} of ${connectionId} has joined the chat` })
                break
            case 'sendPrivate':
                await sendToOne(connectionId, { message: 'This is a private message'})
                break
            case 'sendPublic':
                await sendToAll(body.connectionIds, { message: body.message })
                break    
            default:
        }
        
    }
    
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
