document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');

  chrome.storage.local.get(['openaiApiKey'], function(result) {
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
      statusElement.textContent = 'APIキーは保存されています';
    }
  });

  saveButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({openaiApiKey: apiKey}, function() {
        statusElement.textContent = 'APIキーを保存しました！';
        setTimeout(() => {
          window.close();
        }, 1500);
      });
    } else {
      statusElement.textContent = 'APIキーを入力してください。';
    }
  });
});
