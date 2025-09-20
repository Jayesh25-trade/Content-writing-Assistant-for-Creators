// netlify/functions/generate.js
// Netlify Function: forwards request to OpenAI Chat Completions
// Requires: environment variable OPENAI_API_KEY
// Handles: CORS preflight and proper JSON responses

exports.handler = async function (event, context) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: ""
    };
  }

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Allow": "POST",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "Method not allowed. Use POST." })
      };
    }

    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Invalid JSON body" })
      };
    }

    if (!body.messages && !body.prompt) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Missing prompt or messages in request body" })
      };
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      console.error("OPENAI_API_KEY not set in environment");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Server configuration error: OPENAI_API_KEY not set" })
      };
    }

    // Build OpenAI payload
    const payload = {
      model: body.model || "gpt-4o-mini",
      messages: body.messages || [{ role: "user", content: body.prompt }],
      temperature: typeof body.temperature === "number" ? body.temperature : 0.6,
      max_tokens: body.max_tokens || 2000,
      top_p: body.top_p || 1,
      presence_penalty: body.presence_penalty || 0
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    let responseBody;

    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text };
    }

    return {
      statusCode: resp.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(responseBody)
    };
  } catch (err) {
    console.error("Function error", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message || "Unknown server error" })
    };
  }
};
