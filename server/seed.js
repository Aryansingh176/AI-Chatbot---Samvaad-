require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Chat = require('./models/Chat');

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectdb';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding');

    const email = 'student@college.edu';

    // remove existing demo user and conversation to idempotently seed
    await Chat.deleteMany({});
    await User.deleteOne({ email });

    const hashed = await bcrypt.hash('password123', 10);
    const user = new User({
      name: 'Demo Student',
      email,
      password: hashed
    });
    await user.save();

    const chat = new Chat({
      userId: user._id,
      language: 'en',
      messages: [
        { role: 'user', content: 'Hello, this is a demo conversation.', timestamp: new Date() },
        { role: 'assistant', content: 'Hi Demo Student! This response was seeded for your demo.', timestamp: new Date() }
      ]
    });
    await chat.save();

    console.log('Seeding complete');
    console.log('Demo credentials: email=student@college.edu password=password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
