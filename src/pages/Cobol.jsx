import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Copy,
  Download,
  RefreshCw,
  Code2,
  CheckCircle,
  AlertCircle,
  FileCode,
  ClipboardList,
  Terminal,
  Plus,
  Edit,
  Trash2,
  TestTube,
  FileSearch,
} from "lucide-react";

// Define API base URL - change this based on where your backend is hosted
const API_BASE_URL = "http://localhost:5000";

export default function Cobol() {
  const [activeTab, setActiveTab] = useState("input");
  const [targetLanguage, setTargetLanguage] = useState("Java");
  const [sourceCode, setSourceCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [vsamCode, setVsamCode] = useState("");
  const [showVsam, setShowVsam] = useState(false);
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
  const [activeEditor, setActiveEditor] = useState('cobol');

  // State for technical requirements
  const [technicalRequirementsList, setTechnicalRequirementsList] = useState([]);

  // State for editing requirements
  const [editingRequirementIndex, setEditingRequirementIndex] = useState(null);
  const [editingRequirementText, setEditingRequirementText] = useState("");

  // Fixed target languages
  const targetLanguages = [
    { name: "Java", icon: "☕" },
    { name: "C#", icon: "🔷" },
  ];

  // Add CSS for custom scrollbar styling
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .scrollbar-hide {
        scrollbar-width: none;
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide:hover {
        scrollbar-width: thin;
      }
      .scrollbar-hide:hover::-webkit-scrollbar {
        display: block;
        width: 6px;
      }
      .scrollbar-hide:hover::-webkit-scrollbar-thumb {
        background-color: #4b5563;
        border-radius: 3px;
      }
      .scrollbar-hide:hover::-webkit-scrollbar-track {
        background-color: transparent;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Check backend availability on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setIsBackendAvailable(true);
        } else {
          setIsBackendAvailable(false);
        }
      } catch (error) {
        console.error("Backend health check failed:", error);
        setIsBackendAvailable(false);
      }
    };

    checkBackendStatus();
  }, []);

  const handleCopyCode = () => {
    let contentToCopy = "";
    
    switch (activeOutputTab) {
      case "code":
        contentToCopy = convertedCode;
        break;
      case "unit-tests":
        contentToCopy = unitTests;
        break;
      case "functional-tests":
        contentToCopy = functionalTests;
        break;
      default:
        contentToCopy = convertedCode;
    }
    
    if (contentToCopy) {
      navigator.clipboard.writeText(contentToCopy);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
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

  const handleConvert = async () => {
    // Clear any previous errors
    setError("");
  
    // Validate inputs
    if (!sourceCode.trim()) {
      setError("Please enter COBOL code to convert");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // If backend is unavailable, use the simulated conversion
      if (!isBackendAvailable) {
        setTimeout(() => {
          setConvertedCode(
            `// Converted from COBOL to ${targetLanguage}\n\n// Business requirements implemented:\n// - Transaction processing\n// - Account balance updates\n// - Validation logic\n\n// Technical implementation:\n// - Object-oriented structure\n// - Exception handling for errors\n// - Type safety\n\npublic class AccountProcessor {\n    private Database db;\n    \n    public AccountProcessor() {\n        db = new Database();\n    }\n    \n    public void processTransaction(Transaction tx) {\n        // Implementation would be here\n        // This is simulated output\n    }\n}`
          );
          
          // Set simulated test code
          setUnitTests(
            `// Unit Tests for ${targetLanguage}\n\nimport org.junit.Test;\nimport static org.junit.Assert.*;\n\npublic class AccountProcessorTest {\n    \n    @Test\n    public void testProcessTransaction() {\n        // Test setup\n        AccountProcessor processor = new AccountProcessor();\n        Transaction tx = new Transaction();\n        tx.setAmount(100.00);\n        \n        // Execute\n        processor.processTransaction(tx);\n        \n        // Verify\n        // This is simulated test code\n        assertTrue(true);\n    }\n}`
          );
          
          setFunctionalTests(
            `# Functional Test Cases\n\n## Test Scenario 1: Valid Transaction Processing\n\n### Acceptance Criteria:\n- System should process a valid transaction\n- Account balance should be updated correctly\n- Audit log should contain transaction details\n\n### Test Steps:\n1. Input a valid transaction with amount $100.00\n2. Verify account balance is updated\n3. Check audit log for transaction record`
          );
          
          setIsLoading(false);
          setActiveTab("output");
          setActiveOutputTab("code");
        }, 1500);
        return;
      }
  
      // Call the backend API for conversion
      const response = await fetch(`${API_BASE_URL}/api/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLanguage: "COBOL",
          targetLanguage,
          sourceCode,
          businessRequirements,
          technicalRequirements,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Conversion failed");
      }
  
      const data = await response.json();
      console.log("API Response:", data); // Add detailed logging
      
      // Handle the converted code with stronger validation
      if (data.convertedCode && typeof data.convertedCode === 'string') {
        setConvertedCode(data.convertedCode);
      } else {
        console.error("Invalid conversion response structure:", data);
        setError("Received invalid response format from server");
        setConvertedCode("// Error: Invalid response from conversion service");
        setIsLoading(false);
        return;
      }
      
      // Handle unit tests - with better error handling
      if (typeof data.unitTests === 'string' && data.unitTests.trim()) {
        setUnitTests(data.unitTests);
      } else if (data.unitTestDetails && data.unitTestDetails.unitTestCode && typeof data.unitTestDetails.unitTestCode === 'string') {
        setUnitTests(data.unitTestDetails.unitTestCode);
      } else {
        console.warn("No valid unit test data found in response");
        setUnitTests("// No unit tests were returned from the server");
      }
      
      // Handle functional tests - format them to display nicely, with validation
      if (data.functionalTests) {
        try {
          let formattedFunctionalTests = "# Functional Test Cases\n\n";
          
          if (data.functionalTests.functionalTests && Array.isArray(data.functionalTests.functionalTests)) {
            // If it's in the expected array format
            data.functionalTests.functionalTests.forEach((test, index) => {
              formattedFunctionalTests += `## Test Scenario ${index + 1}: ${test.title || 'Untitled Test'}\n\n`;
              formattedFunctionalTests += `### Test ID: ${test.id || `FT${index+1}`}\n\n`;
              formattedFunctionalTests += `### Steps:\n`;
              
              if (test.steps && Array.isArray(test.steps)) {
                test.steps.forEach((step, stepIndex) => {
                  formattedFunctionalTests += `${stepIndex + 1}. ${step}\n`;
                });
              } else {
                formattedFunctionalTests += "No steps defined\n";
              }
              
              formattedFunctionalTests += `\n### Expected Result:\n${test.expectedResult || 'Not specified'}\n\n`;
            });
            
            if (data.functionalTests.testStrategy) {
              formattedFunctionalTests += `## Test Strategy\n\n${data.functionalTests.testStrategy}\n`;
            }
          } else {
            // Fallback if it's another format
            formattedFunctionalTests = "# Functional Tests\n\n";
            formattedFunctionalTests += "```json\n" + JSON.stringify(data.functionalTests, null, 2) + "\n```";
          }
          
          setFunctionalTests(formattedFunctionalTests);
        } catch (formattingError) {
          console.error("Error formatting functional tests:", formattingError);
          setFunctionalTests("# Error formatting functional tests\n\nRaw data:\n```\n" + 
            JSON.stringify(data.functionalTests, null, 2) + "\n```");
        }
      } else {
        setFunctionalTests("# No functional tests were generated");
      }
      
      setActiveTab("output");
      setActiveOutputTab("code");
    } catch (error) {
      console.error("Error during conversion:", error);
      setError(`Conversion failed: ${error.message || "Unknown error"}`);
      setConvertedCode("// Error during conversion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSourceCode("");
    setVsamCode("");
    setConvertedCode("");
    setUnitTests("");
    setFunctionalTests("");
    setBusinessRequirements("");
    setTechnicalRequirements("");
    setError("");
    setActiveTab("input");
    setActiveOutputTab("code");
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

  const handleDownload = () => {
    let contentToDownload = "";
    let filename = "";
    
    switch (activeOutputTab) {
      case "code":
        contentToDownload = convertedCode;
        filename = `converted_${targetLanguage.toLowerCase()}_code.${getFileExtension(targetLanguage)}`;
        break;
      case "unit-tests":
        contentToDownload = unitTests;
        filename = `unit_tests_${targetLanguage.toLowerCase()}.${getFileExtension(targetLanguage)}`;
        break;
      case "functional-tests":
        contentToDownload = functionalTests;
        filename = `functional_tests_${targetLanguage.toLowerCase()}.txt`;
        break;
      default:
        contentToDownload = convertedCode;
        filename = `converted_${targetLanguage.toLowerCase()}_code.${getFileExtension(targetLanguage)}`;
    }
    
    if (!contentToDownload) return;

    const element = document.createElement("a");
    const file = new Blob([contentToDownload], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getFileExtension = (language) => {
    const extensions = {
      Java: "java",
      "C#": "cs",
    };
    return extensions[language] || "txt";
  };

  const handleCopyRequirements = () => {
    const textToCopy =
      activeRequirementsTab === "business"
        ? businessRequirements
        : technicalRequirements;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const handleDownloadRequirements = () => {
    const textToDownload =
      activeRequirementsTab === "business"
        ? businessRequirements
        : technicalRequirements;
    if (!textToDownload) return;

    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${activeRequirementsTab}_requirements.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleAddRequirement = () => {
    const newRequirement = { text: "New requirement" };
    setTechnicalRequirementsList([
      ...technicalRequirementsList,
      newRequirement,
    ]);
    setEditingRequirementIndex(technicalRequirementsList.length);
    setEditingRequirementText(newRequirement.text);
  };

  const handleEditRequirement = (index) => {
    setEditingRequirementIndex(index);
    setEditingRequirementText(technicalRequirementsList[index].text);
  };

  const handleSaveRequirement = () => {
    if (editingRequirementIndex !== null) {
      const updatedRequirements = [...technicalRequirementsList];
      updatedRequirements[editingRequirementIndex] = {
        text: editingRequirementText,
      };
      setTechnicalRequirementsList(updatedRequirements);
      setEditingRequirementIndex(null);
      setEditingRequirementText("");
    }
  };

  const handleDeleteRequirement = (index) => {
    const updatedRequirements = technicalRequirementsList.filter(
      (_, i) => i !== index
    );
    setTechnicalRequirementsList(updatedRequirements);
  };



  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "input":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <button
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition 
    ${activeEditor === 'cobol'
                    ? 'bg-teal-600 text-white border border-transparent'
                    : 'bg-transparent text-black border border-black hover:bg-teal-500 hover:text-white'}`}
                onClick={() => setActiveEditor('cobol')}
              >
                <FileText size={18} className={`${activeEditor === 'cobol' ? 'text-white' : 'text-black'}`} />
                <span className="font-medium">COBOL</span>
              </button>

              <button
                className={`flex items-center px-4 py-2 rounded transition duration-200 
    ${activeEditor === 'vsam'
                    ? 'bg-teal-600 text-white border border-transparent'
                    : 'bg-transparent text-black border border-black hover:bg-teal-500 hover:text-white'}`}
                onClick={() => {
                  setActiveEditor('vsam');
                  setShowVsam(true);
                }}
              >
                <FileCode size={16} className={`${activeEditor === 'vsam' ? 'text-white' : 'text-black'} mr-2`} />
                <span>VSAM Definition</span>
              </button>


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
                    {targetLanguages.find(lang => lang.name === targetLanguage)?.icon || ""}
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

            {/* Main Editor - shows either COBOL or VSAM depending on activeEditor */}
            <div className="bg-white rounded-lg border border-gray-900 h-96 overflow-hidden">
              <div className="flex items-center bg-gray-100 px-4 py-2 border-b border-gray-200">
                <span className="text-black-400 font-medium">
                  {activeEditor === 'cobol' ? 'Source Code (COBOL)' : 'VSAM Definition'}
                </span>
              </div>
              <div className="p-2 h-full overflow-auto scrollbar-hide">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="pr-2 text-right min-w-8 text-gray-500 select-none font-mono text-sm border-r border-gray-200 mr-2">
                    {Array.from(
                      { length: Math.max((activeEditor === 'cobol' ? sourceCode : vsamCode).split("\n").length, 1) },
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
                    placeholder={activeEditor === 'cobol'
                      ? "// Enter your COBOL code here"
                      : "// Enter your VSAM definition here"}
                    value={activeEditor === 'cobol' ? sourceCode : vsamCode}
                    onChange={(e) => {
                      if (activeEditor === 'cobol') {
                        setSourceCode(e.target.value);
                      } else {
                        setVsamCode(e.target.value);
                      }
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
                className={`${
                  isGeneratingRequirements
                  ? "bg-teal-600"
                    : "bg-teal-600 hover:bg-teal-500"
                } text-white font-medium px-8 py-3 rounded-lg transition duration-200 min-w-36`}
                onClick={handleGenerateRequirements}
                disabled={isGeneratingRequirements ||
                  (activeEditor === 'cobol' && !sourceCode.trim()) ||
                  (activeEditor === 'vsam' && !vsamCode.trim())}
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


        case "requirements":
          return (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                <button
  className={`px-4 py-2 border border-black rounded-lg transition duration-200 ${
    activeRequirementsTab === "business"
      ? "bg-teal-600 text-white"
      : "bg-white text-gray-900 hover:bg-gray-100"
  }`}
  onClick={() => setActiveRequirementsTab("business")}
>
  <div className="flex items-center">
    <ClipboardList size={16} className="mr-2" />
    Business Requirements
  </div>
</button>

<button
  className={`px-4 py-2 border border-black rounded-lg transition duration-200 ${
    activeRequirementsTab === "technical"
      ? "bg-teal-600 text-white"
      : "bg-white text-gray-900 hover:bg-gray-100"
  }`}
  onClick={() => setActiveRequirementsTab("technical")}
>
  <div className="flex items-center">
    <ClipboardList size={16} className="mr-2" />
    Technical Requirements
  </div>
</button>

                </div>

                <div className="flex space-x-2">
                  <button
                    className={`flex items-center ${
                      copyStatus
                      ? "bg-teal-600"
                      : "bg-gray-600"
                    } text-white rounded px-4 py-2 text-sm transition duration-200 border border-white ${
                      !businessRequirements && !technicalRequirements
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    onClick={handleCopyRequirements}
                    disabled={!businessRequirements && !technicalRequirements}
                  >
                    {copyStatus ? (
                      <>
                        <CheckCircle size={16} className="mr-2" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} className="mr-2" />
                        <span>Copy Requirements</span>
                      </>
                    )}
                  </button>
                  <button
                    className={`flex items-center bg-gray-600 text-white rounded px-4 py-2 text-sm transition duration-200 border border-white ${
                      !businessRequirements && !technicalRequirements
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={!businessRequirements && !technicalRequirements}
                    onClick={handleDownloadRequirements}
                  >
                    <Download size={16} className="mr-2" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
        
              <div className="bg-white rounded-lg border border-gray-900" style={{ height: "28rem" }}>
                {activeRequirementsTab === "business" ? (
                  <div className="p-4 h-full overflow-auto scrollbar-hide">
                    <div className="markdown-content text-gray-900 whitespace-pre-wrap">
                      {businessRequirements ? (
                        <div className="space-y-2">
                          {businessRequirements.split("\n").map((line, index) => {
                            // Main section headers (#)
                            if (line.trim().startsWith("# ")) {
                              return (
                                <h1
                                  key={index}
                                  className="text-2xl font-bold text-gray-900 mt-4 mb-2 border-b border-teal-500 pb-1"
                                >
                                  {line.replace("# ", "")}
                                </h1>
                              );
                            }
                            if (line.trim().startsWith("###**")) {
                              return (
                                <h1
                                  key={index}
                                  className="text-2xl font-bold text-gray-900 mt-4 mb-2 border-b border-teal-500 pb-1"
                                >
                                  {line.replace("###**", "")}
                                </h1>
                              );
                            }
        
                            // Subsection headers (##)
                            if (line.trim().startsWith("## ")) {
                              return (
                                <h4
                                  key={index}
                                  className="text-lg font-semibold text-gray-900 mt-3 mb-2"
                                >
                                  {line.replace("## ", "")}
                                </h4>
                              );
                            }
        
                            // Regular paragraphs (###)
                            if (line.trim().startsWith("###")) {
                              return (
                                <p
                                  key={index}
                                  className="text-gray-900 font-normal mb-2"
                                >
                                  {line.replace("###", "").trim()}
                                </p>
                              );
                            }
        
                            // Bullet points with bold text using **text** format
                            if (line.trim().startsWith("- ")) {
                              // Process bold text within bullet points
                              const bulletContent = line.replace("- ", "");
                              const parts = [];
                              let currentText = "";
                              let isBold = false;
                              let currentIndex = 0;
                              
                              // Parse out the bold sections
                              for (let i = 0; i < bulletContent.length; i++) {
                                if (bulletContent.substring(i, i + 2) === "**") {
                                  // We found a ** marker
                                  if (currentText) {
                                    // Add accumulated text with appropriate styling
                                    parts.push(
                                      <span key={`${index}-${currentIndex}`} className={isBold ? "font-bold text-gray-900" : "font-normal"}>
                                        {currentText}
                                      </span>
                                    );
                                    currentIndex++;
                                    currentText = "";
                                  }
                                  isBold = !isBold; // Toggle bold state
                                  i++; // Skip the second * character
                                } else {
                                  currentText += bulletContent[i];
                                }
                              }
                              
                              // Add any remaining text
                              if (currentText) {
                                parts.push(
                                  <span key={`${index}-${currentIndex}`} className={isBold ? "font-bold text-gray-900" : "font-normal"}>
                                    {currentText}
                                  </span>
                                );
                              }
                              
                              return (
                                <div
                                  key={index}
                                  className="flex items-start mb-2"
                                >
                                  <span className="text-teal-600 mr-2 mt-0.5">•</span>
                                  <span className="text-gray-900">
                                    {parts}
                                  </span>
                                </div>
                              );
                            }
        
                            // Empty lines - reduced spacing
                            if (!line.trim()) {
                              return <div key={index} className="h-1"></div>;
                            }
        
                            // Regular paragraph with possible bold formatting
                            const parts = [];
                            let currentText = "";
                            let isBold = false;
                            let currentIndex = 0;
                            
                            // Parse out the bold sections in regular paragraphs
                            for (let i = 0; i < line.length; i++) {
                              if (line.substring(i, i + 2) === "**") {
                                // We found a ** marker
                                if (currentText) {
                                  // Add accumulated text with appropriate styling
                                  parts.push(
                                    <span key={`${index}-${currentIndex}`} className={isBold ? "font-bold text-gray-900" : "font-normal"}>
                                      {currentText}
                                    </span>
                                  );
                                  currentIndex++;
                                  currentText = "";
                                }
                                isBold = !isBold; // Toggle bold state
                                i++; // Skip the second * character
                              } else {
                                currentText += line[i];
                              }
                            }
                            
                            // Add any remaining text
                            if (currentText) {
                              parts.push(
                                <span key={`${index}-${currentIndex}`} className={isBold ? "font-bold text-gray-900" : "font-normal"}>
                                  {currentText}
                                </span>
                              );
                            }
        
                            return (
                              <p key={index} className="text-gray-900">
                                {parts}
                              </p>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <ClipboardList size={40} className="mb-4 opacity-50" />
                          <p className="text-center">
                            No business requirements generated yet.
                          </p>
                          <p className="text-sm text-center mt-2">
                            Generate requirements from your COBOL code first.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 h-full overflow-auto scrollbar-hide">
                    <div className="border-b border-teal-500 pb-2 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                        Technical Requirements
                      </h2>
                    </div>
                    {/* Technical Requirements UI with editable list */}
                    {technicalRequirementsList.length > 0 ? (
                      <div className="space-y-1">
                        {technicalRequirementsList.map((req, index) => (
                          <div
                            key={index}
                            className="flex items-start p-2 border-b border-gray-200 hover:bg-gray-100 rounded"
                          >
                            <span className="mr-2 text-teal-600">•</span>
                            <p className="flex-grow text-gray-900">{req.text}</p>
                            <div className="flex space-x-1 ml-2">
                              <button
                                className="p-1 text-teal-600 hover:text-teal-500"
                                onClick={() => handleEditRequirement(index)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="p-1 text-red-400 hover:text-red-300"
                                onClick={() => handleDeleteRequirement(index)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <div className="mb-2">
                          No technical requirements found.
                        </div>
                        <div className="text-sm">
                          Generate requirements first or add them manually.
                        </div>
                      </div>
                    )}
        
                    <button
                      className="mt-4 px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-500 flex items-center"
                      onClick={handleAddRequirement}
                    >
                      <Plus size={16} className="mr-1" /> Add Requirement
                    </button>
                  </div>
                )}
              </div>
        
              <div className="flex justify-center space-x-6 mt-4">
                <button
                  className="bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg transition duration-200 border border-black"
                  onClick={() => setActiveTab("input")}
                >
                  <div className="flex items-center">
                    <FileCode size={18} className="mr-2 text-teal-600" />
                    Back to Code
                  </div>
                </button>
                <button
                  className={`${
                    isLoading ? "bg-teal-600" : "bg-teal-600 hover:bg-teal-500"
                  } text-white font-medium px-8 py-3 rounded-lg transition duration-200 min-w-36`}
                  onClick={handleConvert}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                      Converting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <span className="mr-1">Convert to {targetLanguage}</span>
                      <span className="ml-1">→</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          );


          case "output":
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      className={`px-4 py-2 ${
                        activeOutputTab === "code"
                          ? "bg-teal-600 text-white"
                        : "bg-white text-gray-900 hover:bg-gray-100 border border-black"
                      } rounded-lg transition duration-200`}
                      onClick={() => setActiveOutputTab("code")}
                    >
                      <div className="flex items-center">
                        <FileCode size={16} className="mr-2" />
                        Converted Code
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 ${
                        activeOutputTab === "unit-tests"
                          ? "bg-teal-600 text-white"
                        : "bg-white text-gray-900 hover:bg-gray-100 border border-black"
                      } rounded-lg transition duration-200`}
                      onClick={() => setActiveOutputTab("unit-tests")}
                    >
                      <div className="flex items-center">
                        <TestTube size={16} className="mr-2" />
                        Unit Tests
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 ${
                        activeOutputTab === "functional-tests"
                          ? "bg-teal-600 text-white"
                        : "bg-white text-gray-900 hover:bg-gray-100 border border-black"
                      } rounded-lg transition duration-200`}
                      onClick={() => setActiveOutputTab("functional-tests")}
                    >
                      <div className="flex items-center">
                        <FileSearch size={16} className="mr-2" />
                        Functional Tests
                      </div>
                    </button>
                  </div>
                  
                  {/* Output actions buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      className={`flex items-center ${
                        copyStatus
                        ? "bg-teal-600"
                        : "bg-gray-600"
                      } text-white rounded px-4 py-2 text-sm transition duration-200 border border-white hover:bg-teal-500 ${
                        !convertedCode ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={handleCopyCode}
                      disabled={!convertedCode}
                    >
                      {copyStatus ? (
                        <>
                          <CheckCircle size={16} className="mr-2" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} className="mr-2" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                    <button
                      className={`flex items-center bg-gray-600 hover:bg-teal-500 text-white rounded px-3 py-2 text-sm transition duration-200 border border-white ${
                        !convertedCode ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      disabled={!convertedCode}
                      onClick={handleDownload}
                    >
                      <Download size={16} className="mr-1 text-white" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
          
                <div className="bg-white rounded-lg border border-gray-900 h-96 overflow-hidden shadow-md shadow-teal-500/20">
                  <div className="flex items-center bg-gray-100 px-4 py-2 border-b border-gray-200">
                    <span className="text-gray-900 font-medium">
                      {activeOutputTab === "code"
                        ? `Converted Code (${targetLanguage})`
                        : activeOutputTab === "unit-tests"
                        ? `${targetLanguage} Unit Tests`
                        : "Functional Test Cases"}
                    </span>
                  </div>
                  <div className="p-2 h-full overflow-auto scrollbar-hide">
                    {activeOutputTab === "functional-tests" ? (
                      // Render functional tests with markdown styling
                      <div className="text-gray-900 font-mono text-sm w-full">
                        {functionalTests.split("\n").map((line, index) => {
                          // Main section headers (#)
                          if (line.trim().startsWith("# ")) {
                            return (
                              <h1
                                key={index}
                                className="text-2xl font-bold text-gray-900 mt-4 mb-2 border-b border-teal-500 pb-1"
                              >
                                {line.replace("# ", "")}
                              </h1>
                            );
                          }
                          if (line.trim().startsWith("###**")) {
                            return (
                              <h1
                                key={index}
                                className="text-2xl font-bold text-gray-900 mt-4 mb-2 border-b border-teal-500 pb-1"
                              >
                                {line.replace("###**", "")}
                              </h1>
                            );
                          }
          
                          // Subsection headers (##)
                          if (line.trim().startsWith("## ")) {
                            return (
                              <h4
                                key={index}
                                className="text-lg font-semibold text-gray-900 mt-3 mb-2"
                              >
                                {line.replace("## ", "")}
                              </h4>
                            );
                          }
          
                          // Sub-sub section headers (###)
                          if (line.trim().startsWith("###") && !line.trim().startsWith("###**")) {
                            return (
                              <p
                                key={index}
                                className="text-gray-900 font-normal mb-2"
                              >
                                {line.replace("###", "").trim()}
                              </p>
                            );
                          }
          
                          // Regular text (everything else)
                          return (
                            <p key={index} className="text-gray-900 mb-1 whitespace-pre-wrap">
                              {line}
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      // For code and unit tests, keep the original display with line numbers
                      <div className="flex">
                        {/* Line numbers */}
                          <div className="pr-2 text-right min-w-8 text-gray-500 select-none font-mono text-sm border-r border-gray-200 mr-2">
                          {Array.from(
                            {
                              length: Math.max(
                                activeOutputTab === "code"
                                  ? convertedCode.split("\n").length
                                  : unitTests.split("\n").length,
                                1
                              ),
                            },
                            (_, i) => (
                              <div key={i} className="h-6">
                                {i + 1}
                              </div>
                            )
                          )}
                        </div>
                        {/* Code content */}
                          <pre className="text-gray-900 font-mono text-sm whitespace-pre leading-6 w-full">
                          {activeOutputTab === "code"
                            ? convertedCode
                            : unitTests}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
          
                <div className="flex justify-center space-x-6">
                  <button
                    className="bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg transition duration-200 border border-black"
                    onClick={() => setActiveTab("requirements")}
                  >
                    <div className="flex items-center">
                      <ClipboardList size={18} className="mr-2 text-teal-600" />
                      View Requirements
                    </div>
                  </button>
                  <button
                    className="bg-white hover:bg-gray-100 text-gray-900 font-medium px-6 py-3 rounded-lg transition duration-200 border border-black"
                    onClick={handleReset}
                  >
                    <div className="flex items-center">
                      <RefreshCw size={18} className="mr-2 text-red-400" />
                      Start New Conversion
                    </div>
                  </button>
                </div>
              </div>
            );


        default:
          return null;
      }
    };

  // Modal for editing requirements
  const renderEditModal = () => {
    if (editingRequirementIndex === null) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-2/3 max-w-2xl border border-teal-500">
          <h3 className="text-lg font-medium mb-4 text-gray-900">
            Edit Requirement
          </h3>
          <textarea
            className="w-full border border-teal-200 rounded p-2 mb-4 h-32 bg-white text-gray-900"
            value={editingRequirementText}
            onChange={(e) => setEditingRequirementText(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              onClick={() => {
                setEditingRequirementIndex(null);
                setEditingRequirementText("");
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-500"
              onClick={handleSaveRequirement}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0fffa] text-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Code2 size={40} className="text-teal-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              COBOL Code Converter
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            Transform COBOL code to Java or C# with AI precision
          </p>
          {!isBackendAvailable && (
            <div className="mt-2 flex items-center justify-center text-yellow-400">
              <AlertCircle size={16} className="mr-2" />
              <span>Backend connection unavailable. Using simulated mode.</span>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 text-red-200 flex items-center">
            <AlertCircle size={20} className="mr-2 text-red-400" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-4 py-2 rounded-lg flex items-center ${activeTab === "input"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black"
              }`}
          >
            <FileText size={20} className="mr-2" />
            Input
          </button>
          <button
            onClick={() => setActiveTab("requirements")}
            className={`px-4 py-2 rounded-lg flex items-center ${activeTab === "requirements"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black"
              }`}
          >
            <ClipboardList size={20} className="mr-2" />
            Requirements
          </button>
          <button
            onClick={() => setActiveTab("output")}
            className={`px-4 py-2 rounded-lg flex items-center ${activeTab === "output"
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-black"
              }`}
          >
            <FileCode size={20} className="mr-2" />
            Output
          </button>
        </div>

        {/* Main converter container */}
        <div className="bg-white rounded-xl border border-gray-900 shadow-lg shadow-teal-500/20 p-6">
          {renderTabContent()}
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-teal-600 mb-2 flex items-center">
              <RefreshCw size={20} className="mr-2" />
              <h3 className="text-lg font-medium">COBOL Conversion</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Instantly transform your legacy COBOL code to modern Java or C#
              with AI assistance.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-teal-600 mb-2 flex items-center">
              <ClipboardList size={20} className="mr-2" />
              <h3 className="text-lg font-medium">Requirements Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Automatically extract business and technical requirements from
              your COBOL code.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="text-teal-600 mb-2 flex items-center">
              <Download size={20} className="mr-2" />
              <h3 className="text-lg font-medium">Easy Export</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Download or copy your converted code with a single click for
              seamless workflow integration.
            </p>
          </div>
        </div>
      </div>

      {/* Render the edit modal */}
      {renderEditModal()}
    </div>
  );
}