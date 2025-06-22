/**
 * 内容安全检测工具类
 * 提供统一的内容安全检测功能
 */
class ContentChecker {
  /**
   * 检测文本内容安全性
   * @param {string} content - 要检测的内容
   * @param {string} type - 内容类型（nickname, comment等）
   * @param {Object} options - 配置选项
   * @returns {Promise} 检测结果
   */
  static async checkContent(content, type = 'text', options = {}) {
    const {
      showLoading = true,
      loadingText = '检测中...',
      enableFallback = true
    } = options;

    if (!content || !content.trim()) {
      return {
        success: true,
        risky: false,
        message: '内容为空'
      };
    }

    if (showLoading) {
      wx.showLoading({
        title: loadingText
      });
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'checkContent',
        data: {
          content: content.trim(),
          type: type
        }
      });

      if (showLoading) {
        wx.hideLoading();
      }

      if (res.result && res.result.success) {
        return {
          success: true,
          risky: res.result.risky || false,
          message: res.result.message || '检测完成'
        };
      } else {
        // 检测失败但有返回结果
        if (enableFallback) {
          return {
            success: true,
            risky: false,
            message: '检测服务异常，已通过'
          };
        } else {
          return {
            success: false,
            risky: false,
            message: res.result?.message || '检测失败'
          };
        }
      }
    } catch (error) {
      if (showLoading) {
        wx.hideLoading();
      }

      console.error('内容检测失败:', error);
      
      if (enableFallback) {
        // 降级处理：检测失败时默认通过
        return {
          success: true,
          risky: false,
          message: '检测服务不可用，已通过'
        };
      } else {
        return {
          success: false,
          risky: false,
          message: error.message || '网络异常'
        };
      }
    }
  }

  /**
   * 检测昵称内容
   * @param {string} nickname - 昵称
   * @param {Object} options - 配置选项
   * @returns {Promise} 检测结果
   */
  static async checkNickname(nickname, options = {}) {
    return this.checkContent(nickname, 'nickname', {
      loadingText: '检测昵称中...',
      ...options
    });
  }

  /**
   * 检测评论内容
   * @param {string} comment - 评论内容
   * @param {Object} options - 配置选项
   * @returns {Promise} 检测结果
   */
  static async checkComment(comment, options = {}) {
    return this.checkContent(comment, 'comment', {
      loadingText: '检测评论中...',
      ...options
    });
  }

  /**
   * 批量检测内容
   * @param {Array} contents - 内容数组，格式：[{content, type}]
   * @param {Object} options - 配置选项
   * @returns {Promise} 检测结果数组
   */
  static async checkBatch(contents, options = {}) {
    const {
      showLoading = true,
      loadingText = '批量检测中...'
    } = options;

    if (showLoading) {
      wx.showLoading({
        title: loadingText
      });
    }

    try {
      const promises = contents.map(item => 
        this.checkContent(item.content, item.type, { showLoading: false })
      );
      
      const results = await Promise.all(promises);
      
      if (showLoading) {
        wx.hideLoading();
      }
      
      return results;
    } catch (error) {
      if (showLoading) {
        wx.hideLoading();
      }
      throw error;
    }
  }

  /**
   * 显示检测结果提示
   * @param {Object} result - 检测结果
   * @param {Object} messages - 自定义提示消息
   */
  static showResultToast(result, messages = {}) {
    const {
      successMessage = '内容检测通过',
      riskyMessage = '内容包含敏感信息',
      failMessage = '检测失败'
    } = messages;

    if (!result.success) {
      wx.showToast({
        title: failMessage,
        icon: 'none'
      });
    } else if (result.risky) {
      wx.showToast({
        title: riskyMessage,
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: successMessage,
        icon: 'success'
      });
    }
  }
}

module.exports = ContentChecker;