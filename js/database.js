// 初始化資料庫
let db;

/**
 * 初始化資料庫模塊
 * @returns {Promise<boolean>} 是否初始化成功
 */
async function init() {
    try {
        console.log('初始化資料庫模塊...');
        
        // 檢查是否已經初始化
        if (db) {
            console.log('資料庫已經初始化');
            return true;
        }
        
        // 初始化資料庫連接
        const result = await initDatabase();
        
        if (result) {
            console.log('資料庫初始化成功！');
            
            // 確保window.db中的函數可以訪問
            console.log('確保importBasic2005Words函數可用...');
            if (typeof window.db.importBasic2005Words !== 'function') {
                console.warn('importBasic2005Words函數不可用，重新綁定...');
                window.db.importBasic2005Words = importBasic2005Words;
            }
            
            return true;
        } else {
            console.error('資料庫初始化失敗');
            return false;
        }
    } catch (error) {
        console.error('初始化資料庫模塊出錯：', error);
        return false;
    }
}

// 初始化資料庫
async function initDatabase() {
    try {
        // 開啟資料庫連接
        db = await openDatabase();
        console.log('資料庫連接成功');
        
        // 建立資料表
        await createTables();
        console.log('資料表建立完成');
        
        return true;
    } catch (error) {
        console.error('資料庫初始化失敗:', error);
        return false;
    }
}

// 開啟資料庫連接
async function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open('VocabularyDB', 1);
        
        request.onerror = (event) => {
            reject('資料庫開啟失敗');
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // 建立單字表
            if (!db.objectStoreNames.contains('vocabulary')) {
                const vocabularyStore = db.createObjectStore('vocabulary', { keyPath: 'id', autoIncrement: true });
                vocabularyStore.createIndex('word', 'word', { unique: true });
                vocabularyStore.createIndex('status', 'status', { unique: false });
                vocabularyStore.createIndex('createdAt', 'createdAt', { unique: false });
            }
            
            // 建立詞彙表
            if (!db.objectStoreNames.contains('wordLists')) {
                const wordListsStore = db.createObjectStore('wordLists', { keyPath: 'id', autoIncrement: true });
                wordListsStore.createIndex('name', 'name', { unique: true });
            }
            
            // 建立詞彙表關聯
            if (!db.objectStoreNames.contains('wordListItems')) {
                const wordListItemsStore = db.createObjectStore('wordListItems', { keyPath: 'id', autoIncrement: true });
                wordListItemsStore.createIndex('wordId', 'wordId', { unique: false });
                wordListItemsStore.createIndex('listId', 'listId', { unique: false });
            }
        };
    });
}

// 新增單字
async function addWord(word) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vocabulary'], 'readwrite');
        const store = transaction.objectStore('vocabulary');
        
        // 添加創建時間
        word.createdAt = new Date().toISOString();
        
        const request = store.add(word);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('新增單字失敗');
        };
    });
}

// 取得所有單字
async function getAllWords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vocabulary'], 'readonly');
        const store = transaction.objectStore('vocabulary');
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('取得單字失敗');
        };
    });
}

// 更新單字
async function updateWord(word) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vocabulary'], 'readwrite');
        const store = transaction.objectStore('vocabulary');
        
        // 更新修改時間
        word.updatedAt = new Date().toISOString();
        
        const request = store.put(word);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('更新單字失敗');
        };
    });
}

// 刪除單字
async function deleteWord(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['vocabulary'], 'readwrite');
        const store = transaction.objectStore('vocabulary');
        const request = store.delete(id);
        
        request.onsuccess = () => {
            resolve(true);
        };
        
        request.onerror = () => {
            reject('刪除單字失敗');
        };
    });
}

// 搜尋單字
async function searchWords(query) {
    const words = await getAllWords();
    return words.filter(word => 
        word.word.toLowerCase().includes(query.toLowerCase()) ||
        word.meaning.toLowerCase().includes(query.toLowerCase())
    );
}

/**
 * 根據狀態獲取單字
 * @param {string} status - 單字狀態（notLearned, learning, mastered）
 * @returns {Promise<Array>} - 符合狀態的單字列表
 */
async function getWordsByStatus(status) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['vocabulary'], 'readonly');
            const store = transaction.objectStore('vocabulary');
            const words = [];
            
            const cursorRequest = store.openCursor();
            
            cursorRequest.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.status === status) {
                        words.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(words);
                }
            };
            
            cursorRequest.onerror = (event) => {
                console.error('查詢單字失敗:', event.target.error);
                reject(event.target.error);
            };
            
            transaction.oncomplete = () => {
                console.log(`已載入${status}狀態的單字，數量:`, words.length);
            };
        } catch (error) {
            console.error('獲取單字失敗:', error);
            reject(error);
        }
    });
}

// 新增詞彙組
async function addWordList(list) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordLists'], 'readwrite');
        const store = transaction.objectStore('wordLists');
        
        // 添加創建時間
        list.createdAt = new Date().toISOString();
        
        const request = store.add(list);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('新增詞彙組失敗');
        };
    });
}

// 取得所有詞彙組
async function getAllWordLists() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordLists'], 'readonly');
        const store = transaction.objectStore('wordLists');
        const request = store.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('取得詞彙組失敗');
        };
    });
}

// 更新詞彙組
async function updateWordList(list) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordLists'], 'readwrite');
        const store = transaction.objectStore('wordLists');
        
        // 更新修改時間
        list.updatedAt = new Date().toISOString();
        
        const request = store.put(list);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('更新詞彙組失敗');
        };
    });
}

// 刪除詞彙組
async function deleteWordList(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordLists', 'wordListItems'], 'readwrite');
        const listStore = transaction.objectStore('wordLists');
        const itemStore = transaction.objectStore('wordListItems');
        
        // 先刪除詞彙組中的所有單字關聯
        const index = itemStore.index('listId');
        const itemRequest = index.openCursor(IDBKeyRange.only(id));
        
        itemRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                itemStore.delete(cursor.primaryKey);
                cursor.continue();
            } else {
                // 所有關聯刪除完後，刪除詞彙組本身
                const listRequest = listStore.delete(id);
                listRequest.onsuccess = () => {
                    resolve(true);
                };
                listRequest.onerror = () => {
                    reject('刪除詞彙組失敗');
                };
            }
        };
        
        itemRequest.onerror = () => {
            reject('刪除詞彙組關聯失敗');
        };
    });
}

// 新增單字到詞彙組
async function addWordToList(wordId, listId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordListItems'], 'readwrite');
        const store = transaction.objectStore('wordListItems');
        
        const item = {
            wordId,
            listId,
            addedAt: new Date().toISOString()
        };
        
        const request = store.add(item);
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject('新增單字到詞彙組失敗');
        };
    });
}

// 從詞彙組移除單字
async function removeWordFromList(wordId, listId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordListItems'], 'readwrite');
        const store = transaction.objectStore('wordListItems');
        const index = store.index('wordId');
        
        const request = index.openCursor(IDBKeyRange.only(wordId));
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.listId === listId) {
                    const deleteRequest = store.delete(cursor.primaryKey);
                    deleteRequest.onsuccess = () => {
                        resolve(true);
                    };
                    deleteRequest.onerror = () => {
                        reject('從詞彙組移除單字失敗');
                    };
                } else {
                    cursor.continue();
                }
            } else {
                resolve(false);
            }
        };
        
        request.onerror = () => {
            reject('查找單字關聯失敗');
        };
    });
}

// 取得詞彙組中的所有單字
async function getWordsInList(listId) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['wordListItems', 'vocabulary'], 'readonly');
        const itemStore = transaction.objectStore('wordListItems');
        const wordStore = transaction.objectStore('vocabulary');
        const words = [];
        
        const index = itemStore.index('listId');
        const request = index.openCursor(IDBKeyRange.only(listId));
        
        request.onsuccess = async (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const wordRequest = wordStore.get(cursor.value.wordId);
                wordRequest.onsuccess = () => {
                    if (wordRequest.result) {
                        words.push(wordRequest.result);
                    }
                    cursor.continue();
                };
            } else {
                resolve(words);
            }
        };
        
        request.onerror = () => {
            reject('取得詞彙組單字失敗');
        };
    });
}

/**
 * 導入國中基礎2005個單字
 * 會創建一個新的詞彙組，並將所有單字加入該詞彙組
 */
async function importBasic2005Words() {
    try {
        console.log('開始導入國中基礎2005個單字...');
        
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
        progressTitle.textContent = '導入國中基礎2005單字';
        progressTitle.style.marginBottom = '15px';
        
        const progressStatus = document.createElement('div');
        progressStatus.id = 'import-status';
        progressStatus.textContent = '準備載入單字資料...';
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
        
        // 檢查詞彙組是否已存在
        updateProgress(5, '檢查詞彙組是否已存在...');
        const allWordLists = await getAllWordLists();
        let basic2005ListId = null;
        
        const existingList = allWordLists.find(list => list.name === '國中基礎2005單字');
        
        if (existingList) {
            basic2005ListId = existingList.id;
            console.log('詞彙組「國中基礎2005單字」已存在，ID:', basic2005ListId);
        } else {
            // 創建新的詞彙組
            updateProgress(10, '創建新詞彙組...');
            const newList = {
                name: '國中基礎2005單字',
                icon: 'fas fa-book',
                createdAt: new Date().toISOString()
            };
            
            basic2005ListId = await addWordList(newList);
            console.log('已創建詞彙組「國中基礎2005單字」，ID:', basic2005ListId);
        }
        
        // 獲取所有現有單字以避免重複
        updateProgress(15, '獲取現有單字以避免重複...');
        console.log('獲取現有單字以避免重複...');
        const existingWords = await getAllWords();
        console.log('現有單字數量:', existingWords.length);
        
        // 從文件加載單字列表
        updateProgress(20, '從文件讀取單字數據...');
        console.log('開始從文件讀取單字數據...');
        
        try {
            const words2005 = await loadBasic2005Words();
            
            if (words2005.length === 0) {
                updateProgress(100, '無法加載單字數據，導入已取消');
                console.error('無法加載基礎2005單字，導入操作已取消');
                setTimeout(() => {
                    document.body.removeChild(progressContainer);
                }, 3000);
                return false;
            }
            
            console.log(`成功從文件讀取了 ${words2005.length} 個單字`);
            updateProgress(30, `成功讀取 ${words2005.length} 個單字，開始導入...`);
            
            // 添加單字並關聯到詞彙組
            let addedCount = 0;
            let existCount = 0;
            const totalWords = words2005.length;
            
            for (let i = 0; i < words2005.length; i++) {
                const word = words2005[i];
                
                // 更新進度，30%~90%為導入過程
                const progressPercent = 30 + Math.floor((i / totalWords) * 60);
                updateProgress(progressPercent, `導入中: ${i+1}/${totalWords} (${Math.floor((i+1)/totalWords*100)}%)`);
                
                // 檢查單字是否已存在
                const exists = existingWords.some(w => w.word === word.word);
                if (exists) {
                    existCount++;
                    continue;
                }
                
                // 將單字內容格式化一下
                const newWord = {
                    word: word.word,
                    phonetic: '',
                    partOfSpeech: word.partOfSpeech,
                    meaning: word.meaning,
                    examples: '',
                    status: 'notLearned'
                };
                
                try {
                    // 添加單字
                    const wordId = await addWord(newWord);
                    
                    // 將單字關聯到詞彙組
                    await addWordToList(wordId, basic2005ListId);
                    
                    addedCount++;
                    if (addedCount % 100 === 0) {
                        console.log(`已導入 ${addedCount} 個單字...`);
                    }
                } catch (error) {
                    console.error(`添加單字 "${word.word}" 失敗:`, error);
                }
            }
            
            updateProgress(95, `導入完成！共導入 ${addedCount} 個單字，已存在 ${existCount} 個單字。`);
            console.log(`導入完成! 新增了 ${addedCount} 個單字，已存在 ${existCount} 個單字。`);
            
            // 延遲關閉進度條
            setTimeout(() => {
                updateProgress(100, '導入完成！');
                
                setTimeout(() => {
                    document.body.removeChild(progressContainer);
                    
                    // 顯示成功提示
                    alert(`導入完成！\n新增了 ${addedCount} 個單字\n已存在 ${existCount} 個單字`);
                    
                    // 重新載入頁面以顯示新導入的單字
                    window.location.reload();
                }, 1000);
            }, 500);
            
            return true;
        } catch (error) {
            console.error('讀取單字文件失敗:', error);
            updateProgress(100, `導入失敗: ${error.message}`);
            
            setTimeout(() => {
                document.body.removeChild(progressContainer);
                alert('導入單字失敗：' + error.message);
            }, 2000);
            
            return false;
        }
    } catch (error) {
        console.error('導入國中基礎2005單字出錯:', error);
        alert('導入單字時發生錯誤：' + error.message);
        return false;
    }
}

/**
 * 從文件中讀取國中基礎2005個單字
 * @returns {Promise<Array>} 單字列表
 */
async function loadBasic2005Words() {
    try {
        console.log('開始從文件讀取國中基礎2005個單字...');
        const response = await fetch('basic2005.txt');
        if (!response.ok) {
            throw new Error(`讀取文件失敗，狀態碼: ${response.status}`);
        }
        
        const data = await response.text();
        console.log('已讀取文件內容，開始解析...');
        
        // 使用正則表達式解析文件內容
        const wordRegex = /\{\s*word:\s*"(.+?)"\s*,\s*partOfSpeech:\s*"(.+?)"\s*,\s*meaning:\s*"(.+?)"\s*\}/g;
        const words2005 = [];
        let match;
        
        while ((match = wordRegex.exec(data)) !== null) {
            words2005.push({
                word: match[1],
                partOfSpeech: match[2],
                meaning: match[3]
            });
        }
        
        console.log(`已解析出${words2005.length}個單字`);
        return words2005;
    } catch (error) {
        console.error('讀取單字文件失敗:', error);
        throw error;
    }
}

// 創建表
async function createTables() {
    return new Promise((resolve, reject) => {
        try {
            const tables = db.objectStoreNames;
            if (tables.contains('vocabulary') && tables.contains('wordLists') && tables.contains('wordListItems')) {
                resolve(true);
                return;
            }
            
            reject('資料表不存在，需要重新創建');
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 根據ID獲取單字
 * @param {number} id - 單字ID
 * @returns {Promise<Object>} - 單字對象
 */
async function getWordById(id) {
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['vocabulary'], 'readonly');
            const store = transaction.objectStore('vocabulary');
            
            // 使用索引查詢單字
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                const word = event.target.result;
                if (word) {
                    console.log(`已找到ID為 ${id} 的單字:`, word);
                    resolve(word);
                } else {
                    console.log(`未找到ID為 ${id} 的單字`);
                    resolve(null);
                }
            };
            
            request.onerror = (event) => {
                console.error(`獲取單字 ${id} 失敗:`, event.target.error);
                reject(event.target.error);
            };
        } catch (error) {
            console.error('獲取單字時發生錯誤:', error);
            reject(error);
        }
    });
}

// 匯出所有功能
window.db = {
    init,
    addWord,
    getAllWords,
    updateWord,
    deleteWord,
    searchWords,
    getWordsByStatus,
    addWordList,
    getAllWordLists,
    updateWordList,
    deleteWordList,
    addWordToList,
    removeWordFromList,
    getWordsInList,
    importBasic2005Words
};

// 確保所有功能都可正常訪問
console.log('資料庫模組已載入，可用函數：', Object.keys(window.db).join(', ')); 