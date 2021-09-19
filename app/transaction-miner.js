const Transaction = require("../wallet/transaction");

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }

  mineTransaction = () => {
    //get the transactions pools valid transactions
    const validTransactions = this.transactionPool.validTransactions();

    // generate miner's rewards
    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet })
    );

    // add a block consisiting of these transactions to the blockchain
    this.blockchain.addBlock({ data: validTransactions });

    // broadcast the updated blockchain to the
    this.pubsub.broadcastChain();

    // clear the pool
    this.transactionPool.clear();
  };
}

module.exports = TransactionMiner;
