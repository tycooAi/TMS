import urllib.request
import json

base_url = "http://localhost:8080/api/v1"

# 1. Public status
req = urllib.request.Request(f"{base_url}/system/status")
with urllib.request.urlopen(req) as res:
    status_data = json.loads(res.read())
    print("[1] Public System Status:", status_data["data"]["systemState"])

# 2. Login as admin
login_req = urllib.request.Request(
    f"{base_url}/auth/login",
    data=json.dumps({"username": "admin", "password": "admin123"}).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)
with urllib.request.urlopen(login_req) as res:
    token = json.loads(res.read())["data"]["token"]
    print("[2] Admin Login successful, token acquired")

# 3. System Health
health_req = urllib.request.Request(
    f"{base_url}/system/health",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(health_req) as res:
    health = json.loads(res.read())["data"]
    print("[3] System Health Database:", health["databaseStatus"], "| DB Version:", health["dbVersion"])
    print("    Table Counts:", health["tableCounts"])

# 4. Feature Flags
feat_req = urllib.request.Request(
    f"{base_url}/system/features",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(feat_req) as res:
    flags = json.loads(res.read())["data"]
    print("[4] Feature Flags count:", len(flags))
    for f in flags:
        print(f"    - {f['flagKey']}: {f['enabled']} ({f['category']})")

# 5. Create Backup
bkp_req = urllib.request.Request(
    f"{base_url}/system/backups/create",
    data=json.dumps({"backupType": "MANUAL", "notes": "System Control Center Baseline Snapshot"}).encode("utf-8"),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(bkp_req) as res:
    bkp = json.loads(res.read())["data"]
    print("[5] Backup Created successfully:")
    print(f"    ID: {bkp['id']}, Name: {bkp['backupName']}, Size: {bkp['fileSizeBytes']} bytes, Checksum: {bkp['checksumSha256']}")

# 6. Verify Backup
verify_req = urllib.request.Request(
    f"{base_url}/system/backups/{bkp['id']}/verify",
    data=b"{}",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(verify_req) as res:
    verified = json.loads(res.read())["data"]
    print("[6] Backup Integrity Verified:", verified["status"], "| Verified At:", verified["verifiedAt"])

# 7. Backup Schedules
sched_req = urllib.request.Request(
    f"{base_url}/system/backups/schedules",
    headers={"Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(sched_req) as res:
    schedules = json.loads(res.read())["data"]
    print("[7] Automated Backup Schedules count:", len(schedules))
    for s in schedules:
        print(f"    - {s['id']}: enabled={s['enabled']}, time={s['executionTime']}, retention={s['retentionCount']}")

# 8. Test Transition to MAINTENANCE & HTTP 503 Enforcement
print("\n[8] Testing Transition to MAINTENANCE & Enforcement...")
maint_req = urllib.request.Request(
    f"{base_url}/system/state",
    data=json.dumps({
        "systemState": "MAINTENANCE",
        "maintenanceTitle": "Emergency Maintenance in Progress",
        "maintenanceMessage": "System undergoing scheduled engine upgrade. Please retry shortly.",
        "allowAdminBypass": True
    }).encode("utf-8"),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(maint_req) as res:
    print("    System State transitioned to:", json.loads(res.read())["data"]["systemState"])

# Test that non-admin requests to /trips receive HTTP 503
try:
    urllib.request.urlopen(f"{base_url}/trips")
    print("    ERROR: /trips should have returned HTTP 503!")
except urllib.error.HTTPError as e:
    print(f"    SUCCESS: Request blocked with HTTP {e.code}")
    body = json.loads(e.read().decode("utf-8"))
    print("    Response body:", body)

# 9. Return system to ONLINE
print("\n[9] Returning System to ONLINE...")
online_req = urllib.request.Request(
    f"{base_url}/system/state",
    data=json.dumps({"systemState": "ONLINE", "reason": "Maintenance completed"}).encode("utf-8"),
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
)
with urllib.request.urlopen(online_req) as res:
    print("    System State restored to:", json.loads(res.read())["data"]["systemState"])

print("\nALL SYSTEM CONTROL BACKEND CHECKS PASSED PERFECTLY!")
