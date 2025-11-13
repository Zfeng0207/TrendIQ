/**
 * Activity Service Handler
 * Implements business logic for activity and task management
 */

const cds = require('@sap/cds');

module.exports = async function() {
    const { Activities } = this.entities;

    // Action: Complete Activity
    this.on('complete', 'Activities', async (req) => {
        const activityID = req.params[0].ID;
        const { outcome } = req.data;

        const activity = await SELECT.one.from(Activities).where({ ID: activityID });

        if (!activity) {
            return req.error(404, `Activity ${activityID} not found`);
        }

        if (activity.status === 'Completed' || activity.status === 'Cancelled') {
            return req.error(400, `Activity is already ${activity.status}`);
        }

        await UPDATE(Activities).set({
            status: 'Completed',
            completedDate: new Date().toISOString(),
            outcome: outcome || 'Completed successfully'
        }).where({ ID: activityID });

        return req.reply({ message: 'Activity completed', outcome });
    });

    // Action: Reschedule Activity
    this.on('reschedule', 'Activities', async (req) => {
        const activityID = req.params[0].ID;
        const { newDateTime } = req.data;

        const activity = await SELECT.one.from(Activities).where({ ID: activityID });

        if (!activity) {
            return req.error(404, `Activity ${activityID} not found`);
        }

        if (activity.status !== 'Planned') {
            return req.error(400, 'Can only reschedule planned activities');
        }

        const newDate = new Date(newDateTime);
        if (newDate < new Date()) {
            return req.warn(400, 'Rescheduling to a past date');
        }

        // Calculate new end time based on duration
        let endDateTime = null;
        if (activity.durationMinutes) {
            endDateTime = new Date(newDate.getTime() + activity.durationMinutes * 60000).toISOString();
        }

        await UPDATE(Activities).set({
            startDateTime: newDateTime,
            endDateTime: endDateTime,
            notes: (activity.notes || '') + `\n[RESCHEDULED] from ${activity.startDateTime} to ${newDateTime}`
        }).where({ ID: activityID });

        return req.reply({ message: 'Activity rescheduled', newDateTime });
    });

    // Action: Cancel Activity
    this.on('cancel', 'Activities', async (req) => {
        const activityID = req.params[0].ID;
        const { reason } = req.data;

        const activity = await SELECT.one.from(Activities).where({ ID: activityID });

        if (!activity) {
            return req.error(404, `Activity ${activityID} not found`);
        }

        if (activity.status === 'Completed') {
            return req.error(400, 'Cannot cancel a completed activity');
        }

        await UPDATE(Activities).set({
            status: 'Cancelled',
            notes: (activity.notes || '') + `\n[CANCELLED] ${reason || 'No reason provided'}`
        }).where({ ID: activityID });

        return req.reply({ message: 'Activity cancelled', reason });
    });

    // Action: Analyze Sentiment
    this.on('analyzeSentiment', 'Activities', async (req) => {
        const activityID = req.params[0].ID;
        const activity = await SELECT.one.from(Activities).where({ ID: activityID });

        if (!activity) {
            return req.error(404, `Activity ${activityID} not found`);
        }

        const sentiment = calculateActivitySentiment(activity);

        await UPDATE(Activities).set({
            sentimentScore: sentiment.score,
            keyPoints: sentiment.keyPoints
        }).where({ ID: activityID });

        return req.reply({
            message: 'Sentiment analyzed',
            sentimentScore: sentiment.score,
            keyPoints: sentiment.keyPoints
        });
    });

    // Before CREATE: Set defaults and validate
    this.before('CREATE', 'Activities', async (req) => {
        const activity = req.data;

        // Set default status
        if (!activity.status) {
            activity.status = 'Planned';
        }

        // Calculate end time if duration is provided
        if (activity.startDateTime && activity.durationMinutes && !activity.endDateTime) {
            const start = new Date(activity.startDateTime);
            activity.endDateTime = new Date(start.getTime() + activity.durationMinutes * 60000).toISOString();
        }

        // Set due date for tasks
        if (activity.activityType === 'Task' && activity.startDateTime && !activity.dueDate) {
            activity.dueDate = activity.startDateTime;
        }

        // Auto-analyze sentiment on creation
        if (activity.notes || activity.outcome) {
            const sentiment = calculateActivitySentiment(activity);
            activity.sentimentScore = sentiment.score;
            activity.keyPoints = sentiment.keyPoints;
        }
    });

    // After CREATE: Log
    this.after('CREATE', 'Activities', async (data, req) => {
        console.log(`New activity created: ${data.subject} (${data.activityType})`);
    });
};

// Mock AI Functions
function calculateActivitySentiment(activity) {
    const text = ((activity.notes || '') + ' ' + (activity.outcome || '') + ' ' + (activity.description || '')).toLowerCase();
    let score = 0;
    const keyPoints = [];

    // Positive indicators
    const positive = {
        'interested': 15,
        'agreed': 15,
        'positive': 10,
        'excellent': 15,
        'successful': 15,
        'approved': 15,
        'closed': 10,
        'signed': 20,
        'confirmed': 10,
        'enthusiastic': 15
    };

    // Negative indicators
    const negative = {
        'rejected': -20,
        'declined': -15,
        'concerned': -10,
        'issue': -10,
        'problem': -15,
        'competitor': -10,
        'expensive': -10,
        'delay': -10,
        'cancelled': -15,
        'unhappy': -15
    };

    // Check positive indicators
    Object.entries(positive).forEach(([word, points]) => {
        if (text.includes(word)) {
            score += points;
            keyPoints.push(`Positive: ${word}`);
        }
    });

    // Check negative indicators
    Object.entries(negative).forEach(([word, points]) => {
        if (text.includes(word)) {
            score += points; // Already negative
            keyPoints.push(`Concern: ${word}`);
        }
    });

    // Activity type impact
    if (activity.activityType === 'Demo' && activity.status === 'Completed') {
        score += 10;
        keyPoints.push('Demo completed');
    }

    // Outcome analysis
    if (activity.outcome) {
        if (activity.outcome.toLowerCase().includes('won') || activity.outcome.toLowerCase().includes('closed')) {
            score += 25;
            keyPoints.push('Deal progression');
        }
    }

    return {
        score: Math.min(100, Math.max(-100, score)),
        keyPoints: keyPoints.slice(0, 5).join('; ') || 'Standard interaction'
    };
}
