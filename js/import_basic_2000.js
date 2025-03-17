/**
 * 導入台灣國中英文基礎2000單字
 */
function importBasic2000Words() {
    console.log('開始匯入台灣國中英文基礎2000單字...');
    
    // 確保 window.appData 已初始化
    if (!window.appData) {
        console.log('window.appData 不存在，初始化為空對象');
        window.appData = {};
    }
    
    // 確保 window.appData.vocabulary 是一個陣列
    if (!window.appData.vocabulary) {
        console.log('window.appData.vocabulary 不存在，初始化為空陣列');
        window.appData.vocabulary = [];
    } else if (!Array.isArray(window.appData.vocabulary)) {
        console.log('window.appData.vocabulary 不是陣列，重新初始化為空陣列');
        window.appData.vocabulary = [];
    }
    
    // 台灣國中英文基礎2000單字
    const basic2000Words = [
        // A
        { word: "ability", meaning: "能力", partOfSpeech: "n" },
        { word: "abroad", meaning: "在國外", partOfSpeech: "adv" },
        { word: "absolute", meaning: "絕對的", partOfSpeech: "adj" },
        { word: "accept", meaning: "接受", partOfSpeech: "v" },
        { word: "accident", meaning: "意外", partOfSpeech: "n" },
        { word: "accomplish", meaning: "完成", partOfSpeech: "v" },
        { word: "according", meaning: "根據", partOfSpeech: "prep" },
        { word: "account", meaning: "帳戶", partOfSpeech: "n" },
        { word: "accurate", meaning: "準確的", partOfSpeech: "adj" },
        { word: "achieve", meaning: "達成", partOfSpeech: "v" },
        { word: "acknowledge", meaning: "承認", partOfSpeech: "v" },
        { word: "acquire", meaning: "獲得", partOfSpeech: "v" },
        { word: "across", meaning: "橫過", partOfSpeech: "prep" },
        { word: "action", meaning: "行動", partOfSpeech: "n" },
        { word: "active", meaning: "活躍的", partOfSpeech: "adj" },
        { word: "actual", meaning: "實際的", partOfSpeech: "adj" },
        { word: "adapt", meaning: "適應", partOfSpeech: "v" },
        { word: "add", meaning: "添加", partOfSpeech: "v" },
        { word: "addition", meaning: "加法", partOfSpeech: "n" },
        { word: "additional", meaning: "額外的", partOfSpeech: "adj" },
        { word: "address", meaning: "地址", partOfSpeech: "n" },
        { word: "adequate", meaning: "足夠的", partOfSpeech: "adj" },
        { word: "adjust", meaning: "調整", partOfSpeech: "v" },
        { word: "administration", meaning: "行政", partOfSpeech: "n" },
        { word: "admire", meaning: "欽佩", partOfSpeech: "v" },
        { word: "admit", meaning: "承認", partOfSpeech: "v" },
        { word: "adopt", meaning: "採用", partOfSpeech: "v" },
        { word: "adult", meaning: "成年人", partOfSpeech: "n" },
        { word: "advance", meaning: "前進", partOfSpeech: "v" },
        { word: "advantage", meaning: "優勢", partOfSpeech: "n" },
        
        // B
        { word: "background", meaning: "背景", partOfSpeech: "n" },
        { word: "balance", meaning: "平衡", partOfSpeech: "n" },
        { word: "band", meaning: "樂隊", partOfSpeech: "n" },
        { word: "bank", meaning: "銀行", partOfSpeech: "n" },
        { word: "bar", meaning: "酒吧", partOfSpeech: "n" },
        { word: "bare", meaning: "赤裸的", partOfSpeech: "adj" },
        { word: "bargain", meaning: "討價還價", partOfSpeech: "v" },
        { word: "barrier", meaning: "障礙", partOfSpeech: "n" },
        { word: "base", meaning: "基礎", partOfSpeech: "n" },
        { word: "basic", meaning: "基本的", partOfSpeech: "adj" },
        { word: "basis", meaning: "基礎", partOfSpeech: "n" },
        { word: "bear", meaning: "熊", partOfSpeech: "n" },
        { word: "beat", meaning: "打擊", partOfSpeech: "v" },
        { word: "beautiful", meaning: "美麗的", partOfSpeech: "adj" },
        { word: "beauty", meaning: "美麗", partOfSpeech: "n" },
        { word: "because", meaning: "因為", partOfSpeech: "conj" },
        { word: "become", meaning: "成為", partOfSpeech: "v" },
        { word: "bed", meaning: "床", partOfSpeech: "n" },
        { word: "before", meaning: "在...之前", partOfSpeech: "prep" },
        { word: "begin", meaning: "開始", partOfSpeech: "v" },
        { word: "behavior", meaning: "行為", partOfSpeech: "n" },
        { word: "behind", meaning: "在...後面", partOfSpeech: "prep" },
        { word: "believe", meaning: "相信", partOfSpeech: "v" },
        { word: "belong", meaning: "屬於", partOfSpeech: "v" },
        { word: "below", meaning: "在...下面", partOfSpeech: "prep" },
        { word: "beneath", meaning: "在...下面", partOfSpeech: "prep" },
        { word: "benefit", meaning: "利益", partOfSpeech: "n" },
        { word: "beside", meaning: "在...旁邊", partOfSpeech: "prep" },
        { word: "besides", meaning: "除了", partOfSpeech: "prep" },
        { word: "best", meaning: "最好的", partOfSpeech: "adj" },
        
        // C
        { word: "cable", meaning: "電纜", partOfSpeech: "n" },
        { word: "calculate", meaning: "計算", partOfSpeech: "v" },
        { word: "calendar", meaning: "日曆", partOfSpeech: "n" },
        { word: "call", meaning: "打電話", partOfSpeech: "v" },
        { word: "calm", meaning: "平靜的", partOfSpeech: "adj" },
        { word: "camera", meaning: "相機", partOfSpeech: "n" },
        { word: "camp", meaning: "營地", partOfSpeech: "n" },
        { word: "campaign", meaning: "活動", partOfSpeech: "n" },
        { word: "campus", meaning: "校園", partOfSpeech: "n" },
        { word: "can", meaning: "能夠", partOfSpeech: "v" },
        { word: "cancel", meaning: "取消", partOfSpeech: "v" },
        { word: "cancer", meaning: "癌症", partOfSpeech: "n" },
        { word: "candidate", meaning: "候選人", partOfSpeech: "n" },
        { word: "cap", meaning: "帽子", partOfSpeech: "n" },
        { word: "capability", meaning: "能力", partOfSpeech: "n" },
        { word: "capable", meaning: "有能力的", partOfSpeech: "adj" },
        { word: "capacity", meaning: "容量", partOfSpeech: "n" },
        { word: "capital", meaning: "首都", partOfSpeech: "n" },
        { word: "capture", meaning: "捕捉", partOfSpeech: "v" },
        { word: "car", meaning: "汽車", partOfSpeech: "n" },
        { word: "care", meaning: "關心", partOfSpeech: "v" },
        { word: "career", meaning: "職業", partOfSpeech: "n" },
        { word: "careful", meaning: "小心的", partOfSpeech: "adj" },
        { word: "carry", meaning: "攜帶", partOfSpeech: "v" },
        { word: "case", meaning: "案例", partOfSpeech: "n" },
        { word: "cash", meaning: "現金", partOfSpeech: "n" },
        { word: "cast", meaning: "投擲", partOfSpeech: "v" },
        { word: "catch", meaning: "抓住", partOfSpeech: "v" },
        { word: "category", meaning: "類別", partOfSpeech: "n" },
        { word: "cause", meaning: "原因", partOfSpeech: "n" },
        { word: "celebrate", meaning: "慶祝", partOfSpeech: "v" },
        
        // D
        { word: "damage", meaning: "損害", partOfSpeech: "n" },
        { word: "dangerous", meaning: "危險的", partOfSpeech: "adj" },
        { word: "database", meaning: "資料庫", partOfSpeech: "n" },
        { word: "deadline", meaning: "截止日期", partOfSpeech: "n" },
        { word: "debate", meaning: "辯論", partOfSpeech: "n" },
        { word: "decade", meaning: "十年", partOfSpeech: "n" },
        { word: "decision", meaning: "決定", partOfSpeech: "n" },
        { word: "declare", meaning: "宣布", partOfSpeech: "v" },
        { word: "decline", meaning: "下降", partOfSpeech: "v" },
        { word: "decrease", meaning: "減少", partOfSpeech: "v" },
        { word: "dedicate", meaning: "奉獻", partOfSpeech: "v" },
        { word: "defeat", meaning: "打敗", partOfSpeech: "v" },
        { word: "defend", meaning: "防守", partOfSpeech: "v" },
        { word: "define", meaning: "定義", partOfSpeech: "v" },
        { word: "degree", meaning: "學位", partOfSpeech: "n" },
        { word: "delay", meaning: "延遲", partOfSpeech: "v" },
        { word: "deliver", meaning: "遞送", partOfSpeech: "v" },
        { word: "demand", meaning: "要求", partOfSpeech: "v" },
        { word: "democracy", meaning: "民主", partOfSpeech: "n" },
        { word: "demonstrate", meaning: "展示", partOfSpeech: "v" },
        { word: "deny", meaning: "否認", partOfSpeech: "v" },
        { word: "department", meaning: "部門", partOfSpeech: "n" },
        { word: "depend", meaning: "依賴", partOfSpeech: "v" },
        { word: "deposit", meaning: "存款", partOfSpeech: "n" },
        { word: "depression", meaning: "憂鬱", partOfSpeech: "n" },
        { word: "depth", meaning: "深度", partOfSpeech: "n" },
        { word: "describe", meaning: "描述", partOfSpeech: "v" },
        { word: "desert", meaning: "沙漠", partOfSpeech: "n" },
        { word: "design", meaning: "設計", partOfSpeech: "v" },
        { word: "desire", meaning: "慾望", partOfSpeech: "n" },
        
        // E
        { word: "eager", meaning: "渴望的", partOfSpeech: "adj" },
        { word: "earn", meaning: "賺取", partOfSpeech: "v" },
        { word: "earthquake", meaning: "地震", partOfSpeech: "n" },
        { word: "economy", meaning: "經濟", partOfSpeech: "n" },
        { word: "edge", meaning: "邊緣", partOfSpeech: "n" },
        { word: "edit", meaning: "編輯", partOfSpeech: "v" },
        { word: "educate", meaning: "教育", partOfSpeech: "v" },
        { word: "effect", meaning: "影響", partOfSpeech: "n" },
        { word: "efficient", meaning: "有效率的", partOfSpeech: "adj" },
        { word: "effort", meaning: "努力", partOfSpeech: "n" },
        { word: "elderly", meaning: "年長的", partOfSpeech: "adj" },
        { word: "elect", meaning: "選舉", partOfSpeech: "v" },
        { word: "electric", meaning: "電的", partOfSpeech: "adj" },
        { word: "element", meaning: "元素", partOfSpeech: "n" },
        { word: "eliminate", meaning: "消除", partOfSpeech: "v" },
        { word: "emergency", meaning: "緊急情況", partOfSpeech: "n" },
        { word: "emotion", meaning: "情緒", partOfSpeech: "n" },
        { word: "emphasis", meaning: "強調", partOfSpeech: "n" },
        { word: "employ", meaning: "僱用", partOfSpeech: "v" },
        { word: "enable", meaning: "使能夠", partOfSpeech: "v" },
        { word: "encourage", meaning: "鼓勵", partOfSpeech: "v" },
        { word: "energy", meaning: "能量", partOfSpeech: "n" },
        { word: "engage", meaning: "參與", partOfSpeech: "v" },
        { word: "enhance", meaning: "提升", partOfSpeech: "v" },
        { word: "enormous", meaning: "巨大的", partOfSpeech: "adj" },
        { word: "ensure", meaning: "確保", partOfSpeech: "v" },
        { word: "enterprise", meaning: "企業", partOfSpeech: "n" },
        { word: "entertain", meaning: "娛樂", partOfSpeech: "v" },
        { word: "environment", meaning: "環境", partOfSpeech: "n" },
        { word: "equal", meaning: "相等的", partOfSpeech: "adj" },
        
        // F
        { word: "fabric", meaning: "布料", partOfSpeech: "n" },
        { word: "facility", meaning: "設施", partOfSpeech: "n" },
        { word: "factor", meaning: "因素", partOfSpeech: "n" },
        { word: "factory", meaning: "工廠", partOfSpeech: "n" },
        { word: "failure", meaning: "失敗", partOfSpeech: "n" },
        { word: "faith", meaning: "信仰", partOfSpeech: "n" },
        { word: "familiar", meaning: "熟悉的", partOfSpeech: "adj" },
        { word: "famous", meaning: "著名的", partOfSpeech: "adj" },
        { word: "fantastic", meaning: "極好的", partOfSpeech: "adj" },
        { word: "fashion", meaning: "時尚", partOfSpeech: "n" },
        { word: "fasten", meaning: "繫緊", partOfSpeech: "v" },
        { word: "fatal", meaning: "致命的", partOfSpeech: "adj" },
        { word: "fault", meaning: "過錯", partOfSpeech: "n" },
        { word: "favor", meaning: "恩惠", partOfSpeech: "n" },
        { word: "feature", meaning: "特徵", partOfSpeech: "n" },
        { word: "federal", meaning: "聯邦的", partOfSpeech: "adj" },
        { word: "feedback", meaning: "回饋", partOfSpeech: "n" },
        { word: "female", meaning: "女性的", partOfSpeech: "adj" },
        { word: "festival", meaning: "節日", partOfSpeech: "n" },
        { word: "fever", meaning: "發燒", partOfSpeech: "n" },
        { word: "fiction", meaning: "小說", partOfSpeech: "n" },
        { word: "field", meaning: "領域", partOfSpeech: "n" },
        { word: "figure", meaning: "數字", partOfSpeech: "n" },
        { word: "finance", meaning: "財務", partOfSpeech: "n" },
        { word: "finding", meaning: "發現", partOfSpeech: "n" },
        { word: "firm", meaning: "公司", partOfSpeech: "n" },
        { word: "fitness", meaning: "健康", partOfSpeech: "n" },
        { word: "flame", meaning: "火焰", partOfSpeech: "n" },
        { word: "flexible", meaning: "靈活的", partOfSpeech: "adj" },
        { word: "focus", meaning: "焦點", partOfSpeech: "n" },
        
        // G
        { word: "gain", meaning: "獲得", partOfSpeech: "v" },
        { word: "gallery", meaning: "畫廊", partOfSpeech: "n" },
        { word: "garbage", meaning: "垃圾", partOfSpeech: "n" },
        { word: "garden", meaning: "花園", partOfSpeech: "n" },
        { word: "garment", meaning: "衣服", partOfSpeech: "n" },
        { word: "gather", meaning: "聚集", partOfSpeech: "v" },
        { word: "general", meaning: "一般的", partOfSpeech: "adj" },
        { word: "generate", meaning: "產生", partOfSpeech: "v" },
        { word: "generous", meaning: "慷慨的", partOfSpeech: "adj" },
        { word: "genius", meaning: "天才", partOfSpeech: "n" },
        { word: "gentle", meaning: "溫和的", partOfSpeech: "adj" },
        { word: "genuine", meaning: "真實的", partOfSpeech: "adj" },
        { word: "geography", meaning: "地理", partOfSpeech: "n" },
        { word: "gesture", meaning: "手勢", partOfSpeech: "n" },
        { word: "gift", meaning: "禮物", partOfSpeech: "n" },
        { word: "glance", meaning: "瞥見", partOfSpeech: "v" },
        { word: "global", meaning: "全球的", partOfSpeech: "adj" },
        { word: "glory", meaning: "榮耀", partOfSpeech: "n" },
        { word: "goal", meaning: "目標", partOfSpeech: "n" },
        { word: "golden", meaning: "金色的", partOfSpeech: "adj" },
        { word: "government", meaning: "政府", partOfSpeech: "n" },
        { word: "grace", meaning: "優雅", partOfSpeech: "n" },
        { word: "graduate", meaning: "畢業", partOfSpeech: "v" },
        { word: "grain", meaning: "穀物", partOfSpeech: "n" },
        { word: "grant", meaning: "授予", partOfSpeech: "v" },
        { word: "grateful", meaning: "感激的", partOfSpeech: "adj" },
        { word: "grave", meaning: "嚴重的", partOfSpeech: "adj" },
        { word: "gravity", meaning: "重力", partOfSpeech: "n" },
        { word: "greedy", meaning: "貪婪的", partOfSpeech: "adj" },
        { word: "grief", meaning: "悲傷", partOfSpeech: "n" },
        
        // H
        { word: "habit", meaning: "習慣", partOfSpeech: "n" },
        { word: "harbor", meaning: "港口", partOfSpeech: "n" },
        { word: "harmony", meaning: "和諧", partOfSpeech: "n" },
        { word: "harvest", meaning: "收成", partOfSpeech: "n" },
        { word: "hazard", meaning: "危險", partOfSpeech: "n" },
        { word: "health", meaning: "健康", partOfSpeech: "n" },
        { word: "heaven", meaning: "天堂", partOfSpeech: "n" },
        { word: "heavy", meaning: "重的", partOfSpeech: "adj" },
        { word: "height", meaning: "高度", partOfSpeech: "n" },
        { word: "hero", meaning: "英雄", partOfSpeech: "n" },
        { word: "hesitate", meaning: "猶豫", partOfSpeech: "v" },
        { word: "highway", meaning: "高速公路", partOfSpeech: "n" },
        { word: "hint", meaning: "提示", partOfSpeech: "n" },
        { word: "history", meaning: "歷史", partOfSpeech: "n" },
        { word: "hobby", meaning: "嗜好", partOfSpeech: "n" },
        { word: "honor", meaning: "榮譽", partOfSpeech: "n" },
        { word: "horizon", meaning: "地平線", partOfSpeech: "n" },
        { word: "horror", meaning: "恐怖", partOfSpeech: "n" },
        { word: "hospital", meaning: "醫院", partOfSpeech: "n" },
        { word: "host", meaning: "主人", partOfSpeech: "n" },
        { word: "household", meaning: "家庭", partOfSpeech: "n" },
        { word: "humble", meaning: "謙虛的", partOfSpeech: "adj" },
        { word: "humor", meaning: "幽默", partOfSpeech: "n" },
        { word: "hunt", meaning: "狩獵", partOfSpeech: "v" },
        { word: "hurry", meaning: "匆忙", partOfSpeech: "v" },
        { word: "hurt", meaning: "傷害", partOfSpeech: "v" },
        { word: "husband", meaning: "丈夫", partOfSpeech: "n" },
        { word: "hydrogen", meaning: "氫", partOfSpeech: "n" },
        { word: "hypothesis", meaning: "假設", partOfSpeech: "n" },
        { word: "hysterical", meaning: "歇斯底里的", partOfSpeech: "adj" },
        
        // I
        { word: "ideal", meaning: "理想的", partOfSpeech: "adj" },
        { word: "identify", meaning: "識別", partOfSpeech: "v" },
        { word: "identity", meaning: "身份", partOfSpeech: "n" },
        { word: "ignore", meaning: "忽略", partOfSpeech: "v" },
        { word: "illegal", meaning: "非法的", partOfSpeech: "adj" },
        { word: "illustrate", meaning: "說明", partOfSpeech: "v" },
        { word: "image", meaning: "圖像", partOfSpeech: "n" },
        { word: "imagine", meaning: "想像", partOfSpeech: "v" },
        { word: "immediate", meaning: "立即的", partOfSpeech: "adj" },
        { word: "immense", meaning: "巨大的", partOfSpeech: "adj" },
        { word: "immigrant", meaning: "移民", partOfSpeech: "n" },
        { word: "impact", meaning: "影響", partOfSpeech: "n" },
        { word: "implement", meaning: "實施", partOfSpeech: "v" },
        { word: "imply", meaning: "暗示", partOfSpeech: "v" },
        { word: "import", meaning: "進口", partOfSpeech: "v" },
        { word: "important", meaning: "重要的", partOfSpeech: "adj" },
        { word: "impose", meaning: "強加", partOfSpeech: "v" },
        { word: "impress", meaning: "留下印象", partOfSpeech: "v" },
        { word: "improve", meaning: "改善", partOfSpeech: "v" },
        { word: "impulse", meaning: "衝動", partOfSpeech: "n" },
        { word: "include", meaning: "包含", partOfSpeech: "v" },
        { word: "income", meaning: "收入", partOfSpeech: "n" },
        { word: "increase", meaning: "增加", partOfSpeech: "v" },
        { word: "indeed", meaning: "確實", partOfSpeech: "adv" },
        { word: "independent", meaning: "獨立的", partOfSpeech: "adj" },
        { word: "indicate", meaning: "指示", partOfSpeech: "v" },
        { word: "individual", meaning: "個人的", partOfSpeech: "adj" },
        { word: "industry", meaning: "工業", partOfSpeech: "n" },
        { word: "infect", meaning: "感染", partOfSpeech: "v" },
        { word: "influence", meaning: "影響", partOfSpeech: "n" },
        
        // J
        { word: "jail", meaning: "監獄", partOfSpeech: "n" },
        { word: "jam", meaning: "果醬", partOfSpeech: "n" },
        { word: "jar", meaning: "罐子", partOfSpeech: "n" },
        { word: "jaw", meaning: "下巴", partOfSpeech: "n" },
        { word: "jealous", meaning: "嫉妒的", partOfSpeech: "adj" },
        { word: "jeans", meaning: "牛仔褲", partOfSpeech: "n" },
        { word: "jewel", meaning: "寶石", partOfSpeech: "n" },
        { word: "job", meaning: "工作", partOfSpeech: "n" },
        { word: "join", meaning: "加入", partOfSpeech: "v" },
        { word: "joint", meaning: "關節", partOfSpeech: "n" },
        { word: "joke", meaning: "笑話", partOfSpeech: "n" },
        { word: "journal", meaning: "日記", partOfSpeech: "n" },
        { word: "journey", meaning: "旅程", partOfSpeech: "n" },
        { word: "joy", meaning: "喜悅", partOfSpeech: "n" },
        { word: "judge", meaning: "法官", partOfSpeech: "n" },
        { word: "judgment", meaning: "判斷", partOfSpeech: "n" },
        { word: "juice", meaning: "果汁", partOfSpeech: "n" },
        { word: "jump", meaning: "跳躍", partOfSpeech: "v" },
        { word: "junior", meaning: "初級的", partOfSpeech: "adj" },
        { word: "jury", meaning: "陪審團", partOfSpeech: "n" },
        { word: "just", meaning: "公正的", partOfSpeech: "adj" },
        { word: "justice", meaning: "正義", partOfSpeech: "n" },
        { word: "justify", meaning: "證明...正當", partOfSpeech: "v" },
        
        // K
        { word: "keen", meaning: "熱切的", partOfSpeech: "adj" },
        { word: "keep", meaning: "保持", partOfSpeech: "v" },
        { word: "key", meaning: "鑰匙", partOfSpeech: "n" },
        { word: "kick", meaning: "踢", partOfSpeech: "v" },
        { word: "kid", meaning: "小孩", partOfSpeech: "n" },
        { word: "kill", meaning: "殺死", partOfSpeech: "v" },
        { word: "kind", meaning: "種類", partOfSpeech: "n" },
        { word: "king", meaning: "國王", partOfSpeech: "n" },
        { word: "kingdom", meaning: "王國", partOfSpeech: "n" },
        { word: "kiss", meaning: "親吻", partOfSpeech: "v" },
        { word: "kitchen", meaning: "廚房", partOfSpeech: "n" },
        { word: "knee", meaning: "膝蓋", partOfSpeech: "n" },
        { word: "knife", meaning: "刀子", partOfSpeech: "n" },
        { word: "knock", meaning: "敲擊", partOfSpeech: "v" },
        { word: "know", meaning: "知道", partOfSpeech: "v" },
        { word: "knowledge", meaning: "知識", partOfSpeech: "n" },
        
        // L
        { word: "label", meaning: "標籤", partOfSpeech: "n" },
        { word: "labor", meaning: "勞動", partOfSpeech: "n" },
        { word: "lack", meaning: "缺乏", partOfSpeech: "v" },
        { word: "lady", meaning: "女士", partOfSpeech: "n" },
        { word: "lake", meaning: "湖泊", partOfSpeech: "n" },
        { word: "lamp", meaning: "燈", partOfSpeech: "n" },
        { word: "land", meaning: "土地", partOfSpeech: "n" },
        { word: "language", meaning: "語言", partOfSpeech: "n" },
        { word: "large", meaning: "大的", partOfSpeech: "adj" },
        { word: "last", meaning: "最後的", partOfSpeech: "adj" },
        { word: "late", meaning: "遲的", partOfSpeech: "adj" },
        { word: "laugh", meaning: "笑", partOfSpeech: "v" },
        { word: "launch", meaning: "發射", partOfSpeech: "v" },
        { word: "law", meaning: "法律", partOfSpeech: "n" },
        { word: "lazy", meaning: "懶惰的", partOfSpeech: "adj" },
        { word: "lead", meaning: "領導", partOfSpeech: "v" },
        { word: "leaf", meaning: "葉子", partOfSpeech: "n" },
        { word: "league", meaning: "聯盟", partOfSpeech: "n" },
        { word: "leak", meaning: "洩漏", partOfSpeech: "v" },
        { word: "lean", meaning: "傾斜", partOfSpeech: "v" },
        { word: "learn", meaning: "學習", partOfSpeech: "v" },
        { word: "least", meaning: "最少的", partOfSpeech: "adj" },
        { word: "leave", meaning: "離開", partOfSpeech: "v" },
        { word: "lecture", meaning: "演講", partOfSpeech: "n" },
        { word: "left", meaning: "左邊的", partOfSpeech: "adj" },
        { word: "leg", meaning: "腿", partOfSpeech: "n" },
        { word: "legal", meaning: "合法的", partOfSpeech: "adj" },
        { word: "legend", meaning: "傳說", partOfSpeech: "n" },
        { word: "leisure", meaning: "休閒", partOfSpeech: "n" },
        { word: "lend", meaning: "借出", partOfSpeech: "v" },
        { word: "length", meaning: "長度", partOfSpeech: "n" },
        
        // M
        { word: "machine", meaning: "機器", partOfSpeech: "n" },
        { word: "magazine", meaning: "雜誌", partOfSpeech: "n" },
        { word: "magic", meaning: "魔法", partOfSpeech: "n" },
        { word: "magnet", meaning: "磁鐵", partOfSpeech: "n" },
        { word: "mail", meaning: "郵件", partOfSpeech: "n" },
        { word: "main", meaning: "主要的", partOfSpeech: "adj" },
        { word: "maintain", meaning: "維持", partOfSpeech: "v" },
        { word: "major", meaning: "主要的", partOfSpeech: "adj" },
        { word: "majority", meaning: "多數", partOfSpeech: "n" },
        { word: "make", meaning: "製作", partOfSpeech: "v" },
        { word: "male", meaning: "男性的", partOfSpeech: "adj" },
        { word: "mall", meaning: "購物中心", partOfSpeech: "n" },
        { word: "man", meaning: "男人", partOfSpeech: "n" },
        { word: "manage", meaning: "管理", partOfSpeech: "v" },
        { word: "manner", meaning: "方式", partOfSpeech: "n" },
        { word: "manual", meaning: "手冊", partOfSpeech: "n" },
        { word: "manufacture", meaning: "製造", partOfSpeech: "v" },
        { word: "many", meaning: "許多的", partOfSpeech: "adj" },
        { word: "map", meaning: "地圖", partOfSpeech: "n" },
        { word: "march", meaning: "行進", partOfSpeech: "v" },
        { word: "margin", meaning: "邊緣", partOfSpeech: "n" },
        { word: "mark", meaning: "標記", partOfSpeech: "v" },
        { word: "market", meaning: "市場", partOfSpeech: "n" },
        { word: "marriage", meaning: "婚姻", partOfSpeech: "n" },
        { word: "marry", meaning: "結婚", partOfSpeech: "v" },
        { word: "mass", meaning: "質量", partOfSpeech: "n" },
        { word: "master", meaning: "主人", partOfSpeech: "n" },
        { word: "match", meaning: "比賽", partOfSpeech: "n" },
        { word: "material", meaning: "材料", partOfSpeech: "n" },
        { word: "math", meaning: "數學", partOfSpeech: "n" },
        
        // N
        { word: "nail", meaning: "釘子", partOfSpeech: "n" },
        { word: "name", meaning: "名字", partOfSpeech: "n" },
        { word: "narrow", meaning: "狹窄的", partOfSpeech: "adj" },
        { word: "nation", meaning: "國家", partOfSpeech: "n" },
        { word: "national", meaning: "國家的", partOfSpeech: "adj" },
        { word: "native", meaning: "本地的", partOfSpeech: "adj" },
        { word: "natural", meaning: "自然的", partOfSpeech: "adj" },
        { word: "nature", meaning: "自然", partOfSpeech: "n" },
        { word: "near", meaning: "接近的", partOfSpeech: "adj" },
        { word: "nearly", meaning: "幾乎", partOfSpeech: "adv" },
        { word: "neat", meaning: "整潔的", partOfSpeech: "adj" },
        { word: "necessary", meaning: "必要的", partOfSpeech: "adj" },
        { word: "neck", meaning: "脖子", partOfSpeech: "n" },
        { word: "need", meaning: "需要", partOfSpeech: "v" },
        { word: "needle", meaning: "針", partOfSpeech: "n" },
        { word: "negative", meaning: "負面的", partOfSpeech: "adj" },
        { word: "neglect", meaning: "忽視", partOfSpeech: "v" },
        { word: "neighbor", meaning: "鄰居", partOfSpeech: "n" },
        { word: "neighborhood", meaning: "鄰里", partOfSpeech: "n" },
        { word: "neither", meaning: "兩者都不", partOfSpeech: "adj" },
        { word: "nerve", meaning: "神經", partOfSpeech: "n" },
        { word: "nervous", meaning: "緊張的", partOfSpeech: "adj" },
        { word: "net", meaning: "網", partOfSpeech: "n" },
        { word: "network", meaning: "網路", partOfSpeech: "n" },
        { word: "neutral", meaning: "中立的", partOfSpeech: "adj" },
        { word: "never", meaning: "從不", partOfSpeech: "adv" },
        { word: "new", meaning: "新的", partOfSpeech: "adj" },
        { word: "news", meaning: "新聞", partOfSpeech: "n" },
        { word: "newspaper", meaning: "報紙", partOfSpeech: "n" },
        { word: "next", meaning: "下一個", partOfSpeech: "adj" },
        
        // O
        { word: "obey", meaning: "服從", partOfSpeech: "v" },
        { word: "object", meaning: "物體", partOfSpeech: "n" },
        { word: "observe", meaning: "觀察", partOfSpeech: "v" },
        { word: "obtain", meaning: "獲得", partOfSpeech: "v" },
        { word: "obvious", meaning: "明顯的", partOfSpeech: "adj" },
        { word: "occasion", meaning: "場合", partOfSpeech: "n" },
        { word: "occur", meaning: "發生", partOfSpeech: "v" },
        { word: "ocean", meaning: "海洋", partOfSpeech: "n" },
        { word: "odd", meaning: "奇怪的", partOfSpeech: "adj" },
        { word: "off", meaning: "離開", partOfSpeech: "adv" },
        { word: "offer", meaning: "提供", partOfSpeech: "v" },
        { word: "office", meaning: "辦公室", partOfSpeech: "n" },
        { word: "officer", meaning: "官員", partOfSpeech: "n" },
        { word: "official", meaning: "官方的", partOfSpeech: "adj" },
        { word: "often", meaning: "經常", partOfSpeech: "adv" },
        { word: "oil", meaning: "油", partOfSpeech: "n" },
        { word: "old", meaning: "老的", partOfSpeech: "adj" },
        { word: "omit", meaning: "省略", partOfSpeech: "v" },
        { word: "once", meaning: "一次", partOfSpeech: "adv" },
        { word: "one", meaning: "一個", partOfSpeech: "num" },
        { word: "only", meaning: "唯一的", partOfSpeech: "adj" },
        { word: "onto", meaning: "到...上", partOfSpeech: "prep" },
        { word: "open", meaning: "打開", partOfSpeech: "v" },
        { word: "operate", meaning: "操作", partOfSpeech: "v" },
        { word: "operation", meaning: "手術", partOfSpeech: "n" },
        { word: "opinion", meaning: "意見", partOfSpeech: "n" },
        { word: "opportunity", meaning: "機會", partOfSpeech: "n" },
        { word: "oppose", meaning: "反對", partOfSpeech: "v" },
        { word: "opposite", meaning: "相反的", partOfSpeech: "adj" },
        { word: "option", meaning: "選擇", partOfSpeech: "n" },
        { word: "or", meaning: "或者", partOfSpeech: "conj" },
        
        // P
        { word: "pace", meaning: "步伐", partOfSpeech: "n" },
        { word: "pack", meaning: "打包", partOfSpeech: "v" },
        { word: "package", meaning: "包裹", partOfSpeech: "n" },
        { word: "page", meaning: "頁面", partOfSpeech: "n" },
        { word: "pain", meaning: "疼痛", partOfSpeech: "n" },
        { word: "paint", meaning: "繪畫", partOfSpeech: "v" },
        { word: "pair", meaning: "一對", partOfSpeech: "n" },
        { word: "palace", meaning: "宮殿", partOfSpeech: "n" },
        { word: "pale", meaning: "蒼白的", partOfSpeech: "adj" },
        { word: "pan", meaning: "平底鍋", partOfSpeech: "n" },
        { word: "panel", meaning: "面板", partOfSpeech: "n" },
        { word: "paper", meaning: "紙", partOfSpeech: "n" },
        { word: "paragraph", meaning: "段落", partOfSpeech: "n" },
        { word: "parallel", meaning: "平行的", partOfSpeech: "adj" },
        { word: "parcel", meaning: "包裹", partOfSpeech: "n" },
        { word: "parent", meaning: "父母", partOfSpeech: "n" },
        { word: "park", meaning: "公園", partOfSpeech: "n" },
        { word: "part", meaning: "部分", partOfSpeech: "n" },
        { word: "particular", meaning: "特別的", partOfSpeech: "adj" },
        { word: "partly", meaning: "部分地", partOfSpeech: "adv" },
        { word: "partner", meaning: "夥伴", partOfSpeech: "n" },
        { word: "party", meaning: "派對", partOfSpeech: "n" },
        { word: "pass", meaning: "通過", partOfSpeech: "v" },
        { word: "passage", meaning: "段落", partOfSpeech: "n" },
        { word: "passenger", meaning: "乘客", partOfSpeech: "n" },
        { word: "passion", meaning: "熱情", partOfSpeech: "n" },
        { word: "past", meaning: "過去的", partOfSpeech: "adj" },
        { word: "path", meaning: "路徑", partOfSpeech: "n" },
        { word: "patient", meaning: "病人", partOfSpeech: "n" },
        { word: "pattern", meaning: "模式", partOfSpeech: "n" },
        
        // Q
        { word: "quality", meaning: "品質", partOfSpeech: "n" },
        { word: "quantity", meaning: "數量", partOfSpeech: "n" },
        { word: "quarter", meaning: "四分之一", partOfSpeech: "n" },
        { word: "queen", meaning: "女王", partOfSpeech: "n" },
        { word: "question", meaning: "問題", partOfSpeech: "n" },
        { word: "quick", meaning: "快的", partOfSpeech: "adj" },
        { word: "quiet", meaning: "安靜的", partOfSpeech: "adj" },
        { word: "quit", meaning: "放棄", partOfSpeech: "v" },
        { word: "quite", meaning: "相當", partOfSpeech: "adv" },
        { word: "quiz", meaning: "測驗", partOfSpeech: "n" },
        { word: "quote", meaning: "引用", partOfSpeech: "v" },
        
        // R
        { word: "race", meaning: "比賽", partOfSpeech: "n" },
        { word: "radio", meaning: "收音機", partOfSpeech: "n" },
        { word: "rail", meaning: "鐵軌", partOfSpeech: "n" },
        { word: "rain", meaning: "雨", partOfSpeech: "n" },
        { word: "raise", meaning: "提高", partOfSpeech: "v" },
        { word: "range", meaning: "範圍", partOfSpeech: "n" },
        { word: "rank", meaning: "等級", partOfSpeech: "n" },
        { word: "rapid", meaning: "迅速的", partOfSpeech: "adj" },
        { word: "rare", meaning: "稀有的", partOfSpeech: "adj" },
        { word: "rate", meaning: "比率", partOfSpeech: "n" },
        { word: "rather", meaning: "寧願", partOfSpeech: "adv" },
        { word: "raw", meaning: "生的", partOfSpeech: "adj" },
        { word: "reach", meaning: "到達", partOfSpeech: "v" },
        { word: "react", meaning: "反應", partOfSpeech: "v" },
        { word: "read", meaning: "閱讀", partOfSpeech: "v" },
        { word: "ready", meaning: "準備好的", partOfSpeech: "adj" },
        { word: "real", meaning: "真實的", partOfSpeech: "adj" },
        { word: "realize", meaning: "意識到", partOfSpeech: "v" },
        { word: "reason", meaning: "原因", partOfSpeech: "n" },
        { word: "receive", meaning: "接收", partOfSpeech: "v" },
        { word: "recent", meaning: "最近的", partOfSpeech: "adj" },
        { word: "recognize", meaning: "認出", partOfSpeech: "v" },
        { word: "record", meaning: "記錄", partOfSpeech: "v" },
        { word: "recover", meaning: "恢復", partOfSpeech: "v" },
        { word: "reduce", meaning: "減少", partOfSpeech: "v" },
        { word: "refer", meaning: "提到", partOfSpeech: "v" },
        { word: "reference", meaning: "參考", partOfSpeech: "n" },
        { word: "reflect", meaning: "反映", partOfSpeech: "v" },
        { word: "reform", meaning: "改革", partOfSpeech: "v" },
        { word: "refuse", meaning: "拒絕", partOfSpeech: "v" },
        
        // S
        { word: "sad", meaning: "傷心的", partOfSpeech: "adj" },
        { word: "safe", meaning: "安全的", partOfSpeech: "adj" },
        { word: "sail", meaning: "航行", partOfSpeech: "v" },
        { word: "sake", meaning: "緣故", partOfSpeech: "n" },
        { word: "salary", meaning: "薪水", partOfSpeech: "n" },
        { word: "sale", meaning: "銷售", partOfSpeech: "n" },
        { word: "salt", meaning: "鹽", partOfSpeech: "n" },
        { word: "same", meaning: "相同的", partOfSpeech: "adj" },
        { word: "sample", meaning: "樣本", partOfSpeech: "n" },
        { word: "sand", meaning: "沙子", partOfSpeech: "n" },
        { word: "save", meaning: "拯救", partOfSpeech: "v" },
        { word: "scale", meaning: "規模", partOfSpeech: "n" },
        { word: "scan", meaning: "掃描", partOfSpeech: "v" },
        { word: "scare", meaning: "驚嚇", partOfSpeech: "v" },
        { word: "scene", meaning: "場景", partOfSpeech: "n" },
        { word: "schedule", meaning: "時間表", partOfSpeech: "n" },
        { word: "scheme", meaning: "計劃", partOfSpeech: "n" },
        { word: "school", meaning: "學校", partOfSpeech: "n" },
        { word: "science", meaning: "科學", partOfSpeech: "n" },
        { word: "scientific", meaning: "科學的", partOfSpeech: "adj" },
        { word: "scientist", meaning: "科學家", partOfSpeech: "n" },
        { word: "score", meaning: "分數", partOfSpeech: "n" },
        { word: "scream", meaning: "尖叫", partOfSpeech: "v" },
        { word: "screen", meaning: "螢幕", partOfSpeech: "n" },
        { word: "script", meaning: "腳本", partOfSpeech: "n" },
        { word: "sea", meaning: "海洋", partOfSpeech: "n" },
        { word: "search", meaning: "搜尋", partOfSpeech: "v" },
        { word: "season", meaning: "季節", partOfSpeech: "n" },
        { word: "seat", meaning: "座位", partOfSpeech: "n" },
        { word: "second", meaning: "第二", partOfSpeech: "adj" },
        { word: "secret", meaning: "秘密", partOfSpeech: "n" },
        
        // T
        { word: "table", meaning: "桌子", partOfSpeech: "n" },
        { word: "tail", meaning: "尾巴", partOfSpeech: "n" },
        { word: "take", meaning: "拿", partOfSpeech: "v" },
        { word: "tale", meaning: "故事", partOfSpeech: "n" },
        { word: "talent", meaning: "才能", partOfSpeech: "n" },
        { word: "talk", meaning: "談話", partOfSpeech: "v" },
        { word: "tall", meaning: "高的", partOfSpeech: "adj" },
        { word: "tank", meaning: "坦克", partOfSpeech: "n" },
        { word: "tape", meaning: "膠帶", partOfSpeech: "n" },
        { word: "target", meaning: "目標", partOfSpeech: "n" },
        { word: "task", meaning: "任務", partOfSpeech: "n" },
        { word: "taste", meaning: "味道", partOfSpeech: "n" },
        { word: "tax", meaning: "稅", partOfSpeech: "n" },
        { word: "tea", meaning: "茶", partOfSpeech: "n" },
        { word: "teach", meaning: "教導", partOfSpeech: "v" },
        { word: "teacher", meaning: "老師", partOfSpeech: "n" },
        { word: "team", meaning: "團隊", partOfSpeech: "n" },
        { word: "tear", meaning: "眼淚", partOfSpeech: "n" },
        { word: "technical", meaning: "技術的", partOfSpeech: "adj" },
        { word: "technique", meaning: "技巧", partOfSpeech: "n" },
        { word: "technology", meaning: "科技", partOfSpeech: "n" },
        { word: "teenager", meaning: "青少年", partOfSpeech: "n" },
        { word: "telephone", meaning: "電話", partOfSpeech: "n" },
        { word: "television", meaning: "電視", partOfSpeech: "n" },
        { word: "tell", meaning: "告訴", partOfSpeech: "v" },
        { word: "temperature", meaning: "溫度", partOfSpeech: "n" },
        { word: "temporary", meaning: "暫時的", partOfSpeech: "adj" },
        { word: "tend", meaning: "傾向", partOfSpeech: "v" },
        { word: "tender", meaning: "溫柔的", partOfSpeech: "adj" },
        { word: "tennis", meaning: "網球", partOfSpeech: "n" },
        { word: "tension", meaning: "緊張", partOfSpeech: "n" },
        
        // U
        { word: "ugly", meaning: "醜陋的", partOfSpeech: "adj" },
        { word: "ultimate", meaning: "最終的", partOfSpeech: "adj" },
        { word: "umbrella", meaning: "雨傘", partOfSpeech: "n" },
        { word: "unable", meaning: "不能的", partOfSpeech: "adj" },
        { word: "uncle", meaning: "叔叔", partOfSpeech: "n" },
        { word: "under", meaning: "在...下面", partOfSpeech: "prep" },
        { word: "undergo", meaning: "經歷", partOfSpeech: "v" },
        { word: "understand", meaning: "理解", partOfSpeech: "v" },
        { word: "undertake", meaning: "承擔", partOfSpeech: "v" },
        { word: "uniform", meaning: "制服", partOfSpeech: "n" },
        { word: "union", meaning: "工會", partOfSpeech: "n" },
        { word: "unique", meaning: "獨特的", partOfSpeech: "adj" },
        { word: "unit", meaning: "單位", partOfSpeech: "n" },
        { word: "unite", meaning: "團結", partOfSpeech: "v" },
        { word: "universe", meaning: "宇宙", partOfSpeech: "n" },
        { word: "university", meaning: "大學", partOfSpeech: "n" },
        { word: "unless", meaning: "除非", partOfSpeech: "conj" },
        { word: "unlike", meaning: "不像", partOfSpeech: "prep" },
        { word: "unlikely", meaning: "不太可能的", partOfSpeech: "adj" },
        { word: "until", meaning: "直到", partOfSpeech: "prep" },
        { word: "unusual", meaning: "不尋常的", partOfSpeech: "adj" },
        { word: "up", meaning: "向上", partOfSpeech: "adv" },
        { word: "upon", meaning: "在...上", partOfSpeech: "prep" },
        { word: "upper", meaning: "上面的", partOfSpeech: "adj" },
        { word: "upset", meaning: "心煩的", partOfSpeech: "adj" },
        { word: "upstairs", meaning: "樓上", partOfSpeech: "adv" },
        
        // V
        { word: "vacation", meaning: "假期", partOfSpeech: "n" },
        { word: "vacuum", meaning: "真空", partOfSpeech: "n" },
        { word: "vague", meaning: "模糊的", partOfSpeech: "adj" },
        { word: "vain", meaning: "徒勞的", partOfSpeech: "adj" },
        { word: "valid", meaning: "有效的", partOfSpeech: "adj" },
        { word: "valley", meaning: "山谷", partOfSpeech: "n" },
        { word: "value", meaning: "價值", partOfSpeech: "n" },
        { word: "van", meaning: "廂型車", partOfSpeech: "n" },
        { word: "vanish", meaning: "消失", partOfSpeech: "v" },
        { word: "variety", meaning: "多樣性", partOfSpeech: "n" },
        { word: "various", meaning: "各種的", partOfSpeech: "adj" },
        { word: "vary", meaning: "變化", partOfSpeech: "v" },
        { word: "vast", meaning: "廣闊的", partOfSpeech: "adj" },
        { word: "vegetable", meaning: "蔬菜", partOfSpeech: "n" },
        { word: "vehicle", meaning: "車輛", partOfSpeech: "n" },
        { word: "venture", meaning: "冒險", partOfSpeech: "n" },
        { word: "verb", meaning: "動詞", partOfSpeech: "n" },
        { word: "version", meaning: "版本", partOfSpeech: "n" },
        { word: "vertical", meaning: "垂直的", partOfSpeech: "adj" },
        { word: "very", meaning: "非常", partOfSpeech: "adv" },
        { word: "vessel", meaning: "船隻", partOfSpeech: "n" },
        { word: "veteran", meaning: "老兵", partOfSpeech: "n" },
        { word: "victim", meaning: "受害者", partOfSpeech: "n" },
        { word: "victory", meaning: "勝利", partOfSpeech: "n" },
        { word: "video", meaning: "影片", partOfSpeech: "n" },
        { word: "view", meaning: "觀點", partOfSpeech: "n" },
        { word: "village", meaning: "村莊", partOfSpeech: "n" },
        { word: "violence", meaning: "暴力", partOfSpeech: "n" },
        { word: "violent", meaning: "暴力的", partOfSpeech: "adj" },
        { word: "virtue", meaning: "美德", partOfSpeech: "n" },
        
        // W
        { word: "wage", meaning: "工資", partOfSpeech: "n" },
        { word: "wagon", meaning: "馬車", partOfSpeech: "n" },
        { word: "wait", meaning: "等待", partOfSpeech: "v" },
        { word: "wake", meaning: "醒來", partOfSpeech: "v" },
        { word: "walk", meaning: "走路", partOfSpeech: "v" },
        { word: "wall", meaning: "牆", partOfSpeech: "n" },
        { word: "wander", meaning: "漫遊", partOfSpeech: "v" },
        { word: "want", meaning: "想要", partOfSpeech: "v" },
        { word: "war", meaning: "戰爭", partOfSpeech: "n" },
        { word: "warm", meaning: "溫暖的", partOfSpeech: "adj" },
        { word: "warn", meaning: "警告", partOfSpeech: "v" },
        { word: "wash", meaning: "洗", partOfSpeech: "v" },
        { word: "waste", meaning: "浪費", partOfSpeech: "v" },
        { word: "watch", meaning: "觀看", partOfSpeech: "v" },
        { word: "water", meaning: "水", partOfSpeech: "n" },
        { word: "wave", meaning: "波浪", partOfSpeech: "n" },
        { word: "way", meaning: "方式", partOfSpeech: "n" },
        { word: "weak", meaning: "虛弱的", partOfSpeech: "adj" },
        { word: "wealth", meaning: "財富", partOfSpeech: "n" },
        { word: "weapon", meaning: "武器", partOfSpeech: "n" },
        { word: "wear", meaning: "穿著", partOfSpeech: "v" },
        { word: "weather", meaning: "天氣", partOfSpeech: "n" },
        { word: "weave", meaning: "編織", partOfSpeech: "v" },
        { word: "web", meaning: "網", partOfSpeech: "n" },
        { word: "wedding", meaning: "婚禮", partOfSpeech: "n" },
        { word: "week", meaning: "週", partOfSpeech: "n" },
        { word: "weekend", meaning: "週末", partOfSpeech: "n" },
        { word: "weigh", meaning: "稱重", partOfSpeech: "v" },
        { word: "weight", meaning: "重量", partOfSpeech: "n" },
        { word: "welcome", meaning: "歡迎", partOfSpeech: "v" },
        
        // X
        { word: "x-ray", meaning: "X光", partOfSpeech: "n" },
        
        // Y
        { word: "yard", meaning: "院子", partOfSpeech: "n" },
        { word: "year", meaning: "年", partOfSpeech: "n" },
        { word: "yellow", meaning: "黃色的", partOfSpeech: "adj" },
        { word: "yesterday", meaning: "昨天", partOfSpeech: "n" },
        { word: "young", meaning: "年輕的", partOfSpeech: "adj" },
        { word: "youth", meaning: "青年", partOfSpeech: "n" },
        
        // Z
        { word: "zone", meaning: "區域", partOfSpeech: "n" },
        { word: "zoo", meaning: "動物園", partOfSpeech: "n" }
    ];
    
    let importCount = 0;
    let skipCount = 0;
    
    // 檢查每個單字是否已存在
    basic2000Words.forEach(wordData => {
        // 檢查單字是否已存在
        const exists = window.appData.vocabulary.some(item => 
            item.word.toLowerCase() === wordData.word.toLowerCase()
        );
        
        if (!exists) {
            // 建立新單字物件
            const newWord = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                word: wordData.word,
                phonetic: '',
                partOfSpeech: wordData.partOfSpeech,
                meaning: wordData.meaning,
                examples: [],
                status: 'new',
                dateAdded: new Date().toISOString(),
                lastReviewed: null
            };
            
            // 添加到詞彙列表
            window.appData.vocabulary.push(newWord);
            importCount++;
        } else {
            skipCount++;
        }
    });
    
    // 儲存到 localStorage
    try {
        localStorage.setItem('appData', JSON.stringify(window.appData));
        console.log(`匯入完成！成功匯入 ${importCount} 個單字，跳過 ${skipCount} 個已存在的單字。`);
        alert(`匯入完成！成功匯入 ${importCount} 個單字，跳過 ${skipCount} 個已存在的單字。`);
        
        // 重新載入詞彙列表
        if (typeof loadVocabularyData === 'function') {
            loadVocabularyData();
        } else {
            console.log('找不到 loadVocabularyData 函數，嘗試重新載入頁面');
            // 如果找不到 loadVocabularyData 函數，嘗試重新載入詞彙頁面
            const vocabNavLink = document.querySelector('nav a[data-page="vocabulary"]');
            if (vocabNavLink && typeof switchPage === 'function') {
                switchPage('vocabulary');
            }
        }
    } catch (error) {
        console.error('儲存到 localStorage 時發生錯誤:', error);
        alert('匯入過程中發生錯誤，請查看控制台獲取詳細信息。');
    }
}

// 添加匯入2000單字按鈕到頁面
function addImportButton2000() {
    const vocabPage = document.getElementById('vocabulary');
    if (!vocabPage) {
        console.error('找不到詞彙頁面，無法添加匯入按鈕');
        return;
    }
    
    // 檢查按鈕是否已存在
    if (document.getElementById('importBasic2000Btn')) {
        return;
    }
    
    // 創建匯入按鈕
    const importBtn = document.createElement('button');
    importBtn.id = 'importBasic2000Btn';
    importBtn.className = 'primary-btn';
    importBtn.innerHTML = '<i class="fas fa-download"></i> 匯入國中基礎2000單字';
    importBtn.addEventListener('click', importBasic2000Words);
    
    // 嘗試找到 header-actions 容器
    const headerActions = vocabPage.querySelector('.header-actions');
    if (headerActions) {
        headerActions.appendChild(importBtn);
        console.log('已添加匯入2000單字按鈕到詞彙頁面的 header-actions');
        return;
    }
    
    // 如果找不到 header-actions，嘗試找到 dropdown-content 容器
    const dropdownContent = vocabPage.querySelector('.dropdown-content');
    if (dropdownContent) {
        dropdownContent.appendChild(importBtn);
        console.log('已添加匯入2000單字按鈕到詞彙頁面的下拉選單');
        return;
    }
    
    // 如果都找不到，直接添加到詞彙頁面的頂部
    vocabPage.insertBefore(importBtn, vocabPage.firstChild);
    console.log('已添加匯入2000單字按鈕到詞彙頁面頂部');
}

// 當文檔加載完成時添加匯入2000單字按鈕
document.addEventListener('DOMContentLoaded', function() {
    // 立即添加按鈕
    addImportButton2000();
    // 等待一秒後再次檢查
    setTimeout(addImportButton2000, 1000);
});

// 如果文檔已經加載完成，立即添加按鈕
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    addImportButton2000();
    // 等待一秒後再次檢查
    setTimeout(addImportButton2000, 1000);
}

// 監聽頁面切換事件，確保在切換到詞彙頁面時也能添加按鈕
document.addEventListener('click', function(e) {
    // 檢查是否點擊了導航鏈接
    if (e.target && (e.target.matches('nav a[data-page="vocabulary"]') || e.target.closest('nav a[data-page="vocabulary"]'))) {
        // 等待頁面切換完成後添加按鈕
        setTimeout(addImportButton2000, 500);
    }
});

// 定期檢查詞彙頁面是否可見，如果可見且沒有按鈕，則添加按鈕
setInterval(function() {
    const vocabPage = document.getElementById('vocabulary');
    if (vocabPage && vocabPage.classList.contains('active') && !document.getElementById('importBasic2000Btn')) {
        addImportButton2000();
    }
}, 2000); // 每2秒檢查一次