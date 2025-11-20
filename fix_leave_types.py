#!/usr/bin/env python3
"""Script per rimuovere duplicati dalla tabella leave_types"""

import mysql.connector
import os
import re

# Parse DATABASE_URL
url = os.getenv('DATABASE_URL')
match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^\?]+)', url)

conn = mysql.connector.connect(
    host=match.group(3),
    port=int(match.group(4)),
    user=match.group(1),
    password=match.group(2),
    database=match.group(5),
    ssl_ca='/etc/ssl/certs/ca-certificates.crt',
    ssl_verify_cert=True,
    ssl_verify_identity=True
)

cursor = conn.cursor(buffered=True)

print("📋 Tipi ferie PRIMA della pulizia:")
cursor.execute("SELECT id, name, description FROM leave_types ORDER BY id")
for row in cursor.fetchall():
    print(f"  ID {row[0]}: {row[1]} - {row[2]}")

# Salva ID usati nelle richieste
cursor.execute("SELECT DISTINCT leaveTypeId FROM leave_requests")
used_ids = [row[0] for row in cursor.fetchall()]
print(f"\n🔗 ID usati in leave_requests: {used_ids}")

# Trova ID dei 3 tipi base (prendi il più piccolo per ogni nome)
cursor.execute("""
    SELECT MIN(id) as id, name 
    FROM leave_types 
    WHERE name IN ('FERIE/ROL 8 H', 'PERMESSO 4 ORE', 'PERMESSO 2 ORE')
    GROUP BY name
    ORDER BY id
""")
base_types = cursor.fetchall()
keep_ids = [row[0] for row in base_types]
print(f"✅ ID da mantenere: {keep_ids}")

# Cancella duplicati
if keep_ids:
    placeholders = ','.join(['%s'] * len(keep_ids))
    cursor.execute(f"DELETE FROM leave_types WHERE id NOT IN ({placeholders})", keep_ids)
    conn.commit()
    print(f"🧹 Cancellati {cursor.rowcount} duplicati")

print("\n📋 Tipi ferie DOPO la pulizia:")
cursor.execute("SELECT id, name, description FROM leave_types ORDER BY id")
for row in cursor.fetchall():
    print(f"  ID {row[0]}: {row[1]} - {row[2]}")

cursor.close()
conn.close()
print("\n✅ Pulizia completata!")
