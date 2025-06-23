/**
 * 宠物算命AI调用工具类
 * 使用腾讯云开发内置的DeepSeek AI模型
 */
class FortuneTellingAPI {
  constructor() {
    this.logs = [];
    this.maxLogCount = 10; // 最大日志保存数量
    
    // 初始化时从本地存储加载日志
    this.loadLogsFromStorage();
  }

  /**
   * 调用云开发AI模型进行算命
   * @param {Object} petData - 宠物数据
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onError - 失败回调
   * @param {Function} onStreamChunk - 流式数据回调（可选）
   * @param {Function} onStreamEnd - 流式结束回调（可选）
   */
  async callFortuneTellingAPI(petData, onSuccess, onError, onStreamChunk, onStreamEnd) {
    try {
      // 构建算命prompt
      const prompt = this.buildFortunePrompt(petData);
      
      // 记录请求开始
      const requestData = {
        petData: petData,
        prompt: prompt,
        timestamp: new Date().toISOString()
      };
      
      console.log('开始调用云开发AI模型:', requestData);
      
      // 创建DeepSeek模型实例
      const model = wx.cloud.extend.AI.createModel("deepseek");
      
      if (onStreamChunk && onStreamEnd) {
        // 流式调用
        await this.callStreamingAI(model, prompt, requestData, onStreamChunk, onStreamEnd, onError);
      } else {
        // 阻塞式调用
        await this.callBlockingAI(model, prompt, requestData, onSuccess, onError);
      }
      
    } catch (error) {
      console.error('AI调用异常:', error);
      this.logApiCall(petData, error, false);
      if (onError) {
        onError('AI服务调用失败: ' + error.message);
      }
    }
  }

  /**
   * 流式调用AI模型
   */
  async callStreamingAI(model, prompt, requestData, onStreamChunk, onStreamEnd, onError) {
    try {
      const res = await model.streamText({
        data: {
          model: "deepseek-r1-0528", // 使用deepseek-v3模型
          messages: [
            { role: "user", content: prompt }
          ],
        },
      });
      
      let fullResult = '';
      
      // 接收流式响应
      for await (let chunk of res.textStream) {
        fullResult += chunk;
        if (onStreamChunk) {
          onStreamChunk(chunk);
        }
      }
      
      // 清理DeepSeek返回结果中的引用标记
      const cleanedResult = this.cleanDeepSeekResult(fullResult);
      
      // 记录成功日志
      this.logApiCall(requestData, { result: cleanedResult }, true);
      
      if (onStreamEnd) {
        onStreamEnd(cleanedResult);
      }
      
    } catch (error) {
      console.error('流式AI调用失败:', error);
      this.logApiCall(requestData, error, false);
      if (onError) {
        onError('AI流式调用失败: ' + error.message);
      }
    }
  }

  /**
   * 阻塞式调用AI模型
   */
  async callBlockingAI(model, prompt, requestData, onSuccess, onError) {
    try {
      const res = await model.generateText({
        data: {
          model: "deepseek-r1-0528", // 使用deepseek-v3模型
          messages: [
            { role: "user", content: prompt }
          ],
        },
      });
      
      const result = res.text || '';
      
      // 清理DeepSeek返回结果中的引用标记
      const cleanedResult = this.cleanDeepSeekResult(result);
      
      // 记录成功日志
      this.logApiCall(requestData, { result: cleanedResult }, true);
      
      if (cleanedResult && cleanedResult.trim() !== '') {
        if (onSuccess) {
          onSuccess(cleanedResult);
        }
      } else {
        if (onError) {
          onError('AI返回结果为空');
        }
      }
      
    } catch (error) {
      console.error('阻塞式AI调用失败:', error);
      this.logApiCall(requestData, error, false);
      if (onError) {
        onError('AI调用失败: ' + error.message);
      }
    }
  }

  /**
   * 清理DeepSeek返回结果中的引用标记
   * @param {String} result - 原始结果
   * @returns {String} 清理后的结果
   */
  cleanDeepSeekResult(result) {
    if (!result || typeof result !== 'string') {
      return result;
    }
    
    // 去除开头和结尾的```markdown标记
    let cleaned = result.replace(/^```markdown\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
    
    // 去除开头和结尾的```标记（不带语言标识）
    cleaned = cleaned.replace(/^```\s*\n?/, '');
    cleaned = cleaned.replace(/\n?```\s*$/, '');
    
    // 去除开头和结尾的'''标记
    cleaned = cleaned.replace(/^'''\s*\n?/, '');
    cleaned = cleaned.replace(/\n?'''\s*$/, '');
    
    return cleaned.trim();
  }

  /**
   * 构建算命prompt
   * @param {Object} petData - 宠物数据
   * @returns {String} 完整的prompt
   */
  buildFortunePrompt(petData) {
    const { birth_date, pet_type, appearance } = petData;
    
    // 读取算命prompt模板
    const promptTemplate = `
一、犬类八字理论重构
时间单位调整
以「月」为基本命理周期（人类1年≈犬类7年），将出生时间转换为「犬类四柱」

然后四柱对应的分析方向：
年柱：犬类祖先基因及先天体质（对应品种遗传特征）
月柱：核心性格与情感模式（参考犬种行为学）
日柱：健康与寿命关键指标（结合鼻头颜色、耳型等面相特征）
时柱：与主人缘分及家庭运势

同时侧重考虑宠物宠物品种性格。
也要考虑外貌特征，毛色对应的五行属性的影响

输出：（注意每一项要详细分析，以下每一项不少于100字）
1 宠物的四柱八字排列，命盘，结合貌特征的重点特征

2 宠物的命理核心解析包括：1 性格特征 2健康 3整体运势发展

3 基于宠物的命理核心的调理建议，包括：1 五行平衡 2品种特性优化 3风水布局

4 宠物专属命名建议

5 宠物生命周期关键节点，以表格呈现

最后用升华的语言总结

现在你要给这个狗狗测算命理，出生时间${birth_date}，狗狗类型为${pet_type}，狗狗外貌特征为${appearance}。请基于上面的方法给出这只狗狗的命理测算

注意输出为markdown格式纯文本，不要输出多余的内容
`;
    
    return promptTemplate;
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
      request: requestData,
      response: response,
      success: isSuccess,
      type: 'cloudbase-ai'
    };
    
    this.logs.unshift(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogCount) {
      this.logs = this.logs.slice(0, this.maxLogCount);
    }
    
    // 保存到本地存储
    this.saveLogsToStorage();
    
    console.log('=== AI调用日志 ===');
    console.log('请求:', requestData);
    console.log('响应:', response);
    console.log('成功:', isSuccess);
    console.log('================');
  }

  /**
   * 获取所有AI调用日志
   */
  getApiLogs() {
    return this.logs;
  }

  /**
   * 清空AI调用日志
   */
  clearApiLogs() {
    this.logs = [];
    wx.removeStorageSync('ai_debug_logs');
    
    console.log('AI调用日志已清空');
  }

  /**
   * 从本地存储加载日志
   */
  loadLogsFromStorage() {
    try {
      const storedLogs = wx.getStorageSync('ai_debug_logs');
      if (storedLogs && Array.isArray(storedLogs)) {
        this.logs = storedLogs;
      }
    } catch (error) {
      console.error('加载日志失败:', error);
      this.logs = [];
    }
  }

  /**
   * 保存日志到本地存储
   */
  saveLogsToStorage() {
    try {
      wx.setStorageSync('ai_debug_logs', this.logs);
    } catch (error) {
      console.error('保存日志失败:', error);
    }
  }
}

// 创建单例实例
const fortuneTellingAPI = new FortuneTellingAPI();

// 导出实例
module.exports = fortuneTellingAPI;