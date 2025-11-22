/**
 * Merchant Service Handler
 * Implements business logic for merchant discovery and onboarding operations
 */

const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = async function() {
    const { MerchantDiscoveries, Leads, Users } = this.entities;

    // Handler for virtual field: statusCriticality and about placeholder
    this.on('READ', 'MerchantDiscoveries', async (req, next) => {
        const results = await next();
        
        // Helper to process a single merchant record
        const processMerchant = (merchant) => {
            if (merchant) {
                merchant.statusCriticality = getStatusCriticality(merchant.status);
                // Set placeholder for empty about field (handle null, undefined, empty string)
                if (!merchant.about || (typeof merchant.about === 'string' && merchant.about.trim() === '')) {
                    merchant.about = '-';
                }
            }
        };
        
        if (Array.isArray(results)) {
            results.forEach(processMerchant);
        } else if (results) {
            processMerchant(results);
        }
        return results;
    });

    // Helper function: Get criticality value for status
    function getStatusCriticality(status) {
        const criticalityMap = {
            'Onboarded': 3,  // Positive (Green)
            'Qualified': 3,  // Positive (Green)
            'Contacted': 2,  // Critical (Yellow)
            'Discovered': 2, // Critical (Yellow)
            'Rejected': 1    // Negative (Red)
        };
        return criticalityMap[status] || 2;
    }

    // Action: Qualify Merchant
    this.on('qualifyMerchant', 'MerchantDiscoveries', async (req) => {
        const merchantID = req.params[0].ID;
        const merchant = await SELECT.one.from(MerchantDiscoveries).where({ ID: merchantID });

        if (!merchant) {
            return req.error(404, `Merchant ${merchantID} not found`);
        }

        if (merchant.status === 'Qualified') {
            return req.warn(409, 'Merchant is already qualified');
        }

        // Calculate merchant score using mock AI algorithm
        const merchantScore = calculateMerchantScore(merchant);

        // Update merchant status and score
        await UPDATE(MerchantDiscoveries).set({
            status: 'Qualified',
            merchantScore: merchantScore
        }).where({ ID: merchantID });

        return req.reply({ 
            message: 'Merchant qualified successfully', 
            merchantScore: merchantScore 
        });
    });

    // Action: Assign to Sales Rep
    this.on('assignToSalesRep', 'MerchantDiscoveries', async (req) => {
        const merchantID = req.params[0].ID;
        const { salesRepID } = req.data;
        
        const merchant = await SELECT.one.from(MerchantDiscoveries).where({ ID: merchantID });
        if (!merchant) {
            return req.error(404, `Merchant ${merchantID} not found`);
        }

        // Verify sales rep exists
        const salesRep = await SELECT.one.from(Users).where({ ID: salesRepID });
        if (!salesRep) {
            return req.error(404, `Sales rep ${salesRepID} not found`);
        }

        // Auto-assignment logic based on territory/region matching
        // TODO: Databricks Integration
        // Call Databricks job to trigger merchant discovery scraping
        // await databricksClient.runJob('merchant-discovery-job', { 
        //     source: merchant.discoverySource,
        //     location: merchant.location 
        // });

        await UPDATE(MerchantDiscoveries).set({
            autoAssignedTo_ID: salesRepID
        }).where({ ID: merchantID });

        return req.reply({ 
            message: 'Merchant assigned to sales rep successfully',
            salesRepName: salesRep.fullName 
        });
    });

    // Action: Convert to Lead
    this.on('convertToLead', 'MerchantDiscoveries', async (req) => {
        const merchantID = req.params[0].ID;
        const merchant = await SELECT.one.from(MerchantDiscoveries).where({ ID: merchantID });

        if (!merchant) {
            return req.error(404, `Merchant ${merchantID} not found`);
        }

        if (merchant.convertedToLead_ID) {
            return req.error(400, 'Merchant has already been converted to a lead');
        }

        if (merchant.status !== 'Qualified' && merchant.status !== 'Contacted') {
            return req.warn(409, 'Merchant should be qualified or contacted before conversion');
        }

        // Create new Lead entity from MerchantDiscovery
        const newLead = await INSERT.into(Leads).entries({
            outletName: merchant.merchantName,
            brandToPitch: 'TBD', // To be determined by sales rep
            status: 'New',
            platform: mapDiscoverySourceToPlatform(merchant.discoverySource),
            contactEmail: extractEmailFromContactInfo(merchant.contactInfo),
            contactName: extractNameFromContactInfo(merchant.contactInfo),
            contactPhone: extractPhoneFromContactInfo(merchant.contactInfo),
            address: merchant.address,
            city: merchant.city,
            state: merchant.state,
            country: merchant.country || 'Malaysia',
            postalCode: merchant.postalCode,
            source: 'Import',
            sourceDetail: `Auto-discovered from ${merchant.discoverySource}`,
            leadQuality: merchantScoreToLeadQuality(merchant.merchantScore),
            estimatedValue: estimateValueFromScore(merchant.merchantScore),
            assignedTo_ID: merchant.autoAssignedTo_ID,
            owner_ID: merchant.autoAssignedTo_ID,
            discoverySource: merchant.discoverySource,
            autoDiscovered: true,
            merchantDiscovery_ID: merchantID,
            aiScore: merchant.merchantScore,
            notes: `Converted from Merchant Discovery. Original source: ${merchant.discoverySource}. Location: ${merchant.location}`
        });

        // Update merchant with link to lead
        await UPDATE(MerchantDiscoveries).set({
            convertedToLead_ID: newLead.ID,
            status: 'Contacted'
        }).where({ ID: merchantID });

        return req.reply({ 
            message: 'Merchant converted to lead successfully', 
            leadID: newLead.ID 
        });
    });

    // Action: Generate About (Mock from CSV)
    this.on('generateAbout', 'MerchantDiscoveries', async (req) => {
        const merchantID = req.params[0].ID;
        const merchant = await SELECT.one.from(MerchantDiscoveries)
            .columns('*', 'autoAssignedTo.fullName')
            .where({ ID: merchantID });

        if (!merchant) {
            return req.error(404, `Merchant ${merchantID} not found`);
        }

        // Simulate AI processing with 3-second delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Load mock About data from CSV
        let aboutText = '-'; // Default fallback
        try {
            const csvPath = path.join(__dirname, '../../db/data/beauty.crm-MerchantAbout.csv');
            const csvContent = fs.readFileSync(csvPath, 'utf-8');
            
            // Parse CSV - handle multiline content by splitting on ID pattern
            // Format: ID;about (where about can span multiple lines until next ID)
            const idPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12});/;
            const lines = csvContent.split('\n');
            
            let currentID = null;
            let currentAbout = [];
            let inAboutSection = false;
            
            // Skip header line
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                
                // Check if this line starts with an ID
                const idMatch = line.match(idPattern);
                if (idMatch) {
                    // Save previous entry if it matches
                    if (currentID === merchantID && currentAbout.length > 0) {
                        aboutText = currentAbout.join('\n');
                        break;
                    }
                    // Start new entry
                    currentID = idMatch[1];
                    const afterSemicolon = line.substring(idMatch[0].length);
                    currentAbout = afterSemicolon ? [afterSemicolon] : [];
                    inAboutSection = true;
                } else if (inAboutSection && currentID === merchantID && line.trim()) {
                    // Continue collecting about text for current merchant
                    currentAbout.push(line);
                }
            }
            
            // Check last entry
            if (currentID === merchantID && currentAbout.length > 0 && aboutText === '-') {
                aboutText = currentAbout.join('\n');
            }
            
            // If not found in CSV, use generated text
            if (aboutText === '-') {
                aboutText = generateAboutText(merchant);
            }
        } catch (error) {
            console.error('Error reading mock CSV:', error.message);
            // Fallback to generated text
            aboutText = generateAboutText(merchant);
        }

        // Update merchant with generated about text
        await UPDATE(MerchantDiscoveries).set({
            about: aboutText
        }).where({ ID: merchantID });

        // Fetch the updated merchant to return in response
        const updatedMerchant = await SELECT.one.from(MerchantDiscoveries)
            .columns('*')
            .where({ ID: merchantID });

        return updatedMerchant;
    });

    // Action: Bulk Import
    this.on('bulkImport', 'MerchantDiscoveries', async (req) => {
        const { discoveries } = req.data;
        
        if (!discoveries) {
            return req.error(400, 'discoveries parameter is required');
        }

        let discoveriesArray;
        try {
            discoveriesArray = JSON.parse(discoveries);
        } catch (e) {
            return req.error(400, 'Invalid JSON format for discoveries');
        }

        if (!Array.isArray(discoveriesArray)) {
            return req.error(400, 'discoveries must be an array');
        }

        // TODO: Databricks Integration
        // Web scraping service integration points
        // await databricksClient.runJob('bulk-merchant-scraping', {
        //     sources: discoveriesArray.map(d => d.source),
        //     batchSize: discoveriesArray.length
        // });

        const created = [];
        for (const discovery of discoveriesArray) {
            const merchantScore = calculateMerchantScoreFromData(discovery);
            const autoAssignedTo = await autoAssignMerchant(discovery);

            const newMerchant = await INSERT.into(MerchantDiscoveries).entries({
                merchantName: discovery.merchantName,
                discoverySource: discovery.discoverySource || 'Other',
                discoveryDate: new Date().toISOString(),
                location: discovery.location || '',
                businessType: discovery.businessType || 'Retailer',
                contactInfo: discovery.contactInfo || '',
                socialMediaLinks: discovery.socialMediaLinks || '',
                merchantScore: merchantScore,
                autoAssignedTo_ID: autoAssignedTo,
                discoveryMetadata: JSON.stringify(discovery),
                status: 'Discovered',
                address: discovery.address || '',
                city: discovery.city || '',
                state: discovery.state || '',
                country: discovery.country || 'Malaysia',
                postalCode: discovery.postalCode || ''
            });

            created.push(newMerchant.ID);
        }

        return req.reply({ 
            message: `Successfully imported ${created.length} merchants`,
            count: created.length,
            merchantIDs: created
        });
    });

    // Helper function: Calculate merchant score using mock AI algorithm
    function calculateMerchantScore(merchant) {
        let score = 50; // Base score

        // Business type scoring
        const businessTypeScores = {
            'Distributor': 25,
            'Retailer': 20,
            'E-commerce': 18,
            'Salon': 15,
            'Spa': 15,
            'Kiosk': 10
        };
        score += businessTypeScores[merchant.businessType] || 10;

        // Discovery source scoring
        const sourceScores = {
            'Online Web': 12,
            'Partnership': 15,
            'Offline': 10,
            'Other': 5
        };
        score += sourceScores[merchant.discoverySource] || 5;

        // Social media presence bonus
        if (merchant.socialMediaLinks && merchant.socialMediaLinks.length > 20) {
            score += 5;
        }

        // Location bonus (if in major cities)
        const majorCities = ['Kuala Lumpur', 'Petaling Jaya', 'Johor Bahru', 'Penang'];
        if (majorCities.some(city => merchant.city && merchant.city.includes(city))) {
            score += 5;
        }

        return Math.min(100, Math.max(0, score));
    }

    // Helper function: Calculate score from raw data
    function calculateMerchantScoreFromData(data) {
        const merchant = {
            businessType: data.businessType,
            discoverySource: data.discoverySource,
            socialMediaLinks: data.socialMediaLinks || '',
            city: data.city || ''
        };
        return calculateMerchantScore(merchant);
    }

    // Helper function: Auto-assign merchant based on territory/region
    async function autoAssignMerchant(discovery) {
        // Simple auto-assignment: find sales rep by region/city
        const city = discovery.city || '';
        let region = 'Central'; // Default

        if (city.includes('Johor') || city.includes('Melaka')) {
            region = 'South';
        } else if (city.includes('Penang') || city.includes('Ipoh')) {
            region = 'North';
        }

        const salesRep = await SELECT.one.from(Users)
            .where({ region: region, role: 'Sales Rep', status: 'Active' })
            .orderBy('quota', 'desc');

        return salesRep ? salesRep.ID : null;
    }

    // Helper function: Map discovery source to platform
    function mapDiscoverySourceToPlatform(source) {
        const mapping = {
            'Instagram': 'Instagram',
            'TikTok': 'TikTok',
            'Facebook': 'Facebook',
            'Shopee': 'Web',
            'Lazada': 'Web',
            'GoogleMaps': 'Other',
            'Other': 'Other'
        };
        return mapping[source] || 'Other';
    }

    // Helper function: Extract email from contact info
    function extractEmailFromContactInfo(contactInfo) {
        if (!contactInfo) return null;
        const emailMatch = contactInfo.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        return emailMatch ? emailMatch[0] : null;
    }

    // Helper function: Extract name from contact info
    function extractNameFromContactInfo(contactInfo) {
        if (!contactInfo) return null;
        // Simple extraction - look for patterns like "Name: ..." or "Contact: ..."
        const nameMatch = contactInfo.match(/(?:Name|Contact):\s*([A-Za-z\s]+)/i);
        return nameMatch ? nameMatch[1].trim() : null;
    }

    // Helper function: Extract phone from contact info
    function extractPhoneFromContactInfo(contactInfo) {
        if (!contactInfo) return null;
        const phoneMatch = contactInfo.match(/\+?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9}/);
        return phoneMatch ? phoneMatch[0] : null;
    }

    // Helper function: Convert merchant score to lead quality
    function merchantScoreToLeadQuality(score) {
        if (score >= 80) return 'Hot';
        if (score >= 65) return 'Warm';
        if (score >= 50) return 'Medium';
        return 'Cold';
    }

    // Helper function: Estimate value from score
    function estimateValueFromScore(score) {
        // Simple estimation: score * 1000 RM
        return score * 1000;
    }

    // Helper function: Generate About text (Mock AI)
    function generateAboutText(merchant) {
        const notes = [];
        
        // Business Overview
        if (merchant.businessType) {
            notes.push(`• Business Type: ${merchant.businessType}`);
        }
        
        // Location Information
        if (merchant.location) {
            notes.push(`• Location: ${merchant.location}`);
        }
        if (merchant.city) {
            notes.push(`• City: ${merchant.city}`);
        }
        if (merchant.country) {
            notes.push(`• Country: ${merchant.country}`);
        }
        
        // Business Score & Potential
        if (merchant.merchantScore) {
            let scoreNote = `• Merchant Score: ${merchant.merchantScore}/100`;
            if (merchant.merchantScore >= 80) {
                scoreNote += ' (High Potential - Priority Account)';
            } else if (merchant.merchantScore >= 65) {
                scoreNote += ' (Good Potential - Follow Up Recommended)';
            } else if (merchant.merchantScore >= 50) {
                scoreNote += ' (Moderate Potential - Monitor Progress)';
            } else {
                scoreNote += ' (Low Potential - Standard Follow Up)';
            }
            notes.push(scoreNote);
        }
        
        // Discovery Source
        if (merchant.discoverySource) {
            notes.push(`• Discovery Source: ${merchant.discoverySource}`);
        }
        
        // Contact Information
        if (merchant.contactInfo) {
            notes.push(`• Contact: ${merchant.contactInfo}`);
        }
        
        // Social Media Presence
        if (merchant.socialMediaLinks) {
            notes.push(`• Social Media: ${merchant.socialMediaLinks}`);
        }
        
        // Status & Next Steps
        if (merchant.status) {
            let statusNote = `• Current Status: ${merchant.status}`;
            if (merchant.status === 'Discovered') {
                statusNote += ' - Awaiting qualification and assignment';
            } else if (merchant.status === 'Qualified') {
                statusNote += ' - Ready for outreach and partnership discussion';
            } else if (merchant.status === 'Contacted') {
                statusNote += ' - Initial contact made, follow-up required';
            } else if (merchant.status === 'Onboarded') {
                statusNote += ' - Successfully onboarded as partner';
            }
            notes.push(statusNote);
        }
        
        // Assignment Information
        if (merchant.autoAssignedTo && merchant.autoAssignedTo.fullName) {
            notes.push(`• Assigned To: ${merchant.autoAssignedTo.fullName}`);
        }
        
        // Business Insights
        if (merchant.businessType === 'Salon' || merchant.businessType === 'Spa') {
            notes.push(`• Business Focus: Professional beauty services and treatments`);
        } else if (merchant.businessType === 'Retailer') {
            notes.push(`• Business Focus: Beauty product retail and distribution`);
        } else if (merchant.businessType === 'E-commerce') {
            notes.push(`• Business Focus: Online beauty product sales`);
        }
        
        // Recommendation
        if (merchant.merchantScore >= 70) {
            notes.push(`• Recommendation: High-value prospect - prioritize engagement and partnership discussions`);
        } else if (merchant.merchantScore >= 50) {
            notes.push(`• Recommendation: Moderate value - standard outreach and relationship building`);
        }
        
        return notes.join('\n') || `• ${merchant.merchantName} is a beauty and wellness business with potential for partnership opportunities.`;
    }
}

