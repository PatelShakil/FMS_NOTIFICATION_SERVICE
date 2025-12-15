 
/**
 * Email Configuration - Gmail SMTP
 * Uses Nodemailer with Gmail App Password
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter
let transporter = null;

const createTransporter = () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password
      },
      pool: true, // Use connection pool
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000, // 1 second
      rateLimit: 5, // Max 5 emails per second
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('✅ Email transporter is ready to send emails');
        logger.info(`Email Provider: ${process.env.EMAIL_PROVIDER || 'GMAIL_SMTP'}`);
        logger.info(`Email User: ${process.env.EMAIL_USER}`);
      }
    });

    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter:', error);
    throw error;
  }
};

// Get or create transporter (singleton pattern)
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Email configuration
const emailConfig = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'BoloIndia',
    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER,
  },
  replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
  
  // Email sending options
  options: {
    priority: 'normal', // high, normal, low
    encoding: 'utf-8',
  },
};

// Send email function (wrapper)
const sendEmail = async (mailOptions) => {
  try {
    const transporter = getTransporter();
    
    // Add default from address
    if (!mailOptions.from) {
      mailOptions.from = `"${emailConfig.from.name}" <${emailConfig.from.address}>`;
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true, message: 'Email connection verified' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = {
  createTransporter,
  getTransporter,
  sendEmail,
  emailConfig,
  testEmailConnection,
};
