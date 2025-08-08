#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Cleans up test sessions and inactive data from development database
 */

const { Client } = require('pg')

// Database configuration
const DB_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://videosync_user:videosync_pass@localhost:5432/videosync',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
}

async function cleanDatabase() {
  console.log('🗑️  Database Cleanup Script')
  console.log('==========================')
  
  const client = new Client(DB_CONFIG)
  
  try {
    await client.connect()
    console.log('✅ Connected to database')
    
    // 1. Clean up session participants first (foreign key constraint)
    console.log('\n1️⃣ Cleaning session participants...')
    const participantsResult = await client.query('DELETE FROM session_participants')
    console.log(`   Removed ${participantsResult.rowCount} participant records`)
    
    // 2. Clean up sessions
    console.log('\n2️⃣ Cleaning sessions...')
    const sessionsResult = await client.query('DELETE FROM sessions')
    console.log(`   Removed ${sessionsResult.rowCount} session records`)
    
    // 3. Clean up guest users (keep real Google OAuth users)
    console.log('\n3️⃣ Cleaning guest users...')
    const usersResult = await client.query(`
      DELETE FROM users 
      WHERE email LIKE '%@guest.local' 
      OR google_id LIKE 'guest_%'
    `)
    console.log(`   Removed ${usersResult.rowCount} guest user records`)
    
    // 4. Show remaining data
    console.log('\n4️⃣ Remaining data summary:')
    const userCount = await client.query('SELECT COUNT(*) FROM users')
    const sessionCount = await client.query('SELECT COUNT(*) FROM sessions')
    const participantCount = await client.query('SELECT COUNT(*) FROM session_participants')
    
    console.log(`   Users: ${userCount.rows[0].count}`)
    console.log(`   Sessions: ${sessionCount.rows[0].count}`)
    console.log(`   Participants: ${participantCount.rows[0].count}`)
    
    console.log('\n🎉 Database cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('✅ Database connection closed')
  }
}

// Handle command line execution
if (require.main === module) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { cleanDatabase }