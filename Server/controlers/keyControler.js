import  {getPublicKey}   from "../utils/keyManager.js";

const getServerPublicKey = (req, res) => {
  try {
    const publicKey = getPublicKey();
    res.setHeader("Content-Type", "text/plain");
    return res.send(publicKey);
  } catch (error) {
    console.error("Error fetching public key:", error);
    return res.status(500).json({ message: "Failed to load public key" });
  }
};

export default getServerPublicKey;
