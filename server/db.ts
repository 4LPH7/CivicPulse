import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

// Ensure database file exists and is properly initialized
const sqlite = new Database('civicpulse.db');

// Enable foreign keys for SQLite
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Initialize database with sample data if empty
export async function initializeDatabase() {
  try {
    // Check if users table has any data
    const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      console.log('Initializing database with sample data...');
      
      // Create sample user
      const insertUser = sqlite.prepare(`
        INSERT INTO users (name, email, aadhaar_number, phone_number, address, ward_number, district, state, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const now = Date.now();
      insertUser.run(
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
      );
      
      // Create sample issues
      const insertIssue = sqlite.prepare(`
        INSERT INTO issues (title, description, category, severity, status, location, ward_number, district, state, vis_score, vote_count, support_percentage, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
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
      
      issues.forEach(issue => {
        insertIssue.run(
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
        );
      });
      
      console.log('Sample data initialized successfully!');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}