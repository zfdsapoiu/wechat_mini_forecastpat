// result.js
const app = getApp();
const ContentChecker = require('../../utils/contentChecker');
const fortuneTellingAPI = require('../../utils/fortuneTellingAPI');

Page({
  data: {
    loading: false,
    result: '',
    error: '',
    petName: '',
    petData: {},
    petInfo: {},
    apiLogs: [],
    isStreaming: false, // 是否正在流式输出
    streamingResult: '' // 流式输出的累积结果
  },

  onLoad: function(options) {
    console.log('Result page loaded with options:', options);
    
    // 从URL参数获取petName并解码
    const petName = options.petName || '';
    
    if (!petName) {
      this.setData({
        error: '缺少宠物名称参数',
        loading: false
      });
      return;
    }
    
    console.log('解码后的petName:', petName);
    
    // 从本地缓存petInfoList中查找对应的petInfo
    let petInfoList = wx.getStorageSync('petInfoList') || [];
    let petInfo = petInfoList.find(item => 
      item.petData && item.petData.petName === petName
    );
    
    if (!petInfo) {
      this.setData({
        error: `未找到名为"${petName}"的宠物信息`,
        loading: false
      });
      return;
    }
    
    console.log('从本地缓存获取petInfo:', petInfo);
    
    // 检查是否已有算命结果
    const hasResult = petInfo.calculated === 1 && petInfo.output && petInfo.output.result;
    
    this.setData({
      petInfo: petInfo,
      petName: petName,
      petData: petInfo.petData || {},
      result: hasResult ? petInfo.output.result : '',
      loading: false,
      isStreaming: false, // 已有结果时强制使用blocking模式显示
      streamingResult: '',
      apiLogs: fortuneTellingAPI.getApiLogs() // 从工具类加载日志
    });
    
    // 如果没有算命结果，自动调用API
    if (!hasResult) {
      this.setData({ loading: true });
      this.callFortuneTellingAPI();
    }
  },

  // 调用算命API (支持streaming和blocking模式)
  callFortuneTellingAPI: function() {
    const petInfo = this.data.petInfo;
    const petData = petInfo.petData || {};
    console.log('petInfo:', petInfo); // 添加调试日志
    
    // 获取当前配置的response_mode
    const app = getApp();
    const responseMode = app.globalData.fortuneTellingConfig.response_mode;
    
    // 重置状态
    this.setData({
      loading: true,
      error: '',
      isStreaming: responseMode === 'streaming',
      streamingResult: '',
      result: responseMode === 'streaming' ? '' : this.data.result
    });
    
    // 使用工具类调用API
    fortuneTellingAPI.callFortuneTellingAPI(
      petData,
      (result) => {
        // 成功回调 (blocking模式)
        this.setData({
          loading: false,
          result: result,
          isStreaming: false
        });
        
        // 更新petInfo并保存到本地存储
        this.updatePetInfoAndSave(result);
      },
      (error) => {
        // 失败回调
        this.setData({
          loading: false,
          error: error,
          isStreaming: false
        });
      },
      (chunk) => {
        // 流式数据回调 (streaming模式)
        const newStreamingResult = this.data.streamingResult + chunk;
        this.setData({
          streamingResult: newStreamingResult,
          result: newStreamingResult
        });
      },
      () => {
        // 流式结束回调 (streaming模式)
        this.setData({
          loading: false,
          isStreaming: false
        });
        
        // 更新petInfo并保存到本地存储
        this.updatePetInfoAndSave(this.data.streamingResult);
      }
    );
  },



  // 获取所有API调用日志
  getApiLogs: function() {
    return fortuneTellingAPI.getApiLogs();
  },

  // 清空API调用日志
  clearApiLogs: function() {
    fortuneTellingAPI.clearApiLogs();
    // 更新页面数据
    this.setData({
      apiLogs: []
    });
  },

  // 更新petInfo并保存到本地存储
  updatePetInfoAndSave: function(result) {
    try {
      const petInfo = this.data.petInfo;
      
      // 更新petInfo的calculated和output字段
      petInfo.calculated = 1;
      petInfo.output = {
        result: result,
        timestamp: Date.now(),
        createTime: new Date().toISOString()
      };
      
      // 更新页面数据
      this.setData({
        petInfo: petInfo
      });
      
      // 获取现有的宠物信息列表
      let petInfoList = wx.getStorageSync('petInfoList') || [];
      
      // 查找并更新对应的petInfo
      const existingIndex = petInfoList.findIndex(item => 
        item.id === petInfo.id || 
        (item.petData && item.petData.petName === petInfo.petData.petName));
      
      if (existingIndex !== -1) {
        // 更新现有记录
        petInfoList[existingIndex] = petInfo;
        
        // 保存到本地存储
        wx.setStorageSync('petInfoList', petInfoList);
        
        console.log('petInfo已更新并保存:', petInfo);
      } else {
        console.warn('未找到对应的petInfo记录进行更新');
      }
      
    } catch (error) {
      console.error('更新petInfo失败:', error);
    }
  },

  // 重试功能
  retry: function() {
    this.setData({
      loading: true,
      error: '',
      isStreaming: false,
      streamingResult: '',
      result: ''
    });
    this.callFortuneTellingAPI();
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },


});