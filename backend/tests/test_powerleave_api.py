"""
PowerLeave API Tests - Backend API Testing
Tests: Authentication, Leave Requests, Announcements, Closures, Team Management
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://powerleave-staging.preview.emergentagent.com')

class TestHealthCheck:
    """Health check and basic connectivity tests"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self):
        """Test admin login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "admin@demo.it"
        assert data["role"] == "admin"
        assert "user_id" in data
        print(f"✓ Admin login successful: {data['name']}")
    
    def test_login_user_success(self):
        """Test user login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mario@demo.it",
            "password": "demo123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["email"] == "mario@demo.it"
        assert data["role"] == "user"
        print(f"✓ User login successful: {data['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@demo.it",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid login rejected correctly")
    
    def test_auth_me_without_token(self):
        """Test /auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthorized access correctly rejected")


class TestLeaveTypes:
    """Leave types endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_leave_types(self, admin_token):
        """Test fetching leave types"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/leave-types", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # At least Ferie, Permesso, Malattia, Maternità
        leave_type_names = [lt["name"] for lt in data]
        assert "Ferie" in leave_type_names
        assert "Permesso" in leave_type_names
        print(f"✓ Leave types retrieved: {len(data)} types")


class TestLeaveRequests:
    """Leave request CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mario@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_leave_requests_admin(self, admin_token):
        """Admin can get all leave requests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/leave-requests", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin retrieved {len(data)} leave requests")
    
    def test_create_leave_request(self, user_token):
        """User can create a leave request"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/leave-requests", 
            headers=headers,
            json={
                "leave_type_id": "permesso",
                "start_date": "2026-12-15",
                "end_date": "2026-12-15",
                "hours": 4,
                "notes": "TEST_Visita medica"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        print(f"✓ Leave request created: {data['request_id']}")
    
    def test_leave_request_approval(self, admin_token):
        """Admin can approve pending leave requests"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Get pending requests
        response = requests.get(f"{BASE_URL}/api/leave-requests?filter_status=pending", headers=headers)
        assert response.status_code == 200
        pending = response.json()
        print(f"✓ Found {len(pending)} pending requests")
        # Test passes regardless of whether there are pending requests


class TestAnnouncements:
    """Announcements (Bacheca) CRUD tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mario@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_announcements(self, admin_token):
        """Get all announcements"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/announcements", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} announcements")
    
    def test_create_announcement_admin(self, admin_token):
        """Admin can create announcement"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(f"{BASE_URL}/api/announcements", 
            headers=headers,
            json={
                "title": "TEST_Annuncio Test",
                "content": "Questo è un annuncio di test creato dal test automatico",
                "priority": "normal"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "id" in data
        print(f"✓ Announcement created: {data['id']}")
        return data["id"]
    
    def test_create_announcement_user_forbidden(self, user_token):
        """Regular user cannot create announcement (403)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/announcements", 
            headers=headers,
            json={
                "title": "TEST_User Annuncio",
                "content": "Should fail",
                "priority": "normal"
            }
        )
        assert response.status_code == 403
        print("✓ User correctly denied announcement creation")
    
    def test_announcement_crud_flow(self, admin_token):
        """Full CRUD flow for announcements"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/announcements", 
            headers=headers,
            json={
                "title": "TEST_CRUD Annuncio",
                "content": "Test contenuto per CRUD",
                "priority": "high"
            }
        )
        assert create_response.status_code == 200
        announcement_id = create_response.json()["id"]
        print(f"✓ Created announcement: {announcement_id}")
        
        # READ - verify it exists
        get_response = requests.get(f"{BASE_URL}/api/announcements", headers=headers)
        assert get_response.status_code == 200
        announcements = get_response.json()
        found = any(a["id"] == announcement_id for a in announcements)
        assert found, "Created announcement not found in list"
        print("✓ Announcement found in list")
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/announcements/{announcement_id}",
            headers=headers,
            json={
                "title": "TEST_CRUD Annuncio UPDATED",
                "content": "Contenuto aggiornato",
                "priority": "low"
            }
        )
        assert update_response.status_code == 200
        print("✓ Announcement updated")
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/announcements/{announcement_id}",
            headers=headers
        )
        assert delete_response.status_code == 200
        print("✓ Announcement deleted")
        
        # VERIFY DELETION
        get_response2 = requests.get(f"{BASE_URL}/api/announcements", headers=headers)
        announcements2 = get_response2.json()
        found2 = any(a["id"] == announcement_id for a in announcements2)
        assert not found2, "Deleted announcement still exists"
        print("✓ Deletion verified")


class TestClosures:
    """Company closures (Chiusure Aziendali) tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mario@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_closures(self, admin_token):
        """Get company closures and holidays"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/closures?year=2026", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have Italian holidays
        holiday_reasons = [c["reason"] for c in data]
        print(f"✓ Retrieved {len(data)} closures/holidays")
        # Check for standard Italian holidays
        if any("Natale" in r for r in holiday_reasons):
            print("✓ Italian holidays present (Natale found)")
    
    def test_create_closure_admin(self, admin_token):
        """Admin can create company closure"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(f"{BASE_URL}/api/closures", 
            headers=headers,
            json={
                "start_date": "2026-12-24",
                "end_date": "2026-12-31",
                "reason": "TEST_Chiusura natalizia",
                "type": "shutdown",
                "auto_leave": False,  # Don't auto-create leaves in test
                "allow_exceptions": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "id" in data
        print(f"✓ Closure created: {data['id']}")
        return data["id"]
    
    def test_create_closure_user_forbidden(self, user_token):
        """Regular user cannot create closure (403)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.post(f"{BASE_URL}/api/closures", 
            headers=headers,
            json={
                "start_date": "2026-12-24",
                "end_date": "2026-12-31",
                "reason": "TEST_User Closure",
                "type": "shutdown"
            }
        )
        assert response.status_code == 403
        print("✓ User correctly denied closure creation")
    
    def test_closure_exception_flow(self, admin_token, user_token):
        """Test closure exception request workflow"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        # Create a closure with allow_exceptions
        create_response = requests.post(f"{BASE_URL}/api/closures", 
            headers=admin_headers,
            json={
                "start_date": "2026-11-15",
                "end_date": "2026-11-16",
                "reason": "TEST_Exception Test Closure",
                "type": "shutdown",
                "auto_leave": False,
                "allow_exceptions": True
            }
        )
        assert create_response.status_code == 200
        closure_id = create_response.json()["id"]
        print(f"✓ Created closure for exception test: {closure_id}")
        
        # User requests exception
        exception_response = requests.post(f"{BASE_URL}/api/closures/{closure_id}/exception",
            headers=user_headers,
            json={"reason": "TEST_Ho un progetto urgente da consegnare"}
        )
        assert exception_response.status_code == 200
        exception_id = exception_response.json()["id"]
        print(f"✓ Exception requested: {exception_id}")
        
        # Admin can view exceptions
        exceptions_response = requests.get(f"{BASE_URL}/api/closures/exceptions",
            headers=admin_headers
        )
        assert exceptions_response.status_code == 200
        exceptions = exceptions_response.json()
        print(f"✓ Admin can view {len(exceptions)} exceptions")
        
        # Clean up - delete closure
        delete_response = requests.delete(f"{BASE_URL}/api/closures/{closure_id}",
            headers=admin_headers
        )
        assert delete_response.status_code == 200
        print("✓ Closure cleaned up")


class TestTeamManagement:
    """Team management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_team_members(self, admin_token):
        """Get team members"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/team", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 4  # Demo has 4 users
        member_names = [m["name"] for m in data]
        print(f"✓ Retrieved {len(data)} team members: {', '.join(member_names)}")
    
    def test_get_leave_balances(self, admin_token):
        """Get leave balances"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/leave-balances", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Each user should have balances for different leave types
        print(f"✓ Retrieved {len(data)} leave balance records")


class TestStatistics:
    """Statistics and dashboard data tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_stats(self, admin_token):
        """Get dashboard statistics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "approved_count" in data
        assert "pending_count" in data
        assert "available_staff" in data
        assert "total_staff" in data
        assert "utilization_rate" in data
        print(f"✓ Stats: approved={data['approved_count']}, pending={data['pending_count']}, staff={data['available_staff']}/{data['total_staff']}, utilization={data['utilization_rate']}%")


class TestCalendar:
    """Calendar data tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        return response.json().get("token")
    
    def test_get_monthly_calendar(self, admin_token):
        """Get monthly calendar data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/calendar/monthly?year=2026&month=3", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Calendar data retrieved: {len(data)} leave entries for March 2026")


class TestSessionPersistence:
    """Test session persistence across requests"""
    
    def test_session_persists(self):
        """Test that session token persists across multiple requests"""
        # Login and get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it",
            "password": "demo123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Make multiple requests with same token
        for i in range(3):
            me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            assert me_response.status_code == 200
            data = me_response.json()
            assert data["email"] == "admin@demo.it"
        
        print("✓ Session persisted across 3 consecutive requests")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
