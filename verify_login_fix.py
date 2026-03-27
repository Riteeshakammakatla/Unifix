import urllib.request
import json

url = 'http://127.0.0.1:8000/api/auth/login/'

def test_login(payload, label):
    print(f"Testing login with {label}:")
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            res_data = json.loads(response.read().decode('utf-8'))
            print(f"Status: {status}")
            print(f"Response: {res_data.keys()}") # Just keys for brevity
            if 'access' in res_data:
                print("SUCCESS: Login successful and JWT received.")
            else:
                print("FAILURE: Login failed, no access token.")
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'read'):
            print(f"Error details: {e.read().decode('utf-8')}")

# Test with 'email' (what the frontend sends)
test_login({'email': 'admin@campus.edu', 'password': 'admin123'}, "'email' field")

print("-" * 30)

# Test with 'username' (backward compatibility)
test_login({'username': 'admin@campus.edu', 'password': 'admin123'}, "'username' field")
