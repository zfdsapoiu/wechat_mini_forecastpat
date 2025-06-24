# 宠物运势预测小程序

基于云开发 + CloudBase AI ToolKit 构建的项目

[![Powered by CloudBase](https://7463-tcb-advanced-a656fc-1257967285.tcb.qcloud.la/mcp/powered-by-cloudbase-badge.svg)](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit)  

> 本项目基于 [**CloudBase AI ToolKit**](https://github.com/TencentCloudBase/CloudBase-AI-ToolKit) 开发，通过AI提示词和 MCP 协议+云开发，让开发更智能、更高效，支持AI生成全栈代码、一键部署至腾讯云开发（免服务器）、智能日志修复。

## 项目简介

这是一个基于微信小程序和腾讯云开发的宠物运势预测应用，用户可以输入宠物信息，获取个性化的运势预测结果。

## 功能特性

- 🐾 **宠物信息管理** - 支持添加和管理多个宠物的基本信息
- 🔮 **运势预测** - 基于宠物信息生成个性化运势预测
- 📊 **历史记录** - 查看历史预测记录和趋势
- 👤 **用户中心** - 个人信息管理和设置
- 🛡️ **内容安全** - 集成微信内容安全检测，确保用户输入内容合规

## 技术架构

### 前端技术栈
- **微信小程序** - 原生小程序开发
- **云开发SDK** - 数据存储和云函数调用

### 后端技术栈
- **腾讯云开发** - Serverless后端服务
- **云函数** - 业务逻辑处理
- **云数据库** - 数据持久化存储
- **微信内容安全API** - 内容审核服务

### 万年历库
- `paipan-lib/`: 完整的paipan万年历项目，支持农历公历干支历互转、八字排盘、大运推算、真太阳时等功能
  - `js/paipan.js`: 核心万年历JavaScript库
  - `js/paipan.gx.js`: 刑冲合害关系分析库
  - `lib/class.paipan.php`: PHP版本万年历库
  - `sxwnl/`: 寿星万年历源码和数据
- `paipan-core.js`: 提取的核心万年历功能，用于云函数

### 核心工具类
- **ContentChecker** - 统一的内容安全检测工具类
  - 支持昵称、评论等多种内容类型检测
  - 提供批量检测功能
  - 内置降级机制，确保服务可用性
  - 统一的错误处理和用户提示

## 云开发资源

### 云函数
- `checkContent` - 内容安全检测函数
  - 调用微信官方 `security.msgSecCheck` API
  - 支持文本内容安全检测
  - 返回标准化的检测结果
- `calculateBazi` - 八字计算函数（已集成专业万年历库）
  - 根据出生时间（yyyymmddhhmm格式）计算生辰八字
  - 支持年柱、月柱、日柱、时柱的天干地支计算
  - 返回对应的五行属性信息
  - 为宠物运势预测提供基础数据
- `fortuneTelling` - 算命云函数，基于八字进行运势分析

### 数据库集合
- `pets` - 宠物信息存储
- `predictions` - 运势预测记录
- `users` - 用户信息管理

### 环境配置
- **环境ID**: `cloud1-6gkx3gdpfdf31f5f`
- **地域**: 上海

## 项目结构

```
wechat_mini_forecastpat/
├── miniprogram/                 # 小程序前端代码
│   ├── pages/                   # 页面文件
│   │   ├── user/               # 用户中心页面
│   │   ├── petDetail/          # 宠物详情页面
│   │   ├── petInfoInput/       # 宠物信息输入页面
│   │   ├── records/            # 历史记录页面
│   │   └── result/             # 预测结果页面
│   ├── utils/                   # 工具类
│   │   ├── util.js             # 通用工具函数
│   │   └── contentChecker.js   # 内容安全检测工具类
│   ├── images/                  # 图片资源
│   ├── app.js                   # 小程序入口文件
│   ├── app.json                 # 小程序配置文件
│   └── app.wxss                 # 全局样式文件
├── cloudfunctions/              # 云函数代码
│   ├── checkContent/           # 内容检测云函数
│   │   ├── index.js            # 函数入口文件
│   │   └── package.json        # 依赖配置
│   └── calculateBazi/          # 八字计算云函数
│       ├── index.js            # 函数入口文件
│       └── package.json        # 依赖配置
├── project.config.json          # 项目配置文件
└── readme.md                    # 项目说明文档
```

## 开发指南

### 本地开发
1. 使用微信开发者工具打开项目
2. 配置云开发环境ID
3. 部署云函数到云端
4. 启动小程序预览

### 内容检测使用
```javascript
const ContentChecker = require('../../utils/contentChecker');

// 检测昵称
const result = await ContentChecker.checkNickname(nickname);
if (result.risky) {
  // 处理敏感内容
}

// 检测评论
const result = await ContentChecker.checkComment(comment);

// 批量检测
const results = await ContentChecker.checkBatch([
  { content: 'text1', type: 'nickname' },
  { content: 'text2', type: 'comment' }
]);
```

## 部署说明

1. **云函数部署**
   - 通过微信开发者工具或CloudBase CLI部署
   - 确保云函数具有内容安全API调用权限

2. **数据库初始化**
   - 创建必要的数据库集合
   - 配置合适的数据库权限

3. **小程序发布**
   - 提交代码审核
   - 发布正式版本

## 维护说明

- **内容检测**: 如需修改检测逻辑，请更新 `ContentChecker` 工具类
- **云函数**: 云函数代码更新后需重新部署
- **数据库**: 数据结构变更需要相应更新前端代码
- **权限配置**: 定期检查云开发资源的访问权限设置

## 注意事项

1. **内容安全**: 所有用户输入内容都会经过微信内容安全检测
2. **降级机制**: 当内容检测服务不可用时，系统会自动降级处理
3. **错误处理**: 所有异步操作都包含完善的错误处理机制
4. **用户体验**: 检测过程中会显示加载状态，提升用户体验