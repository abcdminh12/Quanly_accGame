// Load biến môi trường ngay dòng đầu tiên
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Account = require("./models/Account");
const { encrypt, decrypt } = require("./utils/cryptoHelper");

const app = express();
// Lấy Port và MongoURI từ .env
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/game_manager";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Đã kết nối MongoDB"))
  .catch((err) => console.error("❌ Lỗi DB:", err));

// --- API ---

app.get("/api/accounts", async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    const safeAccounts = accounts.map((acc) => ({
      ...acc._doc,
      password: "••••••••",
    }));
    res.json(safeAccounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/accounts", async (req, res) => {
  try {
    const body = req.body;
    // Mã hóa pass mới
    body.password = encrypt(body.password);

    const newAccount = new Account(body);
    await newAccount.save();
    res.json({ message: "Thêm thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Nếu có nhập pass mới thì mã hóa, không thì bỏ qua
    if (updateData.password && updateData.password !== "••••••••") {
      updateData.password = encrypt(updateData.password);
    } else {
      delete updateData.password;
    }

    await Account.findByIdAndUpdate(id, updateData);
    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reveal", async (req, res) => {
  const { id, masterCode } = req.body;

  // SO SÁNH VỚI MÃ ADMIN TRONG .ENV
  if (masterCode !== process.env.ADMIN_CODE) {
    return res.status(401).json({ success: false, message: "Sai mã bảo vệ!" });
  }

  try {
    const acc = await Account.findById(id);
    if (!acc) return res.status(404).json({ message: "Not found" });
    res.json({ success: true, password: decrypt(acc.password) });
  } catch (err) {
    res.status(500).json({ error: "Lỗi giải mã" });
  }
});

app.delete("/api/accounts/:id", async (req, res) => {
  try {
    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);