const http = require("http");
const url = require("url");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const PORT = 5001;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) { console.error("FATAL: JWT_SECRET not set in .env"); process.exit(1); }
const IS_PROD = process.env.NODE_ENV === "production";

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendMail(to, subject, html) {
  if (!process.env.EMAIL_USER) return; // skip if not configured
  try { await mailer.sendMail({ from: `Left2Right <${process.env.EMAIL_USER}>`, to, subject, html }); }
  catch (err) { console.error("Mail error:", err.message); }
}
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

let foods, users, orders, carts, activity;

/* ── Sample Data ── */
async function seed() {
  try {
    const userCount = await users.countDocuments();
    if (userCount === 0) {
      await users.insertMany([
        { name: "Alice", email: "alice@example.com", role: "User", password: await bcrypt.hash("alice123", 10), blocked: false, joinedAt: new Date() },
        { name: "Bob", email: "bob@example.com", role: "User", password: await bcrypt.hash("bob123", 10), blocked: false, joinedAt: new Date() },
        { name: "Charlie", email: "charlie@example.com", role: "User", password: await bcrypt.hash("charlie123", 10), blocked: false, joinedAt: new Date() },
        { name: "Diana", email: "diana@example.com", role: "User", password: await bcrypt.hash("diana123", 10), blocked: false, joinedAt: new Date() },
        { name: "Admin", email: "admin@left2right.com", role: "Admin", password: await bcrypt.hash("admin123", 10), blocked: false, joinedAt: new Date() }
      ]);
      console.log("Users seeded");
    }

    const foodCount = await foods.countDocuments();
    if (foodCount === 0) {
      await foods.insertMany([
        { foodItem: "Vegetable Biryani", description: "Freshly cooked aromatic biryani with mixed vegetables", donorName: "Alice", donorEmail: "alice@example.com", servings: 10, category: "Rice", pickupLocation: "12 MG Road, Bangalore", pickupTime: "6:00 PM - 8:00 PM", status: "Approved", inStock: true, noExpiry: true, createdAt: new Date() },
        { foodItem: "Paneer Butter Masala", description: "Rich and creamy paneer curry, best with naan or rice", donorName: "Bob", donorEmail: "bob@example.com", servings: 8, category: "Curry", pickupLocation: "45 Anna Nagar, Chennai", pickupTime: "5:00 PM - 7:00 PM", status: "Approved", inStock: true, noExpiry: true, createdAt: new Date() },
        { foodItem: "Idli Sambar", description: "Soft idlis with freshly made sambar and coconut chutney", donorName: "Charlie", donorEmail: "charlie@example.com", servings: 12, category: "Breakfast", pickupLocation: "7 Koramangala, Bangalore", pickupTime: "8:00 AM - 10:00 AM", status: "Approved", inStock: true, noExpiry: true, createdAt: new Date() },
        { foodItem: "Masala Dosa", description: "Crispy dosa with spiced potato filling", donorName: "Diana", donorEmail: "diana@example.com", servings: 15, category: "Breakfast", pickupLocation: "22 Banjara Hills, Hyderabad", pickupTime: "7:30 AM - 9:30 AM", status: "Approved", inStock: true, noExpiry: true, createdAt: new Date() },
        { foodItem: "Chole Bhature", description: "Spicy chickpea curry with fluffy bhature", donorName: "Alice", donorEmail: "alice@example.com", servings: 7, category: "Curry", pickupLocation: "12 MG Road, Bangalore", pickupTime: "12:00 PM - 2:00 PM", status: "Approved", inStock: true, noExpiry: true, createdAt: new Date() },
        { foodItem: "Veg Fried Rice", description: "Wok-tossed fried rice with fresh vegetables", donorName: "Bob", donorEmail: "bob@example.com", servings: 10, category: "Rice", pickupLocation: "45 Anna Nagar, Chennai", pickupTime: "1:00 PM - 3:00 PM", status: "Pending", inStock: true, noExpiry: true, createdAt: new Date() }
      ]);
      console.log("Foods seeded");
    }
  } catch (err) {
    console.error("Seed error:", err.message);
  }
}

/* ── Pagination helper ── */
function paginate(arr, page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(50, Math.max(1, parseInt(limit) || 10));
  return { data: arr.slice((p - 1) * l, p * l), total: arr.length, page: p, pages: Math.ceil(arr.length / l) };
}

/* ── Auto-delete expired foods (older than 2 hours) ── */
function startExpiryJob() {
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - TWO_HOURS);
      const expired = await foods.find({ createdAt: { $lt: cutoff }, noExpiry: { $ne: true } }).toArray();
      if (expired.length > 0) {
        const ids = expired.map(f => f._id);
        await foods.deleteMany({ _id: { $in: ids } });
        for (const f of expired) {
          await log("System", "Auto-deleted expired food", f.foodItem);
        }
        console.log(`Auto-deleted ${expired.length} expired food listing(s)`);
      }
    } catch (err) {
      console.error("Expiry job error:", err.message);
    }
  }, 60 * 1000); // runs every minute
}

/* ── Migrate plaintext passwords to bcrypt ── */
async function migratePasswords() {
  const allUsers = await users.find({}).toArray();
  for (const u of allUsers) {
    if (u.password && !u.password.startsWith("$2")) {
      const hashed = await bcrypt.hash(u.password, 10);
      await users.updateOne({ _id: u._id }, { $set: { password: hashed } });
    }
  }
}

/* ── DB Connect ── */
async function connectDB() {
  await client.connect();
  const db = client.db("left2right");
  foods = db.collection("foods");
  users = db.collection("users");
  orders = db.collection("orders");
  carts = db.collection("carts");
  activity = db.collection("activity");
  console.log("MongoDB connected → left2right");
  await seed();
  await migratePasswords();
  // ensure existing seed foods aren't deleted by expiry job
  await foods.updateMany({ noExpiry: { $exists: false }, donorEmail: { $in: ["alice@example.com", "bob@example.com", "charlie@example.com", "diana@example.com"] } }, { $set: { noExpiry: true } });
}

/* ── Helpers ── */
function safeUser(doc) {
  if (!doc) return null;
  const { _id, password, resetCode, resetExpiry, ...rest } = doc;
  return { _id: _id.toString(), ...rest };
}

function toId(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { _id: _id.toString(), ...rest };
}

function body(req) {
  return new Promise((res, rej) => {
    let d = "";
    req.on("data", c => (d += c));
    req.on("end", () => { try { res(JSON.parse(d)); } catch { rej(new Error("Invalid JSON")); } });
  });
}

async function log(user, action, target = "") {
  await activity.insertOne({ user, action, target, timestamp: new Date() });
}

function send(res, code, data) {
  res.writeHead(code);
  res.end(JSON.stringify(data));
}

/* ── Auth middleware ── */
function authenticate(req) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function requireAuth(req, res, role) {
  const claims = authenticate(req);
  if (!claims) { send(res, 401, { message: "Authentication required" }); return null; }
  if (role && claims.role !== role) { send(res, 403, { message: "Forbidden" }); return null; }
  return claims;
}

/* ── Server ── */
function startServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Content-Type", "application/json");

    if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

    const { pathname, query } = url.parse(req.url, true);
    const seg = pathname.split("/").filter(Boolean);

    try {
      /* ── AUTH ── */
      if (req.method === "POST" && pathname === "/register") {
        const { name, email, password } = await body(req);
        if (!name || !email || !password) return send(res, 400, { message: "All fields required" });
        if (await users.findOne({ email })) return send(res, 409, { message: "Email already registered" });
        const hashed = await bcrypt.hash(password, 10);
        await users.insertOne({ name, email, password: hashed, role: "User", blocked: false, joinedAt: new Date() });
        await log(name, "Registered");
        return send(res, 201, { message: "Registered successfully" });
      }

      if (req.method === "POST" && pathname === "/login") {
        const { email, password } = await body(req);
        const user = await users.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) return send(res, 401, { message: "Invalid credentials" });
        if (user.blocked) return send(res, 403, { message: "Your account has been blocked" });
        const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        await log(user.name, "Logged in");
        return send(res, 200, { user: safeUser(user), token });
      }

      /* ── PROFILE ── */
      if (req.method === "GET" && pathname === "/profile") {
        if (!requireAuth(req, res)) return;
        const user = await users.findOne({ email: query.email });
        if (!user) return send(res, 404, { message: "User not found" });
        return send(res, 200, safeUser(user));
      }

      if (req.method === "PUT" && pathname === "/profile") {
        if (!requireAuth(req, res)) return;
        const { email, name, newPassword } = await body(req);
        const upd = { name };
        if (newPassword) upd.password = await bcrypt.hash(newPassword, 10);
        await users.updateOne({ email }, { $set: upd });
        const updated = await users.findOne({ email });
        return send(res, 200, safeUser(updated));
      }

      /* ── FOODS ── */
      if (req.method === "GET" && pathname === "/foods") {
        const filter = { status: "Approved", inStock: true };
        if (query.category) filter.category = query.category;
        if (query.search) filter.foodItem = { $regex: query.search, $options: "i" };
        if (query.location) filter.pickupLocation = { $regex: query.location, $options: "i" };
        const list = await foods.find(filter).sort({ createdAt: -1 }).toArray();
        const mapped = list.map(toId);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      if (req.method === "GET" && pathname === "/foods/all") {
        const list = await foods.find().sort({ createdAt: -1 }).toArray();
        const mapped = list.map(toId);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      if (req.method === "GET" && pathname === "/foods/mine") {
        const list = await foods.find({ donorEmail: query.email }).sort({ createdAt: -1 }).toArray();
        return send(res, 200, list.map(toId));
      }

      if (req.method === "POST" && pathname === "/foods") {
        if (!requireAuth(req, res)) return;
        const data = await body(req);
        const doc = { ...data, status: "Pending", inStock: true, servings: parseInt(data.servings) || 1, createdAt: new Date() };
        const result = await foods.insertOne(doc);
        await log(data.donorName, "Posted food", data.foodItem);
        return send(res, 201, toId({ _id: result.insertedId, ...doc }));
      }

      if (req.method === "PATCH" && seg[0] === "foods" && seg[1]) {
        if (!requireAuth(req, res, "Admin")) return;
        const id = seg[1];
        const data = await body(req);
        const upd = {};
        if (data.status !== undefined) upd.status = data.status;
        if (data.inStock !== undefined) upd.inStock = data.inStock;
        if (data.servings !== undefined) upd.servings = data.servings;
        if (data.rejectionReason !== undefined) upd.rejectionReason = data.rejectionReason;
        await foods.updateOne({ _id: new ObjectId(id) }, { $set: upd });
        const updated = await foods.findOne({ _id: new ObjectId(id) });
        await log("Admin", `Updated food: ${JSON.stringify(upd)}`, updated?.foodItem);
        // notify donor on rejection
        if (data.status === "Rejected" && updated?.donorEmail) {
          const reason = data.rejectionReason || "Did not meet listing guidelines";
          await sendMail(updated.donorEmail, "Your Left2Right listing was not approved",
            `<p>Hi ${updated.donorName},</p><p>Your listing <strong>${updated.foodItem}</strong> was not approved.</p><p><strong>Reason:</strong> ${reason}</p><p>You can edit and resubmit from My Listings.</p>`);
        }
        return send(res, 200, toId(updated));
      }

      if (req.method === "DELETE" && seg[0] === "foods" && seg[1]) {
        if (!requireAuth(req, res)) return;
        const { donorEmail } = url.parse(req.url, true).query;
        const food = await foods.findOne({ _id: new ObjectId(seg[1]) });
        if (!food) return send(res, 404, { message: "Food not found" });
        // allow donor or admin to delete
        if (donorEmail && food.donorEmail !== donorEmail) return send(res, 403, { message: "Not authorized" });
        await foods.deleteOne({ _id: new ObjectId(seg[1]) });
        await log(donorEmail || "Admin", "Deleted food", food.foodItem);
        return send(res, 200, { message: "Deleted" });
      }

      /* ── CART ── */
      if (req.method === "GET" && pathname === "/cart") {
        if (!requireAuth(req, res)) return;
        const cart = await carts.findOne({ email: query.email });
        return send(res, 200, cart ? cart.items : []);
      }

      if (req.method === "POST" && pathname === "/cart") {
        if (!requireAuth(req, res)) return;
        const { email, item } = await body(req);
        const cart = await carts.findOne({ email });
        if (cart) {
          const idx = cart.items.findIndex(i => i.foodId === item.foodId);
          if (idx > -1) {
            cart.items[idx].quantity += item.quantity;
            await carts.updateOne({ email }, { $set: { items: cart.items } });
          } else {
            await carts.updateOne({ email }, { $push: { items: item } });
          }
        } else {
          await carts.insertOne({ email, items: [item] });
        }
        const updated = await carts.findOne({ email });
        return send(res, 200, updated.items);
      }

      if (req.method === "DELETE" && pathname === "/cart/item") {
        if (!requireAuth(req, res)) return;
        const { email, foodId } = await body(req);
        await carts.updateOne({ email }, { $pull: { items: { foodId } } });
        const updated = await carts.findOne({ email });
        return send(res, 200, updated ? updated.items : []);
      }

      if (req.method === "DELETE" && pathname === "/cart") {
        if (!requireAuth(req, res)) return;
        const { email } = await body(req);
        await carts.deleteOne({ email });
        return send(res, 200, []);
      }

      /* ── ORDERS ── */
      if (req.method === "DELETE" && seg[0] === "orders" && seg[1]) {
        if (!requireAuth(req, res)) return;
        const order = await orders.findOne({ _id: new ObjectId(seg[1]) });
        if (!order) return send(res, 404, { message: "Order not found" });
        if (order.email !== url.parse(req.url, true).query.email) return send(res, 403, { message: "Not authorized" });
        // restore servings
        for (const item of order.items) {
          const food = await foods.findOne({ _id: new ObjectId(item.foodId) });
          if (food) {
            await foods.updateOne({ _id: new ObjectId(item.foodId) }, { $inc: { servings: item.quantity }, $set: { inStock: true } });
          } else {
            // food was fully claimed and deleted — recreate a stub so servings go back
            await foods.insertOne({ ...item, _id: undefined, status: "Approved", inStock: true, servings: item.quantity, createdAt: new Date() });
          }
        }
        await orders.deleteOne({ _id: new ObjectId(seg[1]) });
        await log(order.userName, "Cancelled order", `${order.items.length} item(s)`);
        return send(res, 200, { message: "Order cancelled" });
      }

      if (req.method === "POST" && pathname === "/orders") {
        if (!requireAuth(req, res)) return;
        const { email, userName, items } = await body(req);
        // enrich items with donor contact from foods collection
        const enriched = [];
        for (const item of items) {
          const food = await foods.findOne({ _id: new ObjectId(item.foodId) });
          if (!food || food.servings < item.quantity) return send(res, 400, { message: `Not enough servings for ${item.foodItem}` });
          enriched.push({ ...item, donorEmail: food.donorEmail, pickupLocation: food.pickupLocation });
          const newServings = food.servings - item.quantity;
          if (newServings <= 0) {
            await foods.deleteOne({ _id: new ObjectId(item.foodId) });
            await log("System", "Removed food (all servings claimed)", food.foodItem);
          } else {
            await foods.updateOne({ _id: new ObjectId(item.foodId) }, { $set: { servings: newServings, inStock: true } });
          }
        }
        const order = { email, userName, items: enriched, status: "Confirmed", placedAt: new Date() };
        const result = await orders.insertOne(order);
        await carts.deleteOne({ email });
        await log(userName, "Placed order", `${items.length} item(s)`);
        return send(res, 201, toId({ _id: result.insertedId, ...order }));
      }

      if (req.method === "GET" && pathname === "/orders") {
        if (!requireAuth(req, res)) return;
        const list = await orders.find({ email: query.email }).sort({ placedAt: -1 }).toArray();
        const mapped = list.map(toId);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      if (req.method === "GET" && pathname === "/orders/all") {
        if (!requireAuth(req, res, "Admin")) return;
        const list = await orders.find().sort({ placedAt: -1 }).toArray();
        const mapped = list.map(toId);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      /* ── USERS (Admin) ── */
      if (req.method === "GET" && pathname === "/users") {
        if (!requireAuth(req, res, "Admin")) return;
        const list = await users.find({ role: "User" }).sort({ joinedAt: -1 }).toArray();
        const mapped = list.map(safeUser);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      if (req.method === "PATCH" && seg[0] === "users" && seg[1]) {
        if (!requireAuth(req, res, "Admin")) return;
        const { blocked } = await body(req);
        await users.updateOne({ _id: new ObjectId(seg[1]) }, { $set: { blocked } });
        const updated = await users.findOne({ _id: new ObjectId(seg[1]) });
        await log("Admin", blocked ? "Blocked user" : "Unblocked user", updated?.name);
        return send(res, 200, safeUser(updated));
      }

      if (req.method === "DELETE" && seg[0] === "users" && seg[1]) {
        if (!requireAuth(req, res, "Admin")) return;
        const user = await users.findOne({ _id: new ObjectId(seg[1]) });
        await users.deleteOne({ _id: new ObjectId(seg[1]) });
        await log("Admin", "Deleted user", user?.name);
        return send(res, 200, { message: "Deleted" });
      }

      /* ── STATS (Admin + Landing) ── */
      if (req.method === "GET" && pathname === "/stats") {
        if (!requireAuth(req, res)) return;
        const [totalUsers, totalFoods, totalOrders, pendingFoods, approvedFoods] = await Promise.all([
          users.countDocuments({ role: "User" }),
          foods.countDocuments(),
          orders.countDocuments(),
          foods.countDocuments({ status: "Pending" }),
          foods.countDocuments({ status: "Approved" })
        ]);
        const recentOrders = await orders.find().sort({ placedAt: -1 }).limit(5).toArray();
        // total servings shared = sum of all order item quantities
        const allOrders = await orders.find({}, { projection: { items: 1 } }).toArray();
        const totalServings = allOrders.reduce((s, o) => s + o.items.reduce((a, i) => a + (i.quantity || 0), 0), 0);
        return send(res, 200, { totalUsers, totalFoods, totalOrders, pendingFoods, approvedFoods, totalServings, recentOrders: recentOrders.map(toId) });
      }

      /* ── RATINGS ── */
      if (req.method === "POST" && pathname === "/ratings") {
        if (!requireAuth(req, res)) return;
        const { orderId, itemIndex, rating, comment, reviewerName } = await body(req);
        await orders.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { [`items.${itemIndex}.rating`]: rating, [`items.${itemIndex}.comment`]: comment, [`items.${itemIndex}.reviewedBy`]: reviewerName } }
        );
        await log(reviewerName, `Rated food ${rating}★`, "");
        return send(res, 200, { message: "Rating saved" });
      }

      /* ── DONOR RATING SUMMARY ── */
      if (req.method === "GET" && pathname === "/donor-rating") {
        const donorName = query.donorName;
        const allOrders = await orders.find({ "items.donorName": donorName }).toArray();
        const ratings = [];
        for (const o of allOrders)
          for (const item of o.items)
            if (item.donorName === donorName && item.rating) ratings.push(item.rating);
        const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
        return send(res, 200, { avg, count: ratings.length });
      }

      /* ── BATCH DONOR RATINGS ── */
      if (req.method === "POST" && pathname === "/donor-ratings/batch") {
        const { donorNames } = await body(req);
        if (!Array.isArray(donorNames) || donorNames.length === 0) return send(res, 400, { message: "donorNames array required" });
        const allOrders = await orders.find({ "items.donorName": { $in: donorNames } }).toArray();
        const map = {};
        for (const name of donorNames) map[name] = { sum: 0, count: 0 };
        for (const o of allOrders)
          for (const item of o.items)
            if (item.rating && map[item.donorName]) {
              map[item.donorName].sum += item.rating;
              map[item.donorName].count++;
            }
        const result = {};
        for (const name of donorNames) {
          const { sum, count } = map[name];
          result[name] = count ? { avg: (sum / count).toFixed(1), count } : { avg: null, count: 0 };
        }
        return send(res, 200, result);
      }

      /* ── REPORTS ── */
      if (req.method === "POST" && pathname === "/reports") {
        if (!requireAuth(req, res)) return;
        const { foodId, foodItem, donorName, reason, reporterName } = await body(req);
        await activity.insertOne({ user: reporterName, action: "Reported food", target: `${foodItem} (by ${donorName}): ${reason}`, timestamp: new Date(), type: "report", foodId });
        await log(reporterName, "Reported food", `${foodItem} — ${reason}`);
        return send(res, 201, { message: "Report submitted" });
      }

      if (req.method === "GET" && pathname === "/reports") {
        if (!requireAuth(req, res, "Admin")) return;
        const list = await activity.find({ type: "report" }).sort({ timestamp: -1 }).toArray();
        return send(res, 200, list.map(toId));
      }

      /* ── MARK PICKED UP ── */
      if (req.method === "PATCH" && pathname === "/orders/pickup") {
        if (!requireAuth(req, res)) return;
        const { orderId, itemIndex } = await body(req);
        await orders.updateOne(
          { _id: new ObjectId(orderId) },
          { $set: { [`items.${itemIndex}.pickedUp`]: true } }
        );
        return send(res, 200, { message: "Marked as picked up" });
      }

      /* ── EDIT FOOD (donor) ── */
      if (req.method === "PUT" && seg[0] === "foods" && seg[1]) {
        if (!requireAuth(req, res)) return;
        const id = seg[1];
        const data = await body(req);
        const food = await foods.findOne({ _id: new ObjectId(id) });
        if (!food) return send(res, 404, { message: "Food not found" });
        if (food.donorEmail !== data.donorEmail) return send(res, 403, { message: "Not authorized" });
        const upd = {};
        if (data.foodItem) upd.foodItem = data.foodItem;
        if (data.description !== undefined) upd.description = data.description;
        if (data.allergens !== undefined) upd.allergens = data.allergens;
        if (data.servings) upd.servings = parseInt(data.servings);
        if (data.pickupLocation) upd.pickupLocation = data.pickupLocation;
        if (data.contactNumber !== undefined) upd.contactNumber = data.contactNumber;
        if (data.category) upd.category = data.category;
        upd.status = "Pending"; // re-review after edit
        await foods.updateOne({ _id: new ObjectId(id) }, { $set: upd });
        const updated = await foods.findOne({ _id: new ObjectId(id) });
        await log(food.donorName, "Edited food listing", food.foodItem);
        return send(res, 200, toId(updated));
      }

      /* ── DONOR ORDERS (who claimed my food) ── */
      if (req.method === "GET" && pathname === "/orders/donor") {
        if (!requireAuth(req, res)) return;
        const allOrders = await orders.find({ "items.donorEmail": query.email }).sort({ placedAt: -1 }).toArray();
        // filter items to only those belonging to this donor
        const result = allOrders.map(o => ({
          ...toId(o),
          items: o.items.filter(i => i.donorEmail === query.email)
        })).filter(o => o.items.length > 0);
        return send(res, 200, result);
      }

      /* ── PASSWORD RESET ── */
      if (req.method === "POST" && pathname === "/forgot-password") {
        const { email } = await body(req);
        const user = await users.findOne({ email });
        if (!user) return send(res, 404, { message: "No account found with this email" });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await users.updateOne({ email }, { $set: { resetCode: code, resetExpiry: expiry } });
        await sendMail(email, "Your Left2Right password reset code",
          `<p>Hi ${user.name},</p><p>Your password reset code is: <strong style="font-size:24px;letter-spacing:4px">${code}</strong></p><p>This code expires in 15 minutes. If you didn't request this, ignore this email.</p>`);
        // only expose code in dev so the demo still works without email configured
        return send(res, 200, { message: "Reset code sent", ...(IS_PROD ? {} : { code }) });
      }

      if (req.method === "POST" && pathname === "/reset-password") {
        const { email, code, newPassword } = await body(req);
        const user = await users.findOne({ email });
        if (!user) return send(res, 404, { message: "User not found" });
        if (user.resetCode !== code) return send(res, 400, { message: "Invalid reset code" });
        if (new Date() > new Date(user.resetExpiry)) return send(res, 400, { message: "Reset code expired" });
        const hashed = await bcrypt.hash(newPassword, 10);
        await users.updateOne({ email }, { $set: { password: hashed }, $unset: { resetCode: "", resetExpiry: "" } });
        return send(res, 200, { message: "Password reset successfully" });
      }

      /* ── CHAT ── */
      if (req.method === "GET" && pathname === "/chat") {
        if (!requireAuth(req, res)) return;
        // query: foodId, userEmail
        const msgs = await activity.find({ type: "chat", foodId: query.foodId,
          $or: [{ from: query.userEmail }, { to: query.userEmail }]
        }).sort({ timestamp: 1 }).toArray();
        return send(res, 200, msgs.map(toId));
      }

      if (req.method === "POST" && pathname === "/chat") {
        if (!requireAuth(req, res)) return;
        const { foodId, foodItem, donorEmail, donorName, senderEmail, senderName, message } = await body(req);
        if (!message?.trim()) return send(res, 400, { message: "Message required" });
        const msg = { type: "chat", foodId, foodItem, donorEmail, donorName, from: senderEmail, fromName: senderName, to: donorEmail, message: message.trim(), timestamp: new Date() };
        const result = await activity.insertOne(msg);
        return send(res, 201, toId({ _id: result.insertedId, ...msg }));
      }

      if (req.method === "POST" && pathname === "/chat/reply") {
        if (!requireAuth(req, res)) return;
        const { foodId, foodItem, donorEmail, donorName, recipientEmail, message } = await body(req);
        if (!message?.trim()) return send(res, 400, { message: "Message required" });
        const msg = { type: "chat", foodId, foodItem, donorEmail, donorName, from: donorEmail, fromName: donorName, to: recipientEmail, message: message.trim(), timestamp: new Date() };
        const result = await activity.insertOne(msg);
        return send(res, 201, toId({ _id: result.insertedId, ...msg }));
      }

      if (req.method === "GET" && pathname === "/chat/threads") {
        if (!requireAuth(req, res)) return;
        const msgs = await activity.find({ type: "chat", donorEmail: query.donorEmail }).sort({ timestamp: 1 }).toArray();
        // group by foodId + userEmail
        const threads = {};
        for (const m of msgs) {
          const userEmail = m.from === query.donorEmail ? m.to : m.from;
          const key = `${m.foodId}__${userEmail}`;
          if (!threads[key]) threads[key] = { foodId: m.foodId, foodItem: m.foodItem, userEmail, messages: [] };
          threads[key].messages.push(toId(m));
        }
        return send(res, 200, Object.values(threads));
      }

      /* ── UNREAD MESSAGE COUNT ── */
      if (req.method === "GET" && pathname === "/chat/unread") {
        if (!requireAuth(req, res)) return;
        const count = await activity.countDocuments({ type: "chat", to: query.email, read: { $ne: true } });
        return send(res, 200, { count });
      }

      /* ── MARK THREAD READ ── */
      if (req.method === "POST" && pathname === "/chat/read") {
        if (!requireAuth(req, res)) return;
        const { email } = await body(req);
        await activity.updateMany({ type: "chat", to: email }, { $set: { read: true } });
        return send(res, 200, { ok: true });
      }

      /* ── ACTIVITY ── */
      if (req.method === "GET" && pathname === "/activity") {
        const list = await activity.find({ type: { $ne: "chat" } }).sort({ timestamp: -1 }).toArray();
        const mapped = list.map(toId);
        if (query.page) return send(res, 200, paginate(mapped, query.page, query.limit));
        return send(res, 200, mapped);
      }

      send(res, 404, { message: "Route not found" });
    } catch (err) {
      console.error(err);
      send(res, 500, { message: err.message });
    }
  });

  server.listen(PORT, () => {
    console.log(`Left2Right backend → http://localhost:${PORT}`);
    startExpiryJob();
  });
}

(async () => {
  try {
    await connectDB();
    startServer();
  } catch (err) {
    console.error("Startup failed:", err.message);
    process.exit(1);
  }
})();
