// netlify/functions/generate.js
// Netlify Function: forward request to OpenAI Chat Completions
// Expects: POST with JSON body { prompt, messages, model, temperature, max_tokens, ... }
// Environment variable: OPENAI_API_KEY

exports.handler = async function (event, context) {
  // Basic CORS preflight handling
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: { 'Allow': 'POST' },
        body: JSON.stringify({ error: 'Method not allowed. Use POST.' })
      };
    }

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (err) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    if (!body.messages && !body.prompt) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing prompt or messages in request body' })
      };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      console.warn('OPENAI_API_KEY not set in environment');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Server configuration error: OPENAI_API_KEY not set' })
      };
    }

    // Build OpenAI payload
    const payload = {
      model: body.model || 'gpt-4o-mini',
      messages: body.messages || [{ role: 'user', content: body.prompt }],
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
      max_tokens: body.max_tokens || 1200
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    const contentType = resp.headers.get('content-type') || 'text/plain';

    // If OpenAI returned non-JSON (error page) just forward text
    let responseBody;
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text };
    }

    return {
      statusCode: resp.ok ? 200 : resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    console.error('Function error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Unknown server error' })
    };
  }
};
