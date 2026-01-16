/**
 * Migration: Add Document Verification Indexes
 * 
 * This migration adds database indexes for efficient document verification queries.
 * Run this after deploying the new document verification models.
 */

const mongoose = require('mongoose');

async function up() {
  try {
    const db = mongoose.connection.db;
    
    console.log('Adding document verification indexes...');
    
    // Add indexes to users collection
    await db.collection('users').createIndex(
      { documentVerificationStatus: 1 },
      { name: 'idx_user_doc_verification_status' }
    );
    
    await db.collection('users').createIndex(
      { userRole: 1, documentVerificationStatus: 1 },
      { name: 'idx_user_role_doc_status' }
    );
    
    // Add indexes to employers collection
    await db.collection('employers').createIndex(
      { documentVerificationStatus: 1 },
      { name: 'idx_employer_doc_verification_status' }
    );
    
    await db.collection('employers').createIndex(
      { employerType: 1, documentVerificationStatus: 1 },
      { name: 'idx_employer_type_doc_status' }
    );
    
    // Document collection indexes are created automatically by the schema
    console.log('Document verification indexes added successfully');
    
  } catch (error) {
    console.error('Error adding document verification indexes:', error);
    throw error;
  }
}

async function down() {
  try {
    const db = mongoose.connection.db;
    
    console.log('Removing document verification indexes...');
    
    // Remove indexes from users collection
    await db.collection('users').dropIndex('idx_user_doc_verification_status');
    await db.collection('users').dropIndex('idx_user_role_doc_status');
    
    // Remove indexes from employers collection
    await db.collection('employers').dropIndex('idx_employer_doc_verification_status');
    await db.collection('employers').dropIndex('idx_employer_type_doc_status');
    
    console.log('Document verification indexes removed successfully');
    
  } catch (error) {
    console.error('Error removing document verification indexes:', error);
    throw error;
  }
}

module.exports = { up, down };