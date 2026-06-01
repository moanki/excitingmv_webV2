import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const KEY_ENV = "EMAIL_CONFIG_ENCRYPTION_KEY";

function getEncryptionKey() {
  const value = process.env[KEY_ENV];

  if (!value) {
    throw new Error("Email encryption key is not configured.");
  }

  const decoded = Buffer.from(value, "base64");
  if (decoded.length === 32) {
    return decoded;
  }

  const raw = Buffer.from(value);
  if (raw.length === 32) {
    return raw;
  }

  throw new Error("Email encryption key must be 32 bytes or base64 encoded 32 bytes.");
}

export function encryptSecret(plainText: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

export function decryptSecret(input: { encrypted: string; iv: string; authTag: string }) {
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(input.iv, "base64"));
  decipher.setAuthTag(Buffer.from(input.authTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(input.encrypted, "base64")),
    decipher.final()
  ]).toString("utf8");
}
