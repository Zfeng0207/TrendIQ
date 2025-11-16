// Simple Navigation Script
(function() {
    'use strict';
    
    // Navigation configuration
    var navConfig = {
        currentApp: '', // Will be set per app
        apps: [
            {
                id: 'merchants',
                title: 'Merchant Onboarding',
                url: '/beautyleads.merchants/index.html',
                icon: 'business-objects-experience'
            },
            {
                id: 'campaigns',
                title: 'Marketing Campaigns',
                url: '/beautyleads.campaigns/index.html',
                icon: 'marketing-campaign'
            },
            {
                id: 'leads',
                title: 'Leads',
                url: '/beautyleads.leads/index.html',
                icon: 'lead'
            },
            {
                id: 'accounts',
                title: 'Accounts',
                url: '/beautyleads.accounts/index.html',
                icon: 'customer-financial-fact-sheet'
            },
            {
                id: 'opportunities',
                title: 'Opportunities',
                url: '/beautyleads.opportunities/index.html',
                icon: 'sales-quote'
            }
        ]
    };
    
    // Determine current app from URL
    function getCurrentApp() {
        var path = window.location.pathname;
        if (path.includes('merchants')) return 'merchants';
        if (path.includes('campaigns')) return 'campaigns';
        if (path.includes('leads')) return 'leads';
        if (path.includes('accounts')) return 'accounts';
        if (path.includes('opportunities')) return 'opportunities';
        return '';
    }
    
    // Create navigation HTML
    function createNavigation() {
        var currentApp = getCurrentApp();
        var currentAppTitle = navConfig.apps.find(function(app) {
            return app.id === currentApp;
        });
        currentAppTitle = currentAppTitle ? currentAppTitle.title : 'Beauty CRM';
        
        var navHTML = '<div class="beauty-nav-bar">' +
            '<div class="beauty-nav-title">Beauty CRM</div>' +
            '<div class="beauty-nav-dropdown">' +
            '<button class="beauty-nav-button" id="navMenuButton">' +
            '<span>' + currentAppTitle + '</span>' +
            '<span style="font-size: 10px;">▼</span>' +
            '</button>' +
            '<div class="beauty-nav-menu" id="navMenu">';
        
        navConfig.apps.forEach(function(app) {
            var isActive = app.id === currentApp ? 'active' : '';
            navHTML += '<a href="' + app.url + '" class="beauty-nav-item ' + isActive + '">' +
                '<span class="beauty-nav-icon">📋</span>' +
                app.title +
                '</a>';
        });
        
        navHTML += '</div></div></div>';
        
        return navHTML;
    }
    
    // Initialize navigation
    function initNavigation() {
        // Inject CSS
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/beautyleads.shared/navigation.css';
        document.head.appendChild(link);
        
        // Inject navigation HTML
        var nav = document.createElement('div');
        nav.innerHTML = createNavigation();
        document.body.insertBefore(nav.firstChild, document.body.firstChild);
        
        // Add click handler for dropdown
        var menuButton = document.getElementById('navMenuButton');
        var menu = document.getElementById('navMenu');
        
        if (menuButton && menu) {
            menuButton.addEventListener('click', function(e) {
                e.stopPropagation();
                menu.classList.toggle('show');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (!menu.contains(e.target) && !menuButton.contains(e.target)) {
                    menu.classList.remove('show');
                }
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
})();

