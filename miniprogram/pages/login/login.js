// login.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 页面数据
  },

  /**
   * 进入宠物信息页面
   */
  goToPetInfo() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});