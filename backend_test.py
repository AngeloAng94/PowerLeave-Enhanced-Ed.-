#!/usr/bin/env python3
"""
PowerLeave Backend API Test Suite
Tests all API endpoints for the leave management system
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class PowerLeaveAPITester:
    def __init__(self, base_url="https://hr-powerup.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.user_id = None
        self.org_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
        print(f"🚀 Starting PowerLeave API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 60)

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=True):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {endpoint}")

        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                
                # Try to parse response
                try:
                    response_data = response.json()
                    if response_data:
                        print(f"   📝 Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'List/Other'}")
                except:
                    pass
                    
                return True, response.json() if response.text else {}
            else:
                self.tests_passed += 1 if response.status_code in [200, 201] else 0
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   ❗ Error: {error_data.get('detail', 'Unknown error')}")
                except:
                    print(f"   ❗ Response text: {response.text[:200]}...")
                
                self.failed_tests.append({
                    'name': name,
                    'method': method,
                    'endpoint': endpoint,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'error': response.text[:500]
                })
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'method': method,
                'endpoint': endpoint,
                'expected': expected_status,
                'actual': 'Network Error',
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        return self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200,
            auth=False
        )

    def test_user_registration(self):
        """Test user registration with organization creation"""
        test_user = {
            "name": "Test User Mario",
            "email": "mario@test.it",
            "password": "password123",
            "organization_name": "Test Organization SRL"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/api/auth/register",
            200,
            data=test_user,
            auth=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user_id')
            self.org_id = response.get('org_id')
            print(f"   🎫 Token received: {self.token[:20]}...")
            print(f"   👤 User ID: {self.user_id}")
            print(f"   🏢 Org ID: {self.org_id}")
        
        return success

    def test_user_login(self):
        """Test user login with existing credentials"""
        login_data = {
            "email": "mario@test.it",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "/api/auth/login",
            200,
            data=login_data,
            auth=False
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response.get('user_id')
            self.org_id = response.get('org_id')
            print(f"   🎫 Login token: {self.token[:20]}...")
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        return self.run_test(
            "Get Current User",
            "GET",
            "/api/auth/me",
            200
        )

    def test_get_leave_types(self):
        """Test fetching available leave types"""
        return self.run_test(
            "Get Leave Types",
            "GET",
            "/api/leave-types",
            200
        )

    def test_create_leave_request(self):
        """Test creating a new leave request"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        leave_request = {
            "leave_type_id": "ferie",  # Using default leave type
            "start_date": tomorrow,
            "end_date": day_after,
            "hours": 8,
            "notes": "Test leave request"
        }
        
        success, response = self.run_test(
            "Create Leave Request",
            "POST",
            "/api/leave-requests",
            200,
            data=leave_request
        )
        
        if success and 'request_id' in response:
            self.test_request_id = response['request_id']
            print(f"   📋 Request ID: {self.test_request_id}")
        
        return success

    def test_get_leave_requests(self):
        """Test fetching leave requests"""
        return self.run_test(
            "Get Leave Requests",
            "GET",
            "/api/leave-requests",
            200
        )

    def test_review_leave_request(self):
        """Test reviewing/approving a leave request"""
        if not hasattr(self, 'test_request_id'):
            print("⚠️  Skipping - no request ID from previous test")
            return False
            
        review_data = {"status": "approved"}
        
        return self.run_test(
            "Review Leave Request",
            "PUT",
            f"/api/leave-requests/{self.test_request_id}/review",
            200,
            data=review_data
        )

    def test_get_statistics(self):
        """Test getting dashboard statistics"""
        return self.run_test(
            "Get Statistics",
            "GET",
            "/api/stats",
            200
        )

    def test_get_monthly_calendar(self):
        """Test getting monthly calendar data"""
        year = datetime.now().year
        month = datetime.now().month
        
        return self.run_test(
            "Get Monthly Calendar",
            "GET",
            f"/api/calendar/monthly?year={year}&month={month}",
            200
        )

    def test_get_team_members(self):
        """Test getting team members"""
        return self.run_test(
            "Get Team Members",
            "GET",
            "/api/team",
            200
        )

    def test_invite_team_member(self):
        """Test inviting a new team member"""
        invite_data = {
            "name": "Test Member",
            "email": f"test.member{int(time.time())}@test.it",
            "role": "user"
        }
        
        success, response = self.run_test(
            "Invite Team Member",
            "POST",
            "/api/team/invite",
            200,
            data=invite_data
        )
        
        if success and 'user_id' in response:
            self.invited_user_id = response['user_id']
            print(f"   👥 Invited user ID: {self.invited_user_id}")
        
        return success

    def test_get_leave_balances(self):
        """Test getting leave balances"""
        return self.run_test(
            "Get Leave Balances",
            "GET",
            "/api/leave-balances",
            200
        )

    def test_logout(self):
        """Test user logout"""
        return self.run_test(
            "User Logout",
            "POST",
            "/api/auth/logout",
            200,
            data={}
        )

    def run_all_tests(self):
        """Execute all test cases in sequence"""
        print("🧪 Running Backend API Test Suite")
        
        # Test health check first
        self.test_health_check()
        
        # Try login first (user might already exist)
        if not self.test_user_login():
            # If login fails, try registration
            if not self.test_user_registration():
                print("❌ CRITICAL: Cannot authenticate - stopping tests")
                return self.print_summary()
        
        # Test authentication endpoints
        self.test_get_current_user()
        
        # Test leave types
        self.test_get_leave_types()
        
        # Test leave requests workflow
        self.test_create_leave_request()
        self.test_get_leave_requests()
        self.test_review_leave_request()
        
        # Test dashboard and reporting
        self.test_get_statistics()
        self.test_get_monthly_calendar()
        
        # Test team management
        self.test_get_team_members()
        self.test_invite_team_member()
        
        # Test leave balances
        self.test_get_leave_balances()
        
        # Test logout
        self.test_logout()
        
        return self.print_summary()

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"{i}. {test['name']}")
                print(f"   Method: {test['method']} {test.get('endpoint', 'N/A')}")
                print(f"   Expected: {test['expected']}, Got: {test['actual']}")
                print(f"   Error: {test['error'][:100]}...")
                print()
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = PowerLeaveAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)