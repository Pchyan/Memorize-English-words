/**
 * 單字記憶大師 - 記憶卡功能模組
 * 負責記憶卡的顯示、翻轉、導航和相關功能
 */

let currentCardIndex = 0;
let cards = [];
let autoPlayTimer = null;
let isAutoPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    initFlashcards();
});

/**
 * 初始化記憶卡功能
 */
function initFlashcards() {
    // 確保在記憶卡頁面才初始化
    if (!document.getElementById('flashcards')) {
        return;
    }
    
    // 初始化詞彙表下拉選單
    initDeckSelector();
    
    // 載入單字數據
    loadCardData();
    
    // 記憶卡點擊事件 - 翻轉
    const flashcard = document.querySelector('.flashcard');
    if (flashcard) {
        flashcard.addEventListener('click', () => {
            flashcard.classList.toggle('flipped');
        });
    }
    
    // 導航按鈕
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn');
    
    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止觸發記憶卡翻轉
            showPreviousCard();
        });
    }
    
    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止觸發記憶卡翻轉
            showNextCard();
        });
    }
    
    // 自動播放按鈕
    const autoPlayBtn = document.getElementById('autoPlayBtn');
    if (autoPlayBtn) {
        autoPlayBtn.addEventListener('click', toggleAutoPlay);
    }
    
    // 詞彙選擇器
    const deckSelector = document.getElementById('deckSelector');
    if (deckSelector) {
        deckSelector.addEventListener('change', () => {
            const selectedDeck = deckSelector.value;
            loadCardData(selectedDeck);
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
}

/**
 * 初始化詞彙表下拉選單
 */
function initDeckSelector() {
    const deckSelector = document.getElementById('deckSelector');
    if (!deckSelector) {
        console.error('找不到詞彙表下拉選單');
        return;
    }
    
    // 清空現有選項，保留預設選項
    while (deckSelector.options.length > 1) {
        deckSelector.remove(1);
    }
    
    // 添加預設選項
    const defaultOptions = [
        { id: 'all', name: '所有單字' },
        { id: 'notLearned', name: '未學習' },
        { id: 'learning', name: '學習中' },
        { id: 'mastered', name: '已掌握' }
    ];
    
    defaultOptions.forEach(option => {
        if (deckSelector.querySelector(`option[value="${option.id}"]`)) return;
        
        const optionElem = document.createElement('option');
        optionElem.value = option.id;
        optionElem.textContent = option.name;
        deckSelector.appendChild(optionElem);
    });
    
    // 添加自定義詞彙表
    if (window.appData && window.appData.customLists && window.appData.customLists.length > 0) {
        window.appData.customLists.forEach(list => {
            const optionElem = document.createElement('option');
            optionElem.value = list.id;
            optionElem.textContent = list.name;
            deckSelector.appendChild(optionElem);
        });
    }
}

/**
 * 載入記憶卡數據
 * @param {string} deck - 詞彙組名稱，預設為'all'
 */
function loadCardData(deck = 'all') {
    console.log(`載入記憶卡數據，選擇的詞彙組: ${deck}`);
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法載入單字數據');
        return;
    }
    
    console.log(`全局詞彙數量: ${window.appData.vocabulary.length}`);
    
    // 根據選擇的詞彙組過濾單字
    cards = window.appData.vocabulary.filter(word => {
        if (deck === 'all') return true;
        if (deck === 'notLearned' && (word.status === 'new' || word.status === 'notLearned')) return true;
        if (deck === 'learning' && word.status === 'learning') return true;
        if (deck === 'mastered' && word.status === 'mastered') return true;
        
        // 檢查自定義詞彙表
        if (window.appData.customLists && window.appData.customLists.length > 0) {
            const customList = window.appData.customLists.find(list => list.id === deck);
            if (customList && word.lists && Array.isArray(word.lists) && word.lists.includes(deck)) {
                return true;
            }
        }
        
        return false;
    });
    
    console.log(`過濾後的詞彙數量: ${cards.length}`);
    
    // 如果沒有單字，顯示提示
    if (cards.length === 0) {
        cards = [{
            id: 0,
            word: '沒有單字',
            phonetic: '',
            meaning: '這個詞彙組中沒有單字',
            partOfSpeech: '',
            definition: '請添加單字或選擇另一個詞彙組',
            examples: []
        }];
    }
    
    // 重置當前索引
    currentCardIndex = 0;
    
    // 顯示第一張卡片
    showCard(currentCardIndex);
    
    // 更新計數器
    updateCardCounter();
}

/**
 * 顯示指定索引的記憶卡
 * @param {number} index - 卡片索引
 */
function showCard(index) {
    if (cards.length === 0 || index < 0 || index >= cards.length) {
        console.error('無效的卡片索引或沒有卡片');
        return;
    }
    
    const card = cards[index];
    console.log('顯示卡片:', card);
    
    // 更新前面
    const wordFrontElem = document.getElementById('wordFront');
    if (wordFrontElem) {
        wordFrontElem.textContent = card.word;
    } else {
        console.error('找不到 wordFront 元素');
    }
    
    const phoneticElem = document.querySelector('.phonetic');
    if (phoneticElem) {
        phoneticElem.textContent = card.phonetic || '';
    }
    
    // 更新背面
    const wordBackElem = document.getElementById('wordBack');
    if (wordBackElem) {
        wordBackElem.textContent = card.meaning;
    } else {
        console.error('找不到 wordBack 元素');
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
            } else {
                const noExampleElem = document.createElement('p');
                noExampleElem.textContent = '沒有例句';
                examplesContainer.appendChild(noExampleElem);
            }
        } else {
            console.error('找不到例句標題元素');
        }
    } else {
        console.error('找不到例句容器元素');
    }
    
    // 確保卡片不是翻轉狀態
    const flashcard = document.querySelector('.flashcard');
    if (flashcard && flashcard.classList.contains('flipped')) {
        flashcard.classList.remove('flipped');
    }
    
    // 更新學習工具面板中的單字
    updateLearningToolsWord(card.word);
    
    // 更新聯想文本區域
    const assocInput = document.getElementById('assocInput');
    if (assocInput) {
        assocInput.value = card.associations || '';
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
 * 顯示下一張卡片
 */
function showNextCard() {
    if (cards.length === 0) return;
    
    currentCardIndex = (currentCardIndex + 1) % cards.length;
    showCard(currentCardIndex);
    updateCardCounter();
}

/**
 * 顯示上一張卡片
 */
function showPreviousCard() {
    if (cards.length === 0) return;
    
    currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
    showCard(currentCardIndex);
    updateCardCounter();
}

/**
 * 更新卡片計數器
 */
function updateCardCounter() {
    const counterElem = document.querySelector('.card-counter');
    if (counterElem && cards.length > 0) {
        counterElem.textContent = `${currentCardIndex + 1} / ${cards.length}`;
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
    } else {
        // 開始自動播放
        isAutoPlaying = true;
        autoPlayBtn.innerHTML = '<i class="fas fa-pause"></i> 暫停播放';
        
        // 先顯示正面5秒，然後翻轉到背面，再等5秒，然後顯示下一張
        autoPlayTimer = setInterval(() => {
            const flashcard = document.querySelector('.flashcard');
            
            if (!flashcard.classList.contains('flipped')) {
                // 如果是正面，翻轉到背面
                flashcard.classList.add('flipped');
                // 發音
                const word = document.getElementById('wordFront').textContent;
                if (word && word !== '沒有單字') {
                    pronounceWord(word);
                }
            } else {
                // 如果是背面，翻轉到正面並顯示下一張
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
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            saveAssociation();
        });
    }
    
    // 檢查句子按鈕
    const checkBtn = document.querySelector('.check-btn');
    if (checkBtn) {
        checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            checkSentence();
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
    
    // 更新建議聯想按鈕
    updateSuggestionButtons(card);
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
        } else {
            const noContext = document.createElement('p');
            noContext.textContent = '沒有相關上下文用法';
            contextSection.appendChild(noContext);
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
    
    // 如果是示例單字 "example"，提供特定的同義詞和相關詞彙
    let synonyms = [];
    let relatedWords = [];
    
    if (card.word.toLowerCase() === 'example') {
        synonyms = ['instance', 'sample', 'illustration', 'case'];
        relatedWords = ['model', 'pattern', 'template', 'specimen', 'paradigm'];
    } else if (card.word.toLowerCase() === 'apple') {
        synonyms = ['fruit', 'pomme'];
        relatedWords = ['pear', 'orange', 'fruit', 'tree'];
    } else {
        // 使用卡片中的同義詞和相關詞彙（如果有）
        synonyms = card.synonyms || [];
        relatedWords = card.relatedWords || [];
    }
    
    // 更新同義詞
    const synonymsSection = document.querySelector('.synonyms-section .word-pills');
    if (synonymsSection) {
        synonymsSection.innerHTML = '';
        
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
                
                synonymsSection.appendChild(pill);
            });
        } else {
            const noPill = document.createElement('span');
            noPill.textContent = '沒有同義詞';
            synonymsSection.appendChild(noPill);
        }
    } else {
        console.error('找不到同義詞容器');
    }
    
    // 更新相關詞彙
    const relatedSection = document.querySelector('.related-words-section .word-pills');
    if (relatedSection) {
        relatedSection.innerHTML = '';
        
        if (relatedWords.length > 0) {
            relatedWords.forEach(related => {
                const pill = document.createElement('span');
                pill.className = 'word-pill';
                pill.innerHTML = `${related} <i class="fas fa-volume-up"></i>`;
                
                // 添加發音事件
                const icon = pill.querySelector('i');
                if (icon) {
                    icon.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('發音相關詞彙:', related);
                        pronounceWord(related);
                    });
                }
                
                relatedSection.appendChild(pill);
            });
        } else {
            const noPill = document.createElement('span');
            noPill.textContent = '沒有相關詞彙';
            relatedSection.appendChild(noPill);
        }
    } else {
        console.error('找不到相關詞彙容器');
    }
    
    // 更新詞彙關聯圖
    const mapContainer = document.querySelector('.map-container');
    if (mapContainer) {
        mapContainer.innerHTML = '<div class="placeholder-map">詞彙關聯圖將在這裡顯示</div>';
    }
}

/**
 * 保存聯想內容
 */
function saveAssociation() {
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
    
    // 保存到全局數據
    if (window.appData && window.appData.vocabulary) {
        const wordId = card.id;
        const vocabIndex = window.appData.vocabulary.findIndex(item => item.id === wordId);
        
        if (vocabIndex !== -1) {
            console.log(`更新全局數據中 ID 為 ${wordId} 的單字聯想`);
            window.appData.vocabulary[vocabIndex].associations = assocInput.value;
            
            // 儲存到本地儲存
            try {
                localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
                console.log('數據已直接保存到本地儲存');
                
                // 顯示保存成功訊息
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
                console.error('保存到本地儲存時出錯:', error);
                alert('保存失敗：' + error.message);
            }
        } else {
            console.error(`找不到 ID 為 ${wordId} 的單字`);
            alert('保存失敗：找不到對應的單字');
        }
    } else {
        console.error('全局數據不存在');
        alert('保存失敗：應用數據未初始化');
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
 * 檢查用戶造的句子
 */
function checkSentence() {
    if (cards.length === 0 || currentCardIndex < 0 || currentCardIndex >= cards.length) {
        return;
    }
    
    const sentenceInput = document.getElementById('sentenceInput');
    const sentenceFeedback = document.getElementById('sentenceFeedback');
    
    if (!sentenceInput || !sentenceFeedback) return;
    
    const sentence = sentenceInput.value.trim();
    const currentWord = cards[currentCardIndex].word.toLowerCase();
    
    // 簡單檢查:句子是否包含當前單字
    if (sentence === '') {
        sentenceFeedback.textContent = '請輸入一個句子';
        sentenceFeedback.className = 'feedback error';
    } else if (!sentence.toLowerCase().includes(currentWord.toLowerCase())) {
        sentenceFeedback.textContent = `您的句子需要包含單字 "${cards[currentCardIndex].word}"`;
        sentenceFeedback.className = 'feedback error';
    } else if (sentence.split(' ').length < 3) {
        sentenceFeedback.textContent = '請輸入一個完整的句子';
        sentenceFeedback.className = 'feedback error';
    } else {
        sentenceFeedback.textContent = '很好！您的句子使用了正確的單字。';
        sentenceFeedback.className = 'feedback success';
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
 */
function updateSuggestionButtons(card) {
    console.log('更新建議聯想按鈕');
    
    const suggestionsContainer = document.querySelector('.suggestions');
    if (!suggestionsContainer) {
        console.error('找不到建議聯想容器');
        return;
    }
    
    // 清空現有建議
    suggestionsContainer.innerHTML = '';
    
    // 如果是"沒有單字"的卡片，不顯示建議
    if (card.id === 0 || card.word === '沒有單字') {
        const noSuggestion = document.createElement('p');
        noSuggestion.textContent = '請先添加單字';
        noSuggestion.className = 'no-suggestion';
        suggestionsContainer.appendChild(noSuggestion);
        return;
    }
    
    // 根據單字生成建議聯想
    const suggestions = generateSuggestions(card);
    console.log('生成的建議聯想:', suggestions);
    
    // 添加建議按鈕
    suggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = suggestion;
        
        // 添加點擊事件 - 使用箭頭函數確保正確的 this 上下文
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('點擊建議聯想按鈕:', suggestion);
            
            const assocInput = document.getElementById('assocInput');
            if (assocInput && !assocInput.disabled) {
                // 檢查當前值是否為空
                if (assocInput.value && assocInput.value.trim() !== '') {
                    assocInput.value += '\n';
                }
                assocInput.value += suggestion;
                
                // 聚焦輸入框並滾動到底部
                assocInput.focus();
                assocInput.scrollTop = assocInput.scrollHeight;
            } else {
                console.error('找不到聯想輸入框或輸入框已禁用');
            }
        });
        
        suggestionsContainer.appendChild(btn);
    });
    
    // 確保建議區域可見
    suggestionsContainer.style.display = 'flex';
    suggestionsContainer.style.flexWrap = 'wrap';
    suggestionsContainer.style.gap = '8px';
}

/**
 * 根據單字生成建議聯想
 * @param {Object} card - 當前卡片
 * @returns {Array} - 建議聯想數組
 */
function generateSuggestions(card) {
    const suggestions = [];
    const word = card.word;
    
    console.log('為單字生成聯想建議:', word, card);
    
    // 如果是示例單字 "Apple"，提供特定的聯想
    if (word.toLowerCase() === 'apple') {
        suggestions.push('紅色的水果');
        suggestions.push('像「A」一樣是單字的開頭');
        suggestions.push('含有「p」的雙重發音');
        suggestions.push('想像一個蘋果樹');
        suggestions.push('蘋果咬一口的聲音「喀滋」');
        suggestions.push('蘋果公司的標誌');
        return suggestions;
    }
    
    // 如果是示例單字 "example"，提供特定的聯想
    if (word.toLowerCase() === 'example') {
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