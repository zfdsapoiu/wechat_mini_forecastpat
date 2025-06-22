// pages/user/user.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('petFortune_userInfo') || {};
      this.setData({
        userInfo: {
          avatarUrl: userInfo.avatarUrl || '',
          nickName: userInfo.nickName || ''
        }
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },

  /**
   * 选择头像 - 使用微信官方头像选择能力
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    
    // 更新头像
    const userInfo = this.data.userInfo;
    userInfo.avatarUrl = avatarUrl;
    
    this.setData({
      userInfo: userInfo
    });
    
    // 保存到本地存储
    this.saveUserInfo(userInfo);
    
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  },

  /**
   * 昵称审核完成 - 使用微信官方昵称输入能力
   */
  onNicknameReview(e) {
    const { pass, content } = e.detail;
    
    if (pass) {
      // 昵称审核通过，更新昵称
      const userInfo = { ...this.data.userInfo };
      userInfo.nickName = content;
      
      this.setData({
        userInfo: userInfo
      });
      
      // 保存到本地存储
      this.saveUserInfo(userInfo);
      
      wx.showToast({
        title: '昵称更新成功',
        icon: 'success'
      });
    } else {
      // 昵称审核不通过
      wx.showToast({
        title: '昵称包含敏感内容',
        icon: 'none'
      });
    }
  },



  /**
   * 保存用户信息到本地存储
   */
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync('petFortune_userInfo', userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 查看记录
   */
  viewRecords() {
    wx.switchTab({
      url: '/pages/records/records'
    });
  },

  /**
   * 清空记录
   */
  clearRecords() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有算命记录吗？此操作不可恢复。',
      confirmText: '清空',
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('petFortune_records');
            wx.showToast({
              title: '记录已清空',
              icon: 'success'
            });
          } catch (error) {
            console.error('清空记录失败:', error);
            wx.showToast({
              title: '清空失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  /**
   * 关于应用
   */
  aboutApp() {
    wx.showModal({
      title: '关于宠物算命',
      content: '版本：1.0.0\n\n这是一个有趣的宠物算命小程序，通过宠物的基本信息为您的爱宠提供个性化的命理分析。\n\n仅供娱乐，请勿过分迷信。',
      showCancel: false,
      confirmText: '知道了'
    });
  },


});