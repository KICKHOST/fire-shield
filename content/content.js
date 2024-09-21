const callOpenAI = async (prompt) => {
  try {
    const response = await chrome.runtime.sendMessage({ action: "callOpenAI", prompt });
    if (!response.success) throw new Error(response.error);
    return response.data;
  } catch (error) {
    console.error("OpenAI API call failed:", error);
    throw error;
  }
};

const judge = async (content) => {
  const prompt = `以下のテキストに、電話番号やメールアドレス、地名など個人や場所を特定できるような情報、または他の人を傷つけたり炎上しそうな内容があればtrueとだけ言ってください。\nテキスト:\n${content}`;
  return await callOpenAI(prompt);
};

const generateWarningMessage = async (content) => {
  const prompt = `以下のテキストには、電話番号やメールアドレス、地名など個人や場所を特定できるような情報、または他の人を傷つけたり炎上しそうな内容が含まれています。この内容をインターネット上に公開した場合、内容を踏まえた上で想定される最悪のケースを１０才児にもわかるように１００文字程度で説明してください。\nテキスト:\n${content}`;
  return await callOpenAI(prompt);
};

const createModal = (message) => {
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
};

const addModalStyles = () => {
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
    #myExtensionModal h2, #myExtensionModal p {
      margin: 0;
      font-weight: bold;
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
      font-size: 10px;
    }
    #myExtensionModal #cancelTweet {
      background: #36be36;
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
};

const showModal = (message) => {
  const existingModal = document.getElementById('myExtensionModal');
  if (existingModal) existingModal.remove();
  
  document.body.appendChild(createModal(message));
  addModalStyles();
  document.getElementById('myExtensionModal').style.display = 'block';
};

const hideModal = () => {
  document.getElementById('myExtensionModal').style.display = 'none';
};

const setupModalListeners = (submitButton) => {
  document.getElementById('confirmTweet').addEventListener('click', () => {
    hideModal();
    skipJudge = true;
    submitButton.click();
  });

  document.getElementById('cancelTweet').addEventListener('click', hideModal);
};


const TWEET_BUTTON_SELECTOR = '[data-testid="tweetButtonInline"]';
const TWEET_TEXTAREA_SELECTOR = '[data-testid="tweetTextarea_0"]';

let isProcessing = false;
let skipJudge = false;

const handleTweetSubmit = async (event) => {
  const submitButton = event.target.closest(TWEET_BUTTON_SELECTOR);
  if (!submitButton || isProcessing) return;
  if (skipJudge) {
    skipJudge = false;
    return;
  }

  const tweetBox = document.querySelector(TWEET_TEXTAREA_SELECTOR);
  if (!tweetBox) return;

  event.preventDefault();
  event.stopPropagation();
  isProcessing = true;

  try {
    const text = tweetBox.textContent;
    const result = await judge(text);
    
    if (result === "true") {
      const message = await generateWarningMessage(text);
      showModal(message);
      setupModalListeners(submitButton);
    } else {
      setTimeout(() => {
        skipJudge = true;
        submitButton.click();
      }, 100);
    }
  } catch (error) {
    console.error("Error processing tweet:", error);
  } finally {
    isProcessing = false;
  }
};

document.body.addEventListener('click', (event) => {
  if (event.target.closest(TWEET_BUTTON_SELECTOR)) {
    handleTweetSubmit(event);
  }
}, true);
