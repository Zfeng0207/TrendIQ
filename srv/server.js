const cds = require('@sap/cds');
const path = require('path');
const express = require('express');

cds.on('bootstrap', (app) => {
  // Route namespaced app paths to their actual directories
  const appRoutes = {
    'beautyleads.merchants': 'merchants/webapp',
    'beautyleads.leads': 'leads/webapp',
    'beautyleads.accounts': 'accounts/webapp',
    'beautyleads.opportunities': 'opportunities/webapp',
    'beautyleads.campaigns': 'campaigns/webapp'
  };

  // Add routes for each namespaced app
  Object.entries(appRoutes).forEach(([namespace, appPath]) => {
    app.use(`/${namespace}`, express.static(path.join(__dirname, '../app', appPath)));
  });

  // Serve static files from app directory for launchpad.html and other root files
  app.use(express.static(path.join(__dirname, '../app')));
});
