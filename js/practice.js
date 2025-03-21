/**
 * 單字記憶大師 - 練習測驗模組
 * 負責拼寫練習、選擇題測驗、配對遊戲和填空練習等功能
 */

let practiceWords = [];
let currentPracticeIndex = 0;
let currentPracticeType = 'spelling';
let currentScore = 0;
let matchedPairs = 0;
let matchingTimer = null;
let matchingTimeLeft = 60;
let firstSelected = null;

// 在文檔加載完成後初始化練習模組
document.addEventListener('DOMContentLoaded', function() {
    console.log('練習測驗頁面初始化中...');
    initPractice().catch(error => {
        console.error('初始化練習頁面失敗：', error);
    });
    
    // 監聽頁面切換事件，當切換到練習測驗頁面時更新詞彙表
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('data-page') === 'practice') {
                console.log('切換到練習測驗頁面，更新詞彙表選項');
                // 延遲一點初始化，確保頁面已經切換
                setTimeout(() => {
                    updatePracticeListOptions().catch(error => {
                        console.error('更新詞彙表選項失敗：', error);
                    });
                }, 100);
            }
        });
    });
    
    // 也發送一個自定義事件，以便其他模組可以通知我們更新詞彙表
    document.addEventListener('vocabListsUpdated', function() {
        console.log('接收到詞彙列表更新通知，更新練習詞彙表選項');
        if (document.getElementById('practice').classList.contains('active')) {
            updatePracticeListOptions().catch(error => {
                console.error('更新詞彙表選項失敗：', error);
            });
        }
    });
});

/**
 * 初始化練習頁面
 */
async function initPractice() {
    console.log('初始化練習頁面');
    
    // 添加樣式
    addPracticeStyles();
    
    // 確保獲取到詞彙數據
    if (!window.appData.vocabulary || window.appData.vocabulary.length === 0) {
        await loadVocabularyData();
    }
    
    // 初始化類型選擇器
    initPracticeTypeSelector();
    
    // 初始化列表選擇器
    initPracticeListSelector();
    
    // 初始化開始練習按鈕
    initStartPracticeButton();
    
    // 初始化各種練習模式
    initSpellingPractice();
    initMultipleChoicePractice();
    initMatchingGame();
    initFillInBlankPractice();
    
    // 確保一開始所有練習模式都隱藏
    hideAllPracticeModes();
    
    // 檢查 API KEY 是否存在，如果不存在則禁用填空測驗選項
    checkAndDisableFillOption();
    
    // 監聽頁面變化，當切換到練習頁面時更新詞彙表
    document.addEventListener('pageChanged', (event) => {
        if (event.detail.page === 'practice') {
            console.log('進入練習頁面，更新詞彙表選項');
            updatePracticeListOptions().catch(error => {
                console.error('更新詞彙表選項出錯：', error);
            });
            
            // 每次進入頁面時檢查 API KEY
            checkAndDisableFillOption();
        }
    });
}

/**
 * 檢查 API KEY 並禁用填空測驗選項
 */
function checkAndDisableFillOption() {
    const API_KEY = localStorage.getItem('geminiApiKey');
    const practiceTypeSelect = document.getElementById('practiceTypeSelect');
    
    if (practiceTypeSelect) {
        const fillOption = Array.from(practiceTypeSelect.options).find(option => option.value === 'fill');
        
        if (fillOption) {
            if (!API_KEY) {
                // 如果沒有 API KEY，禁用填空測驗選項
                fillOption.disabled = true;
                fillOption.textContent = "填空練習 (需要 Gemini API Key)";
                
                // 如果當前選中的是填空測驗，切換到拼寫練習
                if (practiceTypeSelect.value === 'fill') {
                    practiceTypeSelect.value = 'spelling';
                }
            } else {
                // 如果有 API KEY，啟用填空測驗選項
                fillOption.disabled = false;
                fillOption.textContent = "填空練習";
            }
        }
    }
}

/**
 * 初始化練習類型選擇器
 */
function initPracticeTypeSelector() {
    console.log('初始化練習類型選擇器');
    const practiceTypeSelect = document.getElementById('practiceTypeSelect');
    
    if (!practiceTypeSelect) {
        console.error('找不到練習類型選擇器元素');
        return;
    }
    
    practiceTypeSelect.addEventListener('change', function() {
        hideAllPracticeModes();
    });
}

/**
 * 初始化詞彙表選擇器
 */
function initPracticeListSelector() {
    const practiceListSelect = document.getElementById('practiceListSelect');
    if (!practiceListSelect) {
        console.error('找不到練習詞彙表選擇器元素');
        return;
    }
    
    // 從詞彙管理中獲取詞彙表
    updatePracticeListOptions().catch(error => {
        console.error('初始化詞彙表選擇器出錯：', error);
        showNotification('無法加載詞彙表數據', 'error');
    });
}

/**
 * 更新詞彙表選項
 */
async function updatePracticeListOptions() {
    try {
        const practiceListSelect = document.getElementById('practiceListSelect');
        if (!practiceListSelect) {
            console.error('找不到詞彙表選擇器元素');
            return false;
        }
        
        // 保存當前選中的值
        const currentSelectedValue = practiceListSelect.value;
        
        // 清空現有選項
        practiceListSelect.innerHTML = '';
        
        // 添加預設選項（與詞彙管理頁面相同的預設組）
        const defaultOptions = [
            { value: 'all', text: '所有單字' },
            { value: 'notLearned', text: '未學習' },
            { value: 'learning', text: '學習中' },
            { value: 'mastered', text: '已掌握' }
        ];
        
        defaultOptions.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.text;
            practiceListSelect.appendChild(optElement);
        });
        
        // 從資料庫獲取自定義詞彙表
        if (window.db && typeof window.db.getAllWordLists === 'function') {
            console.log('從資料庫獲取自定義詞彙表...');
            const lists = await window.db.getAllWordLists();
            console.log('取得自定義詞彙表：', lists);
            
            if (lists && lists.length > 0) {
                // 添加分隔線
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '──────────';
                practiceListSelect.appendChild(separator);
                
                // 添加自定義詞彙表
                lists.forEach(list => {
                    const optElement = document.createElement('option');
                    optElement.value = list.id;
                    optElement.textContent = list.name;
                    practiceListSelect.appendChild(optElement);
                });
            }
            
            // 嘗試恢復先前選中的值
            if (currentSelectedValue && Array.from(practiceListSelect.options).some(opt => opt.value === currentSelectedValue)) {
                practiceListSelect.value = currentSelectedValue;
            }
            
            return true;
        } else {
            console.warn('無法訪問資料庫或獲取詞彙表函數');
            return false;
        }
    } catch (error) {
        console.error('更新詞彙表選項失敗：', error);
        return false;
    }
}

/**
 * 初始化開始練習按鈕
 */
function initStartPracticeButton() {
    console.log('初始化開始練習按鈕');
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    
    if (!startPracticeBtn) {
        console.error('找不到開始練習按鈕元素');
        return;
    }
    
    startPracticeBtn.addEventListener('click', async function() {
        console.log('點擊開始練習按鈕');
        
        const practiceTypeSelect = document.getElementById('practiceTypeSelect');
        const practiceListSelect = document.getElementById('practiceListSelect');
        
        if (!practiceTypeSelect || !practiceListSelect) {
            console.error('找不到練習類型或詞彙表選擇器');
            showNotification('無法初始化練習設置', 'error');
            return;
        }
        
        currentPracticeType = practiceTypeSelect.value;
        const selectedList = practiceListSelect.value;
        
        console.log(`選擇的練習類型: ${currentPracticeType}, 選擇的詞彙表: ${selectedList}`);
        
        // 顯示載入中狀態
        startPracticeBtn.disabled = true;
        startPracticeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 載入中...';
        
        try {
            // 載入練習詞彙
            console.log('開始載入練習詞彙...');
            const success = await loadPracticeWords(selectedList);
            
            if (success) {
                console.log('詞彙載入成功，準備開始練習');
                // 根據練習類型開始相應的練習
                switch (currentPracticeType) {
                    case 'spelling':
                        console.log('啟動拼寫練習');
                        startSpellingPractice();
                        break;
                    case 'multiple':
                        console.log('啟動選擇題測驗');
                        startMultipleChoicePractice();
                        break;
                    case 'matching':
                        console.log('啟動配對遊戲');
                        startMatchingGame();
                        break;
                    case 'fill':
                        console.log('啟動填空練習');
                        startFillInBlankPractice();
                        break;
                    default:
                        console.error(`未知的練習類型: ${currentPracticeType}`);
                        showNotification('不支持的練習類型', 'error');
                }
            } else {
                console.error('詞彙載入失敗或沒有詞彙可用');
                // 注意：這裡不再顯示重複的通知，因為loadPracticeWords中已經顯示了更詳細的錯誤訊息
            }
        } catch (error) {
            console.error('開始練習失敗：', error);
            showNotification('開始練習失敗', 'error');
        } finally {
            // 恢復按鈕狀態
            startPracticeBtn.disabled = false;
            startPracticeBtn.innerHTML = '開始練習';
        }
    });
}

/**
 * 載入練習用的詞彙
 * @param {string} listName - 詞彙表名稱或ID
 */
async function loadPracticeWords(listName = 'all') {
    console.log(`正在載入練習詞彙，選定的詞彙表: ${listName}`);
    
    // 重置練習狀態
    currentPracticeIndex = 0;
    currentScore = 0;
    
    // 清除先前的錯誤訊息
    const practiceContainer = document.querySelector('.practice-container');
    const existingErrorMsg = document.getElementById('practice-error-message');
    if (existingErrorMsg) {
        existingErrorMsg.remove();
    }
    
    try {
        let words = [];
        
        // 根據選擇的詞彙表載入單字
        if (listName === 'all') {
            // 所有單字
            console.log('載入所有單字');
            words = await window.db.getAllWords();
        } else if (listName === 'notLearned') {
            // 未學習單字
            console.log('載入未學習單字');
            words = await window.db.getWordsByStatus('notLearned');
        } else if (listName === 'learning') {
            // 學習中單字
            console.log('載入學習中單字');
            words = await window.db.getWordsByStatus('learning');
        } else if (listName === 'mastered') {
            // 已掌握單字
            console.log('載入已掌握單字');
            words = await window.db.getWordsByStatus('mastered');
        } else {
            // 自定義詞彙表
            console.log(`載入自定義詞彙表 (ID: ${listName}) 的單字`);
            words = await window.db.getWordsInList(listName);
        }
        
        console.log(`載入了 ${words.length} 個單字`);
        
        // 檢查是否有可用單字
        if (words.length === 0) {
            console.log('所選詞彙表中沒有單字');
            
            // 創建持久性錯誤訊息
            const errorMessage = document.createElement('div');
            errorMessage.id = 'practice-error-message';
            errorMessage.className = 'practice-error-message';
            errorMessage.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>所選詞彙表「${listName === 'all' ? '所有單字' : 
                   listName === 'notLearned' ? '未學習' : 
                   listName === 'learning' ? '學習中' : 
                   listName === 'mastered' ? '已掌握' : listName}」中沒有可用的單字</p>
                <p>請選擇其他詞彙表或添加單字後再試</p>
                <button id="dismiss-error-btn" class="btn">知道了</button>
            `;
            
            // 添加到練習容器的頂部
            if (practiceContainer) {
                practiceContainer.insertBefore(errorMessage, practiceContainer.firstChild);
                
                // 添加關閉按鈕事件
                const dismissBtn = document.getElementById('dismiss-error-btn');
                if (dismissBtn) {
                    dismissBtn.addEventListener('click', () => {
                        errorMessage.remove();
                    });
                }
            }
            
            // 仍然顯示通知以確保用戶注意到
            showNotification('所選詞彙表中沒有可用的單字', 'error');
            return false;
        }
        
        // 隨機排序詞彙
        const shuffledWords = shuffleArray([...words]);
        
        // 取前10個單字，如果不足10個則使用全部
        const maxPracticeWords = 10;
        practiceWords = shuffledWords.length > maxPracticeWords 
            ? shuffledWords.slice(0, maxPracticeWords) 
            : shuffledWords;
            
        console.log(`練習詞彙已準備好，單字數量: ${practiceWords.length}/${words.length}`);
        
        // 顯示通知
        if (words.length <= maxPracticeWords) {
            showNotification(`已載入所有 ${words.length} 個單字進行練習`, 'info');
        } else {
            showNotification(`已從 ${words.length} 個單字中隨機選取 ${maxPracticeWords} 個進行練習`, 'info');
        }
        
        return true;
    } catch (error) {
        console.error('載入練習詞彙失敗:', error);
        showNotification('載入練習詞彙失敗', 'error');
        return false;
    }
}

/**
 * 隱藏所有練習模式
 */
function hideAllPracticeModes() {
    console.log('隱藏所有練習模式');
    const practiceModes = document.querySelectorAll('.practice-mode');
    practiceModes.forEach(mode => {
        mode.classList.remove('active');
    });
}

/**
 * 初始化拼寫練習
 */
function initSpellingPractice() {
    // 提示按鈕
    const phoneticHintBtn = document.getElementById('phoneticHintBtn');
    const firstLetterHintBtn = document.getElementById('firstLetterHintBtn');
    
    if (phoneticHintBtn) {
        phoneticHintBtn.addEventListener('click', () => {
            const phoneticHint = document.querySelector('.phonetic-hint');
            if (phoneticHint) {
                phoneticHint.classList.toggle('hidden');
            }
        });
    }
    
    if (firstLetterHintBtn) {
        firstLetterHintBtn.addEventListener('click', () => {
            const firstLetterHint = document.querySelector('.first-letter-hint');
            if (firstLetterHint) {
                firstLetterHint.classList.toggle('hidden');
            }
        });
    }
    
    // 檢查按鈕
    const checkSpellingBtn = document.getElementById('checkSpellingBtn');
    if (checkSpellingBtn) {
        checkSpellingBtn.addEventListener('click', checkSpellingAnswer);
    }
    
    // 輸入框鍵盤事件
    const spellingInput = document.getElementById('spellingInput');
    if (spellingInput) {
        spellingInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkSpellingAnswer();
            }
        });
    }
    
    // 導航按鈕
    const prevSpellingBtn = document.getElementById('prevSpellingBtn');
    const nextSpellingBtn = document.getElementById('nextSpellingBtn');
    
    if (prevSpellingBtn) {
        prevSpellingBtn.addEventListener('click', () => {
            if (currentPracticeIndex > 0) {
                currentPracticeIndex--;
                showSpellingQuestion(currentPracticeIndex);
            }
        });
    }
    
    if (nextSpellingBtn) {
        nextSpellingBtn.addEventListener('click', () => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showSpellingQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        });
    }
    
    // 發音按鈕
    const pronunciationBtn = document.querySelector('#spellingPractice .pronunciation-btn');
    if (pronunciationBtn) {
        pronunciationBtn.addEventListener('click', () => {
            if (practiceWords.length > 0 && currentPracticeIndex < practiceWords.length) {
                pronounceWord(practiceWords[currentPracticeIndex].word);
            }
        });
    }
}

/**
 * 開始拼寫練習
 */
function startSpellingPractice() {
    console.log('開始拼寫練習');
    
    // 隱藏所有練習模式
    hideAllPracticeModes();
    
    // 顯示拼寫練習
    const spellingPractice = document.getElementById('spellingPractice');
    if (spellingPractice) {
        spellingPractice.classList.add('active');
    } else {
        console.error('找不到拼寫練習元素');
        return;
    }
    
    // 顯示第一個問題
    showSpellingQuestion(0);
}

/**
 * 顯示拼寫問題
 * @param {number} index - 問題索引
 */
function showSpellingQuestion(index) {
    if (practiceWords.length === 0 || index < 0 || index >= practiceWords.length) {
        return;
    }
    
    const word = practiceWords[index];
    console.log('顯示單字：', word);
    
    // 更新問題
    const meaningElem = document.querySelector('#spellingPractice .meaning');
    if (meaningElem) {
        meaningElem.textContent = word.meaning;
    }
    
    // 更新詞性
    const partOfSpeechElem = document.querySelector('#spellingPractice .part-of-speech');
    if (partOfSpeechElem) {
        partOfSpeechElem.textContent = translatePartOfSpeech(word.partOfSpeech);
    }
    
    // 更新音標提示
    const phoneticHint = document.querySelector('.phonetic-hint');
    if (phoneticHint) {
        phoneticHint.textContent = word.phonetic || '';
        phoneticHint.classList.add('hidden');
    }
    
    // 更新首字母提示
    const firstLetterHint = document.querySelector('.first-letter-hint');
    if (firstLetterHint) {
        const hint = generateFirstLetterHint(word.word);
        firstLetterHint.textContent = hint;
        firstLetterHint.classList.add('hidden');
    }
    
    // 清空輸入框和反饋
    const spellingInput = document.getElementById('spellingInput');
    const feedback = document.querySelector('#spellingPractice .feedback');
    
    if (spellingInput) {
        spellingInput.value = '';
        spellingInput.disabled = false;
        spellingInput.focus();
    }
    
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
    
    // 更新進度指示器
    const progressIndicator = document.querySelector('#spellingPractice .progress-indicator');
    if (progressIndicator) {
        progressIndicator.textContent = `${index + 1} / ${practiceWords.length}`;
    }
}

/**
 * 生成首字母提示
 * @param {string} word - 單字
 * @returns {string} - 首字母提示
 */
function generateFirstLetterHint(word) {
    if (!word) return '';
    return word.charAt(0) + '_'.repeat(word.length - 1);
}

/**
 * 檢查拼寫答案
 */
function checkSpellingAnswer() {
    if (practiceWords.length === 0 || currentPracticeIndex < 0 || currentPracticeIndex >= practiceWords.length) {
        return;
    }
    
    const spellingInput = document.getElementById('spellingInput');
    const feedback = document.querySelector('#spellingPractice .feedback');
    
    if (!spellingInput || !feedback) return;
    
    const userAnswer = spellingInput.value.trim().toLowerCase();
    const correctAnswer = practiceWords[currentPracticeIndex].word.toLowerCase();
    
    if (userAnswer === correctAnswer) {
        // 答案正確
        feedback.textContent = `正確！"${correctAnswer}" 拼寫正確。`;
        feedback.className = 'feedback success';
        
        // 增加分數
        currentScore++;
        
        // 禁用輸入框
        spellingInput.disabled = true;
        
        // 2秒後自動跳到下一題
        setTimeout(() => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showSpellingQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        }, 2000);
    } else {
        // 答案錯誤
        feedback.textContent = `錯誤！正確拼寫是: "${correctAnswer}"`;
        feedback.className = 'feedback error';
    }
}

/**
 * 初始化選擇題測驗
 */
function initMultipleChoicePractice() {
    // 提交按鈕
    const submitMultipleBtn = document.getElementById('submitMultipleBtn');
    if (submitMultipleBtn) {
        submitMultipleBtn.addEventListener('click', checkMultipleChoiceAnswer);
    }
    
    // 導航按鈕
    const prevMultipleBtn = document.getElementById('prevMultipleBtn');
    const nextMultipleBtn = document.getElementById('nextMultipleBtn');
    
    if (prevMultipleBtn) {
        prevMultipleBtn.addEventListener('click', () => {
            if (currentPracticeIndex > 0) {
                currentPracticeIndex--;
                showMultipleChoiceQuestion(currentPracticeIndex);
            }
        });
    }
    
    if (nextMultipleBtn) {
        nextMultipleBtn.addEventListener('click', () => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showMultipleChoiceQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        });
    }
    
    // 發音按鈕
    const pronunciationBtn = document.querySelector('#multiplePractice .pronunciation-btn');
    if (pronunciationBtn) {
        pronunciationBtn.addEventListener('click', () => {
            if (practiceWords.length > 0 && currentPracticeIndex < practiceWords.length) {
                pronounceWord(practiceWords[currentPracticeIndex].word);
            }
        });
    }
}

/**
 * 開始選擇題測驗
 */
function startMultipleChoicePractice() {
    // 顯示選擇題模式
    hideAllPracticeModes();
    const multipleMode = document.getElementById('multiplePractice');
    if (multipleMode) {
        multipleMode.classList.add('active');
    }
    
    // 顯示第一個問題
    showMultipleChoiceQuestion(0);
}

/**
 * 顯示選擇題問題
 * @param {number} index - 問題索引
 */
function showMultipleChoiceQuestion(index) {
    if (practiceWords.length === 0 || index < 0 || index >= practiceWords.length) {
        return;
    }
    
    const word = practiceWords[index];
    
    // 更新問題
    const questionElem = document.querySelector('#multiplePractice .practice-question h3');
    if (questionElem) {
        questionElem.textContent = `"${word.word}" 的中文意思是什麼？`;
    }
    
    // 生成選項
    const options = generateMultipleChoiceOptions(word);
    
    // 更新選項
    const optionsContainer = document.querySelector('#multiplePractice .practice-options');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        
        options.forEach((option, i) => {
            const optionElem = document.createElement('div');
            optionElem.className = 'option';
            optionElem.innerHTML = `
                <input type="radio" id="option${i + 1}" name="answer" value="${option}">
                <label for="option${i + 1}">${option}</label>
            `;
            optionsContainer.appendChild(optionElem);
            
            // 添加點擊事件
            optionElem.addEventListener('click', () => {
                const radio = optionElem.querySelector('input[type="radio"]');
                if (radio) {
                    radio.checked = true;
                }
            });
        });
    }
    
    // 清空反饋
    const feedback = document.querySelector('#multiplePractice .feedback');
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
    
    // 更新進度指示器
    const progressIndicator = document.querySelector('#multiplePractice .progress-indicator');
    if (progressIndicator) {
        progressIndicator.textContent = `${index + 1} / ${practiceWords.length}`;
    }
}

/**
 * 生成選擇題選項
 * @param {Object} word - 當前單字
 * @returns {Array} - 選項數組
 */
function generateMultipleChoiceOptions(word) {
    // 取得正確答案
    const correctAnswer = word.meaning;
    
    // 從其他單字中隨機選擇三個不同的錯誤選項
    const wrongOptions = [];
    const allMeanings = window.appData.vocabulary.map(w => w.meaning);
    
    // 打亂所有意思
    const shuffledMeanings = shuffleArray(allMeanings);
    
    // 選擇三個不同於正確答案的選項
    for (const meaning of shuffledMeanings) {
        if (meaning !== correctAnswer && !wrongOptions.includes(meaning)) {
            wrongOptions.push(meaning);
            if (wrongOptions.length === 3) break;
        }
    }
    
    // 如果找不到足夠的錯誤選項，使用預設選項
    while (wrongOptions.length < 3) {
        const defaultOption = `選項 ${wrongOptions.length + 1}`;
        wrongOptions.push(defaultOption);
    }
    
    // 將正確答案與錯誤選項合併並打亂
    const allOptions = [correctAnswer, ...wrongOptions];
    return shuffleArray(allOptions);
}

/**
 * 檢查選擇題答案
 */
function checkMultipleChoiceAnswer() {
    if (practiceWords.length === 0 || currentPracticeIndex < 0 || currentPracticeIndex >= practiceWords.length) {
        return;
    }
    
    const checkedOption = document.querySelector('#multiplePractice input[name="answer"]:checked');
    const feedback = document.querySelector('#multiplePractice .feedback');
    
    if (!checkedOption || !feedback) {
        feedback.textContent = '請選擇一個答案';
        feedback.className = 'feedback error';
        return;
    }
    
    const userAnswer = checkedOption.value;
    const correctAnswer = practiceWords[currentPracticeIndex].meaning;
    
    if (userAnswer === correctAnswer) {
        // 答案正確
        feedback.textContent = '正確！';
        feedback.className = 'feedback success';
        
        // 增加分數
        currentScore++;
        
        // 禁用選項
        document.querySelectorAll('#multiplePractice input[name="answer"]').forEach(input => {
            input.disabled = true;
        });
        
        // 2秒後自動跳到下一題
        setTimeout(() => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showMultipleChoiceQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        }, 2000);
    } else {
        // 答案錯誤
        feedback.textContent = `錯誤！正確答案是: "${correctAnswer}"`;
        feedback.className = 'feedback error';
    }
}

/**
 * 初始化填空練習
 */
function initFillInBlankPractice() {
    // 提示按鈕
    const meaningHintBtn = document.getElementById('meaningHintBtn');
    const letterHintBtn = document.getElementById('letterHintBtn');
    
    if (meaningHintBtn) {
        meaningHintBtn.addEventListener('click', () => {
            const meaningHint = document.querySelector('.meaning-hint');
            if (meaningHint) {
                meaningHint.classList.toggle('hidden');
            }
        });
    }
    
    if (letterHintBtn) {
        letterHintBtn.addEventListener('click', () => {
            const letterHint = document.querySelector('.letter-hint');
            if (letterHint) {
                letterHint.classList.toggle('hidden');
            }
        });
    }
    
    // 檢查按鈕
    const checkFillBtn = document.getElementById('checkFillBtn');
    if (checkFillBtn) {
        checkFillBtn.addEventListener('click', checkFillAnswer);
    }
    
    // 導航按鈕
    const prevFillBtn = document.getElementById('prevFillBtn');
    const nextFillBtn = document.getElementById('nextFillBtn');
    
    if (prevFillBtn) {
        prevFillBtn.addEventListener('click', () => {
            if (currentPracticeIndex > 0) {
                currentPracticeIndex--;
                showFillQuestion(currentPracticeIndex);
            }
        });
    }
    
    if (nextFillBtn) {
        nextFillBtn.addEventListener('click', () => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showFillQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        });
    }
}

/**
 * 開始填空練習
 */
function startFillInBlankPractice() {
    // 檢查 API KEY 是否存在
    const API_KEY = localStorage.getItem('geminiApiKey');
    
    if (!API_KEY) {
        showNotification('需要設置 Google Gemini API Key 才能使用填空練習功能', 'error');
        return;
    }
    
    // 顯示填空練習模式
    hideAllPracticeModes();
    const fillMode = document.getElementById('fillPractice');
    if (fillMode) {
        fillMode.classList.add('active');
    }
    
    // 顯示第一個問題
    showFillQuestion(0);
}

/**
 * 顯示填空問題
 * @param {number} index - 問題索引
 */
function showFillQuestion(index) {
    // 檢查 API KEY 是否存在
    const API_KEY = localStorage.getItem('geminiApiKey');
    
    if (!API_KEY) {
        showNotification('需要設置 Google Gemini API Key 才能使用填空練習功能', 'error');
        hideAllPracticeModes();
        return;
    }
    
    if (practiceWords.length === 0 || index < 0 || index >= practiceWords.length) {
        return;
    }
    
    const word = practiceWords[index];
    
    // 清空輸入框和反饋
    const feedback = document.querySelector('#fillPractice .feedback');
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
    
    // 更新進度指示器
    const progressIndicator = document.querySelector('#fillPractice .progress-indicator');
    if (progressIndicator) {
        progressIndicator.textContent = `${index + 1} / ${practiceWords.length}`;
    }
    
    // 更新提示
    const meaningHint = document.querySelector('.meaning-hint');
    if (meaningHint) {
        meaningHint.textContent = word.meaning;
        meaningHint.classList.add('hidden');
    }
    
    const letterHint = document.querySelector('.letter-hint');
    if (letterHint) {
        const hint = word.word.charAt(0).toLowerCase() + ' ' + '_ '.repeat(word.word.length - 1);
        letterHint.textContent = hint;
        letterHint.classList.add('hidden');
    }

    // 生成填空句子
    const fillSentence = document.querySelector('.fill-sentence');
    if (fillSentence) {
        // 顯示載入中
        fillSentence.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> 生成題目中...</div>';
        
        // 使用 Gemini API 生成句子
        generateFillSentenceWithGemini(word)
            .then(sentence => {
                if (sentence) {
                    // 將句子中的單字替換為填空
                    const sentenceHtml = sentence.replace(
                        new RegExp(word.word, 'gi'), 
                        '<input type="text" class="fill-blank" id="fillBlank">'
                    );
                    
                    fillSentence.innerHTML = sentenceHtml;
                    
                    // 聚焦填空輸入框
                    const fillBlank = document.getElementById('fillBlank');
                    if (fillBlank) {
                        fillBlank.value = '';
                        fillBlank.disabled = false;
                        fillBlank.focus();
                    }
                } else {
                    // API 生成失敗，顯示錯誤訊息
                    fillSentence.innerHTML = `
                        <div class="api-error-message">
                            <h4>無法生成填空句子</h4>
                            <p>Gemini API 無法生成適用於單字 "${word.word}" 的句子。</p>
                            <button id="retry-fill-btn" class="generate-btn">
                                <i class="fas fa-redo"></i> 重試
                            </button>
                        </div>
                    `;
                    
                    // 添加重試按鈕事件
                    const retryBtn = document.getElementById('retry-fill-btn');
                    if (retryBtn) {
                        retryBtn.addEventListener('click', () => {
                            showFillQuestion(index);
                        });
                    }
                }
            })
            .catch(error => {
                console.error('生成填空句子時出錯:', error);
                // API 請求失敗，顯示錯誤訊息
                fillSentence.innerHTML = `
                    <div class="api-error-message">
                        <h4>API 請求失敗</h4>
                        <p>無法連接至 Gemini API 或請求過程中發生錯誤。</p>
                        <p>錯誤信息: ${error.message}</p>
                        <button id="retry-fill-btn" class="generate-btn">
                            <i class="fas fa-redo"></i> 重試
                        </button>
                    </div>
                `;
                
                // 添加重試按鈕事件
                const retryBtn = document.getElementById('retry-fill-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        showFillQuestion(index);
                    });
                }
            });
    }
}

/**
 * 使用 Google Gemini API 生成填空句子
 * @param {Object} word - 單字對象
 * @returns {Promise<string|null>} - 生成的句子或 null
 */
async function generateFillSentenceWithGemini(word) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = localStorage.getItem('geminiApiKey');
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 生成填空句子');
        return null;
    }
    
    const wordText = word.word;
    const meaning = word.meaning || '';
    const partOfSpeech = word.partOfSpeech || '';
    
    // 構建提示詞
    const prompt = `
    請為英文單字 "${wordText}" 創建一個包含該單字的英文例句。
    
    單字資訊：
    - 詞性：${partOfSpeech}
    - 中文意思：${meaning}
    
    要求：
    1. 句子應該簡單清晰，適合語言學習者
    2. 句子長度在 8-15 個單詞之間
    3. 句子中必須包含單字 "${wordText}"
    4. 句子應該展示該單字的正確用法
    5. 不要使用太艱深的詞彙
    
    請直接輸出英文例句，不要包含任何額外說明或標記。請確保單字 "${wordText}" 在句子中以原形出現，便於識別。
    `;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            let sentence = data.candidates[0].content.parts[0].text.trim();
            
            // 清理句子，確保句子包含目標單字
            sentence = sentence.replace(/^["'\s\n]+|["'\s\n]+$/g, '');
            
            // 檢查句子是否包含目標單字
            if (!sentence.match(new RegExp(wordText, 'i'))) {
                console.warn('生成的句子不包含目標單字');
                return null;
            }
            
            return sentence;
        }
        
        return null;
    } catch (error) {
        console.error('調用 Gemini API 時出錯:', error);
        throw error;
    }
}

/**
 * 檢查填空答案
 */
function checkFillAnswer() {
    if (practiceWords.length === 0 || currentPracticeIndex < 0 || currentPracticeIndex >= practiceWords.length) {
        return;
    }
    
    const fillBlank = document.getElementById('fillBlank');
    const feedback = document.querySelector('#fillPractice .feedback');
    
    if (!fillBlank || !feedback) return;
    
    const userAnswer = fillBlank.value.trim().toLowerCase();
    const correctAnswer = practiceWords[currentPracticeIndex].word.toLowerCase();
    
    if (userAnswer === correctAnswer) {
        // 答案正確
        feedback.textContent = `正確！"${correctAnswer}" 是正確的單字。`;
        feedback.className = 'feedback success';
        
        // 增加分數
        currentScore++;
        
        // 禁用輸入框
        fillBlank.disabled = true;
        
        // 2秒後自動跳到下一題
        setTimeout(() => {
            if (currentPracticeIndex < practiceWords.length - 1) {
                currentPracticeIndex++;
                showFillQuestion(currentPracticeIndex);
            } else {
                showPracticeResult();
            }
        }, 2000);
    } else {
        // 答案錯誤
        feedback.textContent = `錯誤！正確答案是: "${correctAnswer}"`;
        feedback.className = 'feedback error';
    }
}

/**
 * 初始化配對遊戲
 */
function initMatchingGame() {
    // 重置遊戲狀態
    matchedPairs = 0;
    matchingTimeLeft = 60;
    firstSelected = null;
}

/**
 * 開始配對遊戲
 */
function startMatchingGame() {
    // 顯示配對遊戲模式
    hideAllPracticeModes();
    const matchingMode = document.getElementById('matchingPractice');
    if (matchingMode) {
        matchingMode.classList.add('active');
    }
    
    // 初始化遊戲
    initMatchingGame();
    
    // 生成配對項目
    generateMatchingItems();
    
    // 開始計時器
    startMatchingTimer();
}

/**
 * 生成配對項目
 */
function generateMatchingItems() {
    // 取得要配對的單字
    let gameWords = practiceWords.slice(0, 4); // 使用前4個單字
    
    // 如果單字不足，使用模擬數據
    if (gameWords.length < 4) {
        gameWords = [
            { id: 1, word: 'Apple', meaning: '蘋果' },
            { id: 2, word: 'Banana', meaning: '香蕉' },
            { id: 3, word: 'Orange', meaning: '橘子' },
            { id: 4, word: 'Grape', meaning: '葡萄' }
        ];
    }
    
    // 創建英文項目
    const englishColumn = document.querySelector('.matching-column:first-child');
    if (englishColumn) {
        englishColumn.innerHTML = '';
        const shuffledWords = shuffleArray([...gameWords]);
        
        shuffledWords.forEach(word => {
            const item = document.createElement('div');
            item.className = 'matching-item';
            item.setAttribute('data-id', word.id);
            item.textContent = word.word;
            
            // 添加點擊事件
            item.addEventListener('click', handleMatchingItemClick);
            
            englishColumn.appendChild(item);
        });
    }
    
    // 創建中文項目
    const chineseColumn = document.querySelector('.matching-column:last-child');
    if (chineseColumn) {
        chineseColumn.innerHTML = '';
        const shuffledMeanings = shuffleArray([...gameWords]);
        
        shuffledMeanings.forEach(word => {
            const item = document.createElement('div');
            item.className = 'matching-item';
            item.setAttribute('data-id', word.id);
            item.textContent = word.meaning;
            
            // 添加點擊事件
            item.addEventListener('click', handleMatchingItemClick);
            
            chineseColumn.appendChild(item);
        });
    }
    
    // 重置遊戲狀態
    matchedPairs = 0;
    updateMatchedCount();
}

/**
 * 處理配對項目點擊
 * @param {Event} e - 點擊事件
 */
function handleMatchingItemClick(e) {
    const item = e.currentTarget;
    
    // 如果項目已經匹配，直接返回
    if (item.classList.contains('matched')) {
        return;
    }
    
    // 如果是第一個選中的項目
    if (!firstSelected) {
        // 清除之前的選中狀態
        document.querySelectorAll('.matching-item.selected').forEach(selected => {
            selected.classList.remove('selected');
        });
        
        // 設置當前選中狀態
        item.classList.add('selected');
        firstSelected = item;
    } else {
        // 如果是同一個項目，取消選中
        if (firstSelected === item) {
            item.classList.remove('selected');
            firstSelected = null;
            return;
        }
        
        // 檢查是否匹配
        const firstId = parseInt(firstSelected.getAttribute('data-id'));
        const secondId = parseInt(item.getAttribute('data-id'));
        
        if (firstId === secondId) {
            // 匹配成功
            firstSelected.classList.remove('selected');
            firstSelected.classList.add('matched');
            item.classList.add('matched');
            
            // 發音
            const word = firstSelected.textContent;
            if (firstSelected.parentElement.classList.contains('matching-column:first-child')) {
                pronounceWord(word);
            } else {
                pronounceWord(item.textContent);
            }
            
            // 增加匹配數
            matchedPairs++;
            updateMatchedCount();
            
            // 檢查是否完成所有匹配
            if (matchedPairs === 4) {
                // 停止計時器
                clearInterval(matchingTimer);
                
                // 顯示完成訊息
                alert('恭喜！您已完成所有配對。');
                
                // 增加分數
                currentScore += 4;
            }
        } else {
            // 匹配失敗，短暫顯示後恢復
            item.classList.add('selected');
            
            setTimeout(() => {
                firstSelected.classList.remove('selected');
                item.classList.remove('selected');
                firstSelected = null;
            }, 500);
        }
        
        firstSelected = null;
    }
}

/**
 * 更新已配對數量
 */
function updateMatchedCount() {
    const matchedCount = document.getElementById('matchedCount');
    if (matchedCount) {
        matchedCount.textContent = matchedPairs;
    }
}

/**
 * 開始配對遊戲計時器
 */
function startMatchingTimer() {
    // 清除先前的計時器
    if (matchingTimer) {
        clearInterval(matchingTimer);
    }
    
    // 重置時間
    matchingTimeLeft = 60;
    updateMatchingTime();
    
    // 設置新計時器
    matchingTimer = setInterval(() => {
        matchingTimeLeft--;
        updateMatchingTime();
        
        // 時間到或全部匹配完成
        if (matchingTimeLeft <= 0 || matchedPairs === 4) {
            clearInterval(matchingTimer);
            
            if (matchingTimeLeft <= 0 && matchedPairs < 4) {
                alert(`時間到！您成功匹配了 ${matchedPairs} 組。`);
            }
        }
    }, 1000);
}

/**
 * 更新配對遊戲時間
 */
function updateMatchingTime() {
    const timeElem = document.getElementById('matchingTime');
    if (timeElem) {
        const minutes = Math.floor(matchingTimeLeft / 60);
        const seconds = matchingTimeLeft % 60;
        timeElem.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

/**
 * 顯示練習結果
 */
function showPracticeResult() {
    let message = '';
    
    // 根據練習類型和分數生成訊息
    switch (currentPracticeType) {
        case 'spelling':
        case 'multiple':
        case 'fill':
            const percentage = Math.round((currentScore / practiceWords.length) * 100);
            message = `練習完成！\n您的得分是：${currentScore} / ${practiceWords.length} (${percentage}%)`;
            break;
        case 'matching':
            message = `遊戲完成！\n您成功匹配了 ${matchedPairs} / 4 組`;
            break;
    }
    
    // 根據得分率給出評價
    let evaluation = '';
    const scoreRate = currentScore / (currentPracticeType === 'matching' ? 4 : practiceWords.length);
    
    if (scoreRate >= 0.9) {
        evaluation = '\n太棒了！您的表現非常出色！';
    } else if (scoreRate >= 0.7) {
        evaluation = '\n做得好！繼續努力！';
    } else if (scoreRate >= 0.5) {
        evaluation = '\n不錯的嘗試，還有改進空間！';
    } else {
        evaluation = '\n需要更多練習，不要氣餒！';
    }
    
    // 顯示結果
    showNotification(message + evaluation, 'info', 5000);
    
    // 重置練習狀態
    currentPracticeIndex = 0;
    currentScore = 0;
    
    // 隱藏練習模式
    hideAllPracticeModes();
}

/**
 * 打亂數組順序
 * @param {Array} array - 要打亂的數組
 * @returns {Array} - 打亂後的數組
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 顯示通知訊息
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 (success, error, warning, info)
 * @param {number} duration - 顯示時間（毫秒）
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 檢查是否已有通知元素
    let notification = document.querySelector('.notification');
    
    // 如果沒有，創建一個
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // 設置通知樣式
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // 自動隱藏
    setTimeout(() => {
        notification.style.display = 'none';
    }, duration);
}

/**
 * 添加練習頁面的樣式
 */
function addPracticeStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* 練習頁面樣式 */
        #practice .page-header {
            margin-bottom: 30px;
        }
        
        #practice .practice-controls {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        #practice .practice-controls select {
            flex: 1;
            padding: 8px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f8f8f8;
        }
        
        #practice .practice-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .practice-mode {
            display: none;
            width: 100%;
        }
        
        .practice-mode.active {
            display: block;
        }
        
        .practice-card {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 20px;
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
        }
        
        .practice-question {
            margin-bottom: 20px;
        }
        
        .practice-question h3 {
            font-size: 1.4em;
            margin-bottom: 15px;
            color: #333;
        }
        
        .part-of-speech {
            font-style: italic;
            color: #666;
            margin-bottom: 5px;
        }
        
        .hint-section {
            display: flex;
            gap: 10px;
            margin: 15px 0;
        }
        
        .hint-btn {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s;
        }
        
        .hint-btn:hover {
            background-color: #e0e0e0;
        }
        
        .hidden {
            display: none;
        }
        
        .practice-submit {
            margin: 20px 0;
        }
        
        .feedback {
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .feedback.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .feedback.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .practice-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
        }
        
        .nav-btn {
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .nav-btn:hover {
            background-color: #e0e0e0;
        }
        
        .progress-indicator {
            font-size: 0.9em;
            color: #666;
        }
        
        /* 拼寫練習樣式 */
        #spellingInput {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        
        /* 選擇題樣式 */
        .practice-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 15px 0;
        }
        
        .option {
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .option:hover {
            background-color: #f9f9f9;
        }
        
        .option input[type="radio"] {
            margin-right: 10px;
        }
        
        /* 配對遊戲樣式 */
        .matching-game {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        
        .matching-column {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .matching-item {
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        
        .matching-item:hover {
            background-color: #e0e0e0;
        }
        
        .matching-item.selected {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
        }
        
        .matching-item.matched {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            cursor: default;
        }
        
        .matching-timer, .matching-score {
            text-align: center;
            margin: 10px 0;
            font-size: 1.1em;
        }
        
        /* 填空練習樣式 */
        .fill-sentence {
            font-size: 1.2em;
            line-height: 1.6;
            margin: 15px 0;
        }
        
        .fill-blank {
            width: 150px;
            padding: 5px 10px;
            border: 1px solid #aaa;
            border-radius: 4px;
            font-size: 1em;
            margin: 0 5px;
        }
        
        .meaning-hint, .letter-hint {
            padding: 8px 12px;
            margin: 10px 0;
            background-color: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #007bff;
        }
        
        /* Gemini API 相關樣式 */
        .loading-spinner {
            padding: 20px;
            text-align: center;
            color: #666;
        }
        
        .loading-spinner i {
            margin-right: 8px;
            font-size: 1.2em;
        }
        
        .loading-suggestion {
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            margin: 10px 0;
            text-align: center;
        }
        
        .loading-suggestion.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .api-error-message {
            padding: 15px;
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            border-radius: 6px;
            margin: 10px 0;
        }
        
        .api-error-message h4 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        
        .api-error-message ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .generate-btn {
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 15px;
            cursor: pointer;
            font-size: 0.9em;
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .generate-btn:hover {
            background-color: #0069d9;
        }
        
        .generate-btn i {
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(styleElement);
}

// 添加時間戳以強制瀏覽器刷新緩存
console.log('練習測驗模組加載完成，版本時間戳：' + new Date().toISOString()); 