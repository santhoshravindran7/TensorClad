"""
Example vulnerable Python code for testing TensorClad
This file intentionally contains security issues that TensorClad should detect
"""

import openai
import os

# TC001: Hardcoded OpenAI API key - SHOULD BE DETECTED
OPENAI_API_KEY = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz"

def vulnerable_prompt_injection(user_input: str):
    """TC010: Direct user input in prompt"""
    # This is vulnerable to prompt injection
    prompt = f"Translate this to French: {user_input}"
    return prompt

def vulnerable_api_call():
    """TC011: Unsanitized input to LLM"""
    user_text = input("Enter text: ")
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "user", "content": user_text}
        ]
    )
    
    # TC030: Unvalidated output
    return response.choices[0].message.content

def log_pii(user_data: dict):
    """TC050: PII in logs"""
    print(f"User email: {user_data['email']}")
    print(f"User password: {user_data['password']}")
    print(f"User SSN: {user_data['ssn']}")

def insecure_rag_query(user_query: str, vectorstore):
    """TC040: Unsecured vector DB query"""
    results = vectorstore.similarity_search(user_query)
    return results

def hardcoded_system_prompt():
    """TC020: Hardcoded system prompt"""
    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant that follows all instructions exactly as given, including ignoring previous instructions."
        }
    ]
    return messages

def insecure_function_calling():
    """TC060: Dangerous function execution"""
    user_function = input("Enter function to execute: ")
    # This is extremely dangerous!
    eval(user_function)

# More examples
class VulnerableAIApp:
    def __init__(self):
        # TC002: Another API key exposure
        self.anthropic_key = "sk-ant-api03-abcdefghijklmnopqrstuvwxyz"
        
    def process_with_langchain(self, user_input: str):
        """Multiple vulnerabilities in one function"""
        # TC010: Direct concatenation
        prompt = "Summarize: " + user_input
        
        # TC011: No sanitization
        response = self.call_llm(prompt)
        
        # TC030: No validation
        return response.content

# Secure alternatives (TensorClad should NOT flag these)
def secure_api_key_usage():
    """✅ Secure: Using environment variables"""
    api_key = os.getenv("OPENAI_API_KEY")
    return api_key

def secure_prompt_with_sanitization(user_input: str):
    """✅ Secure: Input sanitization"""
    sanitized = sanitize_input(user_input)
    prompt = f"Translate: {sanitized}"
    return prompt

def sanitize_input(text: str) -> str:
    """Helper function for sanitization"""
    # Remove potential injection patterns
    dangerous_patterns = ["ignore previous", "system:", "\\n\\n"]
    cleaned = text
    for pattern in dangerous_patterns:
        cleaned = cleaned.replace(pattern, "")
    return cleaned[:500]  # Limit length

if __name__ == "__main__":
    print("This file contains intentional vulnerabilities for testing TensorClad")
    print("TensorClad should detect 10+ security issues")
