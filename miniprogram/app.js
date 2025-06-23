// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-6gkx3gdpfdf31f5f', // 云开发环境ID
      traceUser: true
    })
    
    // 扩展登录功能
    const db = wx.cloud.database()
    const _ = db.command
  },
  globalData: {
    userInfo: null,
    // 算命API配置
    fortuneTellingConfig: {
      response_mode: "streaming", // streaming 或 blocking
      apiUrl: 'https://api.dify.ai/v1/workflows/run',
      apiKey: 'Bearer app-1h1qLpWylUg8NQBbtFYV3J2U'
    }
  }
})
