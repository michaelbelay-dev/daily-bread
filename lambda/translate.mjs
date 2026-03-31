export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body =
      typeof event.body === 'string'
        ? JSON.parse(event.body)
        : event.body;

    const { verseText, language } = body || {};

    if (!verseText || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing verseText or language'
        })
      };
    }

    console.log('Translating to:', language);
    console.log('Verse:', verseText);
    console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // safer valid model
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `Translate this Bible verse into ${language}. Return ONLY the translated text, nothing else:\n\n${verseText}`
          }
        ]
      })
    });

    const data = await response.json();

    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response:', JSON.stringify(data));

    if (!response.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: data?.error?.message || 'API error',
          detail: data
        })
      };
    }

    const translated =
      data?.content?.[0]?.text?.trim() ||
      'Translation unavailable.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ translated })
    };

  } catch (err) {
    console.log('CAUGHT ERROR:', err);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: err.message || 'Unknown error'
      })
    };
  }
};
