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
    
    // Build the prompt for Cloudflare AI
    const prompt = `You are an expert consultant specializing in AI-driven software development workflows and tooling.
Your task is to analyze a user's needs and recommend the top 3 AI software engineering tools from a provided list.

**User's Requirements:**
- Primary Goal: ${userChoices.goal === 'productivity' ? 'Boost individual developer productivity (Augmentation)' : 'Delegate and automate entire tasks (Automation)'}
- Technology Ecosystem: ${userChoices.ecosystem}
- Privacy Priority: ${userChoices.privacy === 'privacy' ? 'High - Prefers on-premise, self-hosted, or BYOK' : 'Low - Prefers maximum performance, cloud models are fine'}
- Primary User Persona: ${userChoices.persona}

**Available Tools Data:**
${JSON.stringify(toolsData, null, 2)}

**Your Task:**
Based *only* on the user's requirements and the provided tool data, identify the top 3 most suitable tools. For each recommendation, provide a concise, one-sentence justification explaining *why* it's a good fit for this specific user.

Please respond with a JSON object in this exact format:
{
  "recommendations": [
    {
      "rank": 1,
      "tool": "Tool Name",
      "justification": "One sentence explanation"
    },
    {
      "rank": 2,
      "tool": "Tool Name",
      "justification": "One sentence explanation"
    },
    {
      "rank": 3,
      "tool": "Tool Name",
      "justification": "One sentence explanation"
    }
  ]
}

Do not recommend tools that are a clear mismatch for the user's stated ecosystem or privacy preferences.`;

    // Use Cloudflare AI
    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are a helpful AI consultant. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    // Parse the AI response
    let recommendations;
    try {
      // Extract JSON from the response
      const responseText = aiResponse.response || aiResponse.result?.response || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('AI response parsing error:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(recommendations), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
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
