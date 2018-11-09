const Web3 = require('web3');
const UI = require('./ui');

// Useful constants
const DEFAULT_CHANNEL = "default";
const DEFAULT_TOPIC = "0x11223344";
const PRIVATE_MESSAGE_REGEX = /^\/msg (0x[A-Za-z0-9]{130}) (.*)$/;

const POW_TIME = 100;
const TTL = 20;
const POW_TARGET = 2;

(async () => {
    // Web3 connection
    const web3 = new Web3();
    try {
        web3.setProvider(new Web3.providers.WebsocketProvider("ws://localhost:8546", {headers: {Origin: "mychat"}}));
        await web3.eth.net.isListening();
    } catch(err) {
        process.exit();
    }

    const ui = new UI();
    
    // TODO: Generate keypair
    const keyPair = ""; 

    // TODO: Obtain public key
    const pubKey = "";

    ui.setUserPublicKey(pubKey);
    
    // TODO: Generate a symmetric key
    const channelSymKey = ""; 

    const channelTopic = DEFAULT_TOPIC;

    ui.events.on('cmd', async (message) => {
        try {
            if(message.startsWith('/msg')){
                if(PRIVATE_MESSAGE_REGEX.test(message)){
                    const msgParts = message.match(PRIVATE_MESSAGE_REGEX);
                    const contactCode = msgParts[1];
                    const messageContent = msgParts[2];

                    // TODO: Send private message

                    // Since it is a private message, we need to display it in the UI
                    ui.addMessage(pubKey, messageContent);
                }
            } else {
                // TODO: Send a public message
               
            }
        } catch(err) {
            console.log(err);
            ui.addError("Couldn't send message: " + err.message);
        }
    });

    // TODO: Subscribe to public chat messages

    // TODO: Subscribe to private messages
   
})();