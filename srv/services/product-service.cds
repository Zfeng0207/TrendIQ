using { beauty.crm as crm } from '../../db/schema';

/**
 * Product Catalog Service
 * Handles product management, pricing, and inventory
 */
service ProductService @(path: '/product') {

    // Product management with full CRUD
    @cds.redirection.target
    entity Products as projection on crm.Products actions {
        action updateAIScore();
        action adjustPrice(newPrice: Decimal);
        action markDiscontinued();
    };

    // Read-only analytics views
    @readonly entity ProductsByCategory as projection on crm.Products {
        key category,
        count(ID) as count : Integer,
        avg(listPrice) as avgPrice : Decimal(15,2)
    } group by category;

    @readonly entity ProductsByBrand as projection on crm.Products {
        key brand,
        count(ID) as count : Integer,
        sum(stockQuantity) as totalStock : Integer
    } group by brand;

    @readonly entity ActiveProducts as projection on crm.Products
        where status = 'Active'
        order by productName asc;

    @readonly entity TrendingProducts as projection on crm.Products
        where status = 'Active' and trendScore >= 80
        order by trendScore desc;

    @readonly entity LowStockProducts as projection on crm.Products
        where status = 'Active' and stockQuantity < 10
        order by stockQuantity asc;

    // Associated entities
    @readonly entity OpportunityProducts as projection on crm.OpportunityProducts;
}
