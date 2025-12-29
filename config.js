/**
 * Configuration file for FUEGO-APP
 * 
 * This file demonstrates the proper way to handle environment variables
 * and API keys in your application.
 */

// Example: Loading environment variables
// In a Node.js app, you would use dotenv:
require('dotenv').config();

// Example: Accessing the Supabase configuration from environment variables
const config = {
  supabase: {
    // NEVER hardcode API keys or URLs like this:
    // url: 'https://your-project.supabase.co'
    // publishableKey: 'sb_your_actual_key_here'
    
    // ALWAYS use environment variables:
    url: process.env.SUPABASE_URL || '',
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  },
};

// Validate that required environment variables are set
if (!config.supabase.url || !config.supabase.publishableKey) {
  const errorMessage = 'Error: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in environment variables.\n' +
                       'Please copy .env.example to .env and add your Supabase configuration';
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMessage);
  } else {
    console.error(errorMessage);
  }
}

module.exports = config;
