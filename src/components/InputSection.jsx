import React from 'react';
import { FileText, Upload, RefreshCw, ClipboardList } from 'lucide-react';

const API_BASE_URL = "http://localhost:5000";
const [activeTab, setActiveTab] = useState("input");
  const [targetLanguage, setTargetLanguage] = useState("Java");
  const [sourceCode, setSourceCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [unitTests, setUnitTests] = useState("");
  const [functionalTests, setFunctionalTests] = useState("");
  const [businessRequirements, setBusinessRequirements] = useState("");
  const [technicalRequirements, setTechnicalRequirements] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingRequirements, setIsGeneratingRequirements] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [error, setError] = useState("");
  const [showDropdownTarget, setShowDropdownTarget] = useState(false);
  const [isBackendAvailable, setIsBackendAvailable] = useState(true);
  const [activeRequirementsTab, setActiveRequirementsTab] = useState("business");
  const [activeOutputTab, setActiveOutputTab] = useState("code");

  // State for technical requirements
  const [technicalRequirementsList, setTechnicalRequirementsList] = useState([]);


const InputSection = ({
  sourceCode,
  setSourceCode,
  targetLanguage,
  targetLanguages,
  showDropdownTarget,
  setShowDropdownTarget,
  setTargetLanguage,
  handleFileUpload,
  handleReset,
  handleGenerateRequirements,
  isGeneratingRequirements
}) => {


  const targetLanguages = [
    { name: "Java", icon: "☕" },
    { name: "C#", icon: "🔷" },
  ];


  const handleReset = () => {
    setSourceCode("");
    setConvertedCode("");
    setUnitTests("");
    setFunctionalTests("");
    setBusinessRequirements("");
    setTechnicalRequirements("");
    setError("");
    setActiveTab("input");
    setActiveOutputTab("code");
  };
  
  const handleGenerateRequirements = async () => {
    // Clear any previous errors
    setError("");
  
    // Validate inputs
    if (!sourceCode.trim()) {
      setError("Please enter COBOL code to analyze");
      return;
    }
  
    setIsGeneratingRequirements(true);
  
    try {
      // If backend is unavailable, use simulated data
      if (!isBackendAvailable) {
        setTimeout(() => {
          const simulatedBusinessReqs = `# Business Requirements
            
  1. The system appears to handle financial transactions, specifically account balances and updates.
  2. There is a validation process for transaction codes, indicating business rules around transaction types.
  3. The code suggests a batch processing system that processes multiple records sequentially.
  4. Error handling and reporting requirements exist for invalid transactions.
  5. The system needs to maintain audit trails for financial operations.`;
  
          const simulatedTechReqs = `# Technical Requirements
  
  1. Code needs to be migrated from legacy COBOL to ${targetLanguage} while preserving all business logic.
  2. File handling must be converted to appropriate database or file operations in ${targetLanguage}.
  3. COBOL's fixed decimal precision must be maintained in the target language.
  4. Error handling mechanisms need to be implemented using modern exception handling.
  5. Batch processing paradigm should be adapted to object-oriented design.
  6. Field validations and business rules should be extracted into separate service classes.`;
  
          setBusinessRequirements(simulatedBusinessReqs);
          setTechnicalRequirements(simulatedTechReqs);
  
          // Parse the technical requirements into the list format
          const techReqsList = parseRequirementsList(simulatedTechReqs);
          setTechnicalRequirementsList(techReqsList);
  
          setIsGeneratingRequirements(false);
          setActiveTab("requirements");
        }, 1500);
        return;
      }
  
      // Call the backend API for requirements generation
      const response = await fetch(`${API_BASE_URL}/api/analyze-requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage: "COBOL",
          targetLanguage,
          sourceCode,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }
  
      const data = await response.json();
      
      // Handle the expected response format from the backend
      // Format business requirements - UPDATED to handle the complex JSON structure
      let formattedBusinessReqs = "# Business Requirements\n\n";
      
      // Check if businessRequirements exists and handle different possible structures
      if (data.businessRequirements) {
        if (typeof data.businessRequirements === 'string') {
          // Handle string format if that's what the API returns
          formattedBusinessReqs = data.businessRequirements;
        } else {
          // Handle the complex JSON structure returned by the backend
          const br = data.businessRequirements;
          
          // Add Overview section if it exists
          if (br.Overview) {
            formattedBusinessReqs += "## Overview\n";
            if (br.Overview["Purpose of the System"]) {
              formattedBusinessReqs += `- **Purpose:** ${br.Overview["Purpose of the System"]}\n`;
            }
            if (br.Overview["Context and Business Impact"]) {
              formattedBusinessReqs += `- **Business Impact:** ${br.Overview["Context and Business Impact"]}\n`;
            }
            formattedBusinessReqs += "\n";
          }
          
          // Add Objectives section if it exists
          if (br.Objectives) {
            formattedBusinessReqs += "## Objectives\n";
            if (br.Objectives["Primary Objective"]) {
              formattedBusinessReqs += `- **Primary Objective:** ${br.Objectives["Primary Objective"]}\n`;
            }
            if (br.Objectives["Key Outcomes"]) {
              formattedBusinessReqs += `- **Key Outcomes:** ${br.Objectives["Key Outcomes"]}\n`;
            }
            formattedBusinessReqs += "\n";
          }
          
          // Add Business Rules section if it exists
          if (br["Business Rules & Requirements"]) {
            formattedBusinessReqs += "## Business Rules & Requirements\n";
            if (br["Business Rules & Requirements"]["Business Purpose"]) {
              formattedBusinessReqs += `- **Business Purpose:** ${br["Business Rules & Requirements"]["Business Purpose"]}\n`;
            }
            if (br["Business Rules & Requirements"]["Business Rules"]) {
              formattedBusinessReqs += `- **Business Rules:** ${br["Business Rules & Requirements"]["Business Rules"]}\n`;
            }
            if (br["Business Rules & Requirements"]["Impact on System"]) {
              formattedBusinessReqs += `- **System Impact:** ${br["Business Rules & Requirements"]["Impact on System"]}\n`;
            }
            if (br["Business Rules & Requirements"]["Constraints"]) {
              formattedBusinessReqs += `- **Constraints:** ${br["Business Rules & Requirements"]["Constraints"]}\n`;
            }
            formattedBusinessReqs += "\n";
          }
          
          // Add Assumptions section if it exists
          if (br["Assumptions & Recommendations"]) {
            formattedBusinessReqs += "## Assumptions & Recommendations\n";
            if (br["Assumptions & Recommendations"]["Assumptions"]) {
              formattedBusinessReqs += `- **Assumptions:** ${br["Assumptions & Recommendations"]["Assumptions"]}\n`;
            }
            if (br["Assumptions & Recommendations"]["Recommendations"]) {
              formattedBusinessReqs += `- **Recommendations:** ${br["Assumptions & Recommendations"]["Recommendations"]}\n`;
            }
            formattedBusinessReqs += "\n";
          }
          
          // Add Expected Output section if it exists
          if (br["Expected Output"]) {
            formattedBusinessReqs += "## Expected Output\n";
            if (br["Expected Output"]["Output"]) {
              formattedBusinessReqs += `- **Output:** ${br["Expected Output"]["Output"]}\n`;
            }
            if (br["Expected Output"]["Business Significance"]) {
              formattedBusinessReqs += `- **Business Significance:** ${br["Expected Output"]["Business Significance"]}\n`;
            }
          }
        }
      }
      
      let formattedTechReqs = "# Technical Requirements\n\n";
      if (data.technicalRequirements) {
        if (typeof data.technicalRequirements === 'string') {
          // Handle string format if that's what the API returns
          formattedTechReqs = data.technicalRequirements;
        } else if (Array.isArray(data.technicalRequirements)) {
          // Handle array format returned by the backend
          data.technicalRequirements.forEach((req, index) => {
            formattedTechReqs += `${index + 1}. ${req.description}\n`;
          });
        } else if (data.technicalRequirements.technicalRequirements) {
          // Handle nested structure if that exists
          const techReqs = data.technicalRequirements.technicalRequirements;
          if (Array.isArray(techReqs)) {
            techReqs.forEach((req, index) => {
              formattedTechReqs += `${index + 1}. ${req.description}\n`;
            });
          }
        } else {
          // Handle flat object with properties
          formattedTechReqs += "Could not format technical requirements - unexpected data structure.";
          console.error("Unexpected technical requirements format:", data.technicalRequirements);
        }
      }
  
      // Set state with the formatted requirements
      setBusinessRequirements(formattedBusinessReqs);
      setTechnicalRequirements(formattedTechReqs);
  
      // Parse the technical requirements into the list format
      const techReqsList = parseRequirementsList(formattedTechReqs);
      setTechnicalRequirementsList(techReqsList);
  
      setActiveTab("requirements");
    } catch (error) {
      console.error("Error during requirements analysis:", error);
      setError(error.message || "Failed to analyze code. Please try again.");
    } finally {
      setIsGeneratingRequirements(false);
    }
  };

  const parseRequirementsList = (requirementsText) => {
    if (!requirementsText) return [];

    // Split by newlines and find lines that are requirements
    // This will handle different formats like:
    // - "1. Requirement"
    // - "* Requirement"
    // - "- Requirement"
    const lines = requirementsText.split("\n");
    const reqList = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for numbered requirements, bullets, or dashes
      const requirementMatch = line.match(/^(\d+\.|[\*\-])\s+(.*)/);

      if (requirementMatch) {
        reqList.push({ text: requirementMatch[2].trim() });
      }
    }

    // If no requirements were found with the pattern, take any non-empty, non-header lines
    if (reqList.length === 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and header lines (lines starting with #)
        if (line && !line.startsWith("#")) {
          reqList.push({ text: line });
        }
      }
    }

    return reqList;
  };


  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceCode(e.target.result);
    };
    reader.readAsText(file);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-md text-gray-900 border border-black">
          <FileText size={18} className="text-teal-600" />
          <span className="font-medium">COBOL</span>
        </div>
        <label className="flex items-center bg-white hover:bg-gray-50 text-gray-900 rounded px-3 py-2 text-sm transition duration-200 cursor-pointer mr-2 border border-black">
          <Upload size={16} className="mr-2" />
          <span>Upload File</span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.cob,.cobol,.cbl"
          />
        </label>
        <div className="dropdown relative">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-md text-gray-900 transition duration-200 border border-black"
            onClick={() => setShowDropdownTarget(!showDropdownTarget)}
          >
            <span className="w-5 h-5 flex items-center justify-center text-teal-600">
              {targetLanguages.find(
                (lang) => lang.name === targetLanguage
              )?.icon || ""}
            </span>
            <span className="font-medium">{targetLanguage}</span>
            <span className="ml-2">▼</span>
          </button>
          {showDropdownTarget && (
            <div className="absolute mt-1 w-48 bg-white rounded-md shadow-lg border border-black z-10">
              {targetLanguages.map((lang) => (
                <button
                  key={lang.name}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-900"
                  onClick={() => {
                    setTargetLanguage(lang.name);
                    setShowDropdownTarget(false);
                  }}
                >
                  <span className="inline-block w-5 text-center mr-2">
                    {lang.icon}
                  </span>
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-900 h-96 overflow-hidden">
        <div className="flex items-center bg-gray-100 px-4 py-2 border-b border-gray-200">
          <span className="text-gray-900 font-medium">
            Source Code (COBOL)
          </span>
        </div>
        <div className="p-2 h-full overflow-auto scrollbar-hide">
          <div className="flex">
            {/* Line numbers */}
            <div className="pr-2 text-right min-w-8 text-gray-500 select-none font-mono text-sm border-r border-gray-200 mr-2">
              {Array.from(
                { length: Math.max(sourceCode.split("\n").length, 1) },
                (_, i) => (
                  <div key={i} className="h-6">
                    {i + 1}
                  </div>
                )
              )}
            </div>
            {/* Code editor */}
            <textarea
              className="w-full bg-transparent text-gray-900 resize-none focus:outline-none p-0 font-mono text-sm leading-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              placeholder="// Enter your COBOL code here"
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
              }}
              style={{
                overflow: "hidden",
                height: "auto",
                minHeight: "100%",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-6">
        <button
          className="bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg transition duration-200 border border-black"
          onClick={handleReset}
        >
          <div className="flex items-center">
            <RefreshCw size={18} className="mr-2 text-red-400" />
            Reset
          </div>
        </button>
        <button
          className={`${isGeneratingRequirements
              ? "bg-teal-600"
              : "bg-teal-600 hover:bg-teal-500"
            } text-white font-medium px-8 py-3 rounded-lg transition duration-200 min-w-36`}
          onClick={handleGenerateRequirements}
          disabled={isGeneratingRequirements || !sourceCode.trim()}
        >
          {isGeneratingRequirements ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Analyzing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <ClipboardList size={18} className="mr-2" />
              Generate Requirements
            </div>
          )}
        </button>
      </div>
    </div>
  );
};



export default InputSection;