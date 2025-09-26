const mongoose = require('mongoose');
const PaymentTransaction = require('../Model/Payment/PaymentTransaction');

// Import old model for migration
const OldPhonePayTransaction = require('../Model/PhonepeModel');

/**
 * Migration script to migrate old payment data to new enhanced structure
 */
class PaymentDataMigration {
  
  /**
   * Migrate old payment transactions to new structure
   */
  static async migrateTransactions() {
    try {
      console.log('Starting payment data migration...');
      
      // Get all old transactions
      const oldTransactions = await OldPhonePayTransaction.find({});
      console.log(`Found ${oldTransactions.length} old transactions to migrate`);
      
      let migratedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const oldTx of oldTransactions) {
        try {
          // Check if already migrated
          const existingTx = await PaymentTransaction.findById(oldTx._id);
          if (existingTx) {
            console.log(`Transaction ${oldTx._id} already migrated, skipping...`);
            skippedCount++;
            continue;
          }
          
          // Map old fields to new structure
          const newTransactionData = {
            _id: oldTx._id, // Preserve original ID
            userId: oldTx.userId,
            username: oldTx.username,
            mobile: oldTx.Mobile ? oldTx.Mobile.toString() : '',
            orderId: oldTx.orderId || `MIGRATED_${oldTx._id}`,
            merchantTransactionId: oldTx._id.toString(),
            amount: oldTx.amount || 0,
            currency: 'INR',
            paymentMethod: 'PhonePe',
            
            // Map old status to new status
            status: this.mapOldStatus(oldTx.status),
            transactionStatus: oldTx.transactionStatus || 'PENDING',
            
            // URLs
            successUrl: oldTx.successUrl,
            failedUrl: oldTx.failedUrl,
            
            // Legacy config
            config: oldTx.config,
            
            // Parse config for subscription data if available
            subscriptionConfig: this.parseSubscriptionConfig(oldTx.config),
            
            // Gateway information
            gatewayTransactionId: oldTx.transactionid,
            
            // Timestamps
            initiatedAt: oldTx.createdAt || new Date(),
            createdAt: oldTx.createdAt,
            updatedAt: oldTx.updatedAt,
            
            // Additional metadata
            metadata: {
              migratedFrom: 'phonepaytransaction',
              migrationDate: new Date(),
              originalStatus: oldTx.status
            }
          };
          
          // Set completion timestamp if completed
          if (newTransactionData.status === 'COMPLETED') {
            newTransactionData.completedAt = oldTx.updatedAt || oldTx.createdAt;
          } else if (newTransactionData.status === 'FAILED') {
            newTransactionData.failedAt = oldTx.updatedAt || oldTx.createdAt;
          }
          
          // Create new transaction
          const newTransaction = new PaymentTransaction(newTransactionData);
          await newTransaction.save({ validateBeforeSave: false }); // Skip validation for migration
          
          migratedCount++;
          console.log(`Migrated transaction ${oldTx._id} successfully`);
          
        } catch (error) {
          console.error(`Error migrating transaction ${oldTx._id}:`, error);
          errorCount++;
        }
      }
      
      console.log('Migration completed!');
      console.log(`Migrated: ${migratedCount}`);
      console.log(`Skipped: ${skippedCount}`);
      console.log(`Errors: ${errorCount}`);
      
      return {
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errorCount,
        total: oldTransactions.length
      };
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Map old status to new status format
   */
  static mapOldStatus(oldStatus) {
    const statusMap = {
      'InProgress': 'PENDING',
      'Completed': 'COMPLETED',
      'SUCCESS': 'COMPLETED',
      'Failed': 'FAILED',
      'FAILED': 'FAILED',
      'Cancelled': 'CANCELLED',
      'CANCELLED': 'CANCELLED',
      'CR': 'COMPLETED',
      'DR': 'FAILED'
    };
    
    return statusMap[oldStatus] || 'PENDING';
  }
  
  /**
   * Parse old config string to extract subscription information
   */
  static parseSubscriptionConfig(configString) {
    if (!configString) return undefined;
    
    try {
      const config = JSON.parse(configString);
      
      // Check if it's a subscription-related config
      if (config.url && config.url.includes('activateSubscription')) {
        return {
          activationUrl: config.url,
          activationMethod: config.method || 'POST',
          activationData: config.data,
          subscriptionId: config.data?.subscriptionId,
          planName: config.data?.planName
        };
      }
    } catch (error) {
      console.warn('Failed to parse config:', error);
    }
    
    return undefined;
  }
  
  /**
   * Create backup of old data before migration
   */
  static async createBackup() {
    try {
      console.log('Creating backup of old payment data...');
      
      const oldTransactions = await OldPhonePayTransaction.find({}).lean();
      
      // Save backup to file
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const backupFile = path.join(backupDir, `payment_backup_${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(oldTransactions, null, 2));
      
      console.log(`Backup created: ${backupFile}`);
      console.log(`Backed up ${oldTransactions.length} transactions`);
      
      return backupFile;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }
  
  /**
   * Validate migrated data
   */
  static async validateMigration() {
    try {
      console.log('Validating migration...');
      
      const oldCount = await OldPhonePayTransaction.countDocuments();
      const newCount = await PaymentTransaction.countDocuments({
        'metadata.migratedFrom': 'phonepaytransaction'
      });
      
      console.log(`Old transactions: ${oldCount}`);
      console.log(`Migrated transactions: ${newCount}`);
      
      // Check for data integrity
      const sampleOld = await OldPhonePayTransaction.findOne().lean();
      const sampleNew = await PaymentTransaction.findById(sampleOld._id).lean();
      
      if (sampleNew) {
        console.log('Sample validation passed');
        console.log('Old:', { id: sampleOld._id, amount: sampleOld.amount, status: sampleOld.status });
        console.log('New:', { id: sampleNew._id, amount: sampleNew.amount, status: sampleNew.status });
      }
      
      return {
        oldCount,
        newCount,
        isValid: newCount > 0
      };
      
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    }
  }
  
  /**
   * Run complete migration process
   */
  static async runMigration() {
    try {
      console.log('=== Payment Data Migration Started ===');
      
      // Step 1: Create backup
      const backupFile = await this.createBackup();
      
      // Step 2: Run migration
      const migrationResult = await this.migrateTransactions();
      
      // Step 3: Validate migration
      const validationResult = await this.validateMigration();
      
      console.log('=== Migration Summary ===');
      console.log('Backup file:', backupFile);
      console.log('Migration result:', migrationResult);
      console.log('Validation result:', validationResult);
      console.log('=== Migration Completed ===');
      
      return {
        backup: backupFile,
        migration: migrationResult,
        validation: validationResult
      };
      
    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }
}

// Export for use in other scripts
module.exports = PaymentDataMigration;

// Run migration if called directly
if (require.main === module) {
  const { connectDB } = require('../Config/database');
  
  connectDB().then(() => {
    PaymentDataMigration.runMigration()
      .then((result) => {
        console.log('Migration completed successfully:', result);
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }).catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });
}
