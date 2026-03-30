from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("expenses.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            amount REAL,
            category TEXT,
            username TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS Budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            monthly_budget REAL
        )
    """)
    conn.commit()
    try:
        cursor.execute("ALTER TABLE Expenses ADD COLUMN date TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    conn.close()

init_db()

class UserLogin(BaseModel):
    username: str
    password: str

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: str
    username: str
    date: str

class BudgetSet(BaseModel):
    username: str
    monthly_budget: float

@app.post("/login")
def login(user: UserLogin):
    if user.username != "admin" or user.password != "admin123":
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users WHERE username=?", (user.username,))
    existing_user = cursor.fetchone()
    if not existing_user:
        cursor.execute("INSERT INTO Users (username) VALUES (?)", (user.username,))
        conn.commit()
    conn.close()
    return {"message": "Login successful", "username": user.username}

@app.post("/add-expense")
def add_expense(expense: ExpenseCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO Expenses (title, amount, category, username, date) VALUES (?, ?, ?, ?, ?)",
                   (expense.title, expense.amount, expense.category, expense.username, expense.date))
    conn.commit()
    conn.close()
    return {"message": "Expense added successfully"}

@app.delete("/expense/{expense_id}")
def delete_expense(expense_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Expenses WHERE id=?", (expense_id,))
    conn.commit()
    conn.close()
    return {"message": "Expense deleted"}

@app.put("/expense/{expense_id}")
def update_expense(expense_id: int, expense: ExpenseCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE Expenses SET title=?, amount=?, category=?, date=? WHERE id=? AND username=?",
                   (expense.title, expense.amount, expense.category, expense.date, expense_id, expense.username))
    conn.commit()
    conn.close()
    return {"message": "Expense updated"}

@app.get("/expenses")
def get_expenses(username: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, amount, category, username, COALESCE(date, date('now')) as date FROM Expenses WHERE username=?", (username,))
    expenses = cursor.fetchall()
    conn.close()
    return [dict(e) for e in expenses]

@app.post("/set-budget")
def set_budget(budget: BudgetSet):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Budget WHERE username=?", (budget.username,))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("UPDATE Budget SET monthly_budget=? WHERE username=?", (budget.monthly_budget, budget.username))
    else:
        cursor.execute("INSERT INTO Budget (username, monthly_budget) VALUES (?, ?)", (budget.username, budget.monthly_budget))
    conn.commit()
    conn.close()
    return {"message": "Budget set successfully"}

@app.get("/budget")
def get_budget(username: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT monthly_budget FROM Budget WHERE username=?", (username,))
    budget = cursor.fetchone()
    conn.close()
    if budget:
        return {"monthly_budget": budget["monthly_budget"]}
    return {"monthly_budget": 0.0}
