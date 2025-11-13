/**
 * Workflow Service Handler
 * Implements business logic for approval workflows and user management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Approvals, Users } = this.entities;

    // Action: Submit Approval (generic)
    this.on('submitApproval', 'Approvals', async (req) => {
        const approvalID = req.params[0].ID;
        const { comments } = req.data;

        const approval = await SELECT.one.from(Approvals).where({ ID: approvalID });

        if (!approval) {
            return req.error(404, `Approval ${approvalID} not found`);
        }

        if (approval.status !== 'Draft') {
            return req.error(400, `Approval must be in Draft status to submit (current: ${approval.status})`);
        }

        await UPDATE(Approvals).set({
            status: 'Pending',
            requestDate: new Date().toISOString(),
            submitterComments: comments
        }).where({ ID: approvalID });

        return req.reply({ message: 'Approval submitted for review', status: 'Pending' });
    });

    // Action: Escalate Approval
    this.on('escalate', 'Approvals', async (req) => {
        const approvalID = req.params[0].ID;
        const { reason, newApproverID } = req.data;

        const approval = await SELECT.one.from(Approvals).where({ ID: approvalID });

        if (!approval) {
            return req.error(404, `Approval ${approvalID} not found`);
        }

        if (approval.status !== 'Pending') {
            return req.error(400, 'Can only escalate pending approvals');
        }

        // Check if approval is overdue
        const daysPending = approval.requestDate
            ? (Date.now() - new Date(approval.requestDate)) / (1000 * 60 * 60 * 24)
            : 0;

        if (daysPending < 3) {
            req.warn('Escalating approval that has been pending for less than 3 days');
        }

        const oldApprover = approval.approver_ID;

        await UPDATE(Approvals).set({
            approver_ID: newApproverID || approval.approver_ID,
            priority: 'Urgent',
            escalationReason: reason,
            escalatedDate: new Date().toISOString(),
            previousApprover_ID: oldApprover
        }).where({ ID: approvalID });

        return req.reply({
            message: 'Approval escalated',
            newApprover: newApproverID,
            reason
        });
    });

    // Action: Withdraw Approval
    this.on('withdraw', 'Approvals', async (req) => {
        const approvalID = req.params[0].ID;
        const { reason } = req.data;

        const approval = await SELECT.one.from(Approvals).where({ ID: approvalID });

        if (!approval) {
            return req.error(404, `Approval ${approvalID} not found`);
        }

        if (approval.status === 'Approved' || approval.status === 'Rejected') {
            return req.error(400, `Cannot withdraw ${approval.status.toLowerCase()} approval`);
        }

        await UPDATE(Approvals).set({
            status: 'Withdrawn',
            decision: 'Withdrawn',
            decisionDate: new Date().toISOString(),
            approverComments: reason || 'Withdrawn by requester'
        }).where({ ID: approvalID });

        return req.reply({ message: 'Approval withdrawn', reason });
    });

    // Action: Update User Status
    this.on('updateStatus', 'Users', async (req) => {
        const userID = req.params[0].ID;
        const { newStatus, reason } = req.data;

        const user = await SELECT.one.from(Users).where({ ID: userID });

        if (!user) {
            return req.error(404, `User ${userID} not found`);
        }

        const validStatuses = ['Active', 'Inactive', 'On Leave', 'Suspended'];
        if (!validStatuses.includes(newStatus)) {
            return req.error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const oldStatus = user.status;

        await UPDATE(Users).set({
            status: newStatus,
            notes: (user.notes || '') + `\n[STATUS CHANGE] From ${oldStatus} to ${newStatus} on ${new Date().toISOString()}: ${reason || 'No reason provided'}`
        }).where({ ID: userID });

        return req.reply({
            message: 'User status updated',
            oldStatus,
            newStatus
        });
    });

    // Action: Update User Performance
    this.on('updatePerformance', 'Users', async (req) => {
        const userID = req.params[0].ID;
        const user = await SELECT.one.from(Users).where({ ID: userID });

        if (!user) {
            return req.error(404, `User ${userID} not found`);
        }

        const performanceMetrics = calculateUserPerformance(user);

        await UPDATE(Users).set({
            performanceScore: performanceMetrics.score,
            lastPerformanceUpdate: new Date().toISOString()
        }).where({ ID: userID });

        return req.reply({
            message: 'Performance metrics updated',
            performanceScore: performanceMetrics.score,
            factors: performanceMetrics.factors
        });
    });

    // Before CREATE Approval: Set defaults and validate
    this.before('CREATE', 'Approvals', async (req) => {
        const approval = req.data;

        // Set default status
        if (!approval.status) {
            approval.status = 'Draft';
        }

        // Set default priority
        if (!approval.priority) {
            approval.priority = 'Normal';
        }

        // Validate approval type
        const validTypes = ['Discount', 'Price Override', 'Deal Structure', 'Contract Terms', 'Budget Allocation'];
        if (approval.approvalType && !validTypes.includes(approval.approvalType)) {
            req.warn(`Unusual approval type: ${approval.approvalType}`);
        }

        // Set request date if status is Pending
        if (approval.status === 'Pending' && !approval.requestDate) {
            approval.requestDate = new Date().toISOString();
        }
    });

    // Before UPDATE Approval: Validate status transitions
    this.before('UPDATE', 'Approvals', async (req) => {
        const updates = req.data;

        if (updates.status !== undefined) {
            const current = await SELECT.one.from(Approvals).where({ ID: updates.ID });

            // Prevent re-opening completed approvals
            if ((current.status === 'Approved' || current.status === 'Rejected') &&
                (updates.status === 'Draft' || updates.status === 'Pending')) {
                req.error(400, 'Cannot re-open completed approvals');
            }
        }
    });

    // Before CREATE User: Set defaults
    this.before('CREATE', 'Users', async (req) => {
        const user = req.data;

        // Set default status
        if (!user.status) {
            user.status = 'Active';
        }

        // Auto-generate full name if not provided
        if (!user.fullName && (user.firstName || user.lastName)) {
            user.fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }

        // Calculate initial performance score
        user.performanceScore = 50; // Starting baseline
    });

    // After CREATE Approval: Log
    this.after('CREATE', 'Approvals', async (data, req) => {
        console.log(`New approval created: ${data.approvalType} (${data.status})`);
    });

    // After CREATE User: Log
    this.after('CREATE', 'Users', async (data, req) => {
        console.log(`New user created: ${data.fullName || data.userName} (${data.role})`);
    });
};

// Mock Performance Calculation Functions
function calculateUserPerformance(user) {
    let score = 50; // Base score
    const factors = [];

    // Role-based baseline
    const roleBaseline = {
        'Sales Rep': 50,
        'Sales Manager': 60,
        'Account Manager': 55,
        'Product Specialist': 50,
        'Admin': 45
    };
    score = roleBaseline[user.role] || 50;
    factors.push(`Role baseline: ${user.role}`);

    // Status impact
    if (user.status === 'Active') {
        score += 10;
    } else if (user.status === 'Inactive' || user.status === 'Suspended') {
        score -= 30;
        factors.push('Inactive status penalty');
    } else if (user.status === 'On Leave') {
        score -= 10;
    }

    // Territory/region bonus (mock)
    const highPerformingRegions = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor'];
    if (highPerformingRegions.includes(user.territory)) {
        score += 15;
        factors.push('High-performing territory');
    }

    // Team bonus (mock - could be based on aggregating team member data)
    if (user.team === 'Enterprise Sales') {
        score += 10;
        factors.push('Enterprise team bonus');
    }

    // Experience factor (mock - based on account creation date)
    if (user.createdAt) {
        const daysSinceJoined = (Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
        if (daysSinceJoined > 365) {
            score += 15;
            factors.push('Veteran employee (1+ years)');
        } else if (daysSinceJoined > 180) {
            score += 10;
            factors.push('Experienced (6+ months)');
        } else if (daysSinceJoined < 30) {
            score -= 5;
            factors.push('New hire adjustment');
        }
    }

    // Manager bonus
    if (user.role.includes('Manager')) {
        score += 10;
        factors.push('Management role');
    }

    return {
        score: Math.min(100, Math.max(0, Math.round(score))),
        factors: factors
    };
}
