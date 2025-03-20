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

document.addEventListener('DOMContentLoaded', () => {
    initPracticeModule();
});

/**
 * 初始化練習模組
 */
function initPracticeModule() {
    // 確保在練習頁面才初始化
    if (!document.getElementById('practice')) {
        return;
    }
    
    // 初始化練習類型選擇器
    initPracticeTypeSelector();
    
    // 初始化詞彙表選擇器
    initPracticeListSelector();
    
    // 初始化開始練習按鈕
    initStartPracticeButton();
    
    // 初始化拼寫練習
    initSpellingPractice();
    
    // 初始化選擇題測驗
    initMultipleChoicePractice();
    
    // 初始化填空練習
    initFillInBlankPractice();
    
    // 初始化配對遊戲
    initMatchingGame();
}

/**
 * 初始化練習類型選擇器
 */
function initPracticeTypeSelector() {
    const practiceTypeSelect = document.getElementById('practiceTypeSelect');
    if (!practiceTypeSelect) return;
    
    practiceTypeSelect.addEventListener('change', () => {
        currentPracticeType = practiceTypeSelect.value;
        hideAllPracticeModes();
    });
}

/**
 * 初始化詞彙表選擇器
 */
function initPracticeListSelector() {
    const practiceListSelect = document.getElementById('practiceListSelect');
    if (!practiceListSelect) return;
    
    // 從詞彙管理中獲取詞彙表
    updatePracticeListOptions();
}

/**
 * 更新詞彙表選項
 */
function updatePracticeListOptions() {
    const practiceListSelect = document.getElementById('practiceListSelect');
    if (!practiceListSelect) return;
    
    // 清空現有選項
    practiceListSelect.innerHTML = '';
    
    // 添加預設選項
    const defaultOptions = [
        { value: 'all', text: '所有單字' },
        { value: 'new', text: '新學單字' },
        { value: 'difficult', text: '困難單字' }
    ];
    
    defaultOptions.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option.value;
        optElement.textContent = option.text;
        practiceListSelect.appendChild(optElement);
    });
    
    // 從全局數據中獲取自定義詞彙表
    if (window.appData && window.appData.wordLists) {
        window.appData.wordLists.forEach(list => {
            const optElement = document.createElement('option');
            optElement.value = list.id;
            optElement.textContent = list.name;
            practiceListSelect.appendChild(optElement);
        });
    }
}

/**
 * 初始化開始練習按鈕
 */
function initStartPracticeButton() {
    const startPracticeBtn = document.getElementById('startPracticeBtn');
    if (!startPracticeBtn) return;
    
    startPracticeBtn.addEventListener('click', async () => {
        const practiceTypeSelect = document.getElementById('practiceTypeSelect');
        const practiceListSelect = document.getElementById('practiceListSelect');
        
        if (!practiceTypeSelect || !practiceListSelect) {
            showNotification('無法初始化練習設置', 'error');
            return;
        }
        
        currentPracticeType = practiceTypeSelect.value;
        const selectedList = practiceListSelect.value;
        
        // 顯示載入中狀態
        startPracticeBtn.disabled = true;
        startPracticeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 載入中...';
        
        try {
            // 載入練習詞彙
            const success = await loadPracticeWords(selectedList);
            
            if (success) {
                // 根據練習類型開始相應的練習
                switch (currentPracticeType) {
                    case 'spelling':
                        startSpellingPractice();
                        break;
                    case 'multiple':
                        startMultipleChoicePractice();
                        break;
                    case 'matching':
                        startMatchingGame();
                        break;
                    case 'fill':
                        startFillInBlankPractice();
                        break;
                }
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
 * @param {string} listName - 詞彙表名稱
 */
async function loadPracticeWords(listName = 'all') {
    try {
        let words;
        
        // 從資料庫載入單字
        if (listName === 'all') {
            words = await window.db.getAllWords();
        } else if (listName === 'new') {
            words = await window.db.getWordsByStatus('notLearned');
        } else if (listName === 'difficult') {
            words = await window.db.getWordsByStatus('difficult');
        } else {
            words = await window.db.getWordsInList(listName);
        }
        
        // 如果沒有單字，顯示提示
        if (!words || words.length === 0) {
            showNotification('選擇的詞彙表中沒有單字', 'warning');
            return;
        }
        
        console.log('已載入單字：', words);
        
        // 打亂單字順序
        practiceWords = shuffleArray(words);
        
        // 如果單字太多，只取前10個
        if (practiceWords.length > 10) {
            practiceWords = practiceWords.slice(0, 10);
        }
        
        // 重置當前索引和分數
        currentPracticeIndex = 0;
        currentScore = 0;
        
        console.log('練習單字準備完成：', practiceWords);
        return true;
    } catch (error) {
        console.error('載入練習單字失敗：', error);
        showNotification('載入單字數據失敗', 'error');
        return false;
    }
}

/**
 * 隱藏所有練習模式
 */
function hideAllPracticeModes() {
    document.querySelectorAll('.practice-mode').forEach(mode => {
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
    // 顯示拼寫練習模式
    hideAllPracticeModes();
    const spellingMode = document.getElementById('spellingPractice');
    if (spellingMode) {
        spellingMode.classList.add('active');
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
    if (practiceWords.length === 0 || index < 0 || index >= practiceWords.length) {
        return;
    }
    
    const word = practiceWords[index];
    
    // 生成填空句子
    const fillSentence = document.querySelector('.fill-sentence');
    if (fillSentence) {
        const example = word.examples && word.examples.length > 0 
            ? word.examples[0] 
            : `I have a ${word.word} today.`;
        
        // 將句子中的單字替換為填空
        const sentenceHtml = example.replace(
            new RegExp(word.word, 'gi'), 
            '<input type="text" class="fill-blank" id="fillBlank">'
        );
        
        fillSentence.innerHTML = sentenceHtml;
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
    
    // 清空輸入框和反饋
    const fillBlank = document.getElementById('fillBlank');
    const feedback = document.querySelector('#fillPractice .feedback');
    
    if (fillBlank) {
        fillBlank.value = '';
        fillBlank.disabled = false;
        fillBlank.focus();
    }
    
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'feedback';
    }
    
    // 更新進度指示器
    const progressIndicator = document.querySelector('#fillPractice .progress-indicator');
    if (progressIndicator) {
        progressIndicator.textContent = `${index + 1} / ${practiceWords.length}`;
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