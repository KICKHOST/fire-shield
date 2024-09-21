chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getApiKey") {
    chrome.storage.local.get(['openaiApiKey'], function (result) {
      sendResponse({ apiKey: result.openaiApiKey });
    });
    return true;
  }
});

async function useApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['openaiApiKey'], function (result) {
      if (result.openaiApiKey) {
        resolve(result.openaiApiKey);
      } else {
        resolve(null);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "callOpenAI") {
    callOpenAIAPI(request.prompt)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function callOpenAIAPI(prompt) {
  const apiKey = await useApiKey()
  if (apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } else {
    console.log('Please set your API Key in the extension popup');
  }
}
