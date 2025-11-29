# STEP 1 — SETUP PHASE (Trusted Server)
This directory contains the Setup Phase implementation.

## What Happens in Step 1?
- Trusted server generates RSA public/private keys automatically.
- Keys are stored in `/keys/private.pem` and `/keys/public.pem`.
- A public endpoint exposes the public key:
  
  GET http://localhost:5000/keys/public


