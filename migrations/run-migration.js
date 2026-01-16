/**
 * Simple migration runner for document verification
 * 
 * Usage: node migrations/run-migration.js up|down
 */

const mongoose = require('mongoose');
require('dotenv').config();

const migration = require('./001_add_document_verification_indexes');

async function runMigration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    const direction = process.argv[2];
    
    if (direction === 'up') {
      await migration.up();
      console.log('Migration completed successfully');
    } else if (direction === 'down') {
      await migration.down();
      console.log('Migration rollback completed successfully');
    } else {
      console.log('Usage: node run-migration.js up|down');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runMigration();