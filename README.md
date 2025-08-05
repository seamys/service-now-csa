# ServiceNow CSA 认证考试练习系统

一个专为 ServiceNow 认证系统管理员 (CSA) 考试设计的在线练习平台，包含 385 道精选题目和完整的考试模拟环境。

## 🌐 在线访问

通过 GitHub Pages 直接访问练习系统：

- 🎓 **练习模式**: [https://seamys.github.io/service-now-csa/csa_standalone_quiz.html](https://seamys.github.io/service-now-csa/csa_standalone_quiz.html)
- 🎯 **考试模式**: [https://seamys.github.io/service-now-csa/csa_exam_mode.html](https://seamys.github.io/service-now-csa/csa_exam_mode.html)

> 📌 **注意**: 使用在线版本时，您的学习进度会保存在浏览器本地存储中，请勿随意清除浏览器数据。

## 🌟 项目特色

- 📚 **385道精选题目** - 涵盖 ServiceNow CSA 考试全部知识点
- 🎯 **真实考试模拟** - 90分钟限时，60道题目的完整考试体验
- 🌐 **中英文双语** - 支持中英文题目切换，适合不同语言背景的学习者
- 📊 **智能统计分析** - 详细的答题统计和错误分析
- 🔄 **多种练习模式** - 随机练习、错题模式、新题模式等
- 💾 **本地数据存储** - 自动保存学习进度，无需网络连接
- 📱 **响应式设计** - 支持桌面和移动设备访问

## 🚀 快速开始

### 方式一：在线访问（推荐）
直接点击上方链接即可开始使用，无需下载任何文件：
- [练习模式 - 立即开始](https://seamys.github.io/service-now-csa/csa_standalone_quiz.html)
- [考试模式 - 模拟测试](https://seamys.github.io/service-now-csa/csa_exam_mode.html)

### 方式二：本地部署
1. 下载项目文件到本地
2. 双击打开 `csa_standalone_quiz.html` 开始练习
3. 或打开 `csa_exam_mode.html` 进入考试模式

### 方式三：本地服务器开发
```bash
# 克隆项目
git clone https://github.com/seamys/service-now-csa.git

# 进入项目目录
cd service-now-csa

# 使用 Python 启动本地服务器
python -m http.server 8000

# 或使用 Node.js (需要安装 http-server)
npx http-server

# 访问 http://localhost:8000
```

## 📁 项目结构

```
service-now-csa/
├── csa_standalone_quiz.html    # 练习模式主页面
├── csa_exam_mode.html          # 考试模式页面
├── README.md                   # 项目说明文档
├── LICENSE                     # 开源协议
├── css/
│   ├── styles.css             # 主样式文件
│   └── exam-mode.css          # 考试模式专用样式
├── data/
│   ├── questions.js           # 英文题目数据
│   ├── questions_translated.js # 中文翻译数据
│   └── questions.json         # JSON格式题目数据
└── js/
    ├── quiz.js                # 练习模式核心逻辑
    └── exam-mode.js           # 考试模式核心逻辑
```

## 🎮 功能特性

### 练习模式 (`csa_standalone_quiz.html`)

#### 核心功能
- **灵活题目设置**：支持 5-100 题的自定义数量
- **题型筛选**：单选题、多选题或混合模式
- **关键词搜索**：根据关键词筛选相关题目
- **中英文切换**：实时切换题目语言显示

#### 智能学习
- **错题模式**：专门练习答错的题目
- **新题模式**：优先练习未测试的题目
- **进度追踪**：自动记录答题历史和正确率
- **统计分析**：详细的学习进度和薄弱环节分析

### 考试模式 (`csa_exam_mode.html`)

#### 真实考试体验
- **严格时间限制**：90分钟倒计时
- **固定题目数量**：60道题目（符合真实考试标准）
- **题目导航器**：快速跳转到任意题目
- **答题状态跟踪**：已答、未答、标记状态一目了然

#### 考试管理功能
- **题目标记**：重要或不确定的题目可以标记
- **答题笔记**：为每道题目添加个人备注
- **考试概览**：实时查看答题进度和统计
- **成绩分析**：考试结束后提供详细的成绩报告

## 🎯 适用人群

- **ServiceNow 初学者**：系统学习 CSA 认证知识点
- **认证考试准备者**：模拟真实考试环境，提高通过率
- **ServiceNow 从业者**：复习和巩固平台操作知识
- **企业培训**：组织内部 ServiceNow 技能提升

## 📚 题目覆盖范围

本练习系统涵盖 ServiceNow CSA 认证考试的所有关键知识点：

- **平台基础**：导航、界面、用户管理
- **数据管理**：表、字段、关系、导入导出
- **流程自动化**：工作流、业务规则、客户端脚本
- **服务目录**：目录项、订单指南、记录生产者
- **报表分析**：报表创建、仪表板、性能分析
- **安全控制**：访问控制、角色管理、数据策略
- **CMDB**：配置项、关系、发现
- **集成**：REST API、集成中心、更新集

## 🛠️ 技术特性

- **纯前端实现**：无需后端服务器，完全离线可用
- **GitHub Pages 托管**：通过 GitHub Pages 提供稳定的在线访问
- **本地存储**：使用 localStorage 保存学习进度
- **响应式设计**：兼容桌面、平板、手机等设备
- **现代化界面**：Material Design 风格，用户体验优秀
- **高性能**：快速加载，流畅交互
- **零部署成本**：基于 GitHub Pages，完全免费托管

## 🎨 界面预览

### 练习模式
- 清爽的主界面，支持多种练习设置
- 实时题目切换和语言转换
- 详细的统计信息和进度追踪

### 考试模式
- 专业的考试界面，模拟真实考试环境
- 严格的时间控制和题目管理
- 完整的成绩分析和错误诊断

## 📈 学习建议

1. **基础学习阶段**：使用练习模式，从少量题目开始
2. **知识巩固阶段**：利用错题模式重点突破薄弱环节
3. **考前冲刺阶段**：使用考试模式进行全真模拟
4. **重复练习**：定期回顾，保持知识新鲜度

## 🤝 贡献指南

欢迎为项目贡献代码或提出建议！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 🚀 部署到 GitHub Pages

本项目已配置自动部署到 GitHub Pages：

### 自动部署
- 每次推送到 `main` 或 `master` 分支时自动触发部署
- 使用 GitHub Actions 工作流自动构建和发布
- 部署完成后可通过 `https://yourusername.github.io/service-now-csa/` 访问

### 手动启用 GitHub Pages
如果您 fork 了这个项目，需要在您的仓库中启用 GitHub Pages：

1. 进入您的 GitHub 仓库页面
2. 点击 **Settings** 选项卡
3. 滚动到 **Pages** 部分
4. 在 **Source** 下选择 **GitHub Actions**
5. 项目将自动部署到 `https://yourusername.github.io/service-now-csa/`

### 本地预览
```bash
# 使用 Python 启动本地服务器预览
python -m http.server 8000

# 或使用 Node.js http-server
npx http-server

# 访问 http://localhost:8000
```

## 📄 开源协议

本项目基于 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- ServiceNow 官方文档和认证指南
- 社区贡献的题目和知识点整理
- 所有使用和反馈的用户

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/seamys/service-now-csa/issues)
- 项目主页: [GitHub Repository](https://github.com/seamys/service-now-csa)

---

**祝您 ServiceNow CSA 认证考试顺利通过！** 🎉