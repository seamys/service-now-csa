// CSA Exam Mode JavaScript File

// Global Variables
let examQuestions = [];
let currentExamQuestionIndex = 0;
let examAnswers = [];
let examStartTime = null;
let examDuration = 90 * 60 * 1000; // 90分钟
let examTimer = null;
let examTimeRemaining = examDuration;
let examSettings = {
    difficulty: 'normal',
    questionSelection: 'random',
    examMode: 'standard'
};
let examFlags = new Set(); // 标记的题目
let examNotes = {}; // 题目笔记
let examSubmitted = false;
let currentModalAction = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 显示加载屏幕
    showLoadingScreen();
    
    // 模拟加载过程
    setTimeout(() => {
        hideLoadingScreen();
        initializeExamMode();
    }, 2000);
});

// 显示加载屏幕
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

// 隐藏加载屏幕
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.animation = 'fadeOut 0.5s ease-in-out forwards';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// 初始化考试模式
function initializeExamMode() {
    // 检查确认复选框状态
    const confirmCheckbox = document.getElementById('confirmReady');
    const startButton = document.getElementById('startExamBtn');
    
    confirmCheckbox.addEventListener('change', function() {
        startButton.disabled = !this.checked;
    });
    
    // 初始化题目数据
    if (typeof QUESTIONS_DATA !== 'undefined' && QUESTIONS_DATA.questions) {
        console.log('Question data loaded successfully, total:', QUESTIONS_DATA.questions.length, 'questions');
    } else {
        console.error('Failed to load question data');
        alert('Failed to load question data. Please refresh the page and try again.');
    }
}

// 开始考试
function startExam() {
    const difficulty = document.getElementById('examDifficulty').value;
    const questionSelection = document.getElementById('questionSelection').value;
    const examMode = document.getElementById('examMode').value;
    
    examSettings = { difficulty, questionSelection, examMode };
    
    // 准备考试题目
    prepareExamQuestions();
    
    // 隐藏准备界面，显示考试界面
    document.getElementById('examPreparation').style.display = 'none';
    document.getElementById('examContainer').style.display = 'block';
    
    // 初始化考试状态
    examStartTime = new Date();
    examTimeRemaining = examDuration;
    currentExamQuestionIndex = 0;
    examAnswers = new Array(60).fill(null);
    examFlags.clear();
    examNotes = {};
    examSubmitted = false;
    
    // 启动计时器
    startExamTimer();
    
    // 生成题目导航
    generateQuestionNavigator();
    
    // 显示第一题
    showExamQuestion(0);
    
    // 禁用浏览器后退
    preventBrowserBack();
    
    console.log('ServiceNow CSA Exam Started!');
}

// 准备考试题目
function prepareExamQuestions() {
    if (!QUESTIONS_DATA || !QUESTIONS_DATA.questions) {
        alert('Question data not loaded');
        return;
    }
    
    let availableQuestions = [...QUESTIONS_DATA.questions];
    
    // 根据选择策略筛选题目
    switch (examSettings.questionSelection) {
        case 'weighted':
            // 加权选择，偏向错题
            availableQuestions = weightedQuestionSelection(availableQuestions);
            break;
        case 'untested':
            // 优先未测试题目
            availableQuestions = untestedQuestionSelection(availableQuestions);
            break;
        default:
            // 随机选择
            availableQuestions = shuffleArray(availableQuestions);
    }
    
    // 选择60题
    examQuestions = availableQuestions.slice(0, 60);
    
    console.log('Exam questions prepared, total:', examQuestions.length, 'questions');
}

// 加权题目选择
function weightedQuestionSelection(questions) {
    // 从localStorage获取错题记录
    const wrongQuestions = getWrongQuestions();
    const weightedQuestions = [];
    
    // 错题权重更高
    questions.forEach(q => {
        const weight = wrongQuestions.includes(q.question_number) ? 3 : 1;
        for (let i = 0; i < weight; i++) {
            weightedQuestions.push(q);
        }
    });
    
    return shuffleArray(weightedQuestions);
}

// 未测试题目选择
function untestedQuestionSelection(questions) {
    const testedQuestions = getTestedQuestions();
    const untestedQuestions = questions.filter(q => 
        !testedQuestions.includes(q.question_number)
    );
    
    // 如果未测试题目不够60题，补充其他题目
    if (untestedQuestions.length < 60) {
        const remainingQuestions = questions.filter(q => 
            testedQuestions.includes(q.question_number)
        );
        return [...untestedQuestions, ...shuffleArray(remainingQuestions)];
    }
    
    return shuffleArray(untestedQuestions);
}

// 获取错题记录
function getWrongQuestions() {
    const saved = localStorage.getItem('csa_question_status');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            return data.wrong || [];
        } catch (e) {
            return [];
        }
    }
    return [];
}

// 获取已测试题目
function getTestedQuestions() {
    const saved = localStorage.getItem('csa_question_status');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            return [...(data.correct || []), ...(data.wrong || [])];
        } catch (e) {
            return [];
        }
    }
    return [];
}

// 数组洗牌
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 启动考试计时器
function startExamTimer() {
    examTimer = setInterval(() => {
        examTimeRemaining -= 1000;
        updateTimerDisplay();
        
        if (examTimeRemaining <= 0) {
            // 时间到，自动提交
            timeUpSubmitExam();
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const minutes = Math.floor(examTimeRemaining / 60000);
    const seconds = Math.floor((examTimeRemaining % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('timeRemaining');
    timerElement.textContent = timeString;
    
    // 时间警告样式
    timerElement.className = 'timer-display';
    if (examTimeRemaining <= 10 * 60 * 1000) { // 最后10分钟
        timerElement.classList.add('warning');
    }
    if (examTimeRemaining <= 5 * 60 * 1000) { // 最后5分钟
        timerElement.classList.add('danger');
    }
}

// 生成题目导航
function generateQuestionNavigator() {
    const navigatorGrid = document.getElementById('navigatorGrid');
    navigatorGrid.innerHTML = '';
    
    for (let i = 0; i < 60; i++) {
        const navItem = document.createElement('div');
        navItem.className = 'nav-question';
        navItem.textContent = i + 1;
        navItem.onclick = () => showExamQuestion(i);
        navigatorGrid.appendChild(navItem);
    }
    
    updateNavigatorStatus();
}

// 更新导航状态
function updateNavigatorStatus() {
    const navItems = document.querySelectorAll('.nav-question');
    navItems.forEach((item, index) => {
        item.className = 'nav-question';
        
        if (index === currentExamQuestionIndex) {
            item.classList.add('current');
        }
        
        if (examAnswers[index] !== null) {
            item.classList.add('answered');
        }
        
        if (examFlags.has(index)) {
            item.classList.add('flagged');
        }
    });
}

// 显示考试题目
function showExamQuestion(questionIndex) {
    if (questionIndex < 0 || questionIndex >= examQuestions.length) return;
    
    currentExamQuestionIndex = questionIndex;
    const question = examQuestions[questionIndex];
    
    // 更新题目编号和进度
    document.getElementById('currentQuestionNum').textContent = questionIndex + 1;
    updateExamProgress();
    
    // 更新题目类型
    const isMultiple = question.correct_answer && question.correct_answer.length > 1;
    document.getElementById('examQuestionType').textContent = isMultiple ? 'Multiple Select' : 'Multiple Choice';
    
    // 更新题目状态
    updateQuestionStatus(questionIndex);
    
    // 显示题目内容
    displayExamQuestionContent(question);
    
    // 更新导航按钮状态
    updateNavigationButtons();
    
    // 更新导航状态
    updateNavigatorStatus();
    
    // 加载题目笔记
    loadQuestionNotes(questionIndex);
}

// 更新考试进度
function updateExamProgress() {
    const progress = ((currentExamQuestionIndex + 1) / 60) * 100;
    document.getElementById('examProgressFill').style.width = progress + '%';
    
    // 更新进度标记
    const markers = document.getElementById('progressMarkers');
    markers.innerHTML = '';
    
    // 每10题一个标记
    for (let i = 0; i < 6; i++) {
        const marker = document.createElement('div');
        marker.className = 'progress-marker';
        if (i * 10 <= currentExamQuestionIndex) {
            marker.classList.add('current');
        }
        markers.appendChild(marker);
    }
}

// 更新题目状态显示
function updateQuestionStatus(questionIndex) {
    const statusElement = document.getElementById('examQuestionStatus');
    statusElement.className = 'question-status';
    
    if (examAnswers[questionIndex] !== null) {
        statusElement.textContent = 'Answered';
        statusElement.classList.add('answered');
    } else {
        statusElement.textContent = 'Not Answered';
    }
    
    if (examFlags.has(questionIndex)) {
        statusElement.classList.add('flagged');
    }
}

// 显示题目内容
function displayExamQuestionContent(question) {
    // 显示题目文本 - 只显示英文
    const questionText = question.question_text;
    
    document.getElementById('examQuestionText').innerHTML = questionText;
    
    // 显示选项
    displayExamOptions(question);
}

// 显示题目选项
function displayExamOptions(question) {
    const container = document.getElementById('examOptionsContainer');
    container.innerHTML = '';
    
    // 判断是否为多选题：答案长度大于1表示多选
    const isMultiple = question.correct_answer && question.correct_answer.length > 1;
    const inputType = isMultiple ? 'checkbox' : 'radio';
    const inputName = `question_${currentExamQuestionIndex}`;
    
    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
        
        // 只显示英文选项
        const optionText = option;
        
        optionDiv.innerHTML = `
            <input type="${inputType}" 
                   name="${inputName}" 
                   value="${optionLetter}" 
                   id="option_${currentExamQuestionIndex}_${optionLetter}">
            <label for="option_${currentExamQuestionIndex}_${optionLetter}" class="option-text">
                ${optionText}
            </label>
        `;
        
        container.appendChild(optionDiv);
        
        // 为每个input添加change事件监听器
        const input = optionDiv.querySelector('input');
        input.addEventListener('change', recordExamAnswer);
    });
    
    // 恢复之前的答案
    restoreExamAnswer();
}

// 记录考试答案
function recordExamAnswer() {
    const inputName = `question_${currentExamQuestionIndex}`;
    const inputs = document.querySelectorAll(`input[name="${inputName}"]:checked`);
    
    if (inputs.length > 0) {
        const answers = Array.from(inputs).map(input => input.value);
        // 对于多选题，直接拼接字母，不用逗号分隔（与正确答案格式保持一致）
        examAnswers[currentExamQuestionIndex] = answers.sort().join('');
        
        // 更新状态显示
        updateQuestionStatus(currentExamQuestionIndex);
        updateNavigatorStatus();
        updateExamOverviewStats();
    } else {
        // 如果没有选择任何选项，清除答案
        examAnswers[currentExamQuestionIndex] = null;
        updateQuestionStatus(currentExamQuestionIndex);
        updateNavigatorStatus();
        updateExamOverviewStats();
    }
    
    // 更新选项样式
    updateOptionSelection();
}

// 格式化答案显示
function formatAnswerDisplay(answer) {
    if (!answer || answer === 'Not Answered') {
        return answer;
    }
    
    // 如果是多选答案（长度大于1），用逗号分隔显示
    if (answer.length > 1) {
        return answer.split('').join(', ');
    }
    
    return answer;
}

// 恢复考试答案
function restoreExamAnswer() {
    const answer = examAnswers[currentExamQuestionIndex];
    if (answer) {
        // 对于多选答案（如"ABC"），需要拆分成单个字母
        const answers = answer.length > 1 ? answer.split('') : [answer];
        answers.forEach(ans => {
            const input = document.getElementById(`option_${currentExamQuestionIndex}_${ans}`);
            if (input) {
                input.checked = true;
                input.closest('.option').classList.add('selected');
            }
        });
    }
    
    // 添加选项点击效果
    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', function(e) {
            const input = this.querySelector('input');
            
            // 如果点击的是input本身，让浏览器处理默认行为
            if (e.target === input) {
                setTimeout(() => {
                    updateOptionSelection();
                }, 0);
                return;
            }
            
            // 如果点击的是选项区域，手动切换input状态
            if (input.type === 'radio') {
                // 单选题：选中当前选项
                input.checked = true;
                input.dispatchEvent(new Event('change'));
            } else {
                // 多选题：切换当前选项
                input.checked = !input.checked;
                input.dispatchEvent(new Event('change'));
            }
            
            updateOptionSelection();
        });
    });
    
    // 初始化选项样式
    updateOptionSelection();
}

// 更新选项选中样式
function updateOptionSelection() {
    document.querySelectorAll('.option').forEach(option => {
        const input = option.querySelector('input');
        if (input.checked) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('examPrevBtn');
    const nextBtn = document.getElementById('examNextBtn');
    
    prevBtn.disabled = currentExamQuestionIndex === 0;
    nextBtn.style.display = currentExamQuestionIndex === 59 ? 'none' : 'inline-block';
}

// 上一题
function examPreviousQuestion() {
    if (currentExamQuestionIndex > 0) {
        showExamQuestion(currentExamQuestionIndex - 1);
    }
}

// 下一题
function examNextQuestion() {
    if (currentExamQuestionIndex < 59) {
        showExamQuestion(currentExamQuestionIndex + 1);
    }
}

// 标记题目
function flagQuestion() {
    const questionIndex = currentExamQuestionIndex;
    if (examFlags.has(questionIndex)) {
        examFlags.delete(questionIndex);
        document.getElementById('flagIcon').textContent = '🚩';
    } else {
        examFlags.add(questionIndex);
        document.getElementById('flagIcon').textContent = '🏁';
    }
    
    updateQuestionStatus(questionIndex);
    updateNavigatorStatus();
    updateExamOverviewStats();
}

// 保存题目笔记
function saveQuestionNotes() {
    const notes = document.getElementById('questionNotes').value;
    if (notes.trim()) {
        examNotes[currentExamQuestionIndex] = notes;
    } else {
        delete examNotes[currentExamQuestionIndex];
    }
}

// 加载题目笔记
function loadQuestionNotes(questionIndex) {
    const notesTextarea = document.getElementById('questionNotes');
    notesTextarea.value = examNotes[questionIndex] || '';
    
    // 自动保存笔记
    notesTextarea.addEventListener('input', saveQuestionNotes);
}

// 显示考试概览
function showExamOverview() {
    updateExamOverviewStats();
    generateOverviewGrid();
    document.getElementById('examOverview').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'flex';
}

// 关闭考试概览
function closeExamOverview() {
    document.getElementById('examOverview').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// 更新考试概览统计
function updateExamOverviewStats() {
    const answeredCount = examAnswers.filter(answer => answer !== null).length;
    const unansweredCount = 60 - answeredCount;
    const flaggedCount = examFlags.size;
    
    document.getElementById('answeredCount').textContent = answeredCount;
    document.getElementById('unansweredCount').textContent = unansweredCount;
    document.getElementById('flaggedCount').textContent = flaggedCount;
}

// 生成概览网格
function generateOverviewGrid() {
    const overviewGrid = document.getElementById('overviewGrid');
    overviewGrid.innerHTML = '';
    
    for (let i = 0; i < 60; i++) {
        const gridItem = document.createElement('div');
        gridItem.className = 'overview-question';
        gridItem.textContent = i + 1;
        gridItem.onclick = () => {
            closeExamOverview();
            showExamQuestion(i);
        };
        
        if (examAnswers[i] !== null) {
            gridItem.classList.add('answered');
        }
        
        if (examFlags.has(i)) {
            gridItem.classList.add('flagged');
        }
        
        overviewGrid.appendChild(gridItem);
    }
}

// 切换导航器显示状态
function toggleNavigator() {
    const navigatorGrid = document.getElementById('navigatorGrid');
    const toggleBtn = document.querySelector('.nav-toggle');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (navigatorGrid.classList.contains('collapsed')) {
        navigatorGrid.classList.remove('collapsed');
        toggleBtn.classList.remove('collapsed');
    } else {
        navigatorGrid.classList.add('collapsed');
        toggleBtn.classList.add('collapsed');
    }
}

// 提交考试
function submitExam() {
    // 检查未作答题目
    const unansweredCount = examAnswers.filter(answer => answer === null).length;
    
    if (unansweredCount > 0) {
        showModal(
            'Confirm Submission',
            `You have ${unansweredCount} unanswered questions. Are you sure you want to submit the exam? Unanswered questions will be marked as incorrect.`,
            () => confirmSubmitExam()
        );
    } else {
        showModal(
            'Confirm Submission',
            'You have completed all questions. Are you sure you want to submit the exam? You cannot change your answers after submission.',
            () => confirmSubmitExam()
        );
    }
}

// 确认提交考试（从概览界面）
function confirmSubmitExam() {
    closeExamOverview();
    submitExam();
}

// 时间到自动提交
function timeUpSubmitExam() {
    if (!examSubmitted) {
        showModal(
            'Time Expired',
            'Exam time has expired. Your answers will be automatically submitted.',
            () => confirmSubmitExam(),
            false // 不显示取消按钮
        );
    }
}

// 确认提交
function confirmSubmitExam() {
    examSubmitted = true;
    clearInterval(examTimer);
    
    // 计算成绩
    calculateExamScore();
    
    // 显示结果
    showExamResults();
    
    // 保存考试记录
    saveExamRecord();
}

// 计算考试成绩
function calculateExamScore() {
    let correctCount = 0;
    let wrongCount = 0;
    
    examQuestions.forEach((question, index) => {
        const userAnswer = examAnswers[index];
        const correctAnswer = question.correct_answer;
        
        if (userAnswer === correctAnswer) {
            correctCount++;
        } else {
            wrongCount++;
        }
    });
    
    const score = Math.round((correctCount / 60) * 100);
    const passed = score >= 70;
    
    // 更新结果显示
    document.getElementById('examScore').textContent = score + '%';
    document.getElementById('correctAnswers').textContent = correctCount;
    document.getElementById('wrongAnswers').textContent = wrongCount;
    
    // 计算用时
    const endTime = new Date();
    const duration = Math.round((endTime - examStartTime) / (1000 * 60));
    document.getElementById('examDuration').textContent = duration + ' minutes';
    
    // 设置通过状态
    const passStatusElement = document.getElementById('passStatus');
    const scoreElement = document.getElementById('examScore');
    
    if (passed) {
        passStatusElement.textContent = 'PASSED';
        passStatusElement.className = 'pass-status';
        scoreElement.className = 'exam-score';
    } else {
        passStatusElement.textContent = 'FAILED';
        passStatusElement.className = 'pass-status fail';
        scoreElement.className = 'exam-score fail';
    }
    
    return { score, correctCount, wrongCount, passed, duration };
}

// 显示考试结果
function showExamResults() {
    document.getElementById('examContainer').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';
}

// 保存考试记录
function saveExamRecord() {
    const examRecord = {
        date: new Date().toISOString(),
        score: parseInt(document.getElementById('examScore').textContent),
        correctCount: parseInt(document.getElementById('correctAnswers').textContent),
        wrongCount: parseInt(document.getElementById('wrongAnswers').textContent),
        duration: document.getElementById('examDuration').textContent,
        questions: examQuestions.map((q, index) => ({
            questionNumber: q.question_number,
            userAnswer: examAnswers[index],
            correctAnswer: q.correct_answer,
            isCorrect: examAnswers[index] === q.correct_answer
        })),
        settings: examSettings,
        flags: Array.from(examFlags),
        notes: examNotes
    };
    
    // 保存到localStorage
    const existingRecords = JSON.parse(localStorage.getItem('csa_exam_records') || '[]');
    existingRecords.push(examRecord);
    localStorage.setItem('csa_exam_records', JSON.stringify(existingRecords));
    
    console.log('Exam record saved successfully');
}

// 重新考试
function restartExam() {
    if (confirm('Are you sure you want to restart the exam? Current progress will be lost.')) {
        // 重置所有状态
        document.getElementById('examResults').style.display = 'none';
        document.getElementById('examReview').style.display = 'none';
        document.getElementById('examPreparation').style.display = 'block';
        
        // 重置复选框
        document.getElementById('confirmReady').checked = false;
        document.getElementById('startExamBtn').disabled = true;
    }
}

// 查看答案解析
function reviewExamAnswers() {
    generateExamReview();
    document.getElementById('examResults').style.display = 'none';
    document.getElementById('examReview').style.display = 'block';
}

// 生成考试解析
function generateExamReview() {
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';
    
    examQuestions.forEach((question, index) => {
        const userAnswer = examAnswers[index] || 'Not Answered';
        const correctAnswer = question.correct_answer;
        const isCorrect = userAnswer === correctAnswer;
        
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-question ${isCorrect ? 'correct' : 'wrong'}`;
        
        reviewItem.innerHTML = `
            <div class="review-question-header">
                <span class="review-question-number">Question ${index + 1}</span>
                <span class="review-result ${isCorrect ? 'correct' : 'wrong'}">
                    ${isCorrect ? 'Correct' : 'Incorrect'}
                </span>
            </div>
            <div class="review-question-text">${question.question_text}</div>
            <div class="review-options">
                ${question.options.map(option => `<div class="review-option">${option}</div>`).join('')}
            </div>
            <div class="review-answers">
                <div><strong>Your Answer:</strong> ${userAnswer}</div>
                <div><strong>Correct Answer:</strong> ${correctAnswer}</div>
                ${question.explanation ? `<div><strong>Explanation:</strong> ${question.explanation}</div>` : ''}
                ${examNotes[index] ? `<div><strong>Your Notes:</strong> ${examNotes[index]}</div>` : ''}
            </div>
        `;
        
        reviewContent.appendChild(reviewItem);
    });
}

// 返回考试结果
function backToExamResults() {
    document.getElementById('examReview').style.display = 'none';
    document.getElementById('examResults').style.display = 'block';
}

// 返回练习模式
function backToQuiz() {
    if (confirm('Are you sure you want to return to practice mode?')) {
        window.location.href = 'csa_standalone_quiz.html';
    }
}

// 保存考试报告
function saveExamReport() {
    const report = generateExamReport();
    const blob = new Blob([report], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ServiceNow_CSA_Exam_Report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// 生成考试报告
function generateExamReport() {
    const score = document.getElementById('examScore').textContent;
    const correct = document.getElementById('correctAnswers').textContent;
    const wrong = document.getElementById('wrongAnswers').textContent;
    const duration = document.getElementById('examDuration').textContent;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ServiceNow CSA Exam Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .question { margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; }
        .correct { border-left: 4px solid #28a745; }
        .wrong { border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ServiceNow CSA Certification Exam Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="summary">
        <h2>Exam Summary</h2>
        <p>Score: ${score}</p>
        <p>Correct Answers: ${correct}/60</p>
        <p>Incorrect Answers: ${wrong}/60</p>
        <p>Time Taken: ${duration}</p>
    </div>
    <div class="details">
        <h2>Detailed Review</h2>
        ${examQuestions.map((q, i) => {
            const userAnswer = examAnswers[i] || 'Not Answered';
            const isCorrect = userAnswer === q.correct_answer;
            return `
                <div class="question ${isCorrect ? 'correct' : 'wrong'}">
                    <h3>Question ${i + 1} ${isCorrect ? '✓' : '✗'}</h3>
                    <p><strong>Question:</strong> ${q.question_text}</p>
                    <p><strong>Your Answer:</strong> ${formatAnswerDisplay(userAnswer)}</p>
                    <p><strong>Correct Answer:</strong> ${formatAnswerDisplay(q.correct_answer)}</p>
                    ${q.explanation ? `<p><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
                </div>
            `;
        }).join('')}
    </div>
</body>
</html>
    `;
}

// 导出错题
function exportWrongQuestions() {
    const wrongQuestions = examQuestions.filter((q, index) => 
        examAnswers[index] !== q.correct_answer
    );
    
    const wrongQuestionsData = {
        export_date: new Date().toISOString(),
        total_wrong: wrongQuestions.length,
        questions: wrongQuestions.map((q, originalIndex) => ({
            ...q,
            user_answer: examAnswers[examQuestions.indexOf(q)],
            question_index: examQuestions.indexOf(q) + 1
        }))
    };
    
    const blob = new Blob([JSON.stringify(wrongQuestionsData, null, 2)], 
        { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ServiceNow_CSA_Incorrect_Questions_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// 显示模态框
function showModal(title, message, confirmCallback, showCancel = true) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('modalOverlay').style.display = 'flex';
    
    const cancelBtn = document.querySelector('.modal-actions .btn-secondary');
    cancelBtn.style.display = showCancel ? 'inline-block' : 'none';
    
    currentModalAction = confirmCallback;
}

// 关闭模态框
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
    currentModalAction = null;
}

// 确认操作
function confirmAction() {
    if (currentModalAction) {
        currentModalAction();
    }
    closeModal();
}

// 防止浏览器后退
function preventBrowserBack() {
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', function(event) {
        if (!examSubmitted) {
            window.history.pushState(null, null, window.location.href);
            showModal(
                'Confirm Exit',
                'The exam is in progress. Are you sure you want to leave? Your progress will be lost.',
                () => window.history.back()
            );
        }
    });
}

// 防止页面刷新
window.addEventListener('beforeunload', function(e) {
    if (!examSubmitted && examStartTime) {
        e.preventDefault();
        e.returnValue = 'The exam is in progress. Are you sure you want to leave? Your progress will be lost.';
        return 'The exam is in progress. Are you sure you want to leave? Your progress will be lost.';
    }
});

// 过滤解析内容
document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            filterReviewContent(filter);
        });
    });
});

// 过滤解析内容
function filterReviewContent(filter) {
    const reviewItems = document.querySelectorAll('.review-question');
    
    reviewItems.forEach((item, index) => {
        let show = false;
        
        switch (filter) {
            case 'all':
                show = true;
                break;
            case 'wrong':
                show = item.classList.contains('wrong');
                break;
            case 'flagged':
                show = examFlags.has(index);
                break;
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}
