#!/usr/bin/env python3
"""
Fix all test files to use dynamic leaveTypeId instead of hardcoded 1
"""

import re
import glob

# Pattern per trovare test functions che usano leaveTypeId: 1
test_files = glob.glob("/home/ubuntu/dashboard-ferie-team/server/*.test.ts")

for filepath in test_files:
    if "edgecases" in filepath:
        # Skip edgecases, già fixato
        continue
        
    with open(filepath, "r") as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Test functions che NON hanno già getLeaveTypes
    # Trova it("...", async () => { ... leaveTypeId: 1 ... })
    
    # Sostituisci pattern per test che creano richieste con leaveTypeId: 1
    # Ma solo se NON hanno già getLeaveTypes
    
    if "getLeaveTypes" not in content and "leaveTypeId: 1" in content:
        # Aggiungi helper all'inizio del file dopo gli import
        if "// Helper to get valid leave type ID" not in content:
            # Trova la posizione dopo gli import
            import_end = content.rfind("import ")
            if import_end != -1:
                # Trova la fine della riga import
                next_newline = content.find("\n", import_end)
                if next_newline != -1:
                    # Inserisci helper function
                    helper = """

// Helper to get valid leave type ID for tests
async function getValidLeaveTypeId(caller: any): Promise<number> {
  const leaveTypes = await caller.leaves.getTypes();
  if (leaveTypes.length === 0) {
    throw new Error("No leave types available for testing");
  }
  return leaveTypes[0]!.id;
}
"""
                    content = content[:next_newline+1] + helper + content[next_newline+1:]
        
        # Ora sostituisci leaveTypeId: 1 con await getValidLeaveTypeId(caller)
        # Ma solo dentro createRequest calls
        
        # Pattern: leaveTypeId: 1, dentro createRequest
        pattern = r'(\.createRequest\(\{[^}]*?)leaveTypeId:\s*1,'
        
        def replace_func(match):
            return match.group(1) + 'leaveTypeId: await getValidLeaveTypeId(caller),'
        
        content = re.sub(pattern, replace_func, content, flags=re.DOTALL)
    
    if content != original_content:
        with open(filepath, "w") as f:
            f.write(content)
        print(f"✅ Fixed {filepath}")
    else:
        print(f"⏭️  Skipped {filepath} (no changes needed)")

print("\n✅ All test files processed!")
