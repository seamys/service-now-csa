// 全局变量
let allQuestions = [];
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let quizStartTime = null;
let isQuizMode = false;
let questionAnswered = false; // 新增：标记当前题目是否已回答
let currentLanguage = 'en'; // 新增：当前语言，默认英文
let firstTimeWrongSet = new Set(); // 新增：记录第一次答错的题目
let isWrongQuestionMode = false; // 新增：标记是否为错题模式

// 题目状态管理
let questionStatus = {
    correct: new Set(),
    wrong: new Set(),
    untested: new Set()
};

// 从localStorage加载状态
function loadQuestionStatus() {
    const saved = localStorage.getItem('csa_question_status');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            questionStatus.correct = new Set(data.correct || []);
            questionStatus.wrong = new Set(data.wrong || []);
            questionStatus.untested = new Set(data.untested || []);
        } catch (e) {
            console.error('加载题目状态失败:', e);
            initializeQuestionStatus();
        }
    } else {
        initializeQuestionStatus();
    }
}

// 初始化题目状态
function initializeQuestionStatus() {
    questionStatus.correct = new Set();
    questionStatus.wrong = new Set();
    questionStatus.untested = new Set();
    
    // 初始化所有题目为未测试状态
    const totalQuestions = allQuestions.length > 0 ? allQuestions.length : 385;
    for (let i = 1; i <= totalQuestions; i++) {
        questionStatus.untested.add(i);
    }
    saveQuestionStatus();
}

// 保存状态到localStorage
function saveQuestionStatus() {
    const data = {
        correct: Array.from(questionStatus.correct),
        wrong: Array.from(questionStatus.wrong),
        untested: Array.from(questionStatus.untested)
    };
    localStorage.setItem('csa_question_status', JSON.stringify(data));
}

// 更新题目状态
function updateQuestionStatus(questionNumber, isCorrect) {
    // 从所有状态中移除
    questionStatus.correct.delete(questionNumber);
    questionStatus.wrong.delete(questionNumber);
    questionStatus.untested.delete(questionNumber);
    
    // 添加到对应状态
    if (isCorrect) {
        questionStatus.correct.add(questionNumber);
    } else {
        questionStatus.wrong.add(questionNumber);
    }
    
    saveQuestionStatus();
    updateStatusDisplay();
}

// 新增：第一次答错时标记为错误
function markQuestionAsWrongOnFirstError(questionNumber) {
    // 如果这道题还没有被标记为第一次答错，并且也不在正确列表中
    if (!firstTimeWrongSet.has(questionNumber) && !questionStatus.correct.has(questionNumber)) {
        firstTimeWrongSet.add(questionNumber);
        
        // 从所有状态中移除
        questionStatus.correct.delete(questionNumber);
        questionStatus.wrong.delete(questionNumber);
        questionStatus.untested.delete(questionNumber);
        
        // 标记为错误
        questionStatus.wrong.add(questionNumber);
        
        saveQuestionStatus();
        updateStatusDisplay();
    }
}

// 新增：第一次答对时标记为正确（如果之前没有答错过）
function markQuestionAsCorrectOnFirstSuccess(questionNumber) {
    // 如果这道题没有在错误记录中，并且当前不是正确状态，则标记为正确
    if (!questionStatus.wrong.has(questionNumber) && !questionStatus.correct.has(questionNumber)) {
        // 从所有状态中移除
        questionStatus.correct.delete(questionNumber);
        questionStatus.wrong.delete(questionNumber);
        questionStatus.untested.delete(questionNumber);
        
        // 标记为正确
        questionStatus.correct.add(questionNumber);
        
        saveQuestionStatus();
        updateStatusDisplay();
    }
}

// 新增：手动标记题目为正确（清除错误记录）
function markQuestionAsCorrect(questionNumber) {
    // 从第一次答错记录中移除
    firstTimeWrongSet.delete(questionNumber);
    
    // 从所有状态中移除
    questionStatus.correct.delete(questionNumber);
    questionStatus.wrong.delete(questionNumber);
    questionStatus.untested.delete(questionNumber);
    
    // 标记为正确
    questionStatus.correct.add(questionNumber);
    
    saveQuestionStatus();
    updateStatusDisplay();
}

// 更新状态显示
function updateStatusDisplay() {
    // 更新统计数字
    const correctCountEl = document.getElementById('correctCount');
    const wrongCountEl = document.getElementById('wrongCount');
    const untestedCountEl = document.getElementById('untestedCount');
    
    if (correctCountEl) correctCountEl.textContent = questionStatus.correct.size;
    if (wrongCountEl) wrongCountEl.textContent = questionStatus.wrong.size;
    if (untestedCountEl) untestedCountEl.textContent = questionStatus.untested.size;
    
    // 更新统一的题目网格
    updateUnifiedQuestionGrid();
}

// 更新统一的题目网格
function updateUnifiedQuestionGrid() {
    const container = document.getElementById('unifiedQuestionGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 获取所有题目数量
    const totalQuestions = allQuestions.length > 0 ? allQuestions.length : 385;
    
    // 为每道题目创建一个方格
    for (let i = 1; i <= totalQuestions; i++) {
        const item = document.createElement('div');
        item.className = 'question-number-item';
        item.textContent = i;
        item.title = `题目 ${i}\n左键：练习题目\n右键：标记为正确`;
        item.onclick = () => goToQuestion(i);
        
        // 添加右键点击事件来标记为正确
        item.oncontextmenu = (e) => {
            e.preventDefault();
            if (questionStatus.wrong.has(i)) {
                if (confirm(`确定要将题目 ${i} 标记为正确吗？`)) {
                    markQuestionAsCorrect(i);
                }
            } else if (questionStatus.untested.has(i)) {
                if (confirm(`确定要将题目 ${i} 标记为正确吗？`)) {
                    markQuestionAsCorrect(i);
                }
            }
        };
        
        // 根据状态添加对应的CSS类
        if (questionStatus.correct.has(i)) {
            item.classList.add('correct');
        } else if (questionStatus.wrong.has(i)) {
            item.classList.add('wrong');
        } else {
            item.classList.add('untested');
        }
        
        container.appendChild(item);
    }
}

// 更新题目方格显示（保留原函数，用于其他地方）
function updateQuestionGrid(containerId, questionSet, statusClass) {
    const container = document.getElementById(containerId);
    if (!container) return; // 如果容器不存在，直接返回
    
    container.innerHTML = '';
    
    const sortedQuestions = Array.from(questionSet).sort((a, b) => a - b);
    
    sortedQuestions.forEach(questionNumber => {
        const item = document.createElement('div');
        item.className = `question-number-item ${statusClass}`;
        item.textContent = questionNumber;
        item.title = `题目 ${questionNumber}`;
        item.onclick = () => goToQuestion(questionNumber);
        container.appendChild(item);
    });
}

// 跳转到指定题目
function goToQuestion(questionNumber) {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，无法跳转');
        return;
    }
    
    const question = allQuestions.find(q => q.question_number === questionNumber);
    if (!question) {
        alert(`未找到题目 ${questionNumber}`);
        return;
    }
    
    // 设置为单题练习模式
    currentQuestions = [question];
    userAnswers = [[]];
    currentQuestionIndex = 0;
    quizStartTime = new Date();
    isQuizMode = false;

    showPanel('quizContainer');
    displayQuestion();
}

// 重置题目状态
function resetQuestionStatus() {
    if (confirm('确定要重置所有题目状态吗？这将清除所有答题记录。')) {
        localStorage.removeItem('csa_question_status');
        initializeQuestionStatus();
        updateStatusDisplay();
        alert('题目状态已重置！');
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，开始初始化...');
    
    if (typeof QUESTIONS_DATA !== 'undefined') {
        allQuestions = QUESTIONS_DATA.questions || [];
        console.log(`已加载 ${allQuestions.length} 道题目`);
    } else {
        console.error('题目数据未加载');
        alert('题目数据加载失败，请检查文件路径');
    }
    
    // 检查翻译数据是否已加载
    if (typeof TRANSLATED_QUESTIONS_DATA !== 'undefined') {
        console.log(`已加载 ${TRANSLATED_QUESTIONS_DATA.questions.length} 道翻译题目`);
    } else {
        console.warn('翻译数据未加载，中英文切换功能将不可用');
    }
    
    // 初始化语言切换按钮
    updateLanguageButton();
    
    // 初始化题目状态
    console.log('开始初始化题目状态...');
    loadQuestionStatus();
    updateStatusDisplay();
    console.log('题目状态初始化完成');
});

// 切换语言
function toggleLanguage() {
    if (typeof TRANSLATED_QUESTIONS_DATA === 'undefined') {
        alert('中文翻译数据未加载，请确保已引入 questions_translated.js 文件');
        return;
    }
    
    currentLanguage = currentLanguage === 'en' ? 'cn' : 'en';
    updateLanguageButton();
    
    // 如果正在答题，重新显示当前题目
    if (document.getElementById('quizContainer').style.display !== 'none') {
        displayQuestion();
    }
}

// 更新语言切换按钮
function updateLanguageButton() {
    const langText = document.getElementById('langText');
    const languageToggle = document.getElementById('languageToggle');
    
    if (langText && languageToggle) {
        if (currentLanguage === 'en') {
            langText.textContent = '中文';
            languageToggle.classList.remove('active');
        } else {
            langText.textContent = 'EN';
            languageToggle.classList.add('active');
        }
    }
}

// 获取当前语言的题目文本
function getQuestionText(question, questionNumber) {
    if (currentLanguage === 'cn' && typeof TRANSLATED_QUESTIONS_DATA !== 'undefined') {
        const translatedQuestion = TRANSLATED_QUESTIONS_DATA.questions.find(q => 
            q.question_number === questionNumber
        );
        return translatedQuestion ? translatedQuestion.question_text_cn : question.question_text;
    }
    return question.question_text;
}

// 获取当前语言的选项文本
function getOptionText(question, optionIndex, questionNumber) {
    if (currentLanguage === 'cn' && typeof TRANSLATED_QUESTIONS_DATA !== 'undefined') {
        const translatedQuestion = TRANSLATED_QUESTIONS_DATA.questions.find(q => 
            q.question_number === questionNumber
        );
        if (translatedQuestion && translatedQuestion.options_cn && translatedQuestion.options_cn[optionIndex]) {
            return translatedQuestion.options_cn[optionIndex];
        }
    }
    return question.options[optionIndex];
}

// 获取当前语言的解释文本
function getExplanationText(question, questionNumber) {
    if (currentLanguage === 'cn' && typeof TRANSLATED_QUESTIONS_DATA !== 'undefined') {
        const translatedQuestion = TRANSLATED_QUESTIONS_DATA.questions.find(q => 
            q.question_number === questionNumber
        );
        if (translatedQuestion && translatedQuestion.explanation_cn) {
            return translatedQuestion.explanation_cn;
        }
    }
    return question.explanation || '';
}

// 开始测试
function startQuiz() {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，请刷新页面重试');
        return;
    }

    // 获取用户选择
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const questionType = document.getElementById('questionType').value;
    const keyword = document.getElementById('searchKeyword').value.trim();

    // 筛选题目
    let filteredQuestions = [...allQuestions];
    
    if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        filteredQuestions = filteredQuestions.filter(q => 
            q.question_text.toLowerCase().includes(lowerKeyword) ||
            q.options.some(option => option.toLowerCase().includes(lowerKeyword))
        );
    }

    if (questionType === 'single') {
        filteredQuestions = filteredQuestions.filter(q => q.correct_answer.length === 1);
    } else if (questionType === 'multiple') {
        filteredQuestions = filteredQuestions.filter(q => q.correct_answer.length > 1);
    }

    if (filteredQuestions.length === 0) {
        alert('没有找到符合条件的题目，请调整筛选条件');
        return;
    }

    // 随机选择题目
    currentQuestions = shuffleArray(filteredQuestions).slice(0, Math.min(questionCount, filteredQuestions.length));
    userAnswers = new Array(currentQuestions.length).fill([]);
    currentQuestionIndex = 0;
    quizStartTime = new Date();
    isQuizMode = true;
    isWrongQuestionMode = false;

    // 显示测试界面
    showPanel('quizContainer');
    displayQuestion();
}

// 随机练习
function randomPractice() {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，请刷新页面重试');
        return;
    }
    
    // 随机选择5道题目进行快速练习
    currentQuestions = shuffleArray([...allQuestions]).slice(0, 5);
    userAnswers = new Array(5).fill([]);
    currentQuestionIndex = 0;
    quizStartTime = new Date();
    isQuizMode = false;
    isWrongQuestionMode = false;

    showPanel('quizContainer');
    displayQuestion();
}

// 错题模式
function startWrongQuestionMode() {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，请刷新页面重试');
        return;
    }
    
    // 获取所有错题
    const wrongQuestionNumbers = Array.from(questionStatus.wrong);
    
    if (wrongQuestionNumbers.length === 0) {
        alert('恭喜！您目前没有错题需要复习。');
        return;
    }
    
    // 筛选出错题对应的题目对象
    const wrongQuestions = wrongQuestionNumbers.map(num => 
        allQuestions.find(q => q.question_number === num)
    ).filter(q => q !== undefined);
    
    if (wrongQuestions.length === 0) {
        alert('找不到对应的错题数据。');
        return;
    }
    
    // 设置错题模式
    currentQuestions = shuffleArray(wrongQuestions);
    userAnswers = new Array(currentQuestions.length).fill([]);
    currentQuestionIndex = 0;
    quizStartTime = new Date();
    isQuizMode = false;
    isWrongQuestionMode = true;
    
    alert(`错题模式已启动！\n共有 ${currentQuestions.length} 道错题需要复习。\n在此模式下，答对题目将自动清除错误记录。`);
    
    showPanel('quizContainer');
    displayQuestion();
}

// 新题模式 - 只选择未测试过的题目
function startNewQuestionMode() {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，请刷新页面重试');
        return;
    }
    
    // 获取所有未测试的题目
    const untestedQuestionNumbers = Array.from(questionStatus.untested);
    
    if (untestedQuestionNumbers.length === 0) {
        alert('恭喜！您已经测试过所有题目。');
        return;
    }
    
    // 获取用户选择的题目数量
    const questionCount = parseInt(document.getElementById('questionCount').value);
    const questionType = document.getElementById('questionType').value;
    const keyword = document.getElementById('searchKeyword').value.trim();
    
    // 筛选出未测试题目对应的题目对象
    let untestedQuestions = untestedQuestionNumbers.map(num => 
        allQuestions.find(q => q.question_number === num)
    ).filter(q => q !== undefined);
    
    // 应用关键词筛选
    if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        untestedQuestions = untestedQuestions.filter(q => 
            q.question_text.toLowerCase().includes(lowerKeyword) ||
            q.options.some(option => option.toLowerCase().includes(lowerKeyword))
        );
    }
    
    // 应用题目类型筛选
    if (questionType === 'single') {
        untestedQuestions = untestedQuestions.filter(q => q.correct_answer.length === 1);
    } else if (questionType === 'multiple') {
        untestedQuestions = untestedQuestions.filter(q => q.correct_answer.length > 1);
    }
    
    if (untestedQuestions.length === 0) {
        alert('没有找到符合条件的新题目，请调整筛选条件');
        return;
    }
    
    // 随机选择指定数量的新题目
    currentQuestions = shuffleArray(untestedQuestions).slice(0, Math.min(questionCount, untestedQuestions.length));
    userAnswers = new Array(currentQuestions.length).fill([]);
    currentQuestionIndex = 0;
    quizStartTime = new Date();
    isQuizMode = false;
    isWrongQuestionMode = false;
    
    alert(`新题模式已启动！\n共有 ${currentQuestions.length} 道新题目需要练习。\n总计还有 ${untestedQuestions.length} 道未测试题目。`);
    
    showPanel('quizContainer');
    displayQuestion();
}

// 显示题库统计
function showStats() {
    if (allQuestions.length === 0) {
        alert('题目数据未加载，请刷新页面重试');
        return;
    }

    const singleChoice = allQuestions.filter(q => q.correct_answer.length === 1).length;
    const multipleChoice = allQuestions.length - singleChoice;

    // 计算答题进度
    const totalAnswered = questionStatus.correct.size + questionStatus.wrong.size;
    const progressPercentage = Math.round((totalAnswered / allQuestions.length) * 100);
    const accuracyPercentage = totalAnswered > 0 ? Math.round((questionStatus.correct.size / totalAnswered) * 100) : 0;

    // 生成统计信息
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <h3>总题目数</h3>
            <div class="stat-value">${allQuestions.length}</div>
        </div>
        <div class="stat-card">
            <h3>单选题</h3>
            <div class="stat-value">${singleChoice}</div>
        </div>
        <div class="stat-card">
            <h3>多选题</h3>
            <div class="stat-value">${multipleChoice}</div>
        </div>
        <div class="stat-card">
            <h3>已答题目</h3>
            <div class="stat-value">${totalAnswered}</div>
        </div>
        <div class="stat-card">
            <h3>答题进度</h3>
            <div class="stat-value">${progressPercentage}%</div>
        </div>
        <div class="stat-card">
            <h3>正确率</h3>
            <div class="stat-value">${accuracyPercentage}%</div>
        </div>
        <div class="stat-card">
            <h3>正确题目</h3>
            <div class="stat-value" style="color: #28a745;">${questionStatus.correct.size}</div>
        </div>
        <div class="stat-card">
            <h3>错误题目</h3>
            <div class="stat-value" style="color: #dc3545;">${questionStatus.wrong.size}</div>
        </div>
        <div class="stat-card">
            <h3>未测试</h3>
            <div class="stat-value" style="color: #ffc107;">${questionStatus.untested.size}</div>
        </div>
    `;

    showPanel('statsContainer');
}

// 显示当前题目
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    const isMultiple = question.correct_answer.length > 1;
    const questionNumber = question.question_number;

    // 重置答题状态
    questionAnswered = false;

    // 更新题目信息
    document.getElementById('questionNumber').textContent = 
        `题目 ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    document.getElementById('questionStats').textContent = 
        isMultiple ? '多选题' : '单选题';
    
    // 根据当前语言显示题目文本
    const questionText = getQuestionText(question, questionNumber);
    document.getElementById('questionText').textContent = questionText;

    // 更新进度条
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // 生成选项
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.onclick = () => selectOption(index, isMultiple);

        const inputType = isMultiple ? 'checkbox' : 'radio';
        const inputName = isMultiple ? `option_${currentQuestionIndex}_${index}` : `option_${currentQuestionIndex}`;
        
        const isSelected = userAnswers[currentQuestionIndex].includes(index);
        
        // 根据当前语言显示选项文本
        const optionText = getOptionText(question, index, questionNumber);
        
        optionDiv.innerHTML = `
            <input type="${inputType}" name="${inputName}" ${isSelected ? 'checked' : ''}>
            <div class="option-text">${optionText}</div>
        `;

        if (isSelected) {
            optionDiv.classList.add('selected');
        }

        optionsContainer.appendChild(optionDiv);
    });

    // 更新导航按钮
    document.getElementById('prevBtn').style.visibility = 
        currentQuestionIndex === 0 ? 'hidden' : 'visible';
    
    const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
    document.getElementById('nextBtn').style.display = isLastQuestion ? 'none' : 'inline-block';
    document.getElementById('finishBtn').style.display = isLastQuestion ? 'inline-block' : 'none';
    
    // 更新退出按钮
    updateExitButton();
    
    // 确保导航按钮是启用状态
    enableNavigationButtons();
}

// 选择选项
function selectOption(optionIndex, isMultiple) {
    const question = currentQuestions[currentQuestionIndex];
    const correctAnswerIndices = question.correct_answer.split('').map(c => 
        question.options.findIndex(opt => opt.startsWith(c))
    );

    const currentAnswers = [...userAnswers[currentQuestionIndex]];
    
    if (isMultiple) {
        const index = currentAnswers.indexOf(optionIndex);
        if (index > -1) {
            currentAnswers.splice(index, 1);
        } else {
            currentAnswers.push(optionIndex);
        }
        userAnswers[currentQuestionIndex] = currentAnswers;
        
        // 更新多选题显示
        updateOptionsDisplay(currentAnswers, correctAnswerIndices, false);
        
        // 移除之前的反馈
        const existingFeedback = document.querySelector('.answer-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // 重置答题状态，允许用户重新尝试
        questionAnswered = false;
    } else {
        // 单选题逻辑
        currentAnswers.length = 0;
        currentAnswers.push(optionIndex);
        userAnswers[currentQuestionIndex] = currentAnswers;

        // 更新单选题显示
        updateOptionsDisplay(currentAnswers, correctAnswerIndices, false);
        
        // 移除之前的反馈
        const existingFeedback = document.querySelector('.answer-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // 重置答题状态，允许用户重新尝试
        questionAnswered = false;
    }
    
    // 更新退出按钮状态
    updateExitButton();
}

// 更新选项显示
function updateOptionsDisplay(userAnswers, correctAnswers, showResults) {
    const options = document.querySelectorAll('.option');
    
    options.forEach((option, index) => {
        const input = option.querySelector('input');
        const isSelected = userAnswers.includes(index);
        const isCorrect = correctAnswers.includes(index);
        
        // 清除之前的状态
        option.classList.remove('selected', 'correct', 'incorrect', 'shake');
        
        input.checked = isSelected;
        
        if (showResults) {
            if (isCorrect) {
                option.classList.add('correct');
            } else if (isSelected && !isCorrect) {
                option.classList.add('incorrect');
            }
            
            // 不禁用点击，允许用户修改答案
            option.style.pointerEvents = 'auto';
        } else {
            if (isSelected) {
                option.classList.add('selected');
            }
            option.style.pointerEvents = 'auto';
        }
    });
}

// 显示答案反馈
function showAnswerFeedback(isCorrect, correctAnswerIndices) {
    const question = currentQuestions[currentQuestionIndex];
    
    // 不在这里更新题目状态，状态更新已经在validateAndShowAnswer中处理
    
    // 创建反馈消息
    let feedbackHtml = '';
    if (isCorrect) {
        let successMessage = '<strong>✓ 回答正确！</strong>';
        if (isWrongQuestionMode) {
            successMessage += '<br><em>🎉 错误记录已清除！此题已标记为正确。</em>';
        } else if (questionStatus.wrong.has(question.question_number)) {
            successMessage += '<br><em>注意：此题之前答错过，需要右键点击题目网格中的编号手动标记为正确</em>';
        }
        
        feedbackHtml = `
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 15px; margin-top: 20px; color: #155724;">
                ${successMessage}
            </div>
        `;
    } else {
        const correctOptions = correctAnswerIndices.map(index => question.options[index]).join('<br>');
        feedbackHtml = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin-top: 20px; color: #721c24;">
                <strong>✗ 回答错误</strong><br>
                正确答案是：<br>
                ${correctOptions}
                ${question.explanation ? `<br><br><strong>解释：</strong>${question.explanation}` : ''}
                <br><br><em>💡 提示：您可以修改答案后重新点击"下一题"，错误选项会有抖动提示</em>
            </div>
        `;
    }
    
    // 移除之前的反馈
    const existingFeedback = document.querySelector('.answer-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // 添加新反馈
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'answer-feedback';
    feedbackDiv.innerHTML = feedbackHtml;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.parentNode.insertBefore(feedbackDiv, optionsContainer.nextSibling);
}

// 启用导航按钮
function enableNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    if (nextBtn.style.display !== 'none') {
        nextBtn.disabled = false;
        nextBtn.style.opacity = '1';
    }
    if (finishBtn.style.display !== 'none') {
        finishBtn.disabled = false;
        finishBtn.style.opacity = '1';
    }
}

// 更新退出按钮
function updateExitButton() {
    const exitBtn = document.querySelector('button[onclick="exitQuiz()"]');
    if (!exitBtn) return;
    
    // 检查是否所有题目都已回答
    const allAnswered = checkAllQuestionsAnswered();
    
    if (allAnswered) {
        exitBtn.textContent = '完成测试';
        exitBtn.className = 'btn-success';
    } else {
        exitBtn.textContent = '退出测试';
        exitBtn.className = 'btn-danger';
    }
}

// 检查是否所有题目都已回答
function checkAllQuestionsAnswered() {
    for (let i = 0; i < currentQuestions.length; i++) {
        if (userAnswers[i].length === 0) {
            return false;
        }
    }
    return true;
}

// 禁用导航按钮
function disableNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    
    nextBtn.disabled = true;
    nextBtn.style.opacity = '0.5';
    finishBtn.disabled = true;
    finishBtn.style.opacity = '0.5';
}

// 上一题
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        // 移除反馈
        const existingFeedback = document.querySelector('.answer-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }
}

// 下一题
function nextQuestion() {
    if (!validateAndShowAnswer()) {
        return; // 如果答案错误，显示反馈后停止
    }
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        // 移除反馈
        const existingFeedback = document.querySelector('.answer-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
    }
}

// 验证答案并显示反馈
function validateAndShowAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const correctAnswerIndices = question.correct_answer.split('').map(c => 
        question.options.findIndex(opt => opt.startsWith(c))
    );
    
    // 检查是否已选择答案
    if (userAnswer.length === 0) {
        alert('请先选择答案！');
        return false;
    }
    
    // 检查答案是否完全正确
    const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswerIndices.sort());
    
    if (!isCorrect) {
        // 第一次答错时立即标记为错误（无论后续是否修改正确）
        markQuestionAsWrongOnFirstError(question.question_number);
        
        // 检查是否已经显示过错误反馈
        const existingFeedback = document.querySelector('.answer-feedback');
        const hasShownFeedback = existingFeedback !== null;
        
        // 显示正确答案
        updateOptionsDisplay(userAnswer, correctAnswerIndices, true);
        showAnswerFeedback(false, correctAnswerIndices);
        
        // 如果已经显示过反馈，说明用户没有修改答案，添加抖动效果
        if (hasShownFeedback) {
            shakeIncorrectOptions(userAnswer, correctAnswerIndices);
        }
        
        return false;
    }
    
    // 答案正确时的处理
    if (isWrongQuestionMode) {
        // 错题模式下答对时，自动清除错误记录
        markQuestionAsCorrect(question.question_number);
    } else {
        // 普通模式下，记录正确答案（如果之前没有答错过）
        markQuestionAsCorrectOnFirstSuccess(question.question_number);
    }
    
    updateOptionsDisplay(userAnswer, correctAnswerIndices, true);
    showAnswerFeedback(true, correctAnswerIndices);
    questionAnswered = true;
    return true;
}

// 为错误选项添加抖动效果
function shakeIncorrectOptions(userAnswers, correctAnswers) {
    const options = document.querySelectorAll('.option');
    
    options.forEach((option, index) => {
        const isSelected = userAnswers.includes(index);
        const isCorrect = correctAnswers.includes(index);
        
        // 只对选中但错误的选项添加抖动效果
        if (isSelected && !isCorrect) {
            option.classList.add('shake');
            
            // 2秒后移除抖动效果
            setTimeout(() => {
                option.classList.remove('shake');
            }, 2000);
        }
    });
}

// 验证当前题目答案是否正确（保留原有函数用于其他地方）
function validateCurrentAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex];
    const correctAnswerIndices = question.correct_answer.split('').map(c => 
        question.options.findIndex(opt => opt.startsWith(c))
    );
    
    // 检查是否已选择答案
    if (userAnswer.length === 0) {
        alert('请先选择答案！');
        return false;
    }
    
    // 检查答案是否完全正确
    const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswerIndices.sort());
    if (!isCorrect) {
        alert('答案不正确，请重新选择！');
        return false;
    }
    
    return true;
}

// 退出测试
function exitQuiz() {
    // 检查是否所有题目都已回答
    const allAnswered = checkAllQuestionsAnswered();
    
    if (allAnswered) {
        // 如果所有题目都已回答，直接完成测试
        finishQuiz();
    } else {
        // 如果还有未回答的题目，确认是否退出
        if (confirm('确定要退出测试吗？当前进度将丢失。')) {
            showPanel('controlsPanel');
            currentQuestions = [];
            userAnswers = [];
            currentQuestionIndex = 0;
            isWrongQuestionMode = false;
        }
    }
}

// 完成测试
function finishQuiz() {
    if (!validateAndShowAnswer()) {
        return; // 如果答案错误，显示反馈后停止
    }
    
    if (!confirm('确定要完成测试吗？')) {
        return;
    }

    const endTime = new Date();
    const duration = Math.round((endTime - quizStartTime) / 1000);
    
    let correctCount = 0;
    
    // 只计算当前测试的得分，不更新题目状态
    currentQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index].sort();
        const correctAnswer = question.correct_answer.split('').map(c => 
            question.options.findIndex(opt => opt.startsWith(c))
        ).sort();
        
        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        if (isCorrect) {
            correctCount++;
        }
    });

    const score = Math.round((correctCount / currentQuestions.length) * 100);
    showResults(correctCount, currentQuestions.length, score, duration);
}

// 显示结果
function showResults(correctCount, totalCount, score, duration) {
    const grade = getGrade(score);
    
    document.getElementById('scoreDisplay').textContent = `${score}%`;
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const timeString = `${minutes}分${seconds}秒`;
    
    document.getElementById('scoreDetails').innerHTML = `
        <div class="score-item">
            <h3>总分</h3>
            <div class="value">${score}%</div>
        </div>
        <div class="score-item">
            <h3>正确</h3>
            <div class="value">${correctCount}</div>
        </div>
        <div class="score-item">
            <h3>错误</h3>
            <div class="value">${totalCount - correctCount}</div>
        </div>
        <div class="score-item">
            <h3>用时</h3>
            <div class="value">${timeString}</div>
        </div>
        <div class="score-item">
            <h3>评级</h3>
            <div class="value">${grade}</div>
        </div>
    `;

    showPanel('resultsContainer');
}

// 获取评级
function getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}

// 查看答案解析
function reviewAnswers() {
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';

    currentQuestions.forEach((question, questionIndex) => {
        const userAnswer = userAnswers[questionIndex];
        const correctAnswerIndices = question.correct_answer.split('').map(c => 
            question.options.findIndex(opt => opt.startsWith(c))
        );
        
        const isCorrect = JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswerIndices.sort());
        const questionNumber = question.question_number;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = `review-question ${isCorrect ? '' : 'incorrect'}`;
        
        let optionsHtml = '';
        question.options.forEach((option, optionIndex) => {
            let optionClass = '';
            if (correctAnswerIndices.includes(optionIndex)) {
                optionClass = 'correct-answer';
            }
            if (userAnswer.includes(optionIndex) && !correctAnswerIndices.includes(optionIndex)) {
                optionClass = 'incorrect-answer';
            }
            if (userAnswer.includes(optionIndex) && correctAnswerIndices.includes(optionIndex)) {
                optionClass = 'user-answer';
            }
            
            // 根据当前语言显示选项文本
            const optionText = getOptionText(question, optionIndex, questionNumber);
            optionsHtml += `<div class="review-option ${optionClass}">${optionText}</div>`;
        });
        
        // 根据当前语言显示题目文本和解释
        const questionText = getQuestionText(question, questionNumber);
        const explanationText = getExplanationText(question, questionNumber);
        
        questionDiv.innerHTML = `
            <div class="review-header">
                题目 ${questionIndex + 1} ${isCorrect ? '✓ 正确' : '✗ 错误'}
                <button class="lang-switch-btn" onclick="toggleLanguageForReview(this, ${questionIndex})" title="切换此题语言">
                    🌐 ${currentLanguage === 'en' ? '中文' : 'EN'}
                </button>
            </div>
            <div class="review-text">${questionText}</div>
            <div class="review-options">${optionsHtml}</div>
            <div class="review-answer">
                <strong>正确答案：</strong>${question.correct_answer}
                ${explanationText ? `<br><strong>解释：</strong>${explanationText}` : ''}
            </div>
        `;
        
        reviewContent.appendChild(questionDiv);
    });

    showPanel('reviewContainer');
}

// 为单个题目切换语言（简化版本）
function toggleLanguageForReview(button, questionIndex) {
    if (typeof TRANSLATED_QUESTIONS_DATA === 'undefined') {
        alert('中文翻译数据未加载');
        return;
    }
    
    const question = currentQuestions[questionIndex];
    const questionNumber = question.question_number;
    
    // 找到对应的题目容器
    const reviewQuestions = document.querySelectorAll('.review-question');
    const questionDiv = reviewQuestions[questionIndex];
    
    // 获取当前按钮状态来判断当前语言
    const isCurrentlyEnglish = button.innerHTML.includes('中文');
    
    // 更新文本内容
    const reviewTextDiv = questionDiv.querySelector('.review-text');
    const reviewAnswerDiv = questionDiv.querySelector('.review-answer');
    const optionDivs = questionDiv.querySelectorAll('.review-option');
    
    if (isCurrentlyEnglish) {
        // 切换到中文
        const translatedQuestion = TRANSLATED_QUESTIONS_DATA.questions.find(q => 
            q.question_number === questionNumber
        );
        
        if (translatedQuestion) {
            reviewTextDiv.textContent = translatedQuestion.question_text_cn || question.question_text;
            
            // 更新选项
            question.options.forEach((option, optionIndex) => {
                if (optionDivs[optionIndex] && translatedQuestion.options_cn && translatedQuestion.options_cn[optionIndex]) {
                    const currentClasses = optionDivs[optionIndex].className;
                    optionDivs[optionIndex].innerHTML = translatedQuestion.options_cn[optionIndex];
                    optionDivs[optionIndex].className = currentClasses;
                }
            });
            
            // 更新解释
            const explanation = translatedQuestion.explanation_cn || question.explanation || '';
            reviewAnswerDiv.innerHTML = `
                <strong>正确答案：</strong>${question.correct_answer}
                ${explanation ? `<br><strong>解释：</strong>${explanation}` : ''}
            `;
        }
        
        button.innerHTML = '🌐 EN';
    } else {
        // 切换到英文
        reviewTextDiv.textContent = question.question_text;
        
        // 更新选项
        question.options.forEach((option, optionIndex) => {
            if (optionDivs[optionIndex]) {
                const currentClasses = optionDivs[optionIndex].className;
                optionDivs[optionIndex].innerHTML = option;
                optionDivs[optionIndex].className = currentClasses;
            }
        });
        
        // 更新解释
        const explanation = question.explanation || '';
        reviewAnswerDiv.innerHTML = `
            <strong>正确答案：</strong>${question.correct_answer}
            ${explanation ? `<br><strong>解释：</strong>${explanation}` : ''}
        `;
        
        button.innerHTML = '🌐 中文';
    }
}

// 返回主界面
function backToMain() {
    showPanel('controlsPanel');
}

// 返回结果界面
function backToResults() {
    showPanel('resultsContainer');
}

// 重新开始测试
function restartQuiz() {
    showPanel('controlsPanel');
    currentQuestions = [];
    userAnswers = [];
    currentQuestionIndex = 0;
}

// 显示指定面板
function showPanel(panelId) {
    const panels = ['controlsPanel', 'quizContainer', 'resultsContainer', 'statsContainer', 'reviewContainer'];
    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) {
            panel.style.display = id === panelId ? 'block' : 'none';
        }
    });
    
    // 题目状态总览只在首页（controlsPanel）显示
    const questionStatusPanel = document.getElementById('questionStatus');
    if (questionStatusPanel) {
        questionStatusPanel.style.display = panelId === 'controlsPanel' ? 'block' : 'none';
    }
}

// 工具函数：数组洗牌
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 键盘快捷键支持
document.addEventListener('keydown', function(event) {
    if (document.getElementById('quizContainer').style.display === 'block') {
        switch(event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                previousQuestion();
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextQuestion();
                break;
            case 'Enter':
                event.preventDefault();
                if (currentQuestionIndex === currentQuestions.length - 1) {
                    finishQuiz();
                } else {
                    nextQuestion();
                }
                break;
            case 'Escape':
                event.preventDefault();
                exitQuiz();
                break;
        }
    }
});

// 控制台输出使用说明
console.log(`
CSA自测系统快捷键说明：
- ← 上一题
- → 下一题  
- Enter 下一题/完成测试
- Escape 退出测试

题目数据加载完成后即可开始使用！
`);
