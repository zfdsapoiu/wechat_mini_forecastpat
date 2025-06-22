Page({
  data: {
    petInfo: null,
    petName: '',
    petData: {},
    date: ''
  },

  onLoad: function(options) {
    // 优化：优先从全局数据获取宠物信息，提升页面加载性能
    const app = getApp();
    let petInfo = null;
    
    // 首先尝试从全局数据获取（新的优化方式）
    if (app.globalData && app.globalData.currentPetDetail) {
      petInfo = app.globalData.currentPetDetail;
      // 使用后清除全局数据，避免内存泄漏
      delete app.globalData.currentPetDetail;
    }
    // 兼容旧版本：从URL参数获取（保持向后兼容）
    else if (options.petInfo) {
      try {
        petInfo = JSON.parse(decodeURIComponent(options.petInfo));
      } catch (error) {
        console.error('解析宠物信息失败:', error);
        wx.showToast({
          title: '数据解析失败',
          icon: 'error'
        });
        return;
      }
    }
    
    // 设置页面数据
    if (petInfo) {
      this.setData({
        petInfo: petInfo,
        petName: (petInfo.petData && petInfo.petData.petName) || '',
        petData: petInfo.petData || {},
        date: petInfo.date || ''
      });
    } else {
      // 如果没有数据，返回上一页
      wx.showToast({
        title: '未找到宠物信息',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 编辑宠物信息
  editPetInfo: function() {
    console.log('editPetInfo 函数被调用');
    console.log('准备编辑的宠物数据:', this.data.petData);
    
    // 将宠物数据存储到全局数据中
    const app = getApp();
    app.globalData.editPetInfo = this.data.petData;
    console.log('全局数据已设置:', app.globalData.editPetInfo);
    
    // 跳转到宠物信息输入页面（使用 switchTab 因为它是 tabbar 页面）
    wx.switchTab({
      url: '/pages/petInfoInput/petInfoInput',
      success: function(res) {
        console.log('页面跳转成功:', res);
      },
      fail: function(err) {
        console.error('页面跳转失败:', err);
      }
    });
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 跳转到命理解析页面
  goToFortune: function() {
    console.log('点击查看命理按钮');
    
    if (!this.data.petInfo || !this.data.petInfo.petData || !this.data.petInfo.petData.petName) {
      wx.showToast({
        title: '宠物信息不完整',
        icon: 'error'
      });
      return;
    }
    
    const petName = this.data.petInfo.petData.petName;
    console.log('准备跳转到命理解析页面，petName:', petName);
    
    // 跳转到命理解析页面，通过URL参数传递petName
    wx.navigateTo({
      url: `/pages/result/result?petName=${petName}`,
      success: function(res) {
        console.log('跳转到命理解析页面成功:', res);
      },
      fail: function(err) {
        console.error('跳转到命理解析页面失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'error'
        });
      }
    });
  },

  // 格式化日期显示
  formatDate: function(dateStr) {
    if (!dateStr) return '未知';
    
    // 如果是完整的12位格式 (yyyymmddhhmm)
    if (dateStr.length === 12) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(8, 10);
      const minute = dateStr.substring(10, 12);
      return `${year}年${month}月${day}日 ${hour}:${minute}`;
    }
    // 如果是8位格式 (yyyymmdd)
    else if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}年${month}月${day}日`;
    }
    
    return dateStr;
  }
});