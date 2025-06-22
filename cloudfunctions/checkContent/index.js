const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 内容安全检测云函数
 * 使用微信内容安全API检测文本内容
 */
exports.main = async (event, context) => {
  const { content, type = 'text' } = event;
  
  if (!content) {
    return {
      success: false,
      error: '内容不能为空'
    };
  }
  
  try {
    // 调用微信内容安全检测API
    const result = await cloud.openapi.security.msgSecCheck({
      content: content
    });
    
    console.log('内容安全检测结果:', result);
    
    // 检查结果
    if (result.errCode === 0) {
      // 内容安全
      return {
        success: true,
        risky: false,
        content: content,
        type: type
      };
    } else if (result.errCode === 87014) {
      // 内容含有违法违规内容
      return {
        success: true,
        risky: true,
        content: content,
        type: type,
        reason: '内容包含敏感信息'
      };
    } else {
      // 其他错误
      console.error('内容安全检测API错误:', result);
      return {
        success: false,
        error: `检测失败: ${result.errMsg}`,
        errCode: result.errCode
      };
    }
  } catch (error) {
    console.error('内容安全检测异常:', error);
    return {
      success: false,
      error: error.message || '检测服务异常'
    };
  }
};