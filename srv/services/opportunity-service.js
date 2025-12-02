/**
 * Opportunity Service Handler
 * Implements business logic for sales opportunity and approval workflow management
 */

const cds = require('@sap/cds');

// Stage order for pipeline progression
const STAGE_ORDER = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const OPEN_STAGES = ['Qualification', 'Discovery', 'Proposal', 'Negotiation'];
const CLOSED_STAGES = ['Closed Won', 'Closed Lost'];

module.exports = async function() {
    const { Opportunities, Approvals } = this.entities;

    // Handler for virtual fields: criticality (using after to avoid draft conflicts)
    this.after('READ', 'Opportunities', (results) => {
        const processOpp = (opp) => {
            if (opp) {
                // Win Score Criticality - always set a value to avoid re-polling
                if (opp.aiWinScore >= 80) opp.winScoreCriticality = 3;      // Green
                else if (opp.aiWinScore >= 50) opp.winScoreCriticality = 2; // Yellow
                else opp.winScoreCriticality = 1;                           // Red

                // Stage Criticality
                if (opp.stage === 'Closed Won') opp.stageCriticality = 3;
                else if (opp.stage === 'Closed Lost') opp.stageCriticality = 1;
                else opp.stageCriticality = 2;
            }
        };

        if (Array.isArray(results)) {
            results.forEach(processOpp);
        } else if (results) {
            processOpp(results);
        }
    });

    // Action: Advance Stage (move to next stage in pipeline)
    this.on('advanceStage', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        const currentStage = opportunity.stage;

        // Cannot advance from closed stages
        if (CLOSED_STAGES.includes(currentStage)) {
            return req.error(400, 'Cannot advance a closed opportunity. The deal is final.');
        }

        const currentIndex = OPEN_STAGES.indexOf(currentStage);
        if (currentIndex === -1 || currentIndex >= OPEN_STAGES.length - 1) {
            return req.error(400, 'No further stage available. Use "Mark as Won" or "Mark as Lost" to close the deal.');
        }

        const newStage = OPEN_STAGES[currentIndex + 1];

        await UPDATE(Opportunities).set({
            stage: newStage
        }).where({ ID: oppID });

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
    });

    // Action: Previous Stage (move to previous stage in pipeline)
    this.on('previousStage', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        const currentStage = opportunity.stage;

        // Cannot move back from closed stages
        if (CLOSED_STAGES.includes(currentStage)) {
            return req.error(400, 'Cannot change stage of a closed opportunity.');
        }

        const currentIndex = OPEN_STAGES.indexOf(currentStage);
        if (currentIndex <= 0) {
            return req.error(400, 'Already at the first stage. Cannot move to previous stage.');
        }

        const newStage = OPEN_STAGES[currentIndex - 1];

        await UPDATE(Opportunities).set({
            stage: newStage
        }).where({ ID: oppID });

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
    });

    // Action: Move Opportunity to Stage (with sequential validation)
    this.on('moveToStage', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const { newStage } = req.data;

        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        const currentStage = opportunity.stage;

        // Validate target stage is a known stage
        if (!STAGE_ORDER.includes(newStage)) {
            return req.error(400, `Invalid stage: ${newStage}`);
        }

        // Rule 1: Cannot change stage once opportunity is closed
        if (CLOSED_STAGES.includes(currentStage)) {
            return req.error(400, 'Cannot change stage once opportunity is closed. Closed deals are final.');
        }

        // Rule 2: Cannot enter closed stages via moveToStage - must use markAsWon/markAsLost
        if (CLOSED_STAGES.includes(newStage)) {
            return req.error(400, `Use "Mark as Won" or "Mark as Lost" actions to close the opportunity.`);
        }

        // Rule 3: No change needed if same stage
        if (newStage === currentStage) {
            return opportunity;
        }

        // Rule 4: Only allow sequential stage transitions (no skipping)
        const fromIndex = OPEN_STAGES.indexOf(currentStage);
        const toIndex = OPEN_STAGES.indexOf(newStage);

        if (fromIndex === -1 || toIndex === -1) {
            return req.error(400, `Invalid stage transition from ${currentStage} to ${newStage}`);
        }

        const stepDifference = Math.abs(toIndex - fromIndex);
        if (stepDifference !== 1) {
            const direction = toIndex > fromIndex ? 'forward' : 'backward';
            return req.error(400, `Cannot skip stages. Move ${direction} one step at a time.`);
        }

        // Update ONLY the stage - probability is now manual (per user requirement)
        await UPDATE(Opportunities).set({
            stage: newStage
        }).where({ ID: oppID });

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
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

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
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

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
    });

    // Action: Update AI Win Score
    this.on('updateAIWinScore', 'Opportunities', async (req) => {
        const oppID = req.params[0].ID;
        const opportunity = await SELECT.one.from(Opportunities).where({ ID: oppID });

        if (!opportunity) {
            return req.error(404, `Opportunity ${oppID} not found`);
        }

        await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
        const aiWinScore = calculateWinProbability(opportunity);
        const recommendation = getWinRecommendation(opportunity, aiWinScore);

        await UPDATE(Opportunities).set({
            aiWinScore: aiWinScore,
            aiRecommendation: recommendation
        }).where({ ID: oppID });

        const updatedOpp = await SELECT.one.from(Opportunities).where({ ID: oppID });
        return updatedOpp;
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
        'Discovery': 5
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
