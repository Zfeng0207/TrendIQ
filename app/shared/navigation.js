// Simple Navigation Script
(function() {
    'use strict';
    
    // Navigation configuration - using launchpad URLs
    var navConfig = {
        currentApp: '', // Will be set per app
        apps: [
            {
                id: 'leads',
                title: 'Leads',
                url: '/launchpad.html#leads-manage',
                icon: 'lead'
            },
            {
                id: 'prospects',
                title: 'Prospects',
                url: '/launchpad.html#prospects-manage',
                icon: 'person-placeholder'
            },
            {
                id: 'accounts',
                title: 'Accounts',
                url: '/launchpad.html#accounts-manage',
                icon: 'customer-financial-fact-sheet'
            },
            {
                id: 'opportunities',
                title: 'Opportunities',
                url: '/launchpad.html#opportunities-manage',
                icon: 'sales-quote'
            },
            {
                id: 'campaigns',
                title: 'Marketing Campaigns',
                url: '/launchpad.html#campaigns-manage',
                icon: 'marketing-campaign'
            }
        ]
    };
    
    // Determine current app from URL
    function getCurrentApp() {
        var path = window.location.pathname;
        if (path.includes('leads')) return 'leads';
        if (path.includes('prospects')) return 'prospects';
        if (path.includes('accounts')) return 'accounts';
        if (path.includes('opportunities')) return 'opportunities';
        if (path.includes('campaigns')) return 'campaigns';
        return '';
    }
    
    // Create navigation HTML
    function createNavigation() {
        var currentApp = getCurrentApp();
        var currentAppTitle = navConfig.apps.find(function(app) {
            return app.id === currentApp;
        });
        currentAppTitle = currentAppTitle ? currentAppTitle.title : 'Smart Commerce CRM';
        
        var navHTML = '<div class="beauty-nav-bar">' +
            '<div class="beauty-nav-title">Smart Commerce CRM</div>' +
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

