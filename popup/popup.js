document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  const link = document.getElementById('link')

  try {
    const { openaiApiKey } = await chrome.storage.local.get('openaiApiKey');
    if (openaiApiKey) {
      apiKeyInput.value = openaiApiKey;
      statusElement.textContent = 'APIキーは保存されています';
    }
  } catch (error) {
    console.error('APIキーの取得に失敗しました:', error);
  }

  saveButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      statusElement.textContent = 'APIキーを入力してください。';
      return;
    }

    try {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
      statusElement.textContent = 'APIキーを保存しました！';
      setTimeout(() => window.close(), 1500);
    } catch (error) {
      console.error('APIキーの保存に失敗しました:', error);
      statusElement.textContent = 'APIキーの保存に失敗しました。';
    }
  });

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const url = event.target.getAttribute('href');
    chrome.tabs.create({ url });
  });
});
