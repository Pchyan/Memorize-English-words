/**
 * 單字記憶大師 - 詞彙管理模組
 * 負責詞彙表管理、單字添加/編輯/刪除等功能
 */

let currentVocabList = 'all';
let currentPage = 1;
const pageSize = 10;
let filteredWords = [];

// 全局變量，用於存儲可用的語音
let availableVoices = [];

// 全局初始化標記
let isVocabManagerInitialized = false;

// 匯出鎖定狀態，防止重複調用
let isExporting = false;

// 匯入鎖定狀態，防止重複調用
let isImporting = false;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 事件觸發');
    
    try {
        // 初始化語音引擎
        initSpeechSynthesis();
    
        // 初始化資料庫
        await window.db.init();
        console.log('資料庫初始化成功');
    
        // 檢查當前頁面是否為詞彙管理頁面
        const vocabularyPage = document.getElementById('vocabulary');
        if (vocabularyPage && vocabularyPage.classList.contains('active')) {
            console.log('當前頁面是詞彙管理頁面，立即初始化');
            await initVocabularyManager();
        } else {
            // 否則，監聽頁面切換事件
            const navLinks = document.querySelectorAll('nav a');
            navLinks.forEach(link => {
                link.addEventListener('click', async function(e) {
                    if (this.getAttribute('data-page') === 'vocabulary') {
                        console.log('切換到詞彙管理頁面');
                        // 延遲一點初始化，確保頁面已經切換
                        setTimeout(async () => {
                            await initVocabularyManager();
                            // 初始化後確保計數正確
                            await updateVocabListCounts();
                        }, 100);
                    }
                });
            });
        }
        
        // 添加詞彙表選擇模態框樣式
        addWordListSelectModalStyles();
        
        // 確保計數在頁面載入時更新
        setTimeout(async () => {
            await updateVocabListCounts();
        }, 500);
    } catch (error) {
        console.error('初始化失敗:', error);
    }
});

/**
 * 初始化語音合成
 */
function initSpeechSynthesis() {
    console.log('初始化語音合成');
    
    // 檢查瀏覽器是否支持語音合成
    if (!window.speechSynthesis) {
        console.error('瀏覽器不支持語音合成');
        return;
    }
    
    // 獲取可用的語音列表
    let voices = window.speechSynthesis.getVoices();
    
    // 如果語音列表為空，監聽voiceschanged事件
    if (voices.length === 0) {
        console.log('語音列表為空，監聽voiceschanged事件');
        
        window.speechSynthesis.addEventListener('voiceschanged', () => {
            voices = window.speechSynthesis.getVoices();
            console.log(`語音列表已更新，共有 ${voices.length} 個語音`);
            availableVoices = voices;
            
            // 輸出所有可用的語音
            voices.forEach(voice => {
                console.log(`語音: ${voice.name}, 語言: ${voice.lang}, 預設: ${voice.default}`);
            });
        });
    } else {
        console.log(`獲取到 ${voices.length} 個語音`);
        availableVoices = voices;
        
        // 輸出所有可用的語音
        voices.forEach(voice => {
            console.log(`語音: ${voice.name}, 語言: ${voice.lang}, 預設: ${voice.default}`);
        });
    }
}

/**
 * 初始化詞彙管理器
 */
async function initVocabularyManager() {
    // 檢查是否已經初始化
    if (isVocabManagerInitialized) {
        console.log('詞彙管理器已初始化，刷新數據顯示');
        await loadVocabularyData();
        return;
    }
    
    console.log('初始化詞彙管理器');
    
    // 初始化詞彙列表
    await initVocabLists();
    
    // 初始化詞彙操作
    await initVocabOperations();
    
    // 初始化匯入匯出功能
    await initImportExportFeatures();
    
    // 確保工具容器存在
    ensureToolsContainerExists();
    
    // 添加音標測試按鈕
    addPhoneticTestButton();
    
    // 添加樣式
    addVocabularyStyles();
    
    // 載入詞彙數據
    await loadVocabularyData();
    
    // 標記為已初始化
    isVocabManagerInitialized = true;
    
    // 確保計數正確顯示
    await updateVocabListCounts();
    
    console.log('詞彙管理器初始化完成');
}

/**
 * 確保tools-container元素存在
 */
function ensureToolsContainerExists() {
    console.log('確保tools-container元素存在');
    
    // 檢查是否已存在tools-container
    let toolsContainer = document.querySelector('.tools-container');
    
    if (!toolsContainer) {
        console.log('未找到tools-container元素，創建新元素');
        
        // 獲取page-header元素
        const pageHeader = document.querySelector('#vocabulary .page-header');
        
        if (pageHeader) {
            // 創建tools-container元素
            toolsContainer = document.createElement('div');
            toolsContainer.className = 'tools-container';
            
            // 將按鈕添加到容器中
            toolsContainer.innerHTML = `
                <button class="btn primary" id="addWordBtnToolbar"><i class="fas fa-plus"></i> 新增單字</button>
                <button class="btn secondary" id="importBtn"><i class="fas fa-file-import"></i> 匯入詞彙</button>
                <input type="file" id="importFileInput" accept=".json,.csv" style="display: none;">
                <button class="btn secondary" id="exportJsonBtn"><i class="fas fa-file-export"></i> 匯出 JSON</button>
                <button class="btn secondary" id="exportCsvBtn"><i class="fas fa-file-export"></i> 匯出 CSV</button>
                <button class="btn secondary" id="voiceSettingsBtn"><i class="fas fa-volume-up"></i> 發音設置</button>
            `;
            
            // 添加到page-header
            pageHeader.appendChild(toolsContainer);
            console.log('已創建tools-container元素');
            
            // 綁定發音設置按鈕事件
            const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
            if (voiceSettingsBtn) {
                voiceSettingsBtn.addEventListener('click', showVoiceSettingsModal);
            }
        } else {
            console.error('找不到page-header元素，無法創建tools-container');
        }
    } else {
        console.log('找到現有的tools-container元素');
        
        // 檢查發音設置按鈕是否已存在
        let voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
        if (!voiceSettingsBtn) {
            // 創建發音設置按鈕
            voiceSettingsBtn = document.createElement('button');
            voiceSettingsBtn.id = 'voiceSettingsBtn';
            voiceSettingsBtn.className = 'btn secondary';
            voiceSettingsBtn.innerHTML = '<i class="fas fa-volume-up"></i> 發音設置';
            voiceSettingsBtn.addEventListener('click', showVoiceSettingsModal);
            
            // 添加到現有的工具容器中
            toolsContainer.appendChild(voiceSettingsBtn);
        }
    }
}

/**
 * 初始化詞彙列表
 */
async function initVocabLists() {
    console.log('初始化詞彙列表');
    
    const vocabListsContainer = document.getElementById('vocabLists');
    if (!vocabListsContainer) {
        console.error('找不到詞彙列表容器');
        return;
    }
    
    try {
        // 獲取所有詞彙組
        const lists = await window.db.getAllWordLists();
        console.log('已載入詞彙組:', lists.length);
        
        // 清空容器
        vocabListsContainer.innerHTML = '';
        
        // 添加預設列表
        const defaultLists = [
            { id: 'all', name: '所有單字', icon: 'fas fa-globe' },
            { id: 'notLearned', name: '未學習', icon: 'fas fa-book' },
            { id: 'learning', name: '學習中', icon: 'fas fa-graduation-cap' },
            { id: 'mastered', name: '已掌握', icon: 'fas fa-check-circle' }
        ];
        
        // 獲取所有單字以計算預設列表的計數
        const allWords = await window.db.getAllWords();
        const notLearnedWords = allWords.filter(word => word.status === 'notLearned' || word.status === 'new');
        const learningWords = allWords.filter(word => word.status === 'learning');
        const masteredWords = allWords.filter(word => word.status === 'mastered');
        
        // 設置預設列表的計數
        defaultLists[0].count = allWords.length;
        defaultLists[1].count = notLearnedWords.length;
        defaultLists[2].count = learningWords.length;
        defaultLists[3].count = masteredWords.length;
        
        // 創建預設列表
        defaultLists.forEach(list => {
            const listElement = createListItem(list);
            vocabListsContainer.appendChild(listElement);
        });
        
        // 添加分隔線
        const separator = document.createElement('div');
        separator.className = 'list-separator';
        vocabListsContainer.appendChild(separator);
        
        // 添加自定義詞彙組
        lists.forEach(list => {
            const listElement = createListItem(list);
            vocabListsContainer.appendChild(listElement);
        });
        
        // 添加「新增詞彙組」按鈕
        const addListBtn = document.createElement('button');
        addListBtn.className = 'add-list-btn';
        addListBtn.innerHTML = '<i class="fas fa-plus"></i> 新增詞彙組';
        addListBtn.addEventListener('click', () => {
            const listName = prompt('請輸入詞彙組名稱：');
            if (listName) {
                addNewVocabList(listName);
            }
        });
        vocabListsContainer.appendChild(addListBtn);
        
    } catch (error) {
        console.error('初始化詞彙列表失敗:', error);
    }
}

/**
 * 創建詞彙列表項目
 */
function createListItem(list) {
    const item = document.createElement('div');
    item.className = 'vocab-list-item';
    item.setAttribute('data-list-id', list.id);
    
    // 創建上方區域，包含圖標和名稱
    const topSection = document.createElement('div');
    topSection.className = 'list-item-top';
    
    const icon = document.createElement('i');
    icon.className = list.icon || 'fas fa-list';
    
    const name = document.createElement('span');
    name.className = 'list-name';
    name.textContent = list.name;
    
    topSection.appendChild(icon);
    topSection.appendChild(name);
    
    // 創建下方區域，包含計數和操作按鈕
    const bottomSection = document.createElement('div');
    bottomSection.className = 'list-item-bottom';
    
    const count = document.createElement('span');
    count.className = 'word-count';
    count.textContent = '0';
    
    bottomSection.appendChild(count);
    
    // 添加操作按鈕
    const actions = document.createElement('div');
    actions.className = 'list-actions';
    
    // 為所有詞彙表添加清空按鈕，但確認訊息和處理方式不同
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-list-btn';
    clearBtn.innerHTML = '<i class="fas fa-eraser"></i>';
    clearBtn.title = '清空詞彙表';
    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let confirmMessage = '';
        
        // 根據不同列表類型顯示不同的確認訊息
        if (list.id === 'all') {
            confirmMessage = '確定要清空所有單字嗎？此操作將刪除系統中的所有單字，且不可復原！';
        } else if (list.id === 'notLearned') {
            confirmMessage = '確定要清空所有"未學習"的單字嗎？此操作不可復原！';
        } else if (list.id === 'learning') {
            confirmMessage = '確定要清空所有"學習中"的單字嗎？此操作不可復原！';
        } else if (list.id === 'mastered') {
            confirmMessage = '確定要清空所有"已掌握"的單字嗎？此操作不可復原！';
        } else {
            confirmMessage = `確定要清空詞彙組「${list.name}」中的所有單字嗎？此操作不可復原。`;
        }
        
        if (confirm(confirmMessage)) {
            clearVocabList(list.id);
        }
    });
    actions.appendChild(clearBtn);
    
    // 如果不是預設列表，添加編輯和刪除按鈕
    if (!['all', 'notLearned', 'learning', 'mastered'].includes(list.id)) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-list-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = '編輯名稱';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newName = prompt('請輸入新的詞彙組名稱：', list.name);
            if (newName && newName !== list.name) {
                updateVocabList(list.id, newName);
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-list-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = '刪除詞彙表';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`確定要刪除詞彙組「${list.name}」嗎？`)) {
                deleteVocabList(list.id);
            }
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
    }
    
    bottomSection.appendChild(actions);
    
    // 組合
    item.appendChild(topSection);
    item.appendChild(bottomSection);
    
    // 添加點擊事件
    item.addEventListener('click', () => {
        // 移除其他列表的選中狀態
        document.querySelectorAll('.vocab-list-item').forEach(el => {
            el.classList.remove('active');
        });
        
        // 添加選中狀態
        item.classList.add('active');
        
        // 更新當前詞彙列表
        currentVocabList = list.id;
        
        // 重新載入詞彙
        loadVocabularyData();
    });
    
    return item;
}

/**
 * 新增詞彙列表
 */
async function addNewVocabList(name) {
    console.log('正在添加新詞彙列表:', name);
    
    if (!name || name.trim() === '') {
        showNotification('詞彙列表名稱不能為空', 'error');
        return;
    }
    
    try {
        const list = {
            name: name.trim(),
            count: 0
        };
        
        const listId = await window.db.addWordList(list);
        console.log('新詞彙列表添加成功:', listId);
        
        // 更新詞彙列表顯示
        await initVocabLists();
        
        // 通知其他模組詞彙列表已更新
        document.dispatchEvent(new CustomEvent('vocabListsUpdated'));
        
        showNotification('詞彙列表添加成功', 'success');
        return listId;
    } catch (error) {
        console.error('添加詞彙列表失敗:', error);
        showNotification('添加詞彙列表失敗', 'error');
        return null;
    }
}

/**
 * 更新詞彙列表
 */
async function updateVocabList(id, name) {
    console.log('正在更新詞彙列表:', id, name);
    
    if (!name || name.trim() === '') {
        showNotification('詞彙列表名稱不能為空', 'error');
        return false;
    }
    
    try {
        const list = {
            id: id,
            name: name.trim()
        };
        
        await window.db.updateWordList(list);
        console.log('詞彙列表更新成功');
        
        // 更新詞彙列表顯示
        await initVocabLists();
        
        // 通知其他模組詞彙列表已更新
        document.dispatchEvent(new CustomEvent('vocabListsUpdated'));
        
        showNotification('詞彙列表更新成功', 'success');
        return true;
    } catch (error) {
        console.error('更新詞彙列表失敗:', error);
        showNotification('更新詞彙列表失敗', 'error');
        return false;
    }
}

/**
 * 刪除詞彙列表
 */
async function deleteVocabList(id) {
    console.log('正在刪除詞彙列表:', id);
    
    if (!confirm('確定要刪除此詞彙列表嗎？這將移除該列表，但不會刪除單字。')) {
        return false;
    }
    
    try {
        await window.db.deleteWordList(id);
        console.log('詞彙列表刪除成功');
        
        // 更新詞彙列表顯示
        await initVocabLists();
        
        // 如果當前正在查看被刪除的列表，則切換到"所有單字"
        if (currentVocabList === id) {
            currentVocabList = 'all';
            await loadVocabularyData();
        }
        
        // 通知其他模組詞彙列表已更新
        document.dispatchEvent(new CustomEvent('vocabListsUpdated'));
        
        showNotification('詞彙列表刪除成功', 'success');
        return true;
    } catch (error) {
        console.error('刪除詞彙列表失敗:', error);
        showNotification('刪除詞彙列表失敗', 'error');
        return false;
    }
}

/**
 * 更新詞彙表計數
 */
async function updateVocabListCounts() {
    console.log('更新詞彙列表計數');
    
    try {
        // 獲取所有詞彙組
        const lists = await window.db.getAllWordLists();
        if (!lists || lists.length === 0) return;
        
        // 獲取所有單字
        const allWords = await window.db.getAllWords();
        if (!allWords || allWords.length === 0) return;
        
        // 計算預設列表的計數
        const notLearnedWords = allWords.filter(word => word.status === 'notLearned' || word.status === 'new');
        const learningWords = allWords.filter(word => word.status === 'learning');
        const masteredWords = allWords.filter(word => word.status === 'mastered');
        
        // 更新預設列表的計數顯示
        updateCountDisplay('all', allWords.length);
        updateCountDisplay('notLearned', notLearnedWords.length);
        updateCountDisplay('learning', learningWords.length);
        updateCountDisplay('mastered', masteredWords.length);
        
        // 更新每個詞彙組的計數
        let updated = false;
        for (const list of lists) {
            // 獲取該詞彙組中的單字數量
            const wordsInList = await window.db.getWordsInList(list.id);
            const count = wordsInList ? wordsInList.length : 0;
            
            // 更新DOM中的計數顯示
            updateCountDisplay(list.id, count);
            
            // 如果計數有變化，更新詞彙組
            if (list.count !== count) {
                list.count = count;
                await window.db.updateWordList(list);
                updated = true;
            }
        }
        
        if (updated) {
            console.log('詞彙列表計數已更新');
            // 通知其他模組詞彙列表已更新
            document.dispatchEvent(new CustomEvent('vocabListsUpdated'));
        }
    } catch (error) {
        console.error('更新詞彙列表計數失敗:', error);
    }
}

/**
 * 更新DOM中的詞彙列表計數顯示
 * @param {string|number} listId - 詞彙列表ID
 * @param {number} count - 計數
 */
function updateCountDisplay(listId, count) {
    const listItem = document.querySelector(`.vocab-list-item[data-list-id="${listId}"]`);
    if (listItem) {
        const countElement = listItem.querySelector('.word-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }
}

/**
 * 根據當前選擇的詞彙表過濾單字
 */
function filterVocabulary() {
    console.log(`過濾詞彙，當前詞彙表: ${currentVocabList}`);
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法過濾詞彙：全局數據不可用');
        return;
    }
    
    // 根據當前詞彙表過濾單字
    if (currentVocabList === 'all') {
        // 所有單字
        filteredWords = [...window.appData.vocabulary];
    } else if (currentVocabList === 'notLearned') {
        // 未學習的單字
        filteredWords = window.appData.vocabulary.filter(word => 
            word.status === 'new' || word.status === 'notLearned'
        );
    } else if (currentVocabList === 'learning') {
        // 學習中的單字
        filteredWords = window.appData.vocabulary.filter(word => 
            word.status === 'learning'
        );
    } else if (currentVocabList === 'mastered') {
        // 已掌握的單字
        filteredWords = window.appData.vocabulary.filter(word => 
            word.status === 'mastered'
        );
    } else {
        // 自定義詞彙表
        filteredWords = window.appData.vocabulary.filter(word => 
            word.lists && Array.isArray(word.lists) && word.lists.includes(currentVocabList)
        );
    }
    
    console.log(`過濾後的單字數量: ${filteredWords.length}`);
    
    // 重置當前頁碼
    window.currentPage = 1;
    
    // 顯示過濾後的單字
    displayVocabularyPage();
    
    // 更新詞彙表計數
    updateVocabListCounts();
}

/**
 * 載入詞彙數據
 */
async function loadVocabularyData() {
    console.log('載入詞彙數據');
    
    try {
        let words;
        
        if (currentVocabList === 'all') {
            words = await window.db.getAllWords();
        } else if (currentVocabList === 'notLearned') {
            words = await window.db.getWordsByStatus('notLearned');
        } else if (currentVocabList === 'learning') {
            words = await window.db.getWordsByStatus('learning');
        } else if (currentVocabList === 'mastered') {
            words = await window.db.getWordsByStatus('mastered');
    } else {
            // 自定義詞彙組
            words = await window.db.getWordsInList(currentVocabList);
        }
        
        console.log('已載入詞彙數據，單字數量:', words.length);
    
    // 設置全局變量
        filteredWords = words;
        
        // 顯示第一頁
        displayVocabularyPage(1);
        
        // 更新分頁控制
        updatePagination();
        
        // 更新詞彙表計數
        await updateVocabListCounts();
    } catch (error) {
        console.error('載入詞彙數據失敗:', error);
    }
}

/**
 * 顯示詞彙頁面
 * @param {number} page - 頁碼
 */
function displayVocabularyPage(page = 1) {
    console.log('顯示詞彙頁面，頁碼:', page);
    
    // 設置當前頁碼
    currentPage = parseInt(page) || 1;
    
    // 獲取每頁顯示數量
    const itemsPerPage = pageSize;
    
    // 計算開始和結束索引
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredWords.length);
    
    // 獲取當前頁的單字
    const currentPageWords = filteredWords.slice(startIndex, endIndex);
    
    // 獲取單字列表容器
    const vocabularyList = document.getElementById('vocabularyList');
    if (!vocabularyList) {
        console.error('找不到單字列表容器');
        return;
    }
    
    // 清空容器
    vocabularyList.innerHTML = '';
    
    // 如果沒有單字，顯示提示信息
    if (currentPageWords.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '未找到單字。';
        vocabularyList.appendChild(emptyMessage);
        
        // 清空分頁控制
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        
        return;
    }
    
    // 創建單字元素
    currentPageWords.forEach(word => {
        const wordElement = createWordElement(word);
        vocabularyList.appendChild(wordElement);
    });
    
    // 更新分頁控制
    updatePagination();
}

/**
 * 創建單字元素
 */
function createWordElement(word) {
    console.log('創建單字元素:', word.word, 'ID:', word.id);
    
    const wordElement = document.createElement('div');
    wordElement.className = 'vocab-item';
    wordElement.setAttribute('data-id', word.id);
    wordElement.setAttribute('data-word', word.word);
    
    const wordInfo = document.createElement('div');
    wordInfo.className = 'word-info';
    
    const wordMain = document.createElement('div');
    wordMain.className = 'word-main';
    
    const wordText = document.createElement('h3');
    wordText.textContent = word.word;
    
    const phoneticSpan = document.createElement('span');
    phoneticSpan.className = 'phonetic';
    phoneticSpan.textContent = word.phonetic || '';
    
    // 添加發音按鈕
    const pronunciationBtn = document.createElement('button');
    pronunciationBtn.className = 'pronunciation-btn';
    pronunciationBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    pronunciationBtn.title = '播放發音';
    pronunciationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playPronunciation(word.word);
    });
    
    wordMain.appendChild(wordText);
    wordMain.appendChild(phoneticSpan);
    wordMain.appendChild(pronunciationBtn);
    
    const wordDetails = document.createElement('div');
    wordDetails.className = 'word-details';
    
        const partOfSpeech = document.createElement('span');
    partOfSpeech.className = 'part-of-speech';
    partOfSpeech.textContent = translatePartOfSpeech(word.partOfSpeech) || '';
    
    const meaning = document.createElement('span');
    meaning.className = 'meaning';
    meaning.textContent = word.meaning;
    
    wordDetails.appendChild(partOfSpeech);
    wordDetails.appendChild(meaning);
    
    wordInfo.appendChild(wordMain);
    wordInfo.appendChild(wordDetails);
    
    const wordStatus = document.createElement('div');
    wordStatus.className = 'word-status';
    
    const statusText = document.createElement('span');
    statusText.className = `status-badge ${word.status}`;
    statusText.textContent = translateStatus(word.status);
    
    wordStatus.appendChild(statusText);
    
    if (word.examples) {
        const viewExamplesBtn = document.createElement('button');
        viewExamplesBtn.className = 'view-examples-btn';
        viewExamplesBtn.innerHTML = '<i class="fas fa-quote-right"></i>';
        viewExamplesBtn.title = '查看例句';
        viewExamplesBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        viewWordDetails(word.id);
    });
        wordStatus.appendChild(viewExamplesBtn);
    }
    
    const wordActions = document.createElement('div');
    wordActions.className = 'word-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = '編輯';
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditWordModal(word);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = '刪除';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`確定要刪除單字「${word.word}」嗎？`)) {
        deleteWord(word.id);
        }
    });
    
    const addToListBtn = document.createElement('button');
    addToListBtn.className = 'add-to-list-btn';
    addToListBtn.innerHTML = '<i class="fas fa-list"></i>';
    addToListBtn.title = '加入詞彙表';
    addToListBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToWordList(word.id);
    });
    
    wordActions.appendChild(editBtn);
    wordActions.appendChild(deleteBtn);
    wordActions.appendChild(addToListBtn);
    
    wordElement.appendChild(wordInfo);
    wordElement.appendChild(wordStatus);
    wordElement.appendChild(wordActions);
    
    // 添加點擊事件以查看詳情
    wordElement.addEventListener('click', () => {
        viewWordDetails(word.id);
    });
    
    return wordElement;
}

/**
 * 播放單字發音
 * @param {string} word - 要發音的單字
 * @param {string} lang - 語言代碼，默認使用用戶偏好設置或 'en-US'
 */
function playPronunciation(word, lang) {
    if (!word) return;
    
    try {
        // 獲取用戶設置的語言偏好
        const userLang = lang || localStorage.getItem('langPreference') || 'en-US';
        
        console.log(`開始播放 "${word}" 的發音，使用語言: ${userLang}`);
        
        // 使用 Web Speech API 播放發音
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = userLang; // 設置語言
        utterance.rate = 0.9; // 速度稍慢一點
        
        // 獲取可用語音
        const voices = window.speechSynthesis.getVoices();
        
        // 獲取用戶設置的聲音偏好
        const voicePreference = localStorage.getItem('voicePreference');
        console.log(`用戶語音偏好: ${voicePreference}`);
        
        let selectedVoice = null;
        
        // 首先檢查用戶是否指定了特定語音
        if (voicePreference && voices.some(v => v.name === voicePreference)) {
            selectedVoice = voices.find(v => v.name === voicePreference);
            console.log(`使用用戶指定的語音: ${selectedVoice.name}`);
        } else {
            // 嚴格匹配完整語言代碼的語音
            const exactMatchVoices = voices.filter(voice => voice.lang === userLang);
            console.log(`找到 ${exactMatchVoices.length} 個完全匹配 ${userLang} 的語音`);
            
            if (exactMatchVoices.length > 0) {
                // 優先使用較自然的聲音
                const preferredVoice = exactMatchVoices.find(voice => 
                    voice.name.includes('Google') || voice.name.includes('Natural') || 
                    voice.name.includes('Premium')
                );
                
                if (preferredVoice) {
                    selectedVoice = preferredVoice;
                    console.log(`使用完全匹配且優質的語音: ${preferredVoice.name}`);
                } else {
                    selectedVoice = exactMatchVoices[0];
                    console.log(`使用第一個完全匹配的語音: ${exactMatchVoices[0].name}`);
                }
            } else {
                // 如果沒有完全匹配的語音，退回到匹配語言前綴
                const langPrefix = userLang.split('-')[0];
                const prefixMatchVoices = voices.filter(voice => voice.lang.includes(langPrefix));
                console.log(`找到 ${prefixMatchVoices.length} 個匹配語言前綴 ${langPrefix} 的語音`);
                
                if (prefixMatchVoices.length > 0) {
                    // 在前綴匹配中，仍然嘗試優先選擇完整匹配的區域
                    // 例如，對於en-US，嘗試找到含有US的語音
                    const region = userLang.split('-')[1];
                    const regionVoice = prefixMatchVoices.find(voice => 
                        voice.name.includes(region) || 
                        voice.name.includes('United States')
                    );
                    
                    if (regionVoice) {
                        selectedVoice = regionVoice;
                        console.log(`使用匹配區域 ${region} 的語音: ${regionVoice.name}`);
                    } else {
                        // 退而求其次，使用任何自然的聲音
                        const naturalVoice = prefixMatchVoices.find(voice => 
                            voice.name.includes('Google') || voice.name.includes('Natural') || 
                            voice.name.includes('Premium')
                        );
                        
                        if (naturalVoice) {
                            selectedVoice = naturalVoice;
                            console.log(`使用自然的聲音 (無區域匹配): ${naturalVoice.name}`);
                        } else {
                            selectedVoice = prefixMatchVoices[0];
                            console.log(`使用第一個匹配語言前綴的聲音: ${prefixMatchVoices[0].name}`);
                        }
                    }
                }
            }
        }
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`最終選擇的語音: ${selectedVoice.name}, 語言: ${selectedVoice.lang}`);
        } else {
            console.log('未找到合適的語音，使用系統默認語音');
        }
        
        // 強制清除之前的播放隊列
        window.speechSynthesis.cancel();
        
        // 新的播放請求
        window.speechSynthesis.speak(utterance);
        
        showNotification(`正在播放 "${word}" 的發音`, 'info');
    } catch (error) {
        console.error('發音播放失敗:', error);
        showNotification('發音功能不可用，請檢查瀏覽器設置', 'error');
    }
}

/**
 * 更新分頁控制
 */
function updatePagination() {
    console.log('更新分頁控制');
    
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        console.error('找不到分頁容器');
        return;
    }
    
    // 清空分頁容器
    paginationContainer.innerHTML = '';
    
    // 如果沒有單字或單字數量少於每頁顯示數量，不顯示分頁
    if (!filteredWords || filteredWords.length === 0) {
        console.log('沒有單字，不顯示分頁');
        return;
    }
    
    // 計算總頁數
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    
    if (totalPages <= 1) {
        console.log('只有一頁，不顯示分頁');
        return;
    }
    
    console.log(`總頁數: ${totalPages}, 當前頁: ${currentPage}`);
    
    // 創建上一頁按鈕
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'page-btn prev-btn';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.addEventListener('click', () => {
            displayVocabularyPage(currentPage - 1);
        });
        paginationContainer.appendChild(prevButton);
    }
    
    // 決定顯示哪些頁碼按鈕
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // 確保總是顯示5個按鈕（如果有足夠的頁數）
    if (endPage - startPage < 4 && totalPages > 5) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, 5);
        } else {
            startPage = Math.max(1, endPage - 4);
        }
    }
    
    // 創建頁碼按鈕
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'page-btn' + (i === currentPage ? ' active' : '');
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            if (i !== currentPage) {
                displayVocabularyPage(i);
            }
        });
        paginationContainer.appendChild(pageButton);
    }
    
    // 創建下一頁按鈕
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.className = 'page-btn next-btn';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.addEventListener('click', () => {
            displayVocabularyPage(currentPage + 1);
        });
        paginationContainer.appendChild(nextButton);
    }
}

/**
 * 搜索詞彙
 * @param {string} term - 搜索關鍵詞
 */
async function searchVocabulary(term) {
    console.log('搜索詞彙:', term);
    
    try {
    if (!term) {
        console.log('搜索詞為空，顯示當前詞彙表的所有單字');
        // 如果搜索詞為空，顯示當前詞彙表的所有單字
            await loadVocabularyData(currentVocabList);
        return;
    }
    
        // 使用數據庫搜索，確保window.db存在
        if (!window.db) {
            console.error('數據庫未初始化');
            showNotification('搜索失敗：數據庫未初始化', 'error');
        return;
    }
    
    console.log('當前詞彙表:', currentVocabList);
    
        // 根據當前選中的詞彙表決定搜索的範圍
        let words = [];
        
        if (currentVocabList === 'all') {
            // 從所有單字中搜索
            if (typeof window.db.searchWords === 'function') {
                words = await window.db.searchWords(term);
            } else {
                // 如果沒有專門的搜索功能，獲取所有單字後手動過濾
                const allWords = await window.db.getAllWords();
                words = filterWordsByTerm(allWords, term);
            }
        } else if (['notLearned', 'learning', 'mastered'].includes(currentVocabList)) {
            // 從特定狀態的單字中搜索
            const statusWords = await window.db.getWordsByStatus(currentVocabList);
            words = filterWordsByTerm(statusWords, term);
        } else {
            // 從特定詞彙表中搜索
            const listWords = await window.db.getWordsInList(currentVocabList);
            words = filterWordsByTerm(listWords, term);
        }
        
        console.log('搜索結果單字數量:', words.length);
        
        // 更新過濾後的單字列表
        filteredWords = words;
        
        // 重置頁碼並顯示結果
    currentPage = 1;
    displayVocabularyPage();
        
        // 更新搜索結果提示
        showNotification(`找到 ${words.length} 個匹配的單字`, 'info');
    } catch (error) {
        console.error('搜索失敗:', error);
        showNotification('搜索失敗: ' + error.message, 'error');
    }
}

/**
 * 根據關鍵詞過濾單字列表
 * @param {Array} words - 單字列表
 * @param {string} term - 搜索關鍵詞
 * @returns {Array} - 過濾後的單字列表
 */
function filterWordsByTerm(words, term) {
    if (!term || !words || !Array.isArray(words)) return [];
    
    const lowerTerm = term.toLowerCase();
    
    return words.filter(word => {
        return (
            (word.word && word.word.toLowerCase().includes(lowerTerm)) || 
            (word.meaning && word.meaning.toLowerCase().includes(lowerTerm)) ||
            (word.phonetic && word.phonetic.toLowerCase().includes(lowerTerm)) ||
            (word.partOfSpeech && translatePartOfSpeech(word.partOfSpeech).toLowerCase().includes(lowerTerm)) ||
            (word.examples && Array.isArray(word.examples) && word.examples.some(example => 
                example.toLowerCase().includes(lowerTerm)
            )) ||
            (word.examples && typeof word.examples === 'string' && word.examples.toLowerCase().includes(lowerTerm))
        );
    });
}

/**
 * 從劍橋詞典獲取音標（新版實現）
 * @param {string} word - 要查詢的單字
 * @returns {Promise<string>} - 返回美式英語音標
 */
async function getCambridgePronunciation(word) {
  try {
    // 首先嘗試使用Free Dictionary API
    const freeDictPhonetic = await getPhoneticFromFreeDictionary(word);
    if (freeDictPhonetic) {
      console.log(`Free Dictionary API 成功獲取到音標: ${freeDictPhonetic}`);
      return freeDictPhonetic;
    }
    
    // 如果Free Dictionary API失敗，嘗試使用CORS代理訪問劍橋詞典
    const corsProxy = "https://corsproxy.io/?";
    const url = `${corsProxy}https://dictionary.cambridge.org/zht/dictionary/english/${encodeURIComponent(word)}`;
    console.log(`嘗試從 ${url} 獲取音標`);
    
    const response = await fetch(url);
    const html = await response.text();

    // 修正正則表達式以匹配劍橋詞典的美式音標格式
    const pronunciationRegex = /id="us_pron_1".*?<span class="ipa">(.*?)<\/span>/s;
    const match = pronunciationRegex.exec(html);

    if (match && match[1]) {
      let pronunciation = `/${match[1]}/`;
      console.log(`成功獲取到音標: ${pronunciation}`);
      return pronunciation;
    } else {
      console.log(`未找到音標，嘗試備用正則表達式`);
      // 備用正則表達式
      const backupRegex = /class="pron-info.*?dpron-i".*?<span class="ipa">(.*?)<\/span>/s;
      const backupMatch = backupRegex.exec(html);
      
      if (backupMatch && backupMatch[1]) {
        let pronunciation = `/${backupMatch[1]}/`;
        console.log(`使用備用方法獲取到音標: ${pronunciation}`);
        return pronunciation;
      }
      
      console.log(`所有方法均未找到音標`);
      return null;
    }
  } catch (error) {
    console.error("取得音標時發生錯誤:", error);
    return null;
  }
}

/**
 * 從劍橋詞典獲取音標 (舊版函數，現使用新的實現)
 * @param {string} word - 要查詢的單字
 * @returns {Promise<string>} - 返回美式英語音標
 */
async function fetchPhoneticFromCambridge(word) {
    if (!word) return '';
    
    try {
        showNotification(`正在從劍橋詞典獲取 "${word}" 的音標...`, 'info');
        
        // 嘗試使用新的音標獲取函數
        const pronunciation = await getCambridgePronunciation(word);
        
        if (pronunciation) {
            console.log(`從劍橋詞典獲取到 "${word}" 的音標: ${pronunciation}`);
            showNotification(`成功獲取 "${word}" 的音標`, 'success');
            return pronunciation;
        }
        
        // 如果新函數無法獲取音標，使用備用的手動輸入數據庫
        const phonetics = {
            'a': '/ə, eɪ/',
            'abroad': '/əˈbrɑːd/',
            'about': '/əˈbaʊt/',
            'above': '/əˈbʌv/',
            'across': '/əˈkrɔs/',
            'able': '/ˈeɪ.bəl/',
            'act': '/ækt/',
            'action': '/ˈæk.ʃən/',
            'add': '/æd/',
            'address': '/əˈdres, ˈæd.res/',
            'adult': '/ˈæd.ʌlt, əˈdʌlt/',
            'after': '/ˈæf.tɚ/',
            'again': '/əˈɡen/',
            'against': '/əˈɡenst/',
            'age': '/eɪdʒ/',
            'agree': '/əˈɡriː/',
            'air': '/er/',
            'all': '/ɔːl/',
            'allow': '/əˈlaʊ/',
            'almost': '/ˈɔːl.moʊst/',
            'alone': '/əˈloʊn/',
            'along': '/əˈlɑːŋ/',
            'already': '/ɔːlˈre.di/',
            'also': '/ˈɔːl.soʊ/',
            'always': '/ˈɔːl.weɪz/',
            'and': '/ənd, ən, ænd/',
            'animal': '/ˈæn.ɪ.məl/',
            'another': '/əˈnʌð.ɚ/',
            'answer': '/ˈæn.sɚ/',
            'any': '/ˈen.i/',
            'anyone': '/ˈen.i.wʌn/',
            'anything': '/ˈen.i.θɪŋ/',
            'apartment': '/əˈpɑːrt.mənt/',
            'apple': '/ˈæp.əl/',
            'April': '/ˈeɪ.prəl/'
        };
        
        // 先檢查是否在本地數據庫中有這個單字的音標
        if (phonetics[word.toLowerCase()]) {
            const phonetic = phonetics[word.toLowerCase()];
            console.log(`從本地數據庫獲取到 "${word}" 的音標: ${phonetic}`);
            showNotification(`成功獲取 "${word}" 的音標`, 'success');
            return phonetic;
        }
        
        // 如果本地數據庫中沒有，提示用戶手動輸入
        console.log(`無法從本地數據庫找到 "${word}" 的音標`);
        showNotification(`請手動輸入 "${word}" 的音標`, 'info');
        
        // 顯示輸入對話框
        const userInput = prompt(`請為 "${word}" 輸入美式音標 (例如: /əˈbraʊd/):`);
        
        if (userInput) {
            console.log(`用戶輸入的音標: ${userInput}`);
            showNotification(`已使用手動輸入的音標`, 'success');
            return userInput;
        } else {
            console.log('用戶取消輸入音標');
            showNotification('未提供音標', 'warning');
            return '';
        }
    } catch (error) {
        console.error('獲取音標失敗:', error);
        showNotification('獲取音標失敗，請稍後再試或手動輸入', 'error');
        return '';
    }
}

/**
 * 從劍橋詞典獲取音標
 * @param {string} word - 單字
 * @returns {Promise<string>} - 音標
 */
async function getCambridgePhonetic(word) {
    try {
        // 首先嘗試使用新的函數獲取音標
        const pronunciation = await getCambridgePronunciation(word);
        if (pronunciation) {
            return pronunciation;
        }
        
        // 如果新函數無法獲取，使用原始方法
        const response = await fetch(`https://dictionary.cambridge.org/dictionary/english/${encodeURIComponent(word)}`);
        const html = await response.text();
        
        // 使用正則表達式匹配美式音標
        const usPhoneticMatch = html.match(/\/us\/pronunciation\/([^"]+)/);
        if (usPhoneticMatch) {
            return usPhoneticMatch[1];
        }
        
        return '';
    } catch (error) {
        console.error('獲取音標失敗:', error);
        return '';
    }
}

/**
 * 驗證音標格式
 * @param {string} phonetic - 需要驗證的音標
 * @returns {object} - 驗證結果，包含isValid和message
 */
function validatePhonetic(phonetic) {
    // 如果音標為空，視為有效（可能是尚未填寫）
    if (!phonetic) {
        return { isValid: true, message: '' };
    }
    
    // 檢查音標是否被斜線包圍
    if (!/^\/.*\/$/.test(phonetic)) {
        return { 
            isValid: false, 
            message: '音標應以斜線包圍，例如：/əˈbraʊd/' 
        };
    }
    
    // 檢查音標是否包含常見的美式音標字符
    const validPhoneticPattern = /^\/[a-zəɚɝɑɔɛɪʊʌʒʤθðŋɹjwh\u02C8\u02CC\u02D0ˈˌːʔ\s·\.,'ˑ-]+\/$/i;
    if (!validPhoneticPattern.test(phonetic)) {
        return { 
            isValid: false, 
            message: '音標包含無效字符，請使用標準美式音標字符' 
        };
    }
    
    // 檢查音標中的重音符號位置
    if (phonetic.includes('ˈ') || phonetic.includes('ˌ')) {
        const stressPattern = /ˈ[^ˈˌ]+|ˌ[^ˈˌ]+/g;
        if (!stressPattern.test(phonetic.slice(1, -1))) {
            return { 
                isValid: false, 
                message: '重音符號位置不正確，請檢查' 
            };
        }
    }
    
    return { isValid: true, message: '' };
}

/**
 * 顯示音標格式提示
 * @param {HTMLInputElement} inputElement - 輸入元素
 */
function showPhoneticFormatHint(inputElement) {
    // 創建或獲取音標提示元素
    let hintElement = document.getElementById(`${inputElement.id}-hint`);
    
    if (!hintElement) {
        hintElement = document.createElement('div');
        hintElement.id = `${inputElement.id}-hint`;
        hintElement.classList.add('phonetic-hint');
        hintElement.style.fontSize = '0.8rem';
        hintElement.style.color = '#666';
        hintElement.style.marginTop = '2px';
        inputElement.parentNode.appendChild(hintElement);
    }
    
    hintElement.innerHTML = '音標格式說明：<br>1. 請使用美式音標<br>2. 音標應以斜線包圍，例如：/əˈbraʊd/<br>3. 重音符號 ˈ 表示主重音，ˌ 表示次重音';
}

/**
 * 新增單字
 */
async function addNewWord() {
    const wordInput = document.getElementById('newWord');
    const phoneticInput = document.getElementById('newPhonetic');
    const meaningInput = document.getElementById('newMeaning');
    const exampleInput = document.getElementById('newExample');
    const partOfSpeechInput = document.getElementById('newPartOfSpeech');
    
    const word = wordInput.value.trim();
    const phonetic = phoneticInput.value.trim();
    const meaning = meaningInput.value.trim();
    const example = exampleInput.value.trim();
    const partOfSpeech = partOfSpeechInput.value.trim();
    
    if (!word || !meaning) {
        showNotification('請填寫單字和中文解釋', 'error');
        return;
    }
    
    // 驗證音標
    const phoneticValidation = validatePhonetic(phonetic);
    if (!phoneticValidation.isValid) {
        showNotification(phoneticValidation.message, 'warning');
        phoneticInput.focus();
        showPhoneticFormatHint(phoneticInput);
        return;
    }
    
    try {
        // 如果沒有填寫音標，自動獲取
        let finalPhonetic = phonetic;
        if (!finalPhonetic) {
            finalPhonetic = await getCambridgePhonetic(word);
            if (finalPhonetic) {
                // 再次驗證獲取的音標
                const autoPhoneticValidation = validatePhonetic(finalPhonetic);
                if (!autoPhoneticValidation.isValid) {
                    console.warn('自動獲取的音標格式不正確:', finalPhonetic);
                    finalPhonetic = '';
                }
            }
        }
        
        const newWord = {
            word,
            phonetic: finalPhonetic,
            meaning,
            example,
            partOfSpeech,
            status: 'new',
            createdAt: new Date().toISOString()
        };
        
        await window.db.addWord(newWord);
        await loadVocabularyData();
        
        // 清空輸入框
        wordInput.value = '';
        phoneticInput.value = '';
        meaningInput.value = '';
        exampleInput.value = '';
        partOfSpeechInput.value = '';
        
        // 關閉模態框
        const modal = document.getElementById('addWordModal');
        modal.style.display = 'none';
        
        showNotification('單字新增成功', 'success');
    } catch (error) {
        console.error('新增單字失敗:', error);
        showNotification('新增單字失敗', 'error');
    }
}

/**
 * 保存編輯的單字
 */
async function saveEditedWord() {
    console.log('saveEditedWord 函數被調用');
    try {
        // 獲取表單元素
        const wordId = document.getElementById('editWordId')?.value;
        const wordInput = document.getElementById('editWord');
        const phoneticInput = document.getElementById('editPhonetic');
        const meaningInput = document.getElementById('editMeaning');
        const exampleInput = document.getElementById('editExamples');
        const partOfSpeechInput = document.getElementById('editPartOfSpeech');
        const statusInput = document.getElementById('editStatus');
        
        console.log('獲取到元素ID:', {
            wordId: Boolean(wordId),
            wordInput: Boolean(wordInput),
            phoneticInput: Boolean(phoneticInput),
            meaningInput: Boolean(meaningInput),
            exampleInput: Boolean(exampleInput),
            partOfSpeechInput: Boolean(partOfSpeechInput),
            statusInput: Boolean(statusInput)
        });
        
        // 檢查必要元素是否存在
        if (!wordId || !wordInput || !meaningInput || !exampleInput || !statusInput) {
            console.error('找不到必要的表單元素:',
                !wordId ? 'editWordId' : '',
                !wordInput ? 'editWord' : '',
                !meaningInput ? 'editMeaning' : '',
                !exampleInput ? 'editExamples' : '',
                !statusInput ? 'editStatus' : ''
            );
            showNotification('表單元素缺失，無法保存', 'error');
        return;
    }
    
    // 獲取表單數據
        const word = wordInput.value?.trim() || '';
        const phonetic = phoneticInput.value?.trim() || '';
        const meaning = meaningInput.value?.trim() || '';
        const examples = exampleInput.value?.trim() || '';
        const partOfSpeech = partOfSpeechInput.value?.trim() || '';
        const status = statusInput.value || 'notLearned';
        
        console.log('表單數據:', { wordId, word, phonetic, meaning, examples, partOfSpeech, status });
        
        // 基本驗證
        if (!wordId) {
            showNotification('缺少單字ID，無法保存', 'error');
        return;
    }
    
        if (!word || !meaning) {
            showNotification('請填寫單字和中文解釋', 'error');
        return;
    }
    
        // 驗證音標
        let finalPhonetic = phonetic;
        if (phonetic) {
            const phoneticValidation = validatePhonetic(phonetic);
            if (!phoneticValidation.isValid) {
                showNotification(phoneticValidation.message, 'warning');
                phoneticInput.focus();
                showPhoneticFormatHint(phoneticInput);
        return;
    }
        } else {
            // 如果沒有填寫音標，自動獲取
            try {
                console.log('嘗試自動獲取音標');
                finalPhonetic = await getCambridgePhonetic(word);
                console.log('自動獲取的音標:', finalPhonetic);
                
                if (finalPhonetic) {
                    // 再次驗證獲取的音標
                    const autoPhoneticValidation = validatePhonetic(finalPhonetic);
                    if (!autoPhoneticValidation.isValid) {
                        console.warn('自動獲取的音標格式不正確:', finalPhonetic);
                        finalPhonetic = '';
                    }
                }
            } catch (phoneticError) {
                console.error('自動獲取音標失敗:', phoneticError);
                finalPhonetic = '';
            }
        }
        
        // 構建更新對象
        const wordIdNumber = parseInt(wordId, 10);
        if (isNaN(wordIdNumber)) {
            throw new Error(`單字ID "${wordId}" 不是有效的數字`);
        }
        
    const updatedWord = {
            id: wordIdNumber,
            word,
            phonetic: finalPhonetic,
            meaning,
            examples,
            partOfSpeech,
            status,
            updatedAt: new Date().toISOString()
        };
        
        console.log('準備更新單字對象:', updatedWord);
        
        // 檢查數據庫對象
        if (!window.db) {
            console.error('數據庫對象不存在');
            throw new Error('數據庫模塊未初始化');
        }
        
        if (typeof window.db.updateWord !== 'function') {
            console.error('updateWord 方法不可用');
            throw new Error('數據庫更新方法不可用');
        }
        
        // 更新數據庫
        console.log('調用 window.db.updateWord 前');
        await window.db.updateWord(updatedWord);
        console.log('數據庫更新成功');
        
        // 重新加載數據
        await loadVocabularyData();
        
        // 關閉模態框
        hideEditWordModal();
        
        // 顯示成功通知
        showNotification('單字更新成功', 'success');
    } catch (error) {
        console.error('更新單字失敗:', error);
        showNotification('更新單字失敗: ' + error.message, 'error');
    }
}

/**
 * 刪除單字
 */
async function deleteWord(wordId) {
    console.log('刪除單字:', wordId);
    
    if (!wordId) {
        console.error('無效的單字ID');
        showNotification('刪除失敗：無效的單字ID', 'error');
        return;
    }
    
    try {
        // 尋找要刪除的單字以顯示名稱
        const wordToDelete = filteredWords.find(w => w.id === wordId);
        const wordName = wordToDelete ? wordToDelete.word : '未知單字';
        
        // 刪除單字
        await window.db.deleteWord(wordId);
        console.log('單字刪除成功');
        
        // 重新載入詞彙數據
        await loadVocabularyData();
            
            // 顯示成功訊息
        showNotification(`單字「${wordName}」已成功刪除`, 'success');
    } catch (error) {
        console.error('刪除單字失敗:', error);
        showNotification('刪除單字失敗，請稍後再試', 'error');
    }
}

/**
 * 查看單字詳情
 * @param {number} wordId - 單字ID
 */
async function viewWordDetails(wordId) {
    console.log(`顯示單字詳情: ${wordId}`);
    
    try {
        // 使用數據庫查詢單字
        let word;
    
    // 查找單字
        if (filteredWords && Array.isArray(filteredWords)) {
            // 先從已載入的單字中尋找
            word = filteredWords.find(w => w.id === wordId);
        }
        
    if (!word) {
            console.log(`在已載入的單字中找不到ID為 ${wordId} 的單字，嘗試從數據庫中查詢`);
            // 如果找不到，可能是直接點擊了單字，嘗試從數據庫中獲取
            if (window.db && typeof window.db.getWordById === 'function') {
                word = await window.db.getWordById(wordId);
            } else {
                // 嘗試使用getAllWords()並查找
                const allWords = await window.db.getAllWords();
                word = allWords.find(w => w.id === wordId);
            }
        }
        
    if (!word) {
        console.error(`找不到 ID 為 ${wordId} 的單字`);
            showNotification('找不到該單字', 'error');
        return;
    }
    
    // 獲取詳情容器
    const detailsContent = document.getElementById('wordDetailsContent');
    if (!detailsContent) {
        console.error('找不到單字詳情容器');
            showNotification('無法顯示單字詳情', 'error');
        return;
    }
    
    // 格式化例句
    let examplesHtml = '';
    if (word.examples && word.examples.length > 0) {
            const examplesList = Array.isArray(word.examples) 
                ? word.examples 
                : word.examples.split('\n').filter(e => e.trim() !== '');
                
        examplesHtml = `
            <div class="details-section">
                <h4>例句</h4>
                <ul class="examples-list">
                        ${examplesList.map(example => `<li>${example}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 格式化學習狀態
        let statusText = translateStatus(word.status);
        let statusClass = word.status;
        
        // 生成詳情HTML
        const detailsHtml = `
            <div class="word-details-container">
            <div class="details-header">
                    <h2>${word.word}</h2>
                    <div class="header-info">
                        <div class="phonetic-container">
                            ${word.phonetic ? `<div class="phonetic">${word.phonetic}</div>` : '<div class="phonetic">尚無音標</div>'}
                            <button class="btn secondary fetch-phonetic-btn" data-word="${word.word}" data-id="${word.id}" title="使用全部音標獲取的方法">
                                <i class="fas fa-sync-alt"></i> 獲取音標
                            </button>
            </div>
                        ${word.partOfSpeech ? `<div class="part-of-speech">${translatePartOfSpeech(word.partOfSpeech)}</div>` : ''}
                        <div class="status-badge ${statusClass}">${statusText}</div>
                        <button class="pronunciation-btn details-pronunciation-btn" title="播放發音" onclick="playPronunciation('${word.word.replace(/'/g, "\\'")}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            </div>
            
            <div class="details-section">
                    <h4>意思</h4>
                    <div class="meaning">${word.meaning}</div>
                </div>
                
                ${examplesHtml}
                
                <div class="details-actions">
                    <button class="btn secondary add-to-list-btn" onclick="addToWordList(${word.id})">
                        <i class="fas fa-list"></i> 加入詞彙表
                    </button>
                    <button class="btn danger delete-word-btn" onclick="if(confirm('確定要刪除單字「${word.word}」嗎？')) deleteWord(${word.id})">
                        <i class="fas fa-trash"></i> 刪除
                    </button>
                </div>
                </div>
        `;
        
        // 更新詳情內容
        detailsContent.innerHTML = detailsHtml;
        
        // 綁定獲取音標按鈕事件
        const fetchPhoneticBtn = detailsContent.querySelector('.fetch-phonetic-btn');
        if (fetchPhoneticBtn) {
            fetchPhoneticBtn.addEventListener('click', async () => {
                const wordText = fetchPhoneticBtn.getAttribute('data-word');
                const wordId = parseInt(fetchPhoneticBtn.getAttribute('data-id'));
                
                if (!wordText || !wordId) {
                    showNotification('無法獲取單字信息', 'error');
                    return;
                }
                
                try {
                    fetchPhoneticBtn.disabled = true;
                    fetchPhoneticBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 獲取中...';
                    
                    // 使用全部音標獲取的方法獲取音標
                    const phonetic = await getPhoneticFromFreeDictionary(wordText);
                    
                    if (phonetic) {
                        // 更新單字的音標
                        await updateWordPhonetic(wordId, phonetic);
                        
                        // 更新頁面上的音標顯示
                        const phoneticContainer = detailsContent.querySelector('.phonetic');
                        if (phoneticContainer) {
                            phoneticContainer.textContent = phonetic;
                        }
                        
                        showNotification(`成功獲取音標: ${phonetic}`, 'success');
                    } else {
                        // 如果主要方法失敗，嘗試使用舊方法
                        const backupPhonetic = await fetchPhoneticFromCambridge(wordText);
                        
                        if (backupPhonetic) {
                            await updateWordPhonetic(wordId, backupPhonetic);
                            
                            // 更新頁面上的音標顯示
                            const phoneticContainer = detailsContent.querySelector('.phonetic');
                            if (phoneticContainer) {
                                phoneticContainer.textContent = backupPhonetic;
                            }
                            
                            showNotification(`使用備用方法獲取音標: ${backupPhonetic}`, 'success');
                        } else {
                            showNotification('無法獲取音標，請手動輸入', 'warning');
                        }
                    }
                } catch (error) {
                    console.error('獲取音標過程中發生錯誤:', error);
                    showNotification('獲取音標失敗', 'error');
                } finally {
                    fetchPhoneticBtn.disabled = false;
                    fetchPhoneticBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 獲取音標';
                }
            });
        }
        
        // 顯示詳情模態框
    showWordDetailsModal();
        
    } catch (error) {
        console.error('顯示單字詳情時發生錯誤:', error);
        showNotification('顯示單字詳情時發生錯誤', 'error');
    }
}

/**
 * 更新單字的音標
 * @param {number} wordId - 單字ID
 * @param {string} phonetic - 音標
 */
async function updateWordPhonetic(wordId, phonetic) {
    if (!wordId || !phonetic) return;
    
    try {
        // 從數據庫獲取單字
        const word = await window.db.getWordById(wordId);
        if (!word) {
            showNotification('找不到單字', 'error');
            return;
        }
        
        // 更新音標
        word.phonetic = phonetic;
        
        // 保存到數據庫
        await window.db.updateWord(word);
        
        // 重新載入詞彙數據
        await loadVocabularyData();
        
        // 更新詳情視窗中的音標
        const phoneticElement = document.querySelector('#wordDetailsContent .phonetic');
        if (phoneticElement) {
            phoneticElement.textContent = phonetic;
        }
        
        showNotification(`單字 "${word.word}" 的音標已更新`, 'success');
    } catch (error) {
        console.error('更新音標失敗:', error);
        showNotification('更新音標失敗，請稍後再試', 'error');
    }
}

/**
 * 顯示新增單字的模態框
 */
function showAddWordModal() {
    console.log('顯示新增單字的模態框');
    
    const modal = document.getElementById('addWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到模態框或遮罩層元素');
        return;
    }
    
    // 重置表單
    const form = document.getElementById('addWordForm');
    if (form) {
        form.reset();
    }
    
    // 顯示模態框
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // 添加活動類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
}

/**
 * 隱藏新增單字的模態框
 */
function hideAddWordModal() {
    console.log('隱藏新增單字的模態框');
    
    const modal = document.getElementById('addWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到模態框或遮罩層元素');
        return;
    }
    
    // 移除活動類
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 延遲隱藏，以便完成過渡動畫
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * 顯示編輯單字的模態框
 * @param {Object|string} word - 單字對象或單字對象的JSON字符串
 */
function showEditWordModal(word) {
    console.log('顯示編輯單字的模態框', word);
    
    try {
        // 如果word是字符串，嘗試解析為對象
        if (typeof word === 'string') {
            try {
                word = JSON.parse(word);
            } catch (error) {
                console.error('解析單字對象失敗:', error);
                showNotification('無法解析單字數據', 'error');
        return;
    }
        }
        
        // 檢查word是否是有效的對象
        if (!word || typeof word !== 'object' || !word.id) {
            console.error('無效的單字對象:', word);
            showNotification('無效的單字數據', 'error');
        return;
    }
    
        const modal = document.getElementById('editWordModal');
        const overlay = document.getElementById('modalOverlay');
        
        if (!modal || !overlay) {
            console.error('找不到模態框或遮罩層元素');
        return;
    }
    
        // 填充表單
        document.getElementById('editWordId').value = word.id;
        document.getElementById('editWord').value = word.word;
        document.getElementById('editPhonetic').value = word.phonetic || '';
        document.getElementById('editPartOfSpeech').value = word.partOfSpeech || '';
        document.getElementById('editMeaning').value = word.meaning;
        document.getElementById('editExamples').value = word.examples ? (Array.isArray(word.examples) ? word.examples.join('\n') : word.examples) : '';
        document.getElementById('editStatus').value = word.status;
        
        // 顯示音標格式提示
        showPhoneticFormatHint(document.getElementById('editPhonetic'));
        
        // 顯示模態框
        modal.style.display = 'block';
        overlay.style.display = 'block';
        
        // 添加活動類
        setTimeout(() => {
            modal.classList.add('active');
            overlay.classList.add('active');
        }, 10);
    } catch (error) {
        console.error('顯示編輯單字模態框時發生錯誤:', error);
        showNotification('顯示編輯單字模態框失敗', 'error');
    }
}

/**
 * 隱藏編輯單字的模態框
 */
function hideEditWordModal() {
    console.log('隱藏編輯單字的模態框');
    
    const modal = document.getElementById('editWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到模態框或遮罩層元素');
        return;
    }
    
    // 移除活動類
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 延遲隱藏，以便完成過渡動畫
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * 顯示單字詳情的模態框
 */
function showWordDetailsModal() {
    console.log('顯示單字詳情的模態框');
    
    const modal = document.getElementById('wordDetailsModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到模態框或遮罩層元素');
        return;
    }
    
    // 顯示模態框
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // 添加活動類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
}

/**
 * 隱藏單字詳情的模態框
 */
function hideWordDetailsModal() {
    console.log('隱藏單字詳情的模態框');
    
    const modal = document.getElementById('wordDetailsModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到模態框或遮罩層元素');
        return;
    }
    
    // 移除活動類
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 延遲隱藏，以便完成過渡動畫
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * 將單字加入記憶卡
 * @param {number} wordId - 單字ID
 */
function addToFlashcards(wordId) {
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('全局詞彙數據不可用');
        alert('無法加入記憶卡，請重新整理頁面後再試');
        return;
    }
    
    // 查找單字
    const word = window.appData.vocabulary.find(w => w.id === wordId);
    if (!word) {
        console.error(`找不到ID為 ${wordId} 的單字`);
        alert('找不到指定的單字');
        return;
    }
    
    // 將單字狀態設為學習中
    word.status = 'learning';
    
    // 保存到本地儲存
    if (typeof saveAppData === 'function') {
        saveAppData();
    } else {
        console.warn('saveAppData 函數不可用');
    }
    
    // 更新UI
    loadVocabularyData(currentVocabList);
    
    // 關閉詳情模態框
    hideWordDetailsModal();
    
    // 切換到記憶卡頁面
    switchPage('flashcards');
    
    // 顯示成功訊息
    alert(`單字 "${word.word}" 已加入記憶卡`);
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
 * 翻譯學習狀態到中文
 * @param {string} status - 英文狀態
 * @returns {string} - 中文狀態
 */
function translateStatus(status) {
    const translations = {
        'new': '待學習',
        'learning': '學習中',
        'mastered': '已掌握',
        'difficult': '困難'
    };
    
    return translations[status] || status;
}

/**
 * 初始化導入/導出功能
 */
async function initImportExportFeatures() {
    console.log('初始化導入/導出功能');
    
    // 綁定導入按鈕事件
    const importBtn = document.getElementById('importBtn');
    const importFileInput = document.getElementById('importFileInput');
    
    if (importBtn && importFileInput) {
        // 先移除舊的事件監聽器，避免重複綁定
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);
        
        const newImportFileInput = importFileInput.cloneNode(true);
        importFileInput.parentNode.replaceChild(newImportFileInput, importFileInput);
        
        // 添加新的事件監聽器
        newImportBtn.addEventListener('click', () => {
            console.log('點擊匯入按鈕');
            newImportFileInput.click();
        });
        
        newImportFileInput.addEventListener('change', async (e) => {
            console.log('文件選擇變更事件觸發');
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                await importVocabulary(file);
                // 清空文件輸入，以便下次選擇同一文件時也能觸發事件
                newImportFileInput.value = '';
            }
        });
    }
    
    // 綁定匯出詞彙按鈕事件
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        // 先移除舊的事件監聽器
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        
        // 添加新的事件監聽器
        newExportBtn.addEventListener('click', () => {
            console.log('點擊匯出詞彙按鈕');
            showExportDialog();
        });
    }
    
    // 添加基礎2005單字導入按鈕
    addBasic2005ImportButton();
}

/**
 * 添加基礎2005單字導入按鈕
 */
function addBasic2005ImportButton() {
    // 獲取導入/導出按鈕容器
    const importExportContainer = document.querySelector('.tools-container');
    if (!importExportContainer) {
        console.error('找不到導入/導出按鈕容器');
        return;
    }
    
    // 檢查是否已存在導入基礎2005單字按鈕
    let importBasic2005Btn = document.getElementById('importBasic2005Btn');
    if (importBasic2005Btn) {
        console.log('已存在導入基礎2005單字按鈕，移除舊的按鈕');
        // 移除舊按鈕，避免重複
        importBasic2005Btn.parentNode.removeChild(importBasic2005Btn);
    }
    
    // 創建基礎2005單字導入按鈕
    importBasic2005Btn = document.createElement('button');
    importBasic2005Btn.id = 'importBasic2005Btn';
    importBasic2005Btn.className = 'btn btn-primary';
    importBasic2005Btn.innerHTML = '<i class="fas fa-book"></i> 導入國中基礎2005單字';
    importBasic2005Btn.title = '導入國中基礎2005個單字';
    
    // 添加到容器
    importExportContainer.appendChild(importBasic2005Btn);
    
    console.log('添加導入基礎2005單字按鈕');
    
    // 添加點擊事件
    importBasic2005Btn.addEventListener('click', async () => {
        console.log('點擊導入基礎2005單字按鈕');
        try {
            if (confirm('確定要導入國中基礎2005個單字嗎？這將創建一個新的詞彙組並添加所有單字。')) {
                // 禁用按鈕，避免重複點擊
                importBasic2005Btn.disabled = true;
                importBasic2005Btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 導入中...';
                showNotification('開始導入國中基礎2005單字，請稍候...', 'info');
                
                console.log('調用 window.db.importBasic2005Words 函數');
                if (window.db && typeof window.db.importBasic2005Words === 'function') {
                    console.log('window.db.importBasic2005Words 函數已找到，開始執行');
                    try {
                        // 调用导入函数
                        const result = await window.db.importBasic2005Words();
                        console.log('導入結果:', result);
                        
                        if (result.success) {
                            showNotification(`導入完成！新增: ${result.added} 個，已存在: ${result.skipped} 個`, 'success');
                            
                            // 重載詞彙列表
                            await initVocabLists();
                            await updateVocabListCounts();
                            await loadVocabularyData();
                            
                            // 選擇新導入的詞彙組
                            const wordListItems = document.querySelectorAll('.vocab-list-item');
                            for (const item of wordListItems) {
                                if (item.querySelector('.list-name').textContent === '國中基礎2005單字') {
                                    item.click();
                                    break;
                                }
                            }
    } else {
                            showNotification(`導入失敗: ${result.error}`, 'error');
                        }
                    } catch (error) {
                        console.error('執行導入函數時發生錯誤:', error);
                        showNotification('導入過程中發生錯誤: ' + error.message, 'error');
                    }
                } else {
                    console.error('window.db.importBasic2005Words 函數不可用');
                    showNotification('導入功能不可用，請確保已加載相關資源', 'error');
                    
                    // 嘗試動態加載 database.js
                    const script = document.createElement('script');
                    script.src = 'js/database.js';
                    script.onload = async () => {
                        showNotification('資源已載入，正在重試導入...', 'info');
                        
                        // 確保 window.db 已初始化
                        if (!window.db) {
                            showNotification('資料庫對象未初始化，無法進行導入', 'error');
                return;
            }
            
                        if (typeof window.db.importBasic2005Words === 'function') {
                            try {
                                const result = await window.db.importBasic2005Words();
                                if (result.success) {
                                    showNotification(`導入完成！新增: ${result.added} 個，已存在: ${result.skipped} 個`, 'success');
                                    
                                    // 重載詞彙列表
                                    await initVocabLists();
                                    await updateVocabListCounts();
                                    await loadVocabularyData();
                                } else {
                                    showNotification(`導入失敗: ${result.error}`, 'error');
                                }
            } catch (error) {
                                console.error('重試導入失敗:', error);
                                showNotification('重試導入失敗: ' + error.message, 'error');
            }
    } else {
                            showNotification('加載資源後仍無法找到導入函數', 'error');
                        }
                    };
                    script.onerror = () => {
                        showNotification('無法載入導入功能所需資源', 'error');
                    };
                    document.head.appendChild(script);
                }
                
                // 請求完成後，無論結果如何，恢復按鈕狀態
                importBasic2005Btn.disabled = false;
                importBasic2005Btn.innerHTML = '<i class="fas fa-book"></i> 導入國中基礎2005單字';
            }
        } catch (error) {
            console.error('導入國中基礎2005單字時發生未知錯誤:', error);
            showNotification('導入過程中發生未知錯誤', 'error');
            
            // 恢復按鈕狀態
            importBasic2005Btn.disabled = false;
            importBasic2005Btn.innerHTML = '<i class="fas fa-book"></i> 導入國中基礎2005單字';
        }
    });
}

/**
 * 匯出詞彙列表 (已棄用，請使用 exportSelectedVocabulary)
 * @param {string} format - 匯出格式（'json' 或 'csv'）
 * @param {Array} wordList - 要匯出的詞彙列表，如果未提供則匯出所有詞彙
 * @deprecated 此函數已被棄用，請使用新的 exportSelectedVocabulary 函數
 */
function exportVocabulary(format = 'json', wordList = null) {
    console.log('警告: exportVocabulary 函數已棄用，請使用 exportSelectedVocabulary');
    
    // 如果已經在匯出中，防止重複調用
    if (isExporting) {
        console.log('匯出操作正在進行中，忽略重複調用');
        return;
    }
    
    try {
        // 鎖定匯出狀態
        isExporting = true;
        
        // 使用新的函數進行匯出
        if (wordList) {
            exportSelectedVocabulary('custom', '自定義匯出', format);
        } else {
            exportSelectedVocabulary('filtered', '目前過濾結果', format);
        }
    } catch (error) {
        console.error('匯出詞彙失敗:', error);
        showNotification('匯出詞彙失敗: ' + error.message, 'error');
    } finally {
        // 釋放匯出鎖定
        setTimeout(() => {
            isExporting = false;
        }, 500);
    }
}

/**
 * 使用創建元素方式下載檔案
 * @param {string} content - 檔案內容
 * @param {string} filename - 檔案名稱
 * @param {string} contentType - 內容類型
 */
function downloadWithCreateElement(content, filename, contentType) {
    try {
        // 創建 Blob
        const blob = new Blob([content], { type: contentType });
        
        // 創建 URL
        const url = URL.createObjectURL(blob);
        
        // 創建臨時連結
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // 添加到文檔
        document.body.appendChild(link);
        
        // 模擬點擊
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        
        return true;
    } catch (error) {
        console.error('下載檔案失敗:', error);
        return false;
    }
}

/**
 * 匯入詞彙
 * @param {File} file - 要匯入的文件
 */
async function importVocabulary(file) {
    console.log(`匯入詞彙，文件: ${file.name}, 鎖定狀態: ${isImporting}`);
    
    // 如果已經在匯入中，防止重複調用
    if (isImporting) {
        console.log('匯入操作正在進行中，忽略重複調用');
        return;
    }
    
    try {
        // 鎖定匯入狀態
        isImporting = true;
        
        showNotification('正在匯入詞彙...', 'info');
        
        // 檢查文件類型
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (fileExtension !== 'json' && fileExtension !== 'csv' && fileExtension !== 'txt') {
            console.error('不支持的文件格式:', fileExtension);
            showNotification('匯入失敗：不支持的文件格式', 'error');
            isImporting = false;
            return;
        }
        
        // 讀取文件
        const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('讀取文件失敗'));
            reader.readAsText(file);
        });
        
        // 解析文件內容
        let words = [];
        
        if (fileExtension === 'json') {
            try {
                words = JSON.parse(content);
                if (!Array.isArray(words)) {
                    // 如果不是數組，嘗試查找內部的詞彙數組
                    if (words.vocabulary && Array.isArray(words.vocabulary)) {
                        words = words.vocabulary;
                    } else {
                        throw new Error('JSON格式錯誤，未找到詞彙數據');
                    }
                }
            } catch (error) {
                console.error('解析JSON失敗:', error);
                showNotification('匯入失敗：JSON格式錯誤', 'error');
                isImporting = false;
                return;
            }
        } else if (fileExtension === 'csv') {
            try {
                words = parseCSV(content);
            } catch (error) {
                console.error('解析CSV失敗:', error);
                showNotification('匯入失敗：CSV格式錯誤', 'error');
                isImporting = false;
                return;
            }
        } else if (fileExtension === 'txt') {
            try {
                // 使用與basic2005words.txt相同的格式進行解析
                words = parseTXT(content);
            } catch (error) {
                console.error('解析TXT失敗:', error);
                showNotification('匯入失敗：TXT格式錯誤', 'error');
                isImporting = false;
                return;
            }
        }
        
        // 處理匯入的詞彙
        if (words.length === 0) {
            console.warn('匯入文件不包含任何詞彙');
            showNotification('匯入文件不包含任何詞彙', 'warning');
            isImporting = false;
            return;
        }
        
        // 顯示詞彙組選擇對話框
        const selectedListId = await showWordListSelectionDialog(words.length);
        if (!selectedListId) {
            console.log('用戶取消了匯入操作');
            showNotification('匯入已取消', 'info');
            isImporting = false;
            return;
        }
        
        // 處理匯入的詞彙並加入到所選詞彙組
        const result = await processImportedWords(words, selectedListId);
        
        // 顯示結果
        if (result.success) {
            showNotification(`匯入成功！新增: ${result.added} 個，更新: ${result.updated} 個，跳過: ${result.skipped} 個`, 'success');
            // 重新加載詞彙數據
            await loadVocabularyData();
            // 更新詞彙組計數
            await updateVocabListCounts();
            
            // 自動選擇剛剛匯入的詞彙組
            selectVocabList(selectedListId);
        } else {
            showNotification(`匯入過程中發生錯誤: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('匯入詞彙失敗:', error);
        showNotification('匯入詞彙失敗: ' + error.message, 'error');
    } finally {
        // 解除鎖定狀態
            isImporting = false;
    }
}

/**
 * 解析 CSV 檔案內容
 * @param {string} csvContent - CSV 檔案內容
 * @returns {Array} - 解析後的詞彙陣列
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const words = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => {
            // 移除引號並處理跳脫字元
            v = v.trim();
            if (v.startsWith('"') && v.endsWith('"')) {
                v = v.slice(1, -1);
            }
            return v;
        });
        
        const word = {};
        headers.forEach((header, index) => {
            if (header === 'id') {
                word[header] = parseInt(values[index]);
            } else if (['examples', 'synonyms', 'antonyms', 'associations', 'lists'].includes(header)) {
                word[header] = values[index] ? values[index].split(';').map(v => v.trim()) : [];
            } else if (header === 'difficulty') {
                word[header] = parseInt(values[index]);
            } else {
                word[header] = values[index];
            }
        });
        
        words.push(word);
    }
    
    return words;
}

/**
 * 解析 TXT 文件內容 (支援與basic2005words.txt相同的格式)
 * @param {string} content - TXT 文件內容
 * @returns {Array} - 解析後的詞彙陣列
 */
function parseTXT(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const words = [];
    
    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 4) {
            words.push({
                word: parts[1],
                partOfSpeech: parts[2],
                meaning: parts[3],
                examples: '',
                status: 'notLearned'
            });
        }
    }
    
    console.log(`從TXT文件解析出 ${words.length} 個單字`);
    return words;
}

/**
 * 處理匯入的詞彙
 * @param {Array} words - 要處理的詞彙陣列
 * @param {number} listId - 目標詞彙組ID
 * @returns {Promise<Object>} - 處理結果
 */
async function processImportedWords(words, listId) {
    try {
        // 獲取現有單字以避免重複
        const existingWords = await window.db.getAllWords();
        
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        // 顯示進度條
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        const progressBox = document.createElement('div');
        progressBox.style.cssText = `
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            width: 80%;
            max-width: 500px;
            text-align: center;
        `;
        
        const progressTitle = document.createElement('h3');
        progressTitle.textContent = '處理單字...';
        progressTitle.style.marginBottom = '15px';
        
        const progressStatus = document.createElement('div');
        progressStatus.id = 'import-status';
        progressStatus.textContent = `處理中: 0/${words.length}`;
        progressStatus.style.marginBottom = '10px';
        
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 5px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.id = 'progress-fill';
        progressFill.style.cssText = `
            height: 20px;
            width: 0%;
            background-color: #4CAF50;
            transition: width 0.3s;
        `;
        
        progressBar.appendChild(progressFill);
        progressBox.appendChild(progressTitle);
        progressBox.appendChild(progressStatus);
        progressBox.appendChild(progressBar);
        progressContainer.appendChild(progressBox);
        document.body.appendChild(progressContainer);
        
        const updateProgress = (percent, message) => {
            const fill = document.getElementById('progress-fill');
            const status = document.getElementById('import-status');
            if (fill) fill.style.width = `${percent}%`;
            if (status) status.textContent = message;
        };
        
        const totalWords = words.length;
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            // 更新進度
            const progress = Math.floor((i / totalWords) * 100);
            updateProgress(progress, `處理中: ${i+1}/${totalWords} (${progress}%)`);
            
            try {
                // 檢查單字是否已存在
        const existingWord = existingWords.find(w => w.word.toLowerCase() === word.word.toLowerCase());
                
                let wordId;
        
        if (existingWord) {
                    // 如果單字已存在，只需更新它的資訊
                    wordId = existingWord.id;
                    
                    // 合併單字資訊
                    const updatedWord = {
                        ...existingWord,
                        partOfSpeech: word.partOfSpeech || existingWord.partOfSpeech,
                        meaning: word.meaning || existingWord.meaning,
                        examples: word.examples || existingWord.examples,
                        updatedAt: new Date().toISOString()
                    };
                    
                    // 更新單字
                    await window.db.updateWord(updatedWord);
                    updatedCount++;
        } else {
                    // 如果單字不存在，創建新單字
            const newWord = {
                        word: word.word,
                        phonetic: word.phonetic || '',
                        partOfSpeech: word.partOfSpeech || '',
                        meaning: word.meaning || '',
                        examples: word.examples || '',
                        status: word.status || 'notLearned',
                        createdAt: new Date().toISOString()
                    };
                    
                    // 添加單字
                    wordId = await window.db.addWord(newWord);
                    addedCount++;
                }
                
                // 將單字關聯到詞彙組
                if (wordId && listId) {
                    await window.db.addWordToList(wordId, listId);
                }
            } catch (error) {
                console.error(`處理單字 "${word.word}" 時出錯:`, error);
                skippedCount++;
            }
        }
        
        // 關閉進度條
        setTimeout(() => {
            document.body.removeChild(progressContainer);
        }, 1000);
        
        return {
            success: true,
            added: addedCount,
            updated: updatedCount,
            skipped: skippedCount,
            total: words.length
        };
    } catch (error) {
        console.error('處理匯入詞彙時出錯:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 保存應用數據到本地儲存
 */
function saveAppData() {
    try {
        localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
        console.log('數據已保存到本地儲存');
        return true;
    } catch (e) {
        console.error('保存數據失敗：', e);
        return false;
    }
}

// 將匯出函數和保存函數添加到全局範圍
window.exportVocabulary = exportVocabulary;
window.saveAppData = saveAppData;

// 確保這些函數在全局範圍內可用
if (typeof window.saveAppData !== 'function') {
    console.log('將 saveAppData 函數添加到全局範圍');
    window.saveAppData = saveAppData;
}

if (typeof window.exportVocabulary !== 'function') {
    console.log('將 exportVocabulary 函數添加到全局範圍');
    window.exportVocabulary = exportVocabulary;
}

/**
 * 初始化詞彙操作
 */
async function initVocabOperations() {
    console.log('初始化詞彙操作');
    
    // 綁定工具欄的新增單字按鈕事件
    const addWordBtnToolbar = document.getElementById('addWordBtnToolbar');
    if (addWordBtnToolbar) {
        addWordBtnToolbar.addEventListener('click', () => {
            showAddWordModal();
        });
    } else {
        console.error('找不到 addWordBtnToolbar 元素');
    }
    
    // 初始化搜索功能
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
        console.log('找到搜索按鈕和輸入框，綁定事件');
        
        // 移除可能已經存在的事件監聽器
        const newSearchBtn = searchBtn.cloneNode(true);
        searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);
        
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // 重新綁定事件
        newSearchBtn.addEventListener('click', async () => {
            console.log('點擊搜索按鈕');
            await searchVocabulary(newSearchInput.value);
        });
        
        newSearchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                console.log('按下回車鍵搜索');
                e.preventDefault(); // 防止表單提交
                await searchVocabulary(newSearchInput.value);
            }
        });
    } else {
        console.error('找不到搜索按鈕或輸入框');
    }
    
    // 初始化模態框關閉按鈕
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            hideAddWordModal();
            hideEditWordModal();
            hideWordDetailsModal();
        });
    });
    
    // 初始化新增單字表單
    const addWordForm = document.getElementById('addWordForm');
    if (addWordForm) {
        addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewWord();
        });
        
        // 添加發音測試按鈕事件
        const testPronounceBtn = document.createElement('button');
        testPronounceBtn.type = 'button';
        testPronounceBtn.className = 'btn secondary test-pronunciation-btn';
        testPronounceBtn.innerHTML = '<i class="fas fa-volume-up"></i> 測試發音';
        testPronounceBtn.addEventListener('click', () => {
            const word = document.getElementById('newWord').value.trim();
            if (word) {
                playPronunciation(word);
    } else {
                showNotification('請先輸入單字', 'warning');
            }
        });
        
        // 找到表單中的提交按鈕
        const submitBtn = addWordForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            // 在提交按鈕前插入測試發音按鈕
            submitBtn.parentNode.insertBefore(testPronounceBtn, submitBtn);
    } else {
            // 如果找不到提交按鈕，則直接添加到表單末尾
            addWordForm.appendChild(testPronounceBtn);
        }
    } else {
        console.error('找不到 addWordForm 元素');
    }
    
    // 初始化編輯單字表單
    const editWordForm = document.getElementById('editWordForm');
    if (editWordForm) {
        editWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditedWord();
        });
        
        // 添加發音測試按鈕事件
        const testPronounceBtn = document.createElement('button');
        testPronounceBtn.type = 'button';
        testPronounceBtn.className = 'btn secondary test-pronunciation-btn';
        testPronounceBtn.innerHTML = '<i class="fas fa-volume-up"></i> 測試發音';
        testPronounceBtn.addEventListener('click', () => {
            const word = document.getElementById('editWord').value.trim();
            if (word) {
                playPronunciation(word);
    } else {
                showNotification('請先輸入單字', 'warning');
            }
        });
        
        // 找到表單中的提交按鈕
        const submitBtn = editWordForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            // 在提交按鈕前插入測試發音按鈕
            submitBtn.parentNode.insertBefore(testPronounceBtn, submitBtn);
            } else {
            // 如果找不到提交按鈕，則直接添加到表單末尾
            editWordForm.appendChild(testPronounceBtn);
        }
    } else {
        console.error('找不到 editWordForm 元素');
    }
    
    // 初始化模態框遮罩層
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            hideAddWordModal();
            hideEditWordModal();
            hideWordDetailsModal();
        });
    } else {
        console.error('找不到 modalOverlay 元素');
    }
    
    // 初始化導入/導出功能
    await initImportExportFeatures();
    console.log('導入/導出功能初始化完成');
}

/**
 * 顯示通知消息
 * @param {string} message - 消息內容
 * @param {string} type - 消息類型 (info, success, error, warning)
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

// 將showNotification函數添加到全局範圍
window.showNotification = showNotification;

/**
 * 添加詞彙表樣式
 */
function addVocabularyStyles() {
    // 檢查是否已經添加了樣式
    if (document.getElementById('vocabularyStyles')) {
        return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'vocabularyStyles';
    styleElement.textContent = `
    /* 詞彙管理頁面樣式 */
    .vocabulary-page {
        display: flex;
        height: calc(100vh - 180px);
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }
    
    .vocab-sidebar {
        width: 250px;
        background: #f5f7f9;
        padding: 20px;
        border-right: 1px solid #e1e4e8;
        overflow-y: auto;
    }
    
    .vocab-sidebar h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
    }
    
    .list-separator {
        height: 1px;
        background: #e1e4e8;
        margin: 10px 0;
    }
    
    .vocab-list-item {
        display: flex;
        flex-direction: column;
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 5px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .vocab-list-item:hover {
        background: #edf2f7;
    }
    
    .vocab-list-item.active {
        background: #4299e1;
        color: white;
    }
    
    .list-item-top {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        width: 100%;
    }
    
    .list-item-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    
    .vocab-list-item i {
        margin-right: 10px;
        width: 20px;
        text-align: center;
    }
    
    .vocab-list-item .list-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .vocab-list-item .word-count {
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
    }
    
    .vocab-list-item.active .word-count {
        background: rgba(255, 255, 255, 0.2);
    }
    
    .list-actions {
        display: flex;
        margin-left: 10px;
    }
    
    .vocab-list-item:hover .list-actions {
        display: flex;
    }
    
    .list-actions button {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 3px;
        margin-left: 2px;
        border-radius: 3px;
        opacity: 0.7;
        transition: all 0.2s;
    }
    
    .list-actions button:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.1);
    }
    
    .vocab-list-item.active .list-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    .edit-list-btn, .delete-list-btn, .clear-list-btn {
        font-size: 0.85em;
    }
    
    .delete-list-btn {
        color: #e53e3e;
    }
    
    .clear-list-btn {
        color: #dd6b20;
    }
    
    .vocab-list-item.active .delete-list-btn, 
    .vocab-list-item.active .clear-list-btn {
        color: #fff;
    }
    
    .add-list-btn {
        display: flex;
        align-items: center;
        padding: 8px;
        background: none;
        border: 1px dashed #cbd5e0;
        border-radius: 6px;
        color: #4a5568;
        cursor: pointer;
        width: 100%;
        margin-top: 10px;
        transition: all 0.2s;
    }
    
    .add-list-btn:hover {
        background: #edf2f7;
        border-color: #a0aec0;
    }
    
    .add-list-btn i {
        margin-right: 8px;
    }
    
    /* 詞彙列表樣式 */
    .main-content {
        flex: 1;
            display: flex;
            flex-direction: column;
        overflow: hidden;
    }
    
    .toolbar {
        display: flex;
        padding: 15px;
        border-bottom: 1px solid #e1e4e8;
        background: #f8fafc;
        align-items: center;
    }
    
    .search-box {
        display: flex;
        flex: 1;
        max-width: 500px;
        margin-right: 15px;
    }
    
    .search-box input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e1e4e8;
        border-radius: 6px 0 0 6px;
        font-size: 14px;
    }
    
    .search-box button {
        background: #4299e1;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 0 6px 6px 0;
        cursor: pointer;
    }
    
    .vocabulary-list {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
    }
    
    /* 單字項目樣式 */
        .vocab-item {
            display: flex;
        padding: 15px;
        border-bottom: 1px solid #e1e4e8;
            align-items: center;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 12px;
            transition: all 0.3s ease;
        justify-content: space-between;
        }
        
        .vocab-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .word-info {
            flex: 1;
        }
        
        .word-main {
            display: flex;
            align-items: center;
        margin-bottom: 5px;
        }
        
        .word-main h3 {
            margin: 0;
            font-size: 1.2rem;
        margin-right: 10px;
        }
        
        .phonetic {
        font-size: 0.85em;
        color: #718096;
            font-style: italic;
        margin-right: 10px;
        }
        
        .pronunciation-btn {
            background: none;
            border: none;
        color: #4299e1;
            cursor: pointer;
        padding: 3px 6px;
        border-radius: 3px;
        }
        
        .pronunciation-btn:hover {
        background: #ebf8ff;
        }
        
        .word-details {
            display: flex;
            align-items: center;
        }
        
        .part-of-speech {
        font-size: 0.75em;
        color: #718096;
            padding: 2px 6px;
        background: #f7fafc;
        border-radius: 3px;
        margin-right: 8px;
        }
        
        .meaning {
        color: #4a5568;
        }
        
        .word-status {
            display: flex;
            align-items: center;
        margin-right: 20px;
        }
        
        .status-badge {
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 0.75em;
        font-weight: 500;
    }
    
    .status-badge.new, .status-badge.notLearned {
        background: #fed7d7;
        color: #c53030;
        }
        
        .status-badge.learning {
        background: #feebc8;
        color: #c05621;
        }
        
        .status-badge.mastered {
        background: #c6f6d5;
        color: #2f855a;
    }
    
    .view-examples-btn {
        background: none;
        border: none;
        color: #4299e1;
        cursor: pointer;
        margin-left: 8px;
        padding: 3px 6px;
        border-radius: 3px;
    }
    
    .view-examples-btn:hover {
        background: #ebf8ff;
        }
        
        .word-actions {
            display: flex;
        align-items: center;
        }
        
        .word-actions button {
            background: none;
            border: none;
        color: #4299e1;
            cursor: pointer;
        padding: 8px;
        border-radius: 3px;
        margin-left: 5px;
            transition: all 0.2s;
        }
        
        .word-actions button:hover {
        background: #ebf8ff;
    }
    
    .word-actions .delete-btn {
        color: #e53e3e;
    }
    
    .word-actions .delete-btn:hover {
        background: #fff5f5;
    }
    
    .word-actions .edit-btn:hover {
        color: #2196F3;
    }
    
    .word-actions .add-to-list-btn {
        color: #4CAF50;
    }
    
    .word-actions .add-to-list-btn:hover {
        background: #f0fff4;
        }
        
        .empty-message {
            text-align: center;
            padding: 40px;
        color: #718096;
        }
        
    /* 分頁樣式 */
        .pagination {
            display: flex;
            justify-content: center;
        padding: 20px;
        background: #f8fafc;
        border-top: 1px solid #e1e4e8;
    }
    
    .pagination button {
        background: #fff;
        border: 1px solid #e1e4e8;
        padding: 8px 12px;
        margin: 0 5px;
        border-radius: 6px;
            cursor: pointer;
        transition: all 0.2s;
    }
    
    .pagination button:hover {
        background: #edf2f7;
    }
    
    .pagination button.active {
        background: #4299e1;
        border-color: #3182ce;
        color: white;
    }
    
    .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        /* 通知樣式 */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
        border-radius: 6px;
        color: white;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateX(120%);
        transition: transform 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
        }
        
        .notification.info {
        background: #4299e1;
        }
        
        .notification.success {
        background: #48bb78;
        }
        
        .notification.warning {
        background: #ed8936;
    }
    
    .notification.error {
        background: #f56565;
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * 顯示語音設置模態框
 */
function showVoiceSettingsModal() {
    // 創建模態框容器
    const modal = document.createElement('div');
    modal.id = 'voiceSettingsModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    // 創建模態框內容
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // 添加標題
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h3>發音設置</h3>
        <button class="close-modal">&times;</button>
    `;
    
    // 添加正文內容
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    // 獲取語音列表
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const currentVoice = localStorage.getItem('voicePreference') || '';
    const currentLang = localStorage.getItem('langPreference') || 'en-US';
    
    // 創建語言選擇下拉框
    const langSection = document.createElement('div');
    langSection.className = 'form-group';
    langSection.innerHTML = `
        <label for="langSelect">語言:</label>
        <select id="langSelect" class="form-control">
            <option value="en-US" ${currentLang === 'en-US' ? 'selected' : ''}>英文 (美國)</option>
            <option value="en-GB" ${currentLang === 'en-GB' ? 'selected' : ''}>英文 (英國)</option>
            <option value="en-AU" ${currentLang === 'en-AU' ? 'selected' : ''}>英文 (澳洲)</option>
            <option value="zh-TW" ${currentLang === 'zh-TW' ? 'selected' : ''}>中文 (台灣)</option>
            <option value="zh-CN" ${currentLang === 'zh-CN' ? 'selected' : ''}>中文 (中國)</option>
            <option value="ja-JP" ${currentLang === 'ja-JP' ? 'selected' : ''}>日文</option>
            <option value="ko-KR" ${currentLang === 'ko-KR' ? 'selected' : ''}>韓文</option>
            <option value="fr-FR" ${currentLang === 'fr-FR' ? 'selected' : ''}>法文</option>
            <option value="de-DE" ${currentLang === 'de-DE' ? 'selected' : ''}>德文</option>
            <option value="es-ES" ${currentLang === 'es-ES' ? 'selected' : ''}>西班牙文</option>
        </select>
    `;
    
    // 創建語音選擇下拉框
    const voiceSection = document.createElement('div');
    voiceSection.className = 'form-group';
    voiceSection.innerHTML = `
        <label for="voiceSelect">語音:</label>
        <select id="voiceSelect" class="form-control">
            <option value="">自動選擇最佳語音</option>
            ${voices.map(voice => 
                `<option value="${voice.name}" ${currentVoice === voice.name ? 'selected' : ''}>${voice.name} (${voice.lang})</option>`
            ).join('')}
        </select>
    `;
    
    // 創建測試區域
    const testSection = document.createElement('div');
    testSection.className = 'form-group';
    testSection.innerHTML = `
        <label for="testWord">測試單字:</label>
        <div class="test-voice-container">
            <input type="text" id="testWord" class="form-control" value="hello" placeholder="輸入要測試的單字">
            <button id="testVoiceBtn" class="btn secondary">
                <i class="fas fa-volume-up"></i> 測試
            </button>
        </div>
    `;
    
    // 添加所有區域到正文
    body.appendChild(langSection);
    body.appendChild(voiceSection);
    body.appendChild(testSection);
    
    // 添加底部按鈕
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
        <button id="saveVoiceSettingsBtn" class="btn primary">保存設置</button>
        <button id="cancelVoiceSettingsBtn" class="btn secondary">取消</button>
    `;
    
    // 組裝模態框
    modalContent.appendChild(header);
    modalContent.appendChild(body);
    modalContent.appendChild(footer);
    modal.appendChild(modalContent);
    
    // 添加遮罩層
    let overlay = document.getElementById('modalOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'modalOverlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    
    // 添加到文檔
    document.body.appendChild(modal);
    
    // 語言改變時更新語音列表
    const langSelect = document.getElementById('langSelect');
    const voiceSelect = document.getElementById('voiceSelect');
    
    langSelect.addEventListener('change', () => {
        const selectedLang = langSelect.value;
        const langVoices = voices.filter(voice => voice.lang.includes(selectedLang.split('-')[0]));
        
        // 重建語音選項
        voiceSelect.innerHTML = '<option value="">自動選擇最佳語音</option>';
        langVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    });
    
    // 測試按鈕
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    testVoiceBtn.addEventListener('click', () => {
        const testWord = document.getElementById('testWord').value.trim();
        const selectedLang = langSelect.value;
        const selectedVoice = voiceSelect.value;
        
        if (testWord) {
            // 測試發音
            try {
                const utterance = new SpeechSynthesisUtterance(testWord);
                utterance.lang = selectedLang;
                
                if (selectedVoice) {
                    utterance.voice = voices.find(v => v.name === selectedVoice);
                }
                
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('測試發音失敗:', error);
                showNotification('測試發音失敗', 'error');
            }
        } else {
            showNotification('請輸入要測試的單字', 'warning');
        }
    });
    
    // 保存設置
    const saveBtn = document.getElementById('saveVoiceSettingsBtn');
    saveBtn.addEventListener('click', () => {
        const selectedLang = langSelect.value;
        const selectedVoice = voiceSelect.value;
        
        localStorage.setItem('langPreference', selectedLang);
        localStorage.setItem('voicePreference', selectedVoice);
        
        showNotification('發音設置已保存', 'success');
        closeVoiceSettingsModal();
    });
    
    // 關閉按鈕
    const closeBtn = header.querySelector('.close-modal');
    closeBtn.addEventListener('click', closeVoiceSettingsModal);
    
    // 取消按鈕
    const cancelBtn = document.getElementById('cancelVoiceSettingsBtn');
    cancelBtn.addEventListener('click', closeVoiceSettingsModal);
    
    // 點擊遮罩層關閉
    overlay.addEventListener('click', closeVoiceSettingsModal);
    
    // 添加動畫類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
    
    // 為新模態框添加樣式
    addVoiceSettingsStyles();
}

/**
 * 關閉語音設置模態框
 */
function closeVoiceSettingsModal() {
    const modal = document.getElementById('voiceSettingsModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) {
        // 移除活動類
        modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        
        // 延遲移除模態框，以便完成過渡動畫
        setTimeout(() => {
            if (modal.parentNode) modal.parentNode.removeChild(modal);
            if (overlay) overlay.style.display = 'none';
        }, 300);
    }
}

/**
 * 添加語音設置模態框樣式
 */
function addVoiceSettingsStyles() {
    // 檢查是否已經添加了樣式
    if (document.getElementById('voiceSettingsStyles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'voiceSettingsStyles';
    styleElement.textContent = `
        .test-voice-container {
            display: flex;
            gap: 10px;
        }
        
        .test-voice-container button {
            white-space: nowrap;
        }
        
        #voiceSettingsModal .form-group {
            margin-bottom: 15px;
        }
        
        #voiceSettingsModal label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        #voiceSettingsModal .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        #voiceSettingsModal select.form-control {
            height: 38px;
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * 顯示詞彙表選擇模態框並將單字添加到選定的詞彙表
 * @param {number} wordId - 要添加的單字ID
 */
async function addToWordList(wordId) {
    console.log('將單字添加到詞彙列表:', wordId);
    
    // 檢查單字是否存在
    const word = await window.db.getWordById(wordId);
    if (!word) {
        showNotification('找不到指定的單字', 'error');
        return;
    }
    
    // 創建模態框
    const modalId = 'addToListModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>選擇詞彙列表</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p>請選擇要將「<strong>${word.word}</strong>」添加到的詞彙列表：</p>
                    <div id="listOptions" class="list-options">
                        <p>載入中...</p>
                    </div>
                    <div class="form-actions">
                        <button class="secondary-btn close-modal">取消</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.querySelector(`#${modalId} .modal-header h3`).textContent = '選擇詞彙列表';
        document.querySelector(`#${modalId} .modal-body p`).innerHTML = `請選擇要將「<strong>${word.word}</strong>」添加到的詞彙列表：`;
    }
    
    // 顯示模態框
    modal.classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
    document.body.classList.add('modal-open');
    
    // 載入詞彙列表選項
    const listOptions = document.getElementById('listOptions');
    listOptions.innerHTML = '<p>載入中...</p>';
    
    try {
        const lists = await window.db.getAllWordLists();
        
        if (!lists || lists.length === 0) {
            listOptions.innerHTML = '<p>沒有可用的詞彙列表。請先創建一個新的詞彙列表。</p>';
            return;
        }
        
        listOptions.innerHTML = '';
        
        lists.forEach(list => {
            const listItem = document.createElement('div');
            listItem.className = 'list-option';
            listItem.innerHTML = `
                <div class="list-name">
                    <i class="fas fa-list-ul"></i>
                    ${list.name}
                </div>
            `;
            
            listItem.addEventListener('click', async () => {
                try {
                    await window.db.addWordToList(wordId, list.id);
                    
                    // 更新詞彙列表計數
                    await updateVocabListCounts();
                    
                    // 通知其他模組詞彙列表已更新
                    document.dispatchEvent(new CustomEvent('vocabListsUpdated'));
                    
                    // 關閉模態框
                    modal.classList.remove('active');
                    document.getElementById('modalOverlay').classList.remove('active');
                    document.body.classList.remove('modal-open');
                    
                    showNotification(`成功將「${word.word}」添加到「${list.name}」詞彙列表`, 'success');
                } catch (error) {
                    console.error('添加單字到詞彙列表失敗:', error);
                    showNotification('操作失敗，請稍後再試', 'error');
                }
            });
            
            listOptions.appendChild(listItem);
        });
        
    } catch (error) {
        console.error('獲取詞彙列表失敗:', error);
        listOptions.innerHTML = '<p>載入詞彙列表失敗，請稍後再試。</p>';
    }
    
    // 綁定關閉按鈕
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.getElementById('modalOverlay').classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    });
}

/**
 * 添加詞彙表選擇模態框的樣式
 */
function addWordListSelectModalStyles() {
    // 檢查是否已經添加了樣式
    if (document.getElementById('wordListSelectModalStyles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'wordListSelectModalStyles';
    styleElement.textContent = `
        .word-lists-container {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
        }
        
        .word-list-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .word-list-item:last-child {
            border-bottom: none;
        }
        
        .list-name {
            font-weight: bold;
        }
        
        .new-list-section {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .new-list-input-group {
            display: flex;
            gap: 10px;
        }
        
        .new-list-input-group input {
            flex: 1;
        }
        
        .empty-lists-message {
            text-align: center;
            padding: 20px;
            color: #777;
            font-style: italic;
        }
    `;
    document.head.appendChild(styleElement); 
}

/**
 * 清空詞彙組中的所有單字
 * @param {number|string} id - 詞彙組ID或預設列表ID
 */
async function clearVocabList(id) {
    try {
        let words = [];
        let listName = '';
        
        // 根據不同的列表類型獲取對應的單字
        if (id === 'all') {
            // 獲取所有單字
            words = await window.db.getAllWords();
            listName = '所有單字';
        } else if (id === 'notLearned') {
            // 獲取所有未學習單字
            words = await window.db.getWordsByStatus('notLearned');
            listName = '未學習';
        } else if (id === 'learning') {
            // 獲取所有學習中單字
            words = await window.db.getWordsByStatus('learning');
            listName = '學習中';
        } else if (id === 'mastered') {
            // 獲取所有已掌握單字
            words = await window.db.getWordsByStatus('mastered');
            listName = '已掌握';
        } else {
            // 獲取詞彙表中的所有單字
            words = await window.db.getWordsInList(id);
            
            // 獲取詞彙表信息
            const lists = await window.db.getAllWordLists();
            const list = lists.find(l => l.id === id);
            listName = list ? list.name : '詞彙表';
        }
        
        console.log(`詞彙表「${listName}」中有 ${words.length} 個單字，準備清空`);
        
        if (words.length === 0) {
            showNotification('詞彙表已經是空的', 'info');
            return;
        }
        
        // 顯示進度通知
        showNotification(`正在清空詞彙表「${listName}」，請稍候...`, 'info');
        
        // 處理不同的清空操作
        if (id === 'all') {
            // 清空所有單字（從所有詞彙表中刪除所有單字）
            for (const word of words) {
                await window.db.deleteWord(word.id);
            }
        } else if (['notLearned', 'learning', 'mastered'].includes(id)) {
            // 刪除特定狀態的單字
            for (const word of words) {
                await window.db.deleteWord(word.id);
            }
        } else {
            // 從詞彙表中移除所有單字，但不刪除單字本身
            for (const word of words) {
                await window.db.removeWordFromList(word.id, id);
            }
        }
        
        // 更新詞彙表計數
        await updateVocabListCounts();
        
        // 重新載入詞彙
        await loadVocabularyData();
        
        showNotification(`詞彙表「${listName}」已清空`, 'success');
    } catch (error) {
        console.error('清空詞彙表失敗:', error);
        showNotification('清空詞彙表失敗，請稍後再試', 'error');
    }
}

/**
 * 添加全部音標獲取按鈕
 */
function addPhoneticTestButton() {
    // 檢查是否已存在測試按鈕
    if (document.getElementById('phoneticTestBtn')) {
        return;
    }
    
    // 創建測試按鈕
    const testBtn = document.createElement('button');
    testBtn.id = 'phoneticTestBtn';
    testBtn.className = 'btn secondary';
    testBtn.innerHTML = '<i class="fas fa-volume-up"></i> 全部音標獲取';
    testBtn.style.position = 'fixed';
    testBtn.style.bottom = '20px';
    testBtn.style.right = '20px';
    testBtn.style.zIndex = '9999';
    
    // 添加點擊事件
    testBtn.addEventListener('click', async () => {
        if (!confirm('確定要為所有單字獲取音標嗎？這可能需要一些時間。')) {
            return;
        }
        
        try {
            // 獲取所有單字
            const allWords = await window.db.getAllWords();
            if (!allWords || allWords.length === 0) {
                showNotification('沒有找到任何單字', 'warning');
                return;
            }
            
            showNotification(`開始為 ${allWords.length} 個單字獲取音標，請稍候...`, 'info');
            
            // 創建進度指示器
            const progressContainer = document.createElement('div');
            progressContainer.id = 'progressContainer';
            progressContainer.style.position = 'fixed';
            progressContainer.style.top = '50%';
            progressContainer.style.left = '50%';
            progressContainer.style.transform = 'translate(-50%, -50%)';
            progressContainer.style.background = 'white';
            progressContainer.style.padding = '20px';
            progressContainer.style.borderRadius = '8px';
            progressContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            progressContainer.style.zIndex = '10000';
            progressContainer.style.minWidth = '300px';
            progressContainer.style.textAlign = 'center';
            
            const progressTitle = document.createElement('h3');
            progressTitle.textContent = '正在獲取音標';
            progressTitle.style.marginBottom = '15px';
            
            const progressText = document.createElement('div');
            progressText.id = 'progressText';
            progressText.textContent = '準備中...';
            progressText.style.marginBottom = '10px';
            
            const progressBar = document.createElement('div');
            progressBar.style.height = '20px';
            progressBar.style.background = '#f0f0f0';
            progressBar.style.borderRadius = '10px';
            progressBar.style.overflow = 'hidden';
            
            const progressFill = document.createElement('div');
            progressFill.id = 'progressFill';
            progressFill.style.height = '100%';
            progressFill.style.width = '0%';
            progressFill.style.background = '#4299e1';
            progressFill.style.transition = 'width 0.3s';
            
            const cancelButton = document.createElement('button');
            cancelButton.textContent = '取消';
            cancelButton.style.marginTop = '15px';
            cancelButton.style.padding = '5px 15px';
            cancelButton.style.border = 'none';
            cancelButton.style.borderRadius = '4px';
            cancelButton.style.background = '#e53e3e';
            cancelButton.style.color = 'white';
            cancelButton.style.cursor = 'pointer';
            
            progressBar.appendChild(progressFill);
            progressContainer.appendChild(progressTitle);
            progressContainer.appendChild(progressText);
            progressContainer.appendChild(progressBar);
            progressContainer.appendChild(cancelButton);
            document.body.appendChild(progressContainer);
            
            // 取消標誌
            let isCancelled = false;
            cancelButton.addEventListener('click', () => {
                isCancelled = true;
                progressText.textContent = '正在取消...';
            });
            
            // 記錄成功和失敗的數量
            let successCount = 0;
            let failCount = 0;
            let skippedCount = 0;
            
            // 批次處理，每次處理5個單字，避免過多並發請求
            const batchSize = 5;
            const totalBatches = Math.ceil(allWords.length / batchSize);
            
            // 處理每批單字
            for (let i = 0; i < totalBatches; i++) {
                if (isCancelled) {
                    break;
                }
                
                const start = i * batchSize;
                const end = Math.min(start + batchSize, allWords.length);
                const batch = allWords.slice(start, end);
                
                // 更新進度UI
                const progress = Math.round((i / totalBatches) * 100);
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `處理中: ${start + 1} - ${end} / ${allWords.length} (${progress}%)`;
                
                // 並行處理這一批的單字
                const promises = batch.map(async (word) => {
                    if (isCancelled) return;
                    
                    // 如果已經有音標，則跳過
                    if (word.phonetic && word.phonetic.trim()) {
                        console.log(`跳過 "${word.word}": 已有音標 ${word.phonetic}`);
                        skippedCount++;
                        return;
                    }
                    
                    try {
                        // 獲取音標
                        console.log(`嘗試獲取 "${word.word}" 的音標`);
                        const phonetic = await getPhoneticFromFreeDictionary(word.word);
                        
                        if (phonetic) {
                            // 更新單字音標
                            const updatedWord = { ...word, phonetic };
                            await window.db.updateWord(updatedWord);
                            console.log(`成功為 "${word.word}" 獲取並更新音標: ${phonetic}`);
                            successCount++;
                        } else {
                            console.log(`無法為 "${word.word}" 獲取音標`);
                            failCount++;
                        }
                    } catch (err) {
                        console.error(`處理 "${word.word}" 時出錯:`, err);
                        failCount++;
                    }
                });
                
                // 等待這一批處理完成
                await Promise.all(promises);
                
                // 小延遲，避免API限流
                await new Promise(r => setTimeout(r, 1000));
            }
            
            // 刪除進度指示器
            document.body.removeChild(progressContainer);
            
            // 重新載入詞彙數據
            await loadVocabularyData();
            
            // 顯示最終結果
            if (isCancelled) {
                showNotification(`音標獲取已取消。成功: ${successCount}, 失敗: ${failCount}, 跳過: ${skippedCount}`, 'warning');
            } else {
                showNotification(`音標獲取完成！成功: ${successCount}, 失敗: ${failCount}, 跳過: ${skippedCount}`, 'success');
            }
            
        } catch (error) {
            console.error('獲取音標過程中發生錯誤:', error);
            showNotification('獲取音標失敗，請查看控制台以獲取詳細訊息', 'error');
            
            // 移除可能仍存在的進度指示器
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) {
                document.body.removeChild(progressContainer);
            }
        }
    });
    
    // 添加到頁面
    document.body.appendChild(testBtn);
}

// 文檔加載完成後添加測試按鈕
document.addEventListener('DOMContentLoaded', () => {
    // 延遲添加測試按鈕，確保其他元素已加載
    setTimeout(addPhoneticTestButton, 2000);
});

/**
 * 使用Free Dictionary API獲取單字音標
 * @param {string} word - 要查詢的單字
 * @returns {Promise<string>} - 返回音標
 */
async function getPhoneticFromFreeDictionary(word) {
  try {
    if (!word) return null;
    word = word.trim().toLowerCase();
    
    console.log(`嘗試從Free Dictionary API獲取「${word}」的音標`);
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`API回應狀態異常: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // 檢查是否有有效回應
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('API未返回有效數據');
      return null;
    }
    
    // 遍歷所有返回的數據
    for (const entry of data) {
      // 先檢查單字級別的音標
      if (entry.phonetic) {
        console.log(`找到單字級別音標: ${entry.phonetic}`);
        // 確保音標格式正確 (包含在// 中)
        if (entry.phonetic.startsWith('/') && entry.phonetic.endsWith('/')) {
          return entry.phonetic;
        } else {
          return `/${entry.phonetic.replace(/^\/|\/$/g, '')}/`;
        }
      }
      
      // 檢查phonetics數組
      if (entry.phonetics && Array.isArray(entry.phonetics) && entry.phonetics.length > 0) {
        // 優先尋找美式發音
        const usPhonetic = entry.phonetics.find(p => p.audio && p.audio.includes('us'));
        if (usPhonetic && usPhonetic.text) {
          console.log(`找到美式音標: ${usPhonetic.text}`);
          // 確保音標格式正確
          if (usPhonetic.text.startsWith('/') && usPhonetic.text.endsWith('/')) {
            return usPhonetic.text;
          } else {
            return `/${usPhonetic.text.replace(/^\/|\/$/g, '')}/`;
          }
        }
        
        // 如果沒有找到美式發音，使用第一個有文本的音標
        for (const phonetic of entry.phonetics) {
          if (phonetic.text) {
            console.log(`找到可用音標: ${phonetic.text}`);
            // 確保音標格式正確
            if (phonetic.text.startsWith('/') && phonetic.text.endsWith('/')) {
              return phonetic.text;
            } else {
              return `/${phonetic.text.replace(/^\/|\/$/g, '')}/`;
            }
          }
        }
      }
    }
    
    console.log('未在API回應中找到音標');
    return null;
  } catch (error) {
    console.error('從Free Dictionary獲取音標時出錯:', error);
    return null;
  }
}

/**
 * 從劍橋詞典獲取音標 (新版實現)
 * @param {string} word - 要查詢的單字
 * @returns {Promise<string>} - 返回美式英語音標
 */
async function getCambridgePronunciation(word) {
  try {
    // 首先嘗試使用Free Dictionary API
    const freeDictPhonetic = await getPhoneticFromFreeDictionary(word);
    if (freeDictPhonetic) {
      console.log(`Free Dictionary API 成功獲取到音標: ${freeDictPhonetic}`);
      return freeDictPhonetic;
    }
    
    // 如果Free Dictionary API失敗，嘗試使用CORS代理訪問劍橋詞典
    const corsProxy = "https://corsproxy.io/?";
    const url = `${corsProxy}https://dictionary.cambridge.org/zht/dictionary/english/${encodeURIComponent(word)}`;
    console.log(`嘗試從 ${url} 獲取音標`);
    
    const response = await fetch(url);
    const html = await response.text();

    // 修正正則表達式以匹配劍橋詞典的美式音標格式
    const pronunciationRegex = /id="us_pron_1".*?<span class="ipa">(.*?)<\/span>/s;
    const match = pronunciationRegex.exec(html);

    if (match && match[1]) {
      let pronunciation = `/${match[1]}/`;
      console.log(`成功獲取到音標: ${pronunciation}`);
      return pronunciation;
    } else {
      console.log(`未找到音標，嘗試備用正則表達式`);
      // 備用正則表達式
      const backupRegex = /class="pron-info.*?dpron-i".*?<span class="ipa">(.*?)<\/span>/s;
      const backupMatch = backupRegex.exec(html);
      
      if (backupMatch && backupMatch[1]) {
        let pronunciation = `/${backupMatch[1]}/`;
        console.log(`使用備用方法獲取到音標: ${pronunciation}`);
        return pronunciation;
      }
      
      console.log(`所有方法均未找到音標`);
      return null;
    }
  } catch (error) {
    console.error("取得音標時發生錯誤:", error);
    return null;
  }
}

/**
 * 顯示詞彙組選擇對話框
 * @param {number} wordCount - 要匯入的單字數量
 * @returns {Promise<number|null>} - 選擇的詞彙組ID或null(表示取消)
 */
async function showWordListSelectionDialog(wordCount) {
    return new Promise(async (resolve) => {
        // 創建模態框背景
        const modalBackground = document.createElement('div');
        modalBackground.className = 'modal-background';
        modalBackground.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        // 創建模態框內容
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            width: 90%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        // 創建標題
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `匯入 ${wordCount} 個單字`;
        modalTitle.style.marginBottom = '15px';
        
        // 創建說明文字
        const modalDescription = document.createElement('p');
        modalDescription.textContent = '請選擇要匯入到哪個詞彙組，或創建新的詞彙組：';
        modalDescription.style.marginBottom = '15px';
        
        // 獲取所有詞彙組
        const allWordLists = await window.db.getAllWordLists();
        
        // 創建詞彙組列表
        const listContainer = document.createElement('div');
        listContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #eee;
            border-radius: 5px;
            padding: 10px;
        `;
        
        // 添加現有詞彙組選項
        allWordLists.forEach(list => {
            const listItem = document.createElement('div');
            listItem.className = 'list-select-item';
            listItem.style.cssText = `
                display: flex;
                align-items: center;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            listItem.setAttribute('data-list-id', list.id);
            listItem.setAttribute('data-selected', 'false');
            
            const icon = document.createElement('i');
            icon.className = list.icon || 'fas fa-book';
            icon.style.marginRight = '10px';
            
            const name = document.createElement('span');
            name.textContent = list.name;
            
            listItem.appendChild(icon);
            listItem.appendChild(name);
            
            listItem.addEventListener('click', () => {
                // 移除其他選項的選中狀態
                const allItems = listContainer.querySelectorAll('.list-select-item');
                allItems.forEach(item => {
                    item.style.backgroundColor = 'transparent';
                    item.style.fontWeight = 'normal';
                    item.setAttribute('data-selected', 'false');
                });
                
                // 設置當前選項的選中狀態
                listItem.style.backgroundColor = '#e0f0ff';
                listItem.style.fontWeight = 'bold';
                listItem.setAttribute('data-selected', 'true');
                
                // 禁用新建詞彙組輸入框
                newListInput.disabled = true;
                newListInput.value = '';
            });
            
            // 添加懸停效果
            listItem.addEventListener('mouseover', () => {
                if (listItem.getAttribute('data-selected') !== 'true') {
                    listItem.style.backgroundColor = '#f0f0f0';
                }
            });
            
            listItem.addEventListener('mouseout', () => {
                if (listItem.getAttribute('data-selected') !== 'true') {
                    listItem.style.backgroundColor = 'transparent';
                }
            });
            
            listContainer.appendChild(listItem);
        });
        
        // 創建新詞彙組輸入區域
        const newListContainer = document.createElement('div');
        newListContainer.style.cssText = `
            margin-bottom: 20px;
        `;
        
        const newListLabel = document.createElement('label');
        newListLabel.textContent = '或輸入新詞彙組名稱：';
        newListLabel.style.display = 'block';
        newListLabel.style.marginBottom = '5px';
        
        const newListInput = document.createElement('input');
        newListInput.type = 'text';
        newListInput.className = 'new-list-input';
        newListInput.placeholder = '例如：我的單字列表';
        newListInput.style.cssText = `
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        `;
        
        newListInput.addEventListener('input', () => {
            if (newListInput.value.trim()) {
                // 如果用戶在輸入新詞彙組，清除其他選項的選中狀態
                const allItems = listContainer.querySelectorAll('.list-select-item');
                allItems.forEach(item => {
                    item.style.backgroundColor = 'transparent';
                    item.style.fontWeight = 'normal';
                    item.setAttribute('data-selected', 'false');
                });
            }
        });
        
        newListContainer.appendChild(newListLabel);
        newListContainer.appendChild(newListInput);
        
        // 創建按鈕區域
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        `;
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.className = 'btn secondary';
        cancelButton.style.cssText = `
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        const importButton = document.createElement('button');
        importButton.textContent = '匯入';
        importButton.className = 'btn primary';
        importButton.style.cssText = `
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
        `;
        
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modalBackground);
            resolve(null);
        });
        
        importButton.addEventListener('click', async () => {
            // 檢查是否選擇了現有詞彙組
            const selectedItems = listContainer.querySelectorAll('.list-select-item[data-selected="true"]');
            let selectedListId = null;
            
            if (selectedItems.length > 0) {
                selectedListId = selectedItems[0].getAttribute('data-list-id');
            } else if (newListInput.value.trim()) {
                // 創建新詞彙組
                const newList = {
                    name: newListInput.value.trim(),
                    icon: 'fas fa-book',
                    createdAt: new Date().toISOString()
                };
                
                try {
                    selectedListId = await window.db.addWordList(newList);
                    console.log('已創建新詞彙組:', newList.name, ', ID:', selectedListId);
                    
                    // 刷新詞彙組列表
                    await initVocabLists();
                } catch (error) {
                    console.error('創建詞彙組失敗:', error);
                    showNotification('創建詞彙組失敗: ' + error.message, 'error');
                    document.body.removeChild(modalBackground);
                    resolve(null);
                    return;
                }
            } else {
                // 未選擇詞彙組
                alert('請選擇一個詞彙組或創建新詞彙組');
                return;
            }
            
            document.body.removeChild(modalBackground);
            resolve(selectedListId);
        });
        
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(importButton);
        
        // 組合模態框內容
        modalContent.appendChild(modalTitle);
        modalContent.appendChild(modalDescription);
        modalContent.appendChild(listContainer);
        modalContent.appendChild(newListContainer);
        modalContent.appendChild(buttonContainer);
        
        modalBackground.appendChild(modalContent);
        document.body.appendChild(modalBackground);
    });
}

/**
 * 選擇特定的詞彙組(用於匯入後自動選擇)
 * @param {number} listId - 詞彙組ID
 */
function selectVocabList(listId) {
    if (!listId) return;
    
    const listItems = document.querySelectorAll('.vocab-list-item');
    listItems.forEach(item => {
        const itemId = item.getAttribute('data-list-id');
        if (itemId && parseInt(itemId) === parseInt(listId)) {
            item.click();
        }
    });
}

/**
 * 顯示匯出詞彙對話框
 */
async function showExportDialog() {
    console.log('顯示匯出詞彙對話框');
    
    // 如果已經在導出中，防止重複調用
    if (isExporting) {
        console.log('匯出操作正在進行中，忽略重複調用');
        return;
    }
    
    try {
        // 添加模態對話框的樣式
        const modalStyleId = 'export-modal-style';
        if (!document.getElementById(modalStyleId)) {
            const style = document.createElement('style');
            style.id = modalStyleId;
            style.textContent = `
                .modal-container {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .export-list-item:hover {
                    background-color: #f5f5f5;
                }
                
                .export-list-item[data-selected="true"] {
                    background-color: #e3f2fd;
                    color: #1565c0;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
        
        // 創建對話框容器
        const dialogContainer = document.createElement('div');
        dialogContainer.className = 'modal-container';
        
        // 創建對話框內容
        const dialogContent = document.createElement('div');
        dialogContent.className = 'modal-content';
        dialogContent.style.width = '500px';
        dialogContent.style.maxWidth = '90%';
        
        // 對話框標題
        const title = document.createElement('h3');
        title.textContent = '匯出詞彙';
        dialogContent.appendChild(title);
        
        // 簡短說明
        const description = document.createElement('p');
        description.textContent = '請選擇要匯出的詞彙表和匯出格式：';
        dialogContent.appendChild(description);
        
        // 詞彙表選擇區域
        const listSelectionContainer = document.createElement('div');
        listSelectionContainer.className = 'list-selection-container';
        listSelectionContainer.style.maxHeight = '250px';
        listSelectionContainer.style.overflowY = 'auto';
        listSelectionContainer.style.marginBottom = '20px';
        listSelectionContainer.style.border = '1px solid #eee';
        listSelectionContainer.style.borderRadius = '4px';
        listSelectionContainer.style.padding = '10px';
        
        // 獲取所有詞彙表
        let vocabLists = [];
        
        // 添加預設選項
        vocabLists.push({ id: 'all', name: '所有單字' });
        vocabLists.push({ id: 'notLearned', name: '未學習' });
        vocabLists.push({ id: 'learning', name: '學習中' });
        vocabLists.push({ id: 'mastered', name: '已掌握' });
        vocabLists.push({ id: 'filtered', name: '目前過濾結果' });
        
        // 添加分隔線
        const separator = document.createElement('div');
        separator.style.width = '100%';
        separator.style.borderBottom = '1px solid #ddd';
        separator.style.margin = '10px 0';
        
        // 從資料庫獲取自定義詞彙表
        if (window.db && typeof window.db.getAllWordLists === 'function') {
            const customLists = await window.db.getAllWordLists();
            if (customLists && customLists.length > 0) {
                vocabLists.push({ id: 'separator', name: '自定義詞彙表', isSeparator: true });
                vocabLists = vocabLists.concat(customLists);
            }
        }
        
        // 創建詞彙表選項
        let selectedListItem = null;
        
        vocabLists.forEach(list => {
            if (list.isSeparator) {
                // 如果是分隔線，添加標題
                const separatorTitle = document.createElement('div');
                separatorTitle.textContent = list.name;
                separatorTitle.style.fontWeight = 'bold';
                separatorTitle.style.margin = '10px 0 5px 0';
                separatorTitle.style.color = '#666';
                listSelectionContainer.appendChild(separatorTitle);
                return;
            }
            
            const listItem = document.createElement('div');
            listItem.className = 'export-list-item';
            listItem.textContent = list.name;
            listItem.dataset.listId = list.id;
            listItem.style.padding = '8px 10px';
            listItem.style.margin = '5px 0';
            listItem.style.borderRadius = '4px';
            listItem.style.cursor = 'pointer';
            listItem.style.transition = 'background-color 0.2s';
            
            // 添加滑鼠懸停效果
            listItem.addEventListener('mouseover', () => {
                if (listItem !== selectedListItem) {
                    listItem.style.backgroundColor = '#f5f5f5';
                }
            });
            
            listItem.addEventListener('mouseout', () => {
                if (listItem !== selectedListItem) {
                    listItem.style.backgroundColor = '';
                }
            });
            
            // 添加點擊事件
            listItem.addEventListener('click', () => {
                // 清除之前的選擇
                if (selectedListItem) {
                    selectedListItem.style.backgroundColor = '';
                    selectedListItem.style.color = '';
                    selectedListItem.style.fontWeight = '';
                    selectedListItem.dataset.selected = 'false';
                }
                
                // 設置新的選擇
                listItem.style.backgroundColor = '#e3f2fd';
                listItem.style.color = '#1565c0';
                listItem.style.fontWeight = 'bold';
                listItem.dataset.selected = 'true';
                selectedListItem = listItem;
            });
            
            listSelectionContainer.appendChild(listItem);
        });
        
        // 添加格式選擇區域
        const formatContainer = document.createElement('div');
        formatContainer.style.margin = '15px 0';
        
        const formatLabel = document.createElement('label');
        formatLabel.textContent = '匯出格式: ';
        formatLabel.style.marginRight = '10px';
        formatContainer.appendChild(formatLabel);
        
        const formatSelect = document.createElement('select');
        formatSelect.className = 'format-select';
        formatSelect.style.padding = '5px 10px';
        formatSelect.style.borderRadius = '4px';
        formatSelect.style.border = '1px solid #ddd';
        
        const jsonOption = document.createElement('option');
        jsonOption.value = 'json';
        jsonOption.textContent = 'JSON 格式';
        formatSelect.appendChild(jsonOption);
        
        const csvOption = document.createElement('option');
        csvOption.value = 'csv';
        csvOption.textContent = 'CSV 格式';
        formatSelect.appendChild(csvOption);
        
        const txtOption = document.createElement('option');
        txtOption.value = 'txt';
        txtOption.textContent = 'TXT 格式 (序號,單字,詞性,意思)';
        formatSelect.appendChild(txtOption);
        
        formatContainer.appendChild(formatSelect);
        
        // 按鈕區域
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '20px';
        
        // 取消按鈕
        const cancelButton = document.createElement('button');
        cancelButton.className = 'btn secondary';
        cancelButton.textContent = '取消';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(dialogContainer);
        });
        buttonContainer.appendChild(cancelButton);
        
        // 匯出按鈕
        const exportButton = document.createElement('button');
        exportButton.className = 'btn primary';
        exportButton.textContent = '匯出';
        exportButton.addEventListener('click', async () => {
            // 獲取選中的詞彙表
            const selectedList = document.querySelector('.export-list-item[data-selected="true"]');
            if (!selectedList) {
                showNotification('請選擇要匯出的詞彙表', 'error');
                return;
            }
            
            const listId = selectedList.dataset.listId;
            const listName = selectedList.textContent;
            const format = formatSelect.value;
            
            // 關閉對話框
            document.body.removeChild(dialogContainer);
            
            // 根據選擇的詞彙表獲取要匯出的單字
            await exportSelectedVocabulary(listId, listName, format);
        });
        buttonContainer.appendChild(exportButton);
        
        // 將所有元素添加到對話框
        dialogContent.appendChild(listSelectionContainer);
        dialogContent.appendChild(formatContainer);
        dialogContent.appendChild(buttonContainer);
        
        // 將對話框添加到容器
        dialogContainer.appendChild(dialogContent);
        
        // 將容器添加到文檔
        document.body.appendChild(dialogContainer);
        
        // 選擇預設項目 (目前過濾結果)
        const defaultItem = document.querySelector('.export-list-item[data-list-id="filtered"]');
        if (defaultItem) {
            defaultItem.click();
        }
        
    } catch (error) {
        console.error('顯示匯出對話框失敗:', error);
        showNotification('無法顯示匯出對話框: ' + error.message, 'error');
    }
}

/**
 * 匯出選中的詞彙表
 * @param {string} listId - 詞彙表ID
 * @param {string} listName - 詞彙表名稱
 * @param {string} format - 匯出格式
 */
async function exportSelectedVocabulary(listId, listName, format) {
    console.log(`匯出詞彙表: ${listName}, ID: ${listId}, 格式: ${format}`);
    
    // 如果已經在匯出中，防止重複調用
    if (isExporting) {
        console.log('匯出操作正在進行中，忽略重複調用');
        return;
    }
    
    try {
        // 鎖定匯出狀態
        isExporting = true;
        
        // 顯示載入中狀態
        showNotification('正在準備匯出資料...', 'info');
        
        // 根據詞彙表ID獲取要匯出的詞彙
        let wordsToExport = [];
        
        if (listId === 'all') {
            // 所有單字
            wordsToExport = await window.db.getAllWords();
        } else if (listId === 'notLearned') {
            // 未學習單字
            wordsToExport = await window.db.getWordsByStatus('notLearned');
        } else if (listId === 'learning') {
            // 學習中單字
            wordsToExport = await window.db.getWordsByStatus('learning');
        } else if (listId === 'mastered') {
            // 已掌握單字
            wordsToExport = await window.db.getWordsByStatus('mastered');
        } else if (listId === 'filtered') {
            // 目前過濾結果
            wordsToExport = filteredWords;
        } else {
            // 自定義詞彙表
            wordsToExport = await window.db.getWordsInList(listId);
        }
        
        // 檢查是否有單字可匯出
        if (!wordsToExport || wordsToExport.length === 0) {
            console.error('沒有詞彙可匯出');
            showNotification('所選詞彙表中沒有可匯出的詞彙', 'error');
            isExporting = false;
            return;
        }
        
        let content = '';
        let filename = '';
        let contentType = '';
        
        if (format === 'json') {
            // 匯出為 JSON 格式
            content = JSON.stringify(wordsToExport, null, 2);
            filename = `${listName}_${new Date().toISOString().slice(0, 10)}.json`;
            contentType = 'application/json';
        } else if (format === 'csv') {
            // 匯出為 CSV 格式
            const header = ['id', 'word', 'phonetic', 'partOfSpeech', 'meaning', 'examples', 'status', 'createdAt', 'updatedAt'];
            
            // 創建 CSV 內容
            const csvRows = wordsToExport.map(word => {
                return header.map(field => {
                    let value = word[field];
                    
                    // 處理特殊字段
                    if (field === 'examples' && Array.isArray(value)) {
                        value = value.join('; ');
                    }
                    
                    // 處理包含逗號或換行的字段
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    
                    return value || '';
                }).join(',');
            });
            
            // 添加標題行
            csvRows.unshift(header.join(','));
            
            content = csvRows.join('\n');
            filename = `${listName}_${new Date().toISOString().slice(0, 10)}.csv`;
            contentType = 'text/csv';
        } else if (format === 'txt') {
            // 匯出為 TXT 格式 (序號,單字,詞性,意思)
            let txtRows = [];
            
            // 添加每一行的內容
            for (let i = 0; i < wordsToExport.length; i++) {
                const word = wordsToExport[i];
                const row = `${i + 1},${word.word},${word.partOfSpeech || ''},${word.meaning || ''}`;
                txtRows.push(row);
            }
            
            content = txtRows.join('\n');
            filename = `${listName}_${new Date().toISOString().slice(0, 10)}.txt`;
            contentType = 'text/plain';
        } else {
            throw new Error(`不支持的匯出格式: ${format}`);
        }
        
        // 下載文件
        downloadWithCreateElement(content, filename, contentType);
        
        console.log(`已匯出 ${wordsToExport.length} 個詞彙為 ${format} 格式`);
        showNotification(`已成功匯出 ${wordsToExport.length} 個詞彙到 ${filename}`, 'success');
    } catch (error) {
        console.error('匯出詞彙失敗:', error);
        showNotification('匯出詞彙失敗: ' + error.message, 'error');
    } finally {
        // 釋放匯出鎖定
        setTimeout(() => {
            isExporting = false;
        }, 500);
  }
}
  