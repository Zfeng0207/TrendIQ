/**
 * Beauty Leads CRM - Main Service Definitions
 *
 * This file aggregates all service modules for the Beauty Leads CRM system.
 * Each service is defined in its own file under srv/services/
 */

// Import all service modules
using from './services/lead-service';
using from './services/account-service';
using from './services/opportunity-service';
using from './services/activity-service';
using from './services/product-service';
using from './services/workflow-service';
using from './services/prospect-service';
using from './services/marketing-service';

// Import all UI annotations
using from './services/lead-service-annotations';
using from './services/account-service-annotations';
using from './services/opportunity-service-annotations';
using from './services/activity-service-annotations';
using from './services/product-service-annotations';
using from './services/workflow-service-annotations';
using from './services/prospect-service-annotations';
using from './services/marketing-service-annotations';
