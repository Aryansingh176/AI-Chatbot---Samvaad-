// Quick script to check MongoDB for users
require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n✅ Connected successfully!');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in this database:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Check users collection
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const userCount = await User.countDocuments();
    console.log('\n👥 Total users in "users" collection:', userCount);
    
    if (userCount > 0) {
      console.log('\n📋 All users:');
      const users = await User.find({}).select('email name googleId createdAt').lean();
      users.forEach((user, index) => {
        console.log(`\n  User ${index + 1}:`);
        console.log('    📧 Email:', user.email);
        console.log('    👤 Name:', user.name);
        console.log('    🆔 Google ID:', user.googleId || 'N/A');
        console.log('    📅 Created:', user.createdAt);
        console.log('    🔑 MongoDB _id:', user._id);
      });
    }
    
    // Check for gmail users specifically
    const gmailUsers = await User.find({ email: /@gmail\.com$/ }).lean();
    console.log('\n📬 Gmail users found:', gmailUsers.length);
    
    mongoose.connection.close();
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
