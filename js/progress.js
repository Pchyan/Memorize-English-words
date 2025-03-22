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
async function initProgressModule() {
    // 確保在進度頁面才初始化
    if (!document.getElementById('progress')) {
        return;
    }
    
    // 初始化統計摘要
    await initStatsSummary();
    
    // 初始化學習曲線圖表
    await initLearningCurveChart();
    
    // 初始化成就系統
    await initAchievementSystem();
    
    // 初始化學習日誌
    await initLearningJournal();
    
    // 初始化活動日曆
    await initActivityCalendar();
}

/**
 * 初始化統計摘要
 */
async function initStatsSummary() {
    try {
        // 獲取所有單字
        const words = await window.db.getAllWords();
        
        // 計算各狀態的單字數量
        const stats = {
            total: words.length,
            mastered: words.filter(w => w.status === 'mastered').length,
            learning: words.filter(w => w.status === 'learning').length,
            notLearned: words.filter(w => w.status === 'notLearned').length
        };
        
        // 更新統計顯示
        document.getElementById('totalWordsValue').textContent = stats.total;
        
        // 更新進度條
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar && stats.total > 0) {
            const masteredPercent = (stats.mastered / stats.total) * 100;
            const learningPercent = (stats.learning / stats.total) * 100;
            const notLearnedPercent = (stats.notLearned / stats.total) * 100;
            
            progressBar.innerHTML = `
                <div class="progress-segment mastered" style="width: ${masteredPercent}%" title="已掌握: ${stats.mastered}詞"></div>
                <div class="progress-segment learning" style="width: ${learningPercent}%" title="學習中: ${stats.learning}詞"></div>
                <div class="progress-segment difficult" style="width: ${notLearnedPercent}%" title="未學習: ${stats.notLearned}詞"></div>
            `;
        }
        
        // 計算連續學習天數
        const streak = await calculateLearningStreak();
        document.getElementById('streakValue').textContent = streak;
        
        // 計算今日學習數量
        const todayLearned = await calculateTodayLearned();
        document.getElementById('todayLearnedValue').textContent = todayLearned;
        
        // 計算平均每日學習量
        const averagePerDay = await calculateAveragePerDay();
        document.getElementById('averagePerDayValue').textContent = averagePerDay;
        
    } catch (error) {
        console.error('初始化統計摘要失敗:', error);
        showNotification('載入統計資料失敗', 'error');
    }
}

/**
 * 計算連續學習天數
 */
async function calculateLearningStreak() {
    try {
        const history = await window.db.getLearningHistory();
        if (!history || history.length === 0) return 0;
        
        const today = new Date().setHours(0, 0, 0, 0);
        let streak = 0;
        let currentDate = today;
        
        // 按日期分組學習記錄
        const learningDays = new Set(
            history.map(record => 
                new Date(record.timestamp).setHours(0, 0, 0, 0)
            )
        );
        
        // 從今天開始往前數，直到找到第一個沒有學習的日期
        while (learningDays.has(currentDate)) {
            streak++;
            currentDate -= 86400000; // 減去一天的毫秒數
        }
        
        return streak;
    } catch (error) {
        console.error('計算連續學習天數失敗:', error);
        return 0;
    }
}

/**
 * 計算今日學習數量
 */
async function calculateTodayLearned() {
    try {
        const history = await window.db.getLearningHistory();
        if (!history || history.length === 0) return 0;
        
        const today = new Date().setHours(0, 0, 0, 0);
        
        return history.filter(record => 
            new Date(record.timestamp).setHours(0, 0, 0, 0) === today
        ).length;
    } catch (error) {
        console.error('計算今日學習數量失敗:', error);
        return 0;
    }
}

/**
 * 計算平均每日學習量
 */
async function calculateAveragePerDay() {
    try {
        const history = await window.db.getLearningHistory();
        if (!history || history.length === 0) return 0;
        
        // 按日期分組學習記錄
        const learningDays = new Set(
            history.map(record => 
                new Date(record.timestamp).setHours(0, 0, 0, 0)
            )
        );
        
        return Math.round(history.length / learningDays.size);
    } catch (error) {
        console.error('計算平均每日學習量失敗:', error);
        return 0;
    }
}

/**
 * 初始化學習曲線圖表
 */
async function initLearningCurveChart() {
    const chartCanvas = document.getElementById('learningCurveChart');
    if (!chartCanvas) return;
    
    try {
        const history = await window.db.getLearningHistory();
        if (!history || history.length === 0) {
            chartCanvas.innerHTML = '<div class="no-data">尚無學習記錄</div>';
            return;
        }
        
        // 按日期分組並計算每日學習量
        const dailyData = {};
        history.forEach(record => {
            const date = new Date(record.timestamp).toISOString().split('T')[0];
            dailyData[date] = (dailyData[date] || 0) + 1;
        });
        
        // 轉換為圖表數據格式
        const labels = Object.keys(dailyData).sort();
        const data = labels.map(date => dailyData[date]);
        
        // 使用Chart.js繪製圖表
        new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '每日學習量',
                    data: data,
                    borderColor: '#4299e1',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    } catch (error) {
        console.error('初始化學習曲線圖表失敗:', error);
        chartCanvas.innerHTML = '<div class="error">載入圖表失敗</div>';
    }
}

/**
 * 初始化成就系統
 */
async function initAchievementSystem() {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;
    
    try {
        // 定義成就列表
        const achievements = [
            {
                id: 'firstWord',
                title: '初次學習',
                description: '學習第一個單字',
                icon: 'fa-star',
                condition: stats => stats.totalWords > 0
            },
            {
                id: 'tenWords',
                title: '小有成就',
                description: '學習10個單字',
                icon: 'fa-book',
                condition: stats => stats.totalWords >= 10
            },
            {
                id: 'hundredWords',
                title: '詞彙達人',
                description: '學習100個單字',
                icon: 'fa-graduation-cap',
                condition: stats => stats.totalWords >= 100
            },
            {
                id: 'streak3',
                title: '持之以恆',
                description: '連續學習3天',
                icon: 'fa-fire',
                condition: stats => stats.streak >= 3
            },
            {
                id: 'streak7',
                title: '一週不間斷',
                description: '連續學習7天',
                icon: 'fa-calendar-check',
                condition: stats => stats.streak >= 7
            }
        ];
        
        // 獲取當前統計數據
        const words = await window.db.getAllWords();
        const streak = await calculateLearningStreak();
        
        const stats = {
            totalWords: words.length,
            streak: streak
        };
        
        // 生成成就卡片
        container.innerHTML = achievements.map(achievement => {
            const isUnlocked = achievement.condition(stats);
            return `
                <div class="achievement-card ${isUnlocked ? '' : 'locked'}">
                    <div class="achievement-icon">
                        <i class="fas ${achievement.icon}"></i>
                    </div>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('初始化成就系統失敗:', error);
        container.innerHTML = '<div class="error">載入成就失敗</div>';
    }
}

/**
 * 初始化學習日誌
 */
async function initLearningJournal() {
    const container = document.getElementById('journalContainer');
    if (!container) return;
    
    try {
        const journal = await window.db.getLearningJournal();
        if (!journal || journal.length === 0) {
            container.innerHTML = '<div class="no-data">尚無學習日誌</div>';
            return;
        }
        
        // 顯示最近的10條日誌
        container.innerHTML = journal
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map(entry => `
                <div class="journal-entry">
                    <div class="journal-date">${new Date(entry.timestamp).toLocaleDateString()}</div>
                    <div class="journal-content">${entry.content}</div>
                </div>
            `).join('');
        
        // 綁定新增日誌按鈕事件
        const addButton = document.getElementById('addJournalBtn');
        if (addButton) {
            addButton.addEventListener('click', showAddJournalDialog);
        }
        
    } catch (error) {
        console.error('初始化學習日誌失敗:', error);
        container.innerHTML = '<div class="error">載入日誌失敗</div>';
    }
}

/**
 * 顯示新增日誌對話框
 */
function showAddJournalDialog() {
    // 創建對話框
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>新增學習日誌</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <textarea id="journalContent" placeholder="記錄今天的學習心得..." rows="5"></textarea>
                <div class="form-actions">
                    <button class="btn secondary close-modal">取消</button>
                    <button class="btn primary" id="saveJournalBtn">儲存</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // 綁定事件
    const closeButtons = dialog.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
    });
    
    const saveButton = dialog.querySelector('#saveJournalBtn');
    saveButton.addEventListener('click', async () => {
        const content = dialog.querySelector('#journalContent').value.trim();
        if (!content) {
            showNotification('請輸入日誌內容', 'error');
            return;
        }
        
        try {
            await window.db.addJournalEntry({
                content,
                timestamp: new Date().toISOString()
            });
            
            document.body.removeChild(dialog);
            await initLearningJournal();
            showNotification('日誌已儲存', 'success');
        } catch (error) {
            console.error('儲存日誌失敗:', error);
            showNotification('儲存日誌失敗', 'error');
        }
    });
}

/**
 * 初始化活動日曆
 */
async function initActivityCalendar() {
    const container = document.getElementById('activityCalendar');
    if (!container) return;
    
    try {
        const history = await window.db.getLearningHistory();
        if (!history || history.length === 0) {
            container.innerHTML = '<div class="no-data">尚無學習記錄</div>';
            return;
        }
        
        // 計算過去一年的每日活動量
        const dailyActivity = {};
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        // 初始化所有日期
        for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyActivity[dateStr] = 0;
        }
        
        // 統計每日活動量
        history.forEach(record => {
            const date = new Date(record.timestamp).toISOString().split('T')[0];
            if (dailyActivity[date] !== undefined) {
                dailyActivity[date]++;
            }
        });
        
        // 生成日曆格子
        container.innerHTML = Object.entries(dailyActivity)
            .map(([date, count]) => {
                let level = 0;
                if (count > 0) level = 1;
                if (count >= 5) level = 2;
                if (count >= 10) level = 3;
                if (count >= 20) level = 4;
                
                return `
                    <div class="calendar-day" 
                         data-date="${date}" 
                         data-level="${level}"
                         title="${date}: ${count}個活動">
                    </div>
                `;
            })
            .join('');
        
    } catch (error) {
        console.error('初始化活動日曆失敗:', error);
        container.innerHTML = '<div class="error">載入活動日曆失敗</div>';
    }
} 