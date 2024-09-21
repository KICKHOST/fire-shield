function callOpenAI(prompt) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "callOpenAI", prompt: prompt }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
    });
  });
}

async function judge(content) {
  try {
    const prompt = "以下のテキストに、電話番号やメールアドレス、地名など個人や場所を特定できるような情報、または他の人を傷つけたり炎上しそうな内容があればtrueとだけ言ってください。\nテキスト:\n";
    const result = await callOpenAI(prompt + content);
    return result;
  } catch (error) {
    return content;
  }
}

async function generateWarningMessage(content) {
  try {
    const prompt = "以下のテキストには、電話番号やメールアドレス、地名など個人や場所を特定できるような情報、または他の人を傷つけたり炎上しそうな内容が含まれています。この内容をインターネット上に公開した場合、内容を踏まえた上で想定される最悪のケースを１０才児にもわかるように１００文字程度で説明してください。\nテキスト:\n";
    const result = await callOpenAI(prompt + content);
    return result;
  } catch (error) {
    return content;
  }
}

function createModal(message) {
  const modal = document.createElement('div');
  modal.id = 'myExtensionModal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>警告</h2>
      <p>このツイートには個人情報や不適切な内容が含まれている可能性があります。</p>
      <p>${message}</p>
      <div class="modal-content__buttons">
        <button id="confirmTweet">それでもポストする</button>
        <button id="cancelTweet">ポストする内容を考え直す</button>
      </div>
    </div>
  `;
  return modal;
}

function addModalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #myExtensionModal {
      display: none;
      position: fixed;
      z-index: 9999;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
    }
    #myExtensionModal h2, #myExtensionModal p {
      margin: 0;
      font-weight: bold;
    }
    #myExtensionModal .modal-content {
      background-color: #fefefe;
      margin: 15% auto;
      padding: 20px;
      border: 1px solid #888;
      width: 80%;
      max-width: 500px;
      color: #ff3434;
      display: flex;
      gap: 20px;
      flex-flow: column;
      border: 10px solid #e09306;
    }
    #myExtensionModal .modal-content .modal-content__buttons {
      display: flex;
      gap: 10px;
      justify-content: space-between;
    }
    #myExtensionModal button {
      margin: 0;
      padding: 5px 20px;
      color: #fff;
      background: #36be36;
      border: none;
      border-radius: 50px;
    }
    #myExtensionModal #confirmTweet {
      background: #ff3434;
    }
    #myExtensionModal #cancelTweet {
      background: #36be36;
    }
  `;
  document.head.appendChild(style);
}

function showModal(message) {
  const modal = document.getElementById('myExtensionModal');
  if (modal) {
    modal.remove();
  }
  document.body.appendChild(createModal(message));
  addModalStyles();
  document.getElementById('myExtensionModal').style.display = 'block';
}

function hideModal() {
  document.getElementById('myExtensionModal').style.display = 'none';
}

function setupModalListeners(submitButton) {
  document.getElementById('confirmTweet').addEventListener('click', () => {
    hideModal();
    skipJudge = true;
    submitButton.click();
  });

  document.getElementById('cancelTweet').addEventListener('click', () => {
    hideModal();
  });
}

let isProcessing = false;
let skipJudge = false;

function handleTweetSubmit(event) {
  const submitButton = event.target.closest('[data-testid="tweetButtonInline"]');
  if (!submitButton || isProcessing) return;
  if (skipJudge) {
    skipJudge = false;
    return;
  }

  const tweetBox = document.querySelector('[data-testid="tweetTextarea_0"]');
  if (!tweetBox) return;

  event.preventDefault();
  event.stopPropagation();
  isProcessing = true;

  const text = tweetBox.textContent;
  judge(text).then((result) => {
    console.log(result)
    isProcessing = false;
    if (result === "true") {
      generateWarningMessage(text).then((message) => {
        showModal(message);
        setupModalListeners(submitButton);
      });
    } else {
      setTimeout(() => {
        skipJudge = true;
        submitButton.click();
      }, 100);
    }
  }).catch((error) => {
    console.error("Error processing tweet:", error);
    isProcessing = false;
  });
}

document.body.addEventListener('click', function(event) {
  if (event.target.closest('[data-testid="tweetButtonInline"]')) {
    handleTweetSubmit(event);
  }
}, true);
