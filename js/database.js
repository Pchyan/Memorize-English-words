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
        
        // 檢查詞彙組是否已存在
        const allWordLists = await getAllWordLists();
        let basic2005ListId = null;
        
        const existingList = allWordLists.find(list => list.name === '國中基礎2005單字');
        
        if (existingList) {
            basic2005ListId = existingList.id;
            console.log('詞彙組「國中基礎2005單字」已存在，ID:', basic2005ListId);
        } else {
            // 創建新的詞彙組
            const newList = {
                name: '國中基礎2005單字',
                icon: 'fas fa-book',
                createdAt: new Date().toISOString()
            };
            
            basic2005ListId = await addWordList(newList);
            console.log('已創建詞彙組「國中基礎2005單字」，ID:', basic2005ListId);
        }
        
        // 獲取所有現有單字以避免重複
        console.log('獲取現有單字以避免重複...');
        const existingWords = await getAllWords();
        console.log('現有單字數量:', existingWords.length);
        
        // 單字列表 (從soeasyedu.com.tw網站獲取的2005個單字)
        const words2005 = [
            // A開頭
    { word: "a／an", partOfSpeech: "冠詞", meaning: "一個" },
    { word: "a few", partOfSpeech: "形容詞", meaning: "一些" },
    { word: "a little", partOfSpeech: "形容詞", meaning: "一點" },
    { word: "a lot", partOfSpeech: "代詞", meaning: "很多" },
    { word: "a.m.", partOfSpeech: "副詞", meaning: "上午" },
    { word: "able", partOfSpeech: "形容詞", meaning: "能夠" },
    { word: "about", partOfSpeech: "介系詞", meaning: "關於" },
    { word: "above", partOfSpeech: "介系詞", meaning: "在⋯之上" },
    { word: "abroad", partOfSpeech: "副詞", meaning: "到國外" },
    { word: "across", partOfSpeech: "介系詞", meaning: "橫過" },
    { word: "act", partOfSpeech: "動詞", meaning: "行動" },
    { word: "action", partOfSpeech: "名詞", meaning: "行動" },
    { word: "actor", partOfSpeech: "名詞", meaning: "演員" },
    { word: "actress", partOfSpeech: "名詞", meaning: "女演員" },
    { word: "actually", partOfSpeech: "副詞", meaning: "實際上" },
    { word: "afraid", partOfSpeech: "形容詞", meaning: "害怕的" },
    { word: "after", partOfSpeech: "介系詞", meaning: "在⋯之後" },
    { word: "afternoon", partOfSpeech: "名詞", meaning: "下午" },
    { word: "again", partOfSpeech: "副詞", meaning: "再次" },
    { word: "age", partOfSpeech: "名詞", meaning: "年齡" },
    { word: "ago", partOfSpeech: "副詞", meaning: "以前" },
    { word: "agree", partOfSpeech: "動詞", meaning: "同意" },
    { word: "ahead", partOfSpeech: "副詞", meaning: "向前" },
    { word: "air", partOfSpeech: "名詞", meaning: "空氣" },
    { word: "airplane（plane）", partOfSpeech: "名詞", meaning: "飛機" },
    { word: "airport", partOfSpeech: "名詞", meaning: "機場" },
    { word: "all", partOfSpeech: "代詞", meaning: "所有" },
    { word: "allow", partOfSpeech: "動詞", meaning: "允許" },
    { word: "almost", partOfSpeech: "副詞", meaning: "幾乎" },
    { word: "along", partOfSpeech: "介系詞", meaning: "沿著" },
    { word: "already", partOfSpeech: "副詞", meaning: "已經" },
    { word: "also", partOfSpeech: "副詞", meaning: "也" },
    { word: "always", partOfSpeech: "副詞", meaning: "總是" },
    { word: "America", partOfSpeech: "名詞", meaning: "美國" },
    { word: "American", partOfSpeech: "形容詞／名詞", meaning: "美國的／美國人" },
    { word: "and", partOfSpeech: "連接詞", meaning: "和" },
    { word: "angle", partOfSpeech: "名詞", meaning: "角度" },
    { word: "angry", partOfSpeech: "形容詞", meaning: "生氣的" },
    { word: "animal", partOfSpeech: "名詞", meaning: "動物" },
    { word: "another", partOfSpeech: "代詞", meaning: "另一個" },
    { word: "answer", partOfSpeech: "名詞", meaning: "答案" },
    { word: "ant", partOfSpeech: "名詞", meaning: "螞蟻" },
    { word: "any", partOfSpeech: "代詞", meaning: "任何" },
    { word: "anyone（anybody）", partOfSpeech: "代詞", meaning: "任何人" },
    { word: "anything", partOfSpeech: "代詞", meaning: "任何事物" },
    { word: "apartment", partOfSpeech: "名詞", meaning: "公寓" },
    { word: "appear", partOfSpeech: "動詞", meaning: "出現" },
    { word: "apple", partOfSpeech: "名詞", meaning: "蘋果" },
    { word: "April", partOfSpeech: "名詞", meaning: "四月" },
    { word: "area", partOfSpeech: "名詞", meaning: "區域" },
    { word: "arm", partOfSpeech: "名詞", meaning: "手臂" },
    { word: "around", partOfSpeech: "介系詞", meaning: "周圍" },
    { word: "arrive", partOfSpeech: "動詞", meaning: "到達" },
    { word: "art", partOfSpeech: "名詞", meaning: "藝術" },
    { word: "as", partOfSpeech: "連接詞", meaning: "如同" },
    { word: "ask", partOfSpeech: "動詞", meaning: "問" },
    { word: "at", partOfSpeech: "介系詞", meaning: "在" },
    { word: "attack", partOfSpeech: "名詞", meaning: "攻擊" },
    { word: "August", partOfSpeech: "名詞", meaning: "八月" },
    { word: "aunt", partOfSpeech: "名詞", meaning: "阿姨" },
    { word: "autumn（fall）", partOfSpeech: "名詞", meaning: "秋天" },
    { word: "away", partOfSpeech: "副詞", meaning: "離開" },
    { word: "absent", partOfSpeech: "形容詞", meaning: "缺席的" },
    { word: "accept", partOfSpeech: "動詞", meaning: "接受" },
    { word: "accident", partOfSpeech: "名詞", meaning: "事故" },
    { word: "active", partOfSpeech: "形容詞", meaning: "活躍的" },
    { word: "activity", partOfSpeech: "名詞", meaning: "活動" },
    { word: "add", partOfSpeech: "動詞", meaning: "加" },
    { word: "address", partOfSpeech: "名詞", meaning: "地址" },
    { word: "admire", partOfSpeech: "動詞", meaning: "欽佩" },
    { word: "adult", partOfSpeech: "名詞", meaning: "成人" },
    { word: "advertisement", partOfSpeech: "名詞", meaning: "廣告" },
    { word: "advice", partOfSpeech: "名詞", meaning: "勸告" },
    { word: "advise", partOfSpeech: "動詞", meaning: "勸告" },
    { word: "affect", partOfSpeech: "動詞", meaning: "影響" },
    { word: "against", partOfSpeech: "介系詞", meaning: "反對" },
    { word: "aim", partOfSpeech: "動詞", meaning: "目標" },
    { word: "air conditioner", partOfSpeech: "名詞", meaning: "空調" },
    { word: "airlines", partOfSpeech: "名詞", meaning: "航空公司" },
    { word: "alarm", partOfSpeech: "名詞", meaning: "警報" },
    { word: "album", partOfSpeech: "名詞", meaning: "專輯" },
    { word: "alike", partOfSpeech: "形容詞", meaning: "相似的" },
    { word: "alive", partOfSpeech: "形容詞", meaning: "活著的" },
    { word: "alone", partOfSpeech: "形容詞", meaning: "孤單的" },
    { word: "aloud", partOfSpeech: "副詞", meaning: "大聲地" },
    { word: "alphabet", partOfSpeech: "名詞", meaning: "字母表" },
    { word: "altogether", partOfSpeech: "副詞", meaning: "總共" },
    { word: "ambulance", partOfSpeech: "名詞", meaning: "救護車" },
    { word: "among", partOfSpeech: "介系詞", meaning: "在⋯之中" },
    { word: "amount", partOfSpeech: "名詞", meaning: "量" },
    { word: "ancient", partOfSpeech: "形容詞", meaning: "古代的" },
    { word: "angel", partOfSpeech: "名詞", meaning: "天使" },
    { word: "anger", partOfSpeech: "名詞", meaning: "憤怒" },
    { word: "ankle", partOfSpeech: "名詞", meaning: "踝" },
    { word: "anywhere", partOfSpeech: "副詞", meaning: "任何地方" },
    { word: "apologize", partOfSpeech: "動詞", meaning: "道歉" },
    { word: "appreciate", partOfSpeech: "動詞", meaning: "感激" },
    { word: "argue", partOfSpeech: "動詞", meaning: "爭吵" },
    { word: "armchair", partOfSpeech: "名詞", meaning: "扶手椅" },
    { word: "army", partOfSpeech: "名詞", meaning: "軍隊" },
    { word: "arrange", partOfSpeech: "動詞", meaning: "安排" },
    { word: "artist", partOfSpeech: "名詞", meaning: "藝術家" },
    { word: "asleep", partOfSpeech: "形容詞", meaning: "睡著的" },
    { word: "assistant", partOfSpeech: "名詞", meaning: "助理" },
    { word: "assume", partOfSpeech: "動詞", meaning: "假定" },
    { word: "attention", partOfSpeech: "名詞", meaning: "注意" },
    { word: "available", partOfSpeech: "形容詞", meaning: "可用的" },
    { word: "avoid", partOfSpeech: "動詞", meaning: "避免" },
    // B開頭
    { word: "baby", partOfSpeech: "名詞", meaning: "嬰兒" },
    { word: "back", partOfSpeech: "名詞／副詞", meaning: "背部／向後" },
    { word: "bad", partOfSpeech: "形容詞", meaning: "壞的" },
    { word: "badminton", partOfSpeech: "名詞", meaning: "羽毛球" },
    { word: "bag", partOfSpeech: "名詞", meaning: "袋子" },
    { word: "bake", partOfSpeech: "動詞", meaning: "烘烤" },
    { word: "bakery", partOfSpeech: "名詞", meaning: "麵包店" },
    { word: "balcony", partOfSpeech: "名詞", meaning: "陽台" },
    { word: "banana", partOfSpeech: "名詞", meaning: "香蕉" },
    { word: "band", partOfSpeech: "名詞", meaning: "樂隊" },
    { word: "bank", partOfSpeech: "名詞", meaning: "銀行" },
    { word: "baseball", partOfSpeech: "名詞", meaning: "棒球" },
    { word: "basket", partOfSpeech: "名詞", meaning: "籃子" },
    { word: "basketball", partOfSpeech: "名詞", meaning: "籃球" },
    { word: "bat", partOfSpeech: "名詞／動詞", meaning: "蝙蝠／打擊" },
    { word: "bath", partOfSpeech: "名詞", meaning: "浴室" },
    { word: "bathroom", partOfSpeech: "名詞", meaning: "浴室" },
    { word: "be（am, is, are, was, were, been）", partOfSpeech: "動詞", meaning: "是" },
    { word: "beach", partOfSpeech: "名詞", meaning: "海灘" },
    { word: "bean", partOfSpeech: "名詞", meaning: "豆子" },
    { word: "bear", partOfSpeech: "名詞／動詞", meaning: "熊／忍受" },
    { word: "beautiful", partOfSpeech: "形容詞", meaning: "美麗的" },
    { word: "because", partOfSpeech: "連接詞", meaning: "因為" },
    { word: "become", partOfSpeech: "動詞", meaning: "變成" },
    { word: "bed", partOfSpeech: "名詞", meaning: "床" },
    { word: "bedroom", partOfSpeech: "名詞", meaning: "臥室" },
    { word: "bee", partOfSpeech: "名詞", meaning: "蜜蜂" },
    { word: "beef", partOfSpeech: "名詞", meaning: "牛肉" },
    { word: "before", partOfSpeech: "介系詞", meaning: "在⋯之前" },
    { word: "begin", partOfSpeech: "動詞", meaning: "開始" },
    { word: "behind", partOfSpeech: "介系詞", meaning: "在⋯後面" },
    { word: "believe", partOfSpeech: "動詞", meaning: "相信" },
    { word: "bell", partOfSpeech: "名詞", meaning: "鈴" },
    { word: "belong", partOfSpeech: "動詞", meaning: "屬於" },
    { word: "below", partOfSpeech: "介系詞", meaning: "在⋯之下" },
    { word: "belt", partOfSpeech: "名詞", meaning: "腰帶" },
    { word: "bench", partOfSpeech: "名詞", meaning: "長凳" },
    { word: "beside", partOfSpeech: "介系詞", meaning: "在⋯旁邊" },
    { word: "between", partOfSpeech: "介系詞", meaning: "在⋯之間" },
    { word: "bicycle（bike）", partOfSpeech: "名詞", meaning: "自行車" },
    { word: "big", partOfSpeech: "形容詞", meaning: "大的" },
    { word: "bird", partOfSpeech: "名詞", meaning: "鳥" },
    { word: "birthday", partOfSpeech: "名詞", meaning: "生日" },
    { word: "bite", partOfSpeech: "動詞／名詞", meaning: "咬／一口" },
    { word: "black", partOfSpeech: "形容詞", meaning: "黑色的" },
    { word: "blackboard", partOfSpeech: "名詞", meaning: "黑板" },
    { word: "blank", partOfSpeech: "形容詞", meaning: "空白的" },
    { word: "blanket", partOfSpeech: "名詞", meaning: "毯子" },
    { word: "blind", partOfSpeech: "形容詞", meaning: "盲的" },
    { word: "block", partOfSpeech: "名詞／動詞", meaning: "街區／阻擋" },
    { word: "blow", partOfSpeech: "動詞", meaning: "吹" },
    { word: "blue", partOfSpeech: "形容詞", meaning: "藍色的" },
    { word: "boat", partOfSpeech: "名詞", meaning: "船" },
    { word: "body", partOfSpeech: "名詞", meaning: "身體" },
    { word: "boil", partOfSpeech: "動詞", meaning: "煮沸" },
    { word: "book", partOfSpeech: "名詞／動詞", meaning: "書／預訂" },
    { word: "bookstore", partOfSpeech: "名詞", meaning: "書店" },
    { word: "bored", partOfSpeech: "形容詞", meaning: "厭倦的" },
    { word: "boring", partOfSpeech: "形容詞", meaning: "乏味的" },
    { word: "born", partOfSpeech: "動詞", meaning: "出生" },
    { word: "borrow", partOfSpeech: "動詞", meaning: "借" },
    { word: "boss", partOfSpeech: "名詞", meaning: "老板" },
    { word: "both", partOfSpeech: "代詞", meaning: "兩者都" },
    { word: "bottle", partOfSpeech: "名詞", meaning: "瓶子" },
    { word: "bottom", partOfSpeech: "名詞", meaning: "底部" },
    { word: "bow", partOfSpeech: "名詞／動詞", meaning: "弓／鞠躬" },
    { word: "bowl", partOfSpeech: "名詞", meaning: "碗" },
    { word: "box", partOfSpeech: "名詞", meaning: "盒子" },
    { word: "boy", partOfSpeech: "名詞", meaning: "男孩" },
    { word: "brave", partOfSpeech: "形容詞", meaning: "勇敢的" },
    { word: "bread", partOfSpeech: "名詞", meaning: "麵包" },
    { word: "break", partOfSpeech: "動詞／名詞", meaning: "打破／休息" },
    { word: "breakfast", partOfSpeech: "名詞", meaning: "早餐" },
    { word: "bridge", partOfSpeech: "名詞", meaning: "橋" },
    { word: "bright", partOfSpeech: "形容詞", meaning: "明亮的" },
    { word: "bring", partOfSpeech: "動詞", meaning: "帶來" },
    { word: "brother", partOfSpeech: "名詞", meaning: "兄弟" },
    { word: "brown", partOfSpeech: "形容詞", meaning: "棕色的" },
    { word: "brush", partOfSpeech: "名詞／動詞", meaning: "刷子／刷" },
    { word: "bug", partOfSpeech: "名詞", meaning: "蟲子" },
    { word: "build", partOfSpeech: "動詞", meaning: "建造" },
    { word: "bun", partOfSpeech: "名詞", meaning: "小圓麵包" },
    { word: "burn", partOfSpeech: "動詞", meaning: "燃燒" },
    { word: "bus", partOfSpeech: "名詞", meaning: "公共汽車" },
    { word: "business", partOfSpeech: "名詞", meaning: "生意" },
    { word: "businessman", partOfSpeech: "名詞", meaning: "商人" },
    { word: "busy", partOfSpeech: "形容詞", meaning: "忙碌的" },
    { word: "but", partOfSpeech: "連接詞", meaning: "但是" },
    { word: "butter", partOfSpeech: "名詞", meaning: "黃油" },
    { word: "butterfly", partOfSpeech: "名詞", meaning: "蝴蝶" },
    { word: "button", partOfSpeech: "名詞", meaning: "按鈕" },
    { word: "buy", partOfSpeech: "動詞", meaning: "購買" },
    { word: "by", partOfSpeech: "介系詞", meaning: "由" },
    { word: "baby sitter", partOfSpeech: "名詞", meaning: "保姆" },
    { word: "backpack", partOfSpeech: "名詞", meaning: "背包" },
    { word: "backward", partOfSpeech: "副詞", meaning: "向後地" },
    { word: "ball", partOfSpeech: "名詞", meaning: "球" },
    { word: "balloon", partOfSpeech: "名詞", meaning: "氣球" },
    { word: "barbecue", partOfSpeech: "名詞／動詞", meaning: "燒烤／烤" },
    { word: "barber", partOfSpeech: "名詞", meaning: "理髮師" },
    { word: "bark", partOfSpeech: "名詞／動詞", meaning: "狗叫聲／吠" },
    { word: "base", partOfSpeech: "名詞", meaning: "基地" },
    { word: "basement", partOfSpeech: "名詞", meaning: "地下室" },
    { word: "basic", partOfSpeech: "形容詞", meaning: "基本的" },
    { word: "bathe", partOfSpeech: "動詞", meaning: "沐浴" },
    { word: "beard", partOfSpeech: "名詞", meaning: "胡子" },
    { word: "beat", partOfSpeech: "動詞", meaning: "打擊" },
    { word: "beauty", partOfSpeech: "名詞", meaning: "美麗" },
    { word: "beer", partOfSpeech: "名詞", meaning: "啤酒" },
    { word: "beginner", partOfSpeech: "名詞", meaning: "初學者" },
    { word: "beginning", partOfSpeech: "名詞", meaning: "開始" },
    { word: "behave", partOfSpeech: "動詞", meaning: "行為" },
    { word: "besides", partOfSpeech: "介系詞", meaning: "除了" },
    { word: "beyond", partOfSpeech: "介系詞", meaning: "超出" },
    { word: "bill", partOfSpeech: "名詞／動詞", meaning: "帳單／發票" },
    { word: "biology", partOfSpeech: "名詞", meaning: "生物學" },
    { word: "bitter", partOfSpeech: "形容詞", meaning: "苦的" },
    { word: "blame", partOfSpeech: "動詞", meaning: "責備" },
    { word: "bless", partOfSpeech: "動詞", meaning: "祝福" },
    { word: "blood", partOfSpeech: "名詞", meaning: "血" },
    { word: "blouse", partOfSpeech: "名詞", meaning: "女性襯衫" },
    { word: "board", partOfSpeech: "名詞／動詞", meaning: "板子／登機" },
    { word: "bomb", partOfSpeech: "名詞／動詞", meaning: "炸彈／轟炸" },
    { word: "bone", partOfSpeech: "名詞", meaning: "骨頭" },
    { word: "bookcase", partOfSpeech: "名詞", meaning: "書櫃" },
    { word: "bother", partOfSpeech: "動詞", meaning: "打擾" },
    { word: "bowling", partOfSpeech: "名詞", meaning: "保齡球" },
    { word: "branch", partOfSpeech: "名詞", meaning: "分支" },
    { word: "brick", partOfSpeech: "名詞", meaning: "磚塊" },
    { word: "broad", partOfSpeech: "形容詞", meaning: "寬闊的" },
    { word: "broadcast", partOfSpeech: "名詞／動詞", meaning: "廣播／播放" },
    { word: "brunch", partOfSpeech: "名詞", meaning: "早午餐" },
    { word: "bucket", partOfSpeech: "名詞", meaning: "水桶" },
    { word: "buffet", partOfSpeech: "名詞", meaning: "自助餐" },
    { word: "building", partOfSpeech: "名詞", meaning: "建築物" },
    { word: "bundle", partOfSpeech: "名詞／動詞", meaning: "捆／捆綁" },
    { word: "burger", partOfSpeech: "名詞", meaning: "漢堡" },
    { word: "burst", partOfSpeech: "動詞", meaning: "爆裂" },
    // C開頭
    { word: "cake", partOfSpeech: "名詞", meaning: "蛋糕" },
    { word: "call", partOfSpeech: "動詞／名詞", meaning: "打電話／呼叫" },
    { word: "camera", partOfSpeech: "名詞", meaning: "相機" },
    { word: "camp", partOfSpeech: "名詞／動詞", meaning: "營地／露營" },
    { word: "can", partOfSpeech: "情態動詞", meaning: "能夠" },
    { word: "could", partOfSpeech: "情態動詞", meaning: "能夠" },
    { word: "candle", partOfSpeech: "名詞", meaning: "蠟燭" },
    { word: "candy", partOfSpeech: "名詞", meaning: "糖果" },
    { word: "cap", partOfSpeech: "名詞", meaning: "帽子" },
    { word: "car", partOfSpeech: "名詞", meaning: "汽車" },
    { word: "card", partOfSpeech: "名詞", meaning: "卡片" },
    { word: "care", partOfSpeech: "動詞／名詞", meaning: "照顧／關心" },
    { word: "careful", partOfSpeech: "形容詞", meaning: "小心的" },
    { word: "carry", partOfSpeech: "動詞", meaning: "攜帶" },
    { word: "case", partOfSpeech: "名詞", meaning: "案例" },
    { word: "castle", partOfSpeech: "名詞", meaning: "城堡" },
    { word: "cat", partOfSpeech: "名詞", meaning: "貓" },
    { word: "catch", partOfSpeech: "動詞", meaning: "捕捉" },
    { word: "celebrate", partOfSpeech: "動詞", meaning: "慶祝" },
    { word: "cellphone", partOfSpeech: "名詞", meaning: "手機" },
    { word: "cent", partOfSpeech: "名詞", meaning: "分" },
    { word: "center", partOfSpeech: "名詞", meaning: "中心" },
    { word: "centimeter", partOfSpeech: "名詞", meaning: "公分" },
    { word: "chair", partOfSpeech: "名詞", meaning: "椅子" },
    { word: "chalk", partOfSpeech: "名詞", meaning: "粉筆" },
    { word: "chance", partOfSpeech: "名詞", meaning: "機會" },
    { word: "change", partOfSpeech: "動詞／名詞", meaning: "改變／零錢" },
    { word: "cheap", partOfSpeech: "形容詞", meaning: "便宜的" },
    { word: "cheat", partOfSpeech: "動詞", meaning: "作弊" },
    { word: "check", partOfSpeech: "動詞／名詞", meaning: "檢查／支票" },
    { word: "cheer", partOfSpeech: "動詞／名詞", meaning: "歡呼／歡呼聲" },
    { word: "cheese", partOfSpeech: "名詞", meaning: "起司" },
    { word: "chicken", partOfSpeech: "名詞", meaning: "雞肉" },
    { word: "child", partOfSpeech: "名詞", meaning: "孩子" },
    { word: "China", partOfSpeech: "名詞", meaning: "中國" },
    { word: "Chinese", partOfSpeech: "形容詞／名詞", meaning: "中國的／中國人" },
    { word: "chocolate", partOfSpeech: "名詞", meaning: "巧克力" },
    { word: "choice", partOfSpeech: "名詞", meaning: "選擇" },
    { word: "choose", partOfSpeech: "動詞", meaning: "選擇" },
    { word: "chopsticks", partOfSpeech: "名詞", meaning: "筷子" },
    { word: "Christmas", partOfSpeech: "名詞", meaning: "聖誕節" },
    { word: "church", partOfSpeech: "名詞", meaning: "教堂" },
    { word: "circle", partOfSpeech: "名詞", meaning: "圓圈" },
    { word: "city", partOfSpeech: "名詞", meaning: "城市" },
    { word: "clap", partOfSpeech: "動詞", meaning: "拍手" },
    { word: "class", partOfSpeech: "名詞", meaning: "班級" },
    { word: "classmate", partOfSpeech: "名詞", meaning: "同學" },
    { word: "classroom", partOfSpeech: "名詞", meaning: "教室" },
    { word: "clean", partOfSpeech: "動詞／形容詞", meaning: "清潔／乾淨" },
    { word: "clear", partOfSpeech: "形容詞", meaning: "清晰的" },
    { word: "clerk", partOfSpeech: "名詞", meaning: "店員" },
    { word: "climb", partOfSpeech: "動詞", meaning: "攀登" },
    { word: "clock", partOfSpeech: "名詞", meaning: "鐘" },
    { word: "close", partOfSpeech: "動詞／形容詞", meaning: "關閉／近" },
    { word: "clothes", partOfSpeech: "名詞", meaning: "衣服" },
    { word: "cloud", partOfSpeech: "名詞", meaning: "雲" },
    { word: "cloudy", partOfSpeech: "形容詞", meaning: "多雲的" },
    { word: "club", partOfSpeech: "名詞", meaning: "俱樂部" },
    { word: "coat", partOfSpeech: "名詞", meaning: "外套" },
    { word: "coffee", partOfSpeech: "名詞", meaning: "咖啡" },
    { word: "cold", partOfSpeech: "形容詞", meaning: "冷的" },
    { word: "collect", partOfSpeech: "動詞", meaning: "收集" },
    { word: "color", partOfSpeech: "名詞／動詞", meaning: "顏色／給⋯著色" },
    { word: "comb", partOfSpeech: "名詞／動詞", meaning: "梳子／梳頭" },
    { word: "come", partOfSpeech: "動詞", meaning: "來" },
    { word: "comfortable", partOfSpeech: "形容詞", meaning: "舒適的" },
    { word: "comic", partOfSpeech: "名詞／形容詞", meaning: "漫畫／有趣的" },
    { word: "common", partOfSpeech: "形容詞", meaning: "常見的" },
    { word: "computer", partOfSpeech: "名詞", meaning: "電腦" },
    { word: "convenient", partOfSpeech: "形容詞", meaning: "方便的" },
    { word: "cook", partOfSpeech: "動詞／名詞", meaning: "烹飪／廚師" },
    { word: "cookie", partOfSpeech: "名詞", meaning: "餅乾" },
    { word: "cool", partOfSpeech: "形容詞", meaning: "酷的" },
    { word: "copy", partOfSpeech: "動詞／名詞", meaning: "複製／副本" },
    { word: "corner", partOfSpeech: "名詞", meaning: "角落" },
    { word: "correct", partOfSpeech: "形容詞／動詞", meaning: "正確的／糾正" },
    { word: "cost", partOfSpeech: "名詞／動詞", meaning: "花費／成本" },
    { word: "couch", partOfSpeech: "名詞", meaning: "沙發" },
    { word: "count", partOfSpeech: "動詞", meaning: "數" },
    { word: "country", partOfSpeech: "名詞", meaning: "國家" },
    { word: "course", partOfSpeech: "名詞", meaning: "課程" },
    { word: "cousin", partOfSpeech: "名詞", meaning: "表兄弟／表姊妹" },
    { word: "cover", partOfSpeech: "動詞／名詞", meaning: "覆蓋／封面" },
    { word: "cow", partOfSpeech: "名詞", meaning: "牛" },
    { word: "crazy", partOfSpeech: "形容詞", meaning: "瘋狂的" },
    { word: "cross", partOfSpeech: "動詞／形容詞", meaning: "穿越／跨越" },
    { word: "cry", partOfSpeech: "動詞／名詞", meaning: "哭／哭聲" },
    { word: "cup", partOfSpeech: "名詞", meaning: "杯子" },
    { word: "cut", partOfSpeech: "動詞／名詞", meaning: "剪／切" },
    { word: "cute", partOfSpeech: "形容詞", meaning: "可愛的" },
    { word: "cabbage", partOfSpeech: "名詞", meaning: "甘藍" },
    { word: "cable", partOfSpeech: "名詞", meaning: "電纜" },
    { word: "cafeteria", partOfSpeech: "名詞", meaning: "自助餐廳" },
    { word: "cage", partOfSpeech: "名詞", meaning: "籠子" },
    { word: "calendar", partOfSpeech: "名詞", meaning: "日曆" },
    { word: "calm", partOfSpeech: "形容詞", meaning: "冷靜的" },
    { word: "campus", partOfSpeech: "名詞", meaning: "校園" },
    { word: "cancel", partOfSpeech: "動詞", meaning: "取消" },
    { word: "cancer", partOfSpeech: "名詞", meaning: "癌症" },
    { word: "captain", partOfSpeech: "名詞", meaning: "隊長" },
    { word: "careless", partOfSpeech: "形容詞", meaning: "粗心的" },
    { word: "carpet", partOfSpeech: "名詞", meaning: "地毯" },
    { word: "carrot", partOfSpeech: "名詞", meaning: "胡蘿蔔" },
    { word: "cartoon", partOfSpeech: "名詞", meaning: "卡通" },
    { word: "cash", partOfSpeech: "名詞", meaning: "現金" },
    { word: "cause", partOfSpeech: "名詞／動詞", meaning: "原因／導致" },
    { word: "ceiling", partOfSpeech: "名詞", meaning: "天花板" },
    { word: "central", partOfSpeech: "形容詞", meaning: "中心的" },
    { word: "century", partOfSpeech: "名詞", meaning: "世紀" },
    { word: "cereal", partOfSpeech: "名詞", meaning: "穀類" },
    { word: "certain", partOfSpeech: "形容詞", meaning: "確定的" },
    { word: "channel", partOfSpeech: "名詞", meaning: "頻道" },
    { word: "character", partOfSpeech: "名詞", meaning: "角色" },
    { word: "charge", partOfSpeech: "動詞／名詞", meaning: "收費／費用" },
    { word: "chart", partOfSpeech: "名詞", meaning: "圖表" },
    { word: "chase", partOfSpeech: "動詞", meaning: "追逐" },
    { word: "chemistry", partOfSpeech: "名詞", meaning: "化學" },
    { word: "chess", partOfSpeech: "名詞", meaning: "西洋棋" },
    { word: "childhood", partOfSpeech: "名詞", meaning: "童年" },
    { word: "childish", partOfSpeech: "形容詞", meaning: "幼稚的" },
    { word: "childlike", partOfSpeech: "形容詞", meaning: "孩子般的" },
    { word: "chin", partOfSpeech: "名詞", meaning: "下巴" },
    { word: "chubby", partOfSpeech: "形容詞", meaning: "胖嘟嘟的" },
    { word: "classical", partOfSpeech: "形容詞", meaning: "古典的" },
    { word: "clever", partOfSpeech: "形容詞", meaning: "聰明的" },
    { word: "climate", partOfSpeech: "名詞", meaning: "氣候" },
    { word: "closet", partOfSpeech: "名詞", meaning: "衣櫥" },
    { word: "coach", partOfSpeech: "名詞／動詞", meaning: "教練／訓練" },
    { word: "coast", partOfSpeech: "名詞", meaning: "海岸" },
    { word: "cockroach", partOfSpeech: "名詞", meaning: "蟑螂" },
    { word: "coin", partOfSpeech: "名詞", meaning: "硬幣" },
    { word: "cola", partOfSpeech: "名詞", meaning: "可樂" },
    { word: "college", partOfSpeech: "名詞", meaning: "學院" },
    { word: "colorful", partOfSpeech: "形容詞", meaning: "色彩繽紛的" },
    { word: "command", partOfSpeech: "動詞／名詞", meaning: "命令／指揮" },
    { word: "comment", partOfSpeech: "名詞／動詞", meaning: "評論／評論" },
    { word: "company", partOfSpeech: "名詞", meaning: "公司" },
    { word: "compare", partOfSpeech: "動詞", meaning: "比較" },
    { word: "complain", partOfSpeech: "動詞", meaning: "抱怨" },
    { word: "complete", partOfSpeech: "動詞／形容詞", meaning: "完成／完整" },
    { word: "concern", partOfSpeech: "名詞／動詞", meaning: "關心／擔憂" },
    { word: "confident", partOfSpeech: "形容詞", meaning: "自信的" },
    { word: "confuse", partOfSpeech: "動詞", meaning: "使困惑" },
    { word: "congratulation", partOfSpeech: "名詞", meaning: "祝賀" },
    { word: "consider", partOfSpeech: "動詞", meaning: "考慮" },
    { word: "considerate", partOfSpeech: "形容詞", meaning: "體貼的" },
    { word: "contact lens", partOfSpeech: "名詞", meaning: "隱形眼鏡" },
    { word: "continue", partOfSpeech: "動詞", meaning: "繼續" },
    { word: "contract", partOfSpeech: "名詞／動詞", meaning: "合約／縮小" },
    { word: "control", partOfSpeech: "動詞／名詞", meaning: "控制／控制" },
    { word: "convenience store", partOfSpeech: "名詞", meaning: "便利店" },
    { word: "conversation", partOfSpeech: "名詞", meaning: "對話" },
    { word: "corn", partOfSpeech: "名詞", meaning: "玉米" },
    { word: "cotton", partOfSpeech: "名詞", meaning: "棉花" },
    { word: "cough", partOfSpeech: "動詞／名詞", meaning: "咳嗽／咳嗽聲" },
    { word: "couple", partOfSpeech: "名詞", meaning: "一對" },
    { word: "courage", partOfSpeech: "名詞", meaning: "勇氣" },
    { word: "court", partOfSpeech: "名詞", meaning: "法庭" },
    { word: "cowboy", partOfSpeech: "名詞", meaning: "牛仔" },
    { word: "crab", partOfSpeech: "名詞", meaning: "螃蟹" },
    { word: "crayon", partOfSpeech: "名詞", meaning: "蠟筆" },
    { word: "cream", partOfSpeech: "名詞", meaning: "奶油" },
    { word: "create", partOfSpeech: "動詞", meaning: "創造" },
    { word: "credit card", partOfSpeech: "名詞", meaning: "信用卡" },
    { word: "crime", partOfSpeech: "名詞", meaning: "犯罪" },
    { word: "crowd", partOfSpeech: "名詞", meaning: "人群" },
    { word: "crowded", partOfSpeech: "形容詞", meaning: "擁擠的" },
    { word: "cruel", partOfSpeech: "形容詞", meaning: "殘酷的" },
    { word: "culture", partOfSpeech: "名詞", meaning: "文化" },
    { word: "cure", partOfSpeech: "動詞／名詞", meaning: "治療／治療法" },
    { word: "curious", partOfSpeech: "形容詞", meaning: "好奇的" },
    { word: "current", partOfSpeech: "形容詞／名詞", meaning: "當前的／電流" },
    { word: "curtain", partOfSpeech: "名詞", meaning: "窗簾" },
    { word: "curve", partOfSpeech: "名詞", meaning: "彎曲" },
    { word: "custom", partOfSpeech: "名詞", meaning: "習俗" },
    { word: "customer", partOfSpeech: "名詞", meaning: "顧客" },
    // D開頭
    { word: "dance", partOfSpeech: "動詞／名詞", meaning: "跳舞／舞蹈" },
    { word: "dangerous", partOfSpeech: "形容詞", meaning: "危險的" },
    { word: "dark", partOfSpeech: "形容詞", meaning: "黑暗的" },
    { word: "date", partOfSpeech: "名詞／動詞", meaning: "日期／約會" },
    { word: "daughter", partOfSpeech: "名詞", meaning: "女兒" },
    { word: "day", partOfSpeech: "名詞", meaning: "天" },
    { word: "dead", partOfSpeech: "形容詞", meaning: "死亡的" },
    { word: "deal", partOfSpeech: "名詞／動詞", meaning: "交易／處理" },
    { word: "dear", partOfSpeech: "形容詞", meaning: "親愛的" },
    { word: "death", partOfSpeech: "名詞", meaning: "死亡" },
    { word: "December", partOfSpeech: "名詞", meaning: "十二月" },
    { word: "decide", partOfSpeech: "動詞", meaning: "決定" },
    { word: "deep", partOfSpeech: "形容詞", meaning: "深的" },
    { word: "define", partOfSpeech: "動詞", meaning: "定義" },
    { word: "delicious", partOfSpeech: "形容詞", meaning: "美味的" },
    { word: "dentist", partOfSpeech: "名詞", meaning: "牙醫" },
    { word: "department store", partOfSpeech: "名詞", meaning: "百貨公司" },
    { word: "desk", partOfSpeech: "名詞", meaning: "書桌" },
    { word: "dictionary", partOfSpeech: "名詞", meaning: "字典" },
    { word: "die", partOfSpeech: "動詞", meaning: "死亡" },
    { word: "different", partOfSpeech: "形容詞", meaning: "不同的" },
    { word: "difficult", partOfSpeech: "形容詞", meaning: "困難的" },
    { word: "dig", partOfSpeech: "動詞", meaning: "挖掘" },
    { word: "dining room", partOfSpeech: "名詞", meaning: "餐廳" },
    { word: "dinner", partOfSpeech: "名詞", meaning: "晚餐" },
    { word: "dirty", partOfSpeech: "形容詞", meaning: "骯髒的" },
    { word: "dish", partOfSpeech: "名詞", meaning: "盤子" },
    { word: "do（does, did, done）", partOfSpeech: "動詞", meaning: "做" },
    { word: "doctor（Dr.）", partOfSpeech: "名詞", meaning: "醫生" },
    { word: "dog", partOfSpeech: "名詞", meaning: "狗" },
    { word: "doll", partOfSpeech: "名詞", meaning: "玩偶" },
    { word: "dollar", partOfSpeech: "名詞", meaning: "美元" },
    { word: "door", partOfSpeech: "名詞", meaning: "門" },
    { word: "dot", partOfSpeech: "名詞／動詞", meaning: "點／點綴" },
    { word: "down", partOfSpeech: "副詞／形容詞", meaning: "向下／低" },
    { word: "download", partOfSpeech: "動詞", meaning: "下載" },
    { word: "dozen", partOfSpeech: "名詞", meaning: "打（一打）" },
    { word: "draw", partOfSpeech: "動詞", meaning: "畫" },
    { word: "drawer", partOfSpeech: "名詞", meaning: "抽屜" },
    { word: "dream", partOfSpeech: "名詞／動詞", meaning: "夢／做夢" },
    { word: "dress", partOfSpeech: "名詞／動詞", meaning: "連衣裙／穿著" },
    { word: "drink", partOfSpeech: "動詞／名詞", meaning: "喝／飲料" },
    { word: "drive", partOfSpeech: "動詞／名詞", meaning: "駕駛／車程" },
    { word: "driver", partOfSpeech: "名詞", meaning: "駕駛員" },
    { word: "drop", partOfSpeech: "動詞／名詞", meaning: "放下／下降" },
    { word: "drum", partOfSpeech: "名詞", meaning: "鼓" },
    { word: "dry", partOfSpeech: "動詞／形容詞", meaning: "乾燥／乾的" },
    { word: "duck", partOfSpeech: "名詞", meaning: "鴨子" },
    { word: "during", partOfSpeech: "介系詞", meaning: "在⋯期間" },
    { word: "daily", partOfSpeech: "形容詞", meaning: "每日的" },
    { word: "damage", partOfSpeech: "名詞／動詞", meaning: "損害／損壞" },
    { word: "danger", partOfSpeech: "名詞", meaning: "危險" },
    { word: "dawn", partOfSpeech: "名詞", meaning: "黎明" },
    { word: "deaf", partOfSpeech: "形容詞", meaning: "聾的" },
    { word: "debate", partOfSpeech: "名詞／動詞", meaning: "辯論／辯論" },
    { word: "decision", partOfSpeech: "名詞", meaning: "決定" },
    { word: "decorate", partOfSpeech: "動詞", meaning: "裝飾" },
    { word: "decrease", partOfSpeech: "動詞／名詞", meaning: "減少／減少" },
    { word: "deer", partOfSpeech: "名詞", meaning: "鹿" },
    { word: "degree", partOfSpeech: "名詞", meaning: "度" },
    { word: "deliver", partOfSpeech: "動詞", meaning: "交付" },
    { word: "department", partOfSpeech: "名詞", meaning: "部門" },
    { word: "depend", partOfSpeech: "動詞", meaning: "依賴" },
    { word: "describe", partOfSpeech: "動詞", meaning: "描述" },
    { word: "desert", partOfSpeech: "名詞", meaning: "沙漠" },
    { word: "design", partOfSpeech: "動詞／名詞", meaning: "設計／設計" },
    { word: "desire", partOfSpeech: "名詞／動詞", meaning: "渴望／渴望" },
    { word: "dessert", partOfSpeech: "名詞", meaning: "甜點" },
    { word: "detect", partOfSpeech: "動詞", meaning: "檢測" },
    { word: "develop", partOfSpeech: "動詞", meaning: "發展" },
    { word: "dial", partOfSpeech: "名詞／動詞", meaning: "撥號／撥" },
    { word: "diamond", partOfSpeech: "名詞", meaning: "鑽石" },
    { word: "diary", partOfSpeech: "名詞", meaning: "日記" },
    { word: "diet", partOfSpeech: "名詞", meaning: "飲食" },
    { word: "difference", partOfSpeech: "名詞", meaning: "差異" },
    { word: "difficulty", partOfSpeech: "名詞", meaning: "困難" },
    { word: "diligent", partOfSpeech: "形容詞", meaning: "用心的" },
    { word: "diplomat", partOfSpeech: "名詞", meaning: "外交官" },
    { word: "dinosaur", partOfSpeech: "名詞", meaning: "恐龍" },
    { word: "direct", partOfSpeech: "形容詞／動詞", meaning: "直接的／指導" },
    { word: "direction", partOfSpeech: "名詞", meaning: "方向" },
    { word: "disappear", partOfSpeech: "動詞", meaning: "消失" },
    { word: "discover", partOfSpeech: "動詞", meaning: "發現" },
    { word: "discuss", partOfSpeech: "動詞", meaning: "討論" },
    { word: "discussion", partOfSpeech: "名詞", meaning: "討論" },
    { word: "dishonest", partOfSpeech: "形容詞", meaning: "不誠實的" },
    { word: "distance", partOfSpeech: "名詞", meaning: "距離" },
    { word: "distant", partOfSpeech: "形容詞", meaning: "遙遠的" },
    { word: "divide", partOfSpeech: "動詞", meaning: "分割" },
    { word: "dizzy", partOfSpeech: "形容詞", meaning: "頭暈的" },
    { word: "dodge ball", partOfSpeech: "名詞", meaning: "躲避球" },
    { word: "dolphin", partOfSpeech: "名詞", meaning: "海豚" },
    { word: "donkey", partOfSpeech: "名詞", meaning: "驢子" },
    { word: "double", partOfSpeech: "形容詞／動詞", meaning: "兩倍的／加倍" },
    { word: "doubt", partOfSpeech: "名詞／動詞", meaning: "懷疑／懷疑" },
    { word: "doughnut", partOfSpeech: "名詞", meaning: "甜甜圈" },
    { word: "downstairs", partOfSpeech: "副詞", meaning: "樓下" },
    { word: "downtown", partOfSpeech: "名詞／副詞", meaning: "市區／在市區" },
    { word: "dragon", partOfSpeech: "名詞", meaning: "龍" },
    { word: "drama", partOfSpeech: "名詞", meaning: "戲劇" },
    { word: "dresser", partOfSpeech: "名詞", meaning: "梳妝台" },
    { word: "drugstore", partOfSpeech: "名詞", meaning: "藥局" },
    { word: "dryer", partOfSpeech: "名詞", meaning: "烘乾機" },
    { word: "dumb", partOfSpeech: "形容詞", meaning: "啞的" },
    { word: "dumpling", partOfSpeech: "名詞", meaning: "餃子" },
    { word: "duty", partOfSpeech: "名詞", meaning: "職責" },
    // E開頭
    { word: "each", partOfSpeech: "代名詞", meaning: "每個" },
    { word: "ear", partOfSpeech: "名詞", meaning: "耳朵" },
    { word: "early", partOfSpeech: "形容詞／副詞", meaning: "早的／早期" },
    { word: "earth", partOfSpeech: "名詞", meaning: "地球" },
    { word: "earthquake", partOfSpeech: "名詞", meaning: "地震" },
    { word: "east", partOfSpeech: "名詞／形容詞", meaning: "東方／東方的" },
    { word: "Easter", partOfSpeech: "名詞", meaning: "復活節" },
    { word: "easy", partOfSpeech: "形容詞", meaning: "容易的" },
    { word: "eat", partOfSpeech: "動詞", meaning: "吃" },
    { word: "egg", partOfSpeech: "名詞", meaning: "蛋" },
    { word: "eight", partOfSpeech: "數詞", meaning: "八" },
    { word: "eighteen", partOfSpeech: "數詞", meaning: "十八" },
    { word: "eighty", partOfSpeech: "數詞", meaning: "八十" },
    { word: "either", partOfSpeech: "連接詞", meaning: "任一" },
    { word: "elementary school", partOfSpeech: "名詞", meaning: "小學" },
    { word: "elephant", partOfSpeech: "名詞", meaning: "大象" },
    { word: "eleven", partOfSpeech: "數詞", meaning: "十一" },
    { word: "else", partOfSpeech: "副詞／連接詞", meaning: "其他／否則" },
    { word: "e-mail", partOfSpeech: "名詞", meaning: "電子郵件" },
    { word: "end", partOfSpeech: "名詞／動詞", meaning: "結束／結束" },
    { word: "engineer", partOfSpeech: "名詞", meaning: "工程師" },
    { word: "English", partOfSpeech: "名詞／形容詞", meaning: "英語／英文" },
    { word: "enjoy", partOfSpeech: "動詞", meaning: "享受" },
    { word: "enough", partOfSpeech: "代名詞", meaning: "足夠" },
    { word: "enter", partOfSpeech: "動詞", meaning: "進入" },
    { word: "envelope", partOfSpeech: "名詞", meaning: "信封" },
    { word: "eraser", partOfSpeech: "名詞", meaning: "橡皮擦" },
    { word: "error", partOfSpeech: "名詞", meaning: "錯誤" },
    { word: "eve", partOfSpeech: "名詞", meaning: "前夕" },
    { word: "even", partOfSpeech: "副詞", meaning: "甚至" },
    { word: "evening", partOfSpeech: "名詞", meaning: "傍晚" },
    { word: "ever", partOfSpeech: "副詞", meaning: "曾經" },
    { word: "every", partOfSpeech: "代名詞", meaning: "每個" },
    { word: "everyone（everybody）", partOfSpeech: "代名詞", meaning: "每個人" },
    { word: "everything", partOfSpeech: "代名詞", meaning: "一切" },
    { word: "example", partOfSpeech: "名詞", meaning: "例子" },
    { word: "excellent", partOfSpeech: "形容詞", meaning: "優秀的" },
    { word: "except", partOfSpeech: "介系詞", meaning: "除了" },
    { word: "excited", partOfSpeech: "形容詞", meaning: "興奮的" },
    { word: "exciting", partOfSpeech: "形容詞", meaning: "令人興奮的" },
    { word: "excuse", partOfSpeech: "名詞／動詞", meaning: "藉口／原諒" },
    { word: "exercise", partOfSpeech: "名詞／動詞", meaning: "運動／練習" },
    { word: "expect", partOfSpeech: "動詞", meaning: "期待" },
    { word: "expensive", partOfSpeech: "形容詞", meaning: "昂貴的" },
    { word: "experience", partOfSpeech: "名詞／動詞", meaning: "經驗／體驗" },
    { word: "explain", partOfSpeech: "動詞", meaning: "解釋" },
    { word: "eye", partOfSpeech: "名詞", meaning: "眼睛" },
    { word: "eagle", partOfSpeech: "名詞", meaning: "鷹" },
    { word: "earn", partOfSpeech: "動詞", meaning: "賺取" },
    { word: "earrings", partOfSpeech: "名詞", meaning: "耳環" },
    { word: "ease", partOfSpeech: "名詞／動詞", meaning: "輕鬆／減輕" },
    { word: "edge", partOfSpeech: "名詞", meaning: "邊緣" },
    { word: "education", partOfSpeech: "名詞", meaning: "教育" },
    { word: "effort", partOfSpeech: "名詞", meaning: "努力" },
    { word: "elder", partOfSpeech: "形容詞", meaning: "年長的" },
    { word: "elect", partOfSpeech: "動詞", meaning: "選舉" },
    { word: "electric", partOfSpeech: "形容詞", meaning: "電的" },
    { word: "embarrass", partOfSpeech: "動詞", meaning: "使尷尬" },
    { word: "emotion", partOfSpeech: "名詞", meaning: "情感" },
    { word: "emphasize", partOfSpeech: "動詞", meaning: "強調" },
    { word: "employ", partOfSpeech: "動詞", meaning: "雇用" },
    { word: "empty", partOfSpeech: "形容詞", meaning: "空的" },
    { word: "enemy", partOfSpeech: "名詞", meaning: "敵人" },
    { word: "energetic", partOfSpeech: "形容詞", meaning: "充滿活力的" },
    { word: "energy", partOfSpeech: "名詞", meaning: "能量" },
    { word: "engine", partOfSpeech: "名詞", meaning: "引擎" },
    { word: "entrance", partOfSpeech: "名詞", meaning: "入口" },
    { word: "environment", partOfSpeech: "名詞", meaning: "環境" },
    { word: "envy", partOfSpeech: "動詞", meaning: "嫉妒" },
    { word: "equal", partOfSpeech: "形容詞／動詞", meaning: "相等的／使相等" },
    { word: "especially", partOfSpeech: "副詞", meaning: "尤其" },
    { word: "event", partOfSpeech: "名詞", meaning: "事件" },
    { word: "everywhere", partOfSpeech: "副詞", meaning: "到處" },
    { word: "evil", partOfSpeech: "形容詞", meaning: "邪惡的" },
    { word: "exam", partOfSpeech: "名詞", meaning: "考試" },
    { word: "excite", partOfSpeech: "動詞", meaning: "使興奮" },
    { word: "exist", partOfSpeech: "動詞", meaning: "存在" },
    { word: "exit", partOfSpeech: "名詞／動詞", meaning: "出口／退出" },
    { word: "express", partOfSpeech: "動詞", meaning: "表達" },
    { word: "extra", partOfSpeech: "形容詞", meaning: "額外的" },
    // F開頭
    { word: "face", partOfSpeech: "名詞／動詞", meaning: "臉／面對" },
    { word: "fact", partOfSpeech: "名詞", meaning: "事實" },
    { word: "factory", partOfSpeech: "名詞", meaning: "工廠" },
    { word: "fail", partOfSpeech: "動詞", meaning: "失敗" },
    { word: "fall", partOfSpeech: "動詞／名詞", meaning: "落下／秋季" },
    { word: "family", partOfSpeech: "名詞", meaning: "家庭" },
    { word: "famous", partOfSpeech: "形容詞", meaning: "著名的" },
    { word: "fan", partOfSpeech: "名詞", meaning: "風扇" },
    { word: "far", partOfSpeech: "形容詞／副詞", meaning: "遠的／遠地" },
    { word: "farm", partOfSpeech: "名詞／動詞", meaning: "農場／耕作" },
    { word: "farmer", partOfSpeech: "名詞", meaning: "農夫" },
    { word: "fast", partOfSpeech: "形容詞／副詞", meaning: "快的／快速地" },
    { word: "fat", partOfSpeech: "形容詞／名詞", meaning: "肥胖的／脂肪" },
    { word: "father（dad, daddy）", partOfSpeech: "名詞", meaning: "父親" },
    { word: "favorite", partOfSpeech: "形容詞／名詞", meaning: "最喜歡的／最喜歡" },
    { word: "February", partOfSpeech: "名詞", meaning: "二月" },
    { word: "feed", partOfSpeech: "動詞", meaning: "餵養" },
    { word: "feel", partOfSpeech: "動詞", meaning: "感覺" },
    { word: "festival", partOfSpeech: "名詞", meaning: "節日" },
    { word: "fever", partOfSpeech: "名詞", meaning: "發燒" },
    { word: "few", partOfSpeech: "形容詞／代名詞", meaning: "少數的／少數" },
    { word: "fifteen", partOfSpeech: "數詞", meaning: "十五" },
    { word: "fifty", partOfSpeech: "數詞", meaning: "五十" },
    { word: "fight", partOfSpeech: "動詞／名詞", meaning: "打鬥／爭執" },
    { word: "file", partOfSpeech: "名詞／動詞", meaning: "檔案／歸檔" },
    { word: "fill", partOfSpeech: "動詞", meaning: "填滿" },
    { word: "finally", partOfSpeech: "副詞", meaning: "最後" },
    { word: "find", partOfSpeech: "動詞", meaning: "找到" },
    { word: "fine", partOfSpeech: "形容詞", meaning: "好的" },
    { word: "finger", partOfSpeech: "名詞", meaning: "手指" },
    { word: "finish", partOfSpeech: "動詞", meaning: "完成" },
    { word: "fire", partOfSpeech: "名詞／動詞", meaning: "火／點火" },
    { word: "first", partOfSpeech: "序數詞", meaning: "第一" },
    { word: "fish", partOfSpeech: "名詞／動詞", meaning: "魚／釣魚" },
    { word: "fisherman", partOfSpeech: "名詞", meaning: "漁夫" },
    { word: "five", partOfSpeech: "數詞", meaning: "五" },
    { word: "fix", partOfSpeech: "動詞", meaning: "修理" },
    { word: "floor", partOfSpeech: "名詞", meaning: "地板" },
    { word: "flower", partOfSpeech: "名詞", meaning: "花" },
    { word: "fly", partOfSpeech: "動詞／名詞", meaning: "飛／蒼蠅" },
    { word: "follow", partOfSpeech: "動詞", meaning: "跟隨" },
    { word: "food", partOfSpeech: "名詞", meaning: "食物" },
    { word: "fool", partOfSpeech: "名詞／動詞", meaning: "笨蛋／愚弄" },
    { word: "foot", partOfSpeech: "名詞", meaning: "腳" },
    { word: "for", partOfSpeech: "介系詞", meaning: "為" },
    { word: "foreign", partOfSpeech: "形容詞", meaning: "外國的" },
    { word: "foreigner", partOfSpeech: "名詞", meaning: "外國人" },
    { word: "forget", partOfSpeech: "動詞", meaning: "忘記" },
    { word: "fork", partOfSpeech: "名詞", meaning: "叉子" },
    { word: "forty", partOfSpeech: "數詞", meaning: "四十" },
    { word: "four", partOfSpeech: "數詞", meaning: "四" },
    { word: "fourteen", partOfSpeech: "數詞", meaning: "十四" },
    { word: "fox", partOfSpeech: "名詞", meaning: "狐狸" },
    { word: "free", partOfSpeech: "形容詞／動詞", meaning: "自由的／釋放" },
    { word: "fresh", partOfSpeech: "形容詞", meaning: "新鮮的" },
    { word: "Friday", partOfSpeech: "名詞", meaning: "星期五" },
    { word: "friend", partOfSpeech: "名詞", meaning: "朋友" },
    { word: "friendly", partOfSpeech: "形容詞", meaning: "友好的" },
    { word: "fries（French fries）", partOfSpeech: "名詞", meaning: "炸薯條" },
    { word: "frog", partOfSpeech: "名詞", meaning: "青蛙" },
    { word: "from", partOfSpeech: "介系詞", meaning: "從" },
    { word: "front", partOfSpeech: "名詞", meaning: "前面" },
    { word: "fruit", partOfSpeech: "名詞", meaning: "水果" },
    { word: "fry", partOfSpeech: "動詞／名詞", meaning: "油炸／炸物" },
    { word: "full", partOfSpeech: "形容詞", meaning: "充滿的" },
    { word: "fun", partOfSpeech: "名詞", meaning: "樂趣" },
    { word: "funny", partOfSpeech: "形容詞", meaning: "滑稽的" },
    { word: "future", partOfSpeech: "名詞／形容詞", meaning: "未來／未來的" },
    { word: "fair", partOfSpeech: "形容詞／名詞", meaning: "公平的／市集" },
    { word: "false", partOfSpeech: "形容詞", meaning: "虛假的" },
    { word: "fancy", partOfSpeech: "形容詞／動詞", meaning: "花式的／幻想" },
    { word: "fantastic", partOfSpeech: "形容詞", meaning: "極好的" },
    { word: "fashionable", partOfSpeech: "形容詞", meaning: "時髦的" },
    { word: "faucet", partOfSpeech: "名詞", meaning: "水龍頭" },
    { word: "fault", partOfSpeech: "名詞", meaning: "錯誤" },
    { word: "fear", partOfSpeech: "名詞／動詞", meaning: "害怕／恐懼" },
    { word: "fee", partOfSpeech: "名詞", meaning: "費用" },
    { word: "feeling", partOfSpeech: "名詞", meaning: "感覺" },
    { word: "female", partOfSpeech: "形容詞", meaning: "雌性的" },
    { word: "fence", partOfSpeech: "名詞", meaning: "圍欄" },
    { word: "film", partOfSpeech: "名詞／動詞", meaning: "電影／拍攝" },
    { word: "final", partOfSpeech: "形容詞", meaning: "最後的" },
    { word: "fit", partOfSpeech: "形容詞／動詞", meaning: "適合的／安裝" },
    { word: "flag", partOfSpeech: "名詞", meaning: "旗幟" },
    { word: "flashlight", partOfSpeech: "名詞", meaning: "手電筒" },
    { word: "flat tire", partOfSpeech: "名詞", meaning: "爆胎" },
    { word: "flight", partOfSpeech: "名詞", meaning: "飛行" },
    { word: "flour", partOfSpeech: "名詞", meaning: "麵粉" },
    { word: "flu", partOfSpeech: "名詞", meaning: "流感" },
    { word: "flute", partOfSpeech: "名詞", meaning: "長笛" },
    { word: "focus", partOfSpeech: "名詞／動詞", meaning: "焦點／聚焦" },
    { word: "fog", partOfSpeech: "名詞", meaning: "霧" },
    { word: "foggy", partOfSpeech: "形容詞", meaning: "多霧的" },
    { word: "foolish", partOfSpeech: "形容詞", meaning: "愚蠢的" },
    { word: "football", partOfSpeech: "名詞", meaning: "橄欖球" },
    { word: "forest", partOfSpeech: "名詞", meaning: "森林" },
    { word: "forgive", partOfSpeech: "動詞", meaning: "寬恕" },
    { word: "form", partOfSpeech: "名詞／動詞", meaning: "表格／形成" },
    { word: "formal", partOfSpeech: "形容詞", meaning: "正式的" },
    { word: "former", partOfSpeech: "形容詞", meaning: "前者的" },
    { word: "forward", partOfSpeech: "形容詞／副詞", meaning: "向前的／向前" },
    { word: "frank", partOfSpeech: "形容詞", meaning: "坦率的" },
    { word: "freedom", partOfSpeech: "名詞", meaning: "自由" },
    { word: "freezer", partOfSpeech: "名詞", meaning: "冷凍櫃" },
    { word: "freezing", partOfSpeech: "形容詞", meaning: "極冷的" },
    { word: "friendship", partOfSpeech: "名詞", meaning: "友誼" },
    { word: "frighten", partOfSpeech: "動詞", meaning: "使驚恐" },
    { word: "frisbee", partOfSpeech: "名詞", meaning: "飛盤" },
    { word: "furniture", partOfSpeech: "名詞", meaning: "傢俱" },
    // G開頭
    { word: "game", partOfSpeech: "名詞", meaning: "遊戲" },
    { word: "garden", partOfSpeech: "名詞", meaning: "花園" },
    { word: "garbage", partOfSpeech: "名詞", meaning: "垃圾" },
    { word: "gas", partOfSpeech: "名詞", meaning: "氣體" },
    { word: "gate", partOfSpeech: "名詞", meaning: "大門" },
    { word: "get", partOfSpeech: "動詞", meaning: "獲得" },
    { word: "ghost", partOfSpeech: "名詞", meaning: "鬼魂" },
    { word: "giant", partOfSpeech: "名詞／形容詞", meaning: "巨人／巨大的" },
    { word: "gift", partOfSpeech: "名詞", meaning: "禮物" },
    { word: "girl", partOfSpeech: "名詞", meaning: "女孩" },
    { word: "give", partOfSpeech: "動詞", meaning: "給予" },
    { word: "glad", partOfSpeech: "形容詞", meaning: "高興的" },
    { word: "glass", partOfSpeech: "名詞", meaning: "玻璃" },
    { word: "glasses", partOfSpeech: "名詞", meaning: "眼鏡" },
    { word: "glove", partOfSpeech: "名詞", meaning: "手套" },
    { word: "glue", partOfSpeech: "名詞／動詞", meaning: "膠水／黏住" },
    { word: "go", partOfSpeech: "動詞", meaning: "去" },
    { word: "goat", partOfSpeech: "名詞", meaning: "山羊" },
    { word: "god", partOfSpeech: "名詞", meaning: "上帝" },
    { word: "good", partOfSpeech: "形容詞", meaning: "好的" },
    { word: "good-bye（goodbye, bye）", partOfSpeech: "名詞／動詞", meaning: "再見／告別" },
    { word: "goose", partOfSpeech: "名詞", meaning: "鵝" },
    { word: "grade", partOfSpeech: "名詞／動詞", meaning: "成績／評分" },
    { word: "gram", partOfSpeech: "名詞", meaning: "克" },
    { word: "grandfather（grandpa）", partOfSpeech: "名詞", meaning: "祖父" },
    { word: "grandmother（grandma）", partOfSpeech: "名詞", meaning: "祖母" },
    { word: "grape", partOfSpeech: "名詞", meaning: "葡萄" },
    { word: "grass", partOfSpeech: "名詞", meaning: "草地" },
    { word: "gray", partOfSpeech: "形容詞", meaning: "灰色的" },
    { word: "great", partOfSpeech: "形容詞", meaning: "偉大的" },
    { word: "green", partOfSpeech: "形容詞／名詞", meaning: "綠色的／綠色" },
    { word: "ground", partOfSpeech: "名詞", meaning: "地面" },
    { word: "group", partOfSpeech: "名詞", meaning: "團體" },
    { word: "grow", partOfSpeech: "動詞", meaning: "成長" },
    { word: "guava", partOfSpeech: "名詞", meaning: "番石榴" },
    { word: "guess", partOfSpeech: "動詞／名詞", meaning: "猜測／猜想" },
    { word: "guitar", partOfSpeech: "名詞", meaning: "吉他" },
    { word: "guy", partOfSpeech: "名詞", meaning: "人" },
    { word: "gym", partOfSpeech: "名詞", meaning: "體育館" },
    { word: "gain", partOfSpeech: "名詞／動詞", meaning: "獲得／增加" },
    { word: "garage", partOfSpeech: "名詞", meaning: "車庫" },
    { word: "gather", partOfSpeech: "動詞", meaning: "收集" },
    { word: "general", partOfSpeech: "形容詞／名詞", meaning: "一般的／將軍" },
    { word: "generous", partOfSpeech: "形容詞", meaning: "慷慨的" },
    { word: "genius", partOfSpeech: "名詞", meaning: "天才" },
    { word: "gentle", partOfSpeech: "形容詞", meaning: "溫和的" },
    { word: "gentleman", partOfSpeech: "名詞", meaning: "紳士" },
    { word: "geography", partOfSpeech: "名詞", meaning: "地理學" },
    { word: "gesture", partOfSpeech: "名詞", meaning: "手勢" },
    { word: "goal", partOfSpeech: "名詞", meaning: "目標" },
    { word: "gold", partOfSpeech: "名詞／形容詞", meaning: "黃金／金色" },
    { word: "golden", partOfSpeech: "形容詞", meaning: "金色的" },
    { word: "golf", partOfSpeech: "名詞", meaning: "高爾夫球" },
    { word: "goodness", partOfSpeech: "名詞", meaning: "善良" },
    { word: "government", partOfSpeech: "名詞", meaning: "政府" },
    { word: "granddaughter", partOfSpeech: "名詞", meaning: "孫女" },
    { word: "grandson", partOfSpeech: "名詞", meaning: "孫子" },
    { word: "greedy", partOfSpeech: "形容詞", meaning: "貪婪的" },
    { word: "greet", partOfSpeech: "動詞", meaning: "問候" },
    { word: "guard", partOfSpeech: "名詞／動詞", meaning: "警衛／保護" },
    { word: "guest", partOfSpeech: "名詞", meaning: "客人" },
    { word: "guide", partOfSpeech: "名詞／動詞", meaning: "指導／引導" },
    { word: "gun", partOfSpeech: "名詞", meaning: "槍" },
    // H開頭
    { word: "habit", partOfSpeech: "名詞", meaning: "習慣" },
    { word: "hair", partOfSpeech: "名詞", meaning: "頭髮" },
    { word: "half", partOfSpeech: "名詞／形容詞／副詞", meaning: "一半／半的／一半地" },
    { word: "Halloween", partOfSpeech: "名詞", meaning: "萬聖節" },
    { word: "ham", partOfSpeech: "名詞", meaning: "火腿" },
    { word: "hamburger（burger）", partOfSpeech: "名詞", meaning: "漢堡（漢堡包）" },
    { word: "hand", partOfSpeech: "名詞／動詞", meaning: "手／遞交" },
    { word: "handsome", partOfSpeech: "形容詞", meaning: "英俊的" },
    { word: "hang", partOfSpeech: "動詞", meaning: "懸掛" },
    { word: "happen", partOfSpeech: "動詞", meaning: "發生" },
    { word: "happy", partOfSpeech: "形容詞", meaning: "快樂的" },
    { word: "hard", partOfSpeech: "形容詞／副詞", meaning: "困難的／努力地" },
    { word: "hard-working", partOfSpeech: "形容詞", meaning: "勤奮的" },
    { word: "hat", partOfSpeech: "名詞", meaning: "帽子" },
    { word: "hate", partOfSpeech: "動詞", meaning: "討厭" },
    { word: "have（has, had）", partOfSpeech: "動詞", meaning: "擁有／有（曾經）" },
    { word: "he（him, his, himself）", partOfSpeech: "代名詞", meaning: "他（他的，他自己）" },
    { word: "head", partOfSpeech: "名詞", meaning: "頭部" },
    { word: "headache", partOfSpeech: "名詞", meaning: "頭痛" },
    { word: "health", partOfSpeech: "名詞", meaning: "健康" },
    { word: "healthy", partOfSpeech: "形容詞", meaning: "健康的" },
    { word: "hear", partOfSpeech: "動詞", meaning: "聽見" },
    { word: "heart", partOfSpeech: "名詞", meaning: "心臟" },
    { word: "heat", partOfSpeech: "名詞／動詞", meaning: "熱／加熱" },
    { word: "heavy", partOfSpeech: "形容詞", meaning: "重的" },
    { word: "height", partOfSpeech: "名詞", meaning: "高度" },
    { word: "hello", partOfSpeech: "感嘆詞", meaning: "你好" },
    { word: "help", partOfSpeech: "動詞／名詞", meaning: "幫助／幫助" },
    { word: "helpful", partOfSpeech: "形容詞", meaning: "有幫助的" },
    { word: "hen", partOfSpeech: "名詞", meaning: "母雞" },
    { word: "here", partOfSpeech: "副詞", meaning: "在這裡" },
    { word: "hey", partOfSpeech: "感嘆詞", meaning: "嘿" },
    { word: "hi", partOfSpeech: "感嘆詞", meaning: "嗨" },
    { word: "hide", partOfSpeech: "動詞", meaning: "躲藏" },
    { word: "high", partOfSpeech: "形容詞", meaning: "高的" },
    { word: "hike", partOfSpeech: "名詞／動詞", meaning: "徒步旅行／追蹤" },
    { word: "hill", partOfSpeech: "名詞", meaning: "小山" },
    { word: "history", partOfSpeech: "名詞", meaning: "歷史" },
    { word: "hit", partOfSpeech: "動詞／名詞", meaning: "打擊／命中" },
    { word: "hobby", partOfSpeech: "名詞", meaning: "嗜好" },
    { word: "hold", partOfSpeech: "動詞", meaning: "握住" },
    { word: "holiday", partOfSpeech: "名詞", meaning: "假日" },
    { word: "home", partOfSpeech: "名詞／副詞", meaning: "家／回家" },
    { word: "homework", partOfSpeech: "名詞", meaning: "家庭作業" },
    { word: "honest", partOfSpeech: "形容詞", meaning: "誠實的" },
    { word: "honey", partOfSpeech: "名詞", meaning: "蜂蜜" },
    { word: "hope", partOfSpeech: "動詞／名詞", meaning: "希望／期望" },
    { word: "horse", partOfSpeech: "名詞", meaning: "馬" },
    { word: "hospital", partOfSpeech: "名詞", meaning: "醫院" },
    { word: "hot", partOfSpeech: "形容詞", meaning: "熱的" },
    { word: "hot dog", partOfSpeech: "名詞", meaning: "熱狗" },
    { word: "hotel", partOfSpeech: "名詞", meaning: "酒店" },
    { word: "hour", partOfSpeech: "名詞", meaning: "小時" },
    { word: "house", partOfSpeech: "名詞", meaning: "房子" },
    { word: "housewife", partOfSpeech: "名詞", meaning: "家庭主婦" },
    { word: "how", partOfSpeech: "副詞", meaning: "如何" },
    { word: "however", partOfSpeech: "副詞", meaning: "然而" },
    { word: "hundred", partOfSpeech: "數詞／名詞", meaning: "一百／百分之一" },
    { word: "hungry", partOfSpeech: "形容詞", meaning: "飢餓的" },
    { word: "hunt", partOfSpeech: "動詞", meaning: "狩獵" },
    { word: "hurry", partOfSpeech: "動詞／名詞", meaning: "匆忙／趕快" },
    { word: "hurt", partOfSpeech: "動詞／名詞", meaning: "傷害／疼痛" },
    { word: "husband", partOfSpeech: "名詞", meaning: "丈夫" },
    { word: "hair dresser", partOfSpeech: "名詞", meaning: "美髮師" },
    { word: "haircut", partOfSpeech: "名詞", meaning: "理髮" },
    { word: "hall", partOfSpeech: "名詞", meaning: "大廳" },
    { word: "hammer", partOfSpeech: "名詞／動詞", meaning: "鎚子／用鎚子打" },
    { word: "handkerchief", partOfSpeech: "名詞", meaning: "手帕" },
    { word: "handle", partOfSpeech: "名詞／動詞", meaning: "把手／處理" },
    { word: "hanger", partOfSpeech: "名詞", meaning: "衣架" },
    { word: "hardly", partOfSpeech: "副詞", meaning: "幾乎不" },
    { word: "heater", partOfSpeech: "名詞", meaning: "暖氣" },
    { word: "helicopter", partOfSpeech: "名詞", meaning: "直升機" },
    { word: "hero", partOfSpeech: "名詞", meaning: "英雄" },
    { word: "highway", partOfSpeech: "名詞", meaning: "公路" },
    { word: "hip", partOfSpeech: "名詞", meaning: "臀部" },
    { word: "hippo", partOfSpeech: "名詞", meaning: "河馬" },
    { word: "hire", partOfSpeech: "動詞", meaning: "雇用" },
    { word: "hole", partOfSpeech: "名詞", meaning: "孔洞" },
    { word: "homesick", partOfSpeech: "形容詞", meaning: "想家的" },
    { word: "honesty", partOfSpeech: "名詞", meaning: "誠實" },
    { word: "hop", partOfSpeech: "動詞／名詞", meaning: "跳躍／跳躍" },
    { word: "horrible", partOfSpeech: "形容詞", meaning: "可怕的" },
    { word: "host", partOfSpeech: "名詞／動詞", meaning: "主持人／主持" },
    { word: "housework", partOfSpeech: "名詞", meaning: "家務" },
    { word: "hug", partOfSpeech: "動詞／名詞", meaning: "擁抱／擁抱" },
    { word: "human", partOfSpeech: "形容詞／名詞", meaning: "人類的／人類" },
    { word: "humble", partOfSpeech: "形容詞", meaning: "謙虛的" },
    { word: "humid", partOfSpeech: "形容詞", meaning: "潮濕的" },
    { word: "humor", partOfSpeech: "名詞", meaning: "幽默" },
    { word: "humorous", partOfSpeech: "形容詞", meaning: "幽默的" },
    { word: "hunger", partOfSpeech: "名詞", meaning: "飢餓" },
    { word: "hunter", partOfSpeech: "名詞", meaning: "獵人" },
    // I開頭
    { word: "I（me, my, mine, myself）", partOfSpeech: "代名詞", meaning: "我（我的，我自己）" },
    { word: "ice", partOfSpeech: "名詞", meaning: "冰" },
    { word: "ice cream", partOfSpeech: "名詞", meaning: "冰淇淋" },
    { word: "idea", partOfSpeech: "名詞", meaning: "想法" },
    { word: "if", partOfSpeech: "連詞", meaning: "如果" },
    { word: "important", partOfSpeech: "形容詞", meaning: "重要的" },
    { word: "in", partOfSpeech: "介詞", meaning: "在" },
    { word: "inch", partOfSpeech: "名詞", meaning: "英吋" },
    { word: "insect", partOfSpeech: "名詞", meaning: "昆蟲" },
    { word: "inside", partOfSpeech: "副詞／介詞", meaning: "在裡面／裡面" },
    { word: "interest", partOfSpeech: "名詞／動詞", meaning: "興趣／使感興趣" },
    { word: "interested", partOfSpeech: "形容詞", meaning: "感興趣的" },
    { word: "interesting", partOfSpeech: "形容詞", meaning: "有趣的" },
    { word: "Internet（Net）", partOfSpeech: "名詞", meaning: "網路" },
    { word: "interview", partOfSpeech: "名詞／動詞", meaning: "採訪／面試" },
    { word: "into", partOfSpeech: "介詞", meaning: "到" },
    { word: "invite", partOfSpeech: "動詞", meaning: "邀請" },
    { word: "island", partOfSpeech: "名詞", meaning: "島嶼" },
    { word: "it（its, itself）", partOfSpeech: "代名詞", meaning: "它（它的，它自己）" },
    { word: "item", partOfSpeech: "名詞", meaning: "項目" },
    { word: "ignore", partOfSpeech: "動詞", meaning: "忽視" },
    { word: "ill", partOfSpeech: "形容詞", meaning: "生病的" },
    { word: "imagine", partOfSpeech: "動詞", meaning: "想像" },
    { word: "impolite", partOfSpeech: "形容詞", meaning: "不禮貌的" },
    { word: "importance", partOfSpeech: "名詞", meaning: "重要性" },
    { word: "impossible", partOfSpeech: "形容詞", meaning: "不可能的" },
    { word: "improve", partOfSpeech: "動詞", meaning: "改善" },
    { word: "include", partOfSpeech: "動詞", meaning: "包括" },
    { word: "income", partOfSpeech: "名詞", meaning: "收入" },
    { word: "increase", partOfSpeech: "動詞", meaning: "增加" },
    { word: "independent", partOfSpeech: "形容詞", meaning: "獨立的" },
    { word: "indicate", partOfSpeech: "動詞", meaning: "指示" },
    { word: "influence", partOfSpeech: "名詞／動詞", meaning: "影響／影響" },
    { word: "information", partOfSpeech: "名詞", meaning: "資訊" },
    { word: "ink", partOfSpeech: "名詞", meaning: "墨水" },
    { word: "insist", partOfSpeech: "動詞", meaning: "堅持" },
    { word: "inspire", partOfSpeech: "動詞", meaning: "激勵" },
    { word: "instant", partOfSpeech: "形容詞", meaning: "立即的" },
    { word: "instrument", partOfSpeech: "名詞", meaning: "儀器" },
    { word: "intelligent", partOfSpeech: "形容詞", meaning: "聰明的" },
    { word: "international", partOfSpeech: "形容詞", meaning: "國際的" },
    { word: "interrupt", partOfSpeech: "動詞", meaning: "打擾" },
    { word: "introduce", partOfSpeech: "動詞", meaning: "介紹" },
    { word: "invent", partOfSpeech: "動詞", meaning: "發明" },
    { word: "invitation", partOfSpeech: "名詞", meaning: "邀請" },
    { word: "iron", partOfSpeech: "名詞／動詞", meaning: "鐵／燙衣服" },
    // J開頭
    { word: "jacket", partOfSpeech: "名詞", meaning: "夾克" },
    { word: "January", partOfSpeech: "名詞", meaning: "一月" },
    { word: "jeans", partOfSpeech: "名詞", meaning: "牛仔褲" },
    { word: "job", partOfSpeech: "名詞", meaning: "工作" },
    { word: "jog", partOfSpeech: "動詞／名詞", meaning: "慢跑／慢跑" },
    { word: "join", partOfSpeech: "動詞", meaning: "加入" },
    { word: "joke", partOfSpeech: "名詞／動詞", meaning: "笑話／開玩笑" },
    { word: "joy", partOfSpeech: "名詞", meaning: "喜悅" },
    { word: "juice", partOfSpeech: "名詞", meaning: "果汁" },
    { word: "July", partOfSpeech: "名詞", meaning: "七月" },
    { word: "jump", partOfSpeech: "動詞／名詞", meaning: "跳躍／跳躍" },
    { word: "June", partOfSpeech: "名詞", meaning: "六月" },
    { word: "junior high school", partOfSpeech: "名詞", meaning: "初中" },
    { word: "just", partOfSpeech: "副詞", meaning: "剛剛" },
    { word: "jam", partOfSpeech: "名詞／動詞", meaning: "果醬／塞滿" },
    { word: "jazz", partOfSpeech: "名詞", meaning: "爵士樂" },
    { word: "jealous", partOfSpeech: "形容詞", meaning: "嫉妒的" },
    { word: "jeep", partOfSpeech: "名詞", meaning: "吉普車" },
    { word: "journalist", partOfSpeech: "名詞", meaning: "新聞記者" },
    { word: "judge", partOfSpeech: "名詞／動詞", meaning: "法官／判斷" },
    // K開頭
    { word: "keep", partOfSpeech: "動詞", meaning: "保持" },
    { word: "key", partOfSpeech: "名詞", meaning: "鑰匙" },
    { word: "kick", partOfSpeech: "動詞／名詞", meaning: "踢／踢球" },
    { word: "kid", partOfSpeech: "名詞", meaning: "孩子" },
    { word: "kill", partOfSpeech: "動詞", meaning: "殺" },
    { word: "kilogram", partOfSpeech: "名詞", meaning: "公斤" },
    { word: "kind", partOfSpeech: "名詞／形容詞", meaning: "種類／親切的" },
    { word: "king", partOfSpeech: "名詞", meaning: "國王" },
    { word: "kiss", partOfSpeech: "動詞／名詞", meaning: "吻／親吻" },
    { word: "kitchen", partOfSpeech: "名詞", meaning: "廚房" },
    { word: "kite", partOfSpeech: "名詞", meaning: "風箏" },
    { word: "knee", partOfSpeech: "名詞", meaning: "膝蓋" },
    { word: "knife", partOfSpeech: "名詞", meaning: "刀" },
    { word: "knock", partOfSpeech: "動詞／名詞", meaning: "敲打／敲門" },
    { word: "know", partOfSpeech: "動詞", meaning: "知道" },
    { word: "knowledge", partOfSpeech: "名詞", meaning: "知識" },
    { word: "kangaroo", partOfSpeech: "名詞", meaning: "袋鼠" },
    { word: "ketchup", partOfSpeech: "名詞", meaning: "番茄醬" },
    { word: "kilometer", partOfSpeech: "名詞", meaning: "公里" },
    { word: "kindergarten", partOfSpeech: "名詞", meaning: "幼稚園" },
    { word: "kingdom", partOfSpeech: "名詞", meaning: "王國" },
    { word: "kitten", partOfSpeech: "名詞", meaning: "小貓" },
    { word: "koala", partOfSpeech: "名詞", meaning: "無尾熊" },
    // L開頭
    { word: "lake", partOfSpeech: "名詞", meaning: "湖" },
    { word: "lamp", partOfSpeech: "名詞", meaning: "燈" },
    { word: "land", partOfSpeech: "名詞／動詞", meaning: "土地／登陸" },
    { word: "language", partOfSpeech: "名詞", meaning: "語言" },
    { word: "large", partOfSpeech: "形容詞", meaning: "大的" },
    { word: "last", partOfSpeech: "形容詞／副詞／動詞／名詞", meaning: "最後的／最後／持續／過去的時間" },
    { word: "late", partOfSpeech: "形容詞／副詞", meaning: "遲的／晚了" },
    { word: "later", partOfSpeech: "副詞", meaning: "後來" },
    { word: "laugh", partOfSpeech: "動詞／名詞", meaning: "笑／笑聲" },
    { word: "lawyer", partOfSpeech: "名詞", meaning: "律師" },
    { word: "lazy", partOfSpeech: "形容詞", meaning: "懶惰的" },
    { word: "lead", partOfSpeech: "動詞／名詞", meaning: "領導／鉛" },
    { word: "leader", partOfSpeech: "名詞", meaning: "領導者" },
    { word: "learn", partOfSpeech: "動詞", meaning: "學習" },
    { word: "least", partOfSpeech: "形容詞／副詞", meaning: "最少的／至少" },
    { word: "leave", partOfSpeech: "動詞", meaning: "離開" },
    { word: "left", partOfSpeech: "形容詞／副詞／動詞", meaning: "左邊的／左／離開" },
    { word: "leg", partOfSpeech: "名詞", meaning: "腿" },
    { word: "lemon", partOfSpeech: "名詞", meaning: "檸檬" },
    { word: "lend", partOfSpeech: "動詞", meaning: "借出" },
    { word: "less", partOfSpeech: "形容詞／副詞", meaning: "較少的／更少地" },
    { word: "lesson", partOfSpeech: "名詞", meaning: "課程" },
    { word: "let", partOfSpeech: "動詞", meaning: "讓" },
    { word: "letter", partOfSpeech: "名詞", meaning: "信" },
    { word: "level", partOfSpeech: "名詞", meaning: "水平／等級" },
    { word: "library", partOfSpeech: "名詞", meaning: "圖書館" },
    { word: "lie", partOfSpeech: "動詞／名詞", meaning: "說謊／躺" },
    { word: "life", partOfSpeech: "名詞", meaning: "生活" },
    { word: "light", partOfSpeech: "名詞／形容詞／動詞", meaning: "光／輕的／點亮" },
    { word: "like", partOfSpeech: "動詞／介詞", meaning: "喜歡／像" },
    { word: "line", partOfSpeech: "名詞／動詞", meaning: "線／排隊" },
    { word: "lion", partOfSpeech: "名詞", meaning: "獅子" },
    { word: "lip", partOfSpeech: "名詞", meaning: "嘴唇" },
    { word: "list", partOfSpeech: "名詞／動詞", meaning: "清單／列出" },
    { word: "listen", partOfSpeech: "動詞", meaning: "聽" },
    { word: "little", partOfSpeech: "形容詞／副詞", meaning: "小的／少許" },
    { word: "live", partOfSpeech: "動詞／形容詞", meaning: "居住／現場的" },
    { word: "living room", partOfSpeech: "名詞", meaning: "客廳" },
    { word: "lonely", partOfSpeech: "形容詞", meaning: "寂寞的" },
    { word: "long", partOfSpeech: "形容詞／副詞", meaning: "長的／長時間" },
    { word: "look", partOfSpeech: "動詞／名詞", meaning: "看／外表" },
    { word: "lose", partOfSpeech: "動詞", meaning: "失去" },
    { word: "loud", partOfSpeech: "形容詞／副詞", meaning: "大聲的／大聲地" },
    { word: "love", partOfSpeech: "動詞／名詞", meaning: "愛／愛情" },
    { word: "lovely", partOfSpeech: "形容詞", meaning: "可愛的" },
    { word: "low", partOfSpeech: "形容詞／副詞", meaning: "低的／低地" },
    { word: "lucky", partOfSpeech: "形容詞", meaning: "幸運的" },
    { word: "lunch", partOfSpeech: "名詞", meaning: "午餐" },
    { word: "lack", partOfSpeech: "名詞／動詞", meaning: "缺乏／缺少" },
    { word: "lady", partOfSpeech: "名詞", meaning: "女士" },
    { word: "lamb", partOfSpeech: "名詞", meaning: "小羊" },
    { word: "lantern", partOfSpeech: "名詞", meaning: "提燈" },
    { word: "latest", partOfSpeech: "形容詞", meaning: "最新的" },
    { word: "latter", partOfSpeech: "形容詞／名詞", meaning: "後者的／後者" },
    { word: "law", partOfSpeech: "名詞", meaning: "法律" },
    { word: "lay", partOfSpeech: "動詞", meaning: "放置" },
    { word: "leaf", partOfSpeech: "名詞", meaning: "葉子" },
    { word: "lettuce", partOfSpeech: "名詞", meaning: "生菜" },
    { word: "lick", partOfSpeech: "動詞／名詞", meaning: "舔／舔的動作" },
    { word: "lid", partOfSpeech: "名詞", meaning: "蓋子" },
    { word: "lift", partOfSpeech: "動詞／名詞", meaning: "舉起／電梯" },
    { word: "lightning", partOfSpeech: "名詞", meaning: "閃電" },
    { word: "likely", partOfSpeech: "形容詞／副詞", meaning: "可能的／很可能地" },
    { word: "limit", partOfSpeech: "名詞／動詞", meaning: "限制／限定" },
    { word: "link", partOfSpeech: "名詞／動詞", meaning: "連接／關聯" },
    { word: "liquid", partOfSpeech: "名詞", meaning: "液體" },
    { word: "liter", partOfSpeech: "名詞", meaning: "公升" },
    { word: "loaf", partOfSpeech: "名詞", meaning: "麵包" },
    { word: "local", partOfSpeech: "形容詞／名詞", meaning: "當地的／當地人" },
    { word: "lock", partOfSpeech: "名詞／動詞", meaning: "鎖／鎖上" },
    { word: "locker", partOfSpeech: "名詞", meaning: "置物櫃" },
    { word: "loser", partOfSpeech: "名詞", meaning: "失敗者" },
    // M開頭
    { word: "machine", partOfSpeech: "名詞", meaning: "機器" },
    { word: "mad", partOfSpeech: "形容詞", meaning: "發瘋的" },
    { word: "magic", partOfSpeech: "名詞／形容詞", meaning: "魔法／神奇的" },
    { word: "mail", partOfSpeech: "名詞／動詞", meaning: "郵件／郵寄" },
    { word: "mailman （mail carrier）", partOfSpeech: "名詞", meaning: "郵遞員" },
    { word: "main", partOfSpeech: "形容詞", meaning: "主要的" },
    { word: "make", partOfSpeech: "動詞", meaning: "做" },
    { word: "man", partOfSpeech: "名詞", meaning: "男人" },
    { word: "many", partOfSpeech: "形容詞", meaning: "許多的" },
    { word: "map", partOfSpeech: "名詞", meaning: "地圖" },
    { word: "March", partOfSpeech: "名詞", meaning: "三月" },
    { word: "mark", partOfSpeech: "名詞／動詞", meaning: "標記／打分" },
    { word: "marker", partOfSpeech: "名詞", meaning: "標記筆" },
    { word: "market", partOfSpeech: "名詞", meaning: "市場" },
    { word: "married", partOfSpeech: "形容詞", meaning: "已婚的" },
    { word: "mask", partOfSpeech: "名詞", meaning: "面具" },
    { word: "math（mathematics）", partOfSpeech: "名詞", meaning: "數學" },
    { word: "matter", partOfSpeech: "名詞／動詞", meaning: "事情／要緊" },
    { word: "may （might）", partOfSpeech: "情態動詞", meaning: "可能／也許" },
    { word: "May", partOfSpeech: "名詞", meaning: "五月" },
    { word: "maybe", partOfSpeech: "副詞", meaning: "或許" },
    { word: "meal", partOfSpeech: "名詞", meaning: "餐" },
    { word: "mean", partOfSpeech: "動詞／形容詞", meaning: "意味／卑鄙的" },
    { word: "meat", partOfSpeech: "名詞", meaning: "肉" },
    { word: "medicine", partOfSpeech: "名詞", meaning: "藥品" },
    { word: "medium", partOfSpeech: "名詞／形容詞", meaning: "媒介／中等的" },
    { word: "meet", partOfSpeech: "動詞", meaning: "遇見" },
    { word: "meeting", partOfSpeech: "名詞", meaning: "會議" },
    { word: "member", partOfSpeech: "名詞", meaning: "成員" },
    { word: "menu", partOfSpeech: "名詞", meaning: "菜單" },
    { word: "metro", partOfSpeech: "名詞", meaning: "捷運" },
    { word: "middle", partOfSpeech: "名詞／形容詞", meaning: "中間／中間的" },
    { word: "mile", partOfSpeech: "名詞", meaning: "英里" },
    { word: "milk", partOfSpeech: "名詞／動詞", meaning: "牛奶／擠奶" },
    { word: "million", partOfSpeech: "名詞／數詞", meaning: "百萬" },
    { word: "mind", partOfSpeech: "名詞／動詞", meaning: "心智／介意" },
    { word: "minute", partOfSpeech: "名詞", meaning: "分鐘" },
    { word: "Miss", partOfSpeech: "名詞", meaning: "小姐" },
    { word: "miss", partOfSpeech: "動詞／名詞", meaning: "想念／錯過" },
    { word: "mistake", partOfSpeech: "名詞／動詞", meaning: "錯誤／犯錯" },
    { word: "modern", partOfSpeech: "形容詞", meaning: "現代的" },
    { word: "moment", partOfSpeech: "名詞", meaning: "瞬間" },
    { word: "Monday", partOfSpeech: "名詞", meaning: "星期一" },
    { word: "money", partOfSpeech: "名詞", meaning: "錢" },
    { word: "monkey", partOfSpeech: "名詞", meaning: "猴子" },
    { word: "month", partOfSpeech: "名詞", meaning: "月份" },
    { word: "moon", partOfSpeech: "名詞", meaning: "月亮" },
    { word: "more", partOfSpeech: "副詞／形容詞", meaning: "更多／更多的" },
    { word: "morning", partOfSpeech: "名詞", meaning: "早晨" },
    { word: "mop", partOfSpeech: "名詞／動詞", meaning: "拖把／拖地" },
    { word: "most", partOfSpeech: "副詞／形容詞", meaning: "最／大多數的" },
    { word: "mother（mom, mommy）", partOfSpeech: "名詞", meaning: "母親" },
    { word: "motorcycle", partOfSpeech: "名詞", meaning: "摩托車" },
    { word: "mountain", partOfSpeech: "名詞", meaning: "山" },
    { word: "mouse", partOfSpeech: "名詞", meaning: "老鼠" },
    { word: "mouth", partOfSpeech: "名詞", meaning: "嘴巴" },
    { word: "move", partOfSpeech: "動詞／名詞", meaning: "移動／舉動" },
    { word: "movie", partOfSpeech: "名詞", meaning: "電影" },
    { word: "Mr.", partOfSpeech: "縮寫", meaning: "先生" },
    { word: "Mrs.", partOfSpeech: "縮寫", meaning: "女士" },
    { word: "Ms.", partOfSpeech: "縮寫", meaning: "小姐" },
    { word: "much", partOfSpeech: "副詞／形容詞", meaning: "多／許多的" },
    { word: "mud", partOfSpeech: "名詞", meaning: "泥巴" },
    { word: "museum", partOfSpeech: "名詞", meaning: "博物館" },
    { word: "music", partOfSpeech: "名詞", meaning: "音樂" },
    { word: "must", partOfSpeech: "助動詞", meaning: "必須" },
    { word: "ma'am", partOfSpeech: "名詞", meaning: "女士（對女性的尊稱）" },
    { word: "magazine", partOfSpeech: "名詞", meaning: "雜誌" },
    { word: "magician", partOfSpeech: "名詞", meaning: "魔術師" },
    { word: "major", partOfSpeech: "形容詞／名詞", meaning: "主要的／主修" },
    { word: "male", partOfSpeech: "形容詞／名詞", meaning: "男性的／男人" },
    { word: "mall", partOfSpeech: "名詞", meaning: "購物中心" },
    { word: "manager", partOfSpeech: "名詞", meaning: "經理" },
    { word: "mango", partOfSpeech: "名詞", meaning: "芒果" },
    { word: "manner", partOfSpeech: "名詞", meaning: "態度／方式" },
    { word: "marry", partOfSpeech: "動詞", meaning: "結婚" },
    { word: "marvelous", partOfSpeech: "形容詞", meaning: "不可思議的" },
    { word: "mass", partOfSpeech: "名詞", meaning: "大量" },
    { word: "master", partOfSpeech: "名詞／動詞", meaning: "主人／精通" },
    { word: "mat", partOfSpeech: "名詞", meaning: "墊子" },
    { word: "match", partOfSpeech: "名詞／動詞", meaning: "比賽／匹配" },
    { word: "maximum", partOfSpeech: "形容詞／名詞", meaning: "最大的／極限" },
    { word: "meaning", partOfSpeech: "名詞", meaning: "意義" },
    { word: "measure", partOfSpeech: "動詞／名詞", meaning: "測量／措施" },
    { word: "mechanic", partOfSpeech: "名詞", meaning: "技工" },
    { word: "memory", partOfSpeech: "名詞", meaning: "記憶" },
    { word: "men's room", partOfSpeech: "名詞", meaning: "男洗手間" },
    { word: "message", partOfSpeech: "名詞", meaning: "訊息" },
    { word: "metal", partOfSpeech: "名詞", meaning: "金屬" },
    { word: "meter", partOfSpeech: "名詞", meaning: "公尺" },
    { word: "method", partOfSpeech: "名詞", meaning: "方法" },
    { word: "microwave", partOfSpeech: "名詞", meaning: "微波爐" },
    { word: "midnight", partOfSpeech: "名詞", meaning: "半夜" },
    { word: "minor", partOfSpeech: "形容詞／名詞", meaning: "次要的／未成年者" },
    { word: "minus", partOfSpeech: "副詞／形容詞／名詞", meaning: "減／負的／負號" },
    { word: "mirror", partOfSpeech: "名詞", meaning: "鏡子" },
    { word: "mix", partOfSpeech: "動詞／名詞", meaning: "混合／混合物" },
    { word: "model", partOfSpeech: "名詞／動詞", meaning: "模型／模仿" },
    { word: "monster", partOfSpeech: "名詞", meaning: "怪物" },
    { word: "mosquito", partOfSpeech: "名詞", meaning: "蚊子" },
    { word: "motion", partOfSpeech: "名詞", meaning: "運動" },
    { word: "movement", partOfSpeech: "名詞", meaning: "運動" },
    { word: "MRT", partOfSpeech: "名詞", meaning: "捷運（Mass Rapid Transit）" },
    { word: "musician", partOfSpeech: "名詞", meaning: "音樂家" },
    // N開頭
    { word: "nail", partOfSpeech: "名詞／動詞", meaning: "釘子／釘牢" },
    { word: "name", partOfSpeech: "名詞／動詞", meaning: "名字／命名" },
    { word: "national", partOfSpeech: "形容詞", meaning: "國家的" },
    { word: "nature", partOfSpeech: "名詞", meaning: "自然" },
    { word: "near", partOfSpeech: "形容詞／副詞／介詞", meaning: "近的／接近／靠近" },
    { word: "neck", partOfSpeech: "名詞", meaning: "脖子" },
    { word: "need", partOfSpeech: "名詞／動詞", meaning: "需要／需要" },
    { word: "neighbor", partOfSpeech: "名詞／動詞", meaning: "鄰居／與⋯為鄰居" },
    { word: "never", partOfSpeech: "副詞", meaning: "從不" },
    { word: "new", partOfSpeech: "形容詞", meaning: "新的" },
    { word: "news", partOfSpeech: "名詞", meaning: "新聞" },
    { word: "newspaper", partOfSpeech: "名詞", meaning: "報紙" },
    { word: "next", partOfSpeech: "形容詞／副詞／名詞／動詞", meaning: "下一個／然後／近來／接近" },
    { word: "nice", partOfSpeech: "形容詞", meaning: "好的" },
    { word: "night", partOfSpeech: "名詞", meaning: "夜晚" },
    { word: "nine", partOfSpeech: "數詞", meaning: "九" },
    { word: "nineteen", partOfSpeech: "數詞", meaning: "十九" },
    { word: "ninety", partOfSpeech: "數詞", meaning: "九十" },
    { word: "no", partOfSpeech: "副詞", meaning: "不" },
    { word: "nobody", partOfSpeech: "名詞", meaning: "沒有人" },
    { word: "noise", partOfSpeech: "名詞", meaning: "噪音" },
    { word: "noisy", partOfSpeech: "形容詞", meaning: "吵雜的" },
    { word: "noodle", partOfSpeech: "名詞", meaning: "麵條" },
    { word: "noon", partOfSpeech: "名詞", meaning: "中午" },
    { word: "north", partOfSpeech: "名詞／形容詞／副詞", meaning: "北方／北的／向北" },
    { word: "nose", partOfSpeech: "名詞", meaning: "鼻子" },
    { word: "not", partOfSpeech: "副詞", meaning: "不" },
    { word: "note", partOfSpeech: "名詞／動詞", meaning: "筆記／注意" },
    { word: "notebook", partOfSpeech: "名詞", meaning: "筆記本" },
    { word: "nothing", partOfSpeech: "代名詞", meaning: "沒有東西" },
    { word: "notice", partOfSpeech: "名詞／動詞", meaning: "注意／注意到" },
    { word: "November", partOfSpeech: "名詞", meaning: "十一月" },
    { word: "now", partOfSpeech: "副詞", meaning: "現在" },
    { word: "number", partOfSpeech: "名詞／動詞", meaning: "數字／編號" },
    { word: "nurse", partOfSpeech: "名詞／動詞", meaning: "護士／看護" },
    { word: "napkin", partOfSpeech: "名詞", meaning: "餐巾" },
    { word: "narrow", partOfSpeech: "形容詞／動詞", meaning: "狹窄的／使變窄" },
    { word: "nation", partOfSpeech: "名詞", meaning: "國家" },
    { word: "natural", partOfSpeech: "形容詞", meaning: "自然的" },
    { word: "naughty", partOfSpeech: "形容詞", meaning: "調皮的" },
    { word: "nearly", partOfSpeech: "副詞", meaning: "幾乎" },
    { word: "necessary", partOfSpeech: "形容詞", meaning: "必要的" },
    { word: "necklace", partOfSpeech: "名詞", meaning: "項鍊" },
    { word: "needle", partOfSpeech: "名詞／動詞", meaning: "針／用針縫補" },
    { word: "negative", partOfSpeech: "形容詞／名詞", meaning: "否定的／負數" },
    { word: "neither", partOfSpeech: "代名詞／連接詞", meaning: "兩者都不／也不" },
    { word: "nephew", partOfSpeech: "名詞", meaning: "侄子" },
    { word: "nervous", partOfSpeech: "形容詞", meaning: "緊張的" },
    { word: "nest", partOfSpeech: "名詞／動詞", meaning: "巢／築巢" },
    { word: "net", partOfSpeech: "名詞／動詞", meaning: "網／捕捉" },
    { word: "nice-looking", partOfSpeech: "形容詞", meaning: "好看的" },
    { word: "niece", partOfSpeech: "名詞", meaning: "侄女" },
    { word: "nod", partOfSpeech: "動詞／名詞", meaning: "點頭／點頭示意" },
    { word: "none", partOfSpeech: "代名詞", meaning: "沒有" },
    { word: "nor", partOfSpeech: "連接詞", meaning: "也不" },
    { word: "novel", partOfSpeech: "名詞", meaning: "小說" },
    { word: "nut", partOfSpeech: "名詞", meaning: "堅果" },
    // O開頭
    { word: "o'clock", partOfSpeech: "名詞", meaning: "鐘頭" },
    { word: "October", partOfSpeech: "名詞", meaning: "十月" },
    { word: "of", partOfSpeech: "介詞", meaning: "⋯的" },
    { word: "off", partOfSpeech: "副詞／介詞／動詞", meaning: "關／離開／關掉" },
    { word: "office", partOfSpeech: "名詞", meaning: "辦公室" },
    { word: "officer", partOfSpeech: "名詞", meaning: "軍官／警官" },
    { word: "often", partOfSpeech: "副詞", meaning: "經常" },
    { word: "oil", partOfSpeech: "名詞", meaning: "油" },
    { word: "OK", partOfSpeech: "縮寫", meaning: "好的" },
    { word: "old", partOfSpeech: "形容詞", meaning: "老的" },
    { word: "on", partOfSpeech: "介詞", meaning: "在" },
    { word: "once", partOfSpeech: "副詞", meaning: "一次" },
    { word: "one", partOfSpeech: "代名詞／數詞", meaning: "一／一個" },
    { word: "only", partOfSpeech: "副詞", meaning: "僅僅" },
    { word: "open", partOfSpeech: "動詞／形容詞", meaning: "開／開放" },
    { word: "or", partOfSpeech: "連接詞", meaning: "或者" },
    { word: "orange", partOfSpeech: "形容詞／名詞", meaning: "橙色的／橙子" },
    { word: "order", partOfSpeech: "名詞／動詞", meaning: "命令／訂購" },
    { word: "other", partOfSpeech: "形容詞／代名詞", meaning: "其他的／別的" },
    { word: "out", partOfSpeech: "副詞／介詞／形容詞", meaning: "外面／出去／盡" },
    { word: "outside", partOfSpeech: "副詞／介詞／名詞", meaning: "外面／在外面／外部" },
    { word: "over", partOfSpeech: "副詞／介詞", meaning: "結束／超過／在⋯之上" },
    { word: "own", partOfSpeech: "動詞／形容詞", meaning: "擁有／自己的" },
    { word: "obey", partOfSpeech: "動詞", meaning: "遵守" },
    { word: "object", partOfSpeech: "名詞／動詞", meaning: "物體／反對" },
    { word: "ocean", partOfSpeech: "名詞", meaning: "海洋" },
    { word: "offer", partOfSpeech: "動詞／名詞", meaning: "提供／提議" },
    { word: "omit", partOfSpeech: "動詞", meaning: "省略" },
    { word: "oneself", partOfSpeech: "代名詞", meaning: "自己" },
    { word: "onion", partOfSpeech: "名詞", meaning: "洋蔥" },
    { word: "operation", partOfSpeech: "名詞", meaning: "運作" },
    { word: "opinion", partOfSpeech: "名詞", meaning: "意見" },
    { word: "ordinary", partOfSpeech: "形容詞", meaning: "普通的" },
    { word: "oven", partOfSpeech: "名詞", meaning: "烤箱" },
    { word: "overpass", partOfSpeech: "名詞", meaning: "天橋" },
    { word: "overseas", partOfSpeech: "形容詞／副詞", meaning: "海外的／到國外" },
    { word: "over-weight", partOfSpeech: "形容詞", meaning: "超重的" },
    { word: "owner", partOfSpeech: "名詞", meaning: "擁有者" },
    { word: "ox", partOfSpeech: "名詞", meaning: "公牛" },
    // P開頭
    { word: "p.m.", partOfSpeech: "名詞", meaning: "下午" },
    { word: "pack", partOfSpeech: "動詞／名詞", meaning: "打包／包裹" },
    { word: "package", partOfSpeech: "名詞／動詞", meaning: "包裹／打包" },
    { word: "page", partOfSpeech: "名詞", meaning: "頁面" },
    { word: "paint", partOfSpeech: "動詞／名詞", meaning: "繪畫／顏料" },
    { word: "pair", partOfSpeech: "名詞", meaning: "一對" },
    { word: "pants", partOfSpeech: "名詞", meaning: "褲子" },
    { word: "papaya", partOfSpeech: "名詞", meaning: "木瓜" },
    { word: "paper", partOfSpeech: "名詞", meaning: "紙" },
    { word: "parent", partOfSpeech: "名詞", meaning: "父母" },
    { word: "park", partOfSpeech: "名詞／動詞", meaning: "公園／停車" },
    { word: "part", partOfSpeech: "名詞／動詞", meaning: "部分／分開" },
    { word: "party", partOfSpeech: "名詞", meaning: "派對" },
    { word: "pass", partOfSpeech: "動詞／名詞", meaning: "通過／通行證" },
    { word: "past", partOfSpeech: "形容詞／副詞／名詞", meaning: "過去的／過去／過去" },
    { word: "paste", partOfSpeech: "名詞／動詞", meaning: "膠漿／黏貼" },
    { word: "pay", partOfSpeech: "動詞", meaning: "付款" },
    { word: "PE（physical education）", partOfSpeech: "名詞", meaning: "體育" },
    { word: "peach", partOfSpeech: "名詞", meaning: "桃子" },
    { word: "pear", partOfSpeech: "名詞", meaning: "梨" },
    { word: "pen", partOfSpeech: "名詞", meaning: "筆" },
    { word: "pencil", partOfSpeech: "名詞", meaning: "鉛筆" },
    { word: "people", partOfSpeech: "名詞", meaning: "人們" },
    { word: "perhaps", partOfSpeech: "副詞", meaning: "或許" },
    { word: "person", partOfSpeech: "名詞", meaning: "人" },
    { word: "pet", partOfSpeech: "名詞／動詞", meaning: "寵物／撫摸" },
    { word: "photo", partOfSpeech: "名詞", meaning: "照片" },
    { word: "piano", partOfSpeech: "名詞", meaning: "鋼琴" },
    { word: "pick", partOfSpeech: "動詞", meaning: "選擇" },
    { word: "picnic", partOfSpeech: "名詞", meaning: "野餐" },
    { word: "picture", partOfSpeech: "名詞／動詞", meaning: "圖片／描繪" },
    { word: "pie", partOfSpeech: "名詞", meaning: "派" },
    { word: "piece", partOfSpeech: "名詞", meaning: "一塊" },
    { word: "pig", partOfSpeech: "名詞", meaning: "豬" },
    { word: "pin", partOfSpeech: "名詞／動詞", meaning: "針／別住" },
    { word: "pink", partOfSpeech: "形容詞／名詞", meaning: "粉紅色的／粉紅色" },
    { word: "pipe", partOfSpeech: "名詞／動詞", meaning: "管子／吸煙" },
    { word: "pizza", partOfSpeech: "名詞", meaning: "披薩" },
    { word: "place", partOfSpeech: "名詞／動詞", meaning: "地方／放置" },
    { word: "plan", partOfSpeech: "名詞／動詞", meaning: "計劃／計劃" },
    { word: "planet", partOfSpeech: "名詞", meaning: "行星" },
    { word: "plant", partOfSpeech: "名詞／動詞", meaning: "植物／種植" },
    { word: "plate", partOfSpeech: "名詞", meaning: "盤子" },
    { word: "play", partOfSpeech: "動詞／名詞", meaning: "玩耍／戲劇" },
    { word: "player", partOfSpeech: "名詞", meaning: "玩家" },
    { word: "playground", partOfSpeech: "名詞", meaning: "遊樂場" },
    { word: "please", partOfSpeech: "動詞", meaning: "請" },
    { word: "pleasure", partOfSpeech: "名詞", meaning: "樂趣" },
    { word: "pocket", partOfSpeech: "名詞", meaning: "口袋" },
    { word: "point", partOfSpeech: "名詞／動詞", meaning: "點／指出" },
    { word: "police", partOfSpeech: "名詞／動詞", meaning: "警察／監督" },
    { word: "polite", partOfSpeech: "形容詞", meaning: "有禮貌的" },
    { word: "pond", partOfSpeech: "名詞", meaning: "池塘" },
    { word: "pool", partOfSpeech: "名詞／動詞", meaning: "池／聚集" },
    { word: "poor", partOfSpeech: "形容詞", meaning: "貧窮的" },
    { word: "pop", partOfSpeech: "動詞／名詞", meaning: "彈出／流行音樂" },
    { word: "popcorn", partOfSpeech: "名詞", meaning: "爆米花" },
    { word: "popular", partOfSpeech: "形容詞", meaning: "流行的" },
    { word: "pork", partOfSpeech: "名詞", meaning: "豬肉" },
    { word: "possible", partOfSpeech: "形容詞", meaning: "可能的" },
    { word: "post office", partOfSpeech: "名詞", meaning: "郵局" },
    { word: "postcard", partOfSpeech: "名詞", meaning: "明信片" },
    { word: "pot", partOfSpeech: "名詞", meaning: "鍋" },
    { word: "pound", partOfSpeech: "名詞／動詞", meaning: "磅／捣碎" },
    { word: "power", partOfSpeech: "名詞", meaning: "力量" },
    { word: "probably", partOfSpeech: "副詞", meaning: "可能" },
    { word: "practice", partOfSpeech: "名詞／動詞", meaning: "練習／實踐" },
    { word: "pray", partOfSpeech: "動詞", meaning: "祈禱" },
    { word: "prepare", partOfSpeech: "動詞", meaning: "準備" },
    { word: "present", partOfSpeech: "形容詞／名詞／動詞", meaning: "現在的／禮物／呈現" },
    { word: "pretty", partOfSpeech: "形容詞", meaning: "漂亮的" },
    { word: "price", partOfSpeech: "名詞／動詞", meaning: "價格／定價" },
    { word: "prize", partOfSpeech: "名詞／動詞", meaning: "獎品／獲得" },
    { word: "problem", partOfSpeech: "名詞", meaning: "問題" },
    { word: "program", partOfSpeech: "名詞／動詞", meaning: "程式／安排" },
    { word: "proud", partOfSpeech: "形容詞", meaning: "自豪的" },
    { word: "public", partOfSpeech: "形容詞／名詞", meaning: "公共的／公眾" },
    { word: "pull", partOfSpeech: "動詞／名詞", meaning: "拉／拉力" },
    { word: "pumpkin", partOfSpeech: "名詞", meaning: "南瓜" },
    { word: "puppy", partOfSpeech: "名詞", meaning: "小狗" },
    { word: "purple", partOfSpeech: "形容詞", meaning: "紫色的" },
    { word: "push", partOfSpeech: "動詞／名詞", meaning: "推／推動" },
    { word: "put", partOfSpeech: "動詞", meaning: "放置" },
    { word: "pain", partOfSpeech: "名詞", meaning: "疼痛" },
    { word: "painful", partOfSpeech: "形容詞", meaning: "疼痛的" },
    { word: "painter", partOfSpeech: "名詞", meaning: "畫家" },
    { word: "pajamas", partOfSpeech: "名詞", meaning: "睡衣" },
    { word: "pale", partOfSpeech: "形容詞", meaning: "蒼白的" },
    { word: "pan", partOfSpeech: "名詞", meaning: "平底鍋" },
    { word: "panda", partOfSpeech: "名詞", meaning: "熊貓" },
    { word: "pardon", partOfSpeech: "動詞／名詞", meaning: "原諒／寬恕" },
    { word: "parking lot", partOfSpeech: "名詞", meaning: "停車場" },
    { word: "parrot", partOfSpeech: "名詞", meaning: "鸚鵡" },
    { word: "partner", partOfSpeech: "名詞", meaning: "夥伴" },
    { word: "passenger", partOfSpeech: "名詞", meaning: "乘客" },
    { word: "path", partOfSpeech: "名詞", meaning: "路徑" },
    { word: "patient", partOfSpeech: "名詞／形容詞", meaning: "病人／耐心" },
    { word: "pattern", partOfSpeech: "名詞", meaning: "圖案" },
    { word: "pause", partOfSpeech: "名詞／動詞", meaning: "暫停／停頓" },
    { word: "peace", partOfSpeech: "名詞", meaning: "和平" },
    { word: "peaceful", partOfSpeech: "形容詞", meaning: "和平的" },
    { word: "pepper", partOfSpeech: "名詞／動詞", meaning: "胡椒／加胡椒" },
    { word: "perfect", partOfSpeech: "形容詞", meaning: "完美的" },
    { word: "period", partOfSpeech: "名詞", meaning: "期間" },
    { word: "personal", partOfSpeech: "形容詞", meaning: "個人的" },
    { word: "physics", partOfSpeech: "名詞", meaning: "物理學" },
    { word: "pigeon", partOfSpeech: "名詞", meaning: "鴿子" },
    { word: "pile", partOfSpeech: "名詞／動詞", meaning: "堆／堆積" },
    { word: "pillow", partOfSpeech: "名詞", meaning: "枕頭" },
    { word: "pineapple", partOfSpeech: "名詞", meaning: "鳳梨" },
    { word: "plain", partOfSpeech: "形容詞", meaning: "普通的" },
    { word: "platform", partOfSpeech: "名詞", meaning: "平臺" },
    { word: "pleasant", partOfSpeech: "形容詞", meaning: "愉快的" },
    { word: "pleased", partOfSpeech: "形容詞", meaning: "高興的" },
    { word: "plus", partOfSpeech: "連接詞／副詞", meaning: "加／另外" },
    { word: "poem", partOfSpeech: "名詞", meaning: "詩" },
    { word: "poison", partOfSpeech: "名詞／動詞", meaning: "毒藥／毒害" },
    { word: "pollute", partOfSpeech: "動詞", meaning: "污染" },
    { word: "pollution", partOfSpeech: "名詞", meaning: "污染" },
    { word: "pop music", partOfSpeech: "名詞", meaning: "流行音樂" },
    { word: "population", partOfSpeech: "名詞", meaning: "人口" },
    { word: "position", partOfSpeech: "名詞／動詞", meaning: "位置／安置" },
    { word: "positive", partOfSpeech: "形容詞", meaning: "正面的" },
    { word: "potato", partOfSpeech: "名詞", meaning: "馬鈴薯" },
    { word: "powder", partOfSpeech: "名詞", meaning: "粉末" },
    { word: "praise", partOfSpeech: "名詞／動詞", meaning: "讚美／讚揚" },
    { word: "precious", partOfSpeech: "形容詞", meaning: "珍貴的" },
    { word: "president", partOfSpeech: "名詞", meaning: "總統" },
    { word: "pressure", partOfSpeech: "名詞", meaning: "壓力" },
    { word: "priest", partOfSpeech: "名詞", meaning: "牧師" },
    { word: "primary", partOfSpeech: "形容詞／名詞", meaning: "初級的／首要的" },
    { word: "prince", partOfSpeech: "名詞", meaning: "王子" },
    { word: "princess", partOfSpeech: "名詞", meaning: "公主" },
    { word: "principal", partOfSpeech: "名詞／形容詞", meaning: "校長／主要的" },
    { word: "principle", partOfSpeech: "名詞", meaning: "原則" },
    { word: "print", partOfSpeech: "動詞／名詞", meaning: "印刷／印刷品" },
    { word: "printer", partOfSpeech: "名詞", meaning: "印表機" },
    { word: "private", partOfSpeech: "形容詞", meaning: "私人的" },
    { word: "produce", partOfSpeech: "動詞／名詞", meaning: "生產／產品" },
    { word: "production", partOfSpeech: "名詞", meaning: "生產" },
    { word: "professor", partOfSpeech: "名詞", meaning: "教授" },
    { word: "progress", partOfSpeech: "名詞／動詞", meaning: "進步／進行" },
    { word: "project", partOfSpeech: "名詞／動詞", meaning: "專案／投射" },
    { word: "promise", partOfSpeech: "名詞／動詞", meaning: "承諾／允諾" },
    { word: "pronounce", partOfSpeech: "動詞", meaning: "發音" },
    { word: "protect", partOfSpeech: "動詞", meaning: "保護" },
    { word: "provide", partOfSpeech: "動詞", meaning: "提供" },
    { word: "pump", partOfSpeech: "名詞／動詞", meaning: "泵／抽水" },
    { word: "punish", partOfSpeech: "動詞", meaning: "懲罰" },
    { word: "purpose", partOfSpeech: "名詞", meaning: "目的" },
    { word: "purse", partOfSpeech: "名詞／動詞", meaning: "錢包／追究" },
    { word: "puzzle", partOfSpeech: "名詞／動詞", meaning: "拼圖／困惑" },
    // Q開頭
    { word: "quarter", partOfSpeech: "名詞", meaning: "四分之一" },
    { word: "queen", partOfSpeech: "名詞", meaning: "皇后" },
    { word: "question", partOfSpeech: "名詞／動詞", meaning: "問題／質疑" },
    { word: "quick", partOfSpeech: "形容詞", meaning: "快速的" },
    { word: "quiet", partOfSpeech: "形容詞／動詞", meaning: "安靜的／使安靜" },
    { word: "quite", partOfSpeech: "副詞", meaning: "相當" },
    { word: "quiz", partOfSpeech: "名詞／動詞", meaning: "測驗／詢問" },
    { word: "quit", partOfSpeech: "動詞", meaning: "放棄" },
    // R開頭
    { word: "rabbit", partOfSpeech: "名詞", meaning: "兔子" },
    { word: "race", partOfSpeech: "名詞／動詞", meaning: "種族／比賽" },
    { word: "radio", partOfSpeech: "名詞", meaning: "收音機" },
    { word: "rain", partOfSpeech: "名詞／動詞", meaning: "雨／下雨" },
    { word: "rainbow", partOfSpeech: "名詞", meaning: "彩虹" },
    { word: "rainy", partOfSpeech: "形容詞", meaning: "下雨的" },
    { word: "raise", partOfSpeech: "動詞", meaning: "舉起" },
    { word: "rat", partOfSpeech: "名詞", meaning: "老鼠" },
    { word: "reach", partOfSpeech: "動詞／名詞", meaning: "達到／伸手" },
    { word: "read", partOfSpeech: "動詞", meaning: "讀" },
    { word: "ready", partOfSpeech: "形容詞", meaning: "準備好的" },
    { word: "real", partOfSpeech: "形容詞", meaning: "真實的" },
    { word: "really", partOfSpeech: "副詞", meaning: "真的" },
    { word: "reason", partOfSpeech: "名詞／動詞", meaning: "理由／推理" },
    { word: "red", partOfSpeech: "形容詞", meaning: "紅色的" },
    { word: "refrigerator", partOfSpeech: "名詞", meaning: "冰箱" },
    { word: "relative", partOfSpeech: "名詞／形容詞", meaning: "親戚／相對的" },
    { word: "remember", partOfSpeech: "動詞", meaning: "記得" },
    { word: "repeat", partOfSpeech: "動詞", meaning: "重複" },
    { word: "report", partOfSpeech: "名詞／動詞", meaning: "報告／報導" },
    { word: "reporter", partOfSpeech: "名詞", meaning: "報導員" },
    { word: "rest", partOfSpeech: "名詞／動詞", meaning: "休息／其餘部分" },
    { word: "restaurant", partOfSpeech: "名詞", meaning: "餐廳" },
    { word: "restroom", partOfSpeech: "名詞", meaning: "廁所" },
    { word: "rice", partOfSpeech: "名詞", meaning: "米飯" },
    { word: "rich", partOfSpeech: "形容詞", meaning: "富有的" },
    { word: "ride", partOfSpeech: "動詞／名詞", meaning: "騎／乘坐" },
    { word: "right", partOfSpeech: "形容詞／名詞", meaning: "正確的／權利" },
    { word: "ring", partOfSpeech: "名詞／動詞", meaning: "戒指／鳴響" },
    { word: "rise", partOfSpeech: "動詞", meaning: "上升" },
    { word: "river", partOfSpeech: "名詞", meaning: "河流" },
    { word: "road", partOfSpeech: "名詞", meaning: "道路" },
    { word: "robot", partOfSpeech: "名詞", meaning: "機器人" },
    { word: "R.O.C.／ROC", partOfSpeech: "縮寫", meaning: "中華民國" },
    { word: "rock", partOfSpeech: "名詞／動詞", meaning: "岩石／搖擺" },
    { word: "roll", partOfSpeech: "動詞／名詞", meaning: "滾動／捲起" },
    { word: "room", partOfSpeech: "名詞", meaning: "房間" },
    { word: "root", partOfSpeech: "名詞／動詞", meaning: "根／生根" },
    { word: "rope", partOfSpeech: "名詞", meaning: "繩子" },
    { word: "rose", partOfSpeech: "名詞／動詞", meaning: "玫瑰／上升" },
    { word: "round", partOfSpeech: "形容詞／名詞／動詞", meaning: "圓的／一圈／旋轉" },
    { word: "row", partOfSpeech: "名詞／動詞", meaning: "行／划船" },
    { word: "rule", partOfSpeech: "名詞／動詞", meaning: "規則／統治" },
    { word: "ruler", partOfSpeech: "名詞", meaning: "尺子" },
    { word: "run", partOfSpeech: "動詞／名詞", meaning: "跑／奔跑" },
    { word: "railroad", partOfSpeech: "名詞", meaning: "鐵路" },
    { word: "railway", partOfSpeech: "名詞", meaning: "鐵路" },
    { word: "raincoat", partOfSpeech: "名詞", meaning: "雨衣" },
    { word: "rare", partOfSpeech: "形容詞", meaning: "稀有的" },
    { word: "rather", partOfSpeech: "副詞", meaning: "寧願" },
    { word: "realize", partOfSpeech: "動詞", meaning: "實現" },
    { word: "receive", partOfSpeech: "動詞", meaning: "收到" },
    { word: "record", partOfSpeech: "名詞／動詞", meaning: "紀錄／錄音" },
    { word: "recover", partOfSpeech: "動詞", meaning: "恢復" },
    { word: "rectangle", partOfSpeech: "名詞", meaning: "長方形" },
    { word: "recycle", partOfSpeech: "動詞", meaning: "回收" },
    { word: "refuse", partOfSpeech: "動詞／名詞", meaning: "拒絕／廢物" },
    { word: "regret", partOfSpeech: "動詞", meaning: "後悔" },
    { word: "regular", partOfSpeech: "形容詞", meaning: "規則的" },
    { word: "reject", partOfSpeech: "動詞", meaning: "拒絕" },
    { word: "remind", partOfSpeech: "動詞", meaning: "提醒" },
    { word: "rent", partOfSpeech: "動詞／名詞", meaning: "租借／租金" },
    { word: "repair", partOfSpeech: "動詞／名詞", meaning: "修理／修理" },
    { word: "respect", partOfSpeech: "動詞／名詞", meaning: "尊重／尊敬" },
    { word: "responsible", partOfSpeech: "形容詞", meaning: "負責的" },
    { word: "result", partOfSpeech: "名詞／動詞", meaning: "結果／導致" },
    { word: "return", partOfSpeech: "動詞／名詞", meaning: "返回／回報" },
    { word: "review", partOfSpeech: "動詞／名詞", meaning: "複查／評論" },
    { word: "revise", partOfSpeech: "動詞", meaning: "修改" },
    { word: "rob", partOfSpeech: "動詞", meaning: "搶劫" },
    { word: "role", partOfSpeech: "名詞", meaning: "角色" },
    { word: "roller skate（roller blade）", partOfSpeech: "名詞", meaning: "溜冰鞋" },
    { word: "roof", partOfSpeech: "名詞", meaning: "屋頂" },
    { word: "rub", partOfSpeech: "動詞", meaning: "擦拭" },
    { word: "rubber", partOfSpeech: "名詞", meaning: "橡膠" },
    { word: "rude", partOfSpeech: "形容詞", meaning: "粗魯的" },
    { word: "ruin", partOfSpeech: "動詞／名詞", meaning: "毀壞／廢墟" },
    { word: "rush", partOfSpeech: "動詞／名詞", meaning: "匆忙／衝刺" },
    // S開頭
    { word: "sad", partOfSpeech: "形容詞", meaning: "悲傷的" },
    { word: "safe", partOfSpeech: "形容詞", meaning: "安全的" },
    { word: "sail", partOfSpeech: "名詞／動詞", meaning: "帆／航行" },
    { word: "salad", partOfSpeech: "名詞", meaning: "沙拉" },
    { word: "sale", partOfSpeech: "名詞", meaning: "特價" },
    { word: "salesman", partOfSpeech: "名詞", meaning: "推銷員" },
    { word: "salt", partOfSpeech: "名詞", meaning: "鹽" },
    { word: "same", partOfSpeech: "形容詞", meaning: "相同的" },
    { word: "sandwich", partOfSpeech: "名詞", meaning: "三明治" },
    { word: "Saturday", partOfSpeech: "名詞", meaning: "星期六" },
    { word: "save", partOfSpeech: "動詞", meaning: "節省／拯救" },
    { word: "say", partOfSpeech: "動詞", meaning: "說" },
    { word: "scared", partOfSpeech: "形容詞", meaning: "害怕的" },
    { word: "school", partOfSpeech: "名詞", meaning: "學校" },
    { word: "science", partOfSpeech: "名詞", meaning: "科學" },
    { word: "scooter", partOfSpeech: "名詞", meaning: "滑板車" },
    { word: "screen", partOfSpeech: "名詞", meaning: "螢幕" },
    { word: "sea", partOfSpeech: "名詞", meaning: "海洋" },
    { word: "season", partOfSpeech: "名詞", meaning: "季節" },
    { word: "seat", partOfSpeech: "名詞", meaning: "座位" },
    { word: "second", partOfSpeech: "形容詞／名詞", meaning: "第二的／秒" },
    { word: "secretary", partOfSpeech: "名詞", meaning: "秘書" },
    { word: "see", partOfSpeech: "動詞", meaning: "看見" },
    { word: "seed", partOfSpeech: "名詞", meaning: "種子" },
    { word: "seesaw", partOfSpeech: "名詞", meaning: "蹺蹺板" },
    { word: "seldom", partOfSpeech: "副詞", meaning: "很少" },
    { word: "sell", partOfSpeech: "動詞", meaning: "賣" },
    { word: "send", partOfSpeech: "動詞", meaning: "發送" },
    { word: "senior high school", partOfSpeech: "名詞", meaning: "高中" },
    { word: "sentence", partOfSpeech: "名詞", meaning: "句子" },
    { word: "September", partOfSpeech: "名詞", meaning: "九月" },
    { word: "serious", partOfSpeech: "形容詞", meaning: "嚴重的" },
    { word: "service", partOfSpeech: "名詞", meaning: "服務" },
    { word: "set", partOfSpeech: "動詞", meaning: "設定／一組" },
    { word: "seven", partOfSpeech: "數詞", meaning: "七" },
    { word: "seventeen", partOfSpeech: "數詞", meaning: "十七" },
    { word: "seventy", partOfSpeech: "數詞", meaning: "七十" },
    { word: "several", partOfSpeech: "代詞", meaning: "幾個／好幾" },
    { word: "shake", partOfSpeech: "動詞", meaning: "搖動" },
    { word: "shape", partOfSpeech: "名詞／動詞", meaning: "形狀／塑造" },
    { word: "share", partOfSpeech: "動詞／名詞", meaning: "分享／份額" },
    { word: "sharp", partOfSpeech: "形容詞", meaning: "尖的／銳利的" },
    { word: "she", partOfSpeech: "代詞", meaning: "她" },
    { word: "sheep", partOfSpeech: "名詞", meaning: "綿羊" },
    { word: "shine", partOfSpeech: "動詞", meaning: "發光" },
    { word: "ship", partOfSpeech: "名詞／動詞", meaning: "船／運送" },
    { word: "shirt", partOfSpeech: "名詞", meaning: "襯衫" },
    { word: "shoe（shoes）", partOfSpeech: "名詞", meaning: "鞋子" },
    { word: "shop", partOfSpeech: "名詞／動詞", meaning: "商店／購物" },
    { word: "shopkeeper", partOfSpeech: "名詞", meaning: "店主" },
    { word: "short", partOfSpeech: "形容詞", meaning: "短的" },
    { word: "shorts", partOfSpeech: "名詞", meaning: "短褲" },
    { word: "should", partOfSpeech: "助動詞", meaning: "應該" },
    { word: "shoulder", partOfSpeech: "名詞", meaning: "肩膀" },
    { word: "shout", partOfSpeech: "動詞／名詞", meaning: "大喊／呼喊" },
    { word: "show", partOfSpeech: "動詞／名詞", meaning: "展示／節目" },
    { word: "shower", partOfSpeech: "名詞／動詞", meaning: "淋浴／下雨" },
    { word: "shy", partOfSpeech: "形容詞", meaning: "害羞的" },
    { word: "sick", partOfSpeech: "形容詞", meaning: "生病的" },
    { word: "side", partOfSpeech: "名詞", meaning: "邊／一面" },
    { word: "sidewalk", partOfSpeech: "名詞", meaning: "人行道" },
    { word: "sight", partOfSpeech: "名詞", meaning: "視力／景象" },
    { word: "sign", partOfSpeech: "名詞／動詞", meaning: "符號／簽名" },
    { word: "simple", partOfSpeech: "形容詞", meaning: "簡單的" },
    { word: "since", partOfSpeech: "介詞／副詞", meaning: "自從／以來" },
    { word: "sing", partOfSpeech: "動詞", meaning: "唱歌" },
    { word: "singer", partOfSpeech: "名詞", meaning: "歌手" },
    { word: "sir", partOfSpeech: "名詞", meaning: "先生" },
    { word: "sister", partOfSpeech: "名詞", meaning: "姐妹" },
    { word: "sit", partOfSpeech: "動詞", meaning: "坐下" },
    { word: "six", partOfSpeech: "數詞", meaning: "六" },
    { word: "sixteen", partOfSpeech: "數詞", meaning: "十六" },
    { word: "sixty", partOfSpeech: "數詞", meaning: "六十" },
    { word: "size", partOfSpeech: "名詞", meaning: "大小" },
    { word: "skirt", partOfSpeech: "名詞", meaning: "裙子" },
    { word: "sky", partOfSpeech: "名詞", meaning: "天空" },
    { word: "sleep", partOfSpeech: "動詞／名詞", meaning: "睡覺／睡眠" },
    { word: "slide", partOfSpeech: "動詞／名詞", meaning: "滑動／滑梯" },
    { word: "slim", partOfSpeech: "形容詞", meaning: "苗條的" },
    { word: "slow", partOfSpeech: "形容詞", meaning: "慢的" },
    { word: "small", partOfSpeech: "形容詞", meaning: "小的" },
    { word: "smart", partOfSpeech: "形容詞", meaning: "聰明的" },
    { word: "smell", partOfSpeech: "動詞／名詞", meaning: "聞／氣味" },
    { word: "smile", partOfSpeech: "動詞／名詞", meaning: "微笑／笑容" },
    { word: "smoke", partOfSpeech: "動詞／名詞", meaning: "抽煙／煙" },
    { word: "snack", partOfSpeech: "名詞", meaning: "點心" },
    { word: "snake", partOfSpeech: "名詞", meaning: "蛇" },
    { word: "snow", partOfSpeech: "名詞／動詞", meaning: "雪／下雪" },
    { word: "snowy", partOfSpeech: "形容詞", meaning: "下雪的" },
    { word: "so", partOfSpeech: "副詞", meaning: "如此／所以" },
    { word: "soccer", partOfSpeech: "名詞", meaning: "足球" },
    { word: "socks", partOfSpeech: "名詞", meaning: "襪子" },
    { word: "sofa", partOfSpeech: "名詞", meaning: "沙發" },
    { word: "soldier", partOfSpeech: "名詞", meaning: "士兵" },
    { word: "some", partOfSpeech: "限定詞", meaning: "一些／一點" },
    { word: "someone（somebody）", partOfSpeech: "代詞", meaning: "有人" },
    { word: "something", partOfSpeech: "代詞", meaning: "某事／某物" },
    { word: "sometimes", partOfSpeech: "副詞", meaning: "有時候" },
    { word: "somewhere", partOfSpeech: "副詞", meaning: "某處／到處" },
    { word: "son", partOfSpeech: "名詞", meaning: "兒子" },
    { word: "song", partOfSpeech: "名詞", meaning: "歌曲" },
    { word: "soon", partOfSpeech: "副詞", meaning: "不久" },
    { word: "sore", partOfSpeech: "形容詞", meaning: "疼痛的" },
    { word: "sorry", partOfSpeech: "形容詞", meaning: "對不起的" },
    { word: "sound", partOfSpeech: "名詞／動詞", meaning: "聲音／發出聲音" },
    { word: "soup", partOfSpeech: "名詞", meaning: "湯" },
    { word: "south", partOfSpeech: "名詞／形容詞", meaning: "南方／南方的" },
    { word: "space", partOfSpeech: "名詞", meaning: "空間" },
    { word: "speak", partOfSpeech: "動詞", meaning: "說話" },
    { word: "special", partOfSpeech: "形容詞", meaning: "特別的" },
    { word: "spell", partOfSpeech: "動詞／名詞", meaning: "拼寫／咒語" },
    { word: "spend", partOfSpeech: "動詞", meaning: "花費" },
    { word: "spider", partOfSpeech: "名詞", meaning: "蜘蛛" },
    { word: "spoon", partOfSpeech: "名詞", meaning: "湯匙" },
    { word: "sports", partOfSpeech: "名詞", meaning: "體育" },
    { word: "spring", partOfSpeech: "名詞／動詞", meaning: "春天／彈跳" },
    { word: "square", partOfSpeech: "名詞／形容詞", meaning: "正方形／方的" },
    { word: "stairs", partOfSpeech: "名詞", meaning: "樓梯" },
    { word: "stamp", partOfSpeech: "名詞／動詞", meaning: "郵票／蓋印" },
    { word: "stand", partOfSpeech: "動詞／名詞", meaning: "站立／檔案" },
    { word: "star", partOfSpeech: "名詞／動詞", meaning: "星星／主演" },
    { word: "start", partOfSpeech: "動詞／名詞", meaning: "開始／起點" },
    { word: "station", partOfSpeech: "名詞", meaning: "車站" },
    { word: "stay", partOfSpeech: "動詞", meaning: "停留" },
    { word: "steak", partOfSpeech: "名詞", meaning: "牛排" },
    { word: "still", partOfSpeech: "副詞／形容詞", meaning: "仍然／靜止的" },
    { word: "stomach", partOfSpeech: "名詞", meaning: "胃" },
    { word: "stop", partOfSpeech: "動詞／名詞", meaning: "停止／站" },
    { word: "store", partOfSpeech: "名詞／動詞", meaning: "商店／儲存" },
    { word: "story", partOfSpeech: "名詞", meaning: "故事" },
    { word: "straight", partOfSpeech: "形容詞／副詞", meaning: "直的／直接的" },
    { word: "strange", partOfSpeech: "形容詞", meaning: "奇怪的" },
    { word: "stranger", partOfSpeech: "名詞", meaning: "陌生人" },
    { word: "strawberry", partOfSpeech: "名詞", meaning: "草莓" },
    { word: "street", partOfSpeech: "名詞", meaning: "街道" },
    { word: "string", partOfSpeech: "名詞", meaning: "線／一串" },
    { word: "strong", partOfSpeech: "形容詞", meaning: "強壯的" },
    { word: "student", partOfSpeech: "名詞", meaning: "學生" },
    { word: "study", partOfSpeech: "動詞／名詞", meaning: "學習／研究" },
    { word: "stupid", partOfSpeech: "形容詞", meaning: "愚蠢的" },
    { word: "subject", partOfSpeech: "名詞", meaning: "主題／科目" },
    { word: "successful", partOfSpeech: "形容詞", meaning: "成功的" },
    { word: "sugar", partOfSpeech: "名詞", meaning: "糖" },
    { word: "summer", partOfSpeech: "名詞", meaning: "夏天" },
    { word: "sun", partOfSpeech: "名詞", meaning: "太陽" },
    { word: "Sunday", partOfSpeech: "名詞", meaning: "星期天" },
    { word: "sunny", partOfSpeech: "形容詞", meaning: "晴朗的" },
    { word: "supermarket", partOfSpeech: "名詞", meaning: "超市" },
    { word: "sure", partOfSpeech: "形容詞", meaning: "肯定的" },
    { word: "surf", partOfSpeech: "動詞／名詞", meaning: "衝浪／海浪" },
    { word: "surprise", partOfSpeech: "名詞／動詞", meaning: "驚喜／使驚訝" },
    { word: "surprised", partOfSpeech: "形容詞", meaning: "驚訝的" },
    { word: "sweater", partOfSpeech: "名詞", meaning: "毛衣" },
    { word: "sweet", partOfSpeech: "形容詞", meaning: "甜的" },
    { word: "swim", partOfSpeech: "動詞", meaning: "游泳" },
    { word: "swing", partOfSpeech: "動詞／名詞", meaning: "搖擺／鞦韆" },
    { word: "safety", partOfSpeech: "名詞", meaning: "安全" },
    { word: "sailor", partOfSpeech: "名詞", meaning: "水手" },
    { word: "sample", partOfSpeech: "名詞／動詞", meaning: "樣品／抽樣" },
    { word: "sand", partOfSpeech: "名詞", meaning: "沙子" },
    { word: "satisfy", partOfSpeech: "動詞", meaning: "使滿意" },
    { word: "saucer", partOfSpeech: "名詞", meaning: "茶碟" },
    { word: "scarf", partOfSpeech: "名詞", meaning: "圍巾" },
    { word: "scene", partOfSpeech: "名詞", meaning: "場景" },
    { word: "scenery", partOfSpeech: "名詞", meaning: "風景" },
    { word: "scientist", partOfSpeech: "名詞", meaning: "科學家" },
    { word: "score", partOfSpeech: "名詞／動詞", meaning: "分數／得分" },
    { word: "seafood", partOfSpeech: "名詞", meaning: "海鮮" },
    { word: "search", partOfSpeech: "動詞／名詞", meaning: "搜尋／搜查" },
    { word: "secondary", partOfSpeech: "形容詞", meaning: "次要的" },
    { word: "secret", partOfSpeech: "名詞／形容詞", meaning: "秘密／秘密的" },
    { word: "section", partOfSpeech: "名詞", meaning: "部分" },
    { word: "seek", partOfSpeech: "動詞", meaning: "尋找" },
    { word: "seem", partOfSpeech: "動詞", meaning: "似乎" },
    { word: "select", partOfSpeech: "動詞", meaning: "選擇" },
    { word: "selfish", partOfSpeech: "形容詞", meaning: "自私的" },
    { word: "semester", partOfSpeech: "名詞", meaning: "學期" },
    { word: "sense", partOfSpeech: "名詞／動詞", meaning: "感覺／感知" },
    { word: "servant", partOfSpeech: "名詞", meaning: "僕人" },
    { word: "serve", partOfSpeech: "動詞", meaning: "服務" },
    { word: "shall", partOfSpeech: "助動詞", meaning: "應該／將" },
    { word: "shark", partOfSpeech: "名詞", meaning: "鯊魚" },
    { word: "sheet", partOfSpeech: "名詞", meaning: "床單／紙" },
    { word: "shelf", partOfSpeech: "名詞", meaning: "架子" },
    { word: "shoot", partOfSpeech: "動詞", meaning: "射擊" },
    { word: "shore", partOfSpeech: "名詞", meaning: "岸邊" },
    { word: "shrimp", partOfSpeech: "名詞", meaning: "小蝦" },
    { word: "shut", partOfSpeech: "動詞", meaning: "關閉" },
    { word: "silence", partOfSpeech: "名詞", meaning: "寂靜" },
    { word: "silent", partOfSpeech: "形容詞", meaning: "沉默的" },
    { word: "silly", partOfSpeech: "形容詞", meaning: "愚蠢的" },
    { word: "silver", partOfSpeech: "名詞／形容詞", meaning: "銀／銀色的" },
    { word: "similar", partOfSpeech: "形容詞", meaning: "相似的" },
    { word: "sincere", partOfSpeech: "形容詞", meaning: "真誠的" },
    { word: "single", partOfSpeech: "形容詞", meaning: "單一的" },
    { word: "sink", partOfSpeech: "動詞／名詞", meaning: "下沉／水槽" },
    { word: "skate", partOfSpeech: "動詞／名詞", meaning: "溜冰／溜冰鞋" },
    { word: "ski", partOfSpeech: "動詞／名詞", meaning: "滑雪／滑雪板" },
    { word: "skill", partOfSpeech: "名詞", meaning: "技能" },
    { word: "skillful", partOfSpeech: "形容詞", meaning: "有技巧的" },
    { word: "skin", partOfSpeech: "名詞", meaning: "皮膚" },
    { word: "skinny", partOfSpeech: "形容詞", meaning: "骨感的" },
    { word: "sleepy", partOfSpeech: "形容詞", meaning: "想睡的" },
    { word: "slender", partOfSpeech: "形容詞", meaning: "苗條的" },
    { word: "slice", partOfSpeech: "名詞／動詞", meaning: "薄片／切片" },
    { word: "slippers", partOfSpeech: "名詞", meaning: "拖鞋" },
    { word: "snail", partOfSpeech: "名詞", meaning: "蝸牛" },
    { word: "sneakers", partOfSpeech: "名詞", meaning: "運動鞋" },
    { word: "sneaky", partOfSpeech: "形容詞", meaning: "鬼鬼祟祟的" },
    { word: "snowman", partOfSpeech: "名詞", meaning: "雪人" },
    { word: "soap", partOfSpeech: "名詞", meaning: "肥皂" },
    { word: "social", partOfSpeech: "形容詞", meaning: "社會的" },
    { word: "society", partOfSpeech: "名詞", meaning: "社會" },
    { word: "soda", partOfSpeech: "名詞", meaning: "蘇打" },
    { word: "soft drink", partOfSpeech: "名詞", meaning: "軟飲料" },
    { word: "softball", partOfSpeech: "名詞", meaning: "壘球" },
    { word: "solve", partOfSpeech: "動詞", meaning: "解決" },
    { word: "soul", partOfSpeech: "名詞", meaning: "靈魂" },
    { word: "sour", partOfSpeech: "形容詞", meaning: "酸的" },
    { word: "soy-sauce", partOfSpeech: "名詞", meaning: "醬油" },
    { word: "spaghetti", partOfSpeech: "名詞", meaning: "義大利麵"},
    { word: "speaker", partOfSpeech: "名詞", meaning: "講者" },
    { word: "speech", partOfSpeech: "名詞", meaning: "演講" },
    { word: "speed", partOfSpeech: "名詞／動詞", meaning: "速度／加速" },
    { word: "spirit", partOfSpeech: "名詞", meaning: "精神" },
    { word: "spot", partOfSpeech: "名詞／動詞", meaning: "斑點／發現" },
    { word: "spread", partOfSpeech: "動詞／名詞", meaning: "散佈／傳播" },
    { word: "state", partOfSpeech: "名詞／動詞", meaning: "狀態／陳述" },
    { word: "stationery", partOfSpeech: "名詞", meaning: "文具" },
    { word: "steal", partOfSpeech: "動詞", meaning: "偷" },
    { word: "steam", partOfSpeech: "名詞／動詞", meaning: "蒸氣／蒸" },
    { word: "step", partOfSpeech: "名詞／動詞", meaning: "步驟／踏步" },
    { word: "stingy", partOfSpeech: "形容詞", meaning: "吝嗇的" },
    { word: "stomachache", partOfSpeech: "名詞", meaning: "胃痛" },
    { word: "stone", partOfSpeech: "名詞", meaning: "石頭" },
    { word: "storm", partOfSpeech: "名詞", meaning: "暴風雨" },
    { word: "stormy", partOfSpeech: "形容詞", meaning: "暴風雨的" },
    { word: "stove", partOfSpeech: "名詞", meaning: "爐子" },
    { word: "straw", partOfSpeech: "名詞", meaning: "稻草" },
    { word: "stream", partOfSpeech: "名詞／動詞", meaning: "溪流／流" },
    { word: "strike", partOfSpeech: "動詞／名詞", meaning: "罷工／打擊" },
    { word: "style", partOfSpeech: "名詞", meaning: "樣式" },
    { word: "subway", partOfSpeech: "名詞", meaning: "地鐵" },
    { word: "succeed", partOfSpeech: "動詞", meaning: "成功" },
    { word: "success", partOfSpeech: "名詞", meaning: "成功" },
    { word: "such", partOfSpeech: "代詞／形容詞", meaning: "這樣的／如此" },
    { word: "sudden", partOfSpeech: "形容詞", meaning: "突然的" },
    { word: "suggest", partOfSpeech: "動詞", meaning: "建議" },
    { word: "suit", partOfSpeech: "名詞／動詞", meaning: "西裝／適合" },
    { word: "super", partOfSpeech: "形容詞", meaning: "超級的" },
    { word: "supper", partOfSpeech: "名詞", meaning: "晚餐" },
    { word: "support", partOfSpeech: "動詞／名詞", meaning: "支持／支持者" },
    { word: "survive", partOfSpeech: "動詞", meaning: "存活" },
    { word: "swallow", partOfSpeech: "動詞／名詞", meaning: "吞嚥／燕子" },
    { word: "swan", partOfSpeech: "名詞", meaning: "天鵝" },
    { word: "sweep", partOfSpeech: "動詞／名詞", meaning: "掃除／掃帚" },
    { word: "swimsuit", partOfSpeech: "名詞", meaning: "泳裝" },
    { word: "symbol", partOfSpeech: "名詞", meaning: "符號" },
    { word: "system", partOfSpeech: "名詞", meaning: "系統" },
    // T開頭
    { word: "table", partOfSpeech: "名詞", meaning: "桌子" },
    { word: "tail", partOfSpeech: "名詞", meaning: "尾巴" },
    { word: "Taiwan", partOfSpeech: "名詞", meaning: "台灣" },
    { word: "take", partOfSpeech: "動詞", meaning: "拿" },
    { word: "talk", partOfSpeech: "動詞／名詞", meaning: "談話／談話" },
    { word: "tall", partOfSpeech: "形容詞", meaning: "高的" },
    { word: "tape", partOfSpeech: "名詞／動詞", meaning: "膠帶／錄音" },
    { word: "taste", partOfSpeech: "名詞／動詞", meaning: "味道／品嚐" },
    { word: "taxi", partOfSpeech: "名詞", meaning: "計程車" },
    { word: "tea", partOfSpeech: "名詞", meaning: "茶" },
    { word: "teach", partOfSpeech: "動詞", meaning: "教" },
    { word: "teacher", partOfSpeech: "名詞", meaning: "老師" },
    { word: "team", partOfSpeech: "名詞", meaning: "團隊" },
    { word: "teenager", partOfSpeech: "名詞", meaning: "青少年" },
    { word: "telephone", partOfSpeech: "名詞", meaning: "電話" },
    { word: "television", partOfSpeech: "名詞", meaning: "電視" },
    { word: "tell", partOfSpeech: "動詞", meaning: "告訴" },
    { word: "temple", partOfSpeech: "名詞", meaning: "寺廟" },
    { word: "ten", partOfSpeech: "數詞", meaning: "十" },
    { word: "tennis", partOfSpeech: "名詞", meaning: "網球" },
    { word: "terrible", partOfSpeech: "形容詞", meaning: "可怕的" },
    { word: "test", partOfSpeech: "名詞／動詞", meaning: "測試／測試" },
    { word: "than", partOfSpeech: "連接詞", meaning: "比" },
    { word: "thank", partOfSpeech: "動詞", meaning: "感謝" },
    { word: "that", partOfSpeech: "代詞", meaning: "那" },
    { word: "the", partOfSpeech: "代詞", meaning: "這" },
    { word: "theater", partOfSpeech: "名詞", meaning: "劇院" },
    { word: "then", partOfSpeech: "副詞", meaning: "然後" },
    { word: "there", partOfSpeech: "副詞", meaning: "那裡" },
    { word: "these", partOfSpeech: "代詞", meaning: "這些" },
    { word: "they", partOfSpeech: "代詞", meaning: "他們" },
    { word: "thick", partOfSpeech: "形容詞", meaning: "厚的" },
    { word: "thin", partOfSpeech: "形容詞", meaning: "薄的" },
    { word: "thing", partOfSpeech: "名詞", meaning: "東西" },
    { word: "think", partOfSpeech: "動詞", meaning: "想" },
    { word: "third", partOfSpeech: "序數詞", meaning: "第三" },
    { word: "thirsty", partOfSpeech: "形容詞", meaning: "渴的" },
    { word: "thirteen", partOfSpeech: "數詞", meaning: "十三" },
    { word: "thirty", partOfSpeech: "數詞", meaning: "三十" },
    { word: "this", partOfSpeech: "代詞", meaning: "這" },
    { word: "those", partOfSpeech: "代詞", meaning: "那些" },
    { word: "though", partOfSpeech: "副詞", meaning: "雖然" },
    { word: "thousand", partOfSpeech: "數詞", meaning: "一千" },
    { word: "three", partOfSpeech: "數詞", meaning: "三" },
    { word: "throat", partOfSpeech: "名詞", meaning: "喉嚨" },
    { word: "through", partOfSpeech: "介系詞", meaning: "通過" },
    { word: "throw", partOfSpeech: "動詞", meaning: "拋" },
    { word: "Thursday", partOfSpeech: "名詞", meaning: "星期四" },
    { word: "ticket", partOfSpeech: "名詞", meaning: "票" },
    { word: "tidy", partOfSpeech: "形容詞", meaning: "整潔的" },
    { word: "tie", partOfSpeech: "名詞／動詞", meaning: "領帶／綁" },
    { word: "tiger", partOfSpeech: "名詞", meaning: "老虎" },
    { word: "time", partOfSpeech: "名詞", meaning: "時間" },
    { word: "tip", partOfSpeech: "名詞／動詞", meaning: "小費／給小費" },
    { word: "tired", partOfSpeech: "形容詞", meaning: "疲倦的" },
    { word: "to", partOfSpeech: "介系詞", meaning: "到" },
    { word: "toast", partOfSpeech: "名詞／動詞", meaning: "烤麵包／祝酒" },
    { word: "today", partOfSpeech: "名詞", meaning: "今天" },
    { word: "toe", partOfSpeech: "名詞", meaning: "腳趾" },
    { word: "together", partOfSpeech: "副詞", meaning: "一起" },
    { word: "tomato", partOfSpeech: "名詞", meaning: "番茄" },
    { word: "tomorrow", partOfSpeech: "名詞", meaning: "明天" },
    { word: "tonight", partOfSpeech: "名詞", meaning: "今晚" },
    { word: "too", partOfSpeech: "副詞", meaning: "也" },
    { word: "tool", partOfSpeech: "名詞", meaning: "工具" },
    { word: "tooth", partOfSpeech: "名詞", meaning: "牙齒" },
    { word: "top", partOfSpeech: "名詞／形容詞", meaning: "頂端／頂部" },
    { word: "topic", partOfSpeech: "名詞", meaning: "主題" },
    { word: "total", partOfSpeech: "名詞／形容詞", meaning: "總數／總的" },
    { word: "touch", partOfSpeech: "動詞／名詞", meaning: "觸摸／觸摸" },
    { word: "towel", partOfSpeech: "名詞", meaning: "毛巾" },
    { word: "town", partOfSpeech: "名詞", meaning: "城鎮" },
    { word: "toy", partOfSpeech: "名詞", meaning: "玩具" },
    { word: "traffic", partOfSpeech: "名詞", meaning: "交通" },
    { word: "train", partOfSpeech: "名詞／動詞", meaning: "火車／訓練" },
    { word: "trash", partOfSpeech: "名詞", meaning: "垃圾" },
    { word: "treat", partOfSpeech: "動詞／名詞", meaning: "對待／治療" },
    { word: "tree", partOfSpeech: "名詞", meaning: "樹" },
    { word: "trick", partOfSpeech: "名詞／動詞", meaning: "戲法／欺騙" },
    { word: "trip", partOfSpeech: "名詞／動詞", meaning: "旅行／絆倒" },
    { word: "trouble", partOfSpeech: "名詞", meaning: "麻煩" },
    { word: "truck", partOfSpeech: "名詞", meaning: "卡車" },
    { word: "true", partOfSpeech: "形容詞", meaning: "真實的" },
    { word: "try", partOfSpeech: "動詞／名詞", meaning: "嘗試／努力" },
    { word: "T-shirt", partOfSpeech: "名詞", meaning: "T 恤" },
    { word: "Tuesday", partOfSpeech: "名詞", meaning: "星期二" },
    { word: "turn", partOfSpeech: "名詞／動詞", meaning: "轉彎／轉" },
    { word: "turtle", partOfSpeech: "名詞", meaning: "烏龜" },
    { word: "twelve", partOfSpeech: "數詞", meaning: "十二" },
    { word: "twenty", partOfSpeech: "數詞", meaning: "二十" },
    { word: "twice", partOfSpeech: "副詞", meaning: "兩次" },
    { word: "two", partOfSpeech: "數詞", meaning: "兩" },
    { word: "type", partOfSpeech: "名詞／動詞", meaning: "類型／打字" },
    { word: "typhoon", partOfSpeech: "名詞", meaning: "颱風" },
    { word: "table tennis", partOfSpeech: "名詞", meaning: "桌球" },
    { word: "talent", partOfSpeech: "名詞", meaning: "天賦" },
    { word: "talkative", partOfSpeech: "形容詞", meaning: "健談的" },
    { word: "tangerine", partOfSpeech: "名詞", meaning: "柑橘" },
    { word: "tank", partOfSpeech: "名詞", meaning: "坦克" },
    { word: "teapot", partOfSpeech: "名詞", meaning: "茶壺" },
    { word: "tear", partOfSpeech: "名詞／動詞", meaning: "眼淚／撕" },
    { word: "temperature", partOfSpeech: "名詞", meaning: "溫度" },
    { word: "tent", partOfSpeech: "名詞", meaning: "帳篷" },
    { word: "term", partOfSpeech: "名詞", meaning: "學期" },
    { word: "terrific", partOfSpeech: "形容詞", meaning: "極好的" },
    { word: "textbook", partOfSpeech: "名詞", meaning: "教科書" },
    { word: "therefore", partOfSpeech: "副詞", meaning: "因此" },
    { word: "thief", partOfSpeech: "名詞", meaning: "小偷" },
    { word: "thought", partOfSpeech: "名詞", meaning: "思想" },
    { word: "thumb", partOfSpeech: "名詞", meaning: "拇指" },
    { word: "thunder", partOfSpeech: "名詞", meaning: "雷聲" },
    { word: "till", partOfSpeech: "介詞／動詞", meaning: "直到／耕種" },
    { word: "tiny", partOfSpeech: "形容詞", meaning: "微小的" },
    { word: "title", partOfSpeech: "名詞", meaning: "標題" },
    { word: "tofu", partOfSpeech: "名詞", meaning: "豆腐" },
    { word: "toilet", partOfSpeech: "名詞", meaning: "廁所" },
    { word: "tongue", partOfSpeech: "名詞", meaning: "舌頭" },
    { word: "toothache", partOfSpeech: "名詞", meaning: "牙痛" },
    { word: "toothbrush", partOfSpeech: "名詞", meaning: "牙刷" },
    { word: "toward", partOfSpeech: "介詞", meaning: "向" },
    { word: "tower", partOfSpeech: "名詞", meaning: "塔樓" },
    { word: "trace", partOfSpeech: "名詞／動詞", meaning: "追蹤／追溯" },
    { word: "trade", partOfSpeech: "名詞／動詞", meaning: "貿易／交易" },
    { word: "tradition", partOfSpeech: "名詞", meaning: "傳統" },
    { word: "traditional", partOfSpeech: "形容詞", meaning: "傳統的" },
    { word: "trap", partOfSpeech: "名詞／動詞", meaning: "陷阱／困住" },
    { word: "travel", partOfSpeech: "名詞／動詞", meaning: "旅行／旅行" },
    { word: "treasure", partOfSpeech: "名詞", meaning: "寶藏" },
    { word: "triangle", partOfSpeech: "名詞", meaning: "三角形" },
    { word: "trousers", partOfSpeech: "名詞", meaning: "褲子" },
    { word: "trumpet", partOfSpeech: "名詞", meaning: "小號" },
    { word: "trust", partOfSpeech: "名詞／動詞", meaning: "信任／信賴" },
    { word: "truth", partOfSpeech: "名詞", meaning: "真相" },
    { word: "tub", partOfSpeech: "名詞", meaning: "浴缸" },
    { word: "tube", partOfSpeech: "名詞", meaning: "管道" },
    { word: "tunnel", partOfSpeech: "名詞", meaning: "隧道" },
    { word: "turkey", partOfSpeech: "名詞", meaning: "火雞" },
    // U開頭
    { word: "ugly", partOfSpeech: "形容詞", meaning: "醜的" },
    { word: "umbrella", partOfSpeech: "名詞", meaning: "雨傘" },
    { word: "uncle", partOfSpeech: "名詞", meaning: "叔叔" },
    { word: "under", partOfSpeech: "介詞", meaning: "在⋯下方" },
    { word: "understand", partOfSpeech: "動詞", meaning: "理解" },
    { word: "unhappy", partOfSpeech: "形容詞", meaning: "不快樂的" },
    { word: "uniform", partOfSpeech: "名詞／形容詞", meaning: "制服／統一的" },
    { word: "until", partOfSpeech: "介詞／連接詞", meaning: "直到" },
    { word: "up", partOfSpeech: "副詞／介詞", meaning: "向上" },
    { word: "upload", partOfSpeech: "動詞", meaning: "上傳" },
    { word: "U.S.A.／USA", partOfSpeech: "名詞", meaning: "美國" },
    { word: "use", partOfSpeech: "動詞／名詞", meaning: "使用" },
    { word: "useful", partOfSpeech: "形容詞", meaning: "有用的" },
    { word: "usually", partOfSpeech: "副詞", meaning: "通常" },
    { word: "underline", partOfSpeech: "動詞／名詞", meaning: "底線／畫底線" },
    { word: "underpass", partOfSpeech: "名詞", meaning: "地下道" },
    { word: "underwear", partOfSpeech: "名詞", meaning: "內衣" },
    { word: "unique", partOfSpeech: "形容詞", meaning: "獨特的" },
    { word: "universe", partOfSpeech: "名詞", meaning: "宇宙" },
    { word: "university", partOfSpeech: "名詞", meaning: "大學" },
    { word: "upon", partOfSpeech: "介詞", meaning: "在⋯之上" },
    { word: "upper", partOfSpeech: "形容詞", meaning: "上部的" },
    { word: "upstairs", partOfSpeech: "副詞／形容詞／名詞", meaning: "樓上／樓上的／樓上" },
    { word: "usual", partOfSpeech: "形容詞", meaning: "平常的" },
    // V開頭
    { word: "vacation", partOfSpeech: "名詞", meaning: "假期" },
    { word: "vegetable", partOfSpeech: "名詞", meaning: "蔬菜" },
    { word: "very", partOfSpeech: "副詞", meaning: "非常" },
    { word: "video", partOfSpeech: "名詞", meaning: "影片" },
    { word: "violin", partOfSpeech: "名詞", meaning: "小提琴" },
    { word: "visit", partOfSpeech: "動詞／名詞", meaning: "參觀／拜訪" },
    { word: "visitor", partOfSpeech: "名詞", meaning: "訪客" },
    { word: "voice", partOfSpeech: "名詞", meaning: "聲音" },
    { word: "valley", partOfSpeech: "名詞", meaning: "山谷" },
    { word: "valuable", partOfSpeech: "形容詞", meaning: "有價值的" },
    { word: "value", partOfSpeech: "名詞／動詞", meaning: "價值／重視" },
    { word: "vendor", partOfSpeech: "名詞", meaning: "小販" },
    { word: "vest", partOfSpeech: "名詞", meaning: "背心" },
    { word: "victory", partOfSpeech: "名詞", meaning: "勝利" },
    { word: "village", partOfSpeech: "名詞", meaning: "村莊" },
    { word: "vinegar", partOfSpeech: "名詞", meaning: "醋" },
    { word: "vocabulary", partOfSpeech: "名詞", meaning: "詞彙" },
    { word: "volleyball", partOfSpeech: "名詞", meaning: "排球" },
    { word: "vote", partOfSpeech: "名詞／動詞", meaning: "投票／投票" },
    // W開頭
    { word: "wait", partOfSpeech: "動詞", meaning: "等待" },
    { word: "waiter", partOfSpeech: "名詞", meaning: "服務生" },
    { word: "waitress", partOfSpeech: "名詞", meaning: "女服務生" },
    { word: "wake", partOfSpeech: "動詞", meaning: "喚醒" },
    { word: "walk", partOfSpeech: "動詞／名詞", meaning: "走／散步" },
    { word: "wall", partOfSpeech: "名詞", meaning: "牆" },
    { word: "wallet", partOfSpeech: "名詞", meaning: "錢包" },
    { word: "want", partOfSpeech: "動詞", meaning: "想要" },
    { word: "warm", partOfSpeech: "形容詞", meaning: "溫暖的" },
    { word: "wash", partOfSpeech: "動詞", meaning: "洗" },
    { word: "watch", partOfSpeech: "動詞／名詞", meaning: "觀看／手錶" },
    { word: "water", partOfSpeech: "名詞", meaning: "水" },
    { word: "watermelon", partOfSpeech: "名詞", meaning: "西瓜" },
    { word: "wave", partOfSpeech: "名詞／動詞", meaning: "浪／揮手" },
    { word: "way", partOfSpeech: "名詞", meaning: "方法" },
    { word: "we", partOfSpeech: "代詞", meaning: "我們" },
    { word: "weak", partOfSpeech: "形容詞", meaning: "虛弱的" },
    { word: "wear", partOfSpeech: "動詞", meaning: "穿" },
    { word: "weather", partOfSpeech: "名詞", meaning: "天氣" },
    { word: "Wednesday", partOfSpeech: "名詞", meaning: "星期三" },
    { word: "week", partOfSpeech: "名詞", meaning: "週" },
    { word: "weekend", partOfSpeech: "名詞", meaning: "週末" },
    { word: "welcome", partOfSpeech: "動詞／形容詞／名詞", meaning: "歡迎／受歡迎／歡迎詞" },
    { word: "well", partOfSpeech: "副詞／形容詞", meaning: "很好／健康的" },
    { word: "west", partOfSpeech: "名詞／形容詞", meaning: "西方／西方的" },
    { word: "wet", partOfSpeech: "形容詞", meaning: "濕的" },
    { word: "what", partOfSpeech: "代詞", meaning: "什麼" },
    { word: "when", partOfSpeech: "代詞／副詞", meaning: "何時／當" },
    { word: "where", partOfSpeech: "代詞／副詞", meaning: "哪裡／在哪裡" },
    { word: "whether", partOfSpeech: "連接詞", meaning: "是否" },
    { word: "which", partOfSpeech: "代詞／形容詞", meaning: "哪一個／哪個" },
    { word: "while", partOfSpeech: "連接詞／名詞", meaning: "當⋯的時候／一會兒" },
    { word: "white", partOfSpeech: "形容詞", meaning: "白色的" },
    { word: "who", partOfSpeech: "代詞", meaning: "誰" },
    { word: "whose", partOfSpeech: "代詞", meaning: "誰的" },
    { word: "why", partOfSpeech: "代詞／副詞", meaning: "為什麼／為何" },
    { word: "wide", partOfSpeech: "形容詞", meaning: "寬闊的" },
    { word: "wife", partOfSpeech: "名詞", meaning: "妻子" },
    { word: "will", partOfSpeech: "動詞", meaning: "將" },
    { word: "win", partOfSpeech: "動詞", meaning: "贏得" },
    { word: "wind", partOfSpeech: "名詞／動詞", meaning: "風／轉動" },
    { word: "window", partOfSpeech: "名詞", meaning: "窗戶" },
    { word: "windy", partOfSpeech: "形容詞", meaning: "有風的" },
    { word: "winter", partOfSpeech: "名詞", meaning: "冬季" },
    { word: "wise", partOfSpeech: "形容詞", meaning: "聰明的" },
    { word: "wish", partOfSpeech: "動詞／名詞", meaning: "希望／願望" },
    { word: "with", partOfSpeech: "介詞", meaning: "與" },
    { word: "without", partOfSpeech: "介詞", meaning: "沒有" },
    { word: "woman", partOfSpeech: "名詞", meaning: "女人" },
    { word: "wonderful", partOfSpeech: "形容詞", meaning: "美妙的" },
    { word: "word", partOfSpeech: "名詞", meaning: "字" },
    { word: "work", partOfSpeech: "名詞／動詞", meaning: "工作／工作" },
    { word: "workbook", partOfSpeech: "名詞", meaning: "練習冊" },
    { word: "worker", partOfSpeech: "名詞", meaning: "工人" },
    { word: "world", partOfSpeech: "名詞", meaning: "世界" },
    { word: "worry", partOfSpeech: "動詞／名詞", meaning: "擔心／憂慮" },
    { word: "write", partOfSpeech: "動詞", meaning: "寫" },
    { word: "writer", partOfSpeech: "名詞", meaning: "作家" },
    { word: "wrong", partOfSpeech: "形容詞", meaning: "錯誤的" },
    { word: "waist", partOfSpeech: "名詞", meaning: "腰部" },
    { word: "war", partOfSpeech: "名詞", meaning: "戰爭" },
    { word: "waste", partOfSpeech: "名詞／動詞", meaning: "浪費／廢物" },
    { word: "waterfalls", partOfSpeech: "名詞", meaning: "瀑布" },
    { word: "wedding", partOfSpeech: "名詞", meaning: "婚禮" },
    { word: "weekday", partOfSpeech: "名詞", meaning: "平日" },
    { word: "weight", partOfSpeech: "名詞", meaning: "重量" },
    { word: "whale", partOfSpeech: "名詞", meaning: "鯨魚" },
    { word: "wheel", partOfSpeech: "名詞", meaning: "輪子" },
    { word: "whole", partOfSpeech: "形容詞", meaning: "整個的" },
    { word: "wild", partOfSpeech: "形容詞", meaning: "野生的" },
    { word: "wing", partOfSpeech: "名詞", meaning: "翅膀" },
    { word: "winner", partOfSpeech: "名詞", meaning: "勝利者" },
    { word: "wok", partOfSpeech: "名詞", meaning: "炒鍋" },
    { word: "wolf", partOfSpeech: "名詞", meaning: "狼" },
    { word: "women's room", partOfSpeech: "名詞", meaning: "女廁" },
    { word: "wood", partOfSpeech: "名詞", meaning: "木材" },
    { word: "woods", partOfSpeech: "名詞", meaning: "森林" },
    { word: "worm", partOfSpeech: "名詞", meaning: "蟲子" },
    { word: "wound", partOfSpeech: "名詞／動詞", meaning: "傷口／傷害" },
    { word: "wrist", partOfSpeech: "名詞", meaning: "手腕" },
    // X開頭
    // Y開頭
    { word: "yard", partOfSpeech: "名詞", meaning: "庭院" },
    { word: "year", partOfSpeech: "名詞", meaning: "年" },
    { word: "yellow", partOfSpeech: "形容詞", meaning: "黃色的" },
    { word: "yes（yeah）", partOfSpeech: "副詞", meaning: "是 （是的）" },
    { word: "yesterday", partOfSpeech: "名詞", meaning: "昨天" },
    { word: "yet", partOfSpeech: "副詞", meaning: "還" },
    { word: "you", partOfSpeech: "代詞", meaning: "你" },
    { word: "young", partOfSpeech: "形容詞", meaning: "年輕的" },
    { word: "yummy", partOfSpeech: "形容詞", meaning: "美味的" },
    { word: "yell", partOfSpeech: "動詞", meaning: "大喊" },
    { word: "youth", partOfSpeech: "名詞", meaning: "青年時期" },
    // Z開頭
    { word: "zebra", partOfSpeech: "名詞", meaning: "斑馬" },
    { word: "zero", partOfSpeech: "名詞", meaning: "零" },
    { word: "zoo", partOfSpeech: "名詞", meaning: "動物園" }
        ];
        
        console.log(`準備導入 ${words2005.length} 個單字，分批處理...`);
        
        let addedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // 分批處理單字，每批50個
        const batchSize = 50;
        const totalBatches = Math.ceil(words2005.length / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
            const startIndex = batch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, words2005.length);
            const currentBatch = words2005.slice(startIndex, endIndex);
            
            console.log(`處理批次 ${batch + 1}/${totalBatches}，單字索引 ${startIndex} 到 ${endIndex - 1}`);
            
            // 在每批處理之前通知用戶進度
            if (typeof showNotification === 'function') {
                showNotification(`導入中... ${Math.round((batch / totalBatches) * 100)}%`, 'info');
            }
            
            for (const wordData of currentBatch) {
                try {
                    // 檢查單字是否已存在
                    const exists = existingWords.some(w => w.word === wordData.word);
                    
                    if (exists) {
                        console.log(`單字「${wordData.word}」已存在，跳過`);
                        skippedCount++;
                        continue;
                    }
                    
                    // 準備單字數據
                    const newWord = {
                        word: wordData.word,
                        phonetic: "",
                        partOfSpeech: wordData.partOfSpeech,
                        meaning: wordData.meaning,
                        examples: "",
                        status: "notLearned",
                        createdAt: new Date().toISOString()
                    };
                    
                    // 添加單字
                    const wordId = await addWord(newWord);
                    
                    // 添加到詞彙組
                    await addWordToList(wordId, basic2005ListId);
                    
                    console.log(`已添加單字「${wordData.word}」，ID: ${wordId}`);
                    addedCount++;
                } catch (wordError) {
                    console.error(`添加單字「${wordData.word}」失敗:`, wordError);
                    errorCount++;
                }
            }
            
            // 每批次處理後短暫暫停，避免瀏覽器凍結
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        console.log(`導入完成。已添加: ${addedCount}, 已跳過: ${skippedCount}, 錯誤: ${errorCount}`);
        
        if (typeof showNotification === 'function') {
            if (errorCount > 0) {
                showNotification(`導入完成但有錯誤。新增: ${addedCount}，跳過: ${skippedCount}，錯誤: ${errorCount}`, 'warning');
            } else {
                showNotification(`導入完成！新增: ${addedCount}，已存在: ${skippedCount}`, 'success');
            }
        }
        
        return {
            success: true,
            added: addedCount,
            skipped: skippedCount,
            errors: errorCount,
            total: words2005.length
        };
        
    } catch (error) {
        console.error('導入國中基礎2005單字失敗:', error);
        
        if (typeof showNotification === 'function') {
            showNotification('導入失敗：' + error.message, 'error');
        }
        
        return {
            success: false,
            error: error.message
        };
    }
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
    init: init,
    addWord,
    getAllWords,
    getWordById,
    updateWord,
    deleteWord,
    searchWords,
    getWordsByStatus,
    // 詞彙組相關功能
    addWordList,
    getAllWordLists,
    updateWordList,
    deleteWordList,
    addWordToList,
    removeWordFromList,
    getWordsInList,
    // 單字導入功能
    importBasic2005Words
};

// 確保所有功能都可正常訪問
console.log('資料庫模組已載入，可用函數：', Object.keys(window.db).join(', ')); 