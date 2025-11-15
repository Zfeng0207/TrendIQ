const cds = require('@sap/cds');
const path = require('path');

cds.on('bootstrap', (app) => {
  // Serve static files from app directory for launchpad.html
  app.use(require('express').static(path.join(__dirname, '../app')));
});
