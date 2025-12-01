import axios from "axios";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();


export const b64ToArrayBuffer = (b64)=>{
  const binary = window.atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

  return bytes.buffer;
}

const arrayBufferToB64 = (buffer)=> {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

// Fetching server public key (PEM)
export async function fetchServerPublicKey() {
  try {
    const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/keys/public`, {
      responseType: "text",
    });
    return res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Failed to fetch public key";
    throw new Error(msg);
  }
}

// Importing PEM public key to WebCrypto
export async function importRsaPublicKey(pem) {
  const b64 = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = b64ToArrayBuffer(b64);
  return window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

// Generating random AES-256 session key and export as base64 raw
export async function generateSessionKeyBase64() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return {
    keyObj: key,
    keyBase64: arrayBufferToB64(raw),
  };
}

// SHA-256 deviceHash from deviceId (hex or base64)
export async function sha256Base64(str) {
  const data = textEncoder.encode(str);
  const hashBuf = await window.crypto.subtle.digest("SHA-256", data);
  return arrayBufferToB64(hashBuf);
}

// RSA-OAEP encrypt JSON payload and return base64
export async function rsaEncryptPayload(publicKey, payloadObj) {
  const payloadStr = JSON.stringify(payloadObj);
  const encoded = textEncoder.encode(payloadStr);
  const cipher = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    encoded
  );
  return arrayBufferToB64(cipher);
}


// AES-GCM decrypt helper (for salt response)
export async function aesGcmDecryptBase64(keyCryptoKey, ivB64, ciphertextB64, tagB64Optional) {
  const iv = b64ToArrayBuffer(ivB64);
  const ct = b64ToArrayBuffer(ciphertextB64);

  try {
    const plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      keyCryptoKey,
      ct
    );
    return new Uint8Array(plainBuf);
  } catch (err) {
    console.error("AES-GCM decrypt error:", err);
    throw err;
  }
}

// import raw session key (base64) into CryptoKey
export async function importSessionKeyFromBase64(keyBase64) {
  const raw = b64ToArrayBuffer(keyBase64);
  return window.crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// PBKDF2 derive RePassword: Using original password and salt (Uint8Array or ArrayBuffer)
export async function deriveRePasswordBase64(originalPassword, saltBuffer) {
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(originalPassword),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const derived = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );
  return arrayBufferToB64(derived);
}


export async function performAuthInit() {
  const deviceId = import.meta.env.VITE_DEVICE_ID;
  const originalPassword = import.meta.env.VITE_PASSWORD;

  if (!deviceId) throw new Error("Device ID is not Found");

  // Fetching public key
  const pem = await fetchServerPublicKey();
  const publicKey = await importRsaPublicKey(pem);

  // Session Key
  const { keyObj: sessionCryptoKey, keyBase64 } = await generateSessionKeyBase64();
  const deviceHashB64 = await sha256Base64(deviceId);
  const payload = { deviceHash: deviceHashB64, sessionKeyBase64: keyBase64 };
  const cipherBase64 = await rsaEncryptPayload(publicKey, payload);

  // Sending to server
  let respJson;
  try {
    const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/init`, { cipher: cipherBase64 });
    respJson = res.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Auth init failed";
    throw new Error(msg);
  }

  if (!respJson.success) throw new Error("Auth init failed: " + respJson.message);

  // Decrypting salt with session key
  const { iv, ciphertext, tag } = respJson.data;

  // Fetcing raw buffers
  const ctBuf = b64ToArrayBuffer(ciphertext);
  const tagBuf = b64ToArrayBuffer(tag);

  // concat ct + tag
  const ctWithTag = new Uint8Array(ctBuf.byteLength + tagBuf.byteLength);
  ctWithTag.set(new Uint8Array(ctBuf), 0);
  ctWithTag.set(new Uint8Array(tagBuf), ctBuf.byteLength);

  // import session key cryptoKey
  const keyForDecrypt = await importSessionKeyFromBase64(keyBase64);

  const ivBuf = b64ToArrayBuffer(iv);
  let saltBytes;
  try {
    const plain = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(ivBuf) },
      keyForDecrypt,
      ctWithTag.buffer
    );
    saltBytes = new Uint8Array(plain);
  } catch (err) {
    console.error("Salt decrypt failed:", err);
    throw new Error("Failed to decrypt salt");
  }
  const rePasswordBase64 = await deriveRePasswordBase64(originalPassword, saltBytes);

  // Save to localStorage: deviceHash, sessionKeyBase64, rePasswordBase64 (for MQTT connect)
  localStorage.setItem("deviceHash", deviceHashB64);
  localStorage.setItem("sessionKeyBase64", keyBase64);
  localStorage.setItem("rePasswordBase64", rePasswordBase64);

  return {
    deviceHash: deviceHashB64,
    sessionKeyBase64: keyBase64,
    rePasswordBase64,
    saltBase64: arrayBufferToB64(saltBytes.buffer),
  };
}
