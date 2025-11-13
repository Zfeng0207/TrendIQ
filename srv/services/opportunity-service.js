/**
 * Opportunity Service Handler
 * Implements business logic for sales opportunity and approval workflow management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Opportunities, Approvals } = this.entities;

    // Action: Move Opportunity to Stage
    this.on('moveToStage', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { newStage } = req.data;

        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        // Validate stage transition
        const validStages = ['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
        if (!validStages.includes(newStage)) {
            return req.error(400, `Invalid stage: ${newStage}`);
        }

        // Update probability based on stage
        const stageProbability = {
            'Prospecting': 10,
            'Qualification': 25,
            'Needs Analysis': 40,
            'Proposal': 60,
            'Negotiation': 75,
            'Closed Won': 100,
            'Closed Lost': 0
        };

        await UPDATE(Opportunities).set({
            stage: newStage,
            probability: stageProbability[newStage] || opportunity.probability
        }).where({ ID: oppID });

        return req.reply({ message: `Opportunity moved to ${newStage}`, stage: newStage });
    });

    // Action: Request Approval
    this.on('requestApproval', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { reason, discountPercent } = req.data;

        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        if (discountPercent > 25) {
            return req.error(400, 'Discount cannot exceed 25%');
        }

        // Create approval request
        const approval = await INSERT.into(Approvals).entries({
            opportunityID_ID: oppID,
            approvalType: 'Discount',
            requestedBy_ID: opportunity.owner_ID,
            approver_ID: opportunity.owner_ID, // In real system, would select appropriate approver
            requestDate: new Date().toISOString(),
            requestReason: reason,
            requestedAmount: opportunity.amount,
            requestedDiscount: discountPercent,
            status: 'Pending',
            priority: discountPercent > 15 ? 'Urgent' : 'Normal'
        });

        await UPDATE(Opportunities).set({
            requiresApproval: true,
            approval_ID: approval.ID
        }).where({ ID: oppID });

        return req.reply({
            message: 'Approval request created',
            approvalID: approval.ID
        });
    });

    // Action: Mark as Won
    this.on('markAsWon', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        if (opportunity.requiresApproval && !opportunity.approval_ID) {
            return req.error(400, 'Cannot close - pending approval required');
        }

        await UPDATE(Opportunities).set({
            stage: 'Closed Won',
            probability: 100,
            actualCloseDate: new Date().toISOString()
        }).where({ ID: oppID });

        return req.reply({ message: 'Opportunity marked as Won!' });
    });

    // Action: Mark as Lost
    this.on('markAsLost', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { reason } = req.data;

        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        await UPDATE(Opportunities).set({
            stage: 'Closed Lost',
            probability: 0,
            actualCloseDate: new Date().toISOString(),
            lostReason: reason
        }).where({ ID: oppID });

        return req.reply({ message: 'Opportunity marked as Lost', reason });
    });

    // Action: Update AI Win Score
    this.on('updateAIWinScore', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        const aiWinScore = calculateWinProbability(opportunity);
        const recommendation = getWinRecommendation(opportunity, aiWinScore);

        await UPDATE(Opportunities).set({
            aiWinScore: aiWinScore,
            aiRecommendation: recommendation
        }).where({ ID: oppID });

        return req.reply({ message: 'AI win score updated', aiWinScore });
    });

    // Action: Approve
    this.on('approve', 'Approvals', async (req) => {
        const approvalID = req.params[0].ID;
        const { comments } = req.data;

        const approval = await SELECT.one.from(Approvals).where({ ID: approvalID });

        if (!approval) {
            return req.error(404, `Approval ${approvalID} not found`);
        }

        if (approval.status !== 'Pending') {
            return req.error(400, `Approval is already ${approval.status}`);
        }

        await UPDATE(Approvals).set({
            status: 'Approved',
            decision: 'Approved',
            decisionDate: new Date().toISOString(),
            approverComments: comments
        }).where({ ID: approvalID });

        return req.reply({ message: 'Approval granted', decision: 'Approved' });
    });

    // Action: Reject
    this.on('rejectApproval', 'Approvals', async (req) => {
        const approvalID = req.params[0].ID;
        const { comments } = req.data;

        const approval = await SELECT.one.from(Approvals).where({ ID: approvalID });

        if (!approval) {
            return req.error(404, `Approval ${approvalID} not found`);
        }

        if (approval.status !== 'Pending') {
            return req.error(400, `Approval is already ${approval.status}`);
        }

        await UPDATE(Approvals).set({
            status: 'Rejected',
            decision: 'Rejected',
            decisionDate: new Date().toISOString(),
            approverComments: comments
        }).where({ ID: approvalID });

        return req.reply({ message: 'Approval rejected', decision: 'Rejected' });
    });

    // Before CREATE: Calculate expected revenue
    this.before('CREATE', 'Opportunities', async (req) => {
        const opp = req.data;

        // Calculate expected revenue
        if (opp.amount && opp.probability) {
            opp.expectedRevenue = (opp.amount * (opp.probability / 100)).toFixed(2);
        }

        // Calculate discount amount if discount percent is provided
        if (opp.amount && opp.discountPercent) {
            opp.discountAmount = (opp.amount * (opp.discountPercent / 100)).toFixed(2);
        }

        // Set initial AI win score
        opp.aiWinScore = calculateWinProbability(opp);
    });

    // Before UPDATE: Recalculate expected revenue
    this.before('UPDATE', 'Opportunities', async (req) => {
        const opp = req.data;

        if (opp.amount !== undefined || opp.probability !== undefined) {
            const current = await SELECT.one.from(Opportunities).where({ ID: req.data.ID });
            const amount = opp.amount !== undefined ? opp.amount : current.amount;
            const probability = opp.probability !== undefined ? opp.probability : current.probability;

            opp.expectedRevenue = (amount * (probability / 100)).toFixed(2);
        }
    });
};

// Mock AI Functions
function calculateWinProbability(opportunity) {
    let score = opportunity.probability || 50;

    // Stage bonus
    const stageBonus = {
        'Negotiation': 15,
        'Proposal': 10,
        'Needs Analysis': 5
    };
    score += stageBonus[opportunity.stage] || 0;

    // Amount impact (larger deals may have lower win rate)
    if (opportunity.amount > 500000) score -= 5;
    else if (opportunity.amount > 200000) score -= 2;

    // Discount impact
    if (opportunity.discountPercent > 20) score -= 10;
    else if (opportunity.discountPercent > 10) score -= 5;

    // Notes sentiment
    const notes = (opportunity.notes || '').toLowerCase();
    if (notes.includes('interested') || notes.includes('positive')) score += 10;
    if (notes.includes('concern') || notes.includes('competitor')) score -= 10;

    return Math.min(100, Math.max(0, Math.round(score)));
}

function getWinRecommendation(opportunity, aiWinScore) {
    if (aiWinScore >= 80) {
        return 'High win probability. Push for close this quarter.';
    } else if (aiWinScore >= 60) {
        return 'Good opportunity. Address any remaining concerns and move to proposal.';
    } else if (aiWinScore >= 40) {
        return 'Moderate risk. Need stronger value proposition and competitive differentiation.';
    } else {
        return 'Low win probability. Consider de-prioritizing or re-qualifying.';
    }
}
