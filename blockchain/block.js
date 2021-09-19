const { GENESIS_DATA, MINE_RATE } = require("../genesisBlock");
const cryptoHash = require("../util/crypto-hash");
const hexToBinary = require("hex-to-binary");

class Block {
  constructor({ timestamp, lastHash, hash, data, nonce, difficulty }) {
    this.timestamp = timestamp;
    this.lastHash = lastHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }

  static genesis = () => {
    return new this(GENESIS_DATA);
  };

  static mineBlock = ({ lastBlock, data }) => {
    const lastHash = lastBlock.hash;
    var hash, timestamp;
    var difficulty = lastBlock.difficulty;
    var nonce = 0;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({
        originalBlock: lastBlock,
        timestamp,
      });
      hash = cryptoHash(timestamp, lastHash, data, difficulty, nonce);
    } while (
      hexToBinary(hash).substring(0, difficulty) !== "0".repeat(difficulty)
    );

    return new this({
      timestamp: timestamp,
      lastHash: lastHash,
      data: data,
      difficulty: difficulty,
      nonce: nonce,
      hash: hash,
    });
  };

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;

    if (difficulty < 1) return 1;

    const diff = timestamp - originalBlock.timestamp;
    if (diff > MINE_RATE) return difficulty - 1;

    return difficulty + 1;
  }
}

module.exports = Block;
