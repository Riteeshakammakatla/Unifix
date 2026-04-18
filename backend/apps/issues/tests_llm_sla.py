from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from apps.authentication.models import User
from apps.issues.models import Issue, SLA
from rest_framework.test import APIClient
from unittest.mock import patch

class LLMAndSLAIntegrationTests(TestCase):
    def setUp(self):
        # Create user
        self.student = User.objects.create_user(email="student@test.com", username="student", password="pw", role="student")
        self.admin = User.objects.create_user(email="admin@test.com", username="admin", password="pw", role="admin")
        self.supervisor_elec = User.objects.create_user(email="selec@test.com", username="selec", password="pw", role="supervisor", department="Electrical")
        
        # Populate SLA
        SLA.objects.create(category="Electrical", response_time=2, resolution_time=24)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.student)

    @patch('llm.llm_service.LLMService.analyze_issue')
    @patch('llm.llm_service.LLMService.detect_duplicate')
    def test_auto_assignment_and_sla_creation(self, mock_detect, mock_analyze):
        mock_detect.return_value = {"duplicate_score": 0.1, "reason": "Unique"}
        mock_analyze.return_value = {
            "category": "Electrical",
            "priority": "High",
            "department": "Electrical",
            "summary": "AI summary"
        }
        
        response = self.client.post('/api/issues/', {
            "title": "Sparking wire in lab",
            "description": "The wire is sparking",
            "location": "Lab 1"
        })
        self.assertEqual(response.status_code, 201)
        
        issue = Issue.objects.get(title="Sparking wire in lab")
        # Check LLM assignments
        self.assertEqual(issue.category, "Electrical")
        self.assertEqual(issue.priority, "High")
        self.assertEqual(issue.ai_summary, "AI summary")
        
        # Check Supervisor Assignment
        self.assertEqual(issue.assigned_supervisor, self.supervisor_elec)
        self.assertEqual(issue.status, "Assigned")
        
        # Check SLA calculation
        self.assertIsNotNone(issue.deadline_time)
        self.assertIsNotNone(issue.sla_response_deadline)

    def test_sla_violation_escalation(self):
        # Create an issue directly
        past_deadline = timezone.now() - timedelta(hours=1)
        issue = Issue.objects.create(
            title="Old issue",
            description="Test",
            location="Room",
            created_by=self.student,
            deadline_time=past_deadline,
            status="Open"
        )
        
        # Call GET endpoint which triggers SLA check
        response = self.client.get('/api/issues/')
        self.assertEqual(response.status_code, 200)
        
        issue.refresh_from_db()
        self.assertTrue(issue.is_escalated)
        self.assertEqual(issue.status, "Escalated")
        self.assertIsNotNone(issue.escalated_at)

    def test_admin_override(self):
        issue = Issue.objects.create(
            title="Some issue",
            description="Test",
            location="Room",
            created_by=self.student,
            category="Cleaning",
            priority="Low",
            status="Open"
        )
        
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/issues/{issue.id}/', {
            "priority": "Critical"
        })
        self.assertEqual(response.status_code, 200)
        
        issue.refresh_from_db()
        self.assertTrue(issue.override_llm)
        self.assertEqual(issue.priority, "Critical")
