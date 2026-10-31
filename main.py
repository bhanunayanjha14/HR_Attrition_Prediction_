from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import pandas as pd

app = FastAPI(
    title="Employee Attrition Prediction API",
    description="RandomForest model par based prediction API",
    version="1.0"
)

# Frontend (HTML/JS) se API call allow karne ke liye CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = joblib.load("Employee_Attrition_Model.joblib")
except Exception as e:
    model = None
    print(f"Model load nahi ho paya: {e}")


FEATURE_NAMES = [
    "Age", "DailyRate", "DistanceFromHome", "Education", "EmployeeCount",
    "EmployeeNumber", "EnvironmentSatisfaction", "Gender", "HourlyRate",
    "JobInvolvement", "JobLevel", "JobSatisfaction", "MonthlyIncome",
    "MonthlyRate", "NumCompaniesWorked", "OverTime", "PercentSalaryHike",
    "PerformanceRating", "RelationshipSatisfaction", "StandardHours",
    "StockOptionLevel", "TotalWorkingYears", "TrainingTimesLastYear",
    "WorkLifeBalance", "YearsAtCompany", "YearsInCurrentRole",
    "YearsSinceLastPromotion", "YearsWithCurrManager", "Non-Travel",
    "Travel_Frequently", "Travel_Rarely", "Department_Human Resources",
    "Department_Research & Development", "Department_Sales",
    "Education_Human Resources", "Education_Life Sciences",
    "Education_Marketing", "Education_Medical", "Education_Other",
    "Education_Technical Degree", "Role_Healthcare Representative",
    "Role_Human Resources", "Role_Laboratory Technician", "Role_Manager",
    "Role_Manufacturing Director", "Role_Research Director",
    "Role_Research Scientist", "Role_Sales Executive",
    "Role_Sales Representative", "Status_Divorced", "Status_Married",
    "Status_Single", "ExperienceBand_6–10 Years",
    "ExperienceBand_11–20 Years", "ExperienceBand_20+ Years"
]

# Pydantic schema input data validation ke liye
class EmployeeData(BaseModel):
    Age: float = 30.0
    DailyRate: float = 800.0
    DistanceFromHome: float = 5.0
    Education: float = 3.0
    EmployeeCount: float = 1.0
    EmployeeNumber: float = 1.0
    EnvironmentSatisfaction: float = 3.0
    Gender: float = 1.0  # e.g., 0 for Female, 1 for Male
    HourlyRate: float = 60.0
    JobInvolvement: float = 3.0
    JobLevel: float = 2.0
    JobSatisfaction: float = 3.0
    MonthlyIncome: float = 5000.0
    MonthlyRate: float = 15000.0
    NumCompaniesWorked: float = 2.0
    OverTime: float = 0.0  # 0 for No, 1 for Yes
    PercentSalaryHike: float = 15.0
    PerformanceRating: float = 3.0
    RelationshipSatisfaction: float = 3.0
    StandardHours: float = 80.0
    StockOptionLevel: float = 1.0
    TotalWorkingYears: float = 8.0
    TrainingTimesLastYear: float = 2.0
    WorkLifeBalance: float = 3.0
    YearsAtCompany: float = 5.0
    YearsInCurrentRole: float = 3.0
    YearsSinceLastPromotion: float = 1.0
    YearsWithCurrManager: float = 2.0
    
    # One-hot encoded features
    Non_Travel: int = Field(0, alias="Non-Travel")
    Travel_Frequently: int = 0
    Travel_Rarely: int = 1
    
    Department_Human_Resources: int = Field(0, alias="Department_Human Resources")
    Department_Research_Development: int = Field(1, alias="Department_Research & Development")
    Department_Sales: int = 0
    
    Education_Human_Resources: int = Field(0, alias="Education_Human Resources")
    Education_Life_Sciences: int = Field(1, alias="Education_Life Sciences")
    Education_Marketing: int = 0
    Education_Medical: int = 0
    Education_Other: int = 0
    Education_Technical_Degree: int = Field(0, alias="Education_Technical Degree")
    
    Role_Healthcare_Representative: int = Field(0, alias="Role_Healthcare Representative")
    Role_Human_Resources: int = Field(0, alias="Role_Human Resources")
    Role_Laboratory_Technician: int = Field(0, alias="Role_Laboratory Technician")
    Role_Manager: int = 0
    Role_Manufacturing_Director: int = Field(0, alias="Role_Manufacturing Director")
    Role_Research_Director: int = Field(0, alias="Role_Research Director")
    Role_Research_Scientist: int = Field(1, alias="Role_Research Scientist")
    Role_Sales_Executive: int = Field(0, alias="Role_Sales Executive")
    Role_Sales_Representative: int = Field(0, alias="Role_Sales Representative")
    
    Status_Divorced: int = 0
    Status_Married: int = 1
    Status_Single: int = 0
    
    ExperienceBand_6_10_Years: int = Field(1, alias="ExperienceBand_6–10 Years")
    ExperienceBand_11_20_Years: int = Field(0, alias="ExperienceBand_11–20 Years")
    ExperienceBand_20_Plus_Years: int = Field(0, alias="ExperienceBand_20+ Years")

    class Config:
        populate_by_name = True


@app.get("/")
def home():
    return {"status": "Active", "message": "ML Model Prediction API taiyar hai"}


@app.post("/predict")
def predict_attrition(data: EmployeeData):
    if model is None:
        raise HTTPException(status_code=500, detail="Model file load nahi hui hai.")
    
    # Input data ko dictionary me convert karke correct order me arrange karna
    input_dict = data.model_dump(by_alias=True)
    features_ordered = [input_dict[col] for col in FEATURE_NAMES]
    
    # DataFrame banake input tayyar karna taaki feature names match rahein
    input_df = pd.DataFrame([features_ordered], columns=FEATURE_NAMES)
    
    try:
        prediction = model.predict(input_df)[0]
        prediction_proba = model.predict_proba(input_df)[0].tolist()
        
        result_label = "Attrition: Yes" if int(prediction) == 1 else "Attrition: No"
        
        return {
            "prediction": int(prediction),
            "label": result_label,
            "probabilities": {
                "stay": round(prediction_proba[0], 4),
                "leave": round(prediction_proba[1], 4)
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(err)}")