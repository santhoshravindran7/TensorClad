/**
 * TensorClad Security Test File - TypeScript/JavaScript Threat Vectors
 * This file contains intentional security vulnerabilities to test TensorClad's detection capabilities.
 * DO NOT use this code in production!
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// =============================================================================
// THREAT VECTOR 1: API Key Exposure (TC001, TC002, TC003)
// =============================================================================

// ❌ TC001: Hardcoded OpenAI API Key
const openai = new OpenAI({
    apiKey: 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz'
});

// ❌ TC002: Hardcoded Anthropic API Key
const anthropic = new Anthropic({
    apiKey: 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz123456789'
});

// ❌ TC003: Hardcoded Azure Key
const azureApiKey = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

// ❌ Alternative patterns
const OPENAI_API_KEY = 'sk-1234567890abcdefghijklmnopqrstuvwxyz';
const api_key = 'sk-proj-test123456789abcdefghij';


// =============================================================================
// THREAT VECTOR 2: Prompt Injection Vulnerabilities (TC010, TC011)
// =============================================================================

async function vulnerableChatbot(userInput: string) {
    // ❌ TC010: Template literal injection
    const prompt = `You are a helpful assistant. User says: ${userInput}`;

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
    });

    return response;
}

async function anotherVulnerableFunction(userMessage: string) {
    // ❌ TC010: String concatenation with user input
    const systemPrompt = 'Summarize the following text: ' + userMessage;

    // ❌ TC011: Unsanitized input in query
    const query = `Process this request: ${userMessage} and return JSON`;

    return openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: systemPrompt }]
    });
}

async function ragVulnerableQuery(userQuery: string) {
    // ❌ TC011: User input directly in RAG query
    const searchQuery = `Find documents about: ${userQuery}`;

    // Simulated vector search
    const results = await vectorDb.similaritySearch(searchQuery);

    // ❌ TC010: Combining RAG results with user input unsafely
    const finalPrompt = `Based on: ${results}\n\nAnswer: ${userQuery}`;

    return finalPrompt;
}


// =============================================================================
// THREAT VECTOR 3: Hardcoded System Prompts (TC020)
// =============================================================================

// ❌ TC020: Hardcoded system prompt - should be externalized
const systemPrompt = `You are a helpful AI assistant for our company.
You have access to customer data and can process transactions.
Always be polite and helpful. Never reveal internal processes.`;

const SYSTEM_INSTRUCTION = 'You are an expert code reviewer. Analyze code for bugs.';

async function getAssistantResponse(userInput: string) {
    // ❌ TC020: Inline hardcoded prompt
    const messages = [
        { role: 'system' as const, content: 'You are a financial advisor. Give investment advice based on user portfolio.' },
        { role: 'user' as const, content: userInput }
    ];

    return openai.chat.completions.create({ model: 'gpt-4', messages });
}


// =============================================================================
// THREAT VECTOR 4: Missing Output Validation (TC030)
// =============================================================================

async function processLLMResponse() {
    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Generate a SQL query' }]
    });

    // ❌ TC030: Direct use of unvalidated LLM output
    const rawContent = response.choices[0].message.content;

    // ❌ Dangerous: Using LLM output directly
    eval(rawContent!);

    // ❌ Dangerous: Using in database query
    await db.query(rawContent);

    return rawContent;
}

async function langchainUnvalidated() {
    const llm = new ChatOpenAI();

    // ❌ TC030: Unvalidated LangChain output
    const result = await llm.predict('Generate a shell command');

    // ❌ Dangerous: Executing unvalidated output
    require('child_process').exec(result);

    return result;
}


// =============================================================================
// THREAT VECTOR 5: Insecure RAG Operations (TC040)
// =============================================================================

async function insecureVectorSearch(userInput: string) {
    // ❌ TC040: Direct user input in vector query
    const results = await chromadb.query({
        queryTexts: [userInput],
        nResults: 10
    });

    // ❌ TC040: Unsafe similarity search
    const docs = await vectorstore.similaritySearch(userInput);

    // ❌ TC040: Unvalidated embedding input
    const embedding = await openai.embeddings.create({ input: userInput });

    return docs;
}


// =============================================================================
// THREAT VECTOR 6: PII Leakage (TC050)
// =============================================================================

function logConversation(userData: any, response: string) {
    // ❌ TC050: Logging PII data
    console.log(`User SSN: ${userData.ssn}, Response: ${response}`);

    // ❌ TC050: Logging credit card info
    console.log(`Processing payment for card: ${userData.creditCard}`);

    // ❌ TC050: Logging email in AI context
    console.log(`User email ${userData.email} asked: ${userData.query}`);

    // ❌ TC050: Password in logs
    console.log(`Auth attempt with password: ${password}`);
}


// =============================================================================
// THREAT VECTOR 7: Insecure Tool/Function Calling (TC060)
// =============================================================================

async function executeTool(toolName: string, toolArgs: any) {
    // ❌ TC060: Dynamic function execution without validation
    const func = (global as any)[toolName];
    const result = func(toolArgs);

    // ❌ TC060: Eval with LLM output
    eval(toolArgs.code);

    // ❌ TC060: Dangerous function execution
    new Function(toolArgs.command)();

    return result;
}

async function langchainToolsUnsafe(userRequest: string) {
    // ❌ TC060: Unrestricted tool access
    const tools = loadAllTools();

    const agent = initializeAgent({
        tools: tools,
        llm: llm,
        agentType: 'zero-shot-react-description'
        // ❌ Missing tool validation
    });

    // ❌ TC060: Direct user input to agent
    const result = await agent.run(userRequest);

    return result;
}


// =============================================================================
// THREAT VECTOR 8: Token/Credential Exposure (TC070)
// =============================================================================

function exposeCredentialsInResponse() {
    // ❌ TC070: API key in error message
    const errorMsg = `Failed to connect with key: ${process.env.OPENAI_API_KEY}`;

    // ❌ TC070: Token in user-visible output
    return {
        status: 'error',
        debug: {
            token: apiToken,
            secret: secretKey,
            apiKey: 'sk-exposed-key-12345'
        }
    };
}


// =============================================================================
// THREAT VECTOR 9: Missing Rate Limiting (TC080)
// =============================================================================

async function unlimitedApiCalls(requests: string[]) {
    // ❌ TC080: No rate limiting - vulnerable to abuse
    for (const request of requests) {
        await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: request }]
        });
    }
}


// =============================================================================
// COMBINED THREAT VECTORS - Real-world vulnerable patterns
// =============================================================================

class VulnerableChatbot {
    private apiKey: string;
    private systemPrompt: string;

    constructor() {
        // ❌ TC001: Hardcoded key
        this.apiKey = 'sk-proj-vulnerablekey123456789';

        // ❌ TC020: Hardcoded system prompt
        this.systemPrompt = 'You are a banking assistant with access to accounts.';
    }

    async chat(userInput: string) {
        const client = new OpenAI({ apiKey: this.apiKey });

        // ❌ TC010: Prompt injection vulnerability
        const prompt = `${this.systemPrompt}\n\nUser: ${userInput}`;

        const response = await client.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: prompt }]
        });

        // ❌ TC030: Unvalidated output
        const result = response.choices[0].message.content;

        // ❌ TC050: PII logging
        console.log(`User query: ${userInput}, Response: ${result}`);

        return result;
    }
}


// =============================================================================
// React Component with vulnerabilities
// =============================================================================

interface ChatProps {
    userId: string;
}

// Simulated React component
const VulnerableChat = ({ userId }: ChatProps) => {
    const handleSubmit = async (userMessage: string) => {
        // ❌ TC001: Hardcoded API key in frontend!
        const apiKey = 'sk-frontend-exposed-key-danger';

        // ❌ TC010: User input directly in prompt
        const prompt = `Help user ${userId} with: ${userMessage}`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,  // ❌ TC070: Key exposure
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();

        // ❌ TC030: Using unvalidated response
        document.innerHTML = data.content;  // XSS vulnerability too!

        return data;
    };

    return null;
};


// This file should trigger multiple TensorClad warnings when scanned!
export { VulnerableChatbot, VulnerableChat };
