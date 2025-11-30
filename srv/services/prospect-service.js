/**
 * Prospect Service Handler
 * Implements business logic for prospect management and conversion to opportunities
 */

const cds = require('@sap/cds');
const fs = require('fs');
const path = require('path');

module.exports = async function() {
    const { Prospects, Leads, Users, Opportunities, Accounts, Contacts } = this.entities;

    // Handler for virtual fields: statusCriticality, phase, priorityScore, lastFollowUp, pendingItems, assignedTo
    this.on('READ', 'Prospects', async (req, next) => {
        const results = await next();
        
        // Helper to process a single prospect record
        const processProspect = (prospect) => {
            if (prospect) {
                // Status criticality (for backward compatibility)
                prospect.statusCriticality = getStatusCriticality(prospect.status);
                
                // Phase (maps status to numbered phases, varied based on prospect data)
                prospect.phase = mapStatusToPhase(prospect.status, prospect);
                prospect.phaseCriticality = getPhaseCriticality(prospect.phase);
                
                // Priority Score (1-5 scale based on prospectScore)
                const priorityScore100 = prospect.prospectScore || 0;
                prospect.priorityScore = convertToPriorityScore1to5(priorityScore100);
                prospect.priorityScoreCriticality = getPriorityScoreCriticality(prospect.priorityScore);
                
                // Last Follow Up
                prospect.lastFollowUp = generateLastFollowUp(prospect);
                
                // Pending Items
                prospect.pendingItems = generatePendingItemsWithIcons(prospect);
                
                // Assigned To
                if (prospect.autoAssignedTo && typeof prospect.autoAssignedTo === 'object' && prospect.autoAssignedTo.fullName) {
                    prospect.assignedTo = prospect.autoAssignedTo.fullName;
                } else if (prospect.autoAssignedTo_ID) {
                    prospect.assignedTo = generateAssignedToDemo(prospect);
                } else {
                    prospect.assignedTo = generateAssignedToDemo(prospect);
                }
                
                // Parse contactInfo JSON for display if fields not already populated
                if (prospect.contactInfo && !prospect.contactName) {
                    try {
                        const contactData = JSON.parse(prospect.contactInfo);
                        prospect.contactName = contactData.name || null;
                        prospect.contactEmail = contactData.email || null;
                        prospect.contactPhone = contactData.phone || null;
                    } catch (e) {
                        // If not valid JSON, set to null
                        prospect.contactName = null;
                        prospect.contactEmail = null;
                        prospect.contactPhone = null;
                    }
                }
                
                // Parse discoveryMetadata JSON for display if fields not already populated
                if (prospect.discoveryMetadata && !prospect.leadQuality) {
                    try {
                        const metadata = JSON.parse(prospect.discoveryMetadata);
                        prospect.convertedFromLeadID = metadata.convertedFromLeadID || null;
                        prospect.leadQuality = metadata.leadQuality || null;
                        prospect.brandToPitch = metadata.brandToPitch || null;
                        prospect.estimatedValue = metadata.estimatedValue || null;
                        prospect.aiScore = metadata.aiScore || null;
                        prospect.sentimentScore = metadata.sentimentScore || null;
                    } catch (e) {
                        // If not valid JSON, set to null
                        prospect.convertedFromLeadID = null;
                        prospect.leadQuality = null;
                        prospect.brandToPitch = null;
                        prospect.estimatedValue = null;
                        prospect.aiScore = null;
                        prospect.sentimentScore = null;
                    }
                }
                
                // Set placeholder for empty about field (handle null, undefined, empty string)
                if (!prospect.about || (typeof prospect.about === 'string' && prospect.about.trim() === '')) {
                    prospect.about = '-';
                }
            }
        };
        
        if (Array.isArray(results)) {
            results.forEach(processProspect);
        } else if (results) {
            processProspect(results);
        }
        return results;
    });

    // Helper function: Get criticality value for status (legacy)
    function getStatusCriticality(status) {
        const criticalityMap = {
            'Converted': 3,    // Positive (Green)
            'In Review': 3,    // Positive (Green)
            'Negotiating': 2,  // Warning (Yellow)
            'Qualified': 3,    // Positive (Green)
            'Contacted': 2,    // Warning (Yellow)
            'New': 2           // Warning (Yellow)
        };
        return criticalityMap[status] || 2;
    }
    
    // Helper function: Map status to numbered phase (varied based on prospect data)
    function mapStatusToPhase(status, prospect) {
        // If status explicitly maps to a phase, use that
        const statusToPhase = {
            'Converted': 'Phase 3',
            'In Review': 'Phase 3',
            'Negotiating': 'Phase 2',
            'Qualified': 'Phase 2',
            'Contacted': 'Phase 1',
            'New': 'Phase 1'
        };
        
        // If status has explicit mapping, use it
        if (status && statusToPhase[status]) {
            return statusToPhase[status];
        }
        
        // Otherwise, vary based on prospectScore or ID for demo purposes
        // Higher scores tend to be in later phases
        if (prospect && prospect.prospectScore !== undefined) {
            if (prospect.prospectScore >= 85) {
                return 'Phase 3';
            } else if (prospect.prospectScore >= 70) {
                return 'Phase 2';
            } else {
                return 'Phase 1';
            }
        }
        
        // Fallback: use prospect ID hash for consistent variation
        if (prospect && prospect.ID) {
            const hash = prospect.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
    function generateLastFollowUp(prospect) {
        // Generate demo values based on prospect ID for consistency
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
        
        // Use prospect ID hash to get consistent demo value
        if (prospect.ID) {
            const hash = prospect.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoValues[hash % demoValues.length];
        }
        
        return '2 days ago'; // Default
    }
    
    // Helper: Generate Pending Items text with icons
    function generatePendingItemsWithIcons(prospect) {
        // Generate demo values with icons based on prospect ID for consistency
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
        
        // Use prospect ID hash to get consistent demo value
        if (prospect.ID) {
            const hash = prospect.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoValues[hash % demoValues.length];
        }
        
        return '📄 2 Documents'; // Default
    }
    
    // Helper: Generate AssignedTo demo value
    function generateAssignedToDemo(prospect) {
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
        
        if (prospect.ID) {
            const hash = prospect.ID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return demoNames[hash % demoNames.length];
        }
        
        return 'Sarah Tan'; // Default
    }

    // Action: Qualify Prospect
    this.on('qualifyProspect', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        if (prospect.status === 'Qualified') {
            return req.warn(409, 'Prospect is already qualified');
        }

        // Calculate prospect score using mock AI algorithm
        const prospectScore = calculateProspectScore(prospect);

        // Update prospect status and score
        await UPDATE(Prospects).set({
            status: 'Qualified',
            prospectScore: prospectScore
        }).where({ ID: prospectID });

        return req.reply({ 
            message: 'Prospect qualified successfully', 
            prospectScore: prospectScore 
        });
    });

    // Action: Change Prospect Status (for Creatio chevron stage bar)
    this.on('changeStatus', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const { newStatus } = req.data;

        // Valid status transitions
        const validStatuses = ['New', 'Contacted', 'Qualified', 'Negotiating', 'In Review', 'Converted'];
        
        if (!validStatuses.includes(newStatus)) {
            return req.error(400, `Invalid status: ${newStatus}. Valid values are: ${validStatuses.join(', ')}`);
        }

        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        // Update the status
        const updateData = {
            status: newStatus,
            modifiedAt: new Date().toISOString()
        };

        // If moving to Qualified, calculate score
        if (newStatus === 'Qualified') {
            updateData.prospectScore = calculateProspectScore(prospect);
        }

        await UPDATE(Prospects).set(updateData).where({ ID: prospectID });

        console.log(`Prospect ${prospectID} status changed from ${prospect.status} to ${newStatus}`);

        // Return the updated prospect
        const updatedProspect = await SELECT.one.from(Prospects).where({ ID: prospectID });
        return updatedProspect;
    });

    // Action: Assign to Sales Rep
    this.on('assignToSalesRep', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const { salesRepID } = req.data;
        
        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectID });
        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        // Verify sales rep exists
        const salesRep = await SELECT.one.from(Users).where({ ID: salesRepID });
        if (!salesRep) {
            return req.error(404, `Sales rep ${salesRepID} not found`);
        }

        await UPDATE(Prospects).set({
            autoAssignedTo_ID: salesRepID
        }).where({ ID: prospectID });

        return req.reply({ 
            message: 'Prospect assigned to sales rep successfully',
            salesRepName: salesRep.fullName 
        });
    });

    // Action: Initiate AI Meeting
    // Generates an AI-powered meeting script for the prospect
    this.on('initiateAIMeeting', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const prospect = await SELECT.one.from(Prospects)
            .columns('*', 'autoAssignedTo.fullName')
            .where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        // Simulate AI processing with 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate meeting script based on prospect data
        const meetingScript = generateMeetingScript(prospect);
        
        return meetingScript;
    });

    // Helper function: Generate AI Meeting Script
    function generateMeetingScript(prospect) {
        const prospectName = prospect.prospectName || 'the prospect';
        const businessType = prospect.businessType || 'business';
        const discoverySource = prospect.discoverySource || 'referral';
        const location = prospect.city || prospect.location || 'the area';
        const score = prospect.prospectScore || 50;
        
        // Parse contact info if available
        let contactName = '';
        let contactEmail = '';
        if (prospect.contactInfo) {
            try {
                const contactData = JSON.parse(prospect.contactInfo);
                contactName = contactData.name || '';
                contactEmail = contactData.email || '';
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        // Generate meeting script sections
        const sections = [];
        
        // Opening
        sections.push("📋 AI MEETING SCRIPT FOR: " + prospectName.toUpperCase());
        sections.push("━".repeat(50));
        sections.push("");
        
        // Pre-Meeting Preparation
        sections.push("🎯 PRE-MEETING PREPARATION");
        sections.push("─".repeat(30));
        sections.push("• Research " + prospectName + "'s current product lineup");
        sections.push("• Review their social media presence and recent posts");
        sections.push("• Prepare product samples relevant to " + businessType + " operations");
        sections.push("• Check competitor products they may be carrying");
        sections.push("");
        
        // Meeting Agenda
        sections.push("📅 SUGGESTED MEETING AGENDA (45 mins)");
        sections.push("─".repeat(30));
        sections.push("1. Introduction & Rapport Building (5 mins)");
        sections.push("2. Understanding Their Business Needs (10 mins)");
        sections.push("3. Product Presentation (15 mins)");
        sections.push("4. Addressing Concerns & Questions (10 mins)");
        sections.push("5. Next Steps & Close (5 mins)");
        sections.push("");
        
        // Opening Script
        sections.push("💬 OPENING SCRIPT");
        sections.push("─".repeat(30));
        if (contactName) {
            sections.push("\"Good [morning/afternoon], " + contactName + "! Thank you for taking the time to meet with me today.");
        } else {
            sections.push("\"Good [morning/afternoon]! Thank you for taking the time to meet with me today.");
        }
        sections.push("I understand " + prospectName + " is a " + businessType + " in " + location + ".");
        
        if (discoverySource === 'Lead Conversion') {
            sections.push("I've been looking forward to this meeting since we first connected through our lead program.\"");
        } else if (discoverySource === 'Partnership') {
            sections.push("Our mutual partner spoke highly of your business, and I'm excited to explore how we can work together.\"");
        } else {
            sections.push("I've heard great things about your business and I'm excited to explore how we can work together.\"");
        }
        sections.push("");
        
        // Key Talking Points
        sections.push("🔑 KEY TALKING POINTS");
        sections.push("─".repeat(30));
        
        if (businessType === 'Salon' || businessType === 'Spa') {
            sections.push("• Discuss professional-grade products for treatments");
            sections.push("• Highlight training and certification programs available");
            sections.push("• Present exclusive salon/spa pricing tiers");
            sections.push("• Mention marketing support for service promotions");
        } else if (businessType === 'Retailer' || businessType === 'E-commerce') {
            sections.push("• Present retail margin opportunities");
            sections.push("• Discuss shelf presence and POP display options");
            sections.push("• Highlight consumer marketing campaigns");
            sections.push("• Explain dropship or consignment options if applicable");
        } else if (businessType === 'Distributor') {
            sections.push("• Present territory exclusivity options");
            sections.push("• Discuss volume-based pricing tiers");
            sections.push("• Explain logistics and fulfillment support");
            sections.push("• Highlight B2B marketing materials available");
        } else {
            sections.push("• Present product portfolio overview");
            sections.push("• Discuss partnership benefits and pricing");
            sections.push("• Highlight support and marketing materials");
            sections.push("• Explain ordering and fulfillment process");
        }
        sections.push("");
        
        // Questions to Ask
        sections.push("❓ DISCOVERY QUESTIONS TO ASK");
        sections.push("─".repeat(30));
        sections.push("• \"What beauty brands are you currently carrying?\"");
        sections.push("• \"What challenges are you facing with your current suppliers?\"");
        sections.push("• \"What are your customers asking for that you can't provide?\"");
        sections.push("• \"What's your typical order volume and frequency?\"");
        sections.push("• \"How do you prefer to receive marketing support?\"");
        sections.push("");
        
        // Closing Script
        sections.push("✅ CLOSING SCRIPT");
        sections.push("─".repeat(30));
        sections.push("\"Based on what we've discussed today, I believe our partnership could really benefit " + prospectName + ".");
        
        if (score >= 70) {
            sections.push("Given your business profile, I'd like to offer you our Premium Partner package.");
            sections.push("Can we schedule a follow-up meeting to finalize the partnership details?\"");
        } else if (score >= 50) {
            sections.push("I think our Standard Partnership program would be a great fit to start.");
            sections.push("Would you like me to prepare a proposal for your review?\"");
        } else {
            sections.push("Let me put together some information and samples for you to review.");
            sections.push("Can I follow up with you next week to discuss further?\"");
        }
        sections.push("");
        
        // Follow-up Actions
        sections.push("📌 POST-MEETING FOLLOW-UP");
        sections.push("─".repeat(30));
        sections.push("• Send thank you email within 24 hours");
        sections.push("• Prepare and send proposal/quote within 3 business days");
        sections.push("• Schedule follow-up call for next week");
        sections.push("• Update CRM with meeting notes and next steps");
        if (contactEmail) {
            sections.push("• Primary contact for follow-up: " + contactEmail);
        }
        
        return sections.join('\n');
    }

    // Action: Create Opportunity from Prospect
    this.on('createOpportunity', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        if (prospect.convertedToOpportunity_ID) {
            return req.warn(409, 'This prospect has already been converted to an opportunity');
        }

        // Get input data from request body (from custom dialog)
        let inputData = req.data || {};
        console.log('[Create Opportunity] Received data:', JSON.stringify(inputData));

        // Generate UUID for the new opportunity
        const opportunityID = cds.utils.uuid();

        // Create new opportunity from dialog data + prospect data
        const opportunityData = {
            ID: opportunityID,
            // Use dialog data if provided, otherwise generate from prospect
            name: inputData.name || `${prospect.prospectName} - Opportunity`,
            description: inputData.description || `Opportunity created from prospect: ${prospect.prospectName}`,
            sourceProspect_ID: prospectID,
            // Pipeline data
            stage: inputData.stage || 'Prospecting',
            probability: inputData.probability ?? prospect.prospectScore ?? 50,
            // Financial data
            amount: inputData.amount ?? prospect.estimatedValue ?? 0,
            currency: 'MYR',
            expectedRevenue: inputData.expectedRevenue ?? prospect.estimatedValue ?? 0,
            closeDate: inputData.closeDate || getExpectedCloseDate(),
            // Assignment
            owner_ID: inputData.owner_ID || prospect.autoAssignedTo_ID || null,
            // Strategy & Competition
            competitors: inputData.competitors || null,
            winStrategy: inputData.winStrategy || null,
            // Notes
            notes: inputData.notes || null,
            // AI Fields (can be calculated later)
            aiWinScore: prospect.aiScore || null,
            aiRecommendation: null
        };

        console.log('[Create Opportunity] Creating with data:', JSON.stringify(opportunityData, null, 2));

        await INSERT.into(Opportunities).entries(opportunityData);

        // Update prospect status and link to opportunity
        await UPDATE(Prospects).set({
            status: 'Converted',
            convertedToOpportunity_ID: opportunityID
        }).where({ ID: prospectID });

        console.log('[Create Opportunity] Success! Prospect ID:', prospectID);
        console.log('[Create Opportunity] Opportunity ID:', opportunityID);

        return { 
            message: 'Opportunity created successfully', 
            opportunityID: opportunityID
        };
    });

    // Action: Convert Prospect to Account, Contact, and Opportunity
    // Creates all three entities in sequence: Account → Contact → Opportunity
    this.on('convertToAccount', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const prospect = await SELECT.one.from(Prospects).where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        if (prospect.status === 'Converted') {
            return req.warn(409, 'This prospect has already been converted');
        }

        // Get input data from request body (from conversion dialog)
        const inputData = req.data || {};
        console.log('[Convert to Account] Received data:', JSON.stringify(inputData, null, 2));

        // Generate UUIDs for all new entities
        const accountID = cds.utils.uuid();
        const contactID = cds.utils.uuid();
        const opportunityID = cds.utils.uuid();

        try {
            // ============================================
            // STEP 1: Create Account
            // ============================================
            const accountData = {
                ID: accountID,
                accountName: inputData.accountName || prospect.prospectName,
                accountType: mapBusinessTypeToAccountType(inputData.accountType || prospect.businessType),
                industry: inputData.industry || 'Beauty & Wellness',
                website: inputData.website || '',
                status: 'Active',
                // Address fields
                address: inputData.address || prospect.address || '',
                city: inputData.city || prospect.city || '',
                state: inputData.state || prospect.state || '',
                country: inputData.country || prospect.country || 'Malaysia',
                postalCode: inputData.postalCode || prospect.postalCode || '',
                // Link to source prospect
                sourceProspect_ID: prospectID,
                // Default values
                healthScore: prospect.prospectScore || 70,
                riskLevel: 'Low',
                dateCreated: new Date().toISOString().split('T')[0],
                // Notes
                description: `Account created from prospect: ${prospect.prospectName}`,
                notes: prospect.about || ''
            };

            console.log('[Convert to Account] Creating Account:', accountData.accountName);
            await INSERT.into(Accounts).entries(accountData);

            // ============================================
            // STEP 2: Create Contact (linked to Account)
            // ============================================
            // Parse contact name into first/last name
            const contactFullName = inputData.contactFirstName && inputData.contactLastName
                ? `${inputData.contactFirstName} ${inputData.contactLastName}`
                : prospect.contactName || '';
            
            const nameParts = parseContactName(
                inputData.contactFirstName,
                inputData.contactLastName,
                prospect.contactName
            );

            const contactData = {
                ID: contactID,
                firstName: nameParts.firstName,
                lastName: nameParts.lastName,
                fullName: contactFullName || `${nameParts.firstName} ${nameParts.lastName}`.trim(),
                title: inputData.contactTitle || 'Business Owner',
                email: inputData.contactEmail || prospect.contactEmail || '',
                phone: inputData.contactPhone || prospect.contactPhone || '',
                // Link to the new account
                account_ID: accountID,
                isPrimary: true,
                // Default values
                status: 'Active',
                preferredChannel: 'Email',
                language: 'English',
                engagementScore: prospect.prospectScore || 50,
                sentimentScore: prospect.sentimentScore || 0,
                sentimentLabel: 'Neutral'
            };

            console.log('[Convert to Account] Creating Contact:', contactData.fullName);
            await INSERT.into(Contacts).entries(contactData);

            // ============================================
            // STEP 3: Create Opportunity (linked to Account and Contact)
            // ============================================
            const opportunityData = {
                ID: opportunityID,
                name: inputData.opportunityName || `${prospect.prospectName} - Partnership Deal`,
                description: inputData.opportunityDescription || `Opportunity created from prospect conversion: ${prospect.prospectName}`,
                // Link to account and contact
                account_ID: accountID,
                primaryContact_ID: contactID,
                sourceProspect_ID: prospectID,
                // Pipeline data
                stage: inputData.opportunityStage || 'Prospecting',
                probability: inputData.opportunityProbability ?? prospect.prospectScore ?? 50,
                // Financial data
                amount: inputData.opportunityAmount ?? prospect.estimatedValue ?? 0,
                currency: 'MYR',
                expectedRevenue: inputData.opportunityAmount ?? prospect.estimatedValue ?? 0,
                closeDate: inputData.opportunityCloseDate || getExpectedCloseDate(),
                // Assignment - use prospect's assigned sales rep
                owner_ID: prospect.autoAssignedTo_ID || null,
                // AI predictions
                aiWinScore: prospect.aiScore || prospect.prospectScore || 50,
                aiRecommendation: `Based on prospect score of ${prospect.prospectScore || 50}%, this opportunity shows good potential.`
            };

            console.log('[Convert to Account] Creating Opportunity:', opportunityData.name);
            await INSERT.into(Opportunities).entries(opportunityData);

            // ============================================
            // STEP 4: Update Prospect Status
            // ============================================
            await UPDATE(Prospects).set({
                status: 'Converted',
                convertedToOpportunity_ID: opportunityID
            }).where({ ID: prospectID });

            console.log('[Convert to Account] Conversion complete!');
            console.log('  - Account ID:', accountID);
            console.log('  - Contact ID:', contactID);
            console.log('  - Opportunity ID:', opportunityID);

            return {
                message: 'Prospect converted successfully! Account, Contact, and Opportunity have been created.',
                accountID: accountID,
                contactID: contactID,
                opportunityID: opportunityID
            };

        } catch (error) {
            console.error('[Convert to Account] Error during conversion:', error);
            return req.error(500, `Conversion failed: ${error.message}`);
        }
    });

    // Helper function: Map business type to account type
    function mapBusinessTypeToAccountType(businessType) {
        const mapping = {
            'Salon': 'Salon',
            'Spa': 'Spa',
            'Retailer': 'Retailer',
            'E-commerce': 'E-commerce',
            'Kiosk': 'Retailer',
            'Distributor': 'Distributor'
        };
        return mapping[businessType] || 'Retailer';
    }

    // Helper function: Parse contact name into first and last name
    function parseContactName(firstName, lastName, fullName) {
        if (firstName || lastName) {
            return {
                firstName: firstName || '',
                lastName: lastName || ''
            };
        }
        
        if (fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length >= 2) {
                return {
                    firstName: parts[0],
                    lastName: parts.slice(1).join(' ')
                };
            } else if (parts.length === 1) {
                return {
                    firstName: parts[0],
                    lastName: ''
                };
            }
        }
        
        return { firstName: 'Contact', lastName: '' };
    }

    // Helper function: Get expected close date (3 months from now)
    function getExpectedCloseDate() {
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        return date.toISOString().split('T')[0];
    }

    // Action: Generate About (Mock from CSV)
    this.on('generateAbout', 'Prospects', async (req) => {
        const prospectID = req.params[0].ID;
        const prospect = await SELECT.one.from(Prospects)
            .columns('*', 'autoAssignedTo.fullName')
            .where({ ID: prospectID });

        if (!prospect) {
            return req.error(404, `Prospect ${prospectID} not found`);
        }

        // Simulate AI processing with 3-second delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate about text
        const aboutText = generateAboutText(prospect);

        // Update prospect with generated about text
        await UPDATE(Prospects).set({
            about: aboutText
        }).where({ ID: prospectID });

        // Fetch the updated prospect to return in response
        const updatedProspect = await SELECT.one.from(Prospects)
            .columns('*')
            .where({ ID: prospectID });

        return updatedProspect;
    });

    // Action: Bulk Import
    this.on('bulkImport', 'Prospects', async (req) => {
        const { prospects } = req.data;
        
        if (!prospects) {
            return req.error(400, 'prospects parameter is required');
        }

        let prospectsArray;
        try {
            prospectsArray = JSON.parse(prospects);
        } catch (e) {
            return req.error(400, 'Invalid JSON format for prospects');
        }

        if (!Array.isArray(prospectsArray)) {
            return req.error(400, 'prospects must be an array');
        }

        const created = [];
        for (const prospectData of prospectsArray) {
            const prospectScore = calculateProspectScoreFromData(prospectData);
            const autoAssignedTo = await autoAssignProspect(prospectData);

            // Parse contact info if it's a JSON string
            let contactName = null, contactEmail = null, contactPhone = null;
            if (prospectData.contactInfo) {
                try {
                    const contactDataParsed = typeof prospectData.contactInfo === 'string' 
                        ? JSON.parse(prospectData.contactInfo) 
                        : prospectData.contactInfo;
                    contactName = contactDataParsed.name || null;
                    contactEmail = contactDataParsed.email || null;
                    contactPhone = contactDataParsed.phone || null;
                } catch (e) {
                    // If not JSON, leave as null
                }
            }
            
            const newProspect = await INSERT.into(Prospects).entries({
                prospectName: prospectData.prospectName,
                discoverySource: prospectData.discoverySource || 'Other',
                discoveryDate: new Date().toISOString(),
                location: prospectData.location || '',
                businessType: prospectData.businessType || 'Retailer',
                contactInfo: typeof prospectData.contactInfo === 'string' ? prospectData.contactInfo : JSON.stringify(prospectData.contactInfo || {}),
                socialMediaLinks: prospectData.socialMediaLinks || '',
                prospectScore: prospectScore,
                autoAssignedTo_ID: autoAssignedTo,
                discoveryMetadata: JSON.stringify(prospectData),
                status: 'New',
                address: prospectData.address || '',
                city: prospectData.city || '',
                state: prospectData.state || '',
                country: prospectData.country || 'Malaysia',
                postalCode: prospectData.postalCode || '',
                // Populate parsed fields
                contactName: contactName,
                contactEmail: contactEmail,
                contactPhone: contactPhone
            });

            created.push(newProspect.ID);
        }

        return req.reply({ 
            message: `Successfully imported ${created.length} prospects`,
            count: created.length,
            prospectIDs: created
        });
    });

    // Helper function: Calculate prospect score using mock AI algorithm
    function calculateProspectScore(prospect) {
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
        score += businessTypeScores[prospect.businessType] || 10;

        // Discovery source scoring
        const sourceScores = {
            'Lead Conversion': 20,
            'Online Web': 12,
            'Partnership': 15,
            'Offline': 10,
            'Other': 5
        };
        score += sourceScores[prospect.discoverySource] || 5;

        // Social media presence bonus
        if (prospect.socialMediaLinks && prospect.socialMediaLinks.length > 20) {
            score += 5;
        }

        // Location bonus (if in major cities)
        const majorCities = ['Kuala Lumpur', 'Petaling Jaya', 'Johor Bahru', 'Penang'];
        if (majorCities.some(city => prospect.city && prospect.city.includes(city))) {
            score += 5;
        }

        return Math.min(100, Math.max(0, score));
    }

    // Helper function: Calculate score from raw data
    function calculateProspectScoreFromData(data) {
        const prospect = {
            businessType: data.businessType,
            discoverySource: data.discoverySource,
            socialMediaLinks: data.socialMediaLinks || '',
            city: data.city || ''
        };
        return calculateProspectScore(prospect);
    }

    // Helper function: Auto-assign prospect based on territory/region
    async function autoAssignProspect(prospectData) {
        // Simple auto-assignment: find sales rep by region/city
        const city = prospectData.city || '';
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

    // Helper function: Generate About text (Mock AI)
    function generateAboutText(prospect) {
        const notes = [];
        
        // Business Overview
        if (prospect.businessType) {
            notes.push(`• Business Type: ${prospect.businessType}`);
        }
        
        // Location Information
        if (prospect.location) {
            notes.push(`• Location: ${prospect.location}`);
        }
        if (prospect.city) {
            notes.push(`• City: ${prospect.city}`);
        }
        if (prospect.country) {
            notes.push(`• Country: ${prospect.country}`);
        }
        
        // Business Score & Potential
        if (prospect.prospectScore) {
            let scoreNote = `• Prospect Score: ${prospect.prospectScore}/100`;
            if (prospect.prospectScore >= 80) {
                scoreNote += ' (High Potential - Priority Prospect)';
            } else if (prospect.prospectScore >= 65) {
                scoreNote += ' (Good Potential - Follow Up Recommended)';
            } else if (prospect.prospectScore >= 50) {
                scoreNote += ' (Moderate Potential - Monitor Progress)';
            } else {
                scoreNote += ' (Low Potential - Standard Follow Up)';
            }
            notes.push(scoreNote);
        }
        
        // Discovery Source
        if (prospect.discoverySource) {
            notes.push(`• Discovery Source: ${prospect.discoverySource}`);
        }
        
        // Contact Information
        if (prospect.contactInfo) {
            notes.push(`• Contact: ${prospect.contactInfo}`);
        }
        
        // Social Media Presence
        if (prospect.socialMediaLinks) {
            notes.push(`• Social Media: ${prospect.socialMediaLinks}`);
        }
        
        // Status & Next Steps
        if (prospect.status) {
            let statusNote = `• Current Status: ${prospect.status}`;
            if (prospect.status === 'New') {
                statusNote += ' - Awaiting qualification and assignment';
            } else if (prospect.status === 'Contacted') {
                statusNote += ' - Initial contact made, follow-up required';
            } else if (prospect.status === 'Qualified') {
                statusNote += ' - Ready for opportunity creation';
            } else if (prospect.status === 'Negotiating') {
                statusNote += ' - Currently in negotiation phase';
            } else if (prospect.status === 'In Review') {
                statusNote += ' - Under review for final approval';
            } else if (prospect.status === 'Converted') {
                statusNote += ' - Successfully converted to opportunity';
            }
            notes.push(statusNote);
        }
        
        // Assignment Information
        if (prospect.autoAssignedTo && prospect.autoAssignedTo.fullName) {
            notes.push(`• Assigned To: ${prospect.autoAssignedTo.fullName}`);
        }
        
        // Business Insights
        if (prospect.businessType === 'Salon' || prospect.businessType === 'Spa') {
            notes.push(`• Business Focus: Professional beauty services and treatments`);
        } else if (prospect.businessType === 'Retailer') {
            notes.push(`• Business Focus: Beauty product retail and distribution`);
        } else if (prospect.businessType === 'E-commerce') {
            notes.push(`• Business Focus: Online beauty product sales`);
        }
        
        // Recommendation
        if (prospect.prospectScore >= 70) {
            notes.push(`• Recommendation: High-value prospect - prioritize engagement and opportunity creation`);
        } else if (prospect.prospectScore >= 50) {
            notes.push(`• Recommendation: Moderate value - standard outreach and relationship building`);
        }
        
        return notes.join('\n') || `• ${prospect.prospectName} is a beauty and wellness business with potential for partnership opportunities.`;
    }
}


