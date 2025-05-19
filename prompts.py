"""
Module for generating prompts for code analysis and conversion.
"""

def create_business_requirements_prompt(source_language, source_code, vsam_definition=""):
    """
    Creates a prompt for analyzing business requirements from source code.
    
    Args:
        source_language (str): The programming language of the source code
        source_code (str): The source code to analyze
        vsam_definition (str): Optional VSAM file definition
        
    Returns:
        str: The prompt for business requirements analysis
    """
    vsam_section = ""
    if vsam_definition:
        vsam_section = f"""
        VSAM Definition:
        {vsam_definition}
        """

    return f"""
            You are a business analyst responsible for analyzing and documenting the business requirements from the following {source_language} code and VSAM definition. Your task is to interpret the code's intent and extract meaningful business logic suitable for non-technical stakeholders.

            The code may be written in a legacy language like COBOL, possibly lacking comments or modern structure. You must infer business rules by examining variable names, control flow, data manipulation, and any input/output operations, including VSAM file structures. Focus only on **business intent**—do not describe technical implementation.

            ### Output Format Instructions:
            - Use plain text headings and paragraphs with the following structure:
            - Use '#' for main sections (equivalent to h2)
            - Use '##' for subsection headings (equivalent to h4)
            - Use '###' for regular paragraph text
            - Use '-' for bullet points and emphasize them by using bold tone in phrasing
            - Do not give response with ** anywhere.
            - Do NOT use Markdown formatting like **bold**, _italic_, or backticks

            ### Structure your output into these 5 sections:

            # Overview
            ## Purpose of the System  
            ### Describe the system's primary function and how it fits into the business.
            ## Context and Business Impact  
            ### Explain the operational context and value the system provides.

            # Objectives
            ## Primary Objective  
            ### Clearly state the system's main goal.
            ## Key Outcomes  
            ### Outline expected results (e.g., improved processing speed, customer satisfaction).

            # Business Rules & Requirements
            ## Business Purpose  
            ### Explain the business objective behind this specific module or logic.
            ## Business Rules  
            ### List the inferred rules/conditions the system enforces.
            ## Impact on System  
            ### Describe how this part affects the system's overall operation.
            ## Constraints  
            ### Note any business limitations or operational restrictions.

            # Assumptions & Recommendations
            - Assumptions  
            ### Describe what is presumed about data, processes, or environment.
            - Recommendations  
            ### Suggest enhancements or modernization directions.

            # Expected Output
            ## Output  
            ### Describe the main outputs (e.g., reports, logs, updates).
            ## Business Significance  
            ### Explain why these outputs matter for business processes.
            

            {source_language} Code:
            {source_code}

            {vsam_section}
            """

def create_technical_requirements_prompt(source_language, target_language, source_code, vsam_definition=""):
    """
    Creates a prompt for analyzing technical requirements from source code.
    
    Args:
        source_language (str): The programming language of the source code
        target_language (str): The target programming language for conversion
        source_code (str): The source code to analyze
        vsam_definition (str): Optional VSAM file definition
        
    Returns:
        str: The prompt for technical requirements analysis
    """
    vsam_section = ""
    if vsam_definition:
        vsam_section = f"""
        VSAM Definition:
        {vsam_definition}

        Additional Requirements for VSAM:
        - Analyze VSAM file structures and access methods
        - Map VSAM record layouts to appropriate database tables or data structures
        - Consider VSAM-specific operations (KSDS, RRDS, ESDS) and their equivalents
        - Plan for data migration from VSAM to modern storage
        """

    return f"""
            Analyze the following {source_language} code and extract the technical requirements for migrating it to {target_language}.
            Do not use any Markdown formatting (e.g., no **bold**, italics, or backticks).
            Return plain text only.

            **Focus on implementation details such as:**
            "1. Examine the entire codebase first to understand architectural patterns and dependencies.\n"
            "2. Analyze code in logical sections, mapping technical components to system functions.\n"
            "3. For each M204 or COBOL-specific construct, identify the exact technical requirement it represents.\n"
            "4. Document all technical constraints, dependencies, and integration points.\n"
            "5. Pay special attention to error handling, transaction management, and data access patterns.\n\n"
            "kindat each requirement as 'The system must [specific technical capability]' or 'The system should [specific technical capability]' with direct traceability to code sections.\n\n"
            "Ensure your output captures ALL technical requirements including:\n"
            "- Data structure definitions and relationships\n"
            "- Processing algorithms and computation logic\n"
            "- I/O operations and file handling\n"
            "- Error handling and recovery mechanisms\n"
            "- Performance considerations and optimizations\n"
            "- Security controls and access management\n"
            "- Integration protocols and external system interfaces\n"
            "- Database Interactions and equivalent in target language\n"
            "- VSAM file structures and their modern equivalents\n"


            Format your response as a numbered list with '# Technical Requirements' as the title.
            Each requirement should start with a number followed by a period (e.g., "1.", "2.", etc.)

            {source_language} Code:
            {source_code}

            {vsam_section}
             """

def create_code_conversion_prompt(
    source_language,
    target_language,
    source_code,
    business_requirements,
    technical_requirements,
    db_setup_template,
    vsam_definition="",
    is_chunk=False,
    chunk_type=None
):
    """
    Creates a prompt for converting code from one language to another.
    Supports chunked COBOL code for declarations and procedures.

    Args:
        source_language (str): The programming language of the source code
        target_language (str): The target programming language for conversion
        source_code (str): The source code to convert
        business_requirements (str): The business requirements extracted from analysis
        technical_requirements (str): The technical requirements extracted from analysis
        db_setup_template (str): The database setup template for the target language
        vsam_definition (str): Optional VSAM file definition
        is_chunk (bool): Whether the code is a chunk of a larger COBOL program
        chunk_type (str): Type of chunk ('declarations' or 'procedures') for COBOL

    Returns:
        str: The prompt for code conversion

    Raises:
        ValueError: If chunk_type is invalid when is_chunk is True
    """
    vsam_section = ""
    if vsam_definition:
        vsam_section = f"""
        **VSAM Definition:**
        {vsam_definition}

        **VSAM-Specific Instructions:**
        - Convert VSAM file structures to appropriate database tables or data structures
        - Map VSAM operations to equivalent database operations
        - Maintain VSAM-like functionality (KSDS, RRDS, ESDS) using modern storage
        - Ensure data integrity and transaction management
        """

    base_prompt = f"""
        **Important- Please ensure that the {source_language} code is translated into its exact equivalent in {target_language}, without missing any part of the logic or functionality.**
    Convert the following {source_language} code to {target_language} while strictly adhering to the provided business and technical requirements.

    **Source Language:** {source_language}
    **Target Language:** {target_language}

    {vsam_section}
    """
    if is_chunk and source_language.upper() == "COBOL":
        if chunk_type == "declarations":
            base_prompt += f"""
    **Chunk Type:** Declarations (Identification, Environment, and Data Divisions)
    **Instructions for Declarations Chunk:**
    - Focus on converting COBOL data structures, file definitions, and variable declarations to {target_language}.
    - Generate appropriate class structures, fields, and data types in {target_language}.
    - Do not include method implementations, as the Procedure Division will be converted separately.
    - Ensure the output is a valid {target_language} class or module with all necessary fields and structures.
    """
        elif chunk_type == "procedures":
            base_prompt += f"""
    **Chunk Type:** Procedures (Procedure Division)
    **Instructions for Procedures Chunk:**
    - Focus on converting COBOL business logic and procedures to {target_language} methods or functions.
    - Assume the data structures and declarations are already converted and available in {target_language}.
    - Generate only the method implementations and related logic, ensuring they integrate with the previously converted declarations.
    """
        else:
            raise ValueError(f"Invalid chunk_type: {chunk_type}. Must be 'declarations' or 'procedures'.")

    base_prompt += f"""
    **Requirements:**
    - The output should be a complete, executable implementation in the target language
    - Maintain all business logic, functionality, and behavior of the original code
    - Produce idiomatic code following best practices in the target language
    - Include all necessary class definitions, method implementations, and boilerplate code
    - Ensure consistent data handling, formatting, and computations
    - DO NOT include markdown code blocks (like ```java or ```) in your response, just provide the raw code
    - Do not return any unwanted code in {target_language} or functions which are not in {source_language}.

    **Language-Specific Instructions:**
    - If converting to Java: Produce a fully functional and idiomatic Java implementation with appropriate class structures
    - If converting to C#: Produce a fully functional and idiomatic C# implementation that matches the original behavior exactly

    **Database-Specific Instructions**
    - If the {source_language} code includes any database-related operations, automatically generate the necessary JDBC MySQL setup code to initialize the database connection. Also, include SQL queries to create the required tables. The user should not have to perform any manual database setup—only the database name and username will be provided manually.
    - Ensure that the user doesn't need to manually set up the schema.
    - Add Queries to setup the schema after adding database initializations.
    - Follow this example format for database initialization and setup:

    {db_setup_template if db_setup_template else 'No database setup required.'}

    **Business Requirements:**
    {business_requirements if business_requirements else 'None provided.'}

    **Technical Requirements:**
    {technical_requirements if technical_requirements else 'None provided.'}

    **Source Code ({source_language}):**
    {source_code}

    IMPORTANT: Only return the complete converted code WITHOUT any markdown formatting. DO NOT wrap your code in triple backticks (```). Return just the raw code itself.
    """

    return base_prompt



def create_unit_test_prompt(target_language, converted_code, business_requirements, technical_requirements):
    """Create a prompt for generating unit tests for the converted code"""
    
    prompt = f"""
    You are tasked with creating comprehensive unit tests for newly converted {target_language} code.
    
    Please generate unit tests for the following {target_language} code. The tests should verify that 
    the code meets all business requirements and handles edge cases appropriately.
    
    Business Requirements:
    {business_requirements}
    
    Technical Requirements:
    {technical_requirements}
    
    Converted Code ({target_language}):
    
    ```
    {converted_code}
    ```
    
    Guidelines for the unit tests:
    1. Use appropriate unit testing framework for {target_language} (e.g., JUnit for Java, NUnit/xUnit for C#)
    2. Create tests for all public methods and key functionality
    3. Include positive test cases, negative test cases, and edge cases
    4. Use mocks/stubs for external dependencies where appropriate
    5. Follow test naming conventions that clearly describe what is being tested
    6. Include setup and teardown as needed
    7. Add comments explaining complex test scenarios
    8. Ensure high code coverage, especially for complex business logic
    
    Provide ONLY the unit test code without additional explanations.
    """
    
    return prompt


def create_functional_test_prompt(target_language, converted_code, business_requirements):
    """Create a prompt for generating functional test cases based on business requirements"""
    
    prompt = f"""
    You are tasked with creating functional test cases for a newly converted {target_language} application.
    Give response of functional tests in numeric plain text numbering.
    
    Please generate comprehensive functional test cases that verify the application meets all business requirements.
    These test cases will be used by QA engineers to validate the application functionality.
    
    Business Requirements:
    {business_requirements}
    
    Converted Code ({target_language}):
    
    ```
    {converted_code}
    ```
    
    Guidelines for functional test cases:
    1. Create test cases that cover all business requirements
    2. Organize test cases by feature or business functionality
    3. For each test case, include:
       a. Test ID and title
       b. Description/objective
       c. Preconditions
       d. Test steps with clear instructions
       e. Expected results
       f. Priority (High/Medium/Low)
    4. Include both positive and negative test scenarios
    5. Include test cases for boundary conditions and edge cases
    6. Create end-to-end test scenarios that cover complete business processes
    
    Format your response as a structured test plan document with clear sections and test case tables.
    Return the response in JSON FORMAT
    """
    
    return prompt