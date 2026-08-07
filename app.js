const express = require('express');
const app = express();
const products = require('./data/products');

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Custom middleware logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.url}`);
    next();
});

// REST API read-only endpoint
app.get('/api/products', (req, res) => {
    res.json({ status: "success", data: products });
});

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server Toko Sembako Ariesta berjalan di http://localhost:${PORT}`);
});