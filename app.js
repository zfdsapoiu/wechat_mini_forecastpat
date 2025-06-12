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
      env: 'pet-fortune-xxxx', // 替换实际环境ID
      traceUser: true
    })
    
    // 扩展登录功能
    const db = wx.cloud.database()
    const _ = db.command
  },
  globalData: {
    userInfo: null
  }
})
