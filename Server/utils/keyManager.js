import fs from "fs";
import path from "path";
import crypto from "crypto";

const __dirname = path.resolve();

const keysDir = path.join(__dirname, "keys");
const privateKeyPath = path.join(keysDir, "private.pem");
const publicKeyPath = path.join(keysDir, "public.pem");

export function ensureKeysExist() {
  if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir);

  const privateExists = fs.existsSync(privateKeyPath);
  const publicExists = fs.existsSync(publicKeyPath);

  if (privateExists && publicExists) {
    console.log("RSA keys already exist.");
    return;
  }
  console.log("Generating RSA key pair...");

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem"
    }
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  console.log("RSA keypair created successfully.");
}

export function getPublicKey() {
  return fs.readFileSync(publicKeyPath, "utf8");
}

export function getPrivateKey() {
  return fs.readFileSync(privateKeyPath, "utf8");
}
