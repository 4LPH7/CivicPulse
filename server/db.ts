import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from "@shared/schema";

// Create an in-memory SQLite database using libsql
const client = createClient({
  url: ':memory:'
});

export const db = drizzle(client, { schema });

// Initialize database with sample data if empty
export async function initializeDatabase() {
  try {
    // Create tables first
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        aadhaar_number TEXT UNIQUE,
        phone_number TEXT,
        address TEXT,
        ward_number TEXT,
        district TEXT,
        state TEXT,
        is_verified INTEGER DEFAULT 0,
        profile_image_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'under_review',
        location TEXT NOT NULL,
        ward_number TEXT NOT NULL,
        district TEXT NOT NULL,
        state TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        media_urls TEXT DEFAULT '[]',
        vis_score REAL DEFAULT 0,
        vote_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        support_percentage REAL DEFAULT 0,
        is_anonymous INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        assigned_to INTEGER REFERENCES users(id),
        resolved_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_anonymous INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS status_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_id INTEGER REFERENCES issues(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL,
        message TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        activity_data TEXT,
        created_at INTEGER NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        badge_type TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        description TEXT,
        earned_at INTEGER NOT NULL
      )
    `);

    // Check if users table has any data
    const userCount = await client.execute('SELECT COUNT(*) as count FROM users');
    
    if (userCount.rows[0].count === 0) {
      console.log('Initializing database with sample data...');
      
      const now = Date.now();
      
      // Create sample user
      await client.execute({
        sql: `INSERT INTO users (name, email, aadhaar_number, phone_number, address, ward_number, district, state, is_verified, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'Rajesh Kumar',
          'demo@civicpulse.com',
          '1234-5678-9012',
          '+91-9876543210',
          'Koramangala, Bangalore',
          'Ward 184',
          'Bangalore Urban',
          'Karnataka',
          1,
          now,
          now
        ]
      });
      
      // Create sample issues
      const issues = [
        {
          title: 'Large pothole on 100 Feet Road causing traffic issues',
          description: 'There is a massive pothole near the Koramangala 100 Feet Road that has been causing severe traffic congestion and vehicle damage. Multiple vehicles have suffered tire damage due to this pothole. The issue has been persisting for over 2 weeks now.',
          category: 'roads',
          severity: 'high',
          status: 'under_review',
          location: '100 Feet Road, Koramangala',
          wardNumber: 'Ward 184',
          district: 'Bangalore Urban',
          state: 'Karnataka',
          visScore: 85.5,
          voteCount: 23,
          supportPercentage: 12.5
        },
        {
          title: 'Water leakage in residential area causing wastage',
          description: 'Continuous water leakage from the main pipeline in Koramangala 5th Block. This has been going on for 3 days now, causing significant water wastage and making the road slippery and dangerous for pedestrians.',
          category: 'water',
          severity: 'medium',
          status: 'in_progress',
          location: 'Koramangala 5th Block',
          wardNumber: 'Ward 184',
          district: 'Bangalore Urban',
          state: 'Karnataka',
          visScore: 72.3,
          voteCount: 18,
          supportPercentage: 8.2
        },
        {
          title: 'Irregular garbage collection in residential area',
          description: 'Garbage collection has been very irregular in our area for the past month. Sometimes garbage is not collected for 3-4 days, leading to unhygienic conditions and bad smell. This is affecting the health of residents, especially children and elderly.',
          category: 'waste',
          severity: 'medium',
          status: 'under_review',
          location: 'Koramangala 6th Block',
          wardNumber: 'Ward 184',
          district: 'Bangalore Urban',
          state: 'Karnataka',
          visScore: 68.7,
          voteCount: 15,
          supportPercentage: 6.8
        }
      ];
      
      for (const issue of issues) {
        await client.execute({
          sql: `INSERT INTO issues (title, description, category, severity, status, location, ward_number, district, state, vis_score, vote_count, support_percentage, created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            issue.title,
            issue.description,
            issue.category,
            issue.severity,
            issue.status,
            issue.location,
            issue.wardNumber,
            issue.district,
            issue.state,
            issue.visScore,
            issue.voteCount,
            issue.supportPercentage,
            1, // created by user ID 1
            now,
            now
          ]
        });
      }
      
      console.log('Sample data initialized successfully!');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}