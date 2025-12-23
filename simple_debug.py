#!/usr/bin/env python3
"""
Simple diagnostic script to check deployment status
"""
import requests
import time
from datetime import datetime
import socket

def check_endpoint(url, description):
    """Check an endpoint and return detailed status"""
    try:
        response = requests.get(url, timeout=10, allow_redirects=True)
        print(f"✅ {description}: Status {response.status_code}")
        if response.history:
            print(f"   Redirects: {[r.status_code for r in response.history]} -> {response.url}")
        if response.status_code == 200:
            content_preview = response.text[:200] + "..." if len(response.text) > 200 else response.text
            print(f"   Content: {content_preview}")
        elif response.status_code == 404:
            print(f"   ❌ 404 Not Found - Service not deployed or routing misconfigured")
        elif response.status_code == 502:
            print(f"   ❌ 502 Bad Gateway - Backend service not responding")
        elif response.status_code == 503:
            print(f"   ❌ 503 Service Unavailable - Service temporarily down")
        return response.status_code, response.text, response.url
    except requests.exceptions.ConnectionError:
        print(f"❌ {description}: Connection refused - Service not running")
        return None, "Connection refused", None
    except requests.exceptions.Timeout:
        print(f"❌ {description}: Timeout - Service not responding")
        return None, "Timeout", None
    except requests.exceptions.RequestException as e:
        print(f"❌ {description}: {str(e)}")
        return None, str(e), None

print("🔍 DEPLOYMENT DIAGNOSIS")
print("=" * 60)
print(f"📅 Check time: {datetime.now()}")
print()

# DNS check first
print("🌐 DNS Resolution:")
try:
    ip = socket.gethostbyname("riderapp.johnsonzoglo.com")
    print(f"✅ Domain resolves to: {ip}")
except Exception as e:
    print(f"❌ DNS resolution failed: {e}")
print()

# Check endpoints
print("🔍 Endpoint Tests:")
endpoints = [
    ("https://riderapp.johnsonzoglo.com", "Frontend HTTPS"),
    ("http://riderapp.johnsonzoglo.com", "Frontend HTTP"), 
    ("https://riderapp.johnsonzoglo.com/api/health", "API Health"),
    ("https://riderapp.johnsonzoglo.com/api/docs", "API Docs"),
    ("https://riderapp.johnsonzoglo.com/health", "Frontend Health"),
]

results = {}
for url, desc in endpoints:
    print(f"\n🔍 Testing: {desc}")
    status, content, final_url = check_endpoint(url, desc)
    results[desc] = {"status": status, "content": content, "final_url": final_url}
    time.sleep(1)  # Rate limiting

print("\n" + "=" * 60)
print("🩺 DIAGNOSIS & RECOMMENDATIONS:")
print("=" * 60)

# Analyze results
working_endpoints = [desc for desc, result in results.items() if result["status"] == 200]
error_404 = [desc for desc, result in results.items() if result["status"] == 404]
error_502 = [desc for desc, result in results.items() if result["status"] == 502]
error_503 = [desc for desc, result in results.items() if result["status"] == 503]
connection_errors = [desc for desc, result in results.items() if result["status"] is None and "Connection" in str(result["content"])]

if working_endpoints:
    print(f"✅ Working endpoints: {', '.join(working_endpoints)}")
else:
    print("❌ No endpoints are responding successfully")

if error_404:
    print(f"\n❌ 404 ERRORS: {', '.join(error_404)}")
    print("  CAUSE: Service not deployed or domain routing misconfigured")
    print("  FIXES:")
    print("  - Verify deployment is complete in Dockploy")
    print("  - Check Traefik labels in docker-compose.prod.yml")
    print("  - Verify domain configuration matches: riderapp.johnsonzoglo.com")

if error_502:
    print(f"\n❌ 502 ERRORS: {', '.join(error_502)}")
    print("  CAUSE: Backend service not responding")
    print("  FIXES:")
    print("  - Check container logs in Dockploy")
    print("  - Verify database connection")
    print("  - Check environment variables")

if error_503:
    print(f"\n❌ 503 ERRORS: {', '.join(error_503)}")
    print("  CAUSE: Service temporarily unavailable")
    print("  FIXES:")
    print("  - Deployment may still be in progress - wait and retry")
    print("  - Check resource limits")

if connection_errors:
    print(f"\n❌ CONNECTION ERRORS: {', '.join(connection_errors)}")
    print("  CAUSE: No service listening on domain")
    print("  FIXES:")
    print("  - Check if deployment failed")
    print("  - Verify DNS points to correct server")
    print("  - Check Dockploy server status")

print("\n🔧 NEXT STEPS:")
if not working_endpoints:
    print("1. Check Dockploy deployment logs for specific errors")
    print("2. Verify all environment variables are properly set")
    print("3. Ensure docker-compose.prod.yml is being used as compose file")
    print("4. Check if all services (db, backend, frontend) started successfully")
    print("5. Verify domain configuration in Dockploy dashboard")
else:
    print("1. Some endpoints are working - investigate failing ones")
    print("2. Check specific service logs for failing components")

print("\n📋 Environment Variables Checklist:")
required_vars = [
    "POSTGRES_DB=riderdb",
    "POSTGRES_USER=rider", 
    "POSTGRES_PASSWORD=RiderProd2024SecurePass!",
    "JWT_SECRET=4a933f56ed046fa97167ef63d69112c677b20d314d737170ffa22dee48554125",
    "DOMAIN=riderapp.johnsonzoglo.com",
    "VITE_API_BASE_URL=https://riderapp.johnsonzoglo.com/api"
]
print("Ensure these are set in Dockploy environment:")
for var in required_vars:
    print(f"  ✓ {var}")