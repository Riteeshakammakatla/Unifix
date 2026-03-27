import requests

url = 'http://127.0.0.1:8000/api/auth/login/'

print("Testing login with 'email' field:")
try:
    data_email = {'email': 'admin@campus.edu', 'password': 'admin123'}
    response = requests.post(url, json=data_email)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\nTesting login with 'username' field (mapping email to username):")
try:
    data_username = {'username': 'admin@campus.edu', 'password': 'admin123'}
    response = requests.post(url, json=data_username)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
