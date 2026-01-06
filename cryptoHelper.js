const crypto = require("crypto");
// Load biến môi trường
require("dotenv").config();

// 1. Lấy key từ .env
const RAW_KEY = process.env.SECRET_KEY;
const ALGORITHM = "aes-256-ctr";

// Kiểm tra xem đã cấu hình key chưa
if (!RAW_KEY) {
  throw new Error("❌ LỖI: Chưa cấu hình SECRET_KEY trong file .env");
}

// 2. [QUAN TRỌNG] Tự động băm (Hash) key thành đúng 32 bytes (256 bits)
// Giúp bạn nhập key dài ngắn bao nhiêu trong .env cũng không bị lỗi
const SECRET_KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

const decrypt = (hash) => {
  const [ivHex, contentHex] = hash.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(contentHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
};

module.exports = { encrypt, decrypt };