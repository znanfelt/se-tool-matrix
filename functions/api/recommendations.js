/**
 * Create a simple hash for cache keys (using Web Crypto API)
 * @param {string} input - The input string to hash
 * @returns {Promise<string>} - A hex hash string
 */
async function createSimpleHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

export async function onRequestPost(context) {
  const { request, env, cf } = context;
  
  try {
    // Enhanced security headers and CORS check
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://se-tool-matrix.pages.dev',           // Production domain
      'https://se-tool-matrix-preview.pages.dev',  // Preview domain
      'https://matrix.zacharynanfelt.com',
      'http://localhost:8788',                      // Local development
      'http://localhost:3000',                      // Alternative local dev
      'http://127.0.0.1:8788',                      // Local development
      'http://127.0.0.1:3000'                       // Alternative local dev
    ];
    
    // Check if origin is allowed (strict allowlist only)
    const isAllowedOrigin = !origin || allowedOrigins.some(allowed => 
      origin === allowed || 
      (allowed.includes('pages.dev') && origin.endsWith('.pages.dev') && origin.includes('se-tool-matrix'))
    );

    if (!isAllowedOrigin) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      });
    }

    // Check request size (limit to 1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Request too large' }), {
        status: 413,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    const { userChoices, toolsData } = body;
    
    // Enhanced input validation
    if (!userChoices || !toolsData || !Array.isArray(toolsData)) {
      return new Response(JSON.stringify({ error: 'Invalid request structure' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Validate userChoices structure
    const requiredFields = ['goal', 'ecosystem', 'privacy', 'persona'];
    for (const field of requiredFields) {
      if (!userChoices[field] || typeof userChoices[field] !== 'string') {
        return new Response(JSON.stringify({ error: `Invalid or missing field: ${field}` }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
      
      // Check field length limits
      if (userChoices[field].length > 100) {
        return new Response(JSON.stringify({ error: `Field ${field} too long` }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }

    // Validate toolsData structure and limit size
    if (toolsData.length > 50) { // Reasonable limit
      return new Response(JSON.stringify({ error: 'Too many tools provided' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    // Validate each tool structure
    for (const tool of toolsData) {
      const toolName = tool.name || tool.tool; // Support both 'name' and 'tool' properties
      if (!toolName || typeof toolName !== 'string' || toolName.length > 100) {
        return new Response(JSON.stringify({ error: 'Invalid tool data structure' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }

    // Sanitize inputs to prevent injection attacks
    const sanitizeString = (str) => str.replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '').trim();
    const sanitizedChoices = {
      goal: sanitizeString(userChoices.goal),
      ecosystem: sanitizeString(userChoices.ecosystem),
      privacy: sanitizeString(userChoices.privacy),
      persona: sanitizeString(userChoices.persona)
    };

    // Validate sanitized inputs are not empty
    for (const [key, value] of Object.entries(sanitizedChoices)) {
      if (!value) {
        return new Response(JSON.stringify({ error: `Invalid characters in field: ${key}` }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }
    }

    // 🚀 AGGRESSIVE CACHING IMPLEMENTATION
    // Create a cache key based on user choices and tool data
    const cacheKeyData = {
      choices: sanitizedChoices,
      toolsCount: toolsData.length,
      toolsHash: await createSimpleHash(JSON.stringify(toolsData.map(t => ({ name: t.name || t.tool, category: t.category }))))
    };
    const cacheKey = `ai-recommendations:${await createSimpleHash(JSON.stringify(cacheKeyData))}`;
    
    // Check Cloudflare cache first
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    cacheUrl.searchParams.set('key', cacheKey);
    
    let cachedResponse = await cache.match(cacheUrl);
    if (cachedResponse) {
      console.log('Cache HIT for key:', cacheKey);
      // Add cache headers to cached response
      const response = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers: {
          ...Object.fromEntries(cachedResponse.headers),
          'X-Cache-Status': 'HIT',
          'Access-Control-Allow-Origin': origin || 'null',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
      return response;
    }
    
    console.log('Cache MISS for key:', cacheKey);

    // Build the prompt for Cloudflare AI
    const prompt = `You are an expert consultant specializing in AI-driven software development workflows and tooling.
Your task is to analyze a user's needs and recommend the top 3 AI software engineering tools from a provided list.

**User's Requirements:**
- Primary Goal: ${sanitizedChoices.goal === 'productivity' ? 'Boost individual developer productivity (Augmentation)' : 'Delegate and automate entire tasks (Automation)'}
- Technology Ecosystem: ${sanitizedChoices.ecosystem}
- Privacy Priority: ${sanitizedChoices.privacy === 'privacy' ? 'High - Prefers on-premise, self-hosted, or BYOK' : 'Low - Prefers maximum performance, cloud models are fine'}
- Primary User Persona: ${sanitizedChoices.persona}

**Available Tools Data:**
${JSON.stringify(toolsData.slice(0, 50), null, 2)} // Limit tools data size

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

    // Use Cloudflare AI with timeout and error handling
    let aiResponse;
    try {
      // Add timeout by using a race condition
      const aiPromise = env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "You are a helpful AI consultant. Always respond with valid JSON in the exact format requested. Do not include any additional text or formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI request timeout')), 30000) // 30 second timeout
      );

      aiResponse = await Promise.race([aiPromise, timeoutPromise]);
    } catch (aiError) {
      console.error('AI service error:', aiError.message);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Secure AI response parsing with additional validation
    let recommendations;
    try {
      // Extract and validate JSON from the response
      const responseText = aiResponse.response || aiResponse.result?.response || '';
      
      if (!responseText || responseText.length > 10000) { // Prevent excessively large responses
        throw new Error('Invalid response size');
      }
      
      // More secure JSON extraction - find the complete JSON object
      const firstBrace = responseText.indexOf('{');
      if (firstBrace === -1) {
        throw new Error('No valid JSON found in response');
      }
      
      let braceCount = 0;
      let endPos = firstBrace;
      
      for (let i = firstBrace; i < responseText.length; i++) {
        if (responseText[i] === '{') {
          braceCount++;
        } else if (responseText[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            endPos = i;
            break;
          }
        }
      }
      
      if (braceCount !== 0) {
        throw new Error('Invalid JSON structure - unmatched braces');
      }
      
      const jsonString = responseText.substring(firstBrace, endPos + 1);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (jsonError) {
        throw new Error('Invalid JSON structure');
      }
      
      // Validate response structure
      if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
        throw new Error('Invalid response structure');
      }

      if (parsedResponse.recommendations.length === 0) {
        throw new Error('No recommendations provided');
      }

      // Validate and sanitize each recommendation
      recommendations = parsedResponse.recommendations.slice(0, 3).map((rec, index) => {
        if (!rec || typeof rec !== 'object') {
          return {
            rank: index + 1,
            tool: 'Unknown',
            justification: 'No recommendation available'
          };
        }
        
        return {
          rank: index + 1,
          tool: typeof rec.tool === 'string' ? sanitizeString(rec.tool.substring(0, 100)) : 'Unknown',
          justification: typeof rec.justification === 'string' ? sanitizeString(rec.justification.substring(0, 500)) : 'No justification provided'
        };
      });

      // Ensure we have exactly 3 recommendations
      while (recommendations.length < 3) {
        recommendations.push({
          rank: recommendations.length + 1,
          tool: 'No additional recommendation',
          justification: 'Insufficient data for additional recommendations'
        });
      }

    } catch (parseError) {
      console.error('Response parsing error:', parseError.message);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
    
    // 🚀 CREATE CACHED RESPONSE WITH AGGRESSIVE CACHING
    const responseData = JSON.stringify({ recommendations });
    const response = new Response(responseData, {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || 'null',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        
        // 🚀 AGGRESSIVE CACHING HEADERS
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1 hour browser, 24 hours edge
        'ETag': `"${cacheKey}"`,
        'Vary': 'Origin',
        'X-Cache-Status': 'MISS',
        
        // Performance headers
        'CF-Cache-Tag': 'ai-recommendations',
        'Edge-Cache-Tag': 'recommendations'
      }
    });

    // Store in Cloudflare cache for 24 hours
    try {
      const cacheResponse = response.clone();
      await cache.put(cacheUrl, cacheResponse);
      console.log('Cached response for key:', cacheKey);
    } catch (cacheError) {
      console.warn('Failed to cache response:', cacheError.message);
    }

    return response;
    
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('API error:', error.message);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  }
}

// Handle CORS preflight requests with strict security
export async function onRequestOptions(context) {
  const { request } = context;
  const origin = request.headers.get('Origin');
  
  const allowedOrigins = [
    'https://se-tool-matrix.pages.dev',
    'https://se-tool-matrix-preview.pages.dev',
    'https://matrix.zacharynanfelt.com',
    'http://localhost:8788',
    'http://localhost:3000',
    'http://127.0.0.1:8788',
    'http://127.0.0.1:3000'
  ];
  
  const isAllowedOrigin = origin && allowedOrigins.some(allowed => 
    origin === allowed || 
    (allowed.includes('pages.dev') && origin.endsWith('.pages.dev') && origin.includes('se-tool-matrix'))
  );
  
  if (!isAllowedOrigin) {
    return new Response(null, {
      status: 403,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    }
  });
}

// Handle cache purging (Admin only)
export async function onRequestDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const purgeKey = url.searchParams.get('key');
  
  // Simple admin check using environment variable
  const adminToken = url.searchParams.get('token');
  const expectedToken = env.ADMIN_TOKEN || 'change-me-in-production';
  if (adminToken !== expectedToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    if (purgeKey === 'all') {
      // Purge all cached recommendations
      // Note: Cloudflare Workers doesn't have a direct "purge all" API
      // This would typically be done via Cloudflare API
      return new Response(JSON.stringify({ 
        message: 'Cache purge requested. Use Cloudflare dashboard to purge by cache tag: ai-recommendations' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid purge request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Purge failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle cache statistics (GET request)
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  if (url.pathname.endsWith('/cache-stats')) {
    return new Response(JSON.stringify({
      caching: {
        enabled: true,
        strategy: 'aggressive',
        browserTTL: '1 hour',
        edgeTTL: '24 hours',
        keyStrategy: 'SHA-256 hash of user choices + tools',
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
          'CF-Cache-Tag': 'ai-recommendations'
        }
      },
      endpoints: {
        'POST /api/recommendations': 'Get AI recommendations (cached)',
        'DELETE /api/recommendations?key=all': 'Purge cache (admin)',
        'GET /api/recommendations/cache-stats': 'View cache configuration'
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache stats for 5 minutes
      }
    });
  }

  return new Response(JSON.stringify({
    service: 'AI Tool Recommendation API',
    version: '2.0.0',
    caching: 'enabled',
    endpoints: ['POST', 'OPTIONS', 'DELETE', 'GET /cache-stats']
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
