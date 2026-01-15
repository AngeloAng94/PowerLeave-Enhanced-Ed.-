#!/usr/bin/env python3
"""
Script per pulire i dati demo e creare richieste realistiche.
Eseguire con: python3 scripts/reset_demo_data.py
"""

import mysql.connector
import os
import random
from datetime import datetime, timedelta

# Database connection from environment
DATABASE_URL = os.environ.get("DATABASE_URL", "")

def parse_database_url(url):
    """Parse DATABASE_URL into connection parameters"""
    # Format: mysql://user:pass@host:port/database
    url = url.replace("mysql://", "")
    if "@" in url:
        auth, rest = url.split("@")
        user, password = auth.split(":")
        host_port, database = rest.split("/")
        if ":" in host_port:
            host, port = host_port.split(":")
        else:
            host = host_port
            port = 3306
    else:
        raise ValueError("Invalid DATABASE_URL format")
    
    return {
        "host": host,
        "port": int(port),
        "user": user,
        "password": password,
        "database": database.split("?")[0]
    }

def main():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return
    
    config = parse_database_url(DATABASE_URL)
    config["ssl_disabled"] = False
    
    print("Connecting to database...")
    conn = mysql.connector.connect(**config)
    cursor = conn.cursor(buffered=True)
    
    try:
        # Step 1: Get existing users and leave types
        print("\n1. Getting existing users...")
        cursor.execute("SELECT id, name FROM users WHERE name IS NOT NULL LIMIT 15")
        users = cursor.fetchall()
        print(f"   Found {len(users)} users")
        
        cursor.execute("SELECT id, name FROM leave_types")
        leave_types = cursor.fetchall()
        print(f"   Found {len(leave_types)} leave types")
        
        if not users or not leave_types:
            print("ERROR: No users or leave types found")
            return
        
        # Step 2: Delete all existing leave requests
        print("\n2. Deleting existing leave requests...")
        cursor.execute("DELETE FROM leave_requests")
        deleted = cursor.rowcount
        print(f"   Deleted {deleted} requests")
        
        # Step 3: Reset leave balances
        print("\n3. Resetting leave balances...")
        cursor.execute("DELETE FROM leave_balances")
        
        # Create fresh balances for each user (26 days per year)
        for user_id, user_name in users:
            cursor.execute("""
                INSERT INTO leave_balances (userId, leaveTypeId, year, totalDays, usedDays, availableDays)
                VALUES (%s, %s, 2025, 26, 0, 26)
            """, (user_id, leave_types[0][0]))
        print(f"   Created {len(users)} leave balances")
        
        # Step 4: Create realistic demo requests
        print("\n4. Creating realistic demo requests...")
        
        # Select 4 users for demo requests
        demo_users = random.sample(users, min(4, len(users)))
        
        # Define realistic scenarios
        scenarios = [
            # User 1: Approved vacation in August
            {"user_idx": 0, "start": "2025-08-11", "end": "2025-08-22", "hours": 8, "status": "approved", "notes": "Ferie estive"},
            # User 1: Pending request for Christmas
            {"user_idx": 0, "start": "2025-12-23", "end": "2025-12-31", "hours": 8, "status": "pending", "notes": "Ferie natalizie"},
            # User 2: Approved half-day permission
            {"user_idx": 1, "start": "2025-11-15", "end": "2025-11-15", "hours": 4, "status": "approved", "notes": "Permesso visita medica"},
            # User 2: Rejected request (overlapping with team event)
            {"user_idx": 1, "start": "2025-12-15", "end": "2025-12-16", "hours": 8, "status": "rejected", "notes": "Ferie ponte"},
            # User 2: Pending 2-hour permission
            {"user_idx": 1, "start": "2025-12-10", "end": "2025-12-10", "hours": 2, "status": "pending", "notes": "Permesso breve"},
            # User 3: Approved week off
            {"user_idx": 2, "start": "2025-10-06", "end": "2025-10-10", "hours": 8, "status": "approved", "notes": "Settimana di riposo"},
            # User 3: Pending single day
            {"user_idx": 2, "start": "2025-11-28", "end": "2025-11-28", "hours": 8, "status": "pending", "notes": "Giorno personale"},
            # User 4: Approved 2 days
            {"user_idx": 3, "start": "2025-09-22", "end": "2025-09-23", "hours": 8, "status": "approved", "notes": "Ponte autunnale"},
            # User 4: Pending half day
            {"user_idx": 3, "start": "2025-12-05", "end": "2025-12-05", "hours": 4, "status": "pending", "notes": "Permesso pomeriggio"},
            # User 4: Approved single day
            {"user_idx": 3, "start": "2025-11-01", "end": "2025-11-01", "hours": 8, "status": "approved", "notes": "Ponte Ognissanti"},
        ]
        
        requests_created = 0
        for scenario in scenarios:
            if scenario["user_idx"] >= len(demo_users):
                continue
                
            user_id = demo_users[scenario["user_idx"]][0]
            user_name = demo_users[scenario["user_idx"]][1]
            
            # Calculate days
            start = datetime.strptime(scenario["start"], "%Y-%m-%d")
            end = datetime.strptime(scenario["end"], "%Y-%m-%d")
            days = (end - start).days + 1
            
            cursor.execute("""
                INSERT INTO leave_requests 
                (userId, leaveTypeId, startDate, endDate, days, hours, status, notes, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """, (
                user_id,
                leave_types[0][0],  # First leave type
                scenario["start"],
                scenario["end"],
                days,
                scenario["hours"],
                scenario["status"],
                scenario["notes"]
            ))
            
            # Update balance if approved
            if scenario["status"] == "approved":
                days_used = days * (scenario["hours"] / 8)
                cursor.execute("""
                    UPDATE leave_balances 
                    SET usedDays = usedDays + %s, availableDays = availableDays - %s
                    WHERE userId = %s AND year = 2025
                """, (days_used, days_used, user_id))
            
            requests_created += 1
            print(f"   Created: {user_name} - {scenario['start']} to {scenario['end']} ({scenario['status']})")
        
        conn.commit()
        
        # Step 5: Summary
        print("\n5. Summary:")
        cursor.execute("SELECT COUNT(*) FROM leave_requests")
        total_requests = cursor.fetchone()[0]
        
        cursor.execute("SELECT status, COUNT(*) FROM leave_requests GROUP BY status")
        status_counts = cursor.fetchall()
        
        print(f"   Total requests: {total_requests}")
        for status, count in status_counts:
            print(f"   - {status}: {count}")
        
        print("\n✅ Demo data reset complete!")
        
    except Exception as e:
        print(f"ERROR: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
