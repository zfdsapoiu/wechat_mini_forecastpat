// result.js
Page({
  data: {
    loading: false,
    result: '',
    error: '',
    petName: '',
    petData: {},
    apiLogs: []
  },

  onLoad: function(options) {
    console.log('Result page loaded with options:', options);
    
    if (options.petData) {
      try {
        const petData = JSON.parse(decodeURIComponent(options.petData));
        console.log('Parsed pet data:', petData);
        
        this.setData({
          petData: petData,
          petName: petData.petName || '您的宠物',
          loading: true
        });
        
        // 调用算命API
        this.callFortuneTellingAPI(petData);
      } catch (error) {
        console.error('解析宠物数据失败:', error);
        this.setData({
          error: '数据解析失败，请重试',
          loading: false
        });
      }
    } else {
      this.setData({
        error: '缺少宠物数据',
        loading: false
      });
    }
  },

  // 调用算命API (阻塞模式)
  callFortuneTellingAPI: function() {
    const petData = this.data.petData;
    console.log('petData:', petData); // 添加调试日志
    
    // 构建API请求数据
    const requestData = {
      inputs: {
        birth_date: petData.birthDate,
        pet_type: petData.petType,
        appearance: petData.petAppearance
      },
      response_mode: "blocking",
      user: "pet_owner_" + Date.now()
    };
    console.log('requestData:', requestData); // 添加调试日志

    // 使用workflow API
    wx.request({
      url: 'https://api.dify.ai/v1/workflows/run',
      method: 'POST',
      header: {
        'Authorization': 'Bearer app-1h1qLpWylUg8NQBbtFYV3J2U', // 需要替换为实际的API密钥
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        console.log('API响应:', res);
        
        // 记录API调用日志
        this.logApiCall(requestData, res, true);
        
        if (res.statusCode === 200 && res.data && res.data.data) {
          // workflow API返回的结果在data.data中
          const workflowData = res.data.data;
          console.log('完整的workflowData:', JSON.stringify(workflowData, null, 2));
          
          let result = '';
          
          // 根据实际数据结构，结果直接在outputs.output里
          if (workflowData.outputs && workflowData.outputs.output) {
            if (typeof workflowData.outputs.output === 'string') {
              // 尝试解析为JSON获取answer字段
              try {
                const parsed = JSON.parse(workflowData.outputs.output);
                if (parsed.answer && typeof parsed.answer === 'string') {
                  result = parsed.answer;
                  console.log('从outputs.output JSON中提取answer:', result.substring(0, 100) + '...');
                } else {
                  // 如果不是JSON或没有answer字段，直接使用整个内容
                  result = workflowData.outputs.output;
                  console.log('使用完整的outputs.output内容');
                }
              } catch (e) {
                // 如果不是JSON格式，直接使用整个内容
                result = workflowData.outputs.output;
                console.log('outputs.output不是JSON格式，使用完整内容');
              }
            } else {
              result = '算命结果格式错误';
              console.log('outputs.output不是字符串类型');
            }
          }
          // 备用方案：直接查找answer字段
          else if (workflowData.answer && typeof workflowData.answer === 'string') {
            result = workflowData.answer;
            console.log('找到直接的answer字段:', result);
          }
          // 如果都没找到，返回错误信息
          else {
            result = '算命结果获取失败';
            console.log('未找到有效的answer字段');
          }
          
          // 确保result是字符串且不为空
          if (!result || typeof result !== 'string' || result.trim() === '') {
            result = '算命结果获取失败';
          }
          this.setData({
            loading: false,
            result: this.markdownToHtml(result)
          });
          
          // 保存算命记录
          this.saveRecord(result);
        } else {
          this.setData({
            loading: false,
            error: 'API调用失败，状态码: ' + res.statusCode + '，数据: ' + JSON.stringify(res.data)
          });
        }
      },
      fail: (err) => {
        console.error('API调用失败:', err);
        
        // 记录API调用日志
        this.logApiCall(requestData, err, false);
        
        this.setData({
          loading: false,
          error: '网络连接失败，请检查网络后重试'
        });
      }
    });
  },

  // 记录API调用日志
  logApiCall: function(requestData, response, isSuccess) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      datetime: new Date().toLocaleString('zh-CN'),
      success: isSuccess,
      request: {
        url: 'https://api.dify.ai/v1/workflows/run',
        method: 'POST',
        data: JSON.parse(JSON.stringify(requestData)) // 深拷贝避免引用问题
      },
      response: {
        statusCode: response.statusCode || 'unknown',
        data: JSON.parse(JSON.stringify(response.data || response)) // 深拷贝
      }
    };
    
    // 添加到日志数组
    const currentLogs = this.data.apiLogs || [];
    currentLogs.push(logEntry);
    
    // 只保留最近10次调用记录，避免内存占用过多
    if (currentLogs.length > 10) {
      currentLogs.shift();
    }
    
    this.setData({
      apiLogs: currentLogs
    });
    
    // 同时输出到控制台，方便实时查看
    console.log('=== API调用日志 ===');
    console.log('时间:', logEntry.datetime);
    console.log('成功:', logEntry.success);
    console.log('请求:', logEntry.request);
    console.log('响应:', logEntry.response);
    console.log('==================');
    
    // 存储到本地缓存，方便持久化查看
    try {
      wx.setStorageSync('api_debug_logs', currentLogs);
    } catch (e) {
      console.warn('保存日志到本地存储失败:', e);
    }
  },

  // 获取所有API调用日志
  getApiLogs: function() {
    return this.data.apiLogs || [];
  },

  // 清空API调用日志
  clearApiLogs: function() {
    this.setData({
      apiLogs: []
    });
    try {
      wx.removeStorageSync('api_debug_logs');
    } catch (e) {
      console.warn('清空本地日志失败:', e);
    }
    console.log('API调用日志已清空');
  },

  // 从对象中提取文本内容
  extractTextFromObject: function(obj) {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    
    // 优先查找answer字段
    if (obj.answer && typeof obj.answer === 'string') {
      return obj.answer;
    }
    
    // 其他常见的文本字段名
    const textFields = ['text', 'content', 'message', 'result', 'output', 'response'];
    
    // 尝试获取其他文本字段
    for (let field of textFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field];
      }
    }
    
    // 如果没有找到，递归查找嵌套对象中的answer字段
    for (let key in obj) {
      if (obj[key] && typeof obj[key] === 'object') {
        const nestedResult = this.extractTextFromObject(obj[key]);
        if (nestedResult) {
          return nestedResult;
        }
      }
    }
    
    // 如果都没找到，返回空字符串而不是JSON
    return '';
  },

  // 简单的markdown转HTML函数
  markdownToHtml: function(markdown) {
    if (!markdown) return '';
    
    // 确保markdown是字符串类型
    if (typeof markdown !== 'string') {
      markdown = String(markdown);
    }
    
    let html = markdown
      // 标题转换
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: bold; color: #ff8a5c; margin: 10px 0;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: bold; color: #ff8a5c; margin: 12px 0;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 20px; font-weight: bold; color: #ff8a5c; margin: 15px 0;">$1</h1>')
      // 处理markdown表格 - 使用rich-text支持的简单格式
      .replace(/\|(.+)\|/g, function(match, content) {
        const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);
        
        // 跳过表格分隔行（包含 --- 的行）
        if (cells.some(cell => cell.includes('---'))) {
          return '';
        }
        
        // 转换为简单的表格行，使用rich-text支持的标签
        const cellsHtml = cells.map(cell => `<span style="padding: 5px 10px; border: 1px solid #ddd; background: #f5f5f5; margin: 2px; display: inline-block;">${cell}</span>`).join('');
        return `<div style="margin: 10px 0; line-height: 1.8;">${cellsHtml}</div>`;
      })
      // 粗体转换
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold; color: #333;">$1</strong>')
      // 斜体转换
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      // 换行转换
      .replace(/\n/g, '<br/>')
      // 列表转换
      .replace(/^- (.*$)/gim, '<div style="margin: 10px 0; padding-left: 20px;">• $1</div>');
    
    return html;
  },

  // 重试功能
  retry: function() {
    this.setData({
      loading: true,
      error: ''
    });
    this.callFortuneTellingAPI();
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 保存算命记录
  saveRecord: function(result) {
    try {
      const petData = this.data.petData;
      const record = {
        id: Date.now(), // 使用时间戳作为唯一ID
        petName: petData.nickName || '未命名宠物',
        petType: petData.petType || '',
        birthDate: petData.birthDate || '',
        appearance: petData.petAppearance || '',
        furType: petData.furType || '',
        result: result,
        createTime: new Date().toISOString(),
        createTimeFormatted: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now() // 添加时间戳字段
      };
      
      // 获取现有记录
      let records = wx.getStorageSync('petFortune_records') || [];
      
      // 添加新记录到开头
      records.unshift(record);
      
      // 限制记录数量，最多保存100条
      if (records.length > 100) {
        records = records.slice(0, 100);
      }
      
      // 保存到本地存储
      wx.setStorageSync('petFortune_records', records);
      
      console.log('算命记录已保存:', record);
    } catch (error) {
      console.error('保存算命记录失败:', error);
    }
  },


});