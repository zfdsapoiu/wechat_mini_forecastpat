// pages/user/user.js
const ContentChecker = require('../../utils/contentChecker');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: '',
      nickName: '微信用户'
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
   * 保存用户信息到本地缓存
   */
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync('petFortune_userInfo', userInfo);
      console.log('用户信息保存成功:', userInfo);
    } catch (error) {
      console.error('保存用户信息失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  /**
   * 选择头像 - 使用微信官方头像选择能力
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    
    // 更新头像
    const userInfo = this.data.userInfo || {};
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
   * 昵称输入事件
   */
  onNicknameInput(e) {
    const nickName = e.detail.value;
    const userInfo = { ...this.data.userInfo };
    userInfo.nickName = nickName;
    
    this.setData({
      userInfo: userInfo
    });
  },

  /**
   * 昵称输入框失去焦点事件
   */
  async onNicknameBlur(e) {
    const nickName = e.detail.value.trim();
    if (!nickName) {
      return;
    }
    
    try {
      // 使用内容检测工具类
      const result = await ContentChecker.checkNickname(nickName);
      
      if (result.risky) {
        // 内容有风险
        ContentChecker.showResultToast(result, {
          riskyMessage: '昵称包含敏感内容，请重新输入'
        });
        
        // 清空昵称
        const userInfo = { ...this.data.userInfo };
        userInfo.nickName = '';
        this.setData({
          userInfo: userInfo
        });
      } else {
        // 内容安全，保存昵称
        this.saveUserInfo(this.data.userInfo);
        wx.showToast({
          title: '昵称设置成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('昵称检测异常:', error);
      // 异常情况下直接保存（降级处理）
      this.saveUserInfo(this.data.userInfo);
      wx.showToast({
        title: '昵称设置成功',
        icon: 'success'
      });
    }
  },

  /**
   * 昵称审核回调（保留以防需要）
   */
  onNicknameReview(e) {
    const { pass, timeout } = e.detail;
    
    if (!pass) {
      wx.showToast({
        title: timeout ? '昵称审核超时' : '昵称包含敏感内容',
        icon: 'none'
      });
      
      // 清空昵称
      const userInfo = { ...this.data.userInfo };
      userInfo.nickName = '';
      this.setData({
        userInfo: userInfo
      });
    } else {
      // 审核通过，保存昵称
      this.saveUserInfo(this.data.userInfo);
      
      wx.showToast({
        title: '昵称设置成功',
        icon: 'success'
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
   * 清空所有记录
   */
  clearRecords() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有宠物信息记录吗？此操作不可恢复。',
      confirmText: '确定清空',
      cancelText: '取消',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清空本地存储的宠物信息列表
            wx.removeStorageSync('petInfoList');
            
            wx.showToast({
              title: '清空成功',
              icon: 'success',
              duration: 2000
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
