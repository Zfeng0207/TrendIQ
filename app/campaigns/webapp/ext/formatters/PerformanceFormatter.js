sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Format performance metrics JSON into readable HTML
         * @param {string} sMetrics - JSON string of metrics
         * @returns {string} Formatted HTML string
         */
        formatPerformanceMetrics: function (sMetrics) {
            if (!sMetrics) {
                return "No performance data available. Click 'Generate Performance Report' to create performance data.";
            }

            try {
                const metrics = JSON.parse(sMetrics);
                
                if (Object.keys(metrics).length === 0) {
                    return "No performance data available. Click 'Generate Performance Report' to create performance data.";
                }

                let html = '<div style="font-family: Arial, sans-serif; line-height: 2;">';
                
                // Key Performance Indicators
                html += '<div style="margin-bottom: 20px;">';
                html += '<strong style="font-size: 14px; color: #0070f2;">📊 Key Performance Metrics</strong><br/>';
                
                if (metrics.impressions !== undefined) {
                    html += `<span style="font-size: 13px;">👁️ <strong>Impressions:</strong> ${this._formatNumber(metrics.impressions)}</span><br/>`;
                }
                if (metrics.clicks !== undefined) {
                    html += `<span style="font-size: 13px;">👆 <strong>Clicks:</strong> ${this._formatNumber(metrics.clicks)}</span><br/>`;
                }
                if (metrics.conversions !== undefined) {
                    html += `<span style="font-size: 13px;">✅ <strong>Conversions:</strong> ${this._formatNumber(metrics.conversions)}</span><br/>`;
                }
                html += '</div>';
                
                // Financial Metrics
                if (metrics.roi !== undefined || metrics.revenue !== undefined || metrics.costPerConversion !== undefined) {
                    html += '<div style="margin-bottom: 20px;">';
                    html += '<strong style="font-size: 14px; color: #34c759;">💰 Financial Performance</strong><br/>';
                    
                    if (metrics.roi !== undefined) {
                        const roiColor = metrics.roi > 0 ? '#34c759' : '#ff3b30';
                        html += `<span style="font-size: 13px;">📈 <strong>ROI:</strong> <span style="color: ${roiColor}; font-weight: bold;">${this._formatPercentage(metrics.roi)}</span></span><br/>`;
                    }
                    if (metrics.revenue !== undefined) {
                        html += `<span style="font-size: 13px;">💵 <strong>Revenue:</strong> ${this._formatCurrency(metrics.revenue)}</span><br/>`;
                    }
                    if (metrics.costPerConversion !== undefined) {
                        html += `<span style="font-size: 13px;">💸 <strong>Cost per Conversion:</strong> ${this._formatCurrency(metrics.costPerConversion)}</span><br/>`;
                    }
                    html += '</div>';
                }
                
                // Engagement Metrics
                if (metrics.ctr !== undefined || metrics.conversionRate !== undefined || metrics.engagementRate !== undefined) {
                    html += '<div style="margin-bottom: 20px;">';
                    html += '<strong style="font-size: 14px; color: #5ac8fa;">🎯 Engagement Metrics</strong><br/>';
                    
                    if (metrics.ctr !== undefined) {
                        html += `<span style="font-size: 13px;">📊 <strong>CTR:</strong> ${this._formatPercentage(metrics.ctr)}</span><br/>`;
                    }
                    if (metrics.conversionRate !== undefined) {
                        html += `<span style="font-size: 13px;">🎯 <strong>Conversion Rate:</strong> ${this._formatPercentage(metrics.conversionRate)}</span><br/>`;
                    }
                    if (metrics.engagementRate !== undefined) {
                        html += `<span style="font-size: 13px;">💬 <strong>Engagement Rate:</strong> ${this._formatPercentage(metrics.engagementRate)}</span><br/>`;
                    }
                    if (metrics.avgEngagementTime !== undefined) {
                        const seconds = Math.round(metrics.avgEngagementTime);
                        const minutes = Math.floor(seconds / 60);
                        const remainingSeconds = seconds % 60;
                        const timeStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
                        html += `<span style="font-size: 13px;">⏱️ <strong>Avg. Engagement Time:</strong> ${timeStr}</span><br/>`;
                    }
                    html += '</div>';
                }
                
                // Social Metrics
                if (metrics.likes !== undefined || metrics.shares !== undefined || metrics.comments !== undefined) {
                    html += '<div style="margin-bottom: 20px;">';
                    html += '<strong style="font-size: 14px; color: #ff9500;">❤️ Social Engagement</strong><br/>';
                    
                    if (metrics.likes !== undefined) {
                        html += `<span style="font-size: 13px;">❤️ <strong>Likes:</strong> ${this._formatNumber(metrics.likes)}</span><br/>`;
                    }
                    if (metrics.shares !== undefined) {
                        html += `<span style="font-size: 13px;">🔄 <strong>Shares:</strong> ${this._formatNumber(metrics.shares)}</span><br/>`;
                    }
                    if (metrics.comments !== undefined) {
                        html += `<span style="font-size: 13px;">💭 <strong>Comments:</strong> ${this._formatNumber(metrics.comments)}</span><br/>`;
                    }
                    html += '</div>';
                }
                
                html += '</div>';
                return html;
                
            } catch (e) {
                return "Error parsing performance metrics. Please generate a new performance report.";
            }
        },

        _formatNumber: function (num) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return new Intl.NumberFormat('en-MY').format(Math.round(num));
        },

        _formatCurrency: function (num) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return "RM " + new Intl.NumberFormat('en-MY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(num);
        },

        _formatPercentage: function (num) {
            if (num === undefined || num === null || isNaN(num)) return "N/A";
            return num.toFixed(2) + "%";
        }
    };
});

