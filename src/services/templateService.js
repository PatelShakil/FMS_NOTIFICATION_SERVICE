/**
 * Template Service
 * Renders Handlebars email templates
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('../utils/logger');
const { EMAIL_TEMPLATES } = require('../utils/constants');

// Template cache (in-memory)
const templateCache = new Map();

/**
 * Load template from file
 * @param {String} templateName - Template file name (without .hbs extension)
 * @returns {Promise<String>} - Template content
 */
const loadTemplate = async (templateName) => {
  // Check cache first
  if (templateCache.has(templateName)) {
    logger.debug(`Template loaded from cache: ${templateName}`);
    return templateCache.get(templateName);
  }

  try {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');

    // Cache the template
    templateCache.set(templateName, templateContent);

    logger.debug(`Template loaded from file: ${templateName}`);
    return templateContent;
  } catch (error) {
    logger.error(`Failed to load template ${templateName}:`, error.message);
    throw new Error(`Template not found: ${templateName}`);
  }
};

/**
 * Render template with data
 * @param {String} templateName - Template name
 * @param {Object} data - Template data
 * @returns {Promise<String>} - Rendered HTML
 */
const renderTemplate = async (templateName, data) => {
  try {
    // Load template
    const templateContent = await loadTemplate(templateName);

    // Compile template
    const template = Handlebars.compile(templateContent);

    // Add helper data (common across all templates)
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
      platformName: 'BoloIndia',
      platformUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      supportEmail: process.env.EMAIL_FROM_ADDRESS || 'support@boloindia.in',
    };

    // Render template
    const renderedHtml = template(templateData);

    logger.debug(`Template rendered successfully: ${templateName}`);
    return renderedHtml;
  } catch (error) {
    logger.error(`Failed to render template ${templateName}:`, error.message);
    throw error;
  }
};

/**
 * Get template name from event type
 * @param {String} eventType - Kafka event type
 * @returns {String} - Template name
 */
const getTemplateNameFromEvent = (eventType) => {
  const templateName = EMAIL_TEMPLATES[eventType];
  
  if (!templateName) {
    logger.warn(`No template mapping for event: ${eventType}, using default`);
    return 'default_template';
  }

  return templateName;
};

/**
 * Clear template cache (useful for hot-reloading in development)
 */
const clearTemplateCache = () => {
  templateCache.clear();
  logger.info('Template cache cleared');
};

/**
 * Preload all templates (warm up cache)
 */
const preloadTemplates = async () => {
  const templateNames = Object.values(EMAIL_TEMPLATES);
  
  logger.info(`Preloading ${templateNames.length} templates...`);

  for (const templateName of templateNames) {
    try {
      await loadTemplate(templateName);
    } catch (error) {
      logger.warn(`Failed to preload template ${templateName}:`, error.message);
    }
  }

  logger.info(`✅ Templates preloaded: ${templateCache.size} cached`);
};

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('formatDateTime', (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

Handlebars.registerHelper('uppercase', (str) => {
  return str ? str.toUpperCase() : '';
});

Handlebars.registerHelper('truncate', (str, length) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
});

logger.info('✅ Template service initialized with Handlebars helpers');

module.exports = {
  loadTemplate,
  renderTemplate,
  getTemplateNameFromEvent,
  clearTemplateCache,
  preloadTemplates,
};
