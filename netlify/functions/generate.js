// Netlify Function: AI Content Generation API
// Environment variable required: OPENAI_API_KEY

exports.handler = async function (event, context) {
  // Handle CORS preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { ...headers, 'Allow': 'POST' },
        body: JSON.stringify({ 
          error: 'Method not allowed. Use POST.',
          method: event.httpMethod 
        })
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = event.body ? JSON.parse(event.body) : {};
    } catch (err) {
      console.error('JSON parse error:', err);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: err.message 
        })
      };
    }

    // Validate required fields
    if (!requestBody.messages && !requestBody.prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing prompt or messages in request body',
          received: Object.keys(requestBody)
        })
      };
    }

    // Check for OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error: OpenAI API key not configured. Please contact support.',
          timestamp: new Date().toISOString()
        })
      };
    }

    console.log('Processing request for content generation...');
    console.log('Request model:', requestBody.model);
    console.log('Messages count:', requestBody.messages?.length || 0);

    // Prepare OpenAI API payload
    const openaiPayload = {
      model: requestBody.model || 'gpt-4o-mini',
      messages: requestBody.messages || [
        { role: 'user', content: requestBody.prompt }
      ],
      temperature: typeof requestBody.temperature === 'number' ? requestBody.temperature : 0.7,
      max_tokens: requestBody.max_tokens || 2000,
      top_p: requestBody.top_p || 1,
      frequency_penalty: requestBody.frequency_penalty || 0,
      presence_penalty: requestBody.presence_penalty || 0
    };

    // Make request to OpenAI with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let openaiResponse;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Functions/1.0'
        },
        body: JSON.stringify(openaiPayload),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return {
          statusCode: 408,
          headers,
          body: JSON.stringify({ 
            error: 'Request timeout: OpenAI API took too long to respond' 
          })
        };
      }
      
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: 'Network error: Unable to reach OpenAI API',
          details: fetchError.message
        })
      };
    }

    clearTimeout(timeoutId);

    // Get response text
    const responseText = await openaiResponse.text();
    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response length:', responseText.length);
    
    // Try to parse as JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response format from OpenAI API',
          details: 'Response was not valid JSON',
          preview: responseText.substring(0, 200)
        })
      };
    }

    // Handle OpenAI API errors
    if (!openaiResponse.ok) {
      console.error('OpenAI API error:', responseData);
      return {
        statusCode: openaiResponse.status,
        headers,
        body: JSON.stringify({
          error: responseData.error?.message || 'OpenAI API request failed',
          type: responseData.error?.type || 'api_error',
          code: responseData.error?.code || 'unknown',
          details: responseData
        })
      };
    }

    // Validate response structure
    if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
      console.error('Invalid OpenAI response structure:', responseData);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response structure from OpenAI API',
          structure: Object.keys(responseData)
        })
      };
    }

    console.log('OpenAI request successful, returning content');

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...responseData,
        meta: {
          timestamp: new Date().toISOString(),
          model: requestBody.model || 'gpt-4o-mini',
          function_version: '1.0'
        }
      })
    };

  } catch (error) {
    console.error('Function execution error:', error);
    
    // Handle different types of errors
    let errorMessage = 'Unknown server error';
    let statusCode = 500;

    if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS error: Unable to resolve OpenAI API hostname';
      statusCode = 502;
    } else if (error.code === 'ECONNRESET') {
      errorMessage = 'Connection reset: Request to OpenAI API was interrupted';
      statusCode = 502;
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout: OpenAI API took too long to respond';
      statusCode = 408;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Network error: Failed to connect to OpenAI API';
      statusCode = 502;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      statusCode: statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
