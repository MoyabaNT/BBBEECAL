import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import OwnershipDetails from './OwnershipDetails';
import ManagementControl from './ManagementControl';
import EmploymentEquity from './EmploymentEquity';
import Yes4YouthInitiative from './Yes4YouthInitiative';
import SkillsDevelopment from "./SkillsDevelopment";
import SupplierDevelopment from "./SupplierDevelopment";
import EnterpriseDevelopment from './EnterpriseDevelopment';
import SocioEconomicDevelopment from "./SocioEconomicDevelopment";
import Results from './Results';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [financialData, setFinancialData] = useState({
    companyName: '',
    yearEnd: '',
    sector: '',
    turnover: 0,
    npbt: 0,
    npat: 0,
    salaries: 0,
    wages: 0,
    directorsEmoluments: 0,
    annualPayroll: 0,
    expenses: 0,
    costOfSales: 0,
    depreciation: 0,
    sdlPayments: 0,
    totalLeviableAmount: 0,
    totalMeasuredProcurementSpend: 0,
  });

  const [originalData, setOriginalData] = useState({ companyName: '', sector: '' });
  const [isDirty, setIsDirty] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showYesModal, setShowYesModal] = useState(false);
  const [showSkillsDevelopmentModal, setShowSkillsDevelopmentModal] = useState(false);
  const [showSupplierDevelopmentModal, setShowSupplierDevelopmentModal] = useState(false);
  const [showEnterpriseDevelopmentModal, setShowEnterpriseDevelopmentModal] = useState(false);
  const [showSocioEconomicDevelopmentModal, setShowSocioEconomicDevelopmentModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [results, setResults] = useState(null);
  const [ownershipDetails, setOwnershipDetails] = useState(null);
  const [managementDetails, setManagementDetails] = useState(null);
  const [employmentDetails, setEmploymentDetails] = useState(null);
  const [yesDetails, setYesDetails] = useState(null);
  const [skillsDevelopmentDetails, setSkillsDevelopmentDetails] = useState(null);
  const [supplierDevelopmentDetails, setSupplierDevelopmentDetails] = useState(null);
  const [enterpriseDevelopmentDetails, setEnterpriseDevelopmentDetails] = useState(null);
  const [socioEconomicDevelopmentDetails, setSocioEconomicDevelopmentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Format Firestore Timestamp to DD/MMM/YYYY
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      let date;
      if (timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp.toDate) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      if (isNaN(date.getTime())) throw new Error("Invalid date");
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid Date";
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async (uid) => {
    try {
      console.log("Fetching profile for UID:", uid);
      const idToken = localStorage.getItem("idToken");
      if (!idToken) {
        throw new Error("No authentication token found. Please log in again.");
      }
      const response = await fetch(`http://localhost:5000/get-profile?uid=${uid}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}, ${errorData.error || "Unknown error"}`);
      }
      const data = await response.json();
      setFinancialData((prevData) => ({
        ...prevData,
        companyName: data.businessName || prevData.companyName,
        yearEnd: data.financialYearEnd ? formatDate(data.financialYearEnd) : prevData.yearEnd,
        sector: data.sector || prevData.sector,
      }));
      setOriginalData({
        companyName: data.businessName || financialData.companyName,
        sector: data.sector || financialData.sector,
      });
    } catch (err) {
      console.error("Fetch profile error:", err.message);
      setError(`Failed to fetch profile data: ${err.message}`);
    }
  };

  // Save profile changes to backend
  const handleSave = async () => {
    try {
      const payload = {
        uid: userId,
        businessName: financialData.companyName,
        sector: financialData.sector,
      };
      const res = await fetch("http://localhost:5000/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Failed to save changes: ${res.status} ${res.statusText}, ${errorData.error || "Unknown error"}`);
      }
      setOriginalData({
        companyName: financialData.companyName,
        sector: financialData.sector,
      });
      setIsDirty(false);
    } catch (err) {
      console.error("Error saving profile:", err.message);
      setError(`Failed to save changes: ${err.message}`);
    }
  };

  // Initialize user data
  useEffect(() => {
    const userData = location.state?.userData;
    const idToken = localStorage.getItem("idToken");
    const storedUid = localStorage.getItem("uid");

    if (!userData || !userData.uid || !idToken || !storedUid) {
      setError("Please log in to continue.");
      setLoading(false);
      navigate("/Login", { replace: true });
      return;
    }

    const refreshToken = async () => {
      try {
        const uid = localStorage.getItem("uid");
        const idToken = localStorage.getItem("idToken");
        if (!uid || !idToken) {
          throw new Error("No UID or token found");
        }
        const res = await fetch("http://localhost:5000/refresh-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ uid }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to refresh token");
        }
        localStorage.setItem("idToken", data.idToken);
      } catch (err) {
        console.error("Token refresh error:", err.message);
        localStorage.removeItem("idToken");
        localStorage.removeItem("uid");
        navigate("/Login", { replace: true });
      }
    };

    const tokenRefreshInterval = setInterval(refreshToken, 50 * 60 * 1000);

    const initializeData = async () => {
      try {
        setUserId(userData.uid);
        const formattedYearEnd = userData.financialYearEnd
          ? formatDate(userData.financialYearEnd)
          : "";
        const initialData = {
          companyName: userData.businessName || "",
          yearEnd: formattedYearEnd || "",
          sector: userData.sector || "",
        };
        setFinancialData((prevData) => ({
          ...prevData,
          ...initialData,
        }));
        setOriginalData({ companyName: initialData.companyName, sector: initialData.sector });
        await fetchUserProfile(userData.uid);
      } catch (err) {
        console.error("Error processing data:", err);
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    return () => clearInterval(tokenRefreshInterval);
  }, [location, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFinancialData((prevData) => {
      const newData = {
        ...prevData,
        [name]: name === "yearEnd" || name === "sector" ? value : Number(value) || 0,
      };
      setIsDirty(
        newData.companyName !== originalData.companyName ||
        newData.sector !== originalData.sector
      );
      return newData;
    });
  };

  const startNewAssessment = () => {
    setFinancialData({
      companyName: originalData.companyName || '',
      yearEnd: '',
      sector: originalData.sector || '',
      turnover: 0,
      npbt: 0,
      npat: 0,
      salaries: 0,
      wages: 0,
      directorsEmoluments: 0,
      annualPayroll: 0,
      expenses: 0,
      costOfSales: 0,
      depreciation: 0,
      sdlPayments: 0,
      totalLeviableAmount: 0,
      totalMeasuredProcurementSpend: 0,
    });
    setOwnershipDetails(null);
    setManagementDetails(null);
    setEmploymentDetails(null);
    setYesDetails(null);
    setSkillsDevelopmentDetails(null);
    setSupplierDevelopmentDetails(null);
    setEnterpriseDevelopmentDetails(null);
    setSocioEconomicDevelopmentDetails(null);
    setResults(null);
    setIsDirty(false);
    setAssessmentStarted(true);
    setActiveSection(null);
  };

  const loadSavedAssessment = () => {
    setFinancialData((prevData) => ({
      ...prevData,
      turnover: 1000000,
      npbt: 200000,
      npat: 150000,
      sdlPayments: 50000,
      totalLeviableAmount: 1000000,
      totalMeasuredProcurementSpend: 800000,
    }));
    setOwnershipDetails({ ownershipData: { blackOwnershipPercentage: 25 } });
    setManagementDetails({ managementData: { blackVotingRights: 30, blackEconomicInterest: 20 } });
    setSkillsDevelopmentDetails({ summary: { totalDirectExpenditure: 60000, totalTrainings: 10 } });
    setAssessmentStarted(true);
    setActiveSection(null);
  };

  const handleOwnershipSubmit = (data) => {
    setOwnershipDetails(data);
    setShowOwnershipModal(false);
  };

  const handleManagementSubmit = (data) => {
    setManagementDetails(data);
    setShowManagementModal(false);
  };

  const handleEmploymentSubmit = (data) => {
    setEmploymentDetails(data);
    setShowEmploymentModal(false);
  };

  const handleYesSubmit = (data) => {
    setYesDetails(data);
    setShowYesModal(false);
  };

  const handleSkillsDevelopmentSubmit = (data) => {
    setSkillsDevelopmentDetails(data);
    setShowSkillsDevelopmentModal(false);
  };

  const handleSupplierDevelopmentSubmit = (data) => {
    setSupplierDevelopmentDetails(data);
    setShowSupplierDevelopmentModal(false);
  };

  const handleEnterpriseDevelopmentSubmit = (data) => {
    setEnterpriseDevelopmentDetails(data);
    setShowEnterpriseDevelopmentModal(false);
  };

  const handleSocioEconomicDevelopmentSubmit = (data) => {
    setSocioEconomicDevelopmentDetails(data);
    setShowSocioEconomicDevelopmentModal(false);
  };

  const sectorScorecards = {
    Generic: {
      ownership: { weight: 25, target: 0.25 },
      managementControl: { weight: 19, target: 0.5 },
      skillsDevelopment: { weight: 20, target: 0.06 },
      esd: { weight: 30, targetSupplier: 0.1, targetEnterprise: 0.01 },
      socioEconomicDevelopment: { weight: 5, target: 0.01 },
      yesBonus: { weight: 5 },
      totalWeight: 99,
    },
    Tourism: {
      ownership: { weight: 27, target: 0.3 },
      managementControl: { weight: 15, target: 0.6 },
      skillsDevelopment: { weight: 20, target: 0.08 },
      esd: { weight: 30, targetSupplier: 0.15, targetEnterprise: 0.015 },
      socioEconomicDevelopment: { weight: 8, target: 0.015 },
      yesBonus: { weight: 5 },
      totalWeight: 100,
    },
    Construction: {
      ownership: { weight: 25, target: 0.32 },
      managementControl: { weight: 17, target: 0.5 },
      skillsDevelopment: { weight: 21, target: 0.06 },
      esd: { weight: 30, targetSupplier: 0.12, targetEnterprise: 0.01 },
      socioEconomicDevelopment: { weight: 5, target: 0.01 },
      yesBonus: { weight: 5 },
      totalWeight: 98,
    },
    ICT: {
      ownership: { weight: 25, target: 0.3 },
      managementControl: { weight: 19, target: 0.5 },
      skillsDevelopment: { weight: 22, target: 0.07 },
      esd: { weight: 30, targetSupplier: 0.1, targetEnterprise: 0.01 },
      socioEconomicDevelopment: { weight: 5, target: 0.01 },
      yesBonus: { weight: 5 },
      totalWeight: 101,
    },
  };

  const calculateBBBEEScore = () => {
    const sector = financialData.sector || 'Generic';
    const scorecard = sectorScorecards[sector] || sectorScorecards.Generic;

    let ownershipScore = 0;
    let managementControlScore = 0;
    let skillsDevelopmentScore = 0;
    let esdScore = 0;
    let socioEconomicDevelopmentScore = 0;
    let yesBonusPoints = 0;

    if (ownershipDetails?.ownershipData) {
      const blackOwnership = ownershipDetails.ownershipData.blackOwnershipPercentage || 0;
      const ownershipRatio = blackOwnership / 100 / scorecard.ownership.target;
      ownershipScore = Math.min(ownershipRatio * scorecard.ownership.weight, scorecard.ownership.weight);
    }

    if (managementDetails?.managementData) {
      const blackVotingRights = managementDetails.managementData.blackVotingRights || 0;
      const blackEconomicInterest = managementDetails.managementData.blackEconomicInterest || 0;
      const avgRepresentation = (blackVotingRights + blackEconomicInterest) / 2 / 100;
      const managementRatio = avgRepresentation / scorecard.managementControl.target;
      managementControlScore = Math.min(managementRatio * scorecard.managementControl.weight, scorecard.managementControl.weight);
    }

    if (skillsDevelopmentDetails?.summary) {
      const totalExpenditure = skillsDevelopmentDetails.summary.totalDirectExpenditure || 0;
      const targetSpend = financialData.totalLeviableAmount * scorecard.skillsDevelopment.target;
      const expenditureRatio = targetSpend > 0 ? totalExpenditure / targetSpend : 0;
      skillsDevelopmentScore = Math.min(expenditureRatio * scorecard.skillsDevelopment.weight, scorecard.skillsDevelopment.weight);
    }

    let supplierDevelopmentScore = 0;
    let enterpriseDevelopmentScore = 0;
    const esdWeight = scorecard.esd.weight;
    const supplierWeight = esdWeight / 2;
    const enterpriseWeight = esdWeight / 2;

    if (supplierDevelopmentDetails?.localSummary) {
      const totalProcurementSpend = financialData.totalMeasuredProcurementSpend || 1;
      const blackOwnedSpend = supplierDevelopmentDetails.localSummary.totalExpenditure * 
        (supplierDevelopmentDetails.localSummary.blackOwnedSuppliers / (supplierDevelopmentDetails.localSummary.totalSuppliers || 1));
      const targetSpend = totalProcurementSpend * scorecard.esd.targetSupplier;
      const spendRatio = targetSpend > 0 ? blackOwnedSpend / targetSpend : 0;
      supplierDevelopmentScore = Math.min(spendRatio * supplierWeight, supplierWeight);
    }

    if (enterpriseDevelopmentDetails?.summary) {
      const totalContribution = enterpriseDevelopmentDetails.summary.totalContribution || 0;
      const targetContribution = financialData.npat * scorecard.esd.targetEnterprise;
      const contributionRatio = targetContribution > 0 ? totalContribution / targetContribution : 0;
      enterpriseDevelopmentScore = Math.min(contributionRatio * enterpriseWeight, enterpriseWeight);
    }

    esdScore = supplierDevelopmentScore + enterpriseDevelopmentScore;

    if (socioEconomicDevelopmentDetails?.summary) {
      const totalContribution = socioEconomicDevelopmentDetails.summary.totalContribution || 0;
      const targetContribution = financialData.npat * scorecard.socioEconomicDevelopment.target;
      const contributionRatio = targetContribution > 0 ? totalContribution / targetContribution : 0;
      socioEconomicDevelopmentScore = Math.min(contributionRatio * scorecard.socioEconomicDevelopment.weight, scorecard.socioEconomicDevelopment.weight);
    }

    if (yesDetails?.yesData) {
      const participants = yesDetails.yesData.totalParticipants || 0;
      yesBonusPoints = Math.min(participants * 1, scorecard.yesBonus.weight);
    }

    const totalScore = (
      ownershipScore +
      managementControlScore +
      skillsDevelopmentScore +
      esdScore +
      socioEconomicDevelopmentScore +
      yesBonusPoints
    );

    let bbeeLevel = "Non-compliant";
    let bbeeStatus = "0%";
    const maxScore = scorecard.totalWeight + scorecard.yesBonus.weight;
    if (totalScore >= 100) {
      bbeeLevel = "Level 1";
      bbeeStatus = "135%";
    } else if (totalScore >= 95) {
      bbeeLevel = "Level 2";
      bbeeStatus = "125%";
    } else if (totalScore >= 90) {
      bbeeLevel = "Level 3";
      bbeeStatus = "110%";
    } else if (totalScore >= 80) {
      bbeeLevel = "Level 4";
      bbeeStatus = "100%";
    } else if (totalScore >= 75) {
      bbeeLevel = "Level 5";
      bbeeStatus = "80%";
    } else if (totalScore >= 70) {
      bbeeLevel = "Level 6";
      bbeeStatus = "60%";
    } else if (totalScore >= 55) {
      bbeeLevel = "Level 7";
      bbeeStatus = "50%";
    } else if (totalScore >= 40) {
      bbeeLevel = "Level 8";
      bbeeStatus = "10%";
    }

    setResults({
      sector,
      ownershipScore,
      managementControlScore,
      skillsDevelopmentScore,
      esdScore,
      socioEconomicDevelopmentScore,
      yesBonusPoints,
      totalScore,
      maxScore,
      bbeeLevel,
      bbeeStatus,
      scorecard,
      companyName: financialData.companyName,
      yearEnd: financialData.yearEnd,
      turnover: financialData.turnover,
      npat: financialData.npat,
      totalLeviableAmount: financialData.totalLeviableAmount,
      totalMeasuredProcurementSpend: financialData.totalMeasuredProcurementSpend,
      assessmentType: assessmentStarted ? 'New' : 'Saved',
      skillsDevelopmentExpenditure: skillsDevelopmentDetails?.summary?.totalDirectExpenditure || 0,
      supplierDevelopmentSpend: supplierDevelopmentDetails?.localSummary?.totalExpenditure || 0,
      enterpriseDevelopmentContribution: enterpriseDevelopmentDetails?.summary?.totalContribution || 0,
      socioEconomicContribution: socioEconomicDevelopmentDetails?.summary?.totalContribution || 0,
    });
    setShowResultsModal(true);
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
    setIsSidebarOpen(false);
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(
      ['ownership', 'management', 'employment', 'yes', 'skillsDetails', 'supplier', 'enterprise', 'socioEconomic'].includes(sectionId)
        ? activeSection === sectionId ? null : sectionId
        : null
    );
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => navigate("/Login")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'company', label: 'Company Information' },
    { id: 'financial', label: 'Financial Information', requiresAssessment: true },
    { id: 'skills', label: 'Skills Development', requiresAssessment: true },
    { id: 'procurement', label: 'Procurement', requiresAssessment: true },
    { id: 'ownership', label: 'Ownership Assessment', requiresAssessment: true },
    { id: 'management', label: 'Management Control', requiresAssessment: true },
    { id: 'employment', label: 'Employment Equity', requiresAssessment: true },
    { id: 'yes', label: 'Yes 4 Youth Initiative', requiresAssessment: true },
    { id: 'skillsDetails', label: 'Skills Development Details', requiresAssessment: true },
    { id: 'supplier', label: 'Supplier Development & Imports', requiresAssessment: true },
    { id: 'enterprise', label: 'Enterprise Development', requiresAssessment: true },
    { id: 'socioEconomic', label: 'Socio-Economic Development', requiresAssessment: true },
    { id: 'calculate', label: 'Calculate B-BBEE Score', requiresAssessment: true },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-50`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Navigation</h2>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              (!item.requiresAssessment || assessmentStarted) && (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-md text-sm ${activeSection === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:ml-64">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden mb-4 p-2 bg-blue-600 text-white rounded-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">B-BBEE Calculator Dashboard</h1>
          <p className="text-gray-600 mb-4">Complete your company information to calculate your B-BBEE score</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={startNewAssessment}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Start New Assessment
            </button>
            <button
              onClick={loadSavedAssessment}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Load Saved Assessment
            </button>
          </div>
        </div>

        {/* Non-Grid, Non-Collapsible Sections */}
        <div className="space-y-4 mb-4">
          {/* Company Information */}
          <div id="company" className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={financialData.companyName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Financial Year End</label>
                <input
                  type="text"
                  name="yearEnd"
                  value={financialData.yearEnd}
                  onChange={handleInputChange}
                  placeholder="e.g., 31/Mar/2025"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sector</label>
                <select
                  name="sector"
                  value={financialData.sector}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Sector</option>
                  <option value="Generic">Generic</option>
                  <option value="Tourism">Tourism</option>
                  <option value="Construction">Construction</option>
                  <option value="ICT">ICT</option>
                </select>
              </div>
            </div>
            {isDirty && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {assessmentStarted && (
            <>
              {/* Financial Information */}
              <div id="financial" className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Financial Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: "turnover", label: "Turnover / Revenue (R)", placeholder: "Enter turnover" },
                    { name: "npbt", label: "Net Profit Before Tax (R)", placeholder: "Enter NPBT" },
                    { name: "npat", label: "Net Profit After Tax (R)", placeholder: "Enter NPAT" },
                    { name: "salaries", label: "Salaries (R)", placeholder: "Enter salaries" },
                    { name: "wages", label: "Wages (R)", placeholder: "Enter wages" },
                    { name: "directorsEmoluments", label: "Directors Emoluments (R)", placeholder: "Enter directors emoluments" },
                    { name: "annualPayroll", label: "Annual Payroll (R)", placeholder: "Enter annual payroll" },
                    { name: "expenses", label: "Expenses (R)", placeholder: "Enter expenses" },
                    { name: "costOfSales", label: "Cost of Sales (R)", placeholder: "Enter cost of sales" },
                    { name: "depreciation", label: "Depreciation (R)", placeholder: "Enter depreciation" },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1">{field.label}</label>
                      <input
                        type="number"
                        name="field.name"
                        value={financialData[field.name]}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Development */}
              <div id="skills" className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Skills Development</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total SDL Payments (R)</label>
                    <input
                      type="number"
                      name="sdlPayments"
                      value={financialData.sdlPayments}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Enter SDL payments"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Leviable Amount (R)</label>
                    <input
                      type="number"
                      name="totalLeviableAmount"
                      value={financialData.totalLeviableAmount}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      placeholder="Enter total leviable amount"
                    />
                  </div>
                </div>
              </div>

              {/* Procurement */}
              <div id="procurement" className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Procurement</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Measured Procurement Spend (R)</label>
                  <input
                    type="number"
                    name="totalMeasuredProcurementSpend"
                    value={financialData.totalMeasuredProcurementSpend}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    placeholder="Enter total procurement spend"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Grid Sections */}
        {assessmentStarted && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ownership Assessment */}
            <div id="ownership" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('ownership')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Ownership Assessment</h2>
                <span>{activeSection === 'ownership' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'ownership' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {ownershipDetails?.ownershipData
                        ? `Black Ownership: ${ownershipDetails.ownershipData.blackOwnershipPercentage}%`
                        : "Add ownership details"}
                    </p>
                    <button
                      onClick={() => setShowOwnershipModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {ownershipDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Management Control */}
            <div id="management" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('management')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Management Control</h2>
                <span>{activeSection === 'management' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'management' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {managementDetails?.managementData
                        ? `Black Voting Rights: ${managementDetails.managementData.blackVotingRights}%`
                        : "Add management details"}
                    </p>
                    <button
                      onClick={() => setShowManagementModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {managementDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Employment Equity */}
            <div id="employment" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('employment')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Employment Equity</h2>
                <span>{activeSection === 'employment' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'employment' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {employmentDetails?.employmentData
                        ? `Total Employees: ${employmentDetails.employmentData.totalEmployees}`
                        : "Add employment details"}
                    </p>
                    <button
                      onClick={() => setShowEmploymentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {employmentDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Yes 4 Youth Initiative */}
            <div id="yes" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('yes')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Yes 4 Youth Initiative</h2>
                <span>{activeSection === 'yes' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'yes' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {yesDetails?.yesData
                        ? `Total Participants: ${yesDetails.yesData.totalParticipants}`
                        : "Add YES initiative details"}
                    </p>
                    <button
                      onClick={() => setShowYesModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {yesDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Skills Development Details */}
            <div id="skillsDetails" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('skillsDetails')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Skills Development Details</h2>
                <span>{activeSection === 'skillsDetails' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'skillsDetails' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {skillsDevelopmentDetails?.summary
                        ? `Total Trainings: ${skillsDevelopmentDetails.summary.totalTrainings}`
                        : "Add skills development details"}
                    </p>
                    <button
                      onClick={() => setShowSkillsDevelopmentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {skillsDevelopmentDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Supplier Development & Imports */}
            <div id="supplier" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('supplier')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Supplier Development & Imports</h2>
                <span>{activeSection === 'supplier' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'supplier' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {supplierDevelopmentDetails?.localSummary
                        ? `Total Suppliers: ${supplierDevelopmentDetails.localSummary.totalSuppliers}`
                        : "Add supplier development details"}
                    </p>
                    <button
                      onClick={() => setShowSupplierDevelopmentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {supplierDevelopmentDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Enterprise Development */}
            <div id="enterprise" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('enterprise')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Enterprise Development</h2>
                <span>{activeSection === 'enterprise' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'enterprise' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {enterpriseDevelopmentDetails?.summary
                        ? `Total Beneficiaries: ${enterpriseDevelopmentDetails.summary.totalBeneficiaries}`
                        : "Add enterprise development details"}
                    </p>
                    <button
                      onClick={() => setShowEnterpriseDevelopmentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {enterpriseDevelopmentDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Socio-Economic Development */}
            <div id="socioEconomic" className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={() => toggleSection('socioEconomic')}
                className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition duration-200"
              >
                <h2 className="text-lg font-semibold text-gray-800">Socio-Economic Development</h2>
                <span>{activeSection === 'socioEconomic' ? '▲' : '▼'}</span>
              </button>
              {activeSection === 'socioEconomic' && (
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <p className="text-gray-600">
                      {socioEconomicDevelopmentDetails?.summary
                        ? `Total Beneficiaries: ${socioEconomicDevelopmentDetails.summary.totalBeneficiaries}`
                        : "Add socio-economic development details"}
                    </p>
                    <button
                      onClick={() => setShowSocioEconomicDevelopmentModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {socioEconomicDevelopmentDetails ? "Edit" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Calculate Button */}
            <div id="calculate" className="col-span-full flex justify-center mt-6">
              <button
                onClick={calculateBBBEEScore}
                className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 font-bold text-lg transition duration-200"
              >
                Calculate B-BBEE Score
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showOwnershipModal && (
          <OwnershipDetails
            userId={userId}
            onClose={() => setShowOwnershipModal(false)}
            onSubmit={handleOwnershipSubmit}
          />
        )}
        {showManagementModal && (
          <ManagementControl
            userId={userId}
            onClose={() => setShowManagementModal(false)}
            onSubmit={handleManagementSubmit}
          />
        )}
        {showEmploymentModal && (
          <EmploymentEquity
            userId={userId}
            onClose={() => setShowEmploymentModal(false)}
            onSubmit={handleEmploymentSubmit}
          />
        )}
        {showYesModal && (
          <Yes4YouthInitiative
            userId={userId}
            onClose={() => setShowYesModal(false)}
            onSubmit={handleYesSubmit}
          />
        )}
        {showSkillsDevelopmentModal && (
          <SkillsDevelopment
            userId={userId}
            onClose={() => setShowSkillsDevelopmentModal(false)}
            onSubmit={handleSkillsDevelopmentSubmit}
          />
        )}
        {showSupplierDevelopmentModal && (
          <SupplierDevelopment
            userId={userId}
            onClose={() => setShowSupplierDevelopmentModal(false)}
            onSubmit={handleSupplierDevelopmentSubmit}
          />
        )}
        {showEnterpriseDevelopmentModal && (
          <EnterpriseDevelopment
            userId={userId}
            onClose={() => setShowEnterpriseDevelopmentModal(false)}
            onSubmit={handleEnterpriseDevelopmentSubmit}
          />
        )}
        {showSocioEconomicDevelopmentModal && (
          <SocioEconomicDevelopment
            userId={userId}
            onClose={() => setShowSocioEconomicDevelopmentModal(false)}
            onSubmit={handleSocioEconomicDevelopmentSubmit}
          />
        )}
        {showResultsModal && (
          <Results
            onClose={() => setShowResultsModal(false)}
            results={results}
          />
        )}
      </div>
    </div>
  );
};

export default Home;