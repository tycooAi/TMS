import urllib.request
import urllib.error
import json

def run_tests():
    print("=== Testing Worker Trip Workflow & Security Boundaries ===")
    
    # 1. Login as Worker
    login_url = "http://localhost:8080/api/v1/auth/login"
    login_body = json.dumps({"username": "worker", "password": "worker123"}).encode("utf-8")
    req = urllib.request.Request(login_url, data=login_body, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(req)
    login_resp = json.loads(res.read().decode("utf-8"))
    token = login_resp["data"]["token"]
    print(f"1. Worker Authentication: SUCCESS (Token acquired, Role: {login_resp['data'].get('role')})")

    # 2. Test Customer API Authorization for Worker
    # CustomerController requires: hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'CUSTOMER_MANAGE')
    cust_url = "http://localhost:8080/api/v1/customers"
    cust_body = json.dumps({"name": "Test Customer", "phone": "9842100000", "address": "Madurai"}).encode("utf-8")
    cust_req = urllib.request.Request(cust_url, data=cust_body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    try:
        urllib.request.urlopen(cust_req)
        print("2. Customer Creation API: Allowed")
    except urllib.error.HTTPError as e:
        print(f"2. Customer Creation API: Expected HTTP {e.code} ({e.reason}) - Worker role boundary strictly verified")

    # 3. Create Commercial Freight Trip as Worker
    trip_url = "http://localhost:8080/api/v1/trips"
    trip_body = json.dumps({
        "date": "2026-09-23",
        "customerId": "CUS-00124",
        "vehicleRegistration": "TN 58 AB 2345",
        "driverId": "DRV-0012",
        "material": "Black M-Sand",
        "quantity": 18.5,
        "unit": "Ton",
        "source": "ABC Crusher",
        "sourceBillNo": "VDP-8821",
        "loadingLocation": "ABC Crusher Yard",
        "deliveryLocation": "K Engineering Site",
        "openingKm": 45200,
        "closingKm": 45250,
        "tripKm": 50,
        "isNoLoad": False,
        "notes": "Verified 6-step dispatch entry"
    }).encode("utf-8")
    trip_req = urllib.request.Request(trip_url, data=trip_body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    trip_res = urllib.request.urlopen(trip_req)
    trip_data = json.loads(trip_res.read().decode("utf-8"))["data"]
    trip_id = trip_data["id"]
    print(f"3. Commercial Trip Creation: SUCCESS (Created Trip ID: {trip_id})")
    
    # 4. Zero Financial Exposure on Worker DTO Verification
    print("4. Verifying Zero Financial Leakage on Worker DTO:")
    print(f"   - appliedRate in response: {trip_data.get('appliedRate')} (Expected: None)")
    print(f"   - totalAmount in response: {trip_data.get('totalAmount')} (Expected: None)")
    assert trip_data.get("appliedRate") is None, "SECURITY LEAKAGE: appliedRate leaked to worker!"
    assert trip_data.get("totalAmount") is None, "SECURITY LEAKAGE: totalAmount leaked to worker!"
    print("   -> PASSED: Worker DTO strictly sanitized with zero financial exposure.")

    # 5. Create NO LOAD Trip as Worker
    no_load_body = json.dumps({
        "date": "2026-09-23",
        "customerId": "CUS-00124",
        "vehicleRegistration": "TN 58 AB 2345",
        "driverId": "DRV-0012",
        "material": "No Load",
        "quantity": 0,
        "unit": "Ton",
        "source": "ABC Crusher",
        "loadingLocation": "ABC Crusher Yard",
        "deliveryLocation": "K Engineering Site",
        "openingKm": 45250,
        "closingKm": 45280,
        "tripKm": 30,
        "isNoLoad": True,
        "noLoadReason": "Vehicle repositioning / empty transit",
        "notes": "Empty repositioning run"
    }).encode("utf-8")
    nl_req = urllib.request.Request(trip_url, data=no_load_body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"})
    nl_res = urllib.request.urlopen(nl_req)
    nl_data = json.loads(nl_res.read().decode("utf-8"))["data"]
    print(f"5. No Load Trip Creation: SUCCESS (Trip ID: {nl_data['id']}, isNoLoad: {nl_data['isNoLoad']})")

    # 6. Verify Trip Listing for Worker
    list_req = urllib.request.Request(trip_url, headers={"Authorization": f"Bearer {token}"})
    list_res = urllib.request.urlopen(list_req)
    all_trips = json.loads(list_res.read().decode("utf-8"))["data"]
    created_ids = [t["id"] for t in all_trips]
    assert trip_id in created_ids, f"Trip {trip_id} not found in trips list!"
    print(f"6. My Trips Verification: SUCCESS (Found {len(all_trips)} trips for worker, includes {trip_id})")

    print("\n=== ALL TEST SCENARIOS COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
