#!/usr/bin/env python3
"""
Script per generare dati demo realistici per Power Leave
- 30 dipendenti reali dall'Excel
- Ferie randomiche da maggio 2025 a gennaio 2026
- Mix realistico: 70% ferie 8H, 20% permessi 4H, 10% permessi 2H
"""

import mysql.connector
from datetime import datetime, date, timedelta
import os
import random
from dotenv import load_dotenv

# Carica variabili ambiente
load_dotenv()

# Configurazione database
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'gateway01.us-west-2.prod.aws.tidbcloud.com'),
    'port': int(os.getenv('DB_PORT', 4000)),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'ssl_ca': '/etc/ssl/certs/ca-certificates.crt',
    'ssl_verify_cert': True,
    'ssl_verify_identity': True
}

# Parsing DATABASE_URL se disponibile
if os.getenv('DATABASE_URL'):
    import re
    url = os.getenv('DATABASE_URL')
    match = re.match(r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/([^\?]+)', url)
    if match:
        DB_CONFIG['user'] = match.group(1)
        DB_CONFIG['password'] = match.group(2)
        DB_CONFIG['host'] = match.group(3)
        DB_CONFIG['port'] = int(match.group(4))
        DB_CONFIG['database'] = match.group(5)

# Nomi reali dall'Excel
EMPLOYEE_NAMES = [
    "Lionte", "Ferracuti", "Scarpa", "Adlane", "Carapelle",
    "Garufo", "Parigi", "Puzzo", "Currò", "Carvalho",
    "Ganci", "Dipierro", "Oro", "Lazzarelli", "Anglani",
    "Bianchi", "Rossi", "Verdi", "Neri", "Gialli",
    "Blu", "Viola", "Arancioni", "Rosa", "Grigi",
    "Marroni", "Celesti", "Turchesi", "Fucsia", "Beige"
]

# Chiusure aziendali 2025-2026
COMPANY_CLOSURES = [
    ("2025-08-15", "Ferragosto"),
    ("2025-12-24", "Vigilia di Natale"),
    ("2025-12-25", "Natale"),
    ("2025-12-26", "Santo Stefano"),
    ("2025-12-31", "San Silvestro"),
    ("2026-01-01", "Capodanno"),
    ("2026-01-06", "Epifania"),
]

# Mappatura tipi assenza
LEAVE_TYPES = {
    'X': ('FERIE/ROL 8 H', 8, 0.70),      # 70% probabilità
    'P4': ('PERMESSO 4 ORE', 4, 0.20),    # 20% probabilità
    'P2': ('PERMESSO 2 ORE', 2, 0.10),    # 10% probabilità
}

def clean_db(conn):
    """Pulisce database prima della generazione"""
    cursor = conn.cursor()
    print("🧹 Pulizia database...")
    
    cursor.execute("DELETE FROM leave_requests")
    cursor.execute("DELETE FROM leave_balances")
    cursor.execute("DELETE FROM users WHERE role != 'admin'")
    cursor.execute("DELETE FROM company_closures")
    
    conn.commit()
    cursor.close()
    print("✓ Database pulito\n")

def create_employees(conn):
    """Crea utenti nel database"""
    print("👥 Creazione dipendenti...")
    cursor = conn.cursor(buffered=True)
    user_map = {}
    
    for name in EMPLOYEE_NAMES:
        open_id = f"demo-{name.lower()}"
        email = f"{name.lower()}@company.com"
        
        cursor.execute("""
            INSERT INTO users (openId, name, email, role, createdAt, updatedAt, lastSignedIn)
            VALUES (%s, %s, %s, 'user', NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        """, (open_id, name, email))
        
        cursor.execute("SELECT id FROM users WHERE openId = %s", (open_id,))
        user_id = cursor.fetchone()[0]
        user_map[name] = user_id
    
    conn.commit()
    cursor.close()
    print(f"✓ Creati {len(user_map)} dipendenti\n")
    return user_map

def create_leave_types(conn):
    """Crea tipi di assenza"""
    print("📋 Creazione tipi di assenza...")
    cursor = conn.cursor(buffered=True)
    leave_type_ids = {}
    
    for code, (name, hours, _) in LEAVE_TYPES.items():
        cursor.execute("""
            INSERT INTO leave_types (name, description, requires_approval, createdAt)
            VALUES (%s, %s, 1, NOW())
            ON DUPLICATE KEY UPDATE name = VALUES(name)
        """, (name, f"{code} - {hours} ore"))
        
        cursor.execute("SELECT id FROM leave_types WHERE name = %s", (name,))
        result = cursor.fetchone()
        if result:
            leave_type_ids[code] = result[0]
    
    conn.commit()
    cursor.close()
    print(f"✓ Creati {len(leave_type_ids)} tipi di assenza\n")
    return leave_type_ids

def generate_random_leaves(conn, user_map, leave_type_ids):
    """Genera ferie randomiche da maggio 2025 a gennaio 2026"""
    print("🏖️  Generazione ferie randomiche...")
    cursor = conn.cursor(buffered=True)
    
    start_date = date(2025, 5, 1)
    end_date = date(2026, 1, 31)
    
    requests_count = 0
    daily_count = {}  # Conta quante persone in ferie per giorno
    
    for name, user_id in user_map.items():
        # Ogni dipendente prende 8-15 giorni di ferie nel periodo
        num_leaves = random.randint(8, 15)
        
        for _ in range(num_leaves):
            # Scegli data random
            days_range = (end_date - start_date).days
            random_day = start_date + timedelta(days=random.randint(0, days_range))
            
            # Evita sovrapposizioni eccessive (max 6 persone stesso giorno)
            if daily_count.get(random_day, 0) >= 6:
                continue
            
            # Scegli tipo assenza con probabilità
            rand = random.random()
            if rand < 0.70:
                leave_code = 'X'  # 70% ferie
            elif rand < 0.90:
                leave_code = 'P4'  # 20% permessi 4H
            else:
                leave_code = 'P2'  # 10% permessi 2H
            
            leave_type_id = leave_type_ids[leave_code]
            _, hours, _ = LEAVE_TYPES[leave_code]
            
            # Inserisci richiesta (approvata)
            cursor.execute("""
                INSERT INTO leave_requests 
                (userId, leaveTypeId, startDate, endDate, days, hours, status, notes, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, 1, %s, 'approved', 'Dati demo generati', NOW(), NOW())
            """, (user_id, leave_type_id, str(random_day), str(random_day), hours))
            
            requests_count += 1
            daily_count[random_day] = daily_count.get(random_day, 0) + 1
    
    conn.commit()
    cursor.close()
    print(f"✓ Generate {requests_count} richieste di ferie\n")
    return requests_count

def create_company_closures(conn):
    """Crea chiusure aziendali"""
    print("🏢 Creazione chiusure aziendali...")
    cursor = conn.cursor(buffered=True)
    
    for closure_date, reason in COMPANY_CLOSURES:
        cursor.execute("""
            INSERT INTO company_closures (date, reason, type, createdAt)
            VALUES (%s, %s, 'holiday', NOW())
            ON DUPLICATE KEY UPDATE reason = VALUES(reason)
        """, (closure_date, reason))
    
    conn.commit()
    cursor.close()
    print(f"✓ Create {len(COMPANY_CLOSURES)} chiusure aziendali\n")

def calculate_balances(conn, user_map, leave_type_ids):
    """Calcola saldi ferie per ogni dipendente"""
    print("💰 Calcolo saldi ferie...")
    cursor = conn.cursor(buffered=True)
    
    ferie_type_id = leave_type_ids['X']
    
    for name, user_id in user_map.items():
        # Conta giorni utilizzati (solo ferie 8H)
        cursor.execute("""
            SELECT COALESCE(COUNT(*), 0)
            FROM leave_requests
            WHERE userId = %s AND status = 'approved' AND leaveTypeId = %s
        """, (user_id, ferie_type_id))
        used_days = int(cursor.fetchone()[0])
        
        # Saldo standard: 26 giorni
        total_days = 26
        
        cursor.execute("""
            INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, year, createdAt, updatedAt)
            VALUES (%s, %s, %s, %s, 2025, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                used_days = VALUES(used_days),
                updatedAt = NOW()
        """, (user_id, ferie_type_id, total_days, used_days))
    
    conn.commit()
    cursor.close()
    print(f"✓ Calcolati saldi per {len(user_map)} dipendenti\n")

def main():
    print("=" * 60)
    print("  GENERAZIONE DATI DEMO - POWER LEAVE")
    print("  Periodo: Maggio 2025 - Gennaio 2026")
    print("=" * 60)
    print()
    
    try:
        # Connessione database
        print("🔌 Connessione al database...")
        conn = mysql.connector.connect(**DB_CONFIG)
        print("✓ Connesso\n")
        
        # Pulizia
        clean_db(conn)
        
        # Creazione dati
        user_map = create_employees(conn)
        leave_type_ids = create_leave_types(conn)
        requests_count = generate_random_leaves(conn, user_map, leave_type_ids)
        create_company_closures(conn)
        calculate_balances(conn, user_map, leave_type_ids)
        
        # Chiusura
        conn.close()
        
        # Riepilogo
        print("=" * 60)
        print("🎉 GENERAZIONE COMPLETATA CON SUCCESSO!")
        print("=" * 60)
        print(f"   👥 Dipendenti:              {len(user_map)}")
        print(f"   🏖️  Richieste ferie:         {requests_count}")
        print(f"   🏢 Chiusure aziendali:      {len(COMPANY_CLOSURES)}")
        print(f"   📅 Periodo:                 Maggio 2025 - Gennaio 2026")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERRORE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
