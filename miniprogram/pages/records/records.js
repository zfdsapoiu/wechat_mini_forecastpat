// pages/records/records.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentTab: 1, // 当前标签页，默认显示命理分析
    records: [], // 原始记录列表
    petInfoRecords: [], // 宠物信息记录
    fortuneRecords: [], // 命理分析记录
    compatibilityRecords: [] // 八字合盘记录（暂时为空）
  },

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
   * 加载算命记录
   */
  loadRecords() {
    try {
      // 从新的存储键获取记录
      const records = wx.getStorageSync('fortuneRecords') || [];
      // 按时间倒序排列
      records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // 格式化记录数据
      const formattedRecords = records.map((record, index) => {
        const date = new Date(record.timestamp);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        // 提取结果预览（前50个字符）
        let preview = record.result || '暂无结果';
        if (preview.length > 50) {
          preview = preview.substring(0, 50) + '...';
        }
        
        return {
          id: record.id || index,
          petName: record.petName || '未知宠物',
          date: formattedDate,
          preview: preview,
          result: record.result,
          timestamp: record.timestamp,
          petData: record.petData || {} // 保留完整的宠物数据
        };
      });
      
      // 分类处理记录
      const petInfoRecords = formattedRecords.filter(record => record.petData && Object.keys(record.petData).length > 0);
      const fortuneRecords = formattedRecords.filter(record => record.result);
      const compatibilityRecords = []; // 暂时为空，等待八字合盘功能开发
      
      this.setData({
        records: formattedRecords,
        petInfoRecords: petInfoRecords,
        fortuneRecords: fortuneRecords,
        compatibilityRecords: compatibilityRecords
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
   * 标签页切换
   */
  switchTab: function(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({
      currentTab: tab
    });
  },

  /**
   * 查看宠物信息详情
   */
  viewPetInfo: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.petInfoRecords[index];
    
    // 跳转到结果页面，显示宠物信息
    const url = `/pages/result/result?fromRecord=true&petName=${encodeURIComponent(record.petName)}&fullResult=${encodeURIComponent(record.result || '')}&petData=${encodeURIComponent(JSON.stringify(record.petData))}`;
    
    wx.navigateTo({
      url: url
    });
  },

  /**
   * 查看命理分析详情
   */
  viewFortune: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.fortuneRecords[index];
    
    // 跳转到结果页面，显示命理分析结果
    const url = `/pages/result/result?fromRecord=true&petName=${encodeURIComponent(record.petName)}&fullResult=${encodeURIComponent(record.result)}&petData=${encodeURIComponent(JSON.stringify(record.petData))}`;
    
    wx.navigateTo({
      url: url
    });
  },

  /**
   * 查看八字合盘详情
   */
  viewCompatibility: function(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.compatibilityRecords[index];
    
    // 暂时显示提示信息
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  /**
   * 跳转到首页开始算命
   */
  goToIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadRecords();
    wx.stopPullDownRefresh();
  }
});