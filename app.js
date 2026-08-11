const express = require('express');
const session = require('express-session'); // Tambahan Sprint 2
const app = express();
const products = require('./data/products');

// Akun admin hardcode untuk keperluan login (Tambahan Sprint 2)
const adminUser = { username: "adminaries", password: "password123" };

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Tambahan Sprint 2: Wajib ada agar bisa membaca data dari Form Login dan JSON Fetch API
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Konfigurasi Session untuk Login (Tambahan Sprint 2)
app.use(session({
    secret: 'rahasia-toko-ibu-aries',
    resave: false,
    saveUninitialized: false
}));

// Middleware agar status session/login bisa dibaca di semua file EJS (Tambahan Sprint 2)
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Middleware Proteksi Halaman / Auth Guard (Tambahan Sprint 2)
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    if (req.originalUrl.startsWith('/api/') && req.method !== 'GET') {
        return res.status(401).json({ error: "Unauthorized: Silakan login terlebih dahulu." });
    }
    res.redirect('/login');
};

// Custom middleware logger (KODE ASLI KAMU - SPRINT 1)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});


// ==========================================
// ROUTE SPRINT 1 
// ==========================================

// Route Beranda
app.get('/', (req, res) => {
    const featuredProducts = products.slice(0, 3);
    res.render('index', { products: featuredProducts });
});

// Route Produk + Filter Query String
app.get('/produk', (req, res) => {
    let filteredProducts = products;
    const { kategori, search } = req.query;

    if (kategori) {
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === kategori.toLowerCase());
    }
    if (search) {
        filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }

    res.render('produk', { products: filteredProducts, kategori, search });
});

// Route Detail Produk Dinamis
app.get('/produk/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).render('detail', { product: null, error: "Produk tidak ditemukan" });
    }

    res.render('detail', { product, error: null });
});

// Route Tanya AI
app.get('/tanya-ai', (req, res) => {
    res.render('tanya-ai');
});


// ==========================================
// ROUTE SPRINT 2 (LOGIN, DASHBOARD, CRUD API & AI CHAT)
// ==========================================

// 1. Login & Logout
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === adminUser.username && password === adminUser.password) {
        req.session.user = username;
        return res.redirect('/dashboard');
    }
    res.render('login', { error: "Username atau password salah!" });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// 2. Dashboard Admin (Dilindungi middleware)
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

// 3. REST API CRUD PRODUK
// GET: Menampilkan API produk (Modifikasi sedikit jadi json(products) agar bisa dibaca Fetch API Dashboard)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// POST: Tambah produk
app.post('/api/products', requireAuth, (req, res) => {
    const { name, category, price, stock } = req.body;
    const newProduct = {
        id: products.length > 0 ? products[products.length - 1].id + 1 : 1,
        name,
        category,
        price: Number(price),
        stock: Number(stock)
    };
    products.push(newProduct);
    res.status(201).json({ message: "Produk berhasil ditambahkan", product: newProduct });
});

// PUT: Edit produk
app.put('/api/products/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Produk tidak ditemukan" });

    const { name, category, price, stock } = req.body;
    products[index] = {
        ...products[index],
        name: name || products[index].name,
        category: category || products[index].category,
        price: price ? Number(price) : products[index].price,
        stock: stock ? Number(stock) : products[index].stock
    };
    res.json({ message: "Produk berhasil diperbarui", product: products[index] });
});

// DELETE: Hapus produk
app.delete('/api/products/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: "Produk tidak ditemukan" });

    const deleted = products.splice(index, 1);
    res.json({ message: "Produk berhasil dihapus", product: deleted[0] });
});

// 4. API Endpoint untuk Tanya AI dummy
app.post('/api/chat', (req, res) => {
    const userMsg = req.body.message ? req.body.message.toLowerCase() : "";
    let reply = "Maaf, saya kurang paham. Coba tanyakan seputar jam buka atau daftar sembako.";

    if (userMsg.includes("jam buka") || userMsg.includes("buka")) {
        reply = "Toko Sembako Ariesta buka setiap hari pukul 08.00 - 20.00 WIB.";
    } else if (userMsg.includes("beras") || userMsg.includes("sembako")) {
        reply = "Stok beras dan sembako aman dan tersedia lengkap di toko kami!";
    }

    res.json({ reply });
});

// Port (KODE ASLI KAMU)
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server Toko Sembako Ariesta berjalan di http://localhost:${PORT}`);
});