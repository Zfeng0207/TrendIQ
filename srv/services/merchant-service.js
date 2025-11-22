/**
 * Merchant Service Handler
 * Implements business logic for merchant discovery and onboarding operations
 */

const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = async function() {
    const { MerchantDiscoveries, Leads, Users } = this.entities;

    // Handler for virtual fields: statusCriticality, phase, priorityScore, lastFollowUp, pendingItems, assignedTo
    this.on('READ', 'MerchantDiscoveries', async (req, next) => {
        const results = await next();
        
        // Helper to process a single merchant record
        const processMerchant = (merchant) => {
            if (merchant) {
                // Status criticality (for backward compatibility)
                merchant.statusCriticality = getStatusCriticality(merchant.status);
                
                // Phase (maps status to numbered phases, varied based on merchant data)
                merchant.phase = mapStatusToPhase(merchant.status, merchant);
                merchant.phaseCriticality = getPhaseCriticality(merchant.phase);
                
                // Priority Score (1-5 scale based on merchantScore)
                const priorityScore100 = merchant.merchantScore || 0;
                merchant.priorityScore = convertToPriorityScore1to5(priorityScore100);
                merchant.priorityScoreCriticality = getPriorityScoreCriticality(merchant.priorityScore);
                
                // Last Follow Up
                merchant.lastFollowUp = generateLastFollowUp(merchant);
                
                // Pending Items
                merchant.pendingItems = generatePendingItemsWithIcons(merchant);
                
                // Assigned To
                if (merchant.autoAssignedTo && typeof merchant.autoAssignedTo === 'object' && merchant.autoAssignedTo.fullName) {
                    merchant.assignedTo = merchant.autoAssignedTo.fullName;
                } else if (merchant.autoAssignedTo_ID) {
                    merchant.assignedTo = generateAssignedToDemo(merchant);
                } else {
                    merchant.assignedTo = generateAssignedToDemo(merchant);
                }
                
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

    // Helper function: Get criticality value for status (legacy)
    function getStatusCriticality(status) {
        const criticalityMap = {
            'Completed': 3,    // Positive (Green)
            'In Review': 3,    // Positive (Green)
            'Onboarding': 2,   // Warning (Yellow)
            'Qualified': 3,    // Positive (Green)
            'Contacted': 2,   // Warning (Yellow)
            'Discovered': 2   // Warning (Yellow)
        };
        return criticalityMap[status] || 2;
    }
    
    // Helper function: Map status to numbered phase (varied based on merchant data)
    function mapStatusToPhase(status, merchant) {
        // If status explicitly maps to a phase, use that
        const statusToPhase = {
            'Completed': 'Phase 3',
            'In Review': 'Phase 3',
            'Onboarding': 'Phase 2',
            'Qualified': 'Phase 2',
            'Contacted': 'Phase 1',
            'Discovered': 'Phase 1'
        };
        
        // If status has explicit mapping, use it
        if (status && statusToPhase[status]) {
            return statusToPhase[status];
        }
        
        // Otherwise, vary based on merchantScore or ID for demo purposes
        // Higher scores tend to be in later phases
        if (merchant && merchant.merchantScore !== undefined) {
            if (merchant.merchantScore >= 85) {
                return 'Phase 3';
            } else if (merchant.merchantScore >= 70) {
                return 'Phase 2';
            } else {
                return 'Phase 1';
            }
        }
        
        // Fallback: use merchant ID hash for consistent variation
        if (merchant && merchant.ID) {
            const hash = merchant.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const phaseNum = (hash % 3) + 1;
            return `Phase ${phaseNum}`;
        }
        
        return 'Phase 1';
    }
    
    // Helper function: Get criticality value for phase
    function getPhaseCriticality(phase) {
        const criticalityMap = {
            'Phase 1': 2,   // Warning (Yellow)
            'Phase 2': 2,   // Warning (Yellow)
            'Phase 3': 3    // Positive (Green)
        };
        return criticalityMap[phase] || 2;
    }
    
    // Helper: Convert Priority Score from 0-100 to 1-5 scale
    function convertToPriorityScore1to5(score100) {
        if (score100 >= 80) return 5; // High Priority
        if (score100 >= 60) return 4; // Medium-High
        if (score100 >= 40) return 3; // Medium
        if (score100 >= 20) return 2; // Low-Medium
        return 1; // Low Priority
    }
    
    // Helper: Get Priority Score Criticality for color coding
    // 5 = Red (1), 4 = Orange (2), 3 = Yellow (2), 2 = Light Green (3), 1 = Dark Green (3)
    function getPriorityScoreCriticality(priorityScore) {
        switch (priorityScore) {
            case 5: return 1; // Red (Critical/Negative)
            case 4: return 2; // Orange (Warning)
            case 3: return 2; // Yellow (Warning)
            case 2: return 3; // Light Green (Positive)
            case 1: return 3; // Dark Green (Positive)
            default: return 0; // Neutral
        }
    }
    
    // Helper: Generate Last Follow Up text
    function generateLastFollowUp(merchant) {
        // Generate demo values based on merchant ID for consistency
        const demoValues = [
            '4 hours ago',
            '2 days ago',
            '1 week ago',
            '3 days ago',
            '6 hours ago',
            '5 days ago',
            '2 weeks ago',
            '1 day ago',
            '8 hours ago',
            '4 days ago'
        ];
        
        // Use merchant ID hash to get consistent demo value
        if (merchant.ID) {
            const hash = merchant.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoValues[hash % demoValues.length];
        }
        
        return '2 days ago'; // Default
    }
    
    // Helper: Generate Pending Items text with icons
    function generatePendingItemsWithIcons(merchant) {
        // Generate demo values with icons based on merchant ID for consistency
        const demoValues = [
            '📄 2 Documents',
            '✉️ 1 Email',
            '📞 1 Call',
            '🛒 1 Order',
            '📄 1 Document, ✉️ 1 Email',
            '📞 2 Calls',
            '📄 1 Document, 🛒 1 Order',
            '✉️ 2 Emails',
            '📞 1 Call, ✉️ 1 Email',
            '📄 2 Documents, ✉️ 1 Email',
            '🛒 2 Orders',
            '📞 1 Call, 📄 1 Document',
            'No pending items',
            '✉️ 1 Email, 🛒 1 Order'
        ];
        
        // Use merchant ID hash to get consistent demo value
        if (merchant.ID) {
            const hash = merchant.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoValues[hash % demoValues.length];
        }
        
        return '📄 2 Documents'; // Default
    }
    
    // Helper: Generate AssignedTo demo value
    function generateAssignedToDemo(merchant) {
        const demoNames = [
            'Sarah Tan',
            'Kevin Tan',
            'Lisa Wong',
            'David Lee',
            'Amy Chen',
            'Michael Lim',
            'Jennifer Ng',
            'James Ho',
            'Rachel Yap',
            'Tommy Ong'
        ];
        
        if (merchant.ID) {
            const hash = merchant.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoNames[hash % demoNames.length];
        }
        
        return 'Sarah Tan'; // Default
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

    // Action: Initiate AI Meeting
    // Note: This action is intercepted in the UI controller, but we keep it for compatibility
    this.on('initiateAIMeeting', 'MerchantDiscoveries', async (req) => {
        // This should be intercepted by the UI, but if it reaches here, return success
        // The UI controller will handle showing the toast
        return req.reply({ 
            success: true,
            message: 'AI Meeting Initiator - handled in UI'
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
            } else if (merchant.status === 'Contacted') {
                statusNote += ' - Initial contact made, follow-up required';
            } else if (merchant.status === 'Qualified') {
                statusNote += ' - Ready for outreach and partnership discussion';
            } else if (merchant.status === 'Onboarding') {
                statusNote += ' - Currently in onboarding process';
            } else if (merchant.status === 'In Review') {
                statusNote += ' - Under review for final approval';
            } else if (merchant.status === 'Completed') {
                statusNote += ' - Successfully completed onboarding';
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

