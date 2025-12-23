#!/usr/bin/env python3
"""
Playwright script to diagnose and fix deployment issues
"""
import asyncio
import requests
import time
from datetime import datetime
from playwright.async_api import async_playwright

async def check_deployment_status():
    """Use Playwright to check deployment status and identify issues"""
    
    print("🔍 Starting Playwright deployment diagnosis...")
    print("=" * 60)
    
    # Basic HTTP checks first
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
            return response.status_code, response.text, response.url
        except requests.exceptions.RequestException as e:
            print(f"❌ {description}: {str(e)}")
            return None, str(e), None

    # Check endpoints
    print(f"📅 Deployment check at: {datetime.now()}")
    
    # Test different variations
    endpoints = [
        ("https://riderapp.johnsonzoglo.com", "Frontend HTTPS"),
        ("http://riderapp.johnsonzoglo.com", "Frontend HTTP"), 
        ("https://riderapp.johnsonzoglo.com/api/health", "API Health HTTPS"),
        ("https://riderapp.johnsonzoglo.com/api/docs", "API Docs"),
        ("https://riderapp.johnsonzoglo.com/health", "Frontend Health"),
    ]
    
    results = {}
    for url, desc in endpoints:
        status, content, final_url = check_endpoint(url, desc)
        results[desc] = {"status": status, "content": content, "final_url": final_url}
        time.sleep(1)  # Rate limiting
    
    # DNS check
    print("\n🌐 DNS Resolution:")
    import socket
    try:
        ip = socket.gethostbyname("riderapp.johnsonzoglo.com")
        print(f"✅ Domain resolves to: {ip}")
    except Exception as e:
        print(f"❌ DNS resolution failed: {e}")
    
    # Now use Playwright for advanced checks
    print("\n🎭 Starting Playwright browser checks...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Check main domain with browser
            print("🌐 Testing with browser...")
            
            # Set longer timeout for deployment
            page.set_default_timeout(30000)
            
            # Try to load the main page
            try:
                response = await page.goto("https://riderapp.johnsonzoglo.com", wait_until="networkidle")
                print(f"✅ Browser loaded page: {response.status}")
                
                # Check if it's a login page
                title = await page.title()
                print(f"📄 Page title: {title}")
                
                # Check for specific elements that indicate successful deployment
                login_elements = await page.query_selector_all("input[type='password'], input[name='username'], button[type='submit']")
                if login_elements:
                    print("✅ Login form detected - frontend is working!")
                
                # Check for error messages
                error_elements = await page.query_selector_all(".error, .alert, .warning")
                if error_elements:
                    for elem in error_elements:
                        text = await elem.text_content()
                        print(f"⚠️ Error message found: {text}")
                
                # Take screenshot for debugging
                await page.screenshot(path="deployment_status.png")
                print("📸 Screenshot saved as deployment_status.png")
                
            except Exception as e:
                print(f"❌ Browser navigation failed: {e}")
                
                # Try to get more details about the error
                try:
                    await page.goto("https://riderapp.johnsonzoglo.com", wait_until="domcontentloaded", timeout=15000)
                    content = await page.content()
                    print(f"📄 Page content length: {len(content)}")
                    if "404" in content or "Not Found" in content:
                        print("❌ Getting 404 - service not deployed or misconfigured")
                    elif "502" in content or "Bad Gateway" in content:
                        print("❌ Getting 502 - service is down or not responding")
                    elif "503" in content or "Service Unavailable" in content:
                        print("❌ Getting 503 - service temporarily unavailable")
                except:
                    print("❌ Complete failure to load any content")
            
            # Test API endpoint directly
            try:
                print("\n🔍 Testing API endpoint...")
                api_response = await page.goto("https://riderapp.johnsonzoglo.com/api/health")
                if api_response:
                    print(f"✅ API responded: {api_response.status}")
                    content = await page.content()
                    if "healthy" in content:
                        print("✅ API is healthy!")
                    else:
                        print(f"⚠️ API content: {content[:200]}")
            except Exception as e:
                print(f"❌ API test failed: {e}")
                
        except Exception as e:
            print(f"❌ Playwright error: {e}")
        
        finally:
            await browser.close()
    
    # Provide diagnosis and recommendations
    print("\n" + "=" * 60)
    print("🩺 DIAGNOSIS & RECOMMENDATIONS:")
    print("=" * 60)
    
    working_endpoints = [desc for desc, result in results.items() if result["status"] == 200]
    
    if working_endpoints:
        print(f"✅ Working endpoints: {', '.join(working_endpoints)}")
    else:
        print("❌ No endpoints are responding successfully")
        print("\n🔧 TROUBLESHOOTING STEPS:")
        print("1. Check Dockploy build logs for errors")
        print("2. Verify all environment variables are set")
        print("3. Ensure docker-compose.prod.yml is being used")
        print("4. Check if Traefik is properly configured")
        print("5. Verify SSL certificate generation")
        
    # Check for common deployment patterns
    error_404 = any(result["status"] == 404 for result in results.values() if result["status"])
    error_502 = any(result["status"] == 502 for result in results.values() if result["status"])
    error_503 = any(result["status"] == 503 for result in results.values() if result["status"])
    
    if error_404:
        print("\n❌ 404 Errors detected:")
        print("  - Service not deployed or domain routing misconfigured")
        print("  - Check Traefik labels in docker-compose.prod.yml")
        print("  - Verify domain configuration in Dockploy")
        
    if error_502:
        print("\n❌ 502 Errors detected:")
        print("  - Backend service is not responding")
        print("  - Check if containers are running")
        print("  - Verify database connection")
        
    if error_503:
        print("\n❌ 503 Errors detected:")
        print("  - Service temporarily unavailable")
        print("  - Deployment may still be in progress")
        print("  - Check resource limits")

if __name__ == "__main__":
    asyncio.run(check_deployment_status())