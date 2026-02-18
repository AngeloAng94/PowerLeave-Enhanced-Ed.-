"""
PowerLeave API Tests - Stable, idempotent test suite.
Each test class uses unique data and cleans up after itself.
Run: pytest tests/test_powerleave_api.py -v
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://saas-tech-check.preview.emergentagent.com")

# Unique run ID to avoid collisions across consecutive runs
RUN_ID = uuid.uuid4().hex[:8]


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────

@pytest.fixture(scope="session")
def admin_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@demo.it", "password": "demo123"
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["token"]


@pytest.fixture(scope="session")
def user_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "mario@demo.it", "password": "demo123"
    })
    assert resp.status_code == 200, f"User login failed: {resp.text}"
    return resp.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data(admin_headers):
    """Before & after: remove any leftover test leave requests for mario
    that could cause overlap conflicts on the unique date range we use."""
    _cleanup(admin_headers)
    yield
    _cleanup(admin_headers)


def _cleanup(admin_headers):
    """Delete leave requests created by tests (notes start with TEST_RUN_)."""
    resp = requests.get(f"{BASE_URL}/api/leave-requests", headers=admin_headers)
    if resp.status_code == 200:
        for req in resp.json():
            if req.get("notes", "").startswith("TEST_RUN_"):
                requests.put(
                    f"{BASE_URL}/api/leave-requests/{req['id']}/review",
                    headers=admin_headers,
                    json={"status": "rejected"},
                )


# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────

class TestHealthCheck:
    def test_health_endpoint(self):
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


# ──────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────

class TestAuthentication:
    def test_login_admin(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@demo.it", "password": "demo123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["role"] == "admin"

    def test_login_user(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "mario@demo.it", "password": "demo123"
        })
        assert resp.status_code == 200
        assert resp.json()["role"] == "user"

    def test_login_invalid(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@demo.it", "password": "wrong"
        })
        assert resp.status_code == 401

    def test_me_without_token(self):
        resp = requests.get(f"{BASE_URL}/api/auth/me")
        assert resp.status_code == 401

    def test_session_persistence(self, admin_headers):
        for _ in range(3):
            resp = requests.get(f"{BASE_URL}/api/auth/me", headers=admin_headers)
            assert resp.status_code == 200
            assert resp.json()["email"] == "admin@demo.it"


# ──────────────────────────────────────────────
# Leave Types
# ──────────────────────────────────────────────

class TestLeaveTypes:
    def test_get_leave_types(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/leave-types", headers=admin_headers)
        assert resp.status_code == 200
        names = [t["name"] for t in resp.json()]
        assert "Ferie" in names
        assert "Permesso" in names


# ──────────────────────────────────────────────
# Leave Requests (previously flaky)
# ──────────────────────────────────────────────

class TestLeaveRequests:
    def test_get_leave_requests_admin(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/leave-requests", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_leave_request(self, user_headers, admin_headers):
        """Create a leave request on a unique far-future date to avoid overlaps."""
        # Use a unique date based on RUN_ID to guarantee no overlap
        unique_day = (int(RUN_ID, 16) % 28) + 1  # 1-28
        start = f"2029-06-{unique_day:02d}"
        end = start

        resp = requests.post(f"{BASE_URL}/api/leave-requests",
            headers=user_headers,
            json={
                "leave_type_id": "permesso",
                "start_date": start,
                "end_date": end,
                "hours": 4,
                "notes": f"TEST_RUN_{RUN_ID}"
            }
        )
        assert resp.status_code == 200, f"Create leave request failed: {resp.text}"
        data = resp.json()
        assert data["success"] is True
        assert "request_id" in data

        # Cleanup: reject so it doesn't block future runs on overlapping dates
        req_id = data["request_id"]
        requests.put(
            f"{BASE_URL}/api/leave-requests/{req_id}/review",
            headers=admin_headers,
            json={"status": "rejected"}
        )

    def test_leave_request_review(self, user_headers, admin_headers):
        """Create then approve a leave request."""
        unique_day = ((int(RUN_ID, 16) + 5) % 28) + 1
        start = f"2029-07-{unique_day:02d}"
        end = start

        # Create
        create_resp = requests.post(f"{BASE_URL}/api/leave-requests",
            headers=user_headers,
            json={
                "leave_type_id": "ferie",
                "start_date": start,
                "end_date": end,
                "hours": 8,
                "notes": f"TEST_RUN_{RUN_ID}_review"
            }
        )
        assert create_resp.status_code == 200
        req_id = create_resp.json()["request_id"]

        # Approve
        review_resp = requests.put(
            f"{BASE_URL}/api/leave-requests/{req_id}/review",
            headers=admin_headers,
            json={"status": "approved"}
        )
        assert review_resp.status_code == 200

        # Verify status changed
        all_resp = requests.get(f"{BASE_URL}/api/leave-requests", headers=admin_headers)
        found = [r for r in all_resp.json() if r["id"] == req_id]
        assert len(found) == 1
        assert found[0]["status"] == "approved"


# ──────────────────────────────────────────────
# Announcements
# ──────────────────────────────────────────────

class TestAnnouncements:
    def test_get_announcements(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/announcements", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_crud_announcement(self, admin_headers):
        h = admin_headers
        # Create
        c = requests.post(f"{BASE_URL}/api/announcements", headers=h, json={
            "title": f"TEST_RUN_{RUN_ID}", "content": "body", "priority": "high"
        })
        assert c.status_code == 200
        aid = c.json()["id"]

        # Read
        r = requests.get(f"{BASE_URL}/api/announcements", headers=h)
        assert any(a["id"] == aid for a in r.json())

        # Update
        u = requests.put(f"{BASE_URL}/api/announcements/{aid}", headers=h, json={
            "title": f"TEST_RUN_{RUN_ID}_updated"
        })
        assert u.status_code == 200

        # Delete
        d = requests.delete(f"{BASE_URL}/api/announcements/{aid}", headers=h)
        assert d.status_code == 200

        # Verify deleted
        r2 = requests.get(f"{BASE_URL}/api/announcements", headers=h)
        assert not any(a["id"] == aid for a in r2.json())

    def test_user_cannot_create(self, user_headers):
        resp = requests.post(f"{BASE_URL}/api/announcements", headers=user_headers, json={
            "title": "nope", "content": "nope"
        })
        assert resp.status_code == 403


# ──────────────────────────────────────────────
# Closures & Exceptions
# ──────────────────────────────────────────────

class TestClosures:
    def test_get_closures(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/closures?year=2026", headers=admin_headers)
        assert resp.status_code == 200
        reasons = [c["reason"] for c in resp.json()]
        assert any("Natale" in r for r in reasons)

    def test_closure_crud_and_exception(self, admin_headers, user_headers):
        # Create closure
        c = requests.post(f"{BASE_URL}/api/closures", headers=admin_headers, json={
            "start_date": "2029-11-15", "end_date": "2029-11-16",
            "reason": f"TEST_RUN_{RUN_ID}", "type": "shutdown",
            "auto_leave": False, "allow_exceptions": True
        })
        assert c.status_code == 200
        cid = c.json()["id"]

        # User requests exception
        exc = requests.post(f"{BASE_URL}/api/closures/{cid}/exception",
            headers=user_headers, json={"reason": f"TEST_RUN_{RUN_ID}_exc"})
        assert exc.status_code == 200

        # Admin sees exceptions
        excs = requests.get(f"{BASE_URL}/api/closures/exceptions", headers=admin_headers)
        assert excs.status_code == 200
        assert isinstance(excs.json(), list)

        # Cleanup
        requests.delete(f"{BASE_URL}/api/closures/{cid}", headers=admin_headers)

    def test_user_cannot_create_closure(self, user_headers):
        resp = requests.post(f"{BASE_URL}/api/closures", headers=user_headers, json={
            "start_date": "2029-12-24", "end_date": "2029-12-31",
            "reason": "nope", "type": "shutdown"
        })
        assert resp.status_code == 403


# ──────────────────────────────────────────────
# Team Management
# ──────────────────────────────────────────────

class TestTeam:
    def test_get_team(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/team", headers=admin_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 4

    def test_invite_no_temp_password_exposed(self, admin_headers):
        """Verify temp_password is NOT in the API response."""
        email = f"test_{RUN_ID}@audit.it"
        resp = requests.post(f"{BASE_URL}/api/team/invite", headers=admin_headers, json={
            "email": email, "name": "Test Audit", "role": "user"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "temp_password" not in data, "temp_password MUST NOT be in response"
        uid = data["user_id"]

        # Cleanup
        requests.delete(f"{BASE_URL}/api/team/{uid}", headers=admin_headers)


# ──────────────────────────────────────────────
# Statistics & Calendar & Balances
# ──────────────────────────────────────────────

class TestStatsAndData:
    def test_stats(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/stats", headers=admin_headers)
        assert resp.status_code == 200
        d = resp.json()
        for key in ["approved_count", "pending_count", "available_staff", "total_staff", "utilization_rate"]:
            assert key in d

    def test_calendar(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/calendar/monthly?year=2026&month=3", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_leave_balances(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/leave-balances", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_organization(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/organization", headers=admin_headers)
        assert resp.status_code == 200
        assert "org_id" in resp.json()

    def test_settings_rules(self, admin_headers):
        resp = requests.get(f"{BASE_URL}/api/settings/rules", headers=admin_headers)
        assert resp.status_code == 200
        d = resp.json()
        assert "min_notice_days" in d


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
