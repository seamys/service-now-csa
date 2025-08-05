#!/bin/bash

echo "🔍 检查 GitHub Pages 部署文件..."

# 检查必要文件
files_to_check=(
    "index.html"
    "csa_standalone_quiz.html" 
    "csa_exam_mode.html"
    "css/styles.css"
    "css/exam-mode.css"
    "js/quiz.js"
    "js/exam-mode.js"
    "data/questions.js"
    "data/questions_translated.js"
    ".nojekyll"
    ".github/workflows/static.yml"
)

missing_files=()

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 缺失"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo ""
    echo "🎉 所有必要文件都存在！"
    echo "📝 接下来的步骤："
    echo "1. 提交所有更改: git add . && git commit -m 'Configure GitHub Pages'"
    echo "2. 推送到仓库: git push origin master"
    echo "3. 在 GitHub 仓库设置中启用 Pages"
    echo "4. 选择 GitHub Actions 作为 Source"
else
    echo ""
    echo "⚠️  缺少以下文件："
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
fi

echo ""
echo "🌐 预期的网站地址："
echo "https://seamys.github.io/service-now-csa/"
