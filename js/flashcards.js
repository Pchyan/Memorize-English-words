/**
 * 單字記憶大師 - 記憶卡功能模組
 * 負責記憶卡的顯示、翻轉、導航和相關功能
 */

let currentCardIndex = 0;
let cards = [];
let autoPlayTimer = null;
let isAutoPlaying = false;
let isFlashcardsInitialized = false; // 記錄記憶卡功能是否已初始化
let initDeckSelectorLastRunTime = 0; // 記錄上次初始化詞彙表選擇器的時間

document.addEventListener('DOMContentLoaded', async () => {
    // 檢查頁面是否為記憶卡頁面
    const flashcardsPage = document.getElementById('flashcards');
    if (flashcardsPage && flashcardsPage.classList.contains('active')) {
        // 如果當前頁面是記憶卡頁面，直接初始化
        await initFlashcards();
    } else {
        // 否則，監聽頁面切換事件
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', async function(e) {
                if (this.getAttribute('data-page') === 'flashcards') {
                    console.log('點擊切換到記憶卡頁面');
                    // 不需要再延遲調用，函數內部會檢查是否需要重新初始化
                }
            });
        });
    }
});

/**
 * 初始化記憶卡功能
 */
async function initFlashcards() {
    // 確保在記憶卡頁面才初始化
    if (!document.getElementById('flashcards')) {
        return;
    }
    
    console.log('正在初始化記憶卡功能...');
    
    // 檢查是否已經初始化過，若是則只更新內容不重新初始化所有功能
    if (isFlashcardsInitialized) {
        console.log('記憶卡功能已初始化過，僅更新數據');
        await loadCardData();
        return;
    }
    
    // 確保資料庫已初始化
    try {
        if (!window.db) {
            console.log('資料庫未初始化，嘗試初始化...');
            await initDatabase();
        }
    } catch (error) {
        console.error('初始化資料庫失敗:', error);
    }
    
    // 初始化詞彙表下拉選單
    await initDeckSelector();
    
    // 載入單字數據
    await loadCardData();
    
    // 記憶卡點擊事件 - 翻轉
    const flashcard = document.getElementById('mainFlashcard');
    if (flashcard) {
        // 移除現有的事件監聽器以防重複
        flashcard.removeEventListener('click', flipCard);
        // 添加新的事件監聽器
        flashcard.addEventListener('click', flipCard);
        console.log('已為記憶卡添加點擊事件監聽器');
    } else {
        console.error('找不到記憶卡元素');
    }
    
    // 導航按鈕
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    
    if (prevCardBtn) {
        // 移除現有的事件監聽器以防重複
        prevCardBtn.removeEventListener('click', prevCardHandler);
        // 添加新的事件監聽器
        prevCardBtn.addEventListener('click', prevCardHandler);
        console.log('已為上一張按鈕添加點擊事件監聽器');
    } else {
        console.error('找不到上一張按鈕元素');
    }
    
    if (nextCardBtn) {
        // 移除現有的事件監聽器以防重複
        nextCardBtn.removeEventListener('click', nextCardHandler);
        // 添加新的事件監聽器
        nextCardBtn.addEventListener('click', nextCardHandler);
        console.log('已為下一張按鈕添加點擊事件監聽器');
    } else {
        console.error('找不到下一張按鈕元素');
    }

    // 跳轉功能的點擊事件監聽
    const jumpToBtn = document.getElementById('jumpToBtn');
    if (jumpToBtn) {
        jumpToBtn.removeEventListener('click', jumpToCardHandler);
        jumpToBtn.addEventListener('click', jumpToCardHandler);
        console.log('已為跳轉按鈕添加點擊事件監聽器');
    } else {
        console.error('找不到跳轉按鈕元素');
    }

    // 跳轉輸入框的Enter鍵監聽
    const jumpToInput = document.getElementById('jumpToInput');
    if (jumpToInput) {
        jumpToInput.removeEventListener('keypress', handleJumpInputKeypress);
        jumpToInput.addEventListener('keypress', handleJumpInputKeypress);
        console.log('已為跳轉輸入框添加鍵盤事件監聽器');
    } else {
        console.error('找不到跳轉輸入框元素');
    }
    
    // 自動播放按鈕
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    if (autoPlayBtn) {
        autoPlayBtn.addEventListener('click', toggleAutoPlay);
    }
    
    // 詞彙選擇器
    const deckSelector = document.getElementById('deckSelector');
    if (deckSelector) {
        deckSelector.addEventListener('change', async () => {
            const selectedDeck = deckSelector.value;
            await loadCardData(selectedDeck);
        });
    }
    
    // 所有發音按鈕
    const pronunciationBtns = document.querySelectorAll('.pronunciation-btn');
    pronunciationBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止觸發記憶卡翻轉
            const word = document.getElementById('wordFront').textContent;
            pronounceWord(word);
        });
    });
    
    // 學習工具按鈕
    initLearningTools();
    
    // 標記為已初始化
    isFlashcardsInitialized = true;
    console.log('記憶卡功能初始化完成');
}

/**
 * 初始化詞彙表下拉選單
 */
async function initDeckSelector() {
    const currentTime = Date.now();
    // 如果距離上次初始化不到1秒，則跳過
    if (currentTime - initDeckSelectorLastRunTime < 1000) {
        console.log('詞彙表選擇器最近已初始化，跳過此次初始化');
        return;
    }
    
    initDeckSelectorLastRunTime = currentTime;
    
    const deckSelector = document.getElementById('deckSelector');
    if (!deckSelector) {
        console.error('找不到詞彙表下拉選單');
        return;
    }
    
    console.log('初始化詞彙表下拉選單');
    
    // 清空現有選項
    while (deckSelector.options.length > 0) {
        deckSelector.remove(0);
    }
    
    // 添加預設選項
    const defaultOptions = [
        { id: 'all', name: '所有單字' },
        { id: 'notLearned', name: '未學習' },
        { id: 'learning', name: '學習中' },
        { id: 'mastered', name: '已掌握' }
    ];
    
    defaultOptions.forEach(option => {
        const optionElem = document.createElement('option');
        optionElem.value = option.id;
        optionElem.textContent = option.name;
        deckSelector.appendChild(optionElem);
    });
    
    try {
        // 從資料庫獲取詞彙組
        const wordLists = await window.db.getAllWordLists();
        console.log('從資料庫載入詞彙組:', wordLists.length);
        
        if (wordLists && wordLists.length > 0) {
            // 添加分隔線
            const separatorOption = document.createElement('option');
            separatorOption.disabled = true;
            separatorOption.textContent = '──────────';
            deckSelector.appendChild(separatorOption);
            
            // 添加自定義詞彙組 (使用Set來確保不會添加重複ID的選項)
            const addedIds = new Set();
            
            wordLists.forEach(list => {
                // 確保該ID未被添加過
                if (!addedIds.has(list.id)) {
                    const optionElem = document.createElement('option');
                    optionElem.value = list.id;
                    optionElem.textContent = list.name;
                    deckSelector.appendChild(optionElem);
                    
                    // 記錄已添加的ID
                    addedIds.add(list.id);
                }
            });
        }
    } catch (error) {
        console.error('載入詞彙組失敗:', error);
    }
}

/**
 * 載入記憶卡數據
 * @param {string} deck - 詞彙組名稱，預設為'all'
 */
async function loadCardData(deck = 'all') {
    console.log(`準備載入卡片數據，詞彙表: ${deck}`);
    
    try {
        // 根據詞彙表選擇載入資料
        let wordData = [];
        if (deck === 'all') {
            wordData = await window.db.getAllWords();
            console.log(`從資料庫載入所有單字，數量: ${wordData.length}`);
        } else if (deck === 'notLearned') {
            wordData = await window.db.getWordsByStatus('notLearned');
            console.log(`從資料庫載入未學習單字，數量: ${wordData.length}`);
        } else if (deck === 'learning') {
            wordData = await window.db.getWordsByStatus('learning');
            console.log(`從資料庫載入學習中單字，數量: ${wordData.length}`);
        } else if (deck === 'mastered') {
            wordData = await window.db.getWordsByStatus('mastered');
            console.log(`從資料庫載入已掌握單字，數量: ${wordData.length}`);
        } else {
            // 如果是數字，則表示是特定詞彙表的ID
            const listId = parseInt(deck);
            if (!isNaN(listId)) {
                wordData = await window.db.getWordsInList(listId);
                console.log(`從資料庫載入詞彙表 ${listId} 的單字，數量: ${wordData.length}`);
            }
        }
        
        // 檢查單字是否包含 contexts 欄位
        let contextsCount = 0;
        for (const word of wordData) {
            const hasContexts = !!(word.contexts && Array.isArray(word.contexts) && word.contexts.length > 0);
            
            console.log(`單字 "${word.word}" (ID: ${word.id}) 包含 contexts: ${hasContexts ? '是' : '否'}${hasContexts ? ', 數量: ' + word.contexts.length : ', 無常見用法'}`);
            
            if (hasContexts) {
                contextsCount++;
                console.log(`單字 "${word.word}" 的 contexts:`, word.contexts);
            } else {
                console.log(`單字 "${word.word}" 完整對象:`, word);
            }
        }
        
        console.log(`共有 ${contextsCount}/${wordData.length} 個單字包含 contexts 欄位 (${Math.round(contextsCount / wordData.length * 100 || 0)}%)`);
        
        if (wordData.length > 0) {
            cards = wordData;
            console.log(`成功載入單字數據，卡片數量: ${cards.length}`);
            
            // 重置當前索引
            currentCardIndex = 0;
            console.log(`重置當前索引為 ${currentCardIndex}`);
            
            // 顯示第一張卡片
            showCard(currentCardIndex);
            
            // 更新計數器
            updateCardCounter();
            
            // 確保導航按鈕正確綁定
            ensureNavigationButtons();
        } else {
            console.warn('沒有找到單字，顯示提示信息');
            
            const flashcardContainer = document.querySelector('.flashcard-container');
            if (flashcardContainer) {
                // 顯示無資料提示
                flashcardContainer.innerHTML = `
                    <div class="no-cards-notice">
                        <h3>沒有可顯示的單字</h3>
                        <p>目前詞彙表中沒有符合當前篩選條件的單字。</p>
                        <p>請前往<a href="#" class="nav-vocabulary">詞彙管理</a>頁面添加單字，或者使用左側詞彙表選擇器選擇其他詞彙表。</p>
                    </div>
                `;
                
                // 為詞彙管理連結添加事件監聽器
                const vocabLink = flashcardContainer.querySelector('.nav-vocabulary');
                if (vocabLink) {
                    vocabLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        document.querySelector('nav a[data-page="vocabulary"]').click();
                    });
                }
            }
        }
    } catch (error) {
        console.error('載入卡片數據時出錯:', error);
        
        // 出錯時顯示錯誤提示卡片
        cards = [{
            id: 0,
            word: '載入失敗',
            phonetic: '',
            meaning: '無法載入單字數據',
            partOfSpeech: '',
            definition: '請檢查資料庫連接或重新整理頁面',
            examples: []
        }];
        
        // 重置當前索引並顯示錯誤卡片
        currentCardIndex = 0;
        showCard(currentCardIndex);
        updateCardCounter();
    }
}

/**
 * 確保導航按鈕正確綁定
 */
function ensureNavigationButtons() {
    // 檢查並綁定導航按鈕
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    
    if (prevCardBtn) {
        // 移除現有的事件監聽器以防重複
        prevCardBtn.removeEventListener('click', prevCardHandler);
        // 添加新的事件監聽器
        prevCardBtn.addEventListener('click', prevCardHandler);
        console.log('已重新綁定上一張按鈕事件');
    }
    
    if (nextCardBtn) {
        // 移除現有的事件監聽器以防重複
        nextCardBtn.removeEventListener('click', nextCardHandler);
        // 添加新的事件監聽器
        nextCardBtn.addEventListener('click', nextCardHandler);
        console.log('已重新綁定下一張按鈕事件');
    }
}

/**
 * 顯示指定索引的記憶卡
 * @param {number} index - 卡片索引
 */
function showCard(index) {
    console.log(`開始顯示卡片，索引: ${index}，卡片總數: ${cards.length}`);
    
    if (cards.length === 0 || index < 0 || index >= cards.length) {
        console.error('無效的卡片索引或沒有卡片');
        return;
    }
    
    const card = cards[index];
    console.log('即將顯示的卡片:', card);
    
    // 檢查卡片數據的完整性
    if (!card || !card.word) {
        console.error('卡片數據不完整');
        return;
    }
    
    // 檢查 contexts 欄位
    if (card.contexts) {
        console.log(`卡片 "${card.word}" 包含 ${card.contexts.length} 個常見用法`);
        if (card.contexts.length > 0) {
            console.log(`常見用法示例:`, card.contexts[0]);
        }
    } else {
        console.log(`卡片 "${card.word}" 不包含常見用法`);
        // 初始化一個空的 contexts 數組以防止錯誤
        card.contexts = [];
    }
    
    try {
        // 更新前面
        const wordFrontElem = document.getElementById('wordFront');
        if (wordFrontElem) {
            wordFrontElem.textContent = card.word;
            console.log('更新了卡片正面的單字:', card.word);
        } else {
            console.error('找不到 wordFront 元素');
            return;
        }
        
        const phoneticElem = document.querySelector('.phonetic');
        if (phoneticElem) {
            phoneticElem.textContent = card.phonetic || '';
            console.log('更新了音標:', card.phonetic);
        }
        
        // 更新背面
        const wordBackElem = document.getElementById('wordBack');
        if (wordBackElem) {
            wordBackElem.textContent = card.meaning;
            console.log('更新了卡片背面的意思:', card.meaning);
        } else {
            console.error('找不到 wordBack 元素');
            return;
        }
        
        const partOfSpeech = document.querySelector('.part-of-speech');
        if (partOfSpeech) {
            partOfSpeech.textContent = translatePartOfSpeech(card.partOfSpeech);
        }
        
        const definition = document.querySelector('.definition');
        if (definition) {
            definition.textContent = card.definition || '';
        }
        
        // 更新例句
        const examplesContainer = document.querySelector('.examples');
        if (examplesContainer) {
            // 首先清空現有例句
            const examplesHeader = examplesContainer.querySelector('h4');
            if (examplesHeader) {
                examplesContainer.innerHTML = '';
                examplesContainer.appendChild(examplesHeader);
                
                // 添加新例句
                if (card.examples && card.examples.length > 0) {
                    card.examples.forEach(example => {
                        const exampleElem = document.createElement('p');
                        exampleElem.textContent = example;
                        examplesContainer.appendChild(exampleElem);
                    });
                    console.log('更新了例句，數量:', card.examples.length);
                } else {
                    const noExampleElem = document.createElement('p');
                    noExampleElem.textContent = '沒有例句';
                    examplesContainer.appendChild(noExampleElem);
                    console.log('沒有例句可顯示');
                }
            } else {
                console.error('找不到例句標題元素');
            }
        } else {
            console.error('找不到例句容器元素');
        }
        
        // 確保卡片不是翻轉狀態
        const flashcard = document.getElementById('mainFlashcard');
        if (flashcard) {
            // 直接移除 flipped 類別，而不是檢查它是否存在
            flashcard.classList.remove('flipped');
            console.log('重置記憶卡翻轉狀態');
        } else {
            console.error('找不到記憶卡元素，無法重置翻轉狀態');
            return;
        }
        
        // 更新學習工具面板中的單字
        updateLearningToolsWord(card.word);
        
        // 更新聯想文本區域
        const assocInput = document.getElementById('assocInput');
        if (assocInput) {
            assocInput.value = card.associations || '';
        }
        
        // 檢查聯想面板是否處於活動狀態，如果是則更新聯想面板內容
        const associationPanel = document.getElementById('associationPanel');
        if (associationPanel && associationPanel.classList.contains('active')) {
            updateAssociationPanel();
        }
        
        // 檢查上下文面板是否處於活動狀態，如果是則更新上下文面板內容
        const contextPanel = document.getElementById('contextPanel');
        if (contextPanel && contextPanel.classList.contains('active')) {
            updateContextPanel();
        }
        
        // 檢查同義詞面板是否處於活動狀態，如果是則更新同義詞面板內容
        const synonymsPanel = document.getElementById('synonymsPanel');
        if (synonymsPanel && synonymsPanel.classList.contains('active')) {
            updateSynonymsPanel();
        }
        
        console.log(`卡片索引 ${index} 顯示完成`);
    } catch (error) {
        console.error('顯示卡片時發生錯誤:', error);
    }
}

/**
 * 更新學習工具面板中的單字
 * @param {string} word - 單字
 */
function updateLearningToolsWord(word) {
    const assocWordElem = document.getElementById('assocWord');
    if (assocWordElem) {
        assocWordElem.textContent = word;
    }
    
    const contextWordElem = document.getElementById('contextWord');
    if (contextWordElem) {
        contextWordElem.textContent = word;
    }
    
    const synWordElem = document.getElementById('synWord');
    if (synWordElem) {
        synWordElem.textContent = word;
    }
}

/**
 * 上一張卡片按鈕的事件處理函數
 * @param {Event} e - 事件對象
 */
function prevCardHandler(e) {
    console.log('點擊了上一張卡片按鈕');
    e.stopPropagation(); // 防止觸發記憶卡翻轉
    showPreviousCard();
}

/**
 * 下一張卡片按鈕的事件處理函數
 * @param {Event} e - 事件對象
 */
function nextCardHandler(e) {
    console.log('點擊了下一張卡片按鈕');
    e.stopPropagation(); // 防止觸發記憶卡翻轉
    showNextCard();
}

/**
 * 顯示下一張卡片
 */
function showNextCard() {
    console.log('顯示下一張卡片，目前索引:', currentCardIndex, '卡片總數:', cards.length);
    
    if (cards.length === 0) {
        console.error('沒有卡片可顯示');
        return;
    }
    
    // 計算下一張卡片的索引
    currentCardIndex = (currentCardIndex + 1) % cards.length;
    console.log('切換到新索引:', currentCardIndex);
    
    // 顯示卡片
    showCard(currentCardIndex);
    
    // 更新計數器
    updateCardCounter();
}

/**
 * 顯示上一張卡片
 */
function showPreviousCard() {
    console.log('顯示上一張卡片，目前索引:', currentCardIndex, '卡片總數:', cards.length);
    
    if (cards.length === 0) {
        console.error('沒有卡片可顯示');
        return;
    }
    
    // 計算上一張卡片的索引
    currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
    console.log('切換到新索引:', currentCardIndex);
    
    // 顯示卡片
    showCard(currentCardIndex);
    
    // 更新計數器
    updateCardCounter();
}

/**
 * 更新卡片計數器
 */
function updateCardCounter() {
    console.log('更新卡片計數器，當前索引:', currentCardIndex, '總卡片數:', cards.length);
    
    const counterElem = document.querySelector('.card-counter');
    if (counterElem && cards.length > 0) {
        const counterText = `${currentCardIndex + 1} / ${cards.length}`;
        counterElem.textContent = counterText;
        console.log('卡片計數器更新為:', counterText);
    } else {
        console.error('找不到計數器元素或沒有卡片');
    }

    // 更新跳轉輸入框的限制
    const jumpToInput = document.getElementById('jumpToInput');
    if (jumpToInput && cards.length > 0) {
        jumpToInput.setAttribute('max', cards.length.toString());
        jumpToInput.setAttribute('placeholder', `1-${cards.length}`);
    }
}

/**
 * 切換自動播放功能
 */
function toggleAutoPlay() {
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    
    if (isAutoPlaying) {
        // 停止自動播放
        clearInterval(autoPlayTimer);
        isAutoPlaying = false;
        autoPlayBtn.innerHTML = '<i class="fas fa-play"></i> 自動播放';
        console.log('自動播放已停止');
    } else {
        // 開始自動播放
        isAutoPlaying = true;
        autoPlayBtn.innerHTML = '<i class="fas fa-pause"></i> 暫停播放';
        console.log('自動播放已開始');
        
        // 確保卡片是正面朝上的狀態開始
        const flashcard = document.getElementById('mainFlashcard');
        if (flashcard && flashcard.classList.contains('flipped')) {
            flashcard.classList.remove('flipped');
        }
        
        // 先顯示正面5秒，然後翻轉到背面，再等5秒，然後顯示下一張
        autoPlayTimer = setInterval(() => {
            const flashcard = document.getElementById('mainFlashcard');
            
            if (!flashcard) {
                console.error('找不到記憶卡元素，無法執行自動播放');
                clearInterval(autoPlayTimer);
                isAutoPlaying = false;
                if (autoPlayBtn) {
                    autoPlayBtn.innerHTML = '<i class="fas fa-play"></i> 自動播放';
                }
                return;
            }
            
            if (!flashcard.classList.contains('flipped')) {
                // 如果是正面，翻轉到背面
                console.log('自動播放：正面翻轉到背面');
                flashcard.classList.add('flipped');
                // 發音
                const word = document.getElementById('wordFront').textContent;
                if (word && word !== '沒有單字') {
                    pronounceWord(word);
                }
            } else {
                // 如果是背面，翻轉到正面並顯示下一張
                console.log('自動播放：背面翻轉到下一張卡片的正面');
                flashcard.classList.remove('flipped');
                showNextCard();
            }
        }, 5000);
    }
}

/**
 * 初始化學習工具功能
 */
function initLearningTools() {
    // 聯想按鈕
    const associationBtn = document.getElementById('associationBtn');
    if (associationBtn) {
        associationBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止觸發記憶卡翻轉
            toggleLearningPanel('associationPanel');
        });
    }
    
    // 上下文按鈕
    const contextBtn = document.getElementById('contextBtn');
    if (contextBtn) {
        contextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLearningPanel('contextPanel');
        });
    }
    
    // 同義詞按鈕
    const synonymsBtn = document.getElementById('synonymsBtn');
    if (synonymsBtn) {
        synonymsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLearningPanel('synonymsPanel');
        });
    }
    
    // 拼寫練習按鈕
    const practiceBtnFC = document.getElementById('practiceBtnFC');
    if (practiceBtnFC) {
        practiceBtnFC.addEventListener('click', (e) => {
            e.stopPropagation();
            // 切換到練習頁面並選擇拼寫模式
            switchPage('practice');
            const practiceTypeSelect = document.getElementById('practiceTypeSelect');
            if (practiceTypeSelect) {
                practiceTypeSelect.value = 'spelling';
                // 觸發change事件
                const event = new Event('change');
                practiceTypeSelect.dispatchEvent(event);
            }
        });
    }
    
    // 關閉面板按鈕
    const closePanelBtns = document.querySelectorAll('.close-panel-btn');
    console.log('找到', closePanelBtns.length, '個關閉面板按鈕');
    closePanelBtns.forEach(btn => {
        // 移除可能存在的舊事件監聽器
        btn.removeEventListener('click', closePanelHandler);
        
        // 添加新的事件監聽器
        btn.addEventListener('click', closePanelHandler);
    });
    
    // 建議聯想按鈕
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    if (suggestionBtns.length > 0) {
        console.log('找到', suggestionBtns.length, '個建議聯想按鈕');
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('點擊建議聯想按鈕:', this.textContent);
                
                const assocInput = document.getElementById('assocInput');
                if (assocInput && !assocInput.disabled) {
                    if (assocInput.value) {
                        assocInput.value += '\n';
                    }
                    assocInput.value += this.textContent;
                    
                    // 聚焦輸入框
                    assocInput.focus();
                } else {
                    console.error('找不到聯想輸入框或輸入框已禁用');
                }
            });
        });
    } else {
        console.log('沒有找到建議聯想按鈕，這些按鈕將在 updateSuggestionButtons 函數中動態創建');
    }
    
    // 保存聯想按鈕
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await saveAssociation();
        });
    }
    
    // 檢查句子按鈕
    const checkBtn = document.querySelector('.check-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await checkSentence();
        });
    }
    
    // AI造句按鈕
    const aiSentenceBtn = document.querySelector('.ai-sentence-btn');
    if (aiSentenceBtn) {
        aiSentenceBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await generateAISentences();
        });
    }
    
    // 單詞藥丸中的發音按鈕
    const pillPronunciations = document.querySelectorAll('.word-pill i');
    pillPronunciations.forEach(icon => {
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const word = icon.parentElement.textContent.trim();
            pronounceWord(word);
        });
    });
}

/**
 * 切換學習面板的顯示和隱藏
 * @param {string} panelId - 面板的ID
 */
function toggleLearningPanel(panelId) {
    console.log(`切換學習面板: ${panelId}`);
    
    // 獲取目標面板
    const targetPanel = document.getElementById(panelId);
    if (!targetPanel) {
        console.error(`找不到面板: ${panelId}`);
        return;
    }
    
    const isCurrentlyActive = targetPanel.classList.contains('active');
    console.log(`面板 ${panelId} 當前狀態: ${isCurrentlyActive ? '顯示' : '隱藏'}`);
    
    // 隱藏所有面板
    const panels = document.querySelectorAll('.learning-panel');
    panels.forEach(panel => {
        if (panel.id !== panelId) {
            console.log(`隱藏面板: ${panel.id}`);
            panel.classList.remove('active');
        }
    });
    
    // 切換目標面板
    if (isCurrentlyActive) {
        // 如果面板已經顯示，則隱藏它
        console.log(`隱藏面板: ${panelId}`);
        targetPanel.classList.remove('active');
    } else {
        // 如果面板隱藏，則顯示它
        console.log(`顯示面板: ${panelId}`);
        targetPanel.classList.add('active');
        
        // 根據面板類型更新內容
        if (panelId === 'associationPanel') {
            console.log('更新聯想面板內容');
            updateAssociationPanel();
        } else if (panelId === 'contextPanel') {
            console.log('更新上下文面板內容');
            updateContextPanel();
        } else if (panelId === 'synonymsPanel') {
            console.log('更新同義詞面板內容');
            updateSynonymsPanel();
        }
    }
}

/**
 * 更新聯想面板內容
 */
function updateAssociationPanel() {
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        console.error('無法更新聯想面板：無效的卡片索引');
        return;
    }
    
    const card = cards[currentCardIndex];
    console.log('更新聯想面板，當前單字:', card.word);
    
    // 更新面板標題
    const assocWordElem = document.getElementById('assocWord');
    if (assocWordElem) {
        assocWordElem.textContent = card.word;
    }
    
    // 更新聯想輸入框
    const assocInput = document.getElementById('assocInput');
    if (assocInput) {
        assocInput.value = card.associations || '';
        
        // 如果是"沒有單字"的卡片，禁用輸入框
        if (card.id === 0 || card.word === '沒有單字') {
            assocInput.disabled = true;
            assocInput.placeholder = '請先添加單字';
        } else {
            assocInput.disabled = false;
            assocInput.placeholder = '例如：這個單字讓我想到...';
        }
    } else {
        console.error('找不到聯想輸入框');
    }
    
    // 更新保存按鈕狀態
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        if (card.id === 0 || card.word === '沒有單字') {
            saveBtn.disabled = true;
            saveBtn.classList.add('disabled');
        } else {
            saveBtn.disabled = false;
            saveBtn.classList.remove('disabled');
        }
    }
    
    // 獲取建議區域容器
    const suggestionsContainer = document.querySelector('.suggestions');
    if (!suggestionsContainer) {
        console.error('找不到建議聯想容器');
        return;
    }
    
    // 檢查是否已有儲存的聯想
    if (card.associations && card.associations.trim()) {
        console.log('單字已有儲存的聯想，顯示重新生成按鈕');
        suggestionsContainer.innerHTML = `
            <div class="regenerate-container">
                <p>此單字已有儲存的聯想</p>
                <button class="ai-context-btn regenerate-btn"><i class="fas fa-sync-alt"></i> 重新生成聯想</button>
            </div>
        `;
        
        // 為重新生成按鈕添加事件監聽器
        const regenerateBtn = suggestionsContainer.querySelector('.regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => {
                console.log('點擊重新生成聯想按鈕');
                updateSuggestionButtons(card, true); // 傳入 true 表示強制重新生成
            });
        }
    } else {
        // 如果沒有儲存的聯想，則顯示加載中提示並生成建議
        suggestionsContainer.innerHTML = '<div class="loading-suggestion">正在生成聯想建議...</div>';
        
        // 更新建議聯想按鈕 - 使用異步函數
        updateSuggestionButtons(card);
    }
}

/**
 * 更新上下文面板內容
 */
function updateContextPanel() {
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        return;
    }
    
    const card = cards[currentCardIndex];
    
    // 清空現有上下文
    const contextSection = document.querySelector('.context-section');
    if (contextSection) {
        const contextHeader = contextSection.querySelector('h4');
        contextSection.innerHTML = '';
        contextSection.appendChild(contextHeader);
        
        // 添加上下文用法
        if (card.contexts && card.contexts.length > 0) {
            // 首先顯示已存在的常見用法
            card.contexts.forEach(context => {
                const contextItem = document.createElement('div');
                contextItem.className = 'context-item';
                
                const phrase = document.createElement('p');
                phrase.innerHTML = `<strong>${context.phrase}</strong> - ${context.meaning}`;
                
                const example = document.createElement('p');
                example.className = 'example';
                example.textContent = context.example;
                
                contextItem.appendChild(phrase);
                contextItem.appendChild(example);
                contextSection.appendChild(contextItem);
            });
            
            // 添加重新產生按鈕
            const regenerateContainer = document.createElement('div');
            regenerateContainer.className = 'regenerate-container';
            
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'regenerate-btn';
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新產生常見用法';
            regenerateBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateAIContexts(card);
            });
            
            regenerateContainer.appendChild(regenerateBtn);
            contextSection.appendChild(regenerateContainer);
        } else {
            const noContext = document.createElement('p');
            noContext.textContent = '沒有相關上下文用法';
            contextSection.appendChild(noContext);
            
            // 添加AI補充常見用法按鈕
            const aiContextBtn = document.createElement('button');
            aiContextBtn.className = 'ai-context-btn';
            aiContextBtn.innerHTML = '<i class="fas fa-robot"></i> AI補充常見用法';
            aiContextBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateAIContexts(card);
            });
            contextSection.appendChild(aiContextBtn);
        }
    }
    
    // 清空造句輸入框
    const sentenceInput = document.getElementById('sentenceInput');
    if (sentenceInput) {
        sentenceInput.value = '';
    }
    
    // 隱藏反饋
    const sentenceFeedback = document.getElementById('sentenceFeedback');
    if (sentenceFeedback) {
        sentenceFeedback.textContent = '';
        sentenceFeedback.className = 'feedback';
    }
    
    // 清空並隱藏 AI 造句區域
    const aiSentenceExamples = document.getElementById('aiSentenceExamples');
    if (aiSentenceExamples) {
        aiSentenceExamples.innerHTML = '';
        aiSentenceExamples.classList.remove('active');
    }
}

/**
 * 更新同義詞面板內容
 */
function updateSynonymsPanel() {
    console.log('更新同義詞面板');
    
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        console.error('無法更新同義詞面板：無效的卡片索引');
        return;
    }
    
    const card = cards[currentCardIndex];
    console.log('當前單字:', card.word);
    
    // 準備同義詞和反義詞資料
    let synonyms = card.synonyms || [];
    let antonyms = card.antonyms || [];
    
    console.log('單字同義詞:', synonyms);
    console.log('單字反義詞:', antonyms);
    
    // 更新同義詞
    const synonymsSection = document.querySelector('.synonyms-section');
    if (synonymsSection) {
        synonymsSection.innerHTML = '';
        
        // 添加標題
        const title = document.createElement('h4');
        title.innerHTML = '同義詞：';
        synonymsSection.appendChild(title);
        
        // 添加同義詞容器
        const pillsContainer = document.createElement('div');
        pillsContainer.className = 'word-pills';
        synonymsSection.appendChild(pillsContainer);
        
        if (synonyms.length > 0) {
            synonyms.forEach(synonym => {
                const pill = document.createElement('span');
                pill.className = 'word-pill';
                pill.innerHTML = `${synonym} <i class="fas fa-volume-up"></i>`;
                
                // 添加發音事件
                const icon = pill.querySelector('i');
                if (icon) {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('發音同義詞:', synonym);
                        pronounceWord(synonym);
                    });
                }
                
                pillsContainer.appendChild(pill);
            });
        } else {
            const noPill = document.createElement('span');
            noPill.textContent = '沒有同義詞';
            pillsContainer.appendChild(noPill);
        }
        
        // 添加生成按鈕
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'ai-button-container';
        
        const generateButton = document.createElement('button');
        generateButton.className = 'ai-generate-btn';
        generateButton.innerHTML = `
            <div class="btn-content">
                <i class="fas fa-magic"></i>
                <span class="btn-text">使用 AI 生成同義詞與反義詞</span>
                <div class="btn-shine"></div>
            </div>
        `;
        generateButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await generateAISynonyms(card);
        });
        
        buttonContainer.appendChild(generateButton);
        synonymsSection.appendChild(buttonContainer);
    } else {
        console.error('找不到同義詞容器');
    }
    
    // 更新反義詞
    const relatedSection = document.querySelector('.related-words-section');
    if (relatedSection) {
        relatedSection.innerHTML = '';
        
        // 添加標題
        const title = document.createElement('h4');
        title.innerHTML = '反義詞：';
        relatedSection.appendChild(title);
        
        // 添加反義詞容器
        const pillsContainer = document.createElement('div');
        pillsContainer.className = 'word-pills';
        relatedSection.appendChild(pillsContainer);
        
        if (antonyms.length > 0) {
            antonyms.forEach(antonym => {
                const pill = document.createElement('span');
                pill.className = 'word-pill';
                pill.innerHTML = `${antonym} <i class="fas fa-volume-up"></i>`;
                
                // 添加發音事件
                const icon = pill.querySelector('i');
                if (icon) {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('發音反義詞:', antonym);
                        pronounceWord(antonym);
                    });
                }
                
                pillsContainer.appendChild(pill);
            });
        } else {
            const noPill = document.createElement('span');
            noPill.textContent = '沒有反義詞';
            pillsContainer.appendChild(noPill);
        }
        
        // 如果已經有同義詞和反義詞，顯示重新生成按鈕
        if (synonyms.length > 0 || antonyms.length > 0) {
            const regenerateContainer = document.createElement('div');
            regenerateContainer.className = 'regenerate-container';
            
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'regenerate-btn';
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新產生同義詞與反義詞';
            regenerateBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateAISynonyms(card);
            });
            
            regenerateContainer.appendChild(regenerateBtn);
            relatedSection.appendChild(regenerateContainer);
        }
    } else {
        console.error('找不到反義詞容器');
    }
    
    // 更新詞彙關聯圖
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.innerHTML = '';
        
        if (synonyms.length > 0 || antonyms.length > 0) {
            // 繪製簡單的關聯圖
            const mapTitle = document.createElement('h4');
            mapTitle.innerHTML = '詞彙關聯圖：';
            mapContainer.appendChild(mapTitle);
            
            const svgContainer = document.createElement('div');
            svgContainer.className = 'svg-container';
            svgContainer.innerHTML = `
                <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
                    <g class="word-map">
                        <!-- 中心單字 -->
                        <circle cx="200" cy="150" r="50" class="center-word" />
                        <text x="200" y="155" text-anchor="middle" class="center-text">${card.word}</text>
                        
                        <!-- 同義詞 -->
                        ${synonyms.slice(0, 5).map((syn, i, arr) => {
                            const angle = (i / arr.length) * Math.PI - Math.PI/2;
                            const x = 200 + Math.cos(angle) * 100;
                            const y = 150 + Math.sin(angle) * 100;
                            return `
                                <circle cx="${x}" cy="${y}" r="30" class="synonym-word" />
                                <text x="${x}" y="${y+5}" text-anchor="middle" class="synonym-text">${syn}</text>
                                <line x1="200" y1="150" x2="${x}" y2="${y}" class="synonym-line" />
                            `;
                        }).join('')}
                        
                        <!-- 反義詞 -->
                        ${antonyms.slice(0, 3).map((ant, i, arr) => {
                            const angle = (i / arr.length) * Math.PI + Math.PI/2;
                            const x = 200 + Math.cos(angle) * 100;
                            const y = 150 + Math.sin(angle) * 100;
                            return `
                                <circle cx="${x}" cy="${y}" r="30" class="antonym-word" />
                                <text x="${x}" y="${y+5}" text-anchor="middle" class="antonym-text">${ant}</text>
                                <line x1="200" y1="150" x2="${x}" y2="${y}" class="antonym-line" />
                            `;
                        }).join('')}
                    </g>
                </svg>
            `;
            mapContainer.appendChild(svgContainer);
            
            // 添加 CSS 樣式
            const style = document.createElement('style');
            style.textContent = `
                .svg-container {
                    width: 100%;
                    height: 300px;
                }
                .center-word {
                    fill: #4285f4;
                }
                .synonym-word {
                    fill: #34a853;
                }
                .antonym-word {
                    fill: #ea4335;
                }
                .center-text, .synonym-text, .antonym-text {
                    fill: white;
                    font-size: 14px;
                    font-weight: bold;
                }
                .synonym-line {
                    stroke: #34a853;
                    stroke-width: 2;
                }
                .antonym-line {
                    stroke: #ea4335;
                    stroke-width: 2;
                    stroke-dasharray: 5;
                }
            `;
            document.head.appendChild(style);
        } else {
            mapContainer.innerHTML = '<div class="placeholder-map">使用 AI 生成同義詞與反義詞後，詞彙關聯圖將在這裡顯示</div>';
        }
    }
}

/**
 * 保存聯想內容
 */
async function saveAssociation() {
    console.log('保存聯想內容');
    
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        console.error('無法保存聯想：無效的卡片索引');
        alert('無法保存聯想：請先選擇單字');
        return;
    }
    
    const card = cards[currentCardIndex];
    if (card.id === 0 || card.word === '沒有單字') {
        console.error('無法保存聯想：無效的單字');
        alert('無法保存聯想：請先添加單字');
        return;
    }
    
    const assocInput = document.getElementById('assocInput');
    if (!assocInput) {
        console.error('無法保存聯想：找不到聯想輸入框');
        alert('保存失敗：找不到聯想輸入框');
        return;
    }
    
    console.log('保存聯想:', assocInput.value);
    
    // 更新當前卡片數據
    card.associations = assocInput.value;
    
    try {
        // 1. 保存到資料庫
        if (window.db && typeof window.db.updateWord === 'function') {
            // 首先獲取完整的單字數據，避免覆蓋其他屬性
            let completeWordData;
            try {
                completeWordData = await window.db.getWordById(card.id);
                console.log('從資料庫獲取完整單字數據:', completeWordData);
            } catch (getWordError) {
                console.warn('無法從資料庫獲取完整單字數據，將使用當前卡片數據:', getWordError);
                completeWordData = card;
            }
            
            // 準備更新對象 - 只更新 associations 欄位，保留其他欄位不變
            const updatedWord = {
                ...completeWordData,  // 保留所有現有屬性
                id: card.id,
                associations: assocInput.value,
                updatedAt: new Date().toISOString()
            };
            
            // 確保保留基本屬性
            updatedWord.word = updatedWord.word || card.word;
            updatedWord.meaning = updatedWord.meaning || card.meaning;
            updatedWord.partOfSpeech = updatedWord.partOfSpeech || card.partOfSpeech;
            
            console.log('正在更新資料庫中的聯想數據:', updatedWord);
            await window.db.updateWord(updatedWord);
            console.log('資料庫中的聯想數據已更新');
        } else {
            console.warn('資料庫功能不可用，無法更新資料庫');
        }
        
        // 2. 保存到全局數據 (兼容舊的儲存方式)
        if (window.appData && window.appData.vocabulary) {
            const wordId = card.id;
            const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
            
            if (vocabIndex !== -1) {
                console.log(`更新全局數據中 ID 為 ${wordId} 的單字聯想`);
                window.appData.vocabulary[vocabIndex].associations = assocInput.value;
                
                // 儲存到本地儲存
                localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                console.log('數據已保存到本地儲存');
            } else {
                console.warn(`在全局數據中找不到 ID 為 ${wordId} 的單字，跳過本地儲存更新`);
            }
        } else {
            console.warn('全局數據不存在，跳過本地儲存更新');
        }
        
        // 3. 顯示成功訊息
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '已保存 ✓';
            saveBtn.classList.add('saved');
            
            // 3秒後恢復原始文字
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.classList.remove('saved');
            }, 3000);
        }
        
        // 顯示通知
        showNotification('聯想已保存', 'success');
        
    } catch (error) {
        console.error('保存聯想時出錯:', error);
        alert('保存失敗：' + error.message);
    }
}

/**
 * 顯示通知
 * @param {string} message - 通知訊息
 * @param {string} type - 通知類型 (success, error, info)
 */
function showNotification(message, type = 'info') {
    // 檢查是否已有通知元素
    let notification = document.querySelector('.notification');
    
    // 如果沒有，創建一個
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    // 設置通知類型和訊息
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 顯示通知
    notification.style.display = 'block';
    notification.style.opacity = '1';
    
    // 3秒後隱藏
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 3000);
}

/**
 * 檢查用戶造句
 */
async function checkSentence() {
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        return;
    }
    
    const sentenceInput = document.getElementById('sentenceInput');
    const sentenceFeedback = document.getElementById('sentenceFeedback');
    
    if (!sentenceInput || !sentenceFeedback) return;
    
    const sentence = sentenceInput.value.trim();
    const currentWord = cards[currentCardIndex].word.toLowerCase();
    
    // 基本檢查
    if (sentence === '') {
        sentenceFeedback.textContent = '請輸入一個句子';
        sentenceFeedback.className = 'feedback error';
        return;
    } else if (!sentence.toLowerCase().includes(currentWord.toLowerCase())) {
        sentenceFeedback.textContent = `您的句子需要包含單字 "${cards[currentCardIndex].word}"`;
        sentenceFeedback.className = 'feedback error';
        return;
    } else if (sentence.split(' ').length < 3) {
        sentenceFeedback.textContent = '請輸入一個完整的句子';
        sentenceFeedback.className = 'feedback error';
        return;
    }
    
    // 顯示加載中
    sentenceFeedback.textContent = '正在評估您的句子...';
    sentenceFeedback.className = 'feedback loading';
    
    try {
        // 使用 Gemini API 評估句子
        const feedback = await evaluateSentenceWithGemini(sentence, cards[currentCardIndex]);
        
        if (feedback) {
            sentenceFeedback.innerHTML = feedback;
            sentenceFeedback.className = 'feedback success';
    } else {
            // 如果 API 調用失敗，使用基本反饋
        sentenceFeedback.textContent = '很好！您的句子使用了正確的單字。';
        sentenceFeedback.className = 'feedback success';
        }
    } catch (error) {
        console.error('評估句子時出錯:', error);
        sentenceFeedback.textContent = '很好！您的句子使用了正確的單字。';
        sentenceFeedback.className = 'feedback success';
    }
}

/**
 * 使用 Google Gemini API 評估用戶造句
 * @param {string} sentence - 用戶輸入的句子
 * @param {Object} card - 當前卡片
 * @returns {Promise<string>} - 評估反饋
 */
async function evaluateSentenceWithGemini(sentence, card) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = getGeminiApiKey();
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 評估句子');
        return null;
    }
    
    const word = card.word;
    const meaning = card.meaning || '';
    const partOfSpeech = card.partOfSpeech || '';
    
    // 構建提示詞
    const prompt = `
    請評估以下英文句子的正確性和自然度，並提供改進建議。
    
    單字資訊：
    - 單字：${word}
    - 詞性：${partOfSpeech}
    - 中文意思：${meaning}
    
    用戶造的句子：
    "${sentence}"
    
    請評估以下幾點：
    1. 句子是否正確使用了單字 "${word}"
    2. 單字的詞性使用是否正確
    3. 句子的語法是否正確
    4. 句子是否自然流暢
    5. 如有需要，提供改進建議
    
    請用中文回答，以友善、鼓勵的語氣給出評價。回答格式如下：
    
    評分：[1-5顆星，5顆星為最佳]
    評價：[簡短評價]
    改進建議：[如有需要，提供1-2個改進建議]
    
    請確保回答簡潔明瞭，總字數不超過100字。
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
        console.log('Gemini API 回應:', data);
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            const text = data.candidates[0].content.parts[0].text;
            
            // 格式化回應
            let formattedFeedback = text
                .replace(/評分：/g, '<strong>評分：</strong>')
                .replace(/評價：/g, '<strong>評價：</strong>')
                .replace(/改進建議：/g, '<strong>改進建議：</strong>')
                .replace(/\n/g, '<br>');
            
            return formattedFeedback;
        }
        
        return null;
    } catch (error) {
        console.error('調用 Gemini API 評估句子時出錯:', error);
        return null;
    }
}

// 從 localStorage 獲取 Gemini API 密鑰
function getGeminiApiKey() {
    return localStorage.getItem('geminiApiKey') || '';
}

// 關閉面板的事件處理函數
function closePanelHandler(e) {
    console.log('點擊關閉面板按鈕');
    e.stopPropagation();
    e.preventDefault();
    
    const panel = this.closest('.learning-panel');
    if (panel) {
        console.log(`關閉面板: ${panel.id}`);
        panel.classList.remove('active');
    } else {
        console.error('找不到要關閉的面板');
    }
}

/**
 * 翻譯詞性到中文
 * @param {string} partOfSpeech - 英文詞性
 * @returns {string} - 中文詞性
 */
function translatePartOfSpeech(partOfSpeech) {
    const translations = {
        'noun': '名詞',
        'verb': '動詞',
        'adjective': '形容詞',
        'adverb': '副詞',
        'preposition': '介系詞',
        'conjunction': '連接詞',
        'interjection': '感嘆詞',
        'pronoun': '代名詞'
    };
    
    return translations[partOfSpeech] || partOfSpeech;
}

/**
 * 更新建議聯想按鈕
 * @param {Object} card - 當前卡片
 * @param {boolean} forceRegenerate - 是否強制重新生成聯想，即使單字已有儲存的聯想
 */
async function updateSuggestionButtons(card, forceRegenerate = false) {
    console.log('更新建議聯想按鈕，單字:', card.word, '強制重新生成:', forceRegenerate);
    
    const suggestionsContainer = document.querySelector('.suggestions');
    if (!suggestionsContainer) {
        console.error('找不到建議聯想容器');
        return;
    }
    
    // 如果單字已有聯想且未設置強制重新生成，則提前返回
    if (card.associations && card.associations.trim() && !forceRegenerate) {
        console.log('單字已有儲存的聯想且未要求重新生成，提前返回');
        return;
    }
    
    // 如果沒有卡片數據或是空白單字，顯示相應提示
    if (!card || !card.word || card.word === '沒有單字') {
        suggestionsContainer.innerHTML = '';
        const noSuggestion = document.createElement('p');
        noSuggestion.textContent = '請先添加單字';
        noSuggestion.className = 'no-suggestion';
        suggestionsContainer.appendChild(noSuggestion);
        return;
    }
    
    // 顯示加載中提示
    suggestionsContainer.innerHTML = '<div class="loading-suggestion">正在生成聯想建議...</div>';
    
    try {
        // 生成建議聯想
        const suggestions = await generateSuggestions(card);
        console.log(`為單字 "${card.word}" 生成的建議聯想:`, suggestions);
        
        // 清空加載提示
        suggestionsContainer.innerHTML = '';
        
        // 為每個建議創建按鈕
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(suggestion => {
                const btn = document.createElement('button');
                btn.className = 'suggestion-btn';
                btn.textContent = suggestion;
                
                // 添加點擊事件
                btn.addEventListener('click', () => {
                    console.log('點擊建議聯想按鈕:', suggestion);
                    const assocInput = document.getElementById('assocInput');
                    if (!assocInput) {
                        console.error('找不到聯想輸入框');
                        return;
                    }
                    
                    // 如果輸入框已有內容，添加換行
                    if (assocInput.value && !assocInput.value.endsWith('\n')) {
                        assocInput.value += '\n';
                    }
                    
                    // 添加建議到輸入框
                    assocInput.value += suggestion;
                });
                
                // 添加按鈕到容器
                suggestionsContainer.appendChild(btn);
            });
        } else {
            // 如果沒有生成建議，顯示錯誤信息
            const errorElement = document.createElement('p');
            errorElement.textContent = '無法生成建議，請稍後再試';
            errorElement.className = 'error';
            suggestionsContainer.appendChild(errorElement);
        }
    } catch (error) {
        console.error('生成聯想建議時出錯:', error);
        suggestionsContainer.innerHTML = `
            <div class="loading-suggestion error">
                生成聯想建議時出錯: ${error.message}
                <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
            </div>
        `;
    }
}

/**
 * 根據單字生成建議聯想
 * @param {Object} card - 當前卡片
 * @returns {Array} - 建議聯想數組
 */
async function generateSuggestions(card) {
    const word = card.word;
    
    console.log('為單字生成聯想建議:', word);
    
    // 如果是空單字或"沒有單字"，返回空數組
    if (!word || word === '沒有單字') {
        return [];
    }
    
    // 嘗試使用 Google Gemini API 生成建議聯想
    try {
        const geminiSuggestions = await getGeminiSuggestions(card);
        if (geminiSuggestions && geminiSuggestions.length > 0) {
            console.log('成功從 Gemini API 獲取建議');
            return geminiSuggestions;
        }
    } catch (error) {
        console.error('使用 Gemini API 生成聯想時出錯:', error);
        // 如果 API 調用失敗，使用備用方法生成聯想
    }
    
    console.log('使用備用方法生成聯想建議');
    
    // 備用方法：根據單字特性生成聯想
    const suggestions = [];
    
    // 根據單字特定情況生成建議
    if (word.toLowerCase() === 'apple') {
        suggestions.push('紅色的水果');
        suggestions.push('像「A」一樣是單字的開頭');
        suggestions.push('含有「p」的雙重發音');
        suggestions.push('想像一個蘋果樹');
        suggestions.push('蘋果咬一口的聲音「喀滋」');
        suggestions.push('蘋果公司的標誌');
        return suggestions;
    } else if (word.toLowerCase() === 'example') {
        suggestions.push('舉例說明某事的情況');
        suggestions.push('「ex-」前綴表示「出來」');
        suggestions.push('想像一個老師舉例的場景');
        suggestions.push('將「範例」視覺化');
        suggestions.push('連結到「sample」這個相似詞');
        return suggestions;
    }
    
    // 添加基本聯想
    if (card.phonetic) {
        suggestions.push(`發音 "${card.phonetic}" 讓我想到...`);
        suggestions.push(`發音與哪個熟悉的單字相似`);
    }
    
    // 根據詞性添加聯想
    if (card.partOfSpeech === 'n.' || card.partOfSpeech === 'noun') {
        suggestions.push(`想像一個具體的 ${word}`);
        suggestions.push(`${word} 的外觀特徵`);
        suggestions.push(`${word} 讓我想到的場景`);
        suggestions.push(`${word} 的顏色或形狀`);
        suggestions.push(`${word} 的用途或功能`);
    } else if (card.partOfSpeech === 'v.' || card.partOfSpeech === 'verb') {
        suggestions.push(`做 ${word} 的動作`);
        suggestions.push(`${word} 的過程或結果`);
        suggestions.push(`想像自己正在 ${word}`);
        suggestions.push(`${word} 時的感覺或聲音`);
        suggestions.push(`${word} 的具體步驟`);
    } else if (card.partOfSpeech === 'adj.' || card.partOfSpeech === 'adjective') {
        suggestions.push(`${word} 的感覺或狀態`);
        suggestions.push(`形容 ${word} 的事物或人`);
        suggestions.push(`${word} 的程度或強度`);
        suggestions.push(`${word} 的反義詞是什麼`);
        suggestions.push(`${word} 的具體例子`);
    } else if (card.partOfSpeech === 'adv.' || card.partOfSpeech === 'adverb') {
        suggestions.push(`${word} 地做某事的方式`);
        suggestions.push(`${word} 的程度或頻率`);
        suggestions.push(`${word} 的時間或地點特性`);
        suggestions.push(`${word} 與其他副詞的區別`);
    } else {
        // 如果沒有詞性或詞性不明確，添加通用聯想
        suggestions.push(`${word} 讓我想到的畫面`);
        suggestions.push(`${word} 的特點或特性`);
        suggestions.push(`如何記住 ${word} 的拼寫`);
        suggestions.push(`${word} 在日常生活中的應用`);
    }
    
    // 添加字母相關聯想
    if (word.length > 0) {
        suggestions.push(`單字 ${word} 的拼寫特點`);
        suggestions.push(`首字母 "${word[0]}" 的形狀或發音`);
        if (word.length > 3) {
            suggestions.push(`記住 ${word} 的拼寫順序`);
        }
    }
    
    // 添加意思相關聯想
    if (card.meaning) {
        suggestions.push(`中文意思「${card.meaning}」的畫面`);
        suggestions.push(`將「${card.meaning}」與 ${word} 連結`);
        suggestions.push(`用「${card.meaning}」造一個情境`);
    }
    
    // 添加例句相關聯想
    if (card.examples && card.examples.length > 0) {
        suggestions.push(`從例句「${card.examples[0]}」想像場景`);
        suggestions.push(`在例句中使用 ${word} 的情境`);
    }
    
    // 添加記憶技巧
    suggestions.push(`將 ${word} 分解成更小的部分`);
    suggestions.push(`用諧音或相似發音來記憶`);
    suggestions.push(`創造一個與 ${word} 相關的故事`);
    
    // 隨機選擇最多8個建議，避免過多
    if (suggestions.length > 8) {
        const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 8);
    }
    
    return suggestions;
}

/**
 * 使用 Google Gemini API 生成建議聯想
 * @param {Object} card - 當前卡片
 * @returns {Promise<Array>} - 建議聯想數組
 */
async function getGeminiSuggestions(card) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = getGeminiApiKey();
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 生成聯想');
        return null;
    }
    
    const word = card.word;
    const meaning = card.meaning || '';
    const partOfSpeech = card.partOfSpeech || '';
    const phonetic = card.phonetic || '';
    const examples = card.examples && card.examples.length > 0 ? card.examples[0] : '';
    
    // 構建提示詞
    const prompt = `
    請為英文單字 "${word}" 生成 6-8 個有助於記憶的聯想提示。
    
    單字資訊：
    - 詞性：${partOfSpeech}
    - 發音：${phonetic}
    - 中文意思：${meaning}
    - 例句：${examples}
    
    請生成創意且多樣化的聯想，包括：
    1. 發音聯想
    2. 拼寫特點
    3. 視覺化記憶方法
    4. 與中文意思的連結
    5. 與例句相關的場景
    6. 其他有助記憶的技巧
    
    請直接列出聯想提示，每行一個，不要有編號或其他標記。每個聯想控制在 20 個中文字以內。
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
        console.log('Gemini API 回應:', data);
        
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
            
            const text = data.candidates[0].content.parts[0].text;
            // 將回應文本按行分割，過濾空行
            const lines = text.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('-') && !line.match(/^\d+\./));
            
            console.log('從 Gemini 獲取的聯想建議:', lines);
            return lines.slice(0, 8); // 最多返回8個建議
        }
        
        return null;
    } catch (error) {
        console.error('調用 Gemini API 時出錯:', error);
        return null;
    }
}

/**
 * 使用 Google Gemini API 生成 AI 造句
 */
async function generateAISentences() {
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        return;
    }
    
    const aiSentenceExamples = document.getElementById('aiSentenceExamples');
    if (!aiSentenceExamples) {
        console.error('找不到 AI 造句例句容器');
        return;
    }
    
    // 檢查 API 密鑰
    const API_KEY = getGeminiApiKey();
    if (!API_KEY) {
        aiSentenceExamples.innerHTML = '<div class="loading-suggestion error">請先在首頁設置 Google Gemini API 密鑰</div>';
        aiSentenceExamples.classList.add('active');
        return;
    }
    
    // 顯示加載中
    aiSentenceExamples.innerHTML = '<div class="loading-suggestion">正在生成例句...</div>';
    aiSentenceExamples.classList.add('active');
    
    try {
        console.log('開始為單字生成 AI 造句:', cards[currentCardIndex].word);
        
        // 使用 Gemini API 生成例句
        const sentences = await getAISentences(cards[currentCardIndex]);
        
        if (sentences && sentences.length > 0) {
            console.log('成功獲取例句，數量:', sentences.length);
            
            // 清空加載提示
            aiSentenceExamples.innerHTML = '';
            
            // 添加標題
            const title = document.createElement('h5');
            title.innerHTML = '<i class="fas fa-robot"></i> AI 生成的例句：';
            aiSentenceExamples.appendChild(title);
            
            // 添加例句
            sentences.forEach(sentence => {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'example-sentence';
                exampleDiv.textContent = sentence;
                
                // 添加"使用"按鈕
                const useBtn = document.createElement('button');
                useBtn.className = 'use-btn';
                useBtn.textContent = '使用';
                useBtn.addEventListener('click', () => {
                    const sentenceInput = document.getElementById('sentenceInput');
                    if (sentenceInput) {
                        sentenceInput.value = sentence;
                        // 聚焦輸入框
                        sentenceInput.focus();
                    }
                });
                
                exampleDiv.appendChild(useBtn);
                aiSentenceExamples.appendChild(exampleDiv);
            });
        } else {
            console.warn('未能獲取例句');
            aiSentenceExamples.innerHTML = `
                <div class="loading-suggestion error">
                    無法生成例句，可能的原因：
                    <ul>
                        <li>API 密鑰無效或已過期</li>
                        <li>API 請求超出限制</li>
                        <li>網絡連接問題</li>
                    </ul>
                    <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('生成 AI 造句時出錯:', error);
        aiSentenceExamples.innerHTML = `
            <div class="loading-suggestion error">
                生成例句時出錯: ${error.message}
                <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
            </div>
        `;
    }
}

/**
 * 使用 Google Gemini API 獲取 AI 造句
 * @param {Object} card - 當前卡片
 * @returns {Promise<Array>} - 例句數組
 */
async function getAISentences(card) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = getGeminiApiKey();
    
    console.log('API 密鑰狀態:', API_KEY ? '已設置' : '未設置');
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 生成例句');
        return null;
    }
    
    const word = card.word;
    const meaning = card.meaning || '';
    const partOfSpeech = card.partOfSpeech || '';
    
    console.log('準備為單字生成例句:', word, '詞性:', partOfSpeech, '意思:', meaning);
    
    // 構建提示詞
    const prompt = `
    請為英文單字 "${word}" 生成 5 個不同難度和風格的例句。
    
    單字資訊：
    - 詞性：${partOfSpeech}
    - 中文意思：${meaning}
    
    請生成以下類型的例句：
    1. 一個簡單的基礎例句，適合初學者
    2. 一個中等難度的例句，包含一些常見搭配
    3. 一個高級例句，使用更複雜的句型
    4. 一個日常對話中的例句
    5. 一個正式或學術場合的例句
    
    請確保每個例句都正確使用了單字 "${word}"，並且句子自然流暢。
    請直接列出例句，每行一個，不要有編號或其他標記。
    `;
    
    console.log('發送到 Gemini API 的提示詞:', prompt);
    
    try {
        console.log('開始發送 API 請求...');
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
        
        console.log('API 回應狀態:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤詳情:', errorText);
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API 完整回應:', data);
        
        // 檢查回應結構
        if (!data.candidates || data.candidates.length === 0) {
            console.error('API 回應中沒有 candidates 數組或為空');
            return null;
        }
        
        if (!data.candidates[0].content) {
            console.error('API 回應中沒有 content 對象');
            return null;
        }
        
        if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            console.error('API 回應中沒有 parts 數組或為空');
            return null;
        }
        
        const text = data.candidates[0].content.parts[0].text;
        if (!text) {
            console.error('API 回應中沒有文本內容');
            return null;
        }
        
        console.log('從 API 獲取的原始文本:', text);
        
        // 將回應文本按行分割，過濾空行和編號行
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.match(/^\d+\./) && !line.startsWith('-'));
        
        console.log('處理後的例句數組:', lines);
        
        if (lines.length === 0) {
            console.warn('處理後的例句數組為空');
            return null;
        }
        
        return lines;
    } catch (error) {
        console.error('調用 Gemini API 時出錯:', error);
        return null;
    }
}

/**
 * 使用 Google Gemini API 生成單字的常見用法
 * @param {Object} card - 當前卡片
 */
async function generateAIContexts(card) {
    if (!card || !card.word) {
        console.error('無法生成常見用法：無效的卡片數據');
        return;
    }
    
    const contextSection = document.querySelector('.context-section');
    if (!contextSection) {
        console.error('找不到上下文容器');
        return;
    }
    
    // 檢查 API 密鑰
    const API_KEY = getGeminiApiKey();
    if (!API_KEY) {
        contextSection.innerHTML = '<div class="loading-suggestion error">請先在首頁設置 Google Gemini API 密鑰</div>';
        return;
    }
    
    // 顯示加載中
    contextSection.innerHTML = '<div class="loading-suggestion">正在生成常見用法...</div>';
    
    try {
        console.log('開始為單字生成常見用法:', card.word);
        
        // 使用 Gemini API 生成常見用法
        const contexts = await getAIContexts(card);
        
        if (contexts && contexts.length > 0) {
            console.log('成功獲取常見用法，數量:', contexts.length);
            
            // 清空加載提示
            contextSection.innerHTML = '';
            
            // 添加標題
            const title = document.createElement('h4');
            title.innerHTML = '常見用法：';
            contextSection.appendChild(title);
            
            // 添加常見用法
            contexts.forEach(context => {
                const contextItem = document.createElement('div');
                contextItem.className = 'context-item';
                
                const phrase = document.createElement('p');
                phrase.innerHTML = `<strong>${context.phrase}</strong> - ${context.meaning}`;
                
                const example = document.createElement('p');
                example.className = 'example';
                example.textContent = context.example;
                
                contextItem.appendChild(phrase);
                contextItem.appendChild(example);
                contextSection.appendChild(contextItem);
            });
            
            // 添加重新產生按鈕
            const regenerateContainer = document.createElement('div');
            regenerateContainer.className = 'regenerate-container';
            
            const regenerateBtn = document.createElement('button');
            regenerateBtn.className = 'regenerate-btn';
            regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新產生常見用法';
            regenerateBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateAIContexts(card);
            });
            
            regenerateContainer.appendChild(regenerateBtn);
            contextSection.appendChild(regenerateContainer);
            
            // 更新卡片數據
            card.contexts = contexts;
            
            // 確保在 cards 數組中也更新對應的單字
            if (cards && currentCardIndex >= 0 && currentCardIndex < cards.length) {
                console.log(`更新當前卡片索引 ${currentCardIndex} 的 contexts 欄位`);
                cards[currentCardIndex].contexts = [...contexts]; // 使用展開運算符創建深拷貝
            }
            
            // 使用 saveToDatabase 函數保存到數據庫
            console.log(`直接保存到數據庫 - 單字ID: ${card.id}`);
            await saveToDatabase(card.id, contexts);
            
            // 更新全局數據和本地儲存
            if (window.appData && window.appData.vocabulary) {
                const wordId = card.id;
                const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
                
                if (vocabIndex !== -1) {
                    console.log(`更新全局數據中 ID 為 ${wordId} 的單字常見用法`);
                    window.appData.vocabulary[vocabIndex].contexts = contexts;
                    
                    try {
                        localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                        console.log('數據已直接保存到本地儲存');
                        showNotification('常見用法已永久保存', 'success');
                    } catch (error) {
                        console.error('保存到本地儲存時出錯:', error);
                        showNotification('保存失敗：' + error.message, 'error');
                    }
                }
            }
        } else {
            console.warn('未能獲取常見用法');
            contextSection.innerHTML = `
                <h4>常見用法：</h4>
                <div class="loading-suggestion error">
                    無法生成常見用法，可能的原因：
                    <ul>
                        <li>API 密鑰無效或已過期</li>
                        <li>API 請求超出限制</li>
                        <li>網絡連接問題</li>
                    </ul>
                    <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
                </div>
                <button class="ai-context-btn"><i class="fas fa-robot"></i> 重試</button>
            `;
            
            // 為重試按鈕添加事件監聽器
            const retryBtn = contextSection.querySelector('.ai-context-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateAIContexts(card);
                });
            }
        }
    } catch (error) {
        console.error('生成常見用法時出錯:', error);
        
        // 檢查是否是配額耗盡錯誤
        const isQuotaError = error.message && (
            error.message.includes('429') || 
            error.message.includes('RESOURCE_EXHAUSTED') || 
            error.message.toLowerCase().includes('quota')
        );
        
        if (isQuotaError) {
            contextSection.innerHTML = `
                <h4>常見用法：</h4>
                <div class="loading-suggestion error">
                    <strong>API 配額已用盡</strong>
                    <p>您的 Google Gemini API 免費配額已用盡。可能的解決方法：</p>
                    <ul>
                        <li>等待 24 小時後再試（免費配額每天重置）</li>
                        <li>使用不同的 API 密鑰</li>
                        <li>升級到付費版 Google AI Studio</li>
                    </ul>
                    <p>詳情請訪問 <a href="https://ai.google.dev/pricing" target="_blank">Google AI Studio 定價頁面</a></p>
                </div>
                <button class="ai-context-btn"><i class="fas fa-robot"></i> 使用備用方法</button>
            `;
            
            // 為備用方法按鈕添加事件監聽器
            const fallbackBtn = contextSection.querySelector('.ai-context-btn');
            if (fallbackBtn) {
                fallbackBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateFallbackContexts(card);
                });
            }
        } else {
            contextSection.innerHTML = `
                <h4>常見用法：</h4>
                <div class="loading-suggestion error">
                    生成常見用法時出錯: ${error.message}
                    <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
                </div>
                <button class="ai-context-btn"><i class="fas fa-robot"></i> 重試</button>
            `;
            
            // 為重試按鈕添加事件監聽器
            const retryBtn = contextSection.querySelector('.ai-context-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateAIContexts(card);
                });
            }
        }
    }
}

/**
 * 使用 Google Gemini API 獲取單字的常見用法
 * @param {Object} card - 當前卡片
 * @returns {Promise<Array>} - 常見用法數組
 */
async function getAIContexts(card) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = getGeminiApiKey();
    
    console.log('API 密鑰狀態:', API_KEY ? '已設置' : '未設置');
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 生成常見用法');
        return null;
    }
    
    const word = card.word;
    const meaning = card.meaning || '';
    const partOfSpeech = card.partOfSpeech || '';
    
    console.log('準備為單字生成常見用法:', word, '詞性:', partOfSpeech, '意思:', meaning);
    
    // 構建提示詞
    const prompt = `
    請為英文單字 "${word}" 生成 5 個常見用法或搭配。
    
    單字資訊：
    - 詞性：${partOfSpeech}
    - 中文意思：${meaning}
    
    請生成以下內容：
    1. 常見搭配或短語
    2. 慣用語或固定表達
    3. 介詞搭配（如果適用）
    4. 動詞或名詞搭配（如果適用）
    5. 其他重要用法
    
    對於每個用法，請提供：
    - 英文短語或搭配
    - 中文意思
    - 一個使用該搭配的例句
    
    請以 JSON 格式回答，格式如下：
    [
      {
        "phrase": "英文短語或搭配",
        "meaning": "中文意思",
        "example": "使用該搭配的例句"
      },
      ...
    ]
    
    請確保回答是有效的 JSON 格式，不要添加其他文字。
    `;
    
    console.log('發送到 Gemini API 的提示詞:', prompt);
    
    try {
        console.log('開始發送 API 請求...');
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
        
        console.log('API 回應狀態:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤詳情:', errorText);
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API 完整回應:', data);
        
        // 檢查回應結構
        if (!data.candidates || data.candidates.length === 0) {
            console.error('API 回應中沒有 candidates 數組或為空');
            return null;
        }
        
        if (!data.candidates[0].content) {
            console.error('API 回應中沒有 content 對象');
            return null;
        }
        
        if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            console.error('API 回應中沒有 parts 數組或為空');
            return null;
        }
        
        const text = data.candidates[0].content.parts[0].text;
        if (!text) {
            console.error('API 回應中沒有文本內容');
            return null;
        }
        
        console.log('從 API 獲取的原始文本:', text);
        
        // 嘗試解析 JSON
        try {
            // 提取 JSON 部分（可能有額外文本）
            const jsonMatch = text.match(/\[\s*\{.*\}\s*\]/s);
            if (jsonMatch) {
                const jsonText = jsonMatch[0];
                const contexts = JSON.parse(jsonText);
                console.log('解析後的常見用法:', contexts);
                return contexts;
            } else {
                console.error('無法從回應中提取 JSON');
                return null;
            }
        } catch (parseError) {
            console.error('解析 JSON 時出錯:', parseError);
            
            // 嘗試手動解析
            try {
                // 使用正則表達式提取所有 phrase, meaning, example 三元組
                const phraseRegex = /"phrase"\s*:\s*"([^"]*)"/g;
                const meaningRegex = /"meaning"\s*:\s*"([^"]*)"/g;
                const exampleRegex = /"example"\s*:\s*"([^"]*)"/g;
                
                const phrases = [];
                const meanings = [];
                const examples = [];
                
                let match;
                while ((match = phraseRegex.exec(text)) !== null) {
                    phrases.push(match[1]);
                }
                
                while ((match = meaningRegex.exec(text)) !== null) {
                    meanings.push(match[1]);
                }
                
                while ((match = exampleRegex.exec(text)) !== null) {
                    examples.push(match[1]);
                }
                
                // 確保三個數組長度相同
                const minLength = Math.min(phrases.length, meanings.length, examples.length);
                
                if (minLength > 0) {
                    const contexts = [];
                    for (let i = 0; i < minLength; i++) {
                        contexts.push({
                            phrase: phrases[i],
                            meaning: meanings[i],
                            example: examples[i]
                        });
                    }
                    
                    console.log('手動解析後的常見用法:', contexts);
                    return contexts;
                }
            } catch (manualParseError) {
                console.error('手動解析失敗:', manualParseError);
            }
            
            return null;
        }
    } catch (error) {
        console.error('調用 Gemini API 時出錯:', error);
        return null;
    }
} 

/**
 * 使用本地方法生成單字的常見用法（不依賴 API）
 * @param {Object} card - 當前卡片
 */
async function generateFallbackContexts(card) {
    if (!card || !card.word) {
        console.error('無法生成常見用法：無效的卡片數據');
        return;
    }
    
    const contextSection = document.querySelector('.context-section');
    if (!contextSection) {
        console.error('找不到上下文容器');
        return;
    }
    
    // 顯示加載中
    contextSection.innerHTML = '<div class="loading-suggestion">正在生成常見用法...</div>';
    
    console.log('使用備用方法為單字生成常見用法:', card.word);
    
    // 獲取單字信息
    const word = card.word.toLowerCase();
    const partOfSpeech = card.partOfSpeech || '';
    
    // 預設常見用法
    let contexts = [];
    
    // 根據單字提供特定的常見用法
    if (word === 'apple') {
        contexts = [
            {
                phrase: "apple pie",
                meaning: "蘋果派",
                example: "My grandmother makes the best apple pie in town."
            },
            {
                phrase: "the apple of one's eye",
                meaning: "心肝寶貝；摯愛之人",
                example: "His daughter is the apple of his eye."
            },
            {
                phrase: "as American as apple pie",
                meaning: "非常美國化的；典型美國風格的",
                example: "Baseball is as American as apple pie."
            },
            {
                phrase: "a bad apple",
                meaning: "害群之馬；壞分子",
                example: "One bad apple can spoil the whole barrel."
            },
            {
                phrase: "compare apples and oranges",
                meaning: "比較風馬牛不相及的事物",
                example: "Comparing these two business models is like comparing apples and oranges."
            }
        ];
    } else if (word === 'book') {
        contexts = [
            {
                phrase: "book a ticket",
                meaning: "預訂票",
                example: "I need to book a ticket for my flight to Tokyo."
            },
            {
                phrase: "by the book",
                meaning: "按照規則；循規蹈矩",
                example: "The new manager does everything by the book."
            },
            {
                phrase: "an open book",
                meaning: "坦率的人；易於理解的事物",
                example: "John is an open book; he never hides his feelings."
            },
            {
                phrase: "throw the book at someone",
                meaning: "嚴懲某人；對某人施以最嚴厲的處罰",
                example: "The judge threw the book at him for his repeated offenses."
            },
            {
                phrase: "in someone's good/bad books",
                meaning: "受到某人的喜愛/厭惡",
                example: "After helping her with the project, I'm in her good books now."
            }
        ];
    } else if (word === 'time') {
        contexts = [
            {
                phrase: "from time to time",
                meaning: "不時地；偶爾",
                example: "I still meet my high school friends from time to time."
            },
            {
                phrase: "in the nick of time",
                meaning: "及時；剛剛好趕上",
                example: "The firefighters arrived in the nick of time to save the family."
            },
            {
                phrase: "kill time",
                meaning: "消磨時間",
                example: "I played games on my phone to kill time while waiting for the train."
            },
            {
                phrase: "time flies",
                meaning: "光陰似箭；時間過得很快",
                example: "Time flies when you're having fun."
            },
            {
                phrase: "take your time",
                meaning: "慢慢來；不要著急",
                example: "Don't rush, take your time to make the right decision."
            }
        ];
    } else if (word === 'water') {
        contexts = [
            {
                phrase: "water down",
                meaning: "沖淡；削弱",
                example: "The company watered down the original proposal to make it more acceptable."
            },
            {
                phrase: "like water off a duck's back",
                meaning: "毫不在意；不受影響",
                example: "Criticism is like water off a duck's back to him."
            },
            {
                phrase: "water under the bridge",
                meaning: "過去的事；已經無法改變的事",
                example: "Our argument last week is water under the bridge now."
            },
            {
                phrase: "keep one's head above water",
                meaning: "勉強維持；度過難關",
                example: "After losing his job, he's struggling to keep his head above water."
            },
            {
                phrase: "test the waters",
                meaning: "試探；嘗試",
                example: "Before launching the product nationwide, they decided to test the waters in a few cities."
            }
        ];
    } else {
        // 根據詞性生成通用常見用法
        if (partOfSpeech === 'n.' || partOfSpeech === 'noun') {
            contexts = generateNounContexts(word);
        } else if (partOfSpeech === 'v.' || partOfSpeech === 'verb') {
            contexts = generateVerbContexts(word);
        } else if (partOfSpeech === 'adj.' || partOfSpeech === 'adjective') {
            contexts = generateAdjectiveContexts(word);
        } else {
            contexts = generateGenericContexts(word);
        }
    }
    
    // 顯示結果
    if (contexts && contexts.length > 0) {
        console.log('成功生成常見用法，數量:', contexts.length);
        
        // 清空加載提示
        contextSection.innerHTML = '';
        
        // 添加標題
        const title = document.createElement('h4');
        title.innerHTML = '常見用法：';
        contextSection.appendChild(title);
        
        // 添加常見用法
        contexts.forEach(context => {
            const contextItem = document.createElement('div');
            contextItem.className = 'context-item';
            
            const phrase = document.createElement('p');
            phrase.innerHTML = `<strong>${context.phrase}</strong> - ${context.meaning}`;
            
            const example = document.createElement('p');
            example.className = 'example';
            example.textContent = context.example;
            
            contextItem.appendChild(phrase);
            contextItem.appendChild(example);
            contextSection.appendChild(contextItem);
        });
        
        // 添加說明
        const noteElem = document.createElement('p');
        noteElem.className = 'note';
        noteElem.innerHTML = '<small>* 這些是系統生成的常見用法，可能不夠全面。API 配額恢復後可再次嘗試使用 AI 生成。</small>';
        contextSection.appendChild(noteElem);
        
        // 更新卡片數據
        card.contexts = contexts;
        
        // 保存到全局數據
        if (window.appData && window.appData.vocabulary) {
            const wordId = card.id;
            const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
            
            if (vocabIndex !== -1) {
                console.log(`更新全局數據中 ID 為 ${wordId} 的單字常見用法`);
                window.appData.vocabulary[vocabIndex].contexts = contexts;
                
                try {
                    localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                    console.log('數據已直接保存到本地儲存');
                    
                    // 顯示通知
                    showNotification('常見用法已保存', 'success');
                } catch (error) {
                    console.error('保存到本地儲存時出錯:', error);
                    showNotification('保存失敗：' + error.message, 'error');
                }
            }
        }
    } else {
        console.warn('未能生成常見用法');
        contextSection.innerHTML = `
            <h4>常見用法：</h4>
            <div class="loading-suggestion error">
                無法生成常見用法，請稍後再試。
            </div>
            <button class="ai-context-btn"><i class="fas fa-robot"></i> 重試</button>
        `;
        
        // 為重試按鈕添加事件監聽器
        const retryBtn = contextSection.querySelector('.ai-context-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateFallbackContexts(card);
            });
        }
    }
}

/**
 * 為名詞生成通用常見用法
 * @param {string} word - 單字
 * @returns {Array} - 常見用法數組
 */
function generateNounContexts(word) {
    return [
        {
            phrase: `a/an ${word}`,
            meaning: `一個${word}`,
            example: `She bought a ${word} at the store yesterday.`
        },
        {
            phrase: `${word}s`,
            meaning: `多個${word}`,
            example: `There are many ${word}s in this area.`
        },
        {
            phrase: `have a ${word}`,
            meaning: `擁有一個${word}`,
            example: `I would like to have a ${word} someday.`
        },
        {
            phrase: `use a ${word}`,
            meaning: `使用一個${word}`,
            example: `You should use a ${word} for this task.`
        },
        {
            phrase: `${word}-related`,
            meaning: `與${word}相關的`,
            example: `We discussed several ${word}-related issues during the meeting.`
        }
    ];
}

/**
 * 為動詞生成通用常見用法
 * @param {string} word - 單字
 * @returns {Array} - 常見用法數組
 */
function generateVerbContexts(word) {
    return [
        {
            phrase: `${word} something`,
            meaning: `${word}某物`,
            example: `I need to ${word} something before I leave.`
        },
        {
            phrase: `${word} someone`,
            meaning: `${word}某人`,
            example: `She will ${word} someone to help with the project.`
        },
        {
            phrase: `${word} about`,
            meaning: `關於${word}`,
            example: `Let's ${word} about our plans for the weekend.`
        },
        {
            phrase: `${word} up`,
            meaning: `向上${word}`,
            example: `You should ${word} up if you want to succeed.`
        },
        {
            phrase: `${word} down`,
            meaning: `向下${word}`,
            example: `The company decided to ${word} down production this month.`
        }
    ];
}

/**
 * 為形容詞生成通用常見用法
 * @param {string} word - 單字
 * @returns {Array} - 常見用法數組
 */
function generateAdjectiveContexts(word) {
    return [
        {
            phrase: `very ${word}`,
            meaning: `非常${word}`,
            example: `The movie was very ${word}.`
        },
        {
            phrase: `too ${word}`,
            meaning: `太${word}`,
            example: `The soup is too ${word} for me to eat.`
        },
        {
            phrase: `${word} enough`,
            meaning: `足夠${word}`,
            example: `Is this ${word} enough for your needs?`
        },
        {
            phrase: `more ${word} than`,
            meaning: `比...更${word}`,
            example: `This book is more ${word} than the one I read last week.`
        },
        {
            phrase: `the most ${word}`,
            meaning: `最${word}的`,
            example: `This is the most ${word} experience I've ever had.`
        }
    ];
}

/**
 * 為任何詞性生成通用常見用法
 * @param {string} word - 單字
 * @returns {Array} - 常見用法數組
 */
function generateGenericContexts(word) {
    return [
        {
            phrase: `${word} in context`,
            meaning: `在上下文中的${word}`,
            example: `You need to understand ${word} in context to use it correctly.`
        },
        {
            phrase: `learn about ${word}`,
            meaning: `學習關於${word}`,
            example: `Students will learn about ${word} in today's lesson.`
        },
        {
            phrase: `${word} example`,
            meaning: `${word}的例子`,
            example: `Can you give me a ${word} example?`
        },
        {
            phrase: `${word} meaning`,
            meaning: `${word}的意思`,
            example: `The ${word} meaning can vary depending on how it's used.`
        },
        {
            phrase: `common ${word}`,
            meaning: `常見的${word}`,
            example: `This is a common ${word} that you'll encounter frequently.`
        }
    ];
}

/**
 * 翻轉記憶卡的事件處理函數
 * @param {Event} event - 點擊事件
 */
function flipCard(event) {
    console.log('記憶卡被點擊，準備翻轉');
    const flashcard = event.currentTarget;
    flashcard.classList.toggle('flipped');
    console.log('記憶卡翻轉狀態已切換:', flashcard.classList.contains('flipped'));
}

/**
 * 使用備用方法生成單字的常見用法（當 API 配額用盡時）
 * @param {Object} card - 當前卡片
 */
async function generateFallbackContexts(card) {
    if (!card || !card.word) {
        console.error('無法生成常見用法：無效的卡片數據');
        return;
    }
    
    const contextSection = document.querySelector('.context-section');
    if (!contextSection) {
        console.error('找不到上下文容器');
        return;
    }
    
    // 顯示加載中
    contextSection.innerHTML = '<div class="loading-suggestion">正在生成常見用法（備用方法）...</div>';
    
    let contexts = [];
    const word = card.word.toLowerCase();
    const partOfSpeech = card.partOfSpeech || '';
    
    // 為一些常見單字提供預設的常見用法
    if (word === 'example') {
        contexts = [
            {
                phrase: "for example",
                meaning: "舉例來說",
                example: "Many countries, for example Japan, have aging populations."
            },
            {
                phrase: "set an example",
                meaning: "樹立榜樣",
                example: "Parents should set an example for their children."
            },
            {
                phrase: "lead by example",
                meaning: "以身作則",
                example: "Good managers lead by example, not just by giving orders."
            },
            {
                phrase: "make an example of",
                meaning: "懲戒...以儆效尤",
                example: "The school made an example of him by suspending him for a week."
            },
            {
                phrase: "a prime example",
                meaning: "一個典型的例子",
                example: "This is a prime example of how not to run a business."
            }
        ];
    } else if (word === 'time') {
        contexts = [
            {
                phrase: "on time",
                meaning: "準時",
                example: "The train arrived on time despite the bad weather."
            },
            {
                phrase: "in time",
                meaning: "及時",
                example: "We arrived in time to see the beginning of the movie."
            },
            {
                phrase: "time flies",
                meaning: "光陰似箭",
                example: "Time flies when you're having fun."
            },
            {
                phrase: "take your time",
                meaning: "慢慢來；不急",
                example: "There's no rush, take your time to finish the work."
            },
            {
                phrase: "for the time being",
                meaning: "暫時；目前",
                example: "We'll stay in this apartment for the time being until we find something better."
            }
        ];
    } else if (word === 'water') {
        contexts = [
            {
                phrase: "water down",
                meaning: "沖淡；削弱",
                example: "The company watered down the original proposal to make it more acceptable."
            },
            {
                phrase: "like water off a duck's back",
                meaning: "毫不在意；不受影響",
                example: "Criticism is like water off a duck's back to him."
            },
            {
                phrase: "water under the bridge",
                meaning: "過去的事；已經無法改變的事",
                example: "Our argument last week is water under the bridge now."
            },
            {
                phrase: "keep one's head above water",
                meaning: "勉強維持；度過難關",
                example: "After losing his job, he's struggling to keep his head above water."
            },
            {
                phrase: "test the waters",
                meaning: "試探；嘗試",
                example: "Before launching the product nationwide, they decided to test the waters in a few cities."
            }
        ];
    } else {
        // 根據詞性生成通用常見用法
        if (partOfSpeech === 'n.' || partOfSpeech === 'noun') {
            contexts = generateNounContexts(word);
        } else if (partOfSpeech === 'v.' || partOfSpeech === 'verb') {
            contexts = generateVerbContexts(word);
        } else if (partOfSpeech === 'adj.' || partOfSpeech === 'adjective') {
            contexts = generateAdjectiveContexts(word);
        } else {
            contexts = generateGenericContexts(word);
        }
    }
    
    // 顯示結果
    if (contexts && contexts.length > 0) {
        console.log('成功生成常見用法，數量:', contexts.length);
        
        // 清空加載提示
        contextSection.innerHTML = '';
        
        // 添加標題
        const title = document.createElement('h4');
        title.innerHTML = '常見用法：';
        contextSection.appendChild(title);
        
        // 添加常見用法
        contexts.forEach(context => {
            const contextItem = document.createElement('div');
            contextItem.className = 'context-item';
            
            const phrase = document.createElement('p');
            phrase.innerHTML = `<strong>${context.phrase}</strong> - ${context.meaning}`;
            
            const example = document.createElement('p');
            example.className = 'example';
            example.textContent = context.example;
            
            contextItem.appendChild(phrase);
            contextItem.appendChild(example);
            contextSection.appendChild(contextItem);
        });
        
        // 添加說明
        const noteElem = document.createElement('p');
        noteElem.className = 'note';
        noteElem.innerHTML = '<small>* 這些是系統生成的常見用法，可能不夠全面。API 配額恢復後可再次嘗試使用 AI 生成。</small>';
        contextSection.appendChild(noteElem);
        
        // 添加重新產生按鈕
        const regenerateContainer = document.createElement('div');
        regenerateContainer.className = 'regenerate-container';
        
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'regenerate-btn';
        regenerateBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新產生常見用法';
        regenerateBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await generateAIContexts(card);
        });
        
        regenerateContainer.appendChild(regenerateBtn);
        contextSection.appendChild(regenerateContainer);
        
        // 更新卡片數據
        card.contexts = contexts;
        
        // 保存到全局數據和數據庫
        if (window.appData && window.appData.vocabulary) {
            const wordId = card.id;
            const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
            
            if (vocabIndex !== -1) {
                console.log(`更新全局數據中 ID 為 ${wordId} 的單字常見用法`);
                window.appData.vocabulary[vocabIndex].contexts = contexts;
                
                // 儲存到本地儲存
                try {
                    localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                    console.log('數據已直接保存到本地儲存');
                    
                    // 同時保存到 IndexedDB 數據庫
                    if (window.db && typeof window.db.updateWord === 'function' && typeof window.db.getWordById === 'function') {
                        console.log(`開始保存常見用法到數據庫，單字ID: ${wordId}`);
                        
                        try {
                            // 先檢查數據庫中是否存在此單字
                            console.log(`檢查數據庫中是否存在 ID 為 ${wordId} 的單字...`);
                            const existingWord = await window.db.getWordById(wordId);
                            
                            if (existingWord) {
                                console.log(`已在數據庫中找到 ID 為 ${wordId} 的單字:`, existingWord);
                                console.log(`原有 contexts 欄位存在: ${existingWord.contexts ? '是' : '否'}`);
                                
                                // 準備更新數據
                                console.log(`準備更新常見用法，共 ${contexts.length} 項:`, contexts);
                                
                                // 創建一個新的單字對象，保留所有原有屬性但更新 contexts
                                const updatedWord = { ...existingWord };
                                updatedWord.contexts = contexts;
                                updatedWord.updatedAt = new Date().toISOString();
                                
                                console.log(`即將更新單字數據到數據庫:`, updatedWord);
                                
                                // 保存到數據庫
                                const updateResult = await window.db.updateWord(updatedWord);
                                console.log(`數據庫更新結果:`, updateResult);
                                
                                // 驗證更新是否成功
                                console.log(`驗證數據庫更新結果...`);
                                const verifiedWord = await window.db.getWordById(wordId);
                                
                                if (verifiedWord && verifiedWord.contexts) {
                                    console.log(`驗證成功! 單字 ${verifiedWord.word} 現在包含 ${verifiedWord.contexts.length} 個常見用法`);
                                    console.log(`常見用法內容:`, verifiedWord.contexts);
                                } else {
                                    console.error(`驗證失敗! 無法在數據庫中找到更新後的常見用法`);
                                    if (verifiedWord) {
                                        console.error(`單字存在但 contexts 欄位為空或不存在:`, verifiedWord);
                                    }
                                }
                            } else {
                                console.error(`數據庫中找不到 ID 為 ${wordId} 的單字`);
                            }
                        } catch (dbError) {
                            console.error(`數據庫操作失敗:`, dbError);
                            console.error(`錯誤詳情:`, dbError.stack || dbError.message || dbError);
                            
                            // 嘗試顯示更多詳細信息
                            if (dbError.name) console.error(`錯誤名稱: ${dbError.name}`);
                            if (dbError.code) console.error(`錯誤代碼: ${dbError.code}`);
                        }
                    } else {
                        console.warn(`數據庫操作函數不可用，檢查:`, {
                            'window.db存在': !!window.db,
                            'updateWord函數可用': !!(window.db && typeof window.db.updateWord === 'function'),
                            'getWordById函數可用': !!(window.db && typeof window.db.getWordById === 'function')
                        });
                    }
                    
                    // 顯示通知
                    showNotification('常見用法已永久保存', 'success');
                } catch (error) {
                    console.error('保存到本地儲存時出錯:', error);
                    showNotification('保存失敗：' + error.message, 'error');
                }
            } else {
                console.error(`在全局數據中找不到 ID 為 ${wordId} 的單字，無法更新`);
            }
        } else {
            console.error('全局數據不可用，無法更新常見用法');
        }
    } else {
        console.warn('未能生成常見用法');
        contextSection.innerHTML = `
            <h4>常見用法：</h4>
            <div class="loading-suggestion error">
                無法生成常見用法，請稍後再試。
            </div>
            <button class="ai-context-btn"><i class="fas fa-robot"></i> 重試</button>
        `;
        
        // 為重試按鈕添加事件監聽器
        const retryBtn = contextSection.querySelector('.ai-context-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await generateFallbackContexts(card);
            });
        }
    }
}

// 保存到數據庫
async function saveToDatabase(wordId, data, fieldName = 'contexts') {
    try {
        // 首先獲取完整的單字數據，避免覆蓋其他屬性
        let completeWordData;
        try {
            completeWordData = await window.db.getWordById(wordId);
            console.log(`從資料庫獲取完整單字數據 (ID: ${wordId}):`, completeWordData);
        } catch (getWordError) {
            console.warn('無法從資料庫獲取完整單字數據，將使用當前卡片數據:', getWordError);
            completeWordData = card;
        }
        
        // 準備更新對象 - 只更新指定欄位，保留其他欄位不變
        const updatedWord = {
            ...completeWordData,  // 保留所有現有屬性
            id: wordId,
            updatedAt: new Date().toISOString()
        };
        
        // 根據欄位名稱更新不同的數據
        updatedWord[fieldName] = data;
        
        // 確保保留基本屬性
        updatedWord.word = updatedWord.word || card.word;
        updatedWord.meaning = updatedWord.meaning || card.meaning;
        updatedWord.partOfSpeech = updatedWord.partOfSpeech || card.partOfSpeech;
        
        console.log(`正在更新資料庫中的 ${fieldName} 數據:`, updatedWord);
        await window.db.updateWord(updatedWord);
        console.log(`資料庫中的 ${fieldName} 數據已更新`);
    } catch (error) {
        console.error(`保存 ${fieldName} 到數據庫時出錯:`, error);
        alert('保存失敗：' + error.message);
    }
}

/**
 * 使用 Google Gemini API 生成單字的同義詞和反義詞
 * @param {Object} card - 當前單字卡片
 */
async function generateAISynonyms(card) {
    if (!card || !card.word) {
        console.error('無法生成同義詞與反義詞：無效的卡片數據');
        return;
    }
    
    const synonymsSection = document.querySelector('.synonyms-section');
    const relatedSection = document.querySelector('.related-words-section');
    
    if (!synonymsSection || !relatedSection) {
        console.error('找不到同義詞或相關詞彙容器');
        return;
    }
    
    // 檢查 API 密鑰
    const API_KEY = getGeminiApiKey();
    if (!API_KEY) {
        synonymsSection.innerHTML = '<div class="loading-suggestion error">請先在首頁設置 Google Gemini API 密鑰</div>';
        return;
    }
    
    // 顯示加載中
    synonymsSection.innerHTML = '<div class="loading-suggestion">正在生成同義詞...</div>';
    relatedSection.innerHTML = '<div class="loading-suggestion">正在生成反義詞...</div>';
    
    try {
        console.log('開始為單字生成同義詞與反義詞:', card.word);
        
        // 使用 Gemini API 生成同義詞和反義詞
        const result = await getAISynonyms(card);
        
        if (result && result.synonyms && result.antonyms) {
            console.log('成功獲取同義詞與反義詞：', result);
            
            // 更新卡片數據
            card.synonyms = result.synonyms;
            card.antonyms = result.antonyms;
            
            // 確保在 cards 數組中也更新對應的單字
            if (cards && currentCardIndex >= 0 && currentCardIndex < cards.length) {
                console.log(`更新當前卡片索引 ${currentCardIndex} 的同義詞與反義詞欄位`);
                cards[currentCardIndex].synonyms = [...result.synonyms]; // 使用展開運算符創建深拷貝
                cards[currentCardIndex].antonyms = [...result.antonyms]; // 使用展開運算符創建深拷貝
            }
            
            // 保存到資料庫
            console.log(`保存同義詞到數據庫 - 單字ID: ${card.id}`);
            await saveToDatabase(card.id, result.synonyms, 'synonyms');
            
            console.log(`保存反義詞到數據庫 - 單字ID: ${card.id}`);
            await saveToDatabase(card.id, result.antonyms, 'antonyms');
            
            // 更新全局數據和本地儲存
            if (window.appData && window.appData.vocabulary) {
                const wordId = card.id;
                const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
                
                if (vocabIndex !== -1) {
                    console.log(`更新全局數據中 ID 為 ${wordId} 的單字同義詞與反義詞`);
                    window.appData.vocabulary[vocabIndex].synonyms = result.synonyms;
                    window.appData.vocabulary[vocabIndex].antonyms = result.antonyms;
                    
                    try {
                        localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                        console.log('數據已直接保存到本地儲存');
                        showNotification('同義詞與反義詞已永久保存', 'success');
                    } catch (error) {
                        console.error('保存到本地儲存時出錯:', error);
                        showNotification('保存失敗：' + error.message, 'error');
                    }
                }
            }
            
            // 更新頁面顯示
            updateSynonymsPanel();
        } else {
            console.warn('未能獲取同義詞與反義詞');
            synonymsSection.innerHTML = `
                <h4>同義詞：</h4>
                <div class="loading-suggestion error">
                    無法生成同義詞與反義詞，可能的原因：
                    <ul>
                        <li>API 密鑰無效或已過期</li>
                        <li>API 請求超出限制</li>
                        <li>網絡連接問題</li>
                    </ul>
                    <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
                </div>
                <button class="ai-synonyms-btn"><i class="fas fa-robot"></i> 重試</button>
            `;
            
            // 為重試按鈕添加事件監聽器
            const retryBtn = synonymsSection.querySelector('.ai-synonyms-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateAISynonyms(card);
                });
            }
        }
    } catch (error) {
        console.error('生成同義詞與反義詞時出錯:', error);
        
        // 檢查是否是配額耗盡錯誤
        const isQuotaError = error.message && (
            error.message.includes('429') || 
            error.message.includes('RESOURCE_EXHAUSTED') || 
            error.message.toLowerCase().includes('quota')
        );
        
        if (isQuotaError) {
            synonymsSection.innerHTML = `
                <h4>同義詞：</h4>
                <div class="loading-suggestion error">
                    <strong>API 配額已用盡</strong>
                    <p>您的 Google Gemini API 免費配額已用盡。可能的解決方法：</p>
                    <ul>
                        <li>等待 24 小時後再試（免費配額每天重置）</li>
                        <li>使用不同的 API 密鑰</li>
                        <li>升級到付費版 Google AI Studio</li>
                    </ul>
                </div>
                <button class="ai-synonyms-fallback-btn"><i class="fas fa-database"></i> 使用備用方法</button>
            `;
            
            // 為備用方法按鈕添加事件監聽器
            const fallbackBtn = synonymsSection.querySelector('.ai-synonyms-fallback-btn');
            if (fallbackBtn) {
                fallbackBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateFallbackSynonyms(card);
                });
            }
        } else {
            synonymsSection.innerHTML = `
                <h4>同義詞：</h4>
                <div class="loading-suggestion error">
                    生成同義詞與反義詞時出錯：${error.message}
                    <p>請檢查瀏覽器控制台獲取詳細錯誤信息</p>
                </div>
                <button class="ai-synonyms-btn"><i class="fas fa-robot"></i> 重試</button>
            `;
            
            // 為重試按鈕添加事件監聽器
            const retryBtn = synonymsSection.querySelector('.ai-synonyms-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await generateAISynonyms(card);
                });
            }
        }
    }
}

/**
 * 使用 Google Gemini API 獲取單字的同義詞和反義詞
 * @param {Object} card - 當前單字卡片
 * @returns {Object} - 包含同義詞和反義詞的對象
 */
async function getAISynonyms(card) {
    // 從 localStorage 獲取 API 密鑰
    const API_KEY = getGeminiApiKey();
    
    console.log('API 密鑰狀態:', API_KEY ? '已設置' : '未設置');
    
    if (!API_KEY) {
        console.warn('未設置 Gemini API 密鑰，無法使用 Gemini API 生成同義詞與反義詞');
        return null;
    }
    
    const word = card.word;
    const meaning = card.meaning || '';
    const partOfSpeech = card.partOfSpeech || '';
    
    console.log('準備為單字生成同義詞與反義詞:', word, '詞性:', partOfSpeech, '意思:', meaning);
    
    // 構建提示詞
    const prompt = `
    請為英文單字 "${word}" 生成同義詞和反義詞。
    
    單字資訊：
    - 詞性：${partOfSpeech}
    - 中文意思：${meaning}
    
    請生成以下內容：
    1. 5-8 個同義詞
    2. 3-5 個反義詞（如果適用）
    
    請以 JSON 格式回答，格式如下：
    {
      "synonyms": ["同義詞1", "同義詞2", ...],
      "antonyms": ["反義詞1", "反義詞2", ...]
    }
    
    請確保回答是有效的 JSON 格式，不要添加其他文字。如果缺乏適當的反義詞，請提供一個空陣列。
    `;
    
    console.log('發送到 Gemini API 的提示詞:', prompt);
    
    try {
        console.log('開始發送 API 請求...');
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
        
        console.log('API 回應狀態:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 錯誤詳情:', errorText);
            throw new Error(`API 請求失敗: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Gemini API 完整回應:', data);
        
        // 檢查回應結構
        if (!data.candidates || data.candidates.length === 0) {
            console.error('API 回應中沒有 candidates 數組或為空');
            return null;
        }
        
        if (!data.candidates[0].content) {
            console.error('API 回應中沒有 content 對象');
            return null;
        }
        
        if (!data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            console.error('API 回應中沒有 parts 數組或為空');
            return null;
        }
        
        const text = data.candidates[0].content.parts[0].text;
        if (!text) {
            console.error('API 回應中沒有文本內容');
            return null;
        }
        
        console.log('從 API 獲取的原始文本:', text);
        
        // 嘗試解析 JSON
        try {
            // 提取 JSON 部分（可能有額外文本）
            const jsonMatch = text.match(/\{\s*"synonyms"\s*:.*"antonyms"\s*:.*\}/s);
            if (jsonMatch) {
                const jsonText = jsonMatch[0];
                const result = JSON.parse(jsonText);
                console.log('解析後的同義詞與反義詞:', result);
                return result;
            } else {
                console.error('無法從回應中提取 JSON');
                return null;
            }
        } catch (parseError) {
            console.error('解析 JSON 時出錯:', parseError);
            
            // 嘗試手動解析
            try {
                // 使用正則表達式提取同義詞和反義詞
                const synonymsMatch = text.match(/"synonyms"\s*:\s*\[(.*?)\]/s);
                const antonymsMatch = text.match(/"antonyms"\s*:\s*\[(.*?)\]/s);
                
                const synonyms = [];
                const antonyms = [];
                
                if (synonymsMatch && synonymsMatch[1]) {
                    // 提取引號中的單詞
                    const synonymsStr = synonymsMatch[1];
                    const wordMatches = synonymsStr.match(/"([^"]*)"/g);
                    
                    if (wordMatches) {
                        wordMatches.forEach(match => {
                            synonyms.push(match.replace(/"/g, ''));
                        });
                    }
                }
                
                if (antonymsMatch && antonymsMatch[1]) {
                    // 提取引號中的單詞
                    const antonymsStr = antonymsMatch[1];
                    const wordMatches = antonymsStr.match(/"([^"]*)"/g);
                    
                    if (wordMatches) {
                        wordMatches.forEach(match => {
                            antonyms.push(match.replace(/"/g, ''));
                        });
                    }
                }
                
                if (synonyms.length > 0 || antonyms.length > 0) {
                    const result = {
                        synonyms: synonyms,
                        antonyms: antonyms
                    };
                    
                    console.log('手動解析後的同義詞與反義詞:', result);
                    return result;
                } else {
                    console.error('手動解析未找到同義詞和反義詞');
                    return null;
                }
            } catch (manualError) {
                console.error('手動解析時出錯:', manualError);
                return null;
            }
        }
    } catch (error) {
        console.error('獲取同義詞與反義詞時出錯:', error);
        throw error;
    }
}

/**
 * 使用本地方法生成單字的同義詞和反義詞
 * @param {Object} card - 當前單字卡片
 */
async function generateFallbackSynonyms(card) {
    if (!card || !card.word) {
        console.error('無法生成同義詞與反義詞：無效的卡片數據');
        return;
    }
    
    const synonymsSection = document.querySelector('.synonyms-section');
    const relatedSection = document.querySelector('.related-words-section');
    
    if (!synonymsSection || !relatedSection) {
        console.error('找不到同義詞或相關詞彙容器');
        return;
    }
    
    // 顯示加載中
    synonymsSection.innerHTML = '<div class="loading-suggestion">正在生成同義詞（備用方法）...</div>';
    relatedSection.innerHTML = '<div class="loading-suggestion">正在生成反義詞（備用方法）...</div>';
    
    const word = card.word.toLowerCase();
    
    let synonyms = [];
    let antonyms = [];
    
    // 為常見單字提供預設的同義詞和反義詞
    if (word === 'good') {
        synonyms = ['nice', 'excellent', 'fine', 'great', 'wonderful'];
        antonyms = ['bad', 'poor', 'terrible', 'awful'];
    } else if (word === 'bad') {
        synonyms = ['poor', 'terrible', 'awful', 'horrible', 'dreadful'];
        antonyms = ['good', 'excellent', 'fine', 'great'];
    } else if (word === 'big') {
        synonyms = ['large', 'huge', 'enormous', 'gigantic', 'massive'];
        antonyms = ['small', 'tiny', 'little', 'minor'];
    } else if (word === 'small') {
        synonyms = ['tiny', 'little', 'minute', 'compact', 'petite'];
        antonyms = ['big', 'large', 'huge', 'enormous'];
    } else if (word === 'happy') {
        synonyms = ['glad', 'joyful', 'cheerful', 'delighted', 'pleased'];
        antonyms = ['sad', 'unhappy', 'miserable', 'depressed'];
    } else if (word === 'sad') {
        synonyms = ['unhappy', 'sorrowful', 'depressed', 'gloomy', 'downcast'];
        antonyms = ['happy', 'joyful', 'cheerful', 'delighted'];
    } else if (word === 'fast') {
        synonyms = ['quick', 'rapid', 'swift', 'speedy', 'hasty'];
        antonyms = ['slow', 'sluggish', 'unhurried', 'leisurely'];
    } else if (word === 'slow') {
        synonyms = ['sluggish', 'unhurried', 'leisurely', 'gradual', 'plodding'];
        antonyms = ['fast', 'quick', 'rapid', 'swift'];
    } else {
        // 為其他單字生成通用同義詞和反義詞
        synonyms = [`similar to ${word}`, `like ${word}`, `comparable to ${word}`, `${word}-like`];
        antonyms = [`unlike ${word}`, `opposite of ${word}`, `not ${word}`];
    }
    
    // 更新卡片數據
    card.synonyms = synonyms;
    card.antonyms = antonyms;
    
    // 確保在 cards 數組中也更新對應的單字
    if (cards && currentCardIndex >= 0 && currentCardIndex < cards.length) {
        console.log(`更新當前卡片索引 ${currentCardIndex} 的同義詞與反義詞欄位`);
        cards[currentCardIndex].synonyms = [...synonyms]; // 使用展開運算符創建深拷貝
        cards[currentCardIndex].antonyms = [...antonyms]; // 使用展開運算符創建深拷貝
    }
    
    // 保存到資料庫
    console.log(`保存同義詞到數據庫 - 單字ID: ${card.id}`);
    await saveToDatabase(card.id, synonyms, 'synonyms');
    
    console.log(`保存反義詞到數據庫 - 單字ID: ${card.id}`);
    await saveToDatabase(card.id, antonyms, 'antonyms');
    
    // 更新全局數據
    if (window.appData && window.appData.vocabulary) {
        const wordId = card.id;
        const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
        
        if (vocabIndex !== -1) {
            console.log(`更新全局數據中 ID 為 ${wordId} 的單字同義詞與反義詞`);
            window.appData.vocabulary[vocabIndex].synonyms = synonyms;
            window.appData.vocabulary[vocabIndex].antonyms = antonyms;
            
            try {
                localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                console.log('數據已直接保存到本地儲存');
                showNotification('同義詞與反義詞已永久保存', 'success');
            } catch (error) {
                console.error('保存到本地儲存時出錯:', error);
                showNotification('保存失敗：' + error.message, 'error');
            }
        }
    }
    
    // 更新頁面顯示
    updateSynonymsPanel();
}

/**
 * 處理跳轉按鈕點擊事件
 */
function jumpToCardHandler() {
    const jumpToInput = document.getElementById('jumpToInput');
    if (!jumpToInput) return;

    const targetIndex = parseInt(jumpToInput.value);
    jumpToCard(targetIndex);
}

/**
 * 處理跳轉輸入框按鍵事件
 * @param {Event} e - 鍵盤事件
 */
function handleJumpInputKeypress(e) {
    if (e.key === 'Enter') {
        jumpToCardHandler();
    }
}

/**
 * 跳轉到指定索引的卡片
 * @param {number} targetIndex - 目標卡片索引
 */
function jumpToCard(targetIndex) {
    console.log(`嘗試跳轉到卡片索引: ${targetIndex}`);
    
    if (!cards || cards.length === 0) {
        console.error('沒有卡片可跳轉');
        showNotification('沒有可用的單字卡', 'error');
        return;
    }
    
    // 確保索引為數字
    if (isNaN(targetIndex)) {
        console.error('無效的卡片索引:', targetIndex);
        showNotification('請輸入有效的數字', 'error');
        return;
    }
    
    // 調整索引從1開始到實際從0開始的數組索引
    const adjustedIndex = targetIndex - 1;
    
    // 檢查索引範圍
    if (adjustedIndex < 0 || adjustedIndex >= cards.length) {
        console.error('卡片索引超出範圍:', targetIndex);
        showNotification(`請輸入1到${cards.length}之間的數字`, 'error');
        return;
    }
    
    // 更新當前索引並顯示該卡片
    currentCardIndex = adjustedIndex;
    showCard(currentCardIndex);
    console.log(`已跳轉到卡片索引: ${currentCardIndex} (顯示為第 ${currentCardIndex + 1} 張)`);
    
    // 清空輸入框
    const jumpToInput = document.getElementById('jumpToInput');
    if (jumpToInput) {
        jumpToInput.value = '';
    }
}