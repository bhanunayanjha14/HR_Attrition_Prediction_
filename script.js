document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("attritionForm");
  const resetBtn = document.getElementById("resetBtn");
  const placeholderView = document.getElementById("placeholderView");
  const resultContent = document.getElementById("resultContent");
  const loading = document.getElementById("loading");
  const errorAlert = document.getElementById("errorAlert");

  const statusBadge = document.getElementById("statusBadge");
  const leavePercentage = document.getElementById("leavePercentage");
  const stayBar = document.getElementById("stayBar");
  const leaveBar = document.getElementById("leaveBar");
  const stayProb = document.getElementById("stayProb");
  const leaveProb = document.getElementById("leaveProb");
  const insightBox = document.getElementById("insightBox");

  const API_ENDPOINT = "https://hr-attrition-prediction-2isj.onrender.com/predict";

  // Form Submit Handler
  form.addEventListener("submit", async (e) => {
    // Page reload rokna
    e.preventDefault();
    e.stopPropagation();

    // Loading State
    errorAlert.classList.add("hidden");
    placeholderView.classList.add("hidden");
    resultContent.classList.add("hidden");
    loading.classList.remove("hidden");

    try {
      const payload = constructPayload();

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Server communication failed");
      }

      const data = await response.json();
      displayResults(data);
    } catch (err) {
      errorAlert.textContent = `Server Error: ${err.message}. Please check your internet connection or backend server.`;
      errorAlert.classList.remove("hidden");
      placeholderView.classList.remove("hidden");
    } finally {
      loading.classList.add("hidden");
    }
  });

  // Dedicated Reset Button Handler
  resetBtn.addEventListener("click", () => {
    form.reset();
    resultContent.classList.add("hidden");
    errorAlert.classList.add("hidden");
    loading.classList.add("hidden");
    placeholderView.classList.remove("hidden");
  });

  function constructPayload() {
    const totalYears = parseFloat(document.getElementById("TotalWorkingYears").value) || 0;
    const num = (id) => parseFloat(document.getElementById(id).value) || 0;

    const dept = document.getElementById("Department").value;
    const role = document.getElementById("Role").value;
    const edu = document.getElementById("EducationField").value;
    const status = document.getElementById("MaritalStatus").value;
    const travel = document.getElementById("BusinessTravel").value;

    return {
      Age: num("Age"),
      DailyRate: num("DailyRate"),
      DistanceFromHome: num("DistanceFromHome"),
      Education: num("Education"),
      EmployeeCount: 1.0,
      EmployeeNumber: 1.0,
      EnvironmentSatisfaction: num("EnvironmentSatisfaction"),
      Gender: num("Gender"),
      HourlyRate: num("HourlyRate"),
      JobInvolvement: num("JobInvolvement"),
      JobLevel: num("JobLevel"),
      JobSatisfaction: num("JobSatisfaction"),
      MonthlyIncome: num("MonthlyIncome"),
      MonthlyRate: num("MonthlyRate"),
      NumCompaniesWorked: num("NumCompaniesWorked"),
      OverTime: num("OverTime"),
      PercentSalaryHike: num("PercentSalaryHike"),
      PerformanceRating: num("PerformanceRating"),
      RelationshipSatisfaction: num("RelationshipSatisfaction"),
      StandardHours: 80.0,
      StockOptionLevel: num("StockOptionLevel"),
      TotalWorkingYears: totalYears,
      TrainingTimesLastYear: num("TrainingTimesLastYear"),
      WorkLifeBalance: num("WorkLifeBalance"),
      YearsAtCompany: num("YearsAtCompany"),
      YearsInCurrentRole: num("YearsInCurrentRole"),
      YearsSinceLastPromotion: num("YearsSinceLastPromotion"),
      YearsWithCurrManager: num("YearsWithCurrManager"),

      // Business travel encoded
      "Non-Travel": travel === "Non-Travel" ? 1 : 0,
      "Travel_Frequently": travel === "Travel_Frequently" ? 1 : 0,
      "Travel_Rarely": travel === "Travel_Rarely" ? 1 : 0,

      // Department encoded
      "Department_Human Resources": dept === "Department_Human Resources" ? 1 : 0,
      "Department_Research & Development": dept === "Department_Research & Development" ? 1 : 0,
      "Department_Sales": dept === "Department_Sales" ? 1 : 0,

      // Education field encoded
      "Education_Human Resources": edu === "Education_Human Resources" ? 1 : 0,
      "Education_Life Sciences": edu === "Education_Life Sciences" ? 1 : 0,
      "Education_Marketing": edu === "Education_Marketing" ? 1 : 0,
      "Education_Medical": edu === "Education_Medical" ? 1 : 0,
      "Education_Other": edu === "Education_Other" ? 1 : 0,
      "Education_Technical Degree": edu === "Education_Technical Degree" ? 1 : 0,

      // Role encoded
      "Role_Healthcare Representative": role === "Role_Healthcare Representative" ? 1 : 0,
      "Role_Human Resources": role === "Role_Human Resources" ? 1 : 0,
      "Role_Laboratory Technician": role === "Role_Laboratory Technician" ? 1 : 0,
      "Role_Manager": role === "Role_Manager" ? 1 : 0,
      "Role_Manufacturing Director": role === "Role_Manufacturing Director" ? 1 : 0,
      "Role_Research Director": role === "Role_Research Director" ? 1 : 0,
      "Role_Research Scientist": role === "Role_Research Scientist" ? 1 : 0,
      "Role_Sales Executive": role === "Role_Sales Executive" ? 1 : 0,
      "Role_Sales Representative": role === "Role_Sales Representative" ? 1 : 0,

      // Marital status encoded
      "Status_Divorced": status === "Status_Divorced" ? 1 : 0,
      "Status_Married": status === "Status_Married" ? 1 : 0,
      "Status_Single": status === "Status_Single" ? 1 : 0,

      // Experience band derived
      "ExperienceBand_6–10 Years": (totalYears >= 6 && totalYears <= 10) ? 1 : 0,
      "ExperienceBand_11–20 Years": (totalYears >= 11 && totalYears <= 20) ? 1 : 0,
      "ExperienceBand_20+ Years": (totalYears > 20) ? 1 : 0
    };
  }

  function displayResults(data) {
    const isAtRisk = data.prediction === 1;
    const leavePct = (data.probabilities.leave * 100).toFixed(1);
    const stayPct = (data.probabilities.stay * 100).toFixed(1);

    if (isAtRisk) {
      statusBadge.textContent = "HIGH ATTRITION RISK";
      statusBadge.className = "status-chip danger";
      leavePercentage.style.color = "var(--danger)";
    } else {
      statusBadge.textContent = "LOW ATTRITION RISK";
      statusBadge.className = "status-chip safe";
      leavePercentage.style.color = "var(--safe)";
    }

    leavePercentage.textContent = `${leavePct}%`;
    stayProb.textContent = `${stayPct}%`;
    leaveProb.textContent = `${leavePct}%`;

    stayBar.style.width = `${stayPct}%`;
    leaveBar.style.width = `${leavePct}%`;

    if (isAtRisk) {
      insightBox.innerHTML = `<strong>⚠️ Action Required:</strong> High likelihood of attrition detected. Consider reviewing compensation alignment, work-life balance scores, and recent promotion intervals.`;
    } else {
      insightBox.innerHTML = `<strong>✅ Stable Tenure:</strong> High probability of retention. The employee's metrics align positively with organizational satisfaction and career stability.`;
    }

    // Result ko hold karke display karna
    resultContent.classList.remove("hidden");
  }
});