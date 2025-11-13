/**
 * Product Service Handler
 * Implements business logic for product catalog management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Products } = this.entities;

    // Action: Update Product AI Score
    this.on('updateAIScore', 'Products', async (req) => {
        const productID = req.params[0].ID;
        const product = await SELECT.one.from(Products).where({ ID: productID });

        if (!product) {
            return req.error(404, `Product ${productID} not found`);
        }

        const aiScores = calculateProductScores(product);

        await UPDATE(Products).set({
            trendScore: aiScores.trendScore,
            popularityScore: aiScores.popularityScore
        }).where({ ID: productID });

        return req.reply({
            message: 'Product AI scores updated',
            trendScore: aiScores.trendScore,
            popularityScore: aiScores.popularityScore
        });
    });

    // Action: Adjust Price
    this.on('adjustPrice', 'Products', async (req) => {
        const productID = req.params[0].ID;
        const { newPrice } = req.data;

        const product = await SELECT.one.from(Products).where({ ID: productID });

        if (!product) {
            return req.error(404, `Product ${productID} not found`);
        }

        if (newPrice <= 0) {
            return req.error(400, 'Price must be greater than zero');
        }

        if (newPrice < product.cost) {
            return req.warn(409, 'Warning: New price is below cost');
        }

        const oldPrice = product.listPrice;
        const priceChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);

        await UPDATE(Products).set({
            listPrice: newPrice,
            notes: (product.notes || '') + `\n[PRICE CHANGE] From RM${oldPrice} to RM${newPrice} (${priceChange}%) on ${new Date().toISOString()}`
        }).where({ ID: productID });

        return req.reply({
            message: 'Price adjusted successfully',
            oldPrice,
            newPrice,
            changePercent: priceChange
        });
    });

    // Action: Mark as Discontinued
    this.on('markDiscontinued', 'Products', async (req) => {
        const productID = req.params[0].ID;
        const product = await SELECT.one.from(Products).where({ ID: productID });

        if (!product) {
            return req.error(404, `Product ${productID} not found`);
        }

        if (product.status === 'Discontinued') {
            return req.error(400, 'Product is already discontinued');
        }

        await UPDATE(Products).set({
            status: 'Discontinued',
            inStock: false,
            notes: (product.notes || '') + `\n[DISCONTINUED] Product discontinued on ${new Date().toISOString()}`
        }).where({ ID: productID });

        return req.reply({ message: 'Product marked as discontinued' });
    });

    // Before CREATE: Set defaults and calculate scores
    this.before('CREATE', 'Products', async (req) => {
        const product = req.data;

        // Set default status
        if (!product.status) {
            product.status = 'Active';
        }

        // Set default currency
        if (!product.currency) {
            product.currency = 'MYR';
        }

        // Calculate initial AI scores
        const aiScores = calculateProductScores(product);
        product.trendScore = aiScores.trendScore;
        product.popularityScore = aiScores.popularityScore;

        // Validate pricing
        if (product.listPrice && product.cost && product.listPrice < product.cost) {
            req.warn('Warning: List price is below cost');
        }
    });

    // Before UPDATE: Validate changes
    this.before('UPDATE', 'Products', async (req) => {
        const updates = req.data;

        // Prevent accidental price drops
        if (updates.listPrice !== undefined) {
            const current = await SELECT.one.from(Products).where({ ID: updates.ID });
            if (updates.listPrice < current.listPrice * 0.5) {
                req.warn('Warning: Price drop exceeds 50%');
            }
        }
    });

    // After CREATE: Log
    this.after('CREATE', 'Products', async (data, req) => {
        console.log(`New product created: ${data.productName} (${data.productCode})`);
    });
};

// Mock AI Functions
function calculateProductScores(product) {
    let trendScore = 50;
    let popularityScore = 50;

    // Category trends
    const trendingCategories = {
        'Skincare': 20,
        'Makeup': 15,
        'Haircare': 10
    };
    trendScore += trendingCategories[product.category] || 0;

    // Brand recognition (mock)
    const popularBrands = ['K-Beauty', 'Ordinary', 'CeraVe', 'Drunk Elephant'];
    if (popularBrands.some(brand => (product.brand || '').includes(brand))) {
        popularityScore += 20;
        trendScore += 10;
    }

    // Marketing flags
    if (product.isPromoted) {
        popularityScore += 15;
    }
    if (product.isTrending) {
        trendScore += 25;
    }

    // Stock availability
    if (product.inStock && product.stockQuantity > 0) {
        popularityScore += 10;
        if (product.stockQuantity < 10) {
            // Low stock = high demand
            popularityScore += 15;
            trendScore += 15;
        }
    }

    // Price point analysis
    if (product.listPrice) {
        if (product.listPrice < 50) {
            popularityScore += 10; // Affordable products are popular
        } else if (product.listPrice > 200) {
            popularityScore -= 5; // Premium pricing may limit popularity
            trendScore += 5; // But indicates premium/trending status
        }
    }

    // Product type
    if (product.productType === 'Bundle') {
        popularityScore += 10;
    }

    // New product boost
    if (product.createdAt) {
        const daysSinceCreation = (Date.now() - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 30) {
            trendScore += 20; // New products get trend boost
        }
    }

    return {
        trendScore: Math.min(100, Math.max(0, Math.round(trendScore))),
        popularityScore: Math.min(100, Math.max(0, Math.round(popularityScore)))
    };
}
