// pages/records/records.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    petInfoRecords: [] // 宠物信息记录
  },
  
  // 防抖标志，防止重复点击导致的卡顿
  navigating: false,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadRecords();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadRecords();
  },

  /**
   * 加载宠物信息记录
   */
  loadRecords() {
    try {
      // 从宠物信息存储键获取记录
      const petInfoList = wx.getStorageSync('petInfoList') || [];
      
      // 过滤并处理宠物信息记录
      const validPetInfoList = petInfoList.filter(petInfo => {
        // 确保记录是有效对象且包含基本信息
        return petInfo && typeof petInfo === 'object' && petInfo.timestamp;
      });
      
      validPetInfoList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const formattedPetInfoRecords = validPetInfoList.map((petInfo, index) => {
        // 安全处理时间戳
        let formattedDate = '未知时间';
        try {
          const date = new Date(petInfo.timestamp);
          if (!isNaN(date.getTime())) {
            formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          }
        } catch (dateError) {
          console.warn('时间格式化失败:', petInfo.timestamp, dateError);
        }
        
        return {
          id: petInfo.id || index,
          petName: (petInfo.petData && petInfo.petData.petName) || '未知宠物',
          date: formattedDate,
          petData: petInfo.petData || {},
          timestamp: petInfo.timestamp || new Date().toISOString()
        };
      });
      
      this.setData({
        petInfoRecords: formattedPetInfoRecords
      });
    } catch (error) {
      console.error('加载记录失败:', error);
      wx.showToast({
        title: '加载记录失败',
        icon: 'none'
      });
    }
  },

  /**
   * 查看宠物信息详情（优化版本，减少卡顿）
   */
  viewPetInfo: function(e) {
    // 防抖处理，避免重复点击
    if (this.navigating) {
      return;
    }
    this.navigating = true;
    
    const index = e.currentTarget.dataset.index;
    const record = this.data.petInfoRecords[index];
    
    // 安全检查：确保记录存在
    if (!record) {
      console.error('记录不存在，索引:', index);
      wx.showToast({
        title: '记录不存在',
        icon: 'none'
      });
      this.navigating = false;
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 使用全局数据传递，避免URL参数过长导致的性能问题
    const app = getApp();
    app.globalData.currentPetDetail = {
      petData: record.petData || {},
      timestamp: record.timestamp || new Date().toISOString(),
      date: record.date || '未知时间'
    };
    
    // 延迟跳转，确保数据设置完成
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/petDetail/petDetail',
        success: () => {
          wx.hideLoading();
          this.navigating = false;
        },
        fail: (err) => {
          console.error('页面跳转失败:', err);
          wx.hideLoading();
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
          this.navigating = false;
        }
      });
    }, 50); // 50ms延迟，给UI响应时间
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadRecords();
    wx.stopPullDownRefresh();
  }
});