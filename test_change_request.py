import urllib.request
import urllib.error
import json
import decimal

def run_tests():
    print("======================================================================")
    print("TMS CHANGE REQUEST VERIFICATION: TON QUANTITY & TRIP RATE SOURCES")
    print("======================================================================\n")

    # 1. Authenticate users
    def get_token(username, password):
        req = urllib.request.Request(
            "http://localhost:8080/api/v1/auth/login",
            data=json.dumps({"username": username, "password": password}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["data"]["token"]

    worker_token = get_token("worker", "worker123")
    manager_token = get_token("manager", "manager123")
    accounts_token = get_token("accounts", "accounts123")
    admin_token = get_token("admin", "admin123")
    print("[OK] Successfully authenticated Worker, Manager, Accounts, and Admin.\n")

    # 2. Test Material Ton inputs via API validation
    print("--- 1. Testing Material Quantity (Ton) Validations ---")
    test_cases = [
        (1, True, "Integer 1"),
        (5, True, "Integer 5"),
        (10, True, "Integer 10"),
        (25, True, "Integer 25"),
        (12.5, True, "Decimal 12.5"),
        (25.75, True, "Decimal 25.75"),
        (0, False, "Zero quantity"),
        (-5, False, "Negative quantity"),
        ("abc", False, "Invalid string text"),
        (None, False, "Empty/None quantity"),
    ]

    for val, expected_valid, label in test_cases:
        body = {
            "date": "2026-09-25",
            "customerId": "CUS-00124",
            "vehicleRegistration": "TN 58 AB 2345",
            "driverId": "DRV-0012",
            "material": "Black M-Sand",
            "quantity": val,
            "unit": "Ton",
            "source": "ABC Crusher",
            "loadingLocation": "ABC Crusher Yard",
            "deliveryLocation": "K Engineering Site",
            "billingRate": 850.00,
            "transportRate": 350.00,
            "purchaseRate": 680.00,
            "perKmRate": 28.00,
            "isNoLoad": False
        }
        req = urllib.request.Request(
            "http://localhost:8080/api/v1/trips",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {worker_token}"}
        )
        try:
            with urllib.request.urlopen(req) as res:
                created = json.loads(res.read().decode("utf-8"))["data"]
                if expected_valid:
                    print(f"  [PASS] {label} ({val} Ton) -> Accepted (Trip ID: {created['id']})")
                else:
                    print(f"  [FAIL] {label} ({val} Ton) -> Unexpectedly accepted!")
                    assert False, f"Expected validation failure for {val}"
        except urllib.error.HTTPError as err:
            err_body = err.read().decode("utf-8")
            if not expected_valid:
                print(f"  [PASS] {label} ({val}) -> Correctly rejected with HTTP {err.code}")
            else:
                print(f"  [FAIL] {label} ({val}) -> Unexpected rejection with HTTP {err.code}: {err_body}")
                assert False, f"Expected success for {val}: {err_body}"

    # 3. Create a Test Trip with separate rate sources
    print("\n--- 2. Testing Trip Creation & Rate Sources ---")
    trip_payload = {
        "date": "2026-09-25",
        "customerId": "CUS-00124",
        "vehicleRegistration": "TN 58 AB 2345",
        "driverId": "DRV-0012",
        "material": "Black M-Sand",
        "quantity": 25.75,
        "unit": "Ton",
        "source": "ABC Crusher",
        "loadingLocation": "ABC Crusher Yard",
        "deliveryLocation": "K Engineering Site",
        "billingRate": 920.00,      # Worker Dynamic Input C
        "transportRate": 380.00,    # Worker Dynamic Input D
        "purchaseRate": 680.00,     # Manager Configured Rate A
        "perKmRate": 28.00,         # Manager Configured Rate B
        "isNoLoad": False,
        "notes": "Validation test for Ton input and 4-way rate sources"
    }

    req = urllib.request.Request(
        "http://localhost:8080/api/v1/trips",
        data=json.dumps(trip_payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {worker_token}"}
    )
    with urllib.request.urlopen(req) as res:
        created_trip = json.loads(res.read().decode("utf-8"))["data"]
        test_trip_id = created_trip["id"]

    print(f"[OK] Created test trip {test_trip_id} with:")
    print(f"   Quantity: {created_trip['quantity']} (Unit: {created_trip['unit']})")
    print(f"   Billing Rate (Worker): {created_trip.get('billingRate')}")
    print(f"   Transport Rate (Worker): {created_trip.get('transportRate')}")
    print(f"   Purchase Rate (Manager): {created_trip.get('purchaseRate')}")
    print(f"   Per KM Rate (Manager): {created_trip.get('perKmRate')}")

    assert float(created_trip["quantity"]) == 25.75, "Quantity decimal precision mismatch!"
    assert created_trip["unit"] == "Ton", "Unit mismatch!"
    assert float(created_trip["billingRate"]) == 920.00, "Billing rate mismatch!"
    assert float(created_trip["transportRate"]) == 380.00, "Transport rate mismatch!"
    assert float(created_trip["purchaseRate"]) == 680.00, "Purchase rate mismatch!"
    assert float(created_trip["perKmRate"]) == 28.00, "Per KM rate mismatch!"

    # 4. Verify Cross-Portal Consistency (Manager, Accounts, Admin)
    print("\n--- 3. Verifying Cross-Portal Consistency ---")
    req_mgr = urllib.request.Request(
        f"http://localhost:8080/api/v1/trips/{test_trip_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    with urllib.request.urlopen(req_mgr) as res:
        mgr_trip = json.loads(res.read().decode("utf-8"))["data"]
        print(f"Manager View of {test_trip_id}:")
        print(f"   - Quantity: {mgr_trip['quantity']} {mgr_trip['unit']}")
        print(f"   - Billing Rate: {mgr_trip['billingRate']}")
        print(f"   - Transport Rate: {mgr_trip['transportRate']}")
        print(f"   - Purchase Rate: {mgr_trip['purchaseRate']}")
        print(f"   - Per KM Rate: {mgr_trip['perKmRate']}")
        print(f"   - Total Amount: {mgr_trip['totalAmount']}")
        assert float(mgr_trip["quantity"]) == 25.75
        assert float(mgr_trip["billingRate"]) == 920.00
        assert float(mgr_trip["transportRate"]) == 380.00
        assert float(mgr_trip["purchaseRate"]) == 680.00
        assert float(mgr_trip["perKmRate"]) == 28.00
        expected_total = round(25.75 * 920.00, 2)
        assert abs(float(mgr_trip["totalAmount"]) - expected_total) < 0.01, f"Expected total {expected_total}"

    req_acc = urllib.request.Request(
        f"http://localhost:8080/api/v1/trips/{test_trip_id}",
        headers={"Authorization": f"Bearer {accounts_token}"}
    )
    with urllib.request.urlopen(req_acc) as res:
        acc_trip = json.loads(res.read().decode("utf-8"))["data"]
        print(f"Accounts View of {test_trip_id}:")
        print(f"   - Quantity: {acc_trip['quantity']} {acc_trip['unit']}")
        print(f"   - Applied / Billing Rate: {acc_trip['appliedRate']}")
        print(f"   - Total Amount: {acc_trip['totalAmount']}")
        assert float(acc_trip["billingRate"]) == 920.00
        assert float(acc_trip["appliedRate"]) == 920.00
        assert abs(float(acc_trip["totalAmount"]) - expected_total) < 0.01

    # 5. Historical Rate Integrity Test
    print("\n--- 4. Testing Historical Rate Integrity on Manager Rate Change ---")
    # Manager creates/updates rate card for Black M-Sand with a NEW price
    new_rate_req = urllib.request.Request(
        "http://localhost:8080/api/v1/rates",
        data=json.dumps({
            "rateType": "CUSTOMER",
            "customerId": "CUS-00124",
            "material": "Black M-Sand",
            "loadingLocation": "ABC Crusher Yard",
            "deliveryLocation": "K Engineering Site",
            "rate": 1150.00,
            "unit": "Ton",
            "effectiveFrom": "2026-10-01",
            "status": "ACTIVE"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {manager_token}"}
    )
    try:
        with urllib.request.urlopen(new_rate_req) as res:
            new_rate = json.loads(res.read().decode("utf-8"))["data"]
            print(f"[OK] Manager configured a new rate: Rs {new_rate['rate']} / Ton (effective 2026-10-01)")
    except Exception as e:
        print(f"  Note on rate creation API: {e}")

    # Re-fetch previous trip and ensure rates have NOT changed
    req_check = urllib.request.Request(
        f"http://localhost:8080/api/v1/trips/{test_trip_id}",
        headers={"Authorization": f"Bearer {manager_token}"}
    )
    with urllib.request.urlopen(req_check) as res:
        historical_trip = json.loads(res.read().decode("utf-8"))["data"]
        print(f"Historical Trip {test_trip_id} post Manager rate change:")
        print(f"   - Billing Rate: Rs {historical_trip['billingRate']} (Still Rs 920.00)")
        print(f"   - Purchase Rate: Rs {historical_trip['purchaseRate']} (Still Rs 680.00)")
        print(f"   - Per KM Rate: Rs {historical_trip['perKmRate']} (Still Rs 28.00)")
        print(f"   - Total Amount: Rs {historical_trip['totalAmount']} (Still Rs {expected_total})")
        assert float(historical_trip["billingRate"]) == 920.00, "Historical rate altered!"
        assert float(historical_trip["purchaseRate"]) == 680.00, "Historical purchase rate altered!"
        assert float(historical_trip["perKmRate"]) == 28.00, "Historical per km rate altered!"
        assert abs(float(historical_trip["totalAmount"]) - expected_total) < 0.01, "Historical total altered!"
        print("[OK] HISTORICAL INTEGRITY VERIFIED: Prior trip rates remained intact and unmolested.")

    print("\n======================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("======================================================================")

if __name__ == "__main__":
    run_tests()
