// List all databases and collections
require('dotenv').config();
const mongoose = require('mongoose');

async function listEverything() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;
    console.log('\n✅ Connected to database:', db.databaseName);
    
    // List ALL databases
    const admin = db.admin();
    const { databases } = await admin.listDatabases();
    console.log('\n📚 ALL DATABASES on this cluster:');
    databases.forEach(database => {
      console.log(`  - ${database.name} (${(database.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List collections in current database
    console.log(`\n📁 COLLECTIONS in "${db.databaseName}" database:`);
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('  ⚠️  NO COLLECTIONS FOUND!');
    } else {
      for (const col of collections) {
        const collectionObj = db.collection(col.name);
        const count = await collectionObj.countDocuments();
        console.log(`  - ${col.name} (${count} documents)`);
      }
    }
    
    // Now check each collection for users with @gmail.com
    console.log('\n🔍 Searching for Gmail users in all collections:');
    for (const col of collections) {
      const collectionObj = db.collection(col.name);
      const gmailUsers = await collectionObj.find({ email: /@gmail\.com/i }).toArray();
      if (gmailUsers.length > 0) {
        console.log(`\n  ✅ Found ${gmailUsers.length} Gmail user(s) in "${col.name}":`);
        gmailUsers.forEach(user => {
          console.log(`    - ${user.email} (ID: ${user._id})`);
        });
      }
    }
    
    mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listEverything();
