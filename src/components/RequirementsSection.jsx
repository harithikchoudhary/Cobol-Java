import React from 'react';
import { ClipboardList, FileCode, CheckCircle, Copy, Download, Plus, Edit, Trash2 } from 'lucide-react';


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

const API_BASE_URL = "http://localhost:5000";

const RequirementsSection = ({
  activeRequirementsTab,
  setActiveRequirementsTab,
  businessRequirements,
  technicalRequirements,
  technicalRequirementsList,
  copyStatus,
  handleCopyRequirements,
  handleDownloadRequirements,
  handleEditRequirement,
  handleDeleteRequirement,
  handleAddRequirement,
  setActiveTab,
  isLoading,
  handleConvert,
  targetLanguage
}) => {

  
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            className={`px-4 py-2 ${
              activeRequirementsTab === "business"
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-900 hover:bg-gray-100"
            } rounded-lg transition duration-200`}
            onClick={() => setActiveRequirementsTab("business")}
          >
            <div className="flex items-center">
              <ClipboardList size={16} className="mr-2" />
              Business Requirements
            </div>
          </button>
          <button
            className={`px-4 py-2 ${
              activeRequirementsTab === "technical"
                ? "bg-teal-600 text-white"
                : "bg-white text-gray-900 hover:bg-gray-100"
            } rounded-lg transition duration-200`}
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
                    for (let i = 0; i <line.length; i++) {
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
};

export default RequirementsSection;