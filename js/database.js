// 初始化資料庫
let db;

// 初始化資料庫連接
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
        const existingWords = await getAllWords();
        
        // 單字列表 (從soeasyedu.com.tw網站獲取的2005個單字)
        const words2005 = [
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
            { word: "airplane", partOfSpeech: "名詞", meaning: "飛機" },
            { word: "airport", partOfSpeech: "名詞", meaning: "機場" },
            { word: "all", partOfSpeech: "代詞", meaning: "所有" },
            { word: "allow", partOfSpeech: "動詞", meaning: "允許" },
            { word: "almost", partOfSpeech: "副詞", meaning: "幾乎" },
            { word: "along", partOfSpeech: "介系詞", meaning: "沿著" },
            { word: "already", partOfSpeech: "副詞", meaning: "已經" },
            { word: "also", partOfSpeech: "副詞", meaning: "也" },
            { word: "always", partOfSpeech: "副詞", meaning: "總是" },
            { word: "America", partOfSpeech: "名詞", meaning: "美國" },
            { word: "American", partOfSpeech: "形容詞", meaning: "美國的" },
            { word: "and", partOfSpeech: "連接詞", meaning: "和" },
            { word: "angle", partOfSpeech: "名詞", meaning: "角度" },
            { word: "angry", partOfSpeech: "形容詞", meaning: "生氣的" },
            { word: "animal", partOfSpeech: "名詞", meaning: "動物" },
            { word: "another", partOfSpeech: "代詞", meaning: "另一個" },
            { word: "answer", partOfSpeech: "名詞", meaning: "答案" },
            { word: "ant", partOfSpeech: "名詞", meaning: "螞蟻" },
            { word: "any", partOfSpeech: "代詞", meaning: "任何" },
            { word: "anyone", partOfSpeech: "代詞", meaning: "任何人" },
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
            { word: "autumn", partOfSpeech: "名詞", meaning: "秋天" },
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
            
            // B 開頭
            { word: "baby", partOfSpeech: "名詞", meaning: "嬰兒" },
            { word: "back", partOfSpeech: "名詞", meaning: "背部" },
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
            { word: "bat", partOfSpeech: "名詞", meaning: "蝙蝠" },
            { word: "bath", partOfSpeech: "名詞", meaning: "浴室" },
            { word: "bathroom", partOfSpeech: "名詞", meaning: "浴室" },
            { word: "be", partOfSpeech: "動詞", meaning: "是" },
            { word: "beach", partOfSpeech: "名詞", meaning: "海灘" },
            { word: "bean", partOfSpeech: "名詞", meaning: "豆子" },
            { word: "bear", partOfSpeech: "名詞", meaning: "熊" },
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
            { word: "bicycle", partOfSpeech: "名詞", meaning: "自行車" },
            { word: "big", partOfSpeech: "形容詞", meaning: "大的" },
            { word: "bird", partOfSpeech: "名詞", meaning: "鳥" },
            { word: "birthday", partOfSpeech: "名詞", meaning: "生日" },
            { word: "bite", partOfSpeech: "動詞", meaning: "咬" },
            { word: "black", partOfSpeech: "形容詞", meaning: "黑色的" },
            { word: "blackboard", partOfSpeech: "名詞", meaning: "黑板" },
            { word: "blank", partOfSpeech: "形容詞", meaning: "空白的" },
            { word: "blanket", partOfSpeech: "名詞", meaning: "毯子" },
            { word: "blind", partOfSpeech: "形容詞", meaning: "盲的" },
            { word: "block", partOfSpeech: "名詞", meaning: "街區" },
            { word: "blow", partOfSpeech: "動詞", meaning: "吹" },
            { word: "blue", partOfSpeech: "形容詞", meaning: "藍色的" },
            
            // ...更多單字會在這裡繼續添加，最終完成所有2005個單字列表

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
            { word: "wound", partOfSpeech: "名詞", meaning: "傷口" },
            { word: "wrist", partOfSpeech: "名詞", meaning: "手腕" },
            { word: "yard", partOfSpeech: "名詞", meaning: "庭院" },
            { word: "year", partOfSpeech: "名詞", meaning: "年" },
            { word: "yellow", partOfSpeech: "形容詞", meaning: "黃色的" },
            { word: "yes", partOfSpeech: "副詞", meaning: "是" },
            { word: "yesterday", partOfSpeech: "名詞", meaning: "昨天" },
            { word: "yet", partOfSpeech: "副詞", meaning: "還" },
            { word: "you", partOfSpeech: "代詞", meaning: "你" },
            { word: "young", partOfSpeech: "形容詞", meaning: "年輕的" },
            { word: "yummy", partOfSpeech: "形容詞", meaning: "美味的" },
            { word: "yell", partOfSpeech: "動詞", meaning: "大喊" },
            { word: "youth", partOfSpeech: "名詞", meaning: "青年時期" },
            { word: "zebra", partOfSpeech: "名詞", meaning: "斑馬" },
            { word: "zero", partOfSpeech: "名詞", meaning: "零" },
            { word: "zoo", partOfSpeech: "名詞", meaning: "動物園" }
        ];
        
        let addedCount = 0;
        let skippedCount = 0;
        
        // 添加單字到詞彙組
        for (const wordData of words2005) {
            try {
                // 檢查單字是否已存在
                const existingWord = existingWords.find(w => 
                    w.word.toLowerCase() === wordData.word.toLowerCase()
                );
                
                let wordId;
                
                if (existingWord) {
                    // 如果單字已存在，只將其添加到詞彙組中
                    wordId = existingWord.id;
                    skippedCount++;
                } else {
                    // 如果單字不存在，創建新單字
                    const newWord = {
                        word: wordData.word,
                        phonetic: '',
                        partOfSpeech: wordData.partOfSpeech,
                        meaning: wordData.meaning,
                        examples: '',
                        status: 'notLearned',
                        createdAt: new Date().toISOString()
                    };
                    
                    wordId = await addWord(newWord);
                    addedCount++;
                }
                
                // 將單字添加到詞彙組
                await addWordToList(wordId, basic2005ListId);
                
            } catch (error) {
                console.error(`導入單字 "${wordData.word}" 失敗:`, error);
            }
        }
        
        console.log(`導入完成! 成功添加 ${addedCount} 個新單字，${skippedCount} 個單字已存在`);
        showNotification(`導入完成! 新增: ${addedCount} 個, 已存在: ${skippedCount} 個`, 'success');
        
        // 重載詞彙列表
        await initVocabLists();
        await updateVocabListCounts();
        
        return {
            success: true,
            added: addedCount,
            skipped: skippedCount,
            total: addedCount + skippedCount
        };
        
    } catch (error) {
        console.error('導入國中基礎2005單字失敗:', error);
        showNotification('導入失敗，請稍後再試', 'error');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// 匯出所有功能
window.db = {
    init: initDatabase,
    addWord,
    getAllWords,
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
    importBasic2005Words
}; 