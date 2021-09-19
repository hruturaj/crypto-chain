const PubNub = require("pubnub");

const credentials = {
  publishKey: "pub-c-4a0481bd-9415-4481-9dfb-621bfef6b265",
  subscribeKey: "sub-c-f5c99c4a-171d-11ec-914f-5693d1c31269",
  secretKey: "sec-c-MDQ1NTM5OWQtYzc5OC00NzY1LWIzZTAtMmE4MjU0YTFjMTY3",
};

const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN",
  TRANSACTION: "TRANSACTION",
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;

    this.pubnub = new PubNub(credentials);

    this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

    this.pubnub.addListener(this.listener());
  }

  // subscribe to channel
  subscribeToChannels = () => {
    this.pubnub.subscribe({
      channels: [Object.values(CHANNELS)],
    });
  };

  listener() {
    return {
      message: (messageObject) => {
        const { channel, message } = messageObject;

        console.log(
          `Message recived. Channel: ${channel}. Message: ${message} \n`
        );
        const parsedMessage = JSON.parse(message);

        switch (channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransaction({
                chain: parsedMessage,
              });
            });
            break;
          case CHANNELS.TRANSACTION:
            if (
              !this.transactionPool.existingTransaction({
                inputAddress: this.wallet.publicKey,
              })
            ) {
              this.transactionPool.setTransaction(parsedMessage);
            }
            break;
          default:
            return;
        }
      },
    };
  }

  publish = ({ channel, message }) => {
    this.pubnub.publish({ channel, message });
  };

  // brodcasting blockchain
  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  // brodcasting transaction
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = PubSub;
