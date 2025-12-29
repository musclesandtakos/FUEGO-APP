/**
 * Configuration file for FUEGO-APP
 * 
 * This file demonstrates the proper way to handle environment variables
 * and API keys in your application.
 */

// Example: Loading environment variables
// In a Node.js app, you would use dotenv:
// require('dotenv').config();

// Example: Accessing the Supabase publishable key from environment variables
const config = {
  supabase: {
    // NEVER hardcode API keys like this:
    // publishableKey: 'sb_publishable_uHfx45L8q6zISjGuKWrwVg_lK_adeod'
    
    // ALWAYS use environment variables:
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  },
};

// Validate that required environment variables are set
if (!config.supabase.publishableKey) {
  console.error('Error: SUPABASE_PUBLISHABLE_KEY is not set in environment variables');
  console.error('Please copy .env.example to .env and add your Supabase key');
}

module.exports = config;
