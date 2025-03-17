/**
 * 單字記憶大師 - 主應用程式
 * 負責頁面導航、全局功能和初始化
 */

// 當DOM加載完成後初始化應用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * 初始化應用
 */
function initApp() {
    // 初始化頁面導航
    initPageNavigation();
    
    // 初始化模態框處理
    initModalHandlers();
    
    // 初始化事件監聽器
    initEventListeners();
    
    // 初始化首頁按鈕
    initHomeButtons();
    
    // 初始化模擬數據
    initMockData();
}

/**
 * 初始化頁面導航
 */
function initPageNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 獲取目標頁面ID
            const targetPageId = link.getAttribute('data-page');
            
            // 切換到目標頁面
            switchPage(targetPageId);
            
            // 更新導航鏈接狀態
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
        });
    });
}

/**
 * 切換頁面
 * @param {string} pageId - 目標頁面ID
 */
function switchPage(pageId) {
    console.log(`切換到頁面: ${pageId}`);
    
    // 隱藏所有頁面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // 顯示選定的頁面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // 更新導航選中狀態
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        // 根據頁面執行特定初始化
        if (pageId === 'vocabulary') {
            console.log('初始化詞彙管理頁面');
            if (typeof initVocabularyManager === 'function') {
                initVocabularyManager();
            } else {
                console.error('找不到 initVocabularyManager 函數');
            }
        } else if (pageId === 'flashcards') {
            console.log('初始化記憶卡頁面');
            // 初始化記憶卡頁面
            if (typeof initFlashcards === 'function') {
                initFlashcards();
            } else {
                console.error('找不到 initFlashcards 函數');
            }
        } else if (pageId === 'practice') {
            console.log('初始化練習測驗頁面');
            // 初始化練習測驗頁面
        } else if (pageId === 'progress') {
            console.log('初始化學習進度頁面');
            // 初始化學習進度頁面
        }
    } else {
        console.error(`找不到頁面: ${pageId}`);
    }
}

/**
 * 初始化模態框處理
 */
function initModalHandlers() {
    // 獲取模態框背景
    const modalOverlay = document.getElementById('modalOverlay');
    
    // 點擊背景關閉模態框
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            // 關閉所有模態框
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.classList.remove('active');
            });
            modalOverlay.classList.remove('active');
        });
    }
    
    // 關閉按鈕
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 獲取父模態框
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                if (modalOverlay) {
                    modalOverlay.classList.remove('active');
                }
            }
        });
    });
}

/**
 * 初始化事件監聽器
 */
function initEventListeners() {
    // 關閉面板按鈕
    const closePanelBtns = document.querySelectorAll('.close-panel-btn');
    closePanelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 獲取父面板
            const panel = btn.closest('.learning-panel');
            if (panel) {
                panel.classList.remove('active');
            }
        });
    });
}

/**
 * 初始化首頁按鈕
 */
function initHomeButtons() {
    // 開始學習按鈕
    const startLearningBtn = document.getElementById('startLearningBtn');
    if (startLearningBtn) {
        startLearningBtn.addEventListener('click', () => {
            switchPage('flashcards');
            
            // 更新導航鏈接狀態
            const navLinks = document.querySelectorAll('nav a');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === 'flashcards') {
                    link.classList.add('active');
                }
            });
        });
    }
    
    // 匯入單字按鈕
    const importWordsBtn = document.getElementById('importWordsBtn');
    if (importWordsBtn) {
        importWordsBtn.addEventListener('click', () => {
            switchPage('vocabulary');
            
            // 更新導航鏈接狀態
            const navLinks = document.querySelectorAll('nav a');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-page') === 'vocabulary') {
                    link.classList.add('active');
                }
            });
        });
    }
}

/**
 * 初始化模擬數據
 */
function initMockData() {
    // 如果沒有全局數據對象，創建一個
    if (!window.appData) {
        window.appData = {};
    }
    
    // 如果沒有用戶設置，初始化默認設置
    if (!window.appData.userSettings) {
        window.appData.userSettings = {
            username: '學習者',
            dailyGoal: 10,
            theme: 'light',
            pronunciation: 'us',
            streak: 5
        };
    }
    
    // 如果沒有學習統計，初始化默認統計
    if (!window.appData.stats) {
        window.appData.stats = {
            totalWords: 120,
            masteredWords: 75,
            learningDays: 14,
            todayLearned: 7
        };
    }
    
    // 如果沒有詞彙數據，初始化默認詞彙
    if (!window.appData.vocabulary) {
        window.appData.vocabulary = [
            {
                id: 1,
                word: 'apple',
                phonetic: '/ˈæp.əl/',
                partOfSpeech: 'noun',
                meaning: '蘋果',
                definition: '一種常見的圓形水果，外皮為紅色、綠色或黃色，果肉脆甜多汁。',
                examples: [
                    'I eat an apple every day.',
                    'The apple tree in our garden bears fruit each autumn.'
                ],
                status: 'mastered',
                lists: ['all', 'fruits'],
                associations: '紅色的水果，每天一顆遠離醫生',
                contexts: ['水果', '健康食品'],
                synonyms: ['fruit'],
                relatedWords: ['pear', 'orange', 'fruit', 'tree'],
                lastReviewed: new Date()
            },
            {
                id: 2,
                word: 'banana',
                phonetic: '/bəˈnɑː.nə/',
                partOfSpeech: 'noun',
                meaning: '香蕉',
                definition: '一種長形彎曲的水果，外皮為黃色，果肉軟甜。',
                examples: [
                    'Monkeys love to eat bananas.',
                    'I had a banana for breakfast.'
                ],
                status: 'mastered',
                lists: ['all', 'fruits'],
                associations: '黃色的彎曲水果，猴子最愛',
                contexts: ['水果', '早餐'],
                synonyms: ['fruit'],
                relatedWords: ['apple', 'fruit', 'monkey'],
                lastReviewed: new Date()
            },
            {
                id: 3,
                word: 'vocabulary',
                phonetic: '/vəˈkæb.jə.ler.i/',
                partOfSpeech: 'noun',
                meaning: '詞彙、詞彙表',
                definition: '一個人或語言中所有的詞彙總和。',
                examples: [
                    'Reading books is a good way to improve your vocabulary.',
                    'He has an extensive English vocabulary.'
                ],
                status: 'learning',
                lists: ['all', 'language'],
                associations: '單字的集合，學習語言的基礎',
                contexts: ['語言學習', '閱讀'],
                synonyms: ['lexicon', 'wordstock'],
                relatedWords: ['word', 'language', 'dictionary'],
                lastReviewed: new Date()
            },
            {
                id: 4,
                word: 'difficult',
                phonetic: '/ˈdɪf.ɪ.kəlt/',
                partOfSpeech: 'adjective',
                meaning: '困難的、艱難的',
                definition: '需要很多努力或技能才能完成的；不容易的。',
                examples: [
                    'Learning a new language can be difficult.',
                    'She found it difficult to make friends in a new city.'
                ],
                status: 'difficult',
                lists: ['all', 'adjectives'],
                associations: '需要努力克服的事物',
                contexts: ['學習', '挑戰'],
                synonyms: ['hard', 'challenging', 'tough'],
                relatedWords: ['easy', 'simple', 'complex', 'challenge'],
                lastReviewed: new Date()
            }
        ];
    }
}

/**
 * 發音單字
 * @param {string} word - 要發音的單字
 */
function pronounceWord(word) {
    if (!word) return;
    
    // 使用Web Speech API進行發音
    const speech = new SpeechSynthesisUtterance(word);
    
    // 設置語言和口音
    speech.lang = 'en-US';
    
    // 如果用戶設置了英式發音，更改語言設置
    if (window.appData && window.appData.userSettings && window.appData.userSettings.pronunciation === 'uk') {
        speech.lang = 'en-GB';
    }
    
    // 發音
    window.speechSynthesis.speak(speech);
}

/**
 * 保存應用數據
 */
function saveAppData() {
    if (window.appData) {
        try {
            localStorage.setItem('vocabMasterData', JSON.stringify(window.appData));
            return true;
        } catch (e) {
            console.error('保存數據失敗：', e);
            return false;
        }
    }
    return false;
}

/**
 * 載入應用數據
 */
function loadAppData() {
    try {
        const savedData = localStorage.getItem('vocabMasterData');
        if (savedData) {
            window.appData = JSON.parse(savedData);
            return true;
        }
    } catch (e) {
        console.error('載入數據失敗：', e);
    }
    return false;
}

// 全局UI控制對象
window.appUI = {
    // 打開模態框
    openModal: function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
        }
    },
    
    // 關閉模態框
    closeModal: function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modalOverlay');
        
        if (modal) {
            modal.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }
    },
    
    // 顯示面板
    showPanel: function(panelId) {
        const panel = document.getElementById(panelId);
        
        if (panel) {
            // 隱藏所有面板
            const panels = document.querySelectorAll('.learning-panel');
            panels.forEach(p => {
                p.classList.remove('active');
            });
            
            // 顯示目標面板
            panel.classList.add('active');
        }
    },
    
    // 隱藏面板
    hidePanel: function(panelId) {
        const panel = document.getElementById(panelId);
        
        if (panel) {
            panel.classList.remove('active');
        }
    }
}; 