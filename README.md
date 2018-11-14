Getting started with Whisper
===

## Intro
In this tutorial we'll learn how to use Ethereum Whisper to create a simple chat CLI. This dApp has some prerequisites that need to be installed: NodeJS and Go-Ethereum.

#### NodeJS 8.10+
```
node version
> 8.10+
```
If you need to update Node, please [install `nvm`](https://github.com/creationix/nvm#installation) and install/use the LTS version. macOS/Linux commands provided for you below:
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
nvm install --lts
nvm use lts
```

#### Go-ethereum 1.8.17+
```
geth version
> 1.8.17+
```
If you need to [install `geth`](https://github.com/ethereum/go-ethereum/wiki/Building-Ethereum), you can use the below for macOS:
```
brew tap ethereum/ethereum
brew install ethereum
```

And these instructions if you're on Ubuntu
```
sudo add-apt-repository -y ppa:ethereum/ethereum
sudo apt-get install ethereum
```

## Start a Geth node

To use Whisper, you need a running Geth node. You can execute the following command to start this node with the minimum required options

```
geth --testnet --syncmode=light --ws --wsorigins=mychat --shh --wsapi=web3,shh,net
```

## Setup and explore!

Now that we have all the prerequisites, we need to clone our project and install its dependencies

```
git clone https://github.com/status-im/whisper-tutorial.git
cd whisper-tutorial
npm install
```

Once you have installed all the dependencies, you may execute `npm start` to see what's our project about! we'll implement all the functionality for sending public and private messages. You can close the application with `Ctrl + c`


## Coding our chat CLI
The file `src/index.js` is full of `TODO`s that we need to work with. The following sections details how we will complete these actions in a logical way. At the end of each section you can execute `npm start` to see the progress.

#### `// TODO: Web3 connection`
In order to communicate via Whisper, we need a web3 connection. Based in the previous `geth` command we can connect to our node with the following code

```
// Web3 connection
const web3 = new Web3();
try {
    web3.setProvider(new Web3.providers.WebsocketProvider("ws://localhost:8546", {headers: {Origin: "mychat"}}));
    await web3.eth.net.isListening();
} catch(err) {
    process.exit();
}
```

The CLI will attempt to connect to our node. It uses the origin `mychat`, specified in the `--wsorigins` flag of the `geth` command. If it cannot connect, the chat window closes.


#### `// TODO: Generate keypair`
We need to generate a keypair that is going to be used to sign the messages we send and also to be able to receive private messages

```
// Generate keypair
const keyPair = await web3.shh.newKeyPair();
```

#### `// TODO: Generate a symmetric key`
Public group messages are messages that are not addressed to anyone in particular and are received by anyone that's listening in a specific channel. In our chat application, our channel is represented by a shared symmetric key.

```
// Generate a symmetric key
const channelSymKey = await web3.shh.generateSymKeyFromPassword(DEFAULT_CHANNEL);
```

#### `// TODO: Obtain public key`
We need to obtain the public key to be able to identify your messages. This is done with the following code:

```
// Obtain public key
const pubKey = await web3.shh.getPublicKey(keyPair);
```

#### `// TODO: Send a public message`
Once we have generated the symmetric key, we can send messages using `web3.shh.post`. We'll sign our message with our `keypair` and send it to a particular topic. 

```
// Send a public message
web3.shh.post({
    symKeyID: channelSymKey,
    sig: keyPair,
    ttl: TTL,
    topic: channelTopic,
    payload: web3.utils.fromAscii(message),
    powTime: POW_TIME,
    powTarget: POW_TARGET
});
```

> `topic` is a 4 bytes hex string that can be used to filter messages. `ttl` is the time to live in seconds. `powTime` is the maximal time in seconds to be spent on proof of work and `powTarget` is the minimal PoW target required for this message.

#### `// TODO: Subscribe to public chat messages`
You may have noticed that the messages you are sending are not being displayed on the screen. We need to implement this functionality by subscribing to the messages received in the symmetric key. 

```
// Subscribe to public chat messages
web3.shh.subscribe("messages", {
    minPow: POW_TARGET,
    symKeyID: channelSymKey,
    topics: [DEFAULT_TOPIC]
}).on('data', (data) => {
    // Display message in the UI
    ui.addMessage(data.sig, web3.utils.toAscii(data.payload));
}).on('error', (err) => {
    ui.addError("Couldn't decode message: " + err.message);
});
```

After adding this code, open two instances of the chat application and write a message. You'll see how it gets displayed in both windows. The only thing is that all messages you write can be seen by anyone listening to this channel, so lets fix this by adding private messages.

#### `// TODO: Send private message`

So, in order to send private messages, we have a command similar to IRC: `/msg 0xcontact_public_key message`. So, if you want to send a message, you just simply copy the contact's public key from the chat CLI, and write the message. 

We already assign the contact's public key to the `contactCode` variable, and the body of the message in `messageContent`. 

Sending a message to a specific asymmetric public key is similar to sending it to a symmetric key. The difference is that you need to specify the `pubKey` attribute instead of `symKeyId`.

```
// Send private message
web3.shh.post({
    pubKey: contactCode,
    sig: keyPair,
    ttl: TTL,
    topic: channelTopic,
    payload: web3.utils.fromAscii(messageContent),
    powTime: POW_TIME,
    powTarget: POW_TARGET
});
```

> In Ubuntu, you need to press `Shift` and drag-click the mouse to select the contact's public key

#### `// TODO: Subscribe to private messages`
And similar to receiving messages from the public channel, to receive private messages we need to create a subscription, this time with a `privateKeyID` with our `keyPair` in order for the subscription to receive messages that were sent to our public key.

```
// Subscribe to private messages
web3.shh.subscribe("messages", {
    minPow: POW_TARGET,
    privateKeyID: keyPair,
    topics: [DEFAULT_TOPIC]
}).on('data', (data) => {
    ui.addMessage(data.sig, web3.utils.toAscii(data.payload), true);
}).on('error', (err) => {
    ui.addError("Couldn't decode message: " + err.message);
});
```

Once you add this code, go ahead and open three instances of our chat application, write a public message in one window, and in the other, copy the public key and send a private message to the account that created the first message. Only the first and second window will be able to see the message, but the third window will only have received the public message.

## Final thoughts
So, as you can see, using Whisper for descentralized communication is quite easy, and you could leverage this protocol for using it for passing offchain messages that are cryptographically secure.

However, at the moment there aren't enough online nodes available that have Whisper enabled (probably due to lack of incentives for running this feature), so messages may fail to get delivered unless you bootstrap some nodes like we do here at Status. You can contribute to grow the number of nodes availables by running your own node with the `--shh` option enabled.
