/**
 * 單字記憶大師 - 進度追蹤模組
 * 負責學習統計、成就系統和圖表顯示功能
 */

document.addEventListener('DOMContentLoaded', () => {
    initProgressModule();
});

/**
 * 初始化進度追蹤模組
 */
function initProgressModule() {
    // 確保在進度頁面才初始化
    if (!document.getElementById('progress')) {
        return;
    }
    
    // 初始化統計摘要
    initStatsSummary();
    
    // 初始化學習曲線圖表
    initLearningCurveChart();
    
    // 初始化詞彙類別圖表
    initVocabCategoryChart();
    
    // 初始化成就系統
    initAchievementSystem();
    
    // 初始化學習日誌
    initLearningJournal();
    
    // 初始化日曆熱圖
    initActivityCalendar();
}

/**
 * 初始化統計摘要
 */
function initStatsSummary() {
    // 檢查全局數據是否可用
    if (!window.appData) return;
    
    updateStatsSummary();
    
    // 更新時間選擇器事件
    const timeRangeSelect = document.getElementById('statsTimeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', updateStatsSummary);
    }
}

/**
 * 更新統計摘要
 */
function updateStatsSummary() {
    // 獲取選擇的時間範圍
    const timeRangeSelect = document.getElementById('statsTimeRange');
    const timeRange = timeRangeSelect ? timeRangeSelect.value : 'all';
    
    // 獲取過濾後的學習記錄
    const filteredHistory = filterLearningHistory(timeRange);
    
    // 計算統計數據
    const stats = calculateLearningStats(filteredHistory);
    
    // 更新統計顯示
    updateStatsDisplay(stats);
}

/**
 * 根據時間範圍過濾學習歷史記錄
 * @param {string} timeRange - 時間範圍選項
 * @returns {Array} - 過濾後的學習記錄
 */
function filterLearningHistory(timeRange) {
    if (!window.appData || !window.appData.learningHistory) {
        return [];
    }
    
    const now = new Date();
    const history = window.appData.learningHistory;
    
    switch (timeRange) {
        case 'today':
            // 今天的記錄
            return history.filter(record => {
                const recordDate = new Date(record.timestamp);
                return recordDate.setHours(0,0,0,0) === now.setHours(0,0,0,0);
            });
        case 'week':
            // 最近一週的記錄
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return history.filter(record => {
                const recordDate = new Date(record.timestamp);
                return recordDate >= oneWeekAgo;
            });
        case 'month':
            // 最近一個月的記錄
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return history.filter(record => {
                const recordDate = new Date(record.timestamp);
                return recordDate >= oneMonthAgo;
            });
        case 'all':
        default:
            // 所有記錄
            return [...history];
    }
}

/**
 * 計算學習統計數據
 * @param {Array} history - 學習歷史記錄
 * @returns {Object} - 統計數據對象
 */
function calculateLearningStats(history) {
    // 初始化統計數據
    const stats = {
        totalWords: 0,
        masteredWords: 0,
        learningWords: 0,
        difficultWords: 0,
        streak: 0,
        todayLearned: 0,
        averagePerDay: 0,
        totalTime: 0,
        successRate: 0
    };
    
    // 如果沒有歷史記錄，直接返回初始值
    if (!history || history.length === 0) {
        return stats;
    }
    
    // 從全局數據獲取單字總數
    if (window.appData && window.appData.vocabulary) {
        stats.totalWords = window.appData.vocabulary.length;
        
        // 計算不同狀態的單字數量
        stats.masteredWords = window.appData.vocabulary.filter(w => w.status === 'mastered').length;
        stats.learningWords = window.appData.vocabulary.filter(w => w.status === 'learning').length;
        stats.difficultWords = window.appData.vocabulary.filter(w => w.status === 'difficult').length;
    }
    
    // 計算連續學習天數
    if (window.appData && window.appData.userSettings) {
        stats.streak = window.appData.userSettings.streak || 0;
    }
    
    // 計算今天學習的單字數
    const today = new Date().setHours(0,0,0,0);
    stats.todayLearned = history.filter(record => {
        const recordDate = new Date(record.timestamp).setHours(0,0,0,0);
        return recordDate === today && record.action === 'learn';
    }).length;
    
    // 計算每日平均學習單字數
    // 獲取所有獨特的學習日期
    const learningDays = new Set();
    history.forEach(record => {
        const recordDate = new Date(record.timestamp).setHours(0,0,0,0);
        if (record.action === 'learn') {
            learningDays.add(recordDate.toString());
        }
    });
    
    // 如果有記錄學習天數，計算平均值
    if (learningDays.size > 0) {
        const totalLearned = history.filter(record => record.action === 'learn').length;
        stats.averagePerDay = Math.round(totalLearned / learningDays.size);
    }
    
    // 計算總學習時間（分鐘）
    history.forEach(record => {
        if (record.duration) {
            stats.totalTime += record.duration;
        }
    });
    
    // 計算成功率（正確答案/總答案）
    const totalAnswers = history.filter(record => record.action === 'practice').length;
    const correctAnswers = history.filter(record => record.action === 'practice' && record.result === 'correct').length;
    
    if (totalAnswers > 0) {
        stats.successRate = Math.round((correctAnswers / totalAnswers) * 100);
    }
    
    return stats;
}

/**
 * 更新統計顯示
 * @param {Object} stats - 統計數據
 */
function updateStatsDisplay(stats) {
    // 更新詞彙統計
    document.getElementById('totalWordsValue')?.textContent = stats.totalWords;
    document.getElementById('masteredWordsValue')?.textContent = stats.masteredWords;
    document.getElementById('learningWordsValue')?.textContent = stats.learningWords;
    document.getElementById('difficultWordsValue')?.textContent = stats.difficultWords;
    
    // 更新學習統計
    document.getElementById('streakValue')?.textContent = stats.streak;
    document.getElementById('todayLearnedValue')?.textContent = stats.todayLearned;
    document.getElementById('averagePerDayValue')?.textContent = stats.averagePerDay;
    document.getElementById('totalTimeValue')?.textContent = `${stats.totalTime} 分鐘`;
    document.getElementById('successRateValue')?.textContent = `${stats.successRate}%`;
    
    // 更新進度條
    const masteredPercent = stats.totalWords > 0 ? (stats.masteredWords / stats.totalWords) * 100 : 0;
    const learningPercent = stats.totalWords > 0 ? (stats.learningWords / stats.totalWords) * 100 : 0;
    const difficultPercent = stats.totalWords > 0 ? (stats.difficultWords / stats.totalWords) * 100 : 0;
    
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.innerHTML = `
            <div class="progress-segment mastered" style="width: ${masteredPercent}%" title="已掌握: ${stats.masteredWords}詞"></div>
            <div class="progress-segment learning" style="width: ${learningPercent}%" title="學習中: ${stats.learningWords}詞"></div>
            <div class="progress-segment difficult" style="width: ${difficultPercent}%" title="困難詞: ${stats.difficultWords}詞"></div>
        `;
    }
}

/**
 * 初始化學習曲線圖表
 */
function initLearningCurveChart() {
    const chartCanvas = document.getElementById('learningCurveChart');
    if (!chartCanvas || !window.appData || !window.appData.learningHistory) {
        return;
    }
    
    // 計算每日學習數據
    const dailyData = calculateDailyLearningData();
    
    // 渲染圖表
    renderLearningCurveChart(chartCanvas, dailyData);
    
    // 更新時間範圍選擇器事件
    const timeRangeSelect = document.getElementById('chartTimeRange');
    if (timeRangeSelect) {
        timeRangeSelect.addEventListener('change', () => {
            const dailyData = calculateDailyLearningData(timeRangeSelect.value);
            renderLearningCurveChart(chartCanvas, dailyData);
        });
    }
}

/**
 * 計算每日學習數據
 * @param {string} timeRange - 時間範圍選項
 * @returns {Object} - 包含日期和數據的對象
 */
function calculateDailyLearningData(timeRange = 'month') {
    const history = window.appData.learningHistory;
    const now = new Date();
    let startDate;
    
    // 根據時間範圍設置起始日期
    switch (timeRange) {
        case 'week':
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date();
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'year':
            startDate = new Date();
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date();
            startDate.setMonth(now.getMonth() - 1);
    }
    
    // 產生日期範圍內的所有日期
    const dateLabels = [];
    const dateMap = {};
    let currentDate = new Date(startDate);
    
    while (currentDate <= now) {
        const dateStr = currentDate.toISOString().split('T')[0];
        dateLabels.push(dateStr);
        dateMap[dateStr] = { new: 0, mastered: 0, practice: 0 };
        
        // 移到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 統計各個日期的學習數據
    history.forEach(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        
        // 如果日期在範圍內
        if (dateMap[recordDate]) {
            switch (record.action) {
                case 'learn':
                    dateMap[recordDate].new += 1;
                    break;
                case 'master':
                    dateMap[recordDate].mastered += 1;
                    break;
                case 'practice':
                    dateMap[recordDate].practice += 1;
                    break;
            }
        }
    });
    
    // 將統計數據轉換為圖表所需格式
    const newWords = dateLabels.map(date => dateMap[date].new);
    const masteredWords = dateLabels.map(date => dateMap[date].mastered);
    const practiceCount = dateLabels.map(date => dateMap[date].practice);
    
    return {
        labels: dateLabels,
        newWords,
        masteredWords,
        practiceCount
    };
}

/**
 * 渲染學習曲線圖表
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Object} data - 圖表數據
 */
function renderLearningCurveChart(canvas, data) {
    // 獲取2D繪圖上下文
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 簡單的圖表渲染（這只是一個簡化版，實際應用可能需要使用如Chart.js等圖表庫）
    
    // 設置圖表尺寸和邊距
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = canvas.width - margin.left - margin.right;
    const height = canvas.height - margin.top - margin.bottom;
    
    // 找出數據最大值以確定Y軸範圍
    const allValues = [
        ...data.newWords,
        ...data.masteredWords,
        ...data.practiceCount
    ];
    const maxValue = Math.max(...allValues, 10);
    
    // 繪製坐標軸
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // 繪製X軸標籤（日期）
    const numLabels = Math.min(7, data.labels.length);
    const step = Math.floor(data.labels.length / numLabels) || 1;
    
    ctx.fillStyle = '#333';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < data.labels.length; i += step) {
        const x = margin.left + (i / (data.labels.length - 1)) * width;
        const date = new Date(data.labels[i]);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        
        ctx.fillText(label, x, margin.top + height + 15);
    }
    
    // 繪製Y軸標籤（數量）
    const ySteps = 5;
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= ySteps; i++) {
        const y = margin.top + height - (i / ySteps) * height;
        const value = Math.round((i / ySteps) * maxValue);
        ctx.fillText(value.toString(), margin.left - 5, y + 3);
    }
    
    // 繪製新單字曲線
    ctx.beginPath();
    for (let i = 0; i < data.newWords.length; i++) {
        const x = margin.left + (i / (data.labels.length - 1)) * width;
        const y = margin.top + height - (data.newWords[i] / maxValue) * height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 繪製已掌握單字曲線
    ctx.beginPath();
    for (let i = 0; i < data.masteredWords.length; i++) {
        const x = margin.left + (i / (data.labels.length - 1)) * width;
        const y = margin.top + height - (data.masteredWords[i] / maxValue) * height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 繪製練習次數曲線
    ctx.beginPath();
    for (let i = 0; i < data.practiceCount.length; i++) {
        const x = margin.left + (i / (data.labels.length - 1)) * width;
        const y = margin.top + height - (data.practiceCount[i] / maxValue) * height;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 繪製圖例
    const legendY = margin.top + 10;
    
    // 新單字圖例
    ctx.beginPath();
    ctx.moveTo(margin.left + 20, legendY);
    ctx.lineTo(margin.left + 50, legendY);
    ctx.strokeStyle = '#4CAF50';
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('新單字', margin.left + 55, legendY + 3);
    
    // 已掌握單字圖例
    ctx.beginPath();
    ctx.moveTo(margin.left + 120, legendY);
    ctx.lineTo(margin.left + 150, legendY);
    ctx.strokeStyle = '#2196F3';
    ctx.stroke();
    ctx.fillText('已掌握', margin.left + 155, legendY + 3);
    
    // 練習次數圖例
    ctx.beginPath();
    ctx.moveTo(margin.left + 220, legendY);
    ctx.lineTo(margin.left + 250, legendY);
    ctx.strokeStyle = '#FF9800';
    ctx.stroke();
    ctx.fillText('練習次數', margin.left + 255, legendY + 3);
}

/**
 * 初始化詞彙類別圖表
 */
function initVocabCategoryChart() {
    const chartCanvas = document.getElementById('vocabCategoryChart');
    if (!chartCanvas || !window.appData || !window.appData.vocabulary) {
        return;
    }
    
    // 計算詞彙類別數據
    const categoryData = calculateVocabCategoryData();
    
    // 渲染圖表
    renderVocabCategoryChart(chartCanvas, categoryData);
}

/**
 * 計算詞彙類別數據
 * @returns {Object} - 包含類別名稱和數量的對象
 */
function calculateVocabCategoryData() {
    const vocabulary = window.appData.vocabulary;
    const categories = {};
    
    // 統計各詞彙類別的數量
    vocabulary.forEach(word => {
        if (word.category) {
            categories[word.category] = (categories[word.category] || 0) + 1;
        } else {
            categories['其他'] = (categories['其他'] || 0) + 1;
        }
    });
    
    // 轉換為數組格式
    const categoryData = Object.entries(categories)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    return categoryData;
}

/**
 * 渲染詞彙類別圖表
 * @param {HTMLCanvasElement} canvas - Canvas元素
 * @param {Array} data - 圖表數據
 */
function renderVocabCategoryChart(canvas, data) {
    // 獲取2D繪圖上下文
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 簡單的餅圖渲染（這只是一個簡化版，實際應用可能需要使用如Chart.js等圖表庫）
    
    // 設置圖表尺寸和中心點
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    // 計算總數
    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    // 定義顏色
    const colors = [
        '#4CAF50', '#2196F3', '#FF9800', '#F44336', '#9C27B0',
        '#00BCD4', '#FFEB3B', '#795548', '#607D8B', '#3F51B5'
    ];
    
    // 繪製餅圖
    let startAngle = 0;
    const legend = [];
    
    data.forEach((item, index) => {
        const sliceAngle = (item.count / total) * 2 * Math.PI;
        
        // 繪製餅圖扇形
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        
        // 設置填充顏色
        const colorIndex = index % colors.length;
        ctx.fillStyle = colors[colorIndex];
        ctx.fill();
        
        // 添加到圖例
        legend.push({
            name: item.name,
            count: item.count,
            percentage: Math.round((item.count / total) * 100),
            color: colors[colorIndex]
        });
        
        // 更新起始角度
        startAngle += sliceAngle;
    });
    
    // 繪製圖例
    const legendX = 20;
    let legendY = canvas.height - 20 - (legend.length * 20);
    
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    
    legend.forEach(item => {
        // 繪製圖例顏色方塊
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, legendY - 10, 15, 15);
        
        // 繪製圖例文字
        ctx.fillStyle = '#333';
        ctx.fillText(`${item.name}: ${item.count} (${item.percentage}%)`, legendX + 25, legendY);
        
        legendY += 20;
    });
}

/**
 * 初始化成就系統
 */
function initAchievementSystem() {
    // 從全局數據中獲取成就
    if (!window.appData || !window.appData.achievements) {
        return;
    }
    
    // 更新成就顯示
    updateAchievementDisplay();
}

/**
 * 更新成就顯示
 */
function updateAchievementDisplay() {
    const achievements = window.appData.achievements;
    const achievementsContainer = document.getElementById('achievementsList');
    
    if (!achievementsContainer) return;
    
    // 清空容器
    achievementsContainer.innerHTML = '';
    
    // 排序成就（先顯示已解鎖的）
    const sortedAchievements = [...achievements].sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
    });
    
    // 創建成就項目
    sortedAchievements.forEach(achievement => {
        const achievementItem = document.createElement('div');
        achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
        
        achievementItem.innerHTML = `
            <div class="achievement-icon">
                <i class="fas ${achievement.icon}"></i>
            </div>
            <div class="achievement-info">
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                ${achievement.progress ? `
                <div class="achievement-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                    </div>
                    <span>${achievement.progress}%</span>
                </div>
                ` : ''}
            </div>
        `;
        
        achievementsContainer.appendChild(achievementItem);
    });
}

/**
 * 初始化學習日誌
 */
function initLearningJournal() {
    // 從全局數據中獲取日誌記錄
    if (!window.appData || !window.appData.journal) {
        return;
    }
    
    // 更新日誌顯示
    updateJournalDisplay();
    
    // 綁定日誌輸入事件
    const journalForm = document.getElementById('journalForm');
    if (journalForm) {
        journalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addJournalEntry();
        });
    }
}

/**
 * 更新日誌顯示
 */
function updateJournalDisplay() {
    const journal = window.appData.journal;
    const journalContainer = document.getElementById('journalEntries');
    
    if (!journalContainer) return;
    
    // 清空容器
    journalContainer.innerHTML = '';
    
    // 按日期排序日誌（降序）
    const sortedEntries = [...journal].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    // 創建日誌項目
    sortedEntries.forEach(entry => {
        const entryDate = new Date(entry.date);
        const formattedDate = `${entryDate.getFullYear()}/${entryDate.getMonth() + 1}/${entryDate.getDate()}`;
        
        const entryItem = document.createElement('div');
        entryItem.className = 'journal-entry';
        
        entryItem.innerHTML = `
            <div class="journal-date">${formattedDate}</div>
            <div class="journal-content">
                <p>${entry.content}</p>
                <div class="journal-words">
                    ${entry.words.map(word => `<span class="journal-word">${word}</span>`).join(' ')}
                </div>
            </div>
        `;
        
        journalContainer.appendChild(entryItem);
    });
}

/**
 * 添加日誌記錄
 */
function addJournalEntry() {
    const journalInput = document.getElementById('journalInput');
    const journalWords = document.getElementById('journalWords');
    
    if (!journalInput || !journalWords) return;
    
    const content = journalInput.value.trim();
    const wordsInput = journalWords.value.trim();
    
    if (!content) {
        alert('請輸入日誌內容');
        return;
    }
    
    // 解析單字列表
    const words = wordsInput.split(',').map(word => word.trim()).filter(word => word);
    
    // 創建新的日誌記錄
    const newEntry = {
        date: new Date().toISOString(),
        content,
        words
    };
    
    // 添加到全局數據
    window.appData.journal.push(newEntry);
    
    // 保存數據到本地存儲
    saveAppData();
    
    // 更新日誌顯示
    updateJournalDisplay();
    
    // 清空輸入框
    journalInput.value = '';
    journalWords.value = '';
}

/**
 * 初始化活動日曆熱圖
 */
function initActivityCalendar() {
    // 檢查是否有日曆容器
    const calendarContainer = document.getElementById('activityCalendar');
    if (!calendarContainer || !window.appData || !window.appData.learningHistory) {
        return;
    }
    
    // 生成活動熱圖
    generateActivityCalendar(calendarContainer);
}

/**
 * 生成活動日曆熱圖
 * @param {HTMLElement} container - 容器元素
 */
function generateActivityCalendar(container) {
    // 獲取當前日期
    const today = new Date();
    const endDate = new Date(today);
    
    // 設置起始日期（52週前）
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (52 * 7));
    
    // 計算每天的活動數據
    const activityData = calculateDailyActivity(startDate, endDate);
    
    // 清空容器
    container.innerHTML = '';
    
    // 創建日曆網格
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'calendar-grid';
    
    // 添加星期標籤
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDayLabels = document.createElement('div');
    weekDayLabels.className = 'weekday-labels';
    
    weekDays.forEach(day => {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'weekday-label';
        dayLabel.textContent = day;
        weekDayLabels.appendChild(dayLabel);
    });
    
    container.appendChild(weekDayLabels);
    
    // 創建月份標籤
    const monthLabels = document.createElement('div');
    monthLabels.className = 'month-labels';
    
    // 獲取日曆中顯示的月份
    const months = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        if (!months.includes(month)) {
            months.push(month);
        }
        currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // 創建月份標籤
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    months.forEach(month => {
        const monthLabel = document.createElement('div');
        monthLabel.className = 'month-label';
        monthLabel.textContent = monthNames[month];
        monthLabels.appendChild(monthLabel);
    });
    
    container.appendChild(monthLabels);
    
    // 創建日曆網格
    container.appendChild(calendarGrid);
    
    // 填充日曆格子
    currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDateStr(currentDate);
        const activity = activityData[dateStr] || 0;
        
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        cell.setAttribute('data-date', dateStr);
        cell.setAttribute('data-count', activity);
        
        // 設置活動強度等級
        if (activity > 0) {
            let level = 1;
            if (activity >= 5) level = 4;
            else if (activity >= 3) level = 3;
            else if (activity >= 2) level = 2;
            
            cell.classList.add(`level-${level}`);
        }
        
        // 添加懸停提示
        cell.title = `${dateStr}: ${activity} 活動`;
        
        calendarGrid.appendChild(cell);
        
        // 移到下一天
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

/**
 * 計算每日活動數據
 * @param {Date} startDate - 起始日期
 * @param {Date} endDate - 結束日期
 * @returns {Object} - 日期活動數據映射
 */
function calculateDailyActivity(startDate, endDate) {
    const activityData = {};
    const history = window.appData.learningHistory;
    
    // 初始化日期範圍內的所有日期
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDateStr(currentDate);
        activityData[dateStr] = 0;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 統計每天的活動數量
    history.forEach(record => {
        const recordDate = new Date(record.timestamp);
        if (recordDate >= startDate && recordDate <= endDate) {
            const dateStr = formatDateStr(recordDate);
            activityData[dateStr] = (activityData[dateStr] || 0) + 1;
        }
    });
    
    return activityData;
}

/**
 * 格式化日期字符串（YYYY-MM-DD）
 * @param {Date} date - 日期
 * @returns {string} - 格式化的日期字符串
 */
function formatDateStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
} 