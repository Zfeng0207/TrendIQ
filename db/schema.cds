// in db/schema.cds
namespace beauty.leads;

entity Leads {
    key ID         : UUID;
    outletName     : String; // e.g., 'New Salon' or 'Online Store'
    brandToPitch : String; // e.g., 'K-Beauty', 'Organic'
    status       : String; // e.g., 'New', 'Contacted'
    platform     : String; // e.g., 'Instagram', 'TikTok'
    contactEmail : String;
    aiScore      : Integer;
}