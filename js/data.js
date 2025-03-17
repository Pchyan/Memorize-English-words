/**
 * 單字記憶大師 - 資料管理模組
 * 負責資料初始化、本地存儲和資料操作功能
 */

// 全局應用數據
window.appData = {
    vocabulary: [],
    userSettings: {},
    learningHistory: [],
    journal: [],
    achievements: []
};

// 初始化應用數據
document.addEventListener('DOMContentLoaded', () => {
    initAppData();
});

/**
 * 初始化應用數據
 */
function initAppData() {
    // 嘗試從本地存儲載入數據
    const savedData = loadAppData();
    
    // 如果有保存的數據，使用它
    if (savedData) {
        window.appData = savedData;
    } else {
        // 否則，初始化默認數據
        initDefaultData();
    }
    
    // 初始化用戶設置
    initUserSettings();
    
    // 初始化學習streak（連續學習天數）
    checkAndUpdateStreak();
}

/**
 * 初始化默認數據
 */
function initDefaultData() {
    // 初始化示例詞彙
    window.appData.vocabulary = generateSampleVocabulary();
    
    // 初始化用戶設置
    window.appData.userSettings = {
        username: '學習者',
        dailyGoal: 10,
        theme: 'light',
        pronunciation: 'us', // us 或 uk
        streak: 0,
        lastLogin: new Date().toISOString()
    };
    
    // 初始化學習歷史
    window.appData.learningHistory = generateSampleHistory();
    
    // 初始化學習日誌
    window.appData.journal = generateSampleJournal();
    
    // 初始化成就
    window.appData.achievements = generateSampleAchievements();
    
    // 保存到本地存儲
    saveAppData();
}

/**
 * 從本地存儲載入應用數據
 * @returns {Object|null} - 載入的數據或null
 */
function loadAppData() {
    try {
        const savedData = localStorage.getItem('vocabMasterData');
        if (savedData) {
            return JSON.parse(savedData);
        }
    } catch (e) {
        console.error('載入數據失敗：', e);
    }
    return null;
}

/**
 * 將應用數據保存到本地存儲
 */
function saveAppData() {
    try {
        localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
    } catch (e) {
        console.error('保存數據失敗：', e);
    }
}

/**
 * 初始化用戶設置
 */
function initUserSettings() {
    // 如果沒有用戶設置，初始化默認設置
    if (!window.appData.userSettings) {
        window.appData.userSettings = {
            username: '學習者',
            dailyGoal: 10,
            theme: 'light',
            pronunciation: 'us',
            streak: 0,
            lastLogin: new Date().toISOString()
        };
    }
    
    // 應用主題
    applyTheme(window.appData.userSettings.theme);
    
    // 綁定設置表單事件
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings();
        });
        
        // 初始化設置表單
        initSettingsForm();
    }
}

/**
 * 應用主題
 * @param {string} theme - 主題名稱
 */
function applyTheme(theme) {
    document.body.className = `theme-${theme}`;
}

/**
 * 初始化設置表單
 */
function initSettingsForm() {
    const settings = window.appData.userSettings;
    
    // 填充用戶名
    document.getElementById('username')?.setAttribute('value', settings.username);
    
    // 填充每日目標
    document.getElementById('dailyGoal')?.setAttribute('value', settings.dailyGoal);
    
    // 設置主題
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        if (radio.value === settings.theme) {
            radio.checked = true;
        }
    });
    
    // 設置發音
    const pronunciationRadios = document.querySelectorAll('input[name="pronunciation"]');
    pronunciationRadios.forEach(radio => {
        if (radio.value === settings.pronunciation) {
            radio.checked = true;
        }
    });
}

/**
 * 保存設置
 */
function saveSettings() {
    const username = document.getElementById('username')?.value;
    const dailyGoal = document.getElementById('dailyGoal')?.value;
    const theme = document.querySelector('input[name="theme"]:checked')?.value;
    const pronunciation = document.querySelector('input[name="pronunciation"]:checked')?.value;
    
    // 更新設置
    if (username) window.appData.userSettings.username = username;
    if (dailyGoal) window.appData.userSettings.dailyGoal = parseInt(dailyGoal, 10);
    if (theme) {
        window.appData.userSettings.theme = theme;
        applyTheme(theme);
    }
    if (pronunciation) window.appData.userSettings.pronunciation = pronunciation;
    
    // 保存設置
    saveAppData();
    
    // 顯示成功訊息
    alert('設置已保存');
}

/**
 * 檢查並更新學習連續天數
 */
function checkAndUpdateStreak() {
    const settings = window.appData.userSettings;
    const today = new Date();
    const lastLogin = new Date(settings.lastLogin);
    
    // 設置時間為00:00:00以僅比較日期
    today.setHours(0, 0, 0, 0);
    lastLogin.setHours(0, 0, 0, 0);
    
    // 計算日期差異
    const dayDifference = Math.floor((today - lastLogin) / (24 * 60 * 60 * 1000));
    
    // 更新streak
    if (dayDifference === 0) {
        // 今天已經登錄過，不做任何事
    } else if (dayDifference === 1) {
        // 連續登錄，增加streak
        settings.streak += 1;
    } else {
        // 中斷連續登錄，重置streak
        settings.streak = 1;
    }
    
    // 更新最後登錄時間
    settings.lastLogin = today.toISOString();
    
    // 保存設置
    saveAppData();
}

/**
 * 生成示例詞彙
 * @returns {Array} - 示例詞彙數組
 */
function generateSampleVocabulary() {
    return [
        {
            id: 1,
            word: 'apple',
            phonetic: '/ˈæp.əl/',
            meaning: '蘋果',
            partOfSpeech: 'noun',
            examples: ['I eat an apple every day.', 'She gave me a red apple.'],
            notes: '常見水果',
            status: 'learning',
            category: '水果',
            synonyms: ['fruit'],
            antonyms: [],
            associations: ['紅色', '水果', '健康'],
            context: '飲食',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 1,
            lists: ['基礎單字', 'food']
        },
        {
            id: 2,
            word: 'book',
            phonetic: '/bʊk/',
            meaning: '書',
            partOfSpeech: 'noun',
            examples: ['I read a book before bed.', 'She wrote a book about her travels.'],
            notes: '基礎詞彙',
            status: 'learning',
            category: '學習用品',
            synonyms: ['volume', 'publication'],
            antonyms: [],
            associations: ['學習', '閱讀', '知識'],
            context: '學校',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 1,
            lists: ['基礎單字']
        },
        {
            id: 3,
            word: 'computer',
            phonetic: '/kəmˈpjuː.tər/',
            meaning: '電腦',
            partOfSpeech: 'noun',
            examples: ['I use my computer to write emails.', 'The computer is running slowly.'],
            notes: '科技詞彙',
            status: 'new',
            category: '科技',
            synonyms: ['PC', 'laptop'],
            antonyms: [],
            associations: ['科技', '工作', '網絡'],
            context: '辦公室',
            lastReviewed: null,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 2,
            lists: ['科技詞彙']
        },
        {
            id: 4,
            word: 'difficult',
            phonetic: '/ˈdɪf.ɪ.kəlt/',
            meaning: '困難的',
            partOfSpeech: 'adjective',
            examples: ['The exam was very difficult.', 'She found it difficult to make friends.'],
            notes: '常用形容詞',
            status: 'learning',
            category: '形容詞',
            synonyms: ['hard', 'challenging', 'tough'],
            antonyms: ['easy', 'simple'],
            associations: ['挑戰', '問題', '努力'],
            context: '學習',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 3,
            lists: ['基礎單字', 'toefl']
        },
        {
            id: 5,
            word: 'example',
            phonetic: '/ɪɡˈzæm.pəl/',
            meaning: '例子',
            partOfSpeech: 'noun',
            examples: ['Can you give me an example?', 'This is a good example of modern architecture.'],
            notes: '常用詞彙',
            status: 'learning',
            category: '學術',
            synonyms: ['instance', 'case', 'sample'],
            antonyms: [],
            associations: ['說明', '證明', '樣本'],
            context: '學校',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 2,
            lists: ['基礎單字', 'toefl']
        },
        {
            id: 6,
            word: 'friend',
            phonetic: '/frend/',
            meaning: '朋友',
            partOfSpeech: 'noun',
            examples: ['She is my best friend.', 'I made new friends at school.'],
            notes: '基礎詞彙',
            status: 'mastered',
            category: '人際關係',
            synonyms: ['companion', 'buddy', 'pal'],
            antonyms: ['enemy', 'foe'],
            associations: ['友誼', '信任', '支持'],
            context: '社交',
            lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            nextReview: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 1,
            lists: ['基礎單字']
        },
        {
            id: 7,
            word: 'global',
            phonetic: '/ˈɡloʊ.bəl/',
            meaning: '全球的',
            partOfSpeech: 'adjective',
            examples: ['Climate change is a global issue.', 'The company has a global presence.'],
            notes: '國際詞彙',
            status: 'difficult',
            category: '地理',
            synonyms: ['worldwide', 'international', 'universal'],
            antonyms: ['local', 'regional'],
            associations: ['世界', '國際', '全球化'],
            context: '國際關係',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 4,
            lists: ['toefl', 'ielts']
        },
        {
            id: 8,
            word: 'happy',
            phonetic: '/ˈhæp.i/',
            meaning: '快樂的',
            partOfSpeech: 'adjective',
            examples: ['She looks very happy today.', 'We are happy with the results.'],
            notes: '情緒詞彙',
            status: 'mastered',
            category: '情緒',
            synonyms: ['glad', 'pleased', 'joyful'],
            antonyms: ['sad', 'unhappy', 'miserable'],
            associations: ['微笑', '陽光', '慶祝'],
            context: '情緒表達',
            lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            nextReview: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 1,
            lists: ['基礎單字']
        },
        {
            id: 9,
            word: 'imagine',
            phonetic: '/ɪˈmædʒ.ɪn/',
            meaning: '想像',
            partOfSpeech: 'verb',
            examples: ['I can\'t imagine living without my phone.', 'Imagine a world without pollution.'],
            notes: '思考動詞',
            status: 'learning',
            category: '思考',
            synonyms: ['visualize', 'envision', 'conceive'],
            antonyms: [],
            associations: ['創造力', '思考', '夢想'],
            context: '思考過程',
            lastReviewed: new Date().toISOString(),
            nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 3,
            lists: ['toefl']
        },
        {
            id: 10,
            word: 'journey',
            phonetic: '/ˈdʒɜr.ni/',
            meaning: '旅程',
            partOfSpeech: 'noun',
            examples: ['The journey to the mountain took three days.', 'Life is a journey, not a destination.'],
            notes: '旅行詞彙',
            status: 'new',
            category: '旅行',
            synonyms: ['trip', 'voyage', 'expedition'],
            antonyms: [],
            associations: ['旅行', '冒險', '經歷'],
            context: '旅行',
            lastReviewed: null,
            nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            difficulty: 2,
            lists: ['ielts']
        }
    ];
}

/**
 * 生成示例學習歷史
 * @returns {Array} - 示例學習歷史記錄
 */
function generateSampleHistory() {
    const now = new Date();
    const history = [];
    
    // 生成過去30天的學習記錄
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        
        // 每天0-5條記錄
        const recordCount = Math.floor(Math.random() * 6);
        
        for (let j = 0; j < recordCount; j++) {
            // 隨機時間
            const hours = Math.floor(Math.random() * 12) + 8; // 8AM - 8PM
            const minutes = Math.floor(Math.random() * 60);
            date.setHours(hours, minutes);
            
            // 隨機單字ID
            const wordId = Math.floor(Math.random() * 10) + 1;
            
            // 隨機動作
            const actions = ['learn', 'review', 'practice', 'master'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            
            // 隨機時長（分鐘）
            const duration = Math.floor(Math.random() * 20) + 1;
            
            // 隨機結果
            const results = ['correct', 'incorrect'];
            const result = results[Math.floor(Math.random() * results.length)];
            
            // 添加記錄
            history.push({
                timestamp: date.toISOString(),
                wordId,
                action,
                duration,
                result
            });
        }
    }
    
    return history;
}

/**
 * 生成示例學習日誌
 * @returns {Array} - 示例學習日誌記錄
 */
function generateSampleJournal() {
    const now = new Date();
    const journal = [];
    
    // 示例條目1
    const entry1Date = new Date();
    entry1Date.setDate(now.getDate() - 2);
    
    journal.push({
        date: entry1Date.toISOString(),
        content: '今天學習了一些水果相關單字，開始能夠在日常對話中使用這些詞彙了。',
        words: ['apple', 'banana', 'orange']
    });
    
    // 示例條目2
    const entry2Date = new Date();
    entry2Date.setDate(now.getDate() - 5);
    
    journal.push({
        date: entry2Date.toISOString(),
        content: '複習了學校相關詞彙，發現自己對於"global"這個詞概念理解不夠清晰，需要多練習。',
        words: ['school', 'student', 'global']
    });
    
    return journal;
}

/**
 * 生成示例成就
 * @returns {Array} - 示例成就列表
 */
function generateSampleAchievements() {
    return [
        {
            id: 1,
            title: '開始旅程',
            description: '完成第一次學習',
            icon: 'fa-flag',
            unlocked: true,
            unlockedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 2,
            title: '堅持不懈',
            description: '連續學習7天',
            icon: 'fa-calendar-check',
            unlocked: false,
            progress: 40
        },
        {
            id: 3,
            title: '詞彙大師',
            description: '掌握100個單字',
            icon: 'fa-book',
            unlocked: false,
            progress: 10
        },
        {
            id: 4,
            title: '速記達人',
            description: '一次測驗中答對10個單字',
            icon: 'fa-bolt',
            unlocked: false
        },
        {
            id: 5,
            title: '學習狂熱者',
            description: '累計學習時間達到24小時',
            icon: 'fa-clock',
            unlocked: false,
            progress: 25
        }
    ];
}

/**
 * 添加新單字
 * @param {Object} word - 單字對象
 */
function addWord(word) {
    // 生成唯一ID
    const maxId = Math.max(0, ...window.appData.vocabulary.map(w => w.id));
    word.id = maxId + 1;
    
    // 設置初始值
    word.status = word.status || 'new';
    word.lastReviewed = null;
    word.nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // 添加到詞彙表
    window.appData.vocabulary.push(word);
    
    // 添加學習記錄
    addLearningRecord(word.id, 'learn');
    
    // 保存數據
    saveAppData();
    
    // 返回新添加的單字ID
    return word.id;
}

/**
 * 更新單字
 * @param {number} wordId - 單字ID
 * @param {Object} updates - 更新內容
 */
function updateWord(wordId, updates) {
    // 查找單字
    const wordIndex = window.appData.vocabulary.findIndex(w => w.id === wordId);
    
    if (wordIndex === -1) {
        console.error(`找不到ID為${wordId}的單字`);
        return false;
    }
    
    // 更新單字
    window.appData.vocabulary[wordIndex] = {
        ...window.appData.vocabulary[wordIndex],
        ...updates
    };
    
    // 保存數據
    saveAppData();
    
    return true;
}

/**
 * 刪除單字
 * @param {number} wordId - 單字ID
 */
function deleteWord(wordId) {
    // 查找單字
    const wordIndex = window.appData.vocabulary.findIndex(w => w.id === wordId);
    
    if (wordIndex === -1) {
        console.error(`找不到ID為${wordId}的單字`);
        return false;
    }
    
    // 刪除單字
    window.appData.vocabulary.splice(wordIndex, 1);
    
    // 保存數據
    saveAppData();
    
    return true;
}

/**
 * 添加學習記錄
 * @param {number} wordId - 單字ID
 * @param {string} action - 動作（learn, review, practice, master）
 * @param {number} duration - 持續時間（分鐘）
 * @param {string} result - 結果（correct, incorrect）
 */
function addLearningRecord(wordId, action, duration = 1, result = null) {
    // 創建記錄
    const record = {
        timestamp: new Date().toISOString(),
        wordId,
        action,
        duration
    };
    
    // 如果有結果，添加結果
    if (result) {
        record.result = result;
    }
    
    // 添加到學習歷史
    window.appData.learningHistory.push(record);
    
    // 如果是掌握單字，更新單字狀態
    if (action === 'master') {
        const wordIndex = window.appData.vocabulary.findIndex(w => w.id === wordId);
        if (wordIndex !== -1) {
            window.appData.vocabulary[wordIndex].status = 'mastered';
            window.appData.vocabulary[wordIndex].lastReviewed = record.timestamp;
            
            // 設置下一次複習時間（3週後）
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + 21);
            window.appData.vocabulary[wordIndex].nextReview = nextReview.toISOString();
        }
    }
    
    // 更新成就
    checkAchievements();
    
    // 保存數據
    saveAppData();
}

/**
 * 獲取需要複習的單字
 * @param {number} limit - 限制數量
 * @returns {Array} - 需要複習的單字
 */
function getWordsForReview(limit = 10) {
    const now = new Date();
    
    // 過濾出需要複習的單字
    const dueWords = window.appData.vocabulary.filter(word => {
        // 如果單字已經掌握，按照間隔複習
        if (word.status === 'mastered') {
            const nextReview = new Date(word.nextReview);
            return nextReview <= now;
        }
        
        // 如果單字是新的或學習中的，立刻複習
        return word.status === 'new' || word.status === 'learning' || word.status === 'difficult';
    });
    
    // 按優先級排序（困難 > 學習中 > 新 > 已掌握）
    dueWords.sort((a, b) => {
        const priorityMap = {
            'difficult': 0,
            'learning': 1,
            'new': 2,
            'mastered': 3
        };
        
        return priorityMap[a.status] - priorityMap[b.status];
    });
    
    // 返回限制數量的單字
    return dueWords.slice(0, limit);
}

/**
 * 檢查成就
 */
function checkAchievements() {
    const achievements = window.appData.achievements;
    const history = window.appData.learningHistory;
    const vocabulary = window.appData.vocabulary;
    const userSettings = window.appData.userSettings;
    
    // 檢查每個成就
    achievements.forEach(achievement => {
        // 如果已經解鎖，跳過
        if (achievement.unlocked) return;
        
        switch (achievement.id) {
            case 1: // 開始旅程
                if (history.length > 0) {
                    achievement.unlocked = true;
                    achievement.unlockedDate = new Date().toISOString();
                }
                break;
            case 2: // 堅持不懈
                // 計算進度（100%表示7天）
                const progress = Math.min(100, Math.floor((userSettings.streak / 7) * 100));
                achievement.progress = progress;
                
                if (userSettings.streak >= 7) {
                    achievement.unlocked = true;
                    achievement.unlockedDate = new Date().toISOString();
                }
                break;
            case 3: // 詞彙大師
                // 計算掌握單字數量
                const masteredCount = vocabulary.filter(w => w.status === 'mastered').length;
                
                // 計算進度
                const vocabProgress = Math.min(100, Math.floor((masteredCount / 100) * 100));
                achievement.progress = vocabProgress;
                
                if (masteredCount >= 100) {
                    achievement.unlocked = true;
                    achievement.unlockedDate = new Date().toISOString();
                }
                break;
            case 4: // 速記達人
                // 檢查是否有連續10個正確答案的記錄
                let correctCount = 0;
                let maxCorrect = 0;
                
                for (let i = history.length - 1; i >= 0; i--) {
                    const record = history[i];
                    if (record.action === 'practice') {
                        if (record.result === 'correct') {
                            correctCount++;
                            maxCorrect = Math.max(maxCorrect, correctCount);
                        } else {
                            correctCount = 0;
                        }
                    }
                }
                
                if (maxCorrect >= 10) {
                    achievement.unlocked = true;
                    achievement.unlockedDate = new Date().toISOString();
                }
                break;
            case 5: // 學習狂熱者
                // 計算總學習時間
                const totalMinutes = history.reduce((total, record) => {
                    return total + (record.duration || 0);
                }, 0);
                
                // 計算進度（100%表示24小時，即1440分鐘）
                const timeProgress = Math.min(100, Math.floor((totalMinutes / 1440) * 100));
                achievement.progress = timeProgress;
                
                if (totalMinutes >= 1440) {
                    achievement.unlocked = true;
                    achievement.unlockedDate = new Date().toISOString();
                }
                break;
        }
    });
} 