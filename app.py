import os
import time
import json
import logging
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from openai import AzureOpenAI
import importlib
import subprocess

from cobol_chunker import chunk_cobol_code, process_chunked_code, detect_database_usage
from prompts import (
    create_business_requirements_prompt,
    create_technical_requirements_prompt,
    create_code_conversion_prompt,
    create_unit_test_prompt,
    create_functional_test_prompt
)
from db_templates import get_db_template
from json_extract import extract_json_from_response

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Install required packages at startup
try:
    # Check if langchain_text_splitters is installed
    try:
        importlib.import_module('langchain_text_splitters')
        logger.info("langchain_text_splitters already installed")
    except ImportError:
        logger.info("Installing langchain_text_splitters...")
        subprocess.check_call(['pip', 'install', '-q', 'langchain-text-splitters'])
        logger.info("Successfully installed langchain_text_splitters")
except Exception as e:
    logger.error(f"Error installing dependencies: {str(e)}")

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "your-azure-openai-endpoint")
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY", "your-azure-openai-key")
AZURE_OPENAI_DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "your-deployment-name")

# Initialize OpenAI client
client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version="2023-05-15",
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
)

@app.route("/api/health", methods=["GET"])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": time.time()})

@app.route("/api/analyze-requirements", methods=["POST"])
def analyze_requirements():
    """Endpoint to analyze COBOL code and extract business and technical requirements"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    source_language = data.get("sourceLanguage")
    target_language = data.get("targetLanguage")
    source_code = data.get("sourceCode")
    vsam_definition = data.get("vsamDefinition", "")
    
    if not all([source_language, source_code]):
        return jsonify({"error": "Missing required fields"}), 400
    
    try:
        business_prompt = create_business_requirements_prompt(source_language, source_code, vsam_definition)
        technical_prompt = create_technical_requirements_prompt(source_language, target_language, source_code, vsam_definition)
        
        business_response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are an expert in analyzing legacy code to extract business requirements. "
                        f"You understand {source_language} deeply and can identify business rules and processes in the code. "
                        f"Output your analysis in JSON format with the following structure:\n\n"
                        f"{{\n"
                        f'  "Overview": {{\n'
                        f'    "Purpose of the System": "Describe the system\'s primary function and how it fits into the business.",\n'
                        f'    "Context and Business Impact": "Explain the operational context and value the system provides."\n'
                        f'  }},\n'
                        f'  "Objectives": {{\n'
                        f'    "Primary Objective": "Clearly state the system\'s main goal.",\n'
                        f'    "Key Outcomes": "Outline expected results (e.g., improved processing speed, customer satisfaction)."\n'
                        f'  }},\n'
                        f'  "Business Rules & Requirements": {{\n'
                        f'    "Business Purpose": "Explain the business objective behind this specific module or logic.",\n'
                        f'    "Business Rules": "List the inferred rules/conditions the system enforces.",\n'
                        f'    "Impact on System": "Describe how this part affects the system\'s overall operation.",\n'
                        f'    "Constraints": "Note any business limitations or operational restrictions."\n'
                        f'  }},\n'
                        f'  "Assumptions & Recommendations": {{\n'
                        f'    "Assumptions": "Describe what is presumed about data, processes, or environment.",\n'
                        f'    "Recommendations": "Suggest enhancements or modernization directions."\n'
                        f'  }},\n'
                        f'  "Expected Output": {{\n'
                        f'    "Output": "Describe the main outputs (e.g., reports, logs, updates).",\n'
                        f'    "Business Significance": "Explain why these outputs matter for business processes."\n'
                        f'  }}\n'
                        f"}}"
                    )
                },
                {"role": "user", "content": business_prompt}
            ],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        logger.info("=== RAW BUSINESS REQUIREMENTS RESPONSE ===")
        logger.info(json.dumps(business_response.model_dump(), indent=2))
        
        technical_response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert in {source_language} to {target_language} migration. "
                              f"You deeply understand both languages and can identify technical challenges and requirements for migration. "
                              f"Output your analysis in JSON format with the following structure:\n"
                              f"{{\n"
                              f'  "technicalRequirements": [\n'
                              f'    {{"id": "TR1", "description": "First technical requirement", "complexity": "High/Medium/Low"}},\n'
                              f'    {{"id": "TR2", "description": "Second technical requirement", "complexity": "High/Medium/Low"}}\n'
                              f'  ]\n'
                              f"}}"
                },
                {"role": "user", "content": technical_prompt}
            ],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )
        
        logger.info("=== RAW TECHNICAL REQUIREMENTS RESPONSE ===")
        logger.info(json.dumps(technical_response.model_dump(), indent=2))
        
        business_content = business_response.choices[0].message.content.strip()
        technical_content = technical_response.choices[0].message.content.strip()
        
        try:
            business_json = json.loads(business_content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse business requirements JSON directly")
            business_json = extract_json_from_response(business_content)
            
        try:
            technical_json = json.loads(technical_content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse technical requirements JSON directly")
            technical_json = extract_json_from_response(technical_content)
        
        result = {
            "businessRequirements": business_json,
            "technicalRequirements": technical_json,
            "sourceLanguage": source_language,
            "targetLanguage": target_language
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in requirements analysis: {str(e)}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

@app.route("/api/convert", methods=["POST"])
def convert_code():
    """Endpoint to convert code from one language to another with support for large COBOL projects"""
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    source_language = data.get("sourceLanguage")
    target_language = data.get("targetLanguage")
    source_code = data.get("sourceCode")
    vsam_definition = data.get("vsamDefinition", "")
    business_requirements = data.get("businessRequirements", "")
    technical_requirements = data.get("technicalRequirements", "")

    if not all([source_language, target_language, source_code]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        logger.info(f"Processing conversion request: {source_language} to {target_language}")
        logger.info(f"Source code size: {len(source_code)} characters")
        
        code_chunks = []
        if source_language.upper() == "COBOL" and len(source_code) > 3000:
            logger.info("Large COBOL file detected - applying code chunking")
            code_chunks = chunk_cobol_code(source_code)
        
        has_database = detect_database_usage(source_code, source_language)
        
        if has_database:
            logger.info(f"Database operations detected in {source_language} code. Including DB setup in conversion.")
            db_setup_template = get_db_template(target_language)
        else:
            logger.info(f"No database operations detected in {source_language} code. Skipping DB setup.")
            db_setup_template = ""
        
        if code_chunks:
            logger.info(f"Processing {len(code_chunks)} code chunks")
            
            def process_code_chunk(code_chunk, is_chunk=False, chunk_index=0, total_chunks=1):
                logger.info(f"Processing chunk {chunk_index+1}/{total_chunks}, size: {len(code_chunk)} characters")
                
                chunk_info = ""
                if is_chunk:
                    chunk_info = f"\n\nIMPORTANT: This is chunk {chunk_index+1} of {total_chunks} from a larger COBOL program. " \
                                 f"Only convert this specific portion while maintaining awareness that it's part of a larger system."
                
                prompt = create_code_conversion_prompt(
                    source_language,
                    target_language,
                    code_chunk,
                    business_requirements,
                    technical_requirements,
                    db_setup_template,
                    vsam_definition
                ) + chunk_info
                
                prompt += f"\n\nIMPORTANT: Only include database initialization code if the source {source_language} code contains database or SQL operations. If the code is a simple algorithm (like sorting, calculation, etc.) without any database interaction, do NOT include any database setup code in the converted {target_language} code."

                response = client.chat.completions.create(
                    model=AZURE_OPENAI_DEPLOYMENT_NAME,
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are an expert code converter assistant specializing in {source_language} to {target_language} migration. "
                                      f"You convert legacy code to modern, idiomatic code while maintaining all business logic. "
                                      f"Only include database setup/initialization if the original code uses databases or SQL. "
                                      f"For simple algorithms or calculations without database operations, don't add any database code. "
                                      f"Return your response in JSON format always with the following structure:\n"
                                      f"{{\n"
                                      f'  "convertedCode": "The complete converted code here",\n'
                                      f'  "conversionNotes": "Notes about the conversion process",\n'
                                      f'  "potentialIssues": ["List of any potential issues or limitations"],\n'
                                      f'  "databaseUsed": true/false\n'
                                      f"}}"
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.1,
                    max_tokens=4000,
                    response_format={"type": "json_object"}
                )

                conversion_content = response.choices[0].message.content.strip()
                try:
                    conversion_json = json.loads(conversion_content)
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse code conversion JSON for chunk {chunk_index+1}")
                    conversion_json = extract_json_from_response(conversion_content)
                
                return conversion_json
            
            conversion_json = process_chunked_code(code_chunks, process_code_chunk)
            
            logger.info("All chunks processed and combined")
            
        else:
            logger.info("Processing code as a single unit")
            
            prompt = create_code_conversion_prompt(
                source_language,
                target_language,
                source_code,
                business_requirements,
                technical_requirements,
                db_setup_template,
                vsam_definition
            )

            prompt += f"\n\nIMPORTANT: Only include database initialization code if the source {source_language} code contains database or SQL operations. If the code is a simple algorithm (like sorting, calculation, etc.) without any database interaction, do NOT include any database setup code in the converted {target_language} code."

            response = client.chat.completions.create(
                model=AZURE_OPENAI_DEPLOYMENT_NAME,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are an expert code converter assistant specializing in {source_language} to {target_language} migration. "
                                  f"You convert legacy code to modern, idiomatic code while maintaining all business logic. "
                                  f"Only include database setup/initialization if the original code uses databases or SQL. "
                                  f"For simple algorithms or calculations without database operations, don't add any database code. "
                                  f"Return your response in JSON format always with the following structure:\n"
                                  f"{{\n"
                                  f'  "convertedCode": "The complete converted code here",\n'
                                  f'  "conversionNotes": "Notes about the conversion process",\n'
                                  f'  "potentialIssues": ["List of any potential issues or limitations"],\n'
                                  f'  "databaseUsed": true/false\n'
                                  f"}}"
                        },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000,
                response_format={"type": "json_object"}
            )

            logger.info("=== RAW CODE CONVERSION RESPONSE ===")
            logger.info(json.dumps(response.model_dump(), indent=2))

            conversion_content = response.choices[0].message.content.strip()
            try:
                conversion_json = json.loads(conversion_content)
            except json.JSONDecodeError:
                logger.warning("Failed to parse code conversion JSON directly")
                conversion_json = extract_json_from_response(conversion_content)
        
        converted_code = conversion_json.get("convertedCode", "")
        conversion_notes = conversion_json.get("conversionNotes", "")
        database_used = conversion_json.get("databaseUsed", False)
        
        logger.info("Generating unit tests")
        unit_test_prompt = create_unit_test_prompt(
            target_language,
            converted_code,
            business_requirements,
            technical_requirements
        )
        
        unit_test_response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert test engineer specializing in writing unit tests for {target_language}. "
                              f"You create comprehensive unit tests that verify all business logic and edge cases. "
                              f"Return your response in JSON format with the following structure:\n"
                              f"{{\n"
                              f'  "unitTestCode": "The complete unit test code here",\n'
                              f'  "testDescription": "Description of the test strategy",\n'
                              f'  "coverage": ["List of functionalities covered by the tests"]\n'
                              f"}}"
                },
                {"role": "user", "content": unit_test_prompt}
            ],
            temperature=0.1,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        unit_test_content = unit_test_response.choices[0].message.content.strip()
        try:
            unit_test_json = json.loads(unit_test_content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse unit test JSON directly")
            unit_test_json = extract_json_from_response(unit_test_content)
        
        unit_test_code = unit_test_json.get("unitTestCode", "")
        
        logger.info("Generating functional tests")
        functional_test_prompt = create_functional_test_prompt(
            target_language,
            converted_code,
            business_requirements
        )
        
        functional_test_response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert QA engineer specializing in creating functional tests for {target_language} applications. "
                              f"You create comprehensive test scenarios that verify the application meets all business requirements. "
                              f"Focus on user journey tests and acceptance criteria. "
                              f"Return your response in JSON format with the following structure:\n"
                              f"{{\n"
                              f'  "functionalTests": [\n'
                              f'    {{"id": "FT1", "title": "Test scenario title", "steps": ["Step 1", "Step 2"], "expectedResult": "Expected outcome"}},\n'
                              f'    {{"id": "FT2", "title": "Another test scenario", "steps": ["Step 1", "Step 2"], "expectedResult": "Expected outcome"}}\n'
                              f'  ],\n'
                              f'  "testStrategy": "Description of the overall testing approach"\n'
                              f"}}"
                },
                {"role": "user", "content": functional_test_prompt}
            ],
            temperature=0.1,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )
        
        functional_test_content = functional_test_response.choices[0].message.content.strip()
        try:
            functional_test_json = json.loads(functional_test_content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse functional test JSON directly")
            functional_test_json = extract_json_from_response(functional_test_content)
        
        logger.info("Building final response")
        return jsonify({
            "convertedCode": converted_code,
            "conversionNotes": conversion_notes,
            "unitTests": unit_test_code,
            "unitTestDetails": unit_test_json,
            "functionalTests": functional_test_json,
            "sourceLanguage": source_language,
            "targetLanguage": target_language,
            "databaseUsed": database_used,
            "chunkedProcessing": len(code_chunks) > 0
        })

    except Exception as e:
        logger.error(f"Error in code conversion or test generation: {str(e)}")
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500

@app.route("/api/languages", methods=["GET"])
def get_languages():
    """Return supported languages"""
    languages = [
        {"name": "COBOL", "icon": "📋"},
        {"name": "Java", "icon": "☕"},
        {"name": "C#", "icon": "🔷"},
    ]
    return jsonify({"languages": languages})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    logger.info(f"Starting Flask app on port {port}, debug mode: {debug}")
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug
    )