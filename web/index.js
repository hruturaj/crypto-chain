const { DEFAULT_EXTENSIONS } = require("@babel/core");
const express = require("express");
const path = require("path");
const Blockchain = require("../blockchain/blockchain");
const PubSub = require("../app/pubsub");
const request = require("request");
const TransactionPool = require("../wallet/transaction-pool");
const Wallet = require("../wallet/wallet");
const TransactionMiner = require("../app/transaction-miner");
const cors = require("cors");

// const isDevelopment = process.env.ENV === "development";

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
});

// const variables
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
const REDIS_URL = "";

// console.log("blokchain", blockchain); // printing blokchain
// pubsub broadcasting functions
setTimeout(() => pubsub.broadcastChain(), 1000);

// middleware
app.use(express.json()); // bodyparser json (bodyParser is now part of express)
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use(cors());

// api routes
app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain);
});

app.post("/api/mine", (req, res) => {
  const { data } = req.body;

  blockchain.addBlock({ data: data });

  pubsub.broadcastChain();

  res.redirect("/api/blocks");
});

app.post("/api/transact", (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message });
  }

  transactionPool.setTransaction(transaction);

  pubsub.broadcastTransaction(transaction);

  res.json({ type: "success", transaction });
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get("/api/mine-transaction", (req, res) => {
  transactionMiner.mineTransaction();

  res.redirect("/api/blocks");
});

app.get("/api/wallet-info", (req, res) => {
  const address = wallet.publicKey;
  res.json({
    address: address,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address: address,
    }),
  });
});

// url for html pages
app.get("*", (req, res) => {
  console.log(__dirname);
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// syncing chains when new server joins the blovkchain network
const syncWithRootState = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);

        console.log("replace chain on sync with", rootChain);
        blockchain.replaceChain(rootChain);
      }
    }
  );

  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);

        console.log(
          "replace transaction pool map on a sync with",
          rootTransactionPoolMap
        );

        transactionPool.setMap(rootTransactionPoolMap);
      }
    }
  );
};

// if (isDevelopment) {
const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  const transaction = wallet.createTransaction({
    recipient,
    amount,
    chain: blockchain.chain,
  });

  transactionPool.setTransaction(transaction);
};

const walletAction = () =>
  generateWalletTransaction({
    wallet,
    recipient: walletFoo.publicKey,
    amount: 5,
  });

const walletFooAction = () =>
  generateWalletTransaction({
    wallet: walletFoo,
    recipient: walletBar.publicKey,
    amount: 10,
  });

const walletBarAction = () =>
  generateWalletTransaction({
    wallet: walletBar,
    recipient: wallet.publicKey,
    amount: 15,
  });

for (let i = 0; i < 5; i++) {
  if (i % 3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i % 3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransaction();
}
// }

// adding PEER PORT
let PEER_PORT;
if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

// listenig to port address
const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
  console.log(`listening to port ${PORT}`);

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});
