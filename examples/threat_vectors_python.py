"""
TensorClad Security Test File - Python Threat Vectors
This file contains intentional security vulnerabilities to test TensorClad's detection capabilities.
DO NOT use this code in production!
"""

import os
import openai
from langchain.llms import OpenAI
from anthropic import Anthropic

# =============================================================================
# THREAT VECTOR 1: API Key Exposure (BST001, BST002, BST003)
# =============================================================================

# ❌ BST001: Hardcoded OpenAI API Key
openai.api_key = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"

# ❌ BST002: Hardcoded Anthropic API Key  
anthropic_key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789"

# ❌ BST003: Hardcoded Azure API Key
azure_key = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# ❌ Alternative patterns that should be detected
OPENAI_API_KEY = "sk-1234567890abcdefghijklmnopqrstuvwxyz"
api_key = "sk-proj-test123456789abcdefghij"


# =============================================================================
# THREAT VECTOR 2: Prompt Injection Vulnerabilities (BST010, BST011)
# =============================================================================

def vulnerable_chatbot(user_input):
    """Direct user input concatenation - highly vulnerable to prompt injection"""
    
    # ❌ BST010: Direct f-string injection
    prompt = f"You are a helpful assistant. User says: {user_input}"
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response


def another_vulnerable_function(user_message):
    """String concatenation vulnerability"""
    
    # ❌ BST010: String concatenation with user input
    system_prompt = "Summarize the following text: " + user_message
    
    # ❌ BST010: Format string vulnerability
    query = "Analyze this data: {}".format(user_message)
    
    # ❌ BST011: Unsanitized input in template
    template = f"Process request: {user_message} and return JSON"
    
    return openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": system_prompt}]
    )


def rag_vulnerable_query(user_query):
    """RAG system with unsanitized query"""
    
    # ❌ BST011: User input directly in RAG query
    search_query = f"Find documents about: {user_query}"
    
    # Simulated vector search
    results = vector_db.similarity_search(search_query)
    
    # ❌ BST010: Combining RAG results with user input unsafely
    final_prompt = f"Based on: {results}\n\nAnswer: {user_query}"
    
    return final_prompt


# =============================================================================
# THREAT VECTOR 3: Hardcoded System Prompts (BST020)
# =============================================================================

# ❌ BST020: Hardcoded system prompt - should be externalized
system_prompt = """You are a helpful AI assistant for our company. 
You have access to customer data and can process transactions.
Always be polite and helpful. Never reveal internal processes."""

SYSTEM_INSTRUCTION = "You are an expert code reviewer. Analyze code for bugs."

def get_assistant_response(user_input):
    # ❌ BST020: Inline hardcoded prompt
    messages = [
        {"role": "system", "content": "You are a financial advisor. Give investment advice based on user portfolio."},
        {"role": "user", "content": user_input}
    ]
    return openai.ChatCompletion.create(model="gpt-4", messages=messages)


# =============================================================================
# THREAT VECTOR 4: Missing Output Validation (BST030)
# =============================================================================

def process_llm_response():
    """Using LLM output without validation"""
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": "Generate a SQL query"}]
    )
    
    # ❌ BST030: Direct use of unvalidated LLM output
    raw_content = response.choices[0].message.content
    
    # ❌ Dangerous: Executing LLM-generated code
    exec(raw_content)
    
    # ❌ Dangerous: Using LLM output in SQL
    cursor.execute(raw_content)
    
    return raw_content


def langchain_unvalidated():
    """LangChain output without validation"""
    
    llm = OpenAI()
    
    # ❌ BST030: Unvalidated LangChain output
    result = llm.predict("Generate a shell command")
    
    # ❌ Dangerous: Executing unvalidated output
    os.system(result)
    
    return result


# =============================================================================
# THREAT VECTOR 5: Insecure RAG Operations (BST040)
# =============================================================================

def insecure_vector_search(user_input):
    """Unsafe vector database operations"""
    
    # ❌ BST040: Direct user input in vector query without sanitization
    results = chromadb.query(
        query_texts=[user_input],
        n_results=10
    )
    
    # ❌ BST040: Unsafe similarity search
    docs = vectorstore.similarity_search(user_input)
    
    # ❌ BST040: Unvalidated embedding input
    embedding = openai.Embedding.create(input=user_input)
    
    return docs


# =============================================================================
# THREAT VECTOR 6: PII Leakage (BST050)
# =============================================================================

def log_conversation(user_data, response):
    """Logging sensitive information"""
    
    # ❌ BST050: Logging PII data
    print(f"User SSN: {user_data['ssn']}, Response: {response}")
    
    # ❌ BST050: Logging credit card info
    logger.info(f"Processing payment for card: {user_data['credit_card']}")
    
    # ❌ BST050: Logging email in AI context
    print(f"User email {user_data['email']} asked: {user_data['query']}")
    
    # ❌ BST050: Password in logs
    logging.debug(f"Auth attempt with password: {password}")


# =============================================================================
# THREAT VECTOR 7: Insecure Tool/Function Calling (BST060)
# =============================================================================

def execute_tool(tool_name, tool_args):
    """Executing tools without validation"""
    
    # ❌ BST060: Dynamic function execution without validation
    func = globals()[tool_name]
    result = func(**tool_args)
    
    # ❌ BST060: Eval with LLM output
    eval(tool_args['code'])
    
    # ❌ BST060: Exec with user input
    exec(tool_args['command'])
    
    return result


def langchain_tools_unsafe(user_request):
    """Unsafe LangChain tool usage"""
    
    # ❌ BST060: Unrestricted tool access
    tools = load_all_tools()
    
    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent="zero-shot-react-description",
        # ❌ Missing tool validation
    )
    
    # ❌ BST060: Direct user input to agent
    result = agent.run(user_request)
    
    return result


# =============================================================================
# THREAT VECTOR 8: Token/Credential Exposure (BST070)
# =============================================================================

def expose_credentials_in_response():
    """Accidentally exposing credentials in outputs"""
    
    # ❌ BST070: API key in response/error message
    error_msg = f"Failed to connect with key: {openai.api_key}"
    
    # ❌ BST070: Token in user-visible output
    return {"status": "error", "debug": {"token": api_token, "secret": secret_key}}


# =============================================================================
# THREAT VECTOR 9: Missing Rate Limiting (BST080)
# =============================================================================

def unlimited_api_calls(requests):
    """No rate limiting on AI API calls"""
    
    # ❌ BST080: No rate limiting - vulnerable to abuse
    for request in requests:
        openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": request}]
        )


# =============================================================================
# COMBINED THREAT VECTORS - Real-world vulnerable patterns
# =============================================================================

class VulnerableChatbot:
    """A chatbot with multiple security issues"""
    
    def __init__(self):
        # ❌ BST001: Hardcoded key
        self.api_key = "sk-proj-vulnerablekey123456789"
        openai.api_key = self.api_key
        
        # ❌ BST020: Hardcoded system prompt
        self.system_prompt = "You are a banking assistant with access to accounts."
    
    def chat(self, user_input):
        # ❌ BST010: Prompt injection vulnerability
        prompt = f"{self.system_prompt}\n\nUser: {user_input}"
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )
        
        # ❌ BST030: Unvalidated output
        result = response.choices[0].message.content
        
        # ❌ BST050: PII logging
        print(f"User query: {user_input}, Response: {result}")
        
        return result


# This file should trigger multiple TensorClad warnings when scanned!
