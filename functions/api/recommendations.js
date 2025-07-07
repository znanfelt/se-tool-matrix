export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Parse the request body
    const body = await request.json();
    const { userChoices, toolsData } = body;
    
    // Validate required fields
    if (!userChoices || !toolsData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Build the prompt for Gemini
    const prompt = `
      You are an expert consultant specializing in AI-driven software development workflows and tooling.
      Your task is to analyze a user's needs and recommend the top 3 AI software engineering tools from a provided list.

      **User's Requirements:**
      - Primary Goal: ${userChoices.goal === 'productivity' ? 'Boost individual developer productivity (Augmentation)' : 'Delegate and automate entire tasks (Automation)'}
      - Technology Ecosystem: ${userChoices.ecosystem}
      - Privacy Priority: ${userChoices.privacy === 'privacy' ? 'High - Prefers on-premise, self-hosted, or BYOK' : 'Low - Prefers maximum performance, cloud models are fine'}
      - Primary User Persona: ${userChoices.persona}

      **Available Tools Data:**
      ${JSON.stringify(toolsData, null, 2)}

      **Your Task:**
      Based *only* on the user's requirements and the provided tool data, identify the top 3 most suitable tools. For each recommendation, provide a concise, one-sentence justification explaining *why* it's a good fit for this specific user. Your response must be in the specified JSON format. Do not recommend tools that are a clear mismatch for the user's stated ecosystem or privacy preferences. For example, if the user is on AWS, prioritize AWS Q Developer. If they need high privacy, prioritize Tabnine, Aider, or Refact.ai.
    `;

    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];

    const payload = {
      contents: chatHistory,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            recommendations: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  rank: { type: "NUMBER" },
                  tool: { type: "STRING" },
                  justification: { type: "STRING" }
                },
                required: ["rank", "tool", "justification"]
              }
            }
          },
          required: ["recommendations"]
        }
      }
    };
    
    // Get API key from environment variable
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Gemini API error:', errorBody);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await response.json();
    
    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      const recommendations = JSON.parse(text);
      
      return new Response(JSON.stringify(recommendations), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
