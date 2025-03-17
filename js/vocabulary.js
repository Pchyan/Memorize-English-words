/**
 * 單字記憶大師 - 詞彙管理模組
 * 負責詞彙表管理、單字添加/編輯/刪除等功能
 */

let currentVocabList = 'all';
let currentPage = 1;
const pageSize = 10;
let filteredWords = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded 事件觸發');
    
    // 確保 window.appData 被正確初始化
    if (!window.appData) {
        console.log('初始化 window.appData');
        window.appData = {
            vocabulary: [],
            userSettings: {},
            learningHistory: [],
            journal: [],
            achievements: [],
            customLists: []
        };
    }
    
    if (!window.appData.vocabulary) {
        console.log('初始化 window.appData.vocabulary');
        window.appData.vocabulary = [];
    }
    
    if (!window.appData.customLists) {
        console.log('初始化 window.appData.customLists');
        window.appData.customLists = [];
    }
    
    // 從 localStorage 載入數據
    try {
        const savedData = localStorage.getItem('vocabMasterData');
        if (savedData) {
            window.appData = JSON.parse(savedData);
            console.log('從 localStorage 載入數據成功，詞彙數量:', window.appData.vocabulary.length);
        } else {
            console.log('localStorage 中沒有保存的數據');
            saveAppData(); // 保存初始化的空數據
        }
    } catch (e) {
        console.error('載入數據時發生錯誤:', e);
    }
    
    // 檢查當前頁面是否為詞彙管理頁面
    const vocabularyPage = document.getElementById('vocabulary');
    if (vocabularyPage && vocabularyPage.classList.contains('active')) {
        console.log('當前頁面是詞彙管理頁面，立即初始化');
        initVocabularyManager();
    } else {
        console.log('當前頁面不是詞彙管理頁面，等待頁面切換時初始化');
    }
    
    // 綁定導航事件
    const vocabNavLink = document.querySelector('nav a[data-page="vocabulary"]');
    if (vocabNavLink) {
        vocabNavLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('點擊詞彙管理導航鏈接');
            switchPage('vocabulary');
        });
    }
});

/**
 * 初始化詞彙管理器
 */
function initVocabularyManager() {
    console.log('初始化詞彙管理器');
    
    // 確保全局變量已初始化
    window.currentPage = 1;
    window.itemsPerPage = 10;
    
    // 初始化詞彙列表
    initVocabLists();
    
    // 初始化詞彙操作
    initVocabOperations();
    
    // 初始化導入/導出功能
    initImportExportFeatures();
    
    // 初始化模態框關閉按鈕
    initModalCloseButtons();
    
    // 初始化搜索功能
    initSearchFunction();
    
    // 載入詞彙數據
    loadVocabularyData();
    
    // 更新詞彙表計數
    updateVocabListCounts();
}

/**
 * 初始化詞彙列表
 */
function initVocabLists() {
    console.log('初始化詞彙列表');
    
    const vocabListContainer = document.getElementById('vocabLists');
    if (!vocabListContainer) {
        console.error('找不到詞彙列表容器 #vocabLists');
        
        // 嘗試查找其他可能的容器
        const alternativeContainer = document.querySelector('.vocab-list-container');
        if (alternativeContainer) {
            console.log('找到替代容器 .vocab-list-container');
            
            // 創建一個新的容器
            const newContainer = document.createElement('div');
            newContainer.id = 'vocabLists';
            alternativeContainer.appendChild(newContainer);
            
            // 重新調用初始化函數
            return initVocabLists();
        }
        
        return;
    }
    
    // 清空列表容器
    vocabListContainer.innerHTML = '';
    
    // 創建預設列表
    const defaultLists = [
        { id: 'all', name: '所有單字', icon: 'fa-list' },
        { id: 'notLearned', name: '未學習', icon: 'fa-book' },
        { id: 'learning', name: '學習中', icon: 'fa-graduation-cap' },
        { id: 'mastered', name: '已掌握', icon: 'fa-check-circle' }
    ];
    
    // 添加預設列表
    defaultLists.forEach(list => {
        const listItem = createListItem(list);
        vocabListContainer.appendChild(listItem);
    });
    
    // 添加自定義列表
    if (window.appData && window.appData.customLists && window.appData.customLists.length > 0) {
        // 添加分隔線
        const separator = document.createElement('div');
        separator.classList.add('list-separator');
        vocabListContainer.appendChild(separator);
        
        // 添加自定義列表
        window.appData.customLists.forEach(list => {
            const listItem = createListItem(list);
            vocabListContainer.appendChild(listItem);
        });
    }
    
    // 更新詞彙列表計數
    updateVocabListCounts();
    
    // 默認選中「所有單字」列表
    const allListItem = vocabListContainer.querySelector('.vocab-list-item[data-id="all"]');
    if (allListItem) {
        allListItem.classList.add('active');
        window.currentList = 'all';
    }
    
    console.log('詞彙列表初始化完成');
}

/**
 * 創建詞彙表項目
 * @param {Object} list - 詞彙表對象
 * @returns {HTMLElement} - 詞彙表項目元素
 */
function createListItem(list) {
    console.log('創建詞彙表項目:', list);
    
    const listItem = document.createElement('div');
    listItem.className = 'vocab-list-item';
    listItem.dataset.id = list.id;
    
    // 如果是當前選中的詞彙表，添加active類
    if (list.id === currentVocabList) {
        listItem.classList.add('active');
    }
    
    // 計算該詞彙表中的單字數量
    let count = 0;
    if (window.appData && window.appData.vocabulary) {
        if (list.id === 'all') {
            count = window.appData.vocabulary.length;
        } else if (list.id === 'notLearned') {
            count = window.appData.vocabulary.filter(word => 
                word.status === 'new' || word.status === 'notLearned'
            ).length;
        } else if (list.id === 'learning') {
            count = window.appData.vocabulary.filter(word => 
                word.status === 'learning'
            ).length;
        } else if (list.id === 'mastered') {
            count = window.appData.vocabulary.filter(word => 
                word.status === 'mastered'
            ).length;
        } else {
            // 自定義詞彙表
            count = window.appData.vocabulary.filter(word => 
                word.lists && Array.isArray(word.lists) && word.lists.includes(list.id)
            ).length;
        }
    }
    
    // 創建詞彙表內容
    const icon = document.createElement('i');
    icon.className = `fas ${list.icon}`;
    
    const listName = document.createElement('span');
    listName.className = 'list-name';
    listName.textContent = list.name;
    
    const countSpan = document.createElement('span');
    countSpan.className = 'count';
    countSpan.textContent = count;
    
    listItem.appendChild(icon);
    listItem.appendChild(listName);
    listItem.appendChild(countSpan);
    
    // 如果是自定義詞彙表，添加刪除按鈕
    if (list.id !== 'all' && list.id !== 'notLearned' && list.id !== 'learning' && list.id !== 'mastered') {
        const deleteBtn = document.createElement('i');
        deleteBtn.className = 'fas fa-times delete-list-btn';
        deleteBtn.title = '刪除詞彙表';
        
        // 添加刪除事件
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止觸發詞彙表點擊事件
            deleteVocabList(list.id);
        });
        
        listItem.appendChild(deleteBtn);
    }
    
    // 添加點擊事件
    listItem.addEventListener('click', () => {
        // 移除所有項目的active類
        document.querySelectorAll('.vocab-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 將當前項目設為active
        listItem.classList.add('active');
        
        // 更新當前詞彙表
        currentVocabList = list.id;
        
        // 過濾並顯示該詞彙表的單字
        filterVocabulary();
    });
    
    return listItem;
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
 * 添加新詞彙表
 * @param {string} listName - 詞彙表名稱
 */
function addNewVocabList(listName) {
    console.log(`添加新詞彙表: ${listName}`);
    
    if (!listName || listName.trim() === '') {
        alert('詞彙表名稱不能為空');
        return;
    }
    
    // 檢查是否已存在同名詞彙表
    if (window.appData.customLists && window.appData.customLists.some(list => list.name === listName)) {
        alert(`詞彙表 "${listName}" 已存在`);
        return;
    }
    
    // 創建新詞彙表
    const newList = {
        id: 'custom_' + Date.now(),
        name: listName,
        icon: 'fa-list-alt'
    };
    
    // 添加到全局數據
    if (!window.appData.customLists) {
        window.appData.customLists = [];
    }
    
    window.appData.customLists.push(newList);
    
    // 保存數據
    saveAppData();
    
    // 重新初始化詞彙表
    initVocabLists();
    
    // 更新記憶卡頁面的詞彙表下拉選單
    updateFlashcardDeckSelector();
    
    // 顯示成功訊息
    alert(`詞彙表 "${listName}" 已創建`);
}

/**
 * 刪除詞彙表
 * @param {string} listId - 詞彙表ID
 */
function deleteVocabList(listId) {
    console.log(`刪除詞彙表: ${listId}`);
    
    if (!listId || !window.appData.customLists) {
        return;
    }
    
    // 找到要刪除的詞彙表
    const listIndex = window.appData.customLists.findIndex(list => list.id === listId);
    if (listIndex === -1) {
        console.error(`找不到ID為 ${listId} 的詞彙表`);
        return;
    }
    
    const listName = window.appData.customLists[listIndex].name;
    
    // 確認刪除
    if (!confirm(`確定要刪除詞彙表 "${listName}" 嗎？`)) {
        return;
    }
    
    // 從全局數據中刪除
    window.appData.customLists.splice(listIndex, 1);
    
    // 保存數據
    saveAppData();
    
    // 重新初始化詞彙表
    initVocabLists();
    
    // 更新記憶卡頁面的詞彙表下拉選單
    updateFlashcardDeckSelector();
    
    // 如果當前選中的是被刪除的詞彙表，切換到"所有單字"
    if (currentVocabList === listId) {
        currentVocabList = 'all';
        filterVocabulary();
    }
    
    // 顯示成功訊息
    alert(`詞彙表 "${listName}" 已刪除`);
}

/**
 * 更新記憶卡頁面的詞彙表下拉選單
 */
function updateFlashcardDeckSelector() {
    // 檢查是否有initDeckSelector函數
    if (typeof initDeckSelector === 'function') {
        initDeckSelector();
    } else {
        console.log('記憶卡模組尚未載入，無法更新詞彙表下拉選單');
    }
}

/**
 * 初始化詞彙操作
 */
function initVocabOperations() {
    console.log('初始化詞彙操作');
    
    // 設置全局變量
    window.currentPage = 1;
    window.itemsPerPage = 10;
    window.currentList = 'all';
    window.filteredVocabulary = [];
    window.searchTerm = '';
    
    // 添加單字按鈕
    const addWordBtn = document.getElementById('addWordBtn');
    if (addWordBtn) {
        console.log('找到 addWordBtn 元素，添加點擊事件');
        
        // 移除可能存在的舊事件監聽器
        const newBtn = addWordBtn.cloneNode(true);
        addWordBtn.parentNode.replaceChild(newBtn, addWordBtn);
        
        // 添加新的事件監聽器
        newBtn.addEventListener('click', function() {
            console.log('點擊了新增單字按鈕');
            // 顯示添加單字模態框
            showAddWordModal();
        });
    } else {
        console.error('找不到 addWordBtn 元素');
    }
    
    // 初始化搜索功能
    initSearchFunction();
    
    // 初始化添加單字表單
    const addWordForm = document.getElementById('addWordForm');
    if (addWordForm) {
        addWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewWord();
        });
    } else {
        console.error('找不到添加單字表單');
    }
    
    // 初始化編輯單字表單
    const editWordForm = document.getElementById('editWordForm');
    if (editWordForm) {
        editWordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveEditedWord();
        });
    } else {
        console.error('找不到編輯單字表單');
    }
    
    // 初始化模態框關閉按鈕
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            hideAddWordModal();
            hideEditWordModal();
            hideWordDetailsModal();
        });
    });
    
    // 初始化模態框遮罩層
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            hideAddWordModal();
            hideEditWordModal();
            hideWordDetailsModal();
        });
    } else {
        console.error('找不到模態框遮罩層');
    }
    
    console.log('詞彙操作初始化完成');
}

/**
 * 顯示添加單字模態框
 */
function showAddWordModal() {
    console.log('顯示添加單字模態框');
    
    const modal = document.getElementById('addWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到添加模態框或遮罩元素');
        if (!modal) console.error('找不到 addWordModal 元素');
        if (!overlay) console.error('找不到 modalOverlay 元素');
        alert('無法開啟添加單字視窗');
        return;
    }
    
    console.log('模態框和遮罩元素都存在，添加 active 類');
    
    // 添加 modal-open 類到 body
    document.body.classList.add('modal-open');
    
    // 確保模態框和遮罩層可見
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // 確保輸入框可以點選
    const inputs = modal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.pointerEvents = 'auto';
        input.style.zIndex = '1002';
    });
    
    // 使用 setTimeout 確保 display 屬性生效後再添加 active 類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
        
        // 聚焦第一個輸入框
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            firstInput.focus();
        }
        
        console.log('已添加 active 類');
    }, 10);
}

/**
 * 隱藏添加單字模態框
 */
function hideAddWordModal() {
    console.log('隱藏添加單字模態框');
    
    const modal = document.getElementById('addWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到添加模態框或遮罩元素');
        return;
    }
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 移除 modal-open 類
    document.body.classList.remove('modal-open');
    
    // 使用 setTimeout 確保過渡效果完成後再隱藏元素
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * 載入詞彙數據
 */
function loadVocabularyData() {
    console.log('載入詞彙數據');
    
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法載入詞彙數據：appData 或 vocabulary 未定義');
        return;
    }
    
    // 過濾詞彙
    filterVocabulary();
    
    // 更新詞彙列表計數
    updateVocabListCounts();
    
    console.log('詞彙數據載入完成');
}

/**
 * 顯示詞彙頁面
 */
function displayVocabularyPage() {
    console.log('顯示詞彙頁面');
    
    const vocabularyContainer = document.getElementById('vocabularyContainer');
    if (!vocabularyContainer) {
        console.error('找不到詞彙容器 #vocabularyContainer');
        
        // 嘗試查找其他可能的容器
        const alternativeContainer = document.querySelector('.vocabulary-content');
        if (alternativeContainer) {
            console.log('找到替代容器 .vocabulary-content');
            
            // 創建一個新的容器
            const newContainer = document.createElement('div');
            newContainer.id = 'vocabularyContainer';
            newContainer.className = 'vocabulary-container';
            alternativeContainer.appendChild(newContainer);
            
            // 重新調用顯示函數
            return displayVocabularyPage();
        }
        
        return;
    }
    
    // 清空容器
    vocabularyContainer.innerHTML = '';
    
    // 檢查是否有過濾後的單字
    if (!filteredWords || filteredWords.length === 0) {
        const noWordsMessage = document.createElement('div');
        noWordsMessage.className = 'no-words-message';
        noWordsMessage.textContent = '沒有找到符合條件的單字';
        vocabularyContainer.appendChild(noWordsMessage);
        
        // 隱藏分頁
        const paginationContainer = document.getElementById('paginationContainer');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        
        return;
    }
    
    // 計算當前頁的單字
    const startIndex = (window.currentPage - 1) * window.itemsPerPage;
    const endIndex = Math.min(startIndex + window.itemsPerPage, filteredWords.length);
    const currentPageWords = filteredWords.slice(startIndex, endIndex);
    
    console.log(`顯示第 ${window.currentPage} 頁，共 ${Math.ceil(filteredWords.length / window.itemsPerPage)} 頁`);
    console.log(`顯示單字索引 ${startIndex} 到 ${endIndex - 1}，共 ${currentPageWords.length} 個`);
    
    // 創建單字元素
    currentPageWords.forEach(word => {
        const wordElement = createWordElement(word);
        vocabularyContainer.appendChild(wordElement);
    });
    
    // 更新分頁
    updatePagination();
}

/**
 * 創建單字元素
 */
function createWordElement(word) {
    if (!word || !word.id) {
        console.error('無法創建單字元素：單字對象無效', word);
        return document.createElement('div'); // 返回空元素
    }
    
    console.log(`創建單字元素: ${word.word} (ID: ${word.id})`);
    
    const wordElement = document.createElement('div');
    wordElement.classList.add('word-item');
    wordElement.dataset.id = word.id;
    
    // 根據單字狀態添加對應的類
    if (word.status) {
        // 處理舊版狀態名稱
        let statusClass = word.status;
        if (word.status === 'new') statusClass = 'notLearned';
        if (word.status === 'difficult') statusClass = 'learning';
        
        wordElement.classList.add(`status-${statusClass}`);
    }
    
    // 創建單字內容
    const wordContent = document.createElement('div');
    wordContent.classList.add('word-content');
    
    // 單字和音標
    const wordHeader = document.createElement('div');
    wordHeader.classList.add('word-header');
    
    const wordText = document.createElement('h3');
    wordText.classList.add('word-text');
    wordText.textContent = word.word;
    wordHeader.appendChild(wordText);
    
    if (word.phonetic) {
        const phonetic = document.createElement('span');
        phonetic.classList.add('phonetic');
        phonetic.textContent = `/${word.phonetic}/`;
        wordHeader.appendChild(phonetic);
    }
    
    // 添加發音按鈕
    const pronounceBtn = document.createElement('button');
    pronounceBtn.classList.add('pronounce-btn');
    pronounceBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    pronounceBtn.title = '發音';
    pronounceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pronounceWord(word.word);
    });
    wordHeader.appendChild(pronounceBtn);
    
    wordContent.appendChild(wordHeader);
    
    // 詞性和意思
    const meaningContainer = document.createElement('div');
    meaningContainer.classList.add('meaning-container');
    
    if (word.partOfSpeech) {
        const partOfSpeech = document.createElement('span');
        partOfSpeech.classList.add('part-of-speech');
        partOfSpeech.textContent = translatePartOfSpeech(word.partOfSpeech);
        meaningContainer.appendChild(partOfSpeech);
    }
    
    const meaning = document.createElement('p');
    meaning.classList.add('meaning');
    meaning.textContent = word.meaning;
    meaningContainer.appendChild(meaning);
    
    wordContent.appendChild(meaningContainer);
    
    // 添加到單字元素
    wordElement.appendChild(wordContent);
    
    // 創建操作按鈕
    const actionButtons = document.createElement('div');
    actionButtons.classList.add('word-actions');
    
    // 查看按鈕
    const viewButton = document.createElement('button');
    viewButton.classList.add('view-btn');
    viewButton.innerHTML = '<i class="fas fa-eye"></i>';
    viewButton.title = '查看詳情';
    viewButton.addEventListener('click', (e) => {
        e.stopPropagation();
        viewWordDetails(word.id);
    });
    actionButtons.appendChild(viewButton);
    
    // 編輯按鈕
    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.title = '編輯單字';
    editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        editWord(word.id);
    });
    actionButtons.appendChild(editButton);
    
    // 刪除按鈕
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteButton.title = '刪除單字';
    deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWord(word.id);
    });
    actionButtons.appendChild(deleteButton);
    
    wordElement.appendChild(actionButtons);
    
    // 添加點擊事件，點擊單字元素時顯示詳情
    wordElement.addEventListener('click', () => {
        viewWordDetails(word.id);
    });
    
    return wordElement;
}

/**
 * 更新分頁
 */
function updatePagination() {
    console.log('更新分頁');
    
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) {
        console.error('找不到分頁容器 #paginationContainer');
        
        // 嘗試查找其他可能的容器
        const alternativeContainer = document.querySelector('.vocabulary-content');
        if (alternativeContainer) {
            console.log('找到替代容器 .vocabulary-content');
            
            // 創建一個新的容器
            const newContainer = document.createElement('div');
            newContainer.id = 'paginationContainer';
            newContainer.className = 'pagination';
            alternativeContainer.appendChild(newContainer);
            
            // 重新調用更新函數
            return updatePagination();
        }
        
        return;
    }
    
    // 清空分頁容器
    paginationContainer.innerHTML = '';
    
    // 如果沒有過濾後的單字，隱藏分頁
    if (!filteredWords || filteredWords.length === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // 顯示分頁
    paginationContainer.style.display = 'flex';
    
    // 計算總頁數
    const totalPages = Math.ceil(filteredWords.length / window.itemsPerPage);
    console.log(`總頁數: ${totalPages}，當前頁: ${window.currentPage}`);
    
    // 如果只有一頁，不顯示分頁
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // 創建上一頁按鈕
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = window.currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (window.currentPage > 1) {
            window.currentPage--;
            displayVocabularyPage();
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // 創建頁碼按鈕
    const maxPageButtons = 5; // 最多顯示的頁碼按鈕數
    let startPage = Math.max(1, window.currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // 調整起始頁，確保顯示足夠的頁碼按鈕
    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // 如果起始頁不是第一頁，顯示第一頁和省略號
    if (startPage > 1) {
        const firstPageBtn = document.createElement('button');
        firstPageBtn.className = 'pagination-btn';
        firstPageBtn.textContent = '1';
        firstPageBtn.addEventListener('click', () => {
            window.currentPage = 1;
            displayVocabularyPage();
        });
        paginationContainer.appendChild(firstPageBtn);
        
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // 創建頁碼按鈕
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-btn';
        if (i === window.currentPage) {
            pageBtn.classList.add('active');
        }
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            window.currentPage = i;
            displayVocabularyPage();
        });
        paginationContainer.appendChild(pageBtn);
    }
    
    // 如果結束頁不是最後一頁，顯示省略號和最後一頁
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageBtn = document.createElement('button');
        lastPageBtn.className = 'pagination-btn';
        lastPageBtn.textContent = totalPages;
        lastPageBtn.addEventListener('click', () => {
            window.currentPage = totalPages;
            displayVocabularyPage();
        });
        paginationContainer.appendChild(lastPageBtn);
    }
    
    // 創建下一頁按鈕
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = window.currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (window.currentPage < totalPages) {
            window.currentPage++;
            displayVocabularyPage();
        }
    });
    paginationContainer.appendChild(nextBtn);
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
 * 添加新單字
 */
function addNewWord() {
    console.log('開始添加新單字');
    
    try {
        // 獲取表單數據
        const wordInput = document.getElementById('newWord');
        const pronunciationInput = document.getElementById('newPhonetic');
        const partOfSpeechInput = document.getElementById('newPartOfSpeech');
        const meaningInput = document.getElementById('newMeaning');
        const exampleInput = document.getElementById('newExamples');
        const statusInput = document.getElementById('newStatus');
        
        console.log('表單元素:', {
            wordInput: wordInput ? 'found' : 'not found',
            pronunciationInput: pronunciationInput ? 'found' : 'not found',
            partOfSpeechInput: partOfSpeechInput ? 'found' : 'not found',
            meaningInput: meaningInput ? 'found' : 'not found',
            exampleInput: exampleInput ? 'found' : 'not found',
            statusInput: statusInput ? 'found' : 'not found'
        });
        
        if (!wordInput || !pronunciationInput || !partOfSpeechInput || !meaningInput || !exampleInput || !statusInput) {
            console.error('無法獲取表單元素');
            alert('無法獲取表單元素，請重新整理頁面後再試');
            return;
        }
        
        const wordValue = wordInput.value.trim();
        const pronunciationValue = pronunciationInput.value.trim();
        const partOfSpeechValue = partOfSpeechInput.value;
        const meaningValue = meaningInput.value.trim();
        const exampleValue = exampleInput.value.trim();
        const statusValue = statusInput.value;
        
        console.log('表單數據:', {
            word: wordValue,
            pronunciation: pronunciationValue,
            partOfSpeech: partOfSpeechValue,
            meaning: meaningValue,
            example: exampleValue,
            status: statusValue
        });
        
        // 獲取選擇的詞彙表
        let selectedLists = ['all']; // 默認使用 'all' 詞彙表
        
        // 驗證必填項
        if (!wordValue || !meaningValue) {
            alert('請填寫英文單字和中文意思');
            return;
        }
        
        // 確保 window.appData 存在
        if (!window.appData) {
            console.log('window.appData 不存在，創建新的 appData 對象');
            window.appData = {
                vocabulary: [],
                userSettings: {},
                learningHistory: [],
                journal: [],
                achievements: []
            };
        }
        
        // 確保 window.appData.vocabulary 是一個陣列
        if (!window.appData.vocabulary) {
            console.log('window.appData.vocabulary 不存在，創建新的 vocabulary 陣列');
            window.appData.vocabulary = [];
        } else if (!Array.isArray(window.appData.vocabulary)) {
            console.log('window.appData.vocabulary 不是陣列，重新初始化為空陣列');
            window.appData.vocabulary = [];
        }
        
        console.log('當前詞彙數量:', window.appData.vocabulary.length);
        
        // 查找最大ID
        let maxId = 0;
        if (Array.isArray(window.appData.vocabulary)) {
            window.appData.vocabulary.forEach(word => {
                if (word.id > maxId) maxId = word.id;
            });
        }
        
        // 創建新單字對象
        const newWord = {
            id: maxId + 1,
            word: wordValue,
            phonetic: pronunciationValue,
            partOfSpeech: partOfSpeechValue,
            meaning: meaningValue,
            examples: exampleValue ? exampleValue.split('\n').filter(line => line.trim()) : [],
            notes: '',
            status: statusValue,
            category: '',
            synonyms: [],
            antonyms: [],
            associations: [],
            context: '',
            difficulty: 2,
            lists: selectedLists.length > 0 ? selectedLists : ['all'],
            lastReviewed: null,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        console.log('新單字對象:', newWord);
        
        // 添加到全局數據
        console.log('準備添加單字到全局數據');
        
        // 添加新單字
        window.appData.vocabulary.push(newWord);
        console.log('已添加單字到全局數據，當前詞彙數量:', window.appData.vocabulary.length);
        
        // 保存到本地儲存
        try {
            // 直接使用 localStorage API 保存數據
            localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
            console.log('通過直接使用 localStorage API 保存數據');
        } catch (e) {
            console.error('保存數據時發生錯誤:', e);
            alert('警告：保存數據時發生錯誤，請確保您的瀏覽器支持本地存儲');
        }
        
        // 更新UI
        loadVocabularyData(currentVocabList);
        updateVocabListCounts();
        
        // 重置表單
        const form = document.getElementById('addWordForm');
        if (form) {
            form.reset();
        }
        
        // 關閉模態框
        hideAddWordModal();
        
        // 顯示成功訊息
        alert(`單字 "${wordValue}" 已成功添加`);
    } catch (error) {
        console.error('添加單字時發生錯誤:', error);
        alert('添加單字失敗: ' + error.message);
    }
}

/**
 * 編輯單字
 * @param {number} wordId - 單字ID
 */
function editWord(wordId) {
    console.log(`開始編輯單字 ID: ${wordId}`);
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法獲取詞彙數據');
        alert('編輯單字失敗：無法獲取詞彙數據');
        return;
    }
    
    // 查找單字
    const word = window.appData.vocabulary.find(w => w.id === wordId);
    if (!word) {
        alert('找不到要編輯的單字');
        return;
    }
    
    console.log('找到單字:', word);
    
    // 填充編輯表單
    fillEditForm(word);
    
    // 顯示編輯模態框
    showEditWordModal();
}

/**
 * 填充編輯表單
 * @param {Object} word - 單字對象
 */
function fillEditForm(word) {
    // 檢查是否已存在編輯模態框
    let editModal = document.getElementById('editWordModal');
    
    // 如果不存在，創建模態框
    if (!editModal) {
        const modalHTML = `
        <div id="editWordModal" class="modal">
            <div class="modal-header">
                <h3>編輯單字</h3>
                <button class="close-modal-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="editWordForm">
                    <input type="hidden" id="editWordId">
                    <div class="form-group">
                        <label for="editWord">英文單字</label>
                        <input type="text" id="editWord" required>
                    </div>
                    <div class="form-group">
                        <label for="editPhonetic">音標</label>
                        <input type="text" id="editPhonetic" placeholder="/ˈsæm.pəl/">
                    </div>
                    <div class="form-group">
                        <label for="editPartOfSpeech">詞性</label>
                        <select id="editPartOfSpeech">
                            <option value="noun">名詞</option>
                            <option value="verb">動詞</option>
                            <option value="adjective">形容詞</option>
                            <option value="adverb">副詞</option>
                            <option value="preposition">介系詞</option>
                            <option value="conjunction">連接詞</option>
                            <option value="interjection">感嘆詞</option>
                            <option value="pronoun">代名詞</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editMeaning">中文意思</label>
                        <input type="text" id="editMeaning" required>
                    </div>
                    <div class="form-group">
                        <label for="editExamples">例句</label>
                        <textarea id="editExamples" rows="3" placeholder="每行一個例句"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="editStatus">學習狀態</label>
                        <select id="editStatus">
                            <option value="new">待學習</option>
                            <option value="learning">學習中</option>
                            <option value="mastered">已掌握</option>
                            <option value="difficult">困難</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="button" id="cancelEditBtn" class="btn-secondary">取消</button>
                        <button type="submit" class="btn-primary">保存</button>
                    </div>
                </form>
            </div>
        </div>`;
        
        // 添加模態框到文檔
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 獲取新創建的模態框
        editModal = document.getElementById('editWordModal');
        
        // 綁定表單提交事件
        const editWordForm = document.getElementById('editWordForm');
        if (editWordForm) {
            editWordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveEditedWord();
            });
        }
        
        // 綁定取消按鈕事件
        const cancelEditBtn = document.getElementById('cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                hideEditWordModal();
            });
        }
        
        // 綁定關閉按鈕事件
        const closeBtn = editModal.querySelector('.close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideEditWordModal();
            });
        }
    }
    
    // 填充表單數據
    document.getElementById('editWordId').value = word.id;
    document.getElementById('editWord').value = word.word;
    document.getElementById('editPhonetic').value = word.phonetic || '';
    document.getElementById('editPartOfSpeech').value = word.partOfSpeech || 'noun';
    document.getElementById('editMeaning').value = word.meaning;
    document.getElementById('editExamples').value = (word.examples || []).join('\n');
    document.getElementById('editStatus').value = word.status || 'new';
    
    // 移除對不存在的 editVocabListInput 元素的引用
    // const vocabListInput = document.getElementById('editVocabListInput');
    // Array.from(vocabListInput.options).forEach(option => {
    //     option.selected = word.lists && word.lists.includes(option.value);
    // });
}

/**
 * 顯示編輯單字模態框
 */
function showEditWordModal() {
    console.log('顯示編輯單字模態框');
    
    const modal = document.getElementById('editWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到編輯模態框或遮罩元素');
        if (!modal) console.error('找不到 editWordModal 元素');
        if (!overlay) console.error('找不到 modalOverlay 元素');
        alert('無法開啟編輯單字視窗');
        return;
    }
    
    console.log('模態框和遮罩元素都存在，添加 active 類');
    
    // 添加 modal-open 類到 body
    document.body.classList.add('modal-open');
    
    // 確保模態框和遮罩層可見
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // 確保輸入框可以點選
    const inputs = modal.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.pointerEvents = 'auto';
        input.style.zIndex = '1002';
    });
    
    // 使用 setTimeout 確保 display 屬性生效後再添加 active 類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
        
        // 聚焦第一個輸入框
        const firstInput = modal.querySelector('input:not([type="hidden"])');
        if (firstInput) {
            firstInput.focus();
        }
        
        console.log('已添加 active 類');
    }, 10);
}

/**
 * 隱藏編輯單字模態框
 */
function hideEditWordModal() {
    console.log('隱藏編輯單字模態框');
    
    const modal = document.getElementById('editWordModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到編輯模態框或遮罩元素');
        return;
    }
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 移除 modal-open 類
    document.body.classList.remove('modal-open');
    
    // 使用 setTimeout 確保過渡效果完成後再隱藏元素
    setTimeout(() => {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }, 300);
}

/**
 * 保存編輯後的單字
 */
function saveEditedWord() {
    console.log('保存編輯後的單字');
    
    // 獲取表單數據
    const wordId = parseInt(document.getElementById('editWordId').value);
    const wordInput = document.getElementById('editWord').value.trim();
    const pronunciationInput = document.getElementById('editPhonetic').value.trim();
    const partOfSpeechInput = document.getElementById('editPartOfSpeech').value;
    const meaningInput = document.getElementById('editMeaning').value.trim();
    const exampleInput = document.getElementById('editExamples').value.trim();
    const statusInput = document.getElementById('editStatus').value;
    
    console.log('編輯表單數據:', {
        wordId,
        word: wordInput,
        pronunciation: pronunciationInput,
        partOfSpeech: partOfSpeechInput,
        meaning: meaningInput,
        example: exampleInput,
        status: statusInput
    });
    
    // 獲取選擇的詞彙表
    let selectedLists = ['all']; // 默認使用 'all' 詞彙表
    
    // 驗證必填項
    if (!wordInput || !meaningInput) {
        alert('請填寫英文單字和中文意思');
        return;
    }
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('全局詞彙數據不可用');
        alert('保存單字失敗：無法獲取詞彙數據');
        return;
    }
    
    // 查找單字索引
    const wordIndex = window.appData.vocabulary.findIndex(w => w.id === wordId);
    if (wordIndex === -1) {
        console.error(`找不到ID為 ${wordId} 的單字`);
        alert('找不到要編輯的單字');
        return;
    }
    
    // 獲取原單字對象
    const originalWord = window.appData.vocabulary[wordIndex];
    console.log('原單字對象:', originalWord);
    
    // 更新單字數據
    const updatedWord = {
        ...originalWord,
        word: wordInput,
        phonetic: pronunciationInput,
        partOfSpeech: partOfSpeechInput,
        meaning: meaningInput,
        examples: exampleInput ? exampleInput.split('\n').filter(line => line.trim()) : [],
        status: statusInput,
        lists: selectedLists.length > 0 ? selectedLists : ['all'],
        lastReviewed: new Date().toISOString()
    };
    
    console.log('更新後的單字對象:', updatedWord);
    
    // 更新全局數據
    window.appData.vocabulary[wordIndex] = updatedWord;
    
    // 保存到本地儲存
    try {
        localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
        console.log('數據已保存到本地儲存');
        
        // 更新UI
        loadVocabularyData(currentVocabList);
        
        // 關閉模態框
        hideEditWordModal();
        
        // 顯示成功訊息
        alert(`單字 "${wordInput}" 已成功更新`);
    } catch (e) {
        console.error('保存數據時發生錯誤:', e);
        alert('保存單字失敗：無法保存數據');
    }
}

/**
 * 刪除單字
 * @param {number} wordId - 單字ID
 */
function deleteWord(wordId) {
    console.log(`開始刪除單字 ID: ${wordId}`);
    
    if (!confirm('確定要刪除這個單字嗎？')) {
        console.log('用戶取消刪除');
        return;
    }
    
    // 檢查全局數據是否可用
    if (!window.appData || !window.appData.vocabulary) {
        console.error('全局詞彙數據不可用');
        alert('刪除單字失敗：無法獲取詞彙數據');
        return;
    }
    
    // 從全局數據中刪除
    const index = window.appData.vocabulary.findIndex(word => word.id === wordId);
    if (index !== -1) {
        const wordToDelete = window.appData.vocabulary[index];
        console.log(`找到要刪除的單字:`, wordToDelete);
        
        window.appData.vocabulary.splice(index, 1);
        console.log(`已從全局數據中刪除單字，剩餘單字數量: ${window.appData.vocabulary.length}`);
        
        // 保存到本地儲存
        try {
            localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
            console.log('數據已保存到本地儲存');
            
            // 更新UI
            loadVocabularyData(currentVocabList);
            
            // 顯示成功訊息
            alert(`單字 "${wordToDelete.word}" 已成功刪除`);
        } catch (e) {
            console.error('保存數據時發生錯誤:', e);
            alert('刪除單字失敗：無法保存數據');
        }
    } else {
        console.error(`找不到ID為 ${wordId} 的單字`);
        alert('找不到要刪除的單字');
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
 * 顯示單字詳情模態框
 */
function showWordDetailsModal() {
    console.log('顯示單字詳情模態框');
    
    const modal = document.getElementById('wordDetailsModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到單字詳情模態框或遮罩元素');
        return;
    }
    
    // 添加 modal-open 類到 body
    document.body.classList.add('modal-open');
    
    // 確保模態框和遮罩層可見
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // 使用 setTimeout 確保 display 屬性生效後再添加 active 類
    setTimeout(() => {
        modal.classList.add('active');
        overlay.classList.add('active');
    }, 10);
}

/**
 * 隱藏單字詳情模態框
 */
function hideWordDetailsModal() {
    console.log('隱藏單字詳情模態框');
    
    const modal = document.getElementById('wordDetailsModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (!modal || !overlay) {
        console.error('找不到單字詳情模態框或遮罩元素');
        return;
    }
    
    modal.classList.remove('active');
    overlay.classList.remove('active');
    
    // 移除 modal-open 類
    document.body.classList.remove('modal-open');
    
    // 使用 setTimeout 確保過渡效果完成後再隱藏元素
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
function initImportExportFeatures() {
    console.log('初始化導入/導出功能');
    
    // 導入按鈕
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });
    }
    
    // 導入文件輸入
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importVocabulary(file);
            }
        });
    }
    
    // 導出 JSON 按鈕
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            exportVocabulary('json');
        });
    }
    
    // 導出 CSV 按鈕
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            exportVocabulary('csv');
        });
    }
    
    // 添加匯入國中基礎2000單字按鈕
    const headerActions = document.querySelector('#vocabulary .header-actions');
    if (headerActions && !document.getElementById('importBasic2000Btn')) {
        const importBasic2000Btn = document.createElement('button');
        importBasic2000Btn.id = 'importBasic2000Btn';
        importBasic2000Btn.className = 'primary-btn';
        importBasic2000Btn.innerHTML = '<i class="fas fa-download"></i> 匯入國中基礎2000單字';
        
        // 確保 importBasic2000Words 函數可用
        if (typeof importBasic2000Words === 'function') {
            importBasic2000Btn.addEventListener('click', importBasic2000Words);
            headerActions.appendChild(importBasic2000Btn);
            console.log('已添加匯入國中基礎2000單字按鈕');
        } else {
            console.error('找不到 importBasic2000Words 函數，嘗試載入 import_basic_2000.js');
            
            // 動態載入 import_basic_2000.js
            const script = document.createElement('script');
            script.src = 'js/import_basic_2000.js';
            script.onload = function() {
                if (typeof importBasic2000Words === 'function') {
                    importBasic2000Btn.addEventListener('click', importBasic2000Words);
                    headerActions.appendChild(importBasic2000Btn);
                    console.log('已載入 import_basic_2000.js 並添加匯入按鈕');
                } else {
                    console.error('載入 import_basic_2000.js 後仍找不到 importBasic2000Words 函數');
                }
            };
            script.onerror = function() {
                console.error('載入 import_basic_2000.js 失敗');
            };
            document.head.appendChild(script);
        }
    } else {
        console.log('已存在匯入國中基礎2000單字按鈕或找不到 header-actions 容器');
    }
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
 * 初始化模態框關閉按鈕
 */
function initModalCloseButtons() {
    // 添加單字模態框關閉按鈕
    const addWordModalCloseBtn = document.querySelector('#addWordModal .close-modal-btn');
    if (addWordModalCloseBtn) {
        console.log('找到 addWordModal 關閉按鈕，添加點擊事件');
        // 移除可能存在的舊事件監聽器
        addWordModalCloseBtn.removeEventListener('click', hideAddWordModal);
        // 添加新的事件監聽器
        addWordModalCloseBtn.addEventListener('click', function() {
            console.log('點擊了 addWordModal 關閉按鈕');
            hideAddWordModal();
        });
    } else {
        console.error('找不到 addWordModal 關閉按鈕');
    }
}

/**
 * 更新詞彙列表計數
 */
function updateVocabListCounts() {
    console.log('更新詞彙列表計數');
    
    if (!window.appData || !window.appData.vocabulary) {
        console.error('無法更新詞彙列表計數：appData 或 vocabulary 未定義');
        return;
    }
    
    const vocabulary = window.appData.vocabulary;
    console.log(`總詞彙數量: ${vocabulary.length}`);
    
    // 更新所有單字數量
    const allCount = document.getElementById('allCount');
    if (allCount) {
        allCount.textContent = vocabulary.length;
        console.log(`更新所有單字數量: ${vocabulary.length}`);
    } else {
        console.error('找不到 allCount 元素');
    }
    
    // 更新未學習數量
    const notLearnedCount = document.getElementById('notLearnedCount');
    if (notLearnedCount) {
        const count = vocabulary.filter(word => word.status === 'notLearned').length;
        notLearnedCount.textContent = count;
        console.log(`更新未學習數量: ${count}`);
    } else {
        console.error('找不到 notLearnedCount 元素');
    }
    
    // 更新學習中數量
    const learningCount = document.getElementById('learningCount');
    if (learningCount) {
        const count = vocabulary.filter(word => word.status === 'learning').length;
        learningCount.textContent = count;
        console.log(`更新學習中數量: ${count}`);
    } else {
        console.error('找不到 learningCount 元素');
    }
    
    // 更新已掌握數量
    const masteredCount = document.getElementById('masteredCount');
    if (masteredCount) {
        const count = vocabulary.filter(word => word.status === 'mastered').length;
        masteredCount.textContent = count;
        console.log(`更新已掌握數量: ${count}`);
    } else {
        console.error('找不到 masteredCount 元素');
    }
    
    // 更新自定義列表數量
    if (window.appData.customLists && window.appData.customLists.length > 0) {
        window.appData.customLists.forEach(list => {
            const countElement = document.getElementById(`${list.id}Count`);
            if (countElement) {
                const count = vocabulary.filter(word => 
                    word.lists && word.lists.includes(list.id)
                ).length;
                countElement.textContent = count;
                console.log(`更新自定義列表 ${list.name} 數量: ${count}`);
            } else {
                console.error(`找不到 ${list.id}Count 元素`);
            }
        });
    }
}

/**
 * 初始化搜索功能
 */
function initSearchFunction() {
    console.log('初始化搜索功能');
    
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    
    if (!searchInput) {
        console.error('找不到搜索輸入框');
        return;
    }
    
    // 設置全局搜索詞變量
    window.searchTerm = '';
    
    // 添加搜索輸入事件
    searchInput.addEventListener('input', function() {
        window.searchTerm = this.value.trim();
        
        // 如果清除按鈕存在，根據搜索詞顯示或隱藏
        if (clearSearchButton) {
            clearSearchButton.style.display = window.searchTerm ? 'block' : 'none';
        }
        
        // 如果搜索詞為空，立即過濾
        if (!window.searchTerm) {
            filterVocabulary();
        }
    });
    
    // 添加搜索按鈕點擊事件
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            window.searchTerm = searchInput.value.trim();
            filterVocabulary();
        });
    }
    
    // 添加清除搜索按鈕點擊事件
    if (clearSearchButton) {
        clearSearchButton.style.display = 'none'; // 初始隱藏
        clearSearchButton.addEventListener('click', function() {
            searchInput.value = '';
            window.searchTerm = '';
            this.style.display = 'none';
            filterVocabulary();
            
            // 聚焦搜索框
            searchInput.focus();
        });
    }
    
    // 添加回車鍵搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            window.searchTerm = this.value.trim();
            filterVocabulary();
        }
    });
    
    console.log('搜索功能初始化完成');
} 