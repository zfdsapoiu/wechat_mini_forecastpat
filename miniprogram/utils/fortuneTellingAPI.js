/**
 * 宠物算命API调用工具类
 * 提供算命API调用、日志记录、日志管理等功能
 */
class FortuneTellingAPI {
  constructor() {
    // 从全局配置中获取API配置
    const app = getApp();
    const config = app.globalData.fortuneTellingConfig;
    
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
    this.responseMode = config.response_mode;
    this.logs = [];
    this.maxLogCount = 10; // 最大日志保存数量
    
    // 初始化时从本地存储加载日志
    this.loadLogsFromStorage();
  }

  /**
   * 调用阻塞模式API
   * @param {Object} requestData - 请求数据
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 失败回调
   */
  callBlockingAPI(requestData, onSuccess, onError) {
    wx.request({
      url: this.apiUrl,
      method: 'POST',
      header: {
        'Authorization': this.apiKey,
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
          
          let result = this.parseApiResult(workflowData);
          
          // 确保result是字符串且不为空
          if (!result || typeof result !== 'string' || result.trim() === '') {
            result = '算命结果获取失败';
          }
          
          // 调用成功回调
          if (onSuccess) {
            onSuccess(result);
          }
          
        } else {
          const errorMsg = 'API调用失败，状态码: ' + res.statusCode + '，数据: ' + JSON.stringify(res.data);
          if (onError) {
            onError(errorMsg);
          }
        }
      },
      fail: (err) => {
        console.error('API调用失败:', err);
        
        // 记录API调用日志
        this.logApiCall(requestData, err, false);
        
        const errorMsg = '网络连接失败，请检查网络后重试';
        if (onError) {
          onError(errorMsg);
        }
      }
    });
  }

  /**
   * 调用流式模式API
   * @param {Object} requestData - 请求数据
   * @param {Function} onStreamChunk - 流式数据回调
   * @param {Function} onStreamEnd - 流式结束回调
   * @param {Function} onError - 失败回调
   */
  callStreamingAPI(requestData, onStreamChunk, onStreamEnd, onError) {
    // 小程序不直接支持SSE，需要使用WebSocket或轮询方式
    // 这里使用模拟的方式，实际项目中可能需要后端转换
    console.log('流式模式暂不支持，降级为阻塞模式');
    
    // 临时降级为阻塞模式，但通过分段方式模拟流式输出
    const blockingRequestData = {
      ...requestData,
      response_mode: 'blocking'
    };
    
    wx.request({
      url: this.apiUrl,
      method: 'POST',
      header: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      },
      data: blockingRequestData,
      success: (res) => {
        console.log('API响应:', res);
        
        if (res.statusCode === 200 && res.data && res.data.data) {
          const workflowData = res.data.data;
          let result = this.parseApiResult(workflowData);
          
          if (result && typeof result === 'string' && result.trim() !== '') {
            // 模拟流式输出，将结果分段发送
            this.simulateStreamingOutput(result, onStreamChunk, onStreamEnd);
          } else {
            if (onError) {
              onError('算命结果获取失败');
            }
          }
        } else {
          const errorMsg = 'API调用失败，状态码: ' + res.statusCode;
          if (onError) {
            onError(errorMsg);
          }
        }
      },
      fail: (err) => {
        console.error('API调用失败:', err);
        const errorMsg = '网络连接失败，请检查网络后重试';
        if (onError) {
          onError(errorMsg);
        }
      }
    });
  }

  /**
   * 模拟流式输出
   * @param {String} fullText - 完整文本
   * @param {Function} onStreamChunk - 流式数据回调
   * @param {Function} onStreamEnd - 流式结束回调
   */
  simulateStreamingOutput(fullText, onStreamChunk, onStreamEnd) {
    const chunkSize = 10; // 每次输出的字符数
    let currentIndex = 0;
    
    const sendChunk = () => {
      if (currentIndex < fullText.length) {
        const chunk = fullText.slice(currentIndex, currentIndex + chunkSize);
        currentIndex += chunkSize;
        
        if (onStreamChunk) {
          onStreamChunk(chunk);
        }
        
        // 延迟发送下一段，模拟打字机效果
        setTimeout(sendChunk, 100);
      } else {
        // 流式输出结束
        if (onStreamEnd) {
          onStreamEnd();
        }
      }
    };
    
    sendChunk();
  }

  /**
   * 调用算命API
   * @param {Object} petData - 宠物数据
   * @param {Function} onSuccess - 成功回调（blocking模式）
   * @param {Function} onError - 失败回调
   * @param {Function} onStreamChunk - 流式数据回调（streaming模式）
   * @param {Function} onStreamEnd - 流式结束回调（streaming模式）
   */
  callFortuneTellingAPI(petData, onSuccess, onError, onStreamChunk, onStreamEnd) {
    console.log('petData:', petData); // 添加调试日志
    
    // 构建API请求数据
    const requestData = {
      inputs: {
        birth_date: petData.birthDate,
        pet_type: petData.petType,
        appearance: petData.petAppearance
      },
      response_mode: this.responseMode,
      user: "pet_owner_" + Date.now()
    };
    console.log('requestData:', requestData); // 添加调试日志

    // 根据response_mode选择不同的处理方式
    if (this.responseMode === 'streaming') {
      this.callStreamingAPI(requestData, onStreamChunk, onStreamEnd, onError);
    } else {
      this.callBlockingAPI(requestData, onSuccess, onError);
    }
  }

  /**
   * 解析API返回结果
   * @param {Object} workflowData - API返回的工作流数据
   * @returns {String} 解析后的结果
   */
  parseApiResult(workflowData) {
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
    
    return result;
  }

  /**
   * 记录API调用日志
   * @param {Object} requestData - 请求数据
   * @param {Object} response - 响应数据
   * @param {Boolean} isSuccess - 是否成功
   */
  logApiCall(requestData, response, isSuccess) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      datetime: new Date().toLocaleString('zh-CN'),
      success: isSuccess,
      request: {
        url: this.apiUrl,
        method: 'POST',
        data: JSON.parse(JSON.stringify(requestData)) // 深拷贝避免引用问题
      },
      response: {
        statusCode: response.statusCode || 'unknown',
        data: JSON.parse(JSON.stringify(response.data || response)) // 深拷贝
      }
    };
    
    // 添加到日志数组
    this.logs.push(logEntry);
    
    // 只保留最近指定数量的调用记录，避免内存占用过多
    if (this.logs.length > this.maxLogCount) {
      this.logs.shift();
    }
    
    // 同时输出到控制台，方便实时查看
    console.log('=== API调用日志 ===');
    console.log('时间:', logEntry.datetime);
    console.log('成功:', logEntry.success);
    console.log('请求:', logEntry.request);
    console.log('响应:', logEntry.response);
    console.log('==================');
    
    // 存储到本地缓存，方便持久化查看
    this.saveLogsToStorage();
  }

  /**
   * 获取所有API调用日志
   * @returns {Array} 日志数组
   */
  getApiLogs() {
    return this.logs || [];
  }

  /**
   * 清空API调用日志
   */
  clearApiLogs() {
    this.logs = [];
    try {
      wx.removeStorageSync('api_debug_logs');
    } catch (e) {
      console.warn('清空本地日志失败:', e);
    }
    console.log('API调用日志已清空');
  }

  /**
   * 从本地存储加载日志
   */
  loadLogsFromStorage() {
    try {
      const storedLogs = wx.getStorageSync('api_debug_logs');
      if (storedLogs && Array.isArray(storedLogs)) {
        this.logs = storedLogs;
      }
    } catch (e) {
      console.warn('从本地存储加载日志失败:', e);
    }
  }

  /**
   * 保存日志到本地存储
   */
  saveLogsToStorage() {
    try {
      wx.setStorageSync('api_debug_logs', this.logs);
    } catch (e) {
      console.warn('保存日志到本地存储失败:', e);
    }
  }

  /**
   * 设置API密钥
   * @param {String} apiKey - API密钥
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * 设置最大日志保存数量
   * @param {Number} maxCount - 最大数量
   */
  setMaxLogCount(maxCount) {
    this.maxLogCount = maxCount;
    // 如果当前日志数量超过新的最大值，则删除多余的日志
    while (this.logs.length > this.maxLogCount) {
      this.logs.shift();
    }
  }
}

// 创建单例实例
const fortuneTellingAPI = new FortuneTellingAPI();

// 导出单例实例
module.exports = fortuneTellingAPI;