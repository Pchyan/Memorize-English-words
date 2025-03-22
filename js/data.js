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
    return []; // 返回空數組，移除所有預設的模擬用數據
}

/**
 * 生成示例學習歷史
 * @returns {Array} - 示例學習歷史數組
 */
function generateSampleHistory() {
    return []; // 返回空數組，移除所有預設的模擬用數據
}

/**
 * 生成示例學習日誌
 * @returns {Array} - 示例學習日誌數組
 */
function generateSampleJournal() {
    return []; // 返回空數組，移除所有預設的模擬用數據
}

/**
 * 生成示例成就
 * @returns {Array} - 示例成就數組
 */
function generateSampleAchievements() {
    return []; // 返回空數組，移除所有預設的模擬用數據
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