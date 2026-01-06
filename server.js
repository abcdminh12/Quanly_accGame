// Load biến môi trường ngay dòng đầu tiên
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// --- SỬA ĐỔI Ở ĐÂY: Trỏ trực tiếp vào file cùng cấp (không có /models hay /utils nữa) ---
const Account = require("./Account");
const { encrypt, decrypt } = require("./cryptoHelper");

const app = express();
// Lấy Port và MongoURI từ .env
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/game_manager";

app.use(cors());
app.use(express.json());

// Cấu hình file tĩnh (HTML/CSS/JS)
// Lưu ý: Nếu file index.html bạn cũng để ở ngoài cùng (ngang hàng server.js),
// code dưới sẽ giúp server trả về file đó khi truy cập trang chủ.
app.use(express.static("public"));

// Route dự phòng: Nếu không tìm thấy trong folder public, thử trả về index.html ở thư mục gốc
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

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
      password: "••••••••", // Luôn che pass khi load danh sách
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
    if (body.password) {
      body.password = encrypt(body.password);
    }
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
    if (
      updateData.password &&
      updateData.password !== "••••••••" &&
      updateData.password.trim() !== ""
    ) {
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

    // Giải mã password
    const rawPass = decrypt(acc.password);
    res.json({ success: true, password: rawPass });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Lỗi giải mã hoặc dữ liệu cũ không tương thích" });
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

app.listen(PORT, "0.0.0.0", () => {
  // Thêm '0.0.0.0' để chắc chắn nó nghe từ mọi nguồn
  console.log(`Server is running on port ${PORT}`);
});
