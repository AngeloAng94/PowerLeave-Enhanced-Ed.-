#!/usr/bin/env python3
"""
Backend API Test for PowerLeave - Italian Leave Management System
Tests all core API endpoints for authentication, leave management, and admin functions
"""

import requests
import sys
import json
from datetime import datetime, timedelta

class PowerLeaveAPITester:
    def __init__(self, base_url="https://hr-powerup.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append(f"{name}: {details}")
            print(f"❌ {name} - {details}")

    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return None, "Invalid method"
                
            return response, None
        except Exception as e:
            return None, str(e)

    def test_health_check(self):
        """Test health endpoint"""
        response, error = self.make_request('GET', '/api/health')
        if error:
            self.log_test("Health Check", False, error)
            return False
            
        success = response.status_code == 200
        self.log_test("Health Check", success, f"Status: {response.status_code}")
        return success

    def test_admin_login(self):
        """Test admin login"""
        data = {"email": "admin@demo.it", "password": "demo123"}
        response, error = self.make_request('POST', '/api/auth/login', data)
        
        if error:
            self.log_test("Admin Login", False, error)
            return False
            
        if response.status_code == 200:
            result = response.json()
            if result.get('token'):
                self.admin_token = result['token']
                self.log_test("Admin Login", True, f"Role: {result.get('role')}")
                return True
                
        self.log_test("Admin Login", False, f"Status: {response.status_code}")
        return False

    def test_user_login(self):
        """Test regular user login"""
        data = {"email": "mario@demo.it", "password": "demo123"}
        response, error = self.make_request('POST', '/api/auth/login', data)
        
        if error:
            self.log_test("User Login", False, error)
            return False
            
        if response.status_code == 200:
            result = response.json()
            if result.get('token'):
                self.user_token = result['token']
                self.log_test("User Login", True, f"Role: {result.get('role')}")
                return True
                
        self.log_test("User Login", False, f"Status: {response.status_code}")
        return False

    def test_get_me(self):
        """Test authentication verification"""
        if not self.admin_token:
            self.log_test("Get Me (Admin)", False, "No admin token")
            return False
            
        response, error = self.make_request('GET', '/api/auth/me', token=self.admin_token)
        if error:
            self.log_test("Get Me (Admin)", False, error)
            return False
            
        success = response.status_code == 200
        if success:
            data = response.json()
            self.log_test("Get Me (Admin)", True, f"User: {data.get('name')}")
        else:
            self.log_test("Get Me (Admin)", False, f"Status: {response.status_code}")
        return success

    def test_get_stats(self):
        """Test statistics endpoint"""
        response, error = self.make_request('GET', '/api/stats', token=self.admin_token)
        if error:
            self.log_test("Get Stats", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Stats", True, f"Approved: {data.get('approved_count')}, Pending: {data.get('pending_count')}")
            return True
        else:
            self.log_test("Get Stats", False, f"Status: {response.status_code}")
            return False

    def test_leave_types(self):
        """Test leave types endpoint"""
        response, error = self.make_request('GET', '/api/leave-types', token=self.admin_token)
        if error:
            self.log_test("Get Leave Types", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Leave Types", True, f"Found {len(data)} leave types")
            return True
        else:
            self.log_test("Get Leave Types", False, f"Status: {response.status_code}")
            return False

    def test_team_members(self):
        """Test team members endpoint"""
        response, error = self.make_request('GET', '/api/team', token=self.admin_token)
        if error:
            self.log_test("Get Team Members", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Team Members", True, f"Found {len(data)} team members")
            return True
        else:
            self.log_test("Get Team Members", False, f"Status: {response.status_code}")
            return False

    def test_leave_balances(self):
        """Test leave balances endpoint"""
        response, error = self.make_request('GET', '/api/leave-balances', token=self.admin_token)
        if error:
            self.log_test("Get Leave Balances", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Leave Balances", True, f"Found {len(data)} balance records")
            return True
        else:
            self.log_test("Get Leave Balances", False, f"Status: {response.status_code}")
            return False

    def test_leave_requests(self):
        """Test leave requests endpoint"""
        response, error = self.make_request('GET', '/api/leave-requests', token=self.admin_token)
        if error:
            self.log_test("Get Leave Requests", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Leave Requests", True, f"Found {len(data)} leave requests")
            return True
        else:
            self.log_test("Get Leave Requests", False, f"Status: {response.status_code}")
            return False

    def test_calendar_data(self):
        """Test calendar monthly data"""
        response, error = self.make_request('GET', '/api/calendar/monthly?year=2026&month=2', token=self.admin_token)
        if error:
            self.log_test("Get Calendar Data", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Get Calendar Data", True, f"Found {len(data)} calendar entries")
            return True
        else:
            self.log_test("Get Calendar Data", False, f"Status: {response.status_code}")
            return False

    def test_create_leave_request(self):
        """Test creating a leave request"""
        if not self.user_token:
            self.log_test("Create Leave Request", False, "No user token")
            return False
            
        # Get leave types first
        response, error = self.make_request('GET', '/api/leave-types', token=self.user_token)
        if error or response.status_code != 200:
            self.log_test("Create Leave Request", False, "Cannot get leave types")
            return False
            
        leave_types = response.json()
        if not leave_types:
            self.log_test("Create Leave Request", False, "No leave types available")
            return False
            
        # Create a leave request
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        request_data = {
            "leave_type_id": leave_types[0]['id'],
            "start_date": tomorrow,
            "end_date": day_after,
            "hours": 8,
            "notes": "API Test Request"
        }
        
        response, error = self.make_request('POST', '/api/leave-requests', request_data, token=self.user_token)
        if error:
            self.log_test("Create Leave Request", False, error)
            return False
            
        if response.status_code == 200:
            data = response.json()
            self.log_test("Create Leave Request", True, f"Request ID: {data.get('request_id')}")
            return True
        else:
            self.log_test("Create Leave Request", False, f"Status: {response.status_code}, Response: {response.text}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting PowerLeave API Tests...")
        print(f"🎯 Testing against: {self.base_url}")
        print("="*60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("❌ Health check failed, cannot proceed with other tests")
            return False
            
        # Authentication tests
        admin_login_success = self.test_admin_login()
        user_login_success = self.test_user_login()
        
        if not admin_login_success:
            print("❌ Admin login failed, skipping admin tests")
        else:
            self.test_get_me()
            self.test_get_stats()
            self.test_leave_types()
            self.test_team_members()
            self.test_leave_balances()
            self.test_leave_requests()
            self.test_calendar_data()
            
        if user_login_success:
            self.test_create_leave_request()
        
        # Print summary
        print("="*60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        else:
            print("\n✅ All tests passed!")
            
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = PowerLeaveAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()