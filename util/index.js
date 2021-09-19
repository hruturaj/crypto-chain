const EC = require("elliptic").ec;
const cryptoHash = require("./crypto-hash");

const ec = new EC("secp256k1"); // standards of cryptograhy with 256bits with elliptic base algorithm

// functons
const verifySignature = ({ publicKey, data, signature }) => {
  const keyFromPublic = ec.keyFromPublic(publicKey, "hex");

  return keyFromPublic.verify(cryptoHash(data), signature);
};

module.exports = { ec, verifySignature, cryptoHash };
