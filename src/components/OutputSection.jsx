import React from 'react';
import { FileCode, TestTube, FileSearch, Copy, Download, CheckCircle, ClipboardList, RefreshCw } from 'lucide-react';

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

const OutputSection = ({
  activeOutputTab,
  setActiveOutputTab,
  convertedCode,
  unitTests,
  functionalTests,
  copyStatus,
  handleCopyCode,
  handleDownload,
  setActiveTab,
  handleReset
}) => {

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

  
  const getFileExtension = (language) => {
    const extensions = {
      Java: "java",
      "C#": "cs",
    };
    return extensions[language] || "txt";
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

  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            className={`px-4 py-2 ${activeOutputTab === "code"
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
            className={`px-4 py-2 ${activeOutputTab === "unit-tests"
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
            className={`px-4 py-2 ${activeOutputTab === "functional-tests"
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
            className={`flex items-center ${copyStatus
                ? "bg-teal-600"
                : "bg-gray-600"
              } text-white rounded px-4 py-2 text-sm transition duration-200 border border-white hover:bg-teal-500 ${!convertedCode ? "opacity-50 cursor-not-allowed" : ""
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
            className={`flex items-center bg-gray-600 hover:bg-teal-500 text-white rounded px-3 py-2 text-sm transition duration-200 border border-white ${!convertedCode ? "opacity-50 cursor-not-allowed" : ""
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
              ? `Converted Code`
              : activeOutputTab === "unit-tests"
                ? `Unit Tests`
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
};

export default OutputSection;