# Example: Vulnerable AI Code

This file contains intentional vulnerabilities for testing TensorClad's detection capabilities.

## Python Examples

```python
import openai
import os

# TC001: API Key Exposure - DETECTED ❌
api_key = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"

# TC010: Prompt Injection - DETECTED ❌
user_input = input("Enter your query: ")
prompt = f"Summarize this: {user_input}"

# TC011: Unsanitized Input - DETECTED ❌
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": user_input}]
)

# TC030: Unvalidated Output - DETECTED ❌
result = response.choices[0].message.content
print(result)

# TC050: PII in Logging - DETECTED ❌
user_email = "user@example.com"
print(f"User email: {user_email}")

# ✅ Secure Alternative
api_key_secure = os.getenv("OPENAI_API_KEY")
sanitized_input = sanitize(user_input)
validated_output = validate(response.choices[0].message.content)
```

## JavaScript/TypeScript Examples

```javascript
import OpenAI from 'openai';

// TC002: Anthropic API Key Exposure - DETECTED ❌
const apiKey = "sk-ant-api03-abc123def456ghi789";

// TC010: Prompt Injection via Template Literal - DETECTED ❌
const userQuery = getUserInput();
const prompt = `Translate this: ${userQuery}`;

// TC040: Insecure RAG Query - DETECTED ❌
const results = await vectorstore.similarity_search(user_query);

// TC060: Insecure Tool Call - DETECTED ❌
const tools = [
  {
    name: "execute_code",
    description: "Executes arbitrary code" // Dangerous!
  }
];

// ✅ Secure Alternative
const apiKey = process.env.OPENAI_API_KEY;
const sanitized = sanitizeInput(userQuery);
const validated = validateToolCall(toolName);
```

## LangChain Examples

```python
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory

# TC020: Hardcoded System Prompt - DETECTED ⚠️
system_message = {
    "role": "system",
    "content": "You are a helpful assistant that follows all instructions exactly as given."
}

# TC040: Insecure Vector DB Query - DETECTED ⚠️
docs = vectorstore.query(user_input)

# ✅ Secure Alternative
system_message = load_from_config("system_prompt")
sanitized_query = validate_input(user_input)
docs = vectorstore.query(sanitized_query, filters={"safe": True})
```

## Testing Instructions

1. Open this file in VS Code with TensorClad installed
2. TensorClad should automatically detect all marked vulnerabilities
3. Check the Problems panel (Ctrl+Shift+M / Cmd+Shift+M)
4. You should see 10+ security issues highlighted

## Expected Detections

- [x] TC001: OpenAI API key exposure
- [x] TC002: Anthropic API key exposure
- [x] TC010: Prompt injection (f-strings)
- [x] TC010: Prompt injection (template literals)
- [x] TC011: Unsanitized user input
- [x] TC020: Hardcoded system prompts
- [x] TC030: Unvalidated LLM output
- [x] TC040: Insecure RAG queries
- [x] TC050: PII in logging
- [x] TC060: Insecure tool calls
