from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import List, Optional
import os
from dotenv import load_dotenv
import uuid
import json
from bson import ObjectId

# Load environment variables
load_dotenv()

app = FastAPI(title="Personal Finance Tracker", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "finance_tracker")

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
expenses_collection = db.expenses
categories_collection = db.categories
users_collection = db.users
budgets_collection = db.budgets  # NEW

# Security
security = HTTPBearer()

# Pydantic models
class ExpenseCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be positive")
    category: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=200)
    date: datetime = Field(default_factory=datetime.now)

class ExpenseResponse(BaseModel):
    id: str
    amount: float
    category: str
    description: Optional[str]
    date: datetime

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., pattern=r'^#[0-9A-Fa-f]{6}$')
    icon: Optional[str] = Field(None, max_length=50)

class CategoryResponse(BaseModel):
    id: str
    name: str
    color: str
    icon: Optional[str]

class SpendingSummary(BaseModel):
    total_amount: float
    expense_count: int
    top_categories: List[dict]

# Budget Models
class BudgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    amount: float = Field(..., gt=0)
    category: Optional[str] = Field(None, max_length=50)
    user_id: Optional[str] = None

class BudgetResponse(BaseModel):
    id: str
    name: str
    amount: float
    spent: float
    category: Optional[str]
    user_id: Optional[str]

# Utility functions
def expense_to_dict(expense) -> dict:
    return {
        "id": str(expense["_id"]),
        "amount": expense["amount"],
        "category": expense["category"],
        "description": expense.get("description"),
        "date": expense["date"]
    }

def category_to_dict(category) -> dict:
    return {
        "id": str(category["_id"]),
        "name": category["name"],
        "color": category["color"],
        "icon": category.get("icon")
    }

def budget_to_dict(budget) -> dict:
    return {
        "id": str(budget["_id"]),
        "name": budget["name"],
        "amount": budget["amount"],
        "spent": budget.get("spent", 0),
        "category": budget.get("category"),
        "user_id": budget.get("user_id"),
    }

# Initialize default categories
@app.on_event("startup")
async def startup_event():
    # Check if categories exist, if not create default ones
    if categories_collection.count_documents({}) == 0:
        default_categories = [
            {"_id": str(uuid.uuid4()), "name": "Food", "color": "#FF6B6B", "icon": "🍔"},
            {"_id": str(uuid.uuid4()), "name": "Transportation", "color": "#4ECDC4", "icon": "🚗"},
            {"_id": str(uuid.uuid4()), "name": "Entertainment", "color": "#45B7D1", "icon": "🎬"},
            {"_id": str(uuid.uuid4()), "name": "Shopping", "color": "#96CEB4", "icon": "🛍️"},
            {"_id": str(uuid.uuid4()), "name": "Bills", "color": "#FFEAA7", "icon": "💡"},
            {"_id": str(uuid.uuid4()), "name": "Healthcare", "color": "#DDA0DD", "icon": "🏥"},
            {"_id": str(uuid.uuid4()), "name": "Other", "color": "#B0B0B0", "icon": "📝"}
        ]
        categories_collection.insert_many(default_categories)

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

@app.post("/api/expenses", response_model=ExpenseResponse)
async def create_expense(expense: ExpenseCreate):
    try:
        expense_data = {
            "_id": str(uuid.uuid4()),
            "amount": expense.amount,
            "category": expense.category,
            "description": expense.description,
            "date": expense.date,
            "created_at": datetime.now()
        }
        
        result = expenses_collection.insert_one(expense_data)
        if result.inserted_id:
            return ExpenseResponse(**expense_to_dict(expense_data))
        else:
            raise HTTPException(status_code=500, detail="Failed to create expense")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    limit: int = 100
):
    try:
        query = {}
        
        if start_date and end_date:
            query["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            query["date"] = {"$gte": start_date}
        elif end_date:
            query["date"] = {"$lte": end_date}
            
        if category:
            query["category"] = category
            
        expenses = list(expenses_collection.find(query).sort("date", -1).limit(limit))
        return [ExpenseResponse(**expense_to_dict(expense)) for expense in expenses]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/expenses/summary/day", response_model=SpendingSummary)
async def get_daily_summary():
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        
        pipeline = [
            {"$match": {"date": {"$gte": today, "$lt": tomorrow}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "expense_count": {"$sum": 1}
            }}
        ]
        
        result = list(expenses_collection.aggregate(pipeline))
        
        # Get top categories for today
        category_pipeline = [
            {"$match": {"date": {"$gte": today, "$lt": tomorrow}}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 5}
        ]
        
        top_categories = list(expenses_collection.aggregate(category_pipeline))
        
        return SpendingSummary(
            total_amount=result[0]["total_amount"] if result else 0,
            expense_count=result[0]["expense_count"] if result else 0,
            top_categories=[{
                "category": cat["_id"],
                "amount": cat["total"],
                "count": cat["count"]
            } for cat in top_categories]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/expenses/summary/week", response_model=SpendingSummary)
async def get_weekly_summary():
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=7)
        
        pipeline = [
            {"$match": {"date": {"$gte": week_start, "$lt": week_end}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "expense_count": {"$sum": 1}
            }}
        ]
        
        result = list(expenses_collection.aggregate(pipeline))
        
        # Get top categories for this week
        category_pipeline = [
            {"$match": {"date": {"$gte": week_start, "$lt": week_end}}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 5}
        ]
        
        top_categories = list(expenses_collection.aggregate(category_pipeline))
        
        return SpendingSummary(
            total_amount=result[0]["total_amount"] if result else 0,
            expense_count=result[0]["expense_count"] if result else 0,
            top_categories=[{
                "category": cat["_id"],
                "amount": cat["total"],
                "count": cat["count"]
            } for cat in top_categories]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/expenses/summary/month", response_model=SpendingSummary)
async def get_monthly_summary():
    try:
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = today.replace(day=1)
        next_month = month_start + timedelta(days=32)
        month_end = next_month.replace(day=1)
        
        pipeline = [
            {"$match": {"date": {"$gte": month_start, "$lt": month_end}}},
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "expense_count": {"$sum": 1}
            }}
        ]
        
        result = list(expenses_collection.aggregate(pipeline))
        
        # Get top categories for this month
        category_pipeline = [
            {"$match": {"date": {"$gte": month_start, "$lt": month_end}}},
            {"$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 5}
        ]
        
        top_categories = list(expenses_collection.aggregate(category_pipeline))
        
        return SpendingSummary(
            total_amount=result[0]["total_amount"] if result else 0,
            expense_count=result[0]["expense_count"] if result else 0,
            top_categories=[{
                "category": cat["_id"],
                "amount": cat["total"],
                "count": cat["count"]
            } for cat in top_categories]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories", response_model=List[CategoryResponse])
async def get_categories():
    try:
        categories = list(categories_collection.find({}))
        return [CategoryResponse(**category_to_dict(category)) for category in categories]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/categories", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    try:
        # Check if category already exists
        existing = categories_collection.find_one({"name": category.name})
        if existing:
            raise HTTPException(status_code=400, detail="Category already exists")
            
        category_data = {
            "_id": str(uuid.uuid4()),
            "name": category.name,
            "color": category.color,
            "icon": category.icon,
            "created_at": datetime.now()
        }
        
        result = categories_collection.insert_one(category_data)
        if result.inserted_id:
            return CategoryResponse(**category_to_dict(category_data))
        else:
            raise HTTPException(status_code=500, detail="Failed to create category")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    try:
        result = expenses_collection.delete_one({"_id": expense_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
        return {"message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Budget Endpoints
@app.get("/api/budgets", response_model=List[BudgetResponse])
async def get_budgets(user_id: Optional[str] = None):
    try:
        query = {"user_id": user_id} if user_id else {}
        budgets = list(budgets_collection.find(query))
        return [BudgetResponse(**budget_to_dict(b)) for b in budgets]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/budgets", response_model=BudgetResponse)
async def create_budget(budget: BudgetCreate):
    try:
        budget_data = {
            "_id": str(uuid.uuid4()),
            "name": budget.name,
            "amount": budget.amount,
            "spent": 0,
            "category": budget.category,
            "user_id": budget.user_id,
            "created_at": datetime.now(),
        }
        result = budgets_collection.insert_one(budget_data)
        if result.inserted_id:
            return BudgetResponse(**budget_to_dict(budget_data))
        else:
            raise HTTPException(status_code=500, detail="Failed to create budget")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, budget: BudgetCreate):
    try:
        update_data = {
            "name": budget.name,
            "amount": budget.amount,
            "category": budget.category,
            "user_id": budget.user_id,
        }
        result = budgets_collection.update_one({"_id": budget_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Budget not found")
        updated = budgets_collection.find_one({"_id": budget_id})
        return BudgetResponse(**budget_to_dict(updated))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    try:
        result = budgets_collection.delete_one({"_id": budget_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Budget not found")
        return {"message": "Budget deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)