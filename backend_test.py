#!/usr/bin/env python3
"""
Backend API Testing Script for Personal Finance Tracker
Tests all backend endpoints for functionality and error handling
"""

import requests
import json
from datetime import datetime, timedelta
import uuid
import sys
import os

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

class BackendTester:
    def __init__(self):
        self.test_results = []
        self.created_expense_ids = []
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def test_health_check(self):
        """Test the health check endpoint"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("Health Check", True, "Health endpoint returns healthy status", data)
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            
    def test_get_categories(self):
        """Test getting categories - should return default categories"""
        try:
            response = requests.get(f"{API_BASE}/categories", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                
                if isinstance(categories, list) and len(categories) > 0:
                    # Check for expected default categories
                    category_names = [cat.get("name") for cat in categories]
                    expected_categories = ["Food", "Transportation", "Entertainment", "Shopping", "Bills", "Healthcare", "Other"]
                    
                    found_categories = [name for name in expected_categories if name in category_names]
                    
                    if len(found_categories) >= 5:  # At least 5 default categories
                        self.log_test("Get Categories", True, f"Found {len(categories)} categories including defaults: {found_categories}", categories)
                    else:
                        self.log_test("Get Categories", False, f"Missing default categories. Found: {category_names}")
                else:
                    self.log_test("Get Categories", False, f"Expected list of categories, got: {categories}")
            else:
                self.log_test("Get Categories", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Get Categories", False, f"Connection error: {str(e)}")
            
    def test_create_expense_valid(self):
        """Test creating a new expense with valid data"""
        try:
            expense_data = {
                "amount": 25.50,
                "category": "Food",
                "description": "Lunch at downtown restaurant",
                "date": datetime.now().isoformat()
            }
            
            response = requests.post(
                f"{API_BASE}/expenses", 
                json=expense_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                expense = response.json()
                
                # Validate response structure
                required_fields = ["id", "amount", "category", "description", "date"]
                missing_fields = [field for field in required_fields if field not in expense]
                
                if not missing_fields:
                    # Store ID for cleanup
                    self.created_expense_ids.append(expense["id"])
                    
                    # Validate data integrity
                    if (expense["amount"] == expense_data["amount"] and 
                        expense["category"] == expense_data["category"] and
                        expense["description"] == expense_data["description"]):
                        self.log_test("Create Valid Expense", True, f"Expense created successfully with ID: {expense['id']}", expense)
                    else:
                        self.log_test("Create Valid Expense", False, f"Data mismatch in created expense: {expense}")
                else:
                    self.log_test("Create Valid Expense", False, f"Missing fields in response: {missing_fields}")
            else:
                self.log_test("Create Valid Expense", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Create Valid Expense", False, f"Connection error: {str(e)}")
            
    def test_get_expenses(self):
        """Test getting expenses list"""
        try:
            response = requests.get(f"{API_BASE}/expenses", timeout=10)
            
            if response.status_code == 200:
                expenses = response.json()
                
                if isinstance(expenses, list):
                    if len(expenses) > 0:
                        # Validate expense structure
                        first_expense = expenses[0]
                        required_fields = ["id", "amount", "category", "date"]
                        missing_fields = [field for field in required_fields if field not in first_expense]
                        
                        if not missing_fields:
                            self.log_test("Get Expenses", True, f"Retrieved {len(expenses)} expenses successfully", {"count": len(expenses), "sample": first_expense})
                        else:
                            self.log_test("Get Expenses", False, f"Expense missing required fields: {missing_fields}")
                    else:
                        self.log_test("Get Expenses", True, "No expenses found (empty list)", {"count": 0})
                else:
                    self.log_test("Get Expenses", False, f"Expected list, got: {type(expenses)}")
            else:
                self.log_test("Get Expenses", False, f"HTTP {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Get Expenses", False, f"Connection error: {str(e)}")
            
    def test_summary_endpoints(self):
        """Test daily, weekly, and monthly summary endpoints"""
        summary_types = ["day", "week", "month"]
        
        for summary_type in summary_types:
            try:
                response = requests.get(f"{API_BASE}/expenses/summary/{summary_type}", timeout=10)
                
                if response.status_code == 200:
                    summary = response.json()
                    
                    # Validate summary structure
                    required_fields = ["total_amount", "expense_count", "top_categories"]
                    missing_fields = [field for field in required_fields if field not in summary]
                    
                    if not missing_fields:
                        # Validate data types
                        if (isinstance(summary["total_amount"], (int, float)) and
                            isinstance(summary["expense_count"], int) and
                            isinstance(summary["top_categories"], list)):
                            self.log_test(f"{summary_type.title()} Summary", True, f"Summary retrieved successfully", summary)
                        else:
                            self.log_test(f"{summary_type.title()} Summary", False, f"Invalid data types in summary: {summary}")
                    else:
                        self.log_test(f"{summary_type.title()} Summary", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test(f"{summary_type.title()} Summary", False, f"HTTP {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"{summary_type.title()} Summary", False, f"Connection error: {str(e)}")
                
    def test_invalid_expense_data(self):
        """Test error handling for invalid expense data"""
        invalid_test_cases = [
            {
                "name": "Negative Amount",
                "data": {"amount": -10.0, "category": "Food", "description": "Invalid negative amount"},
                "expected_error": "Amount must be positive"
            },
            {
                "name": "Missing Amount",
                "data": {"category": "Food", "description": "Missing amount field"},
                "expected_error": "amount"
            },
            {
                "name": "Empty Category",
                "data": {"amount": 10.0, "category": "", "description": "Empty category"},
                "expected_error": "category"
            },
            {
                "name": "Missing Category",
                "data": {"amount": 10.0, "description": "Missing category field"},
                "expected_error": "category"
            }
        ]
        
        for test_case in invalid_test_cases:
            try:
                response = requests.post(
                    f"{API_BASE}/expenses",
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code in [400, 422]:  # Bad Request or Validation Error
                    self.log_test(f"Invalid Data - {test_case['name']}", True, f"Correctly rejected invalid data with status {response.status_code}")
                elif response.status_code == 200:
                    self.log_test(f"Invalid Data - {test_case['name']}", False, f"Should have rejected invalid data but accepted it")
                else:
                    self.log_test(f"Invalid Data - {test_case['name']}", False, f"Unexpected status code {response.status_code}: {response.text}")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Invalid Data - {test_case['name']}", False, f"Connection error: {str(e)}")
                
    def test_delete_expense(self):
        """Test deleting an expense"""
        if not self.created_expense_ids:
            self.log_test("Delete Expense", False, "No expense ID available for deletion test")
            return
            
        expense_id = self.created_expense_ids[0]
        
        try:
            # Test deleting existing expense
            response = requests.delete(f"{API_BASE}/expenses/{expense_id}", timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    self.log_test("Delete Expense", True, f"Expense deleted successfully: {result['message']}")
                    self.created_expense_ids.remove(expense_id)
                else:
                    self.log_test("Delete Expense", False, f"Unexpected response format: {result}")
            else:
                self.log_test("Delete Expense", False, f"HTTP {response.status_code}: {response.text}")
                
            # Test deleting non-existent expense
            fake_id = str(uuid.uuid4())
            response = requests.delete(f"{API_BASE}/expenses/{fake_id}", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Delete Non-existent Expense", True, "Correctly returned 404 for non-existent expense")
            else:
                self.log_test("Delete Non-existent Expense", False, f"Expected 404, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Delete Expense", False, f"Connection error: {str(e)}")
            
    def cleanup(self):
        """Clean up any remaining test expenses"""
        for expense_id in self.created_expense_ids:
            try:
                requests.delete(f"{API_BASE}/expenses/{expense_id}", timeout=5)
            except:
                pass
                
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Backend API Tests")
        print(f"📍 Testing against: {API_BASE}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_health_check()
        self.test_get_categories()
        self.test_create_expense_valid()
        self.test_get_expenses()
        self.test_summary_endpoints()
        self.test_invalid_expense_data()
        self.test_delete_expense()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {total - passed}")
        print(f"📈 Success Rate: {(passed/total)*100:.1f}%")
        
        if passed < total:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
                    
        return passed == total

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)