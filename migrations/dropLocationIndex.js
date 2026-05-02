/**
 * Migration Script: Drop 2dsphere Index on Location Field
 * 
 * Purpose: Remove the old geospatial index on the 'location' field in the 'jobs' collection
 * Reason: The location field is now a String, not a GeoJSON object, causing "Can't extract geo keys" error
 * 
 * Run this script once to fix the database:
 * node labourlinkaws/migrations/dropLocationIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function dropLocationIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get the jobs collection
    const db = mongoose.connection.db;
    const collection = db.collection('jobs');

    // List all indexes
    console.log('\n📋 Current indexes on jobs collection:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Check if location_2dsphere index exists
    const has2dsphere = indexes.some(idx => 
      idx.name === 'location_2dsphere' || 
      (idx.key && idx.key.location === '2dsphere')
    );

    if (has2dsphere) {
      console.log('\n🔧 Dropping location_2dsphere index...');
      try {
        await collection.dropIndex('location_2dsphere');
        console.log('✅ Successfully dropped location_2dsphere index');
      } catch (err) {
        if (err.code === 27) {
          console.log('ℹ️  Index already dropped or does not exist');
        } else {
          throw err;
        }
      }
    } else {
      console.log('\nℹ️  No 2dsphere index found on location field');
    }

    // List indexes after dropping
    console.log('\n📋 Indexes after migration:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
dropLocationIndex();
