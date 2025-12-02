sap.ui.define([], function () {
    "use strict";

    /**
     * Campaign Dashboard Formatter
     * Professional enterprise-grade formatters for marketing campaign KPIs
     */

    // Helper functions
    function parseMetrics(sMetrics) {
        if (!sMetrics) return {};
        try {
            return JSON.parse(sMetrics);
        } catch (e) {
            return {};
        }
    }

    function formatNumber(num, decimals = 0) {
        if (num === undefined || num === null || isNaN(num)) return "—";
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M";
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K";
        }
        return new Intl.NumberFormat('en-MY', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    }

    function formatCurrency(num, showSymbol = true) {
        if (num === undefined || num === null || isNaN(num)) return "—";
        const prefix = showSymbol ? "RM " : "";
        if (num >= 1000000) {
            return prefix + (num / 1000000).toFixed(2) + "M";
        } else if (num >= 1000) {
            return prefix + (num / 1000).toFixed(1) + "K";
        }
        return prefix + new Intl.NumberFormat('en-MY', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    }

    function formatPercent(num, decimals = 1) {
        if (num === undefined || num === null || isNaN(num)) return "—";
        return num.toFixed(decimals) + "%";
    }

    return {
        // =====================================================
        // KPI CARD FORMATTERS
        // =====================================================

        formatImpressions: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.reach || metrics.impressions || 0);
        },

        formatImpressionsSubtitle: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.impressions && metrics.reach) {
                const freq = (metrics.impressions / metrics.reach).toFixed(1);
                return freq + " avg. frequency";
            }
            return "Total reach";
        },

        formatClicks: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.clicks || 0);
        },

        formatCPC: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.clicks && metrics.cost) {
                const cpc = metrics.cost / metrics.clicks;
                return "/ RM" + cpc.toFixed(2) + " each";
            }
            return "";
        },

        formatCTR: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.ctr !== undefined) {
                return formatPercent(metrics.ctr) + " CTR";
            }
            if (metrics.impressions && metrics.clicks) {
                const ctr = (metrics.clicks / metrics.impressions) * 100;
                return formatPercent(ctr) + " CTR";
            }
            return "Click-through rate";
        },

        formatConversions: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.conversions || 0);
        },

        formatCostPerConversion: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.conversions && metrics.cost) {
                const cpc = metrics.cost / metrics.conversions;
                return "/ RM" + formatNumber(cpc, 0) + " each";
            }
            if (metrics.costPerConversion) {
                return "/ RM" + formatNumber(metrics.costPerConversion, 0) + " each";
            }
            return "";
        },

        formatConversionRate: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.conversionRate !== undefined) {
                return formatPercent(metrics.conversionRate) + " conversion rate";
            }
            if (metrics.clicks && metrics.conversions) {
                const rate = (metrics.conversions / metrics.clicks) * 100;
                return formatPercent(rate) + " conversion rate";
            }
            return "Conversion rate";
        },

        formatEngagementRate: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.engagementRate !== undefined) {
                return formatPercent(metrics.engagementRate);
            }
            return "—";
        },

        formatReach: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.reach) {
                return formatNumber(metrics.reach) + " reach";
            }
            return "Total engagement";
        },

        formatBudgetSpent: function (budget) {
            if (!budget) return "—";
            return formatCurrency(budget);
        },

        formatBudgetUtilization: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.budgetUtilization) {
                return formatPercent(metrics.budgetUtilization) + " utilized";
            }
            return "Budget utilization";
        },

        formatROI: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.roi !== undefined) {
                const sign = metrics.roi >= 0 ? "+" : "";
                return sign + formatPercent(metrics.roi, 1);
            }
            return "—";
        },

        // =====================================================
        // CHART GENERATORS
        // =====================================================

        generateTrendChart: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            
            // Chart dimensions
            const width = 800;
            const height = 280;
            const padding = { top: 30, right: 30, bottom: 50, left: 60 };
            const chartWidth = width - padding.left - padding.right;
            const chartHeight = height - padding.top - padding.bottom;

            // Generate mock trend data based on metrics
            const impressions = metrics.impressions || metrics.reach || 50000;
            const clicks = metrics.clicks || 500;
            const conversions = metrics.conversions || 50;

            // Create 7 data points for weekly trend
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const impressionData = [];
            const clickData = [];
            const conversionData = [];
            
            for (let i = 0; i < 7; i++) {
                const variance = 0.7 + Math.random() * 0.6;
                impressionData.push(Math.round((impressions / 7) * variance));
                clickData.push(Math.round((clicks / 7) * variance));
                conversionData.push(Math.round((conversions / 7) * variance));
            }

            // Find max values for scaling
            const maxImpressions = Math.max(...impressionData) * 1.2;
            const maxClicks = Math.max(...clickData) * 1.2;

            // Scale functions
            const scaleX = (i) => padding.left + (i / 6) * chartWidth;
            const scaleYImpressions = (val) => padding.top + chartHeight - (val / maxImpressions) * chartHeight;
            const scaleYClicks = (val) => padding.top + chartHeight - (val / maxClicks) * chartHeight;

            // Generate path strings
            const impressionPath = impressionData.map((val, i) => 
                `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYImpressions(val)}`
            ).join(' ');

            const clickPath = clickData.map((val, i) => 
                `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleYClicks(val)}`
            ).join(' ');

            // Generate area fill for impressions
            const impressionArea = impressionPath + 
                ` L ${scaleX(6)} ${padding.top + chartHeight}` +
                ` L ${scaleX(0)} ${padding.top + chartHeight} Z`;

            // Y-axis labels for impressions
            const yLabels = [0, 0.25, 0.5, 0.75, 1].map(ratio => {
                const val = Math.round(maxImpressions * ratio);
                return {
                    y: padding.top + chartHeight - ratio * chartHeight,
                    label: formatNumber(val)
                };
            });

            let svg = `
            <svg viewBox="0 0 ${width} ${height}" class="campaignTrendChart" style="width: 100%; height: 280px;">
                <defs>
                    <linearGradient id="impressionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#1976D2;stop-opacity:0.3"/>
                        <stop offset="100%" style="stop-color:#1976D2;stop-opacity:0.05"/>
                    </linearGradient>
                    <linearGradient id="clickGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#43A047;stop-opacity:0.2"/>
                        <stop offset="100%" style="stop-color:#43A047;stop-opacity:0"/>
                    </linearGradient>
                </defs>
                
                <!-- Grid lines -->
                <g class="gridLines">
                    ${yLabels.map(l => `
                        <line x1="${padding.left}" y1="${l.y}" x2="${width - padding.right}" y2="${l.y}" 
                              stroke="#E0E0E0" stroke-width="1" stroke-dasharray="4,4"/>
                    `).join('')}
                </g>
                
                <!-- Y-axis labels -->
                <g class="yAxisLabels" font-size="11" fill="#757575" font-family="Arial, sans-serif">
                    ${yLabels.map(l => `
                        <text x="${padding.left - 10}" y="${l.y + 4}" text-anchor="end">${l.label}</text>
                    `).join('')}
                </g>
                
                <!-- X-axis labels -->
                <g class="xAxisLabels" font-size="11" fill="#757575" font-family="Arial, sans-serif">
                    ${days.map((day, i) => `
                        <text x="${scaleX(i)}" y="${height - 15}" text-anchor="middle">${day}</text>
                    `).join('')}
                </g>
                
                <!-- Area fills -->
                <path d="${impressionArea}" fill="url(#impressionGradient)" />
                
                <!-- Lines -->
                <path d="${impressionPath}" fill="none" stroke="#1976D2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="${clickPath}" fill="none" stroke="#43A047" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                
                <!-- Data points - Impressions -->
                ${impressionData.map((val, i) => `
                    <circle cx="${scaleX(i)}" cy="${scaleYImpressions(val)}" r="5" fill="#1976D2" stroke="#fff" stroke-width="2"/>
                `).join('')}
                
                <!-- Data points - Clicks -->
                ${clickData.map((val, i) => `
                    <circle cx="${scaleX(i)}" cy="${scaleYClicks(val)}" r="4" fill="#43A047" stroke="#fff" stroke-width="2"/>
                `).join('')}
                
            </svg>`;

            return svg;
        },

        generateFunnelChart: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            
            // Funnel stages with values
            const reach = metrics.reach || metrics.impressions || 50000;
            const clicks = metrics.clicks || Math.round(reach * 0.01);
            const contacts = metrics.contacts || Math.round(clicks * 0.02);
            const opportunities = metrics.opportunities || Math.round(contacts * 0.5);
            const customers = metrics.customers || Math.round(opportunities * 0.5);

            const stages = [
                { label: 'Impressions', value: reach, color: '#1976D2' },
                { label: 'Clicks', value: clicks, color: '#00897B' },
                { label: 'Contacts', value: contacts, color: '#FB8C00' },
                { label: 'Opportunities', value: opportunities, color: '#E65100' },
                { label: 'Customers', value: customers, color: '#2E7D32' }
            ];

            const height = 300;
            const width = 280;
            const stageHeight = 50;
            const gap = 4;
            const maxWidth = 240;
            const minWidth = 100;
            const startX = (width - maxWidth) / 2;

            let svg = `
            <svg viewBox="0 0 ${width} ${height}" class="campaignFunnelChart" style="width: 100%; height: ${height}px;">
                <defs>
                    ${stages.map((stage, i) => `
                        <linearGradient id="funnelGrad${i}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:${stage.color};stop-opacity:0.9"/>
                            <stop offset="100%" style="stop-color:${stage.color};stop-opacity:0.7"/>
                        </linearGradient>
                    `).join('')}
                </defs>`;

            stages.forEach((stage, i) => {
                const progress = i / (stages.length - 1);
                const currentWidth = maxWidth - (maxWidth - minWidth) * progress;
                const nextWidth = i < stages.length - 1 
                    ? maxWidth - (maxWidth - minWidth) * ((i + 1) / (stages.length - 1))
                    : currentWidth;
                
                const y = i * (stageHeight + gap) + 10;
                const x = (width - currentWidth) / 2;
                const nextX = (width - nextWidth) / 2;

                // Trapezoid path
                const path = `
                    M ${x} ${y}
                    L ${x + currentWidth} ${y}
                    L ${nextX + nextWidth} ${y + stageHeight}
                    L ${nextX} ${y + stageHeight}
                    Z
                `;

                svg += `
                <g class="funnelStage">
                    <path d="${path}" fill="url(#funnelGrad${i})" />
                    <text x="${width / 2}" y="${y + stageHeight / 2 - 6}" 
                          text-anchor="middle" fill="white" font-size="12" font-weight="600" font-family="Arial, sans-serif">
                        ${stage.label}
                    </text>
                    <text x="${width / 2}" y="${y + stageHeight / 2 + 10}" 
                          text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="14" font-weight="700" font-family="Arial, sans-serif">
                        ${formatNumber(stage.value)}
                    </text>
                </g>`;
            });

            svg += '</svg>';
            return svg;
        },

        // =====================================================
        // METRICS TABLE FORMATTERS
        // =====================================================

        formatReachValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.reach || 0);
        },

        formatImpressionsValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.impressions || 0);
        },

        formatUniqueVisitors: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            const reach = metrics.reach || 0;
            return formatNumber(Math.round(reach * 0.8)); // Estimate unique visitors
        },

        formatClicksValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.clicks || 0);
        },

        formatCTRValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.ctr !== undefined) {
                return formatPercent(metrics.ctr);
            }
            if (metrics.impressions && metrics.clicks) {
                const ctr = (metrics.clicks / metrics.impressions) * 100;
                return formatPercent(ctr);
            }
            return "—";
        },

        formatSessionDuration: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.avgEngagementTime) {
                const mins = Math.floor(metrics.avgEngagementTime / 60);
                const secs = Math.round(metrics.avgEngagementTime % 60);
                return `${mins}m ${secs}s`;
            }
            return "2m 34s"; // Default mock value
        },

        formatConversionsValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            return formatNumber(metrics.conversions || 0);
        },

        formatConversionRateValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.conversionRate !== undefined) {
                return formatPercent(metrics.conversionRate);
            }
            if (metrics.clicks && metrics.conversions) {
                const rate = (metrics.conversions / metrics.clicks) * 100;
                return formatPercent(rate);
            }
            return "—";
        },

        formatCPCValue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.costPerConversion) {
                return formatCurrency(metrics.costPerConversion);
            }
            if (metrics.conversions && metrics.cost) {
                return formatCurrency(metrics.cost / metrics.conversions);
            }
            return "—";
        },

        formatRevenue: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.revenue) {
                return formatCurrency(metrics.revenue);
            }
            return "—";
        },

        formatBudgetValue: function (budget) {
            if (!budget) return "—";
            return formatCurrency(budget);
        },

        formatROAS: function (sMetrics) {
            const metrics = parseMetrics(sMetrics);
            if (metrics.roas !== undefined) {
                return metrics.roas.toFixed(2) + "x";
            }
            if (metrics.revenue && metrics.cost) {
                return (metrics.revenue / metrics.cost).toFixed(2) + "x";
            }
            if (metrics.roi !== undefined) {
                return ((100 + metrics.roi) / 100).toFixed(2) + "x";
            }
            return "—";
        }
    };
});
