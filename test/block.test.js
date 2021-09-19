const Block = require("../blockchain/block");
const { GENESIS_DATA, MINE_RATE } = require("../genesisBlock");
const cryptoHash = require("../util/crypto-hash");
const hexToBinary = require("hex-to-binary");

describe("Block", () => {
  const timestamp = "2000";
  const lastHash = "foo-hash";
  const hash = "bar-hash";
  const data = ["blockchain", "data"];
  const nonce = 1;
  const difficulty = 1;
  const block = new Block({
    timestamp: timestamp,
    lastHash: lastHash,
    hash: hash,
    data: data,
    nonce: nonce,
    difficulty: difficulty,
  });

  // create a test for checking the values
  it("has a timestamp, lastHash, hash and data property", () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.lastHash).toEqual(lastHash);
    expect(block.hash).toEqual(hash);
    expect(block.data).toEqual(data);
    expect(block.nonce).toEqual(nonce);
    expect(block.difficulty).toEqual(difficulty);
  });

  // test for genesis function
  describe("genesis()", () => {
    const genesisBlock = Block.genesis();

    // console.log("genesisBlock", genesisBlock);

    it("returns a Block Instance", () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it("returns teh genesis data", () => {
      expect(genesisBlock).toEqual(GENESIS_DATA);
    });
  });

  // test for mining blockchain
  describe("mineBlock()", () => {
    const lastBlock = Block.genesis();
    // console.log("lastBLOCK ", lastBlock.hash);
    const data = "mined data";
    const minedBlock = Block.mineBlock({ lastBlock, data });
    // console.log("mineBlock ", minedBlock);

    it("returns a Block Instance", () => {
      expect(minedBlock instanceof Block).toBe(true);
    });

    it("sets the `lastHash` to be the `hash` of the lastBlock", () => {
      expect(minedBlock.lastHash).toEqual(lastBlock.hash);
    });

    it("sets the `data`", () => {
      expect(minedBlock.data).toEqual(data);
    });

    it("sets a `timestamp`", () => {
      expect(minedBlock.timestamp).not.toEqual(undefined);
    });

    it("creates a SHA-256 `hash` based on the proper inputs", () => {
      expect(minedBlock.hash).toEqual(
        cryptoHash(
          minedBlock.timestamp,
          minedBlock.nonce,
          minedBlock.difficulty,
          lastBlock.hash,
          data
        )
      );
    });

    it("sets a `hash` that matches the difficulty criteria", () => {
      expect(
        hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty)
      ).toEqual("0".repeat(minedBlock.difficulty));
    });

    it("adjust the difficulty", () => {
      const possibleResults = [
        lastBlock.difficulty + 1,
        lastBlock.difficulty - 1,
      ];

      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
    });
  });

  // test to adjust difficulty
  describe("adjustDifficulty()", () => {
    it("raises the difficulty for a quickly mined block", () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: parseInt(block.timestamp) + parseInt(MINE_RATE) - 100,
        })
      ).toEqual(block.difficulty + 1);
    });

    it("lowers the difficulty for a slowly mined block", () => {
      expect(
        Block.adjustDifficulty({
          originalBlock: block,
          timestamp: parseInt(block.timestamp) + parseInt(MINE_RATE) + 100,
        })
      ).toEqual(block.difficulty - 1);
    });

    it("has lower limit of 1", () => {
      block.difficulty = -1;

      expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
    });
  });
});
