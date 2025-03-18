/**
 * 單字記憶大師 - 詞彙管理模組
 * 負責詞彙表管理、單字添加/編輯/刪除等功能
 */

let currentVocabList = 'all';
let currentPage = 1;
const pageSize = 10;
let filteredWords = [];

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 事件觸發');
    
    try {
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
                        console.log('切換到詞彙管理頁面，初始化詞彙管理器');
                        // 延遲一點初始化，確保頁面已經切換
                        setTimeout(async () => {
                            await initVocabularyManager();
                        }, 100);
                    }
                });
            });
        }
    } catch (error) {
        console.error('初始化失敗:', error);
        alert('系統初始化失敗，請重新整理頁面');
    }
    
    // 添加CSS樣式
    addVocabularyStyles();
});

/**
 * 初始化詞彙管理器
 */
async function initVocabularyManager() {
    console.log('初始化詞彙管理器');
    
    try {
        // 初始化資料庫
        await window.db.init();
        console.log('資料庫初始化完成');
    
        // 初始化詞彙列表
        await initVocabLists();
        
        // 確保tools-container元素存在
        ensureToolsContainerExists();
    
        // 初始化詞彙操作
        await initVocabOperations();
    
        // 載入詞彙數據
        await loadVocabularyData();
        
        console.log('詞彙管理器初始化完成');
    } catch (error) {
        console.error('初始化詞彙管理器失敗:', error);
    }
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
            `;
            
            // 添加到page-header
            pageHeader.appendChild(toolsContainer);
            console.log('已創建tools-container元素');
        } else {
            console.error('找不到page-header元素，無法創建tools-container');
        }
    } else {
        console.log('找到現有的tools-container元素');
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
    
    const icon = document.createElement('i');
    icon.className = list.icon || 'fas fa-list';
    
    const name = document.createElement('span');
    name.className = 'list-name';
    name.textContent = list.name;
    
    const count = document.createElement('span');
    count.className = 'word-count';
    count.textContent = '0';
    
    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(count);
    
    // 如果不是預設列表，添加編輯和刪除按鈕
    if (!['all', 'notLearned', 'learning', 'mastered'].includes(list.id)) {
        const actions = document.createElement('div');
        actions.className = 'list-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-list-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
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
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`確定要刪除詞彙組「${list.name}」嗎？`)) {
            deleteVocabList(list.id);
            }
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        item.appendChild(actions);
    }
    
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
 * 新增詞彙組
 */
async function addNewVocabList(name) {
    try {
        const list = {
            name,
            icon: 'fas fa-list',
            createdAt: new Date().toISOString()
        };
        
        await window.db.addWordList(list);
        console.log('新增詞彙組成功');
        
        // 重新初始化詞彙列表
        await initVocabLists();
        
        // 更新詞彙表計數
        await updateVocabListCounts();
        
    } catch (error) {
        console.error('新增詞彙組失敗:', error);
        alert('新增詞彙組失敗，請稍後再試');
    }
}

/**
 * 更新詞彙組
 */
async function updateVocabList(id, name) {
    try {
        const list = {
            id,
            name,
            updatedAt: new Date().toISOString()
        };
        
        await window.db.updateWordList(list);
        console.log('更新詞彙組成功');
        
        // 重新初始化詞彙列表
        await initVocabLists();
        
    } catch (error) {
        console.error('更新詞彙組失敗:', error);
        alert('更新詞彙組失敗，請稍後再試');
    }
}

/**
 * 刪除詞彙組
 */
async function deleteVocabList(id) {
    try {
        await window.db.deleteWordList(id);
        console.log('刪除詞彙組成功');
        
        // 如果當前選中的是被刪除的詞彙組，切換到「所有單字」
        if (currentVocabList === id) {
            currentVocabList = 'all';
        }
        
        // 重新初始化詞彙列表
        await initVocabLists();
        
        // 重新載入詞彙
        await loadVocabularyData();
        
    } catch (error) {
        console.error('刪除詞彙組失敗:', error);
        alert('刪除詞彙組失敗，請稍後再試');
    }
}

/**
 * 更新詞彙表計數
 */
async function updateVocabListCounts() {
    try {
        // 獲取所有單字
        const allWords = await window.db.getAllWords();
        
        // 更新預設列表的計數
        const notLearned = allWords.filter(w => w.status === 'notLearned').length;
        const learning = allWords.filter(w => w.status === 'learning').length;
        const mastered = allWords.filter(w => w.status === 'mastered').length;
        
        document.querySelector('[data-list-id="all"] .word-count').textContent = allWords.length;
        document.querySelector('[data-list-id="notLearned"] .word-count').textContent = notLearned;
        document.querySelector('[data-list-id="learning"] .word-count').textContent = learning;
        document.querySelector('[data-list-id="mastered"] .word-count').textContent = mastered;
        
        // 獲取所有詞彙組
        const lists = await window.db.getAllWordLists();
        
        // 更新每個詞彙組的計數
        for (const list of lists) {
            const words = await window.db.getWordsInList(list.id);
            const countElement = document.querySelector(`[data-list-id="${list.id}"] .word-count`);
            if (countElement) {
                countElement.textContent = words.length;
            }
        }
        
    } catch (error) {
        console.error('更新詞彙表計數失敗:', error);
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
 */
function displayVocabularyPage(page = 1) {
    console.log('顯示詞彙頁面，頁碼:', page);
    
    // 設置當前頁碼
    currentPage = page || 1;
    
    // 獲取每頁顯示數量
    const itemsPerPage = 10;
    
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
        return;
    }
    
    // 創建單字元素
    currentPageWords.forEach(word => {
        const wordElement = createWordElement(word);
        vocabularyList.appendChild(wordElement);
    });
}

/**
 * 創建單字元素
 */
function createWordElement(word) {
    console.log('創建單字元素:', word.word);
    
    const wordElement = document.createElement('div');
    wordElement.className = 'vocab-item';
    wordElement.setAttribute('data-id', word.id);
    
    const wordInfo = document.createElement('div');
    wordInfo.className = 'word-info';
    
    const wordMain = document.createElement('div');
    wordMain.className = 'word-main';
    
    const wordText = document.createElement('h3');
    wordText.textContent = word.word;
    
    const phoneticSpan = document.createElement('span');
    phoneticSpan.className = 'phonetic';
    phoneticSpan.textContent = word.phonetic || '';
    
    wordMain.appendChild(wordText);
    wordMain.appendChild(phoneticSpan);
    
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
    
    wordStatus = document.createElement('div');
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
    
    const addToFlashcardBtn = document.createElement('button');
    addToFlashcardBtn.className = 'add-to-flashcard-btn';
    addToFlashcardBtn.innerHTML = '<i class="fas fa-copy"></i>';
    addToFlashcardBtn.title = '加入記憶卡';
    addToFlashcardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToFlashcards(word.id);
    });
    
    wordActions.appendChild(editBtn);
    wordActions.appendChild(deleteBtn);
    wordActions.appendChild(addToFlashcardBtn);
    
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
function searchVocabulary(term) {
    console.log('搜索詞彙:', term);
    
    if (!term) {
        console.log('搜索詞為空，顯示當前詞彙表的所有單字');
        // 如果搜索詞為空，顯示當前詞彙表的所有單字
        loadVocabularyData(currentVocabList);
        return;
    }
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法載入單字數據');
        return;
    }
    
    console.log('當前詞彙表:', currentVocabList);
    
    // 根據搜索詞和當前詞彙表過濾單字
    filteredWords = window.appData.vocabulary.filter(word => {
        // 首先檢查是否屬於當前詞彙表
        let inCurrentList = true;
        if (currentVocabList !== 'all') {
            if (currentVocabList === 'mastered') {
                inCurrentList = word.status === 'mastered';
            } else if (currentVocabList === 'new') {
                inCurrentList = word.status === 'new';
            } else if (currentVocabList === 'difficult') {
                inCurrentList = word.status === 'difficult';
            } else {
                // 自訂詞彙表
                inCurrentList = word.lists && word.lists.some(list => 
                    list.toLowerCase() === currentVocabList.toLowerCase() || 
                    list.toLowerCase().includes(currentVocabList.toLowerCase())
                );
            }
        }
        
        // 然後檢查是否匹配搜索詞
        const matchesTerm = 
            (word.word && word.word.toLowerCase().includes(term.toLowerCase())) || 
            (word.meaning && word.meaning.toLowerCase().includes(term.toLowerCase())) ||
            (word.phonetic && word.phonetic.toLowerCase().includes(term.toLowerCase())) ||
            (word.partOfSpeech && translatePartOfSpeech(word.partOfSpeech).toLowerCase().includes(term.toLowerCase())) ||
            (word.examples && word.examples.some(example => example.toLowerCase().includes(term.toLowerCase())));
        
        return inCurrentList && matchesTerm;
    });
    
    console.log('過濾後的單字數量:', filteredWords.length);
    
    // 重置頁碼並顯示
    currentPage = 1;
    displayVocabularyPage();
}

/**
 * 新增單字
 */
async function addNewWord() {
    console.log('新增單字');
    
    // 獲取表單數據
    const word = document.getElementById('newWord').value.trim();
    const phonetic = document.getElementById('newPhonetic').value.trim();
    const partOfSpeech = document.getElementById('newPartOfSpeech').value;
    const meaning = document.getElementById('newMeaning').value.trim();
    const examples = document.getElementById('newExamples').value.trim();
    const status = document.getElementById('newStatus').value;
    
    // 檢查必填字段
    if (!word || !meaning) {
        alert('請填寫單字和意思');
        return;
    }
    
    try {
        // 創建新單字對象
        const newWord = {
            word,
            phonetic,
            partOfSpeech,
            meaning,
            examples,
            status,
            createdAt: new Date().toISOString()
        };
        
        // 先隱藏模態框，避免操作延遲導致用戶重複點擊
        hideAddWordModal();
        
        // 添加到資料庫
        const id = await window.db.addWord(newWord);
        console.log('單字添加成功，ID:', id);
        
        // 重新載入詞彙數據
        await loadVocabularyData();
        
        // 顯示成功訊息，放在異步操作完成後
        showNotification(`單字「${word}」已成功添加`, 'success');
    } catch (error) {
        console.error('添加單字失敗:', error);
        showNotification('添加單字失敗，請稍後再試', 'error');
    }
}

/**
 * 保存編輯的單字
 */
async function saveEditedWord() {
    console.log('保存編輯的單字');
    
    const id = parseInt(document.getElementById('editWordId').value);
    
    if (!id) {
        console.error('無效的單字ID');
        showNotification('保存失敗：無效的單字ID', 'error');
        return;
    }
    
    try {
        // 獲取表單數據
        const word = document.getElementById('editWord').value.trim();
        const phonetic = document.getElementById('editPhonetic').value.trim();
        const partOfSpeech = document.getElementById('editPartOfSpeech').value;
        const meaning = document.getElementById('editMeaning').value.trim();
        const examples = document.getElementById('editExamples').value.trim();
        const status = document.getElementById('editStatus').value;
        
        // 檢查必填字段
        if (!word || !meaning) {
            showNotification('請填寫單字和意思', 'warning');
            return;
        }
        
        // 創建更新的單字對象
        const updatedWord = {
            id,
            word,
            phonetic,
            partOfSpeech,
            meaning,
            examples,
            status,
            updatedAt: new Date().toISOString()
        };
        
        // 隱藏模態框
        hideEditWordModal();
        
        // 更新單字
        await window.db.updateWord(updatedWord);
        console.log('單字更新成功');
        
        // 重新載入詞彙數據
        await loadVocabularyData();
        
        // 顯示成功訊息
        showNotification(`單字「${word}」更新成功`, 'success');
    } catch (error) {
        console.error('更新單字失敗:', error);
        showNotification('更新單字失敗，請稍後再試', 'error');
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
 * 顯示單字詳情
 * @param {number} wordId - 單字ID
 */
function viewWordDetails(wordId) {
    console.log(`顯示單字詳情: ${wordId}`);
    
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法顯示單字詳情：appData 或 vocabulary 未定義');
        alert('無法顯示單字詳情');
        return;
    }
    
    // 查找單字
    const word = window.appData.vocabulary.find(w => w.id === wordId);
    if (!word) {
        console.error(`找不到 ID 為 ${wordId} 的單字`);
        alert('找不到該單字');
        return;
    }
    
    // 獲取詳情容器
    const detailsContent = document.getElementById('wordDetailsContent');
    if (!detailsContent) {
        console.error('找不到單字詳情容器');
        alert('無法顯示單字詳情');
        return;
    }
    
    // 格式化例句
    let examplesHtml = '';
    if (word.examples && word.examples.length > 0) {
        examplesHtml = `
            <div class="details-section">
                <h4>例句</h4>
                <ul class="examples-list">
                    ${word.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // 格式化學習狀態
    let statusText = '';
    let statusClass = '';
    
    if (word.status === 'notLearned') {
        statusText = '未學習';
        statusClass = 'status-not-learned';
    } else if (word.status === 'learning') {
        statusText = '學習中';
        statusClass = 'status-learning';
    } else if (word.status === 'mastered') {
        statusText = '已掌握';
        statusClass = 'status-mastered';
    }
    
    // 格式化最後複習日期
    let lastReviewedText = word.lastReviewed 
        ? new Date(word.lastReviewed).toLocaleDateString() 
        : '尚未複習';
    
    // 生成詳情 HTML
    detailsContent.innerHTML = `
        <div class="word-details">
            <div class="details-header">
                <h2 class="word-title">${word.word}</h2>
                ${word.phonetic ? `<span class="word-phonetic">/${word.phonetic}/</span>` : ''}
                <button class="pronounce-btn" onclick="pronounceWord('${word.word}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
            
            <div class="details-section">
                <div class="detail-item">
                    <span class="detail-label">詞性:</span>
                    <span class="detail-value">${word.partOfSpeech || '未指定'}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">意思:</span>
                    <span class="detail-value">${word.meaning}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">學習狀態:</span>
                    <span class="detail-value status-badge ${statusClass}">${statusText}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">添加日期:</span>
                    <span class="detail-value">${new Date(word.dateAdded).toLocaleDateString()}</span>
                </div>
                
                <div class="detail-item">
                    <span class="detail-label">最後複習:</span>
                    <span class="detail-value">${lastReviewedText}</span>
                </div>
            </div>
            
            ${examplesHtml}
        </div>
    `;
    
    // 顯示模態框
    showWordDetailsModal();
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
 */
function showEditWordModal(word) {
    console.log('顯示編輯單字的模態框', word);
    
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
    document.getElementById('editExamples').value = word.examples || '';
    document.getElementById('editStatus').value = word.status;
    
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
        importBtn.addEventListener('click', () => {
            importFileInput.click();
        });
        
        importFileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
            const file = e.target.files[0];
                await importVocabulary(file);
                // 清空文件輸入，以便下次選擇同一文件時也能觸發事件
                importFileInput.value = '';
            }
        });
    }
    
    // 綁定導出 JSON 按鈕事件
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            exportVocabulary('json');
        });
    }
    
    // 綁定導出 CSV 按鈕事件
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            exportVocabulary('csv');
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
    if (document.getElementById('importBasic2005Btn')) {
        console.log('已存在導入基礎2005單字按鈕');
        return;
    }
    
    // 創建基礎2005單字導入按鈕
    const importBasic2005Btn = document.createElement('button');
    importBasic2005Btn.id = 'importBasic2005Btn';
    importBasic2005Btn.className = 'btn btn-primary';
    importBasic2005Btn.innerHTML = '<i class="fas fa-book"></i> 導入國中基礎2005單字';
    importBasic2005Btn.title = '導入國中基礎2005個單字';
    
    // 添加點擊事件
    importBasic2005Btn.addEventListener('click', async () => {
        if (confirm('確定要導入國中基礎2005個單字嗎？這將創建一個新的詞彙組並添加所有單字。')) {
            // 確認window.db對象中有importBasic2005Words函數
            if (window.db && typeof window.db.importBasic2005Words === 'function') {
                try {
                    // 显示加载中提示
                    showNotification('正在導入，請稍候...', 'info');
                    
                    // 调用导入函数
                    const result = await window.db.importBasic2005Words();
                    
                    if (result.success) {
                        showNotification(`導入完成！新增: ${result.added} 個，已存在: ${result.skipped} 個`, 'success');
                    } else {
                        showNotification(`導入失敗: ${result.error}`, 'error');
                    }
                } catch (error) {
                    console.error('導入國中基礎2005單字失敗:', error);
                    showNotification('導入失敗，請稍後再試', 'error');
                }
            } else {
                console.error('window.db.importBasic2005Words 函數不可用');
                showNotification('導入功能不可用，請確保已加載相關資源', 'error');
                
                // 嘗試動態加載 database.js
                const script = document.createElement('script');
                script.src = 'js/database.js';
                script.onload = () => {
                    showNotification('資源已載入，請再次嘗試導入', 'info');
                };
                script.onerror = () => {
                    showNotification('無法載入導入功能所需資源', 'error');
                };
                document.head.appendChild(script);
            }
        }
    });
    
    // 將按鈕添加到容器中
    importExportContainer.appendChild(importBasic2005Btn);
    console.log('已添加導入基礎2005單字按鈕');
}

/**
 * 匯出詞彙列表
 * @param {string} format - 匯出格式（'json' 或 'csv'）
 * @param {Array} wordList - 要匯出的詞彙列表，如果未提供則匯出所有詞彙
 */
function exportVocabulary(format = 'json', wordList = null) {
    console.log(`開始匯出 ${format} 格式的詞彙`);
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法獲取詞彙數據');
        alert('匯出失敗：無法獲取詞彙數據');
        return;
    }
    
    // 如果未提供詞彙列表，使用所有詞彙或當前過濾的詞彙
    const vocabularyToExport = wordList || (filteredWords.length > 0 ? filteredWords : window.appData.vocabulary);
    
    if (vocabularyToExport.length === 0) {
        alert('沒有可匯出的詞彙');
        return;
    }
    
    let content = '';
    let filename = `vocabulary_${new Date().toISOString().split('T')[0]}`;
    
    try {
        if (format === 'json') {
            content = JSON.stringify(vocabularyToExport, null, 2);
            filename += '.json';
            downloadWithCreateElement(content, filename, 'application/json');
        } else if (format === 'csv') {
            // CSV 標頭
            const headers = ['id', 'word', 'meaning', 'phonetic', 'partOfSpeech', 'examples', 
                            'notes', 'status', 'category', 'synonyms', 'antonyms', 
                            'associations', 'context', 'difficulty', 'lists'];
            
            content = headers.join(',') + '\n';
            
            // 添加每個詞彙的數據
            vocabularyToExport.forEach(word => {
                const row = [
                    word.id,
                    `"${word.word}"`,
                    `"${word.meaning}"`,
                    `"${word.phonetic || ''}"`,
                    `"${word.partOfSpeech || ''}"`,
                    `"${(word.examples || []).join('; ')}"`,
                    `"${word.notes || ''}"`,
                    `"${word.status || ''}"`,
                    `"${word.category || ''}"`,
                    `"${(word.synonyms || []).join('; ')}"`,
                    `"${(word.antonyms || []).join('; ')}"`,
                    `"${(word.associations || []).join('; ')}"`,
                    `"${word.context || ''}"`,
                    word.difficulty || 1,
                    `"${(word.lists || []).join('; ')}"`
                ];
                content += row.join(',') + '\n';
            });
            
            filename += '.csv';
            downloadWithCreateElement(content, filename, 'text/csv');
        }
        
        console.log(`匯出完成: ${filename}`);
    } catch (error) {
        console.error('匯出過程中發生錯誤:', error);
        alert(`匯出失敗: ${error.message}`);
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
 * @param {File} file - 要匯入的檔案
 * @returns {Promise} - 匯入結果的 Promise
 */
async function importVocabulary(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                let importedWords = [];
                
                if (file.name.endsWith('.json')) {
                    // 解析 JSON
                    importedWords = JSON.parse(e.target.result);
                } else if (file.name.endsWith('.csv')) {
                    // 解析 CSV
                    importedWords = parseCSV(e.target.result);
                } else {
                    throw new Error('不支援的檔案格式');
                }
                
                // 驗證並處理匯入的詞彙
                const processedWords = await processImportedWords(importedWords);
                
                // 更新詞彙列表
                window.appData.vocabulary = [
                    ...window.appData.vocabulary,
                    ...processedWords
                ];
                
                // 保存到本地存儲
                saveAppData();
                
                resolve({
                    success: true,
                    message: `成功匯入 ${processedWords.length} 個單字`,
                    importedWords: processedWords
                });
            } catch (error) {
                reject({
                    success: false,
                    message: '匯入失敗：' + error.message
                });
            }
        };
        
        reader.onerror = () => {
            reject({
                success: false,
                message: '讀取檔案失敗'
            });
        };
        
        if (file.name.endsWith('.json')) {
            reader.readAsText(file);
        } else if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reject({
                success: false,
                message: '不支援的檔案格式'
            });
        }
    });
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
 * 處理匯入的詞彙
 * @param {Array} words - 要處理的詞彙陣列
 * @returns {Promise} - 處理後的詞彙陣列
 */
async function processImportedWords(words) {
    const existingWords = window.appData.vocabulary;
    const processedWords = [];
    
    for (const word of words) {
        // 檢查是否已存在相同的單字
        const existingWord = existingWords.find(w => w.word.toLowerCase() === word.word.toLowerCase());
        
        if (existingWord) {
            // 如果存在，更新現有單字
            Object.assign(existingWord, word);
            processedWords.push(existingWord);
        } else {
            // 如果不存在，添加為新單字
            const newWord = {
                ...word,
                id: Math.max(0, ...existingWords.map(w => w.id)) + 1,
                status: word.status || 'new',
                lastReviewed: null,
                nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            processedWords.push(newWord);
        }
    }
    
    return processedWords;
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
    
    // 綁定新增單字按鈕事件
    const addWordBtn = document.getElementById('addWordBtn');
    if (addWordBtn) {
        addWordBtn.addEventListener('click', () => {
            showAddWordModal();
        });
    } else {
        console.error('找不到 addWordBtn 元素');
    }
    
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
        searchBtn.addEventListener('click', () => {
            searchVocabulary(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchVocabulary(searchInput.value);
            }
        });
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

/**
 * 添加詞彙表樣式
 */
function addVocabularyStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .vocabulary-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 20px;
        }
        
        .vocab-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
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
            gap: 10px;
            margin-bottom: 4px;
        }
        
        .word-main h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        
        .phonetic {
            color: #666;
            font-style: italic;
        }
        
        .word-details {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .part-of-speech {
            padding: 2px 6px;
            background: #f0f0f0;
            border-radius: 4px;
            font-size: 0.8rem;
            color: #555;
        }
        
        .meaning {
            color: #333;
        }
        
        .word-status {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        
        .status-badge.notLearned {
            background: #ffd8d8;
            color: #c62828;
        }
        
        .status-badge.learning {
            background: #fff0c2;
            color: #f57c00;
        }
        
        .status-badge.mastered {
            background: #d6ffdd;
            color: #2e7d32;
        }
        
        .word-actions {
            display: flex;
            gap: 6px;
        }
        
        .word-actions button {
            background: none;
            border: none;
            border-radius: 4px;
            padding: 6px;
            cursor: pointer;
            color: #555;
            transition: all 0.2s;
        }
        
        .word-actions button:hover {
            background: #f0f0f0;
            color: #333;
        }
        
        .edit-btn:hover {
            color: #2196F3;
        }
        
        .delete-btn:hover {
            color: #F44336;
        }
        
        .add-to-flashcard-btn:hover {
            color: #4CAF50;
        }
        
        .view-examples-btn {
            background: none;
            border: none;
            padding: 6px;
            border-radius: 4px;
            cursor: pointer;
            color: #555;
        }
        
        .view-examples-btn:hover {
            background: #f0f0f0;
            color: #333;
        }
        
        .empty-message {
            text-align: center;
            padding: 40px;
            color: #888;
            font-style: italic;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        }
        
        .page-btn {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .page-btn.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
        
        .page-btn:hover:not(.active) {
            background: #f5f5f5;
        }
        
        /* 通知樣式 */
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-size: 14px;
            transition: opacity 0.3s ease;
            opacity: 0;
            display: none;
        }
        
        .notification.info {
            background-color: #e3f2fd;
            color: #0d47a1;
            border-left: 4px solid #2196F3;
        }
        
        .notification.success {
            background-color: #e8f5e9;
            color: #1b5e20;
            border-left: 4px solid #4CAF50;
        }
        
        .notification.error {
            background-color: #ffebee;
            color: #b71c1c;
            border-left: 4px solid #F44336;
        }
        
        .notification.warning {
            background-color: #fff8e1;
            color: #ff6f00;
            border-left: 4px solid #FFC107;
        }
    `;
    document.head.appendChild(styleElement);
} 