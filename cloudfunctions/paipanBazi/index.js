const cloud = require('wx-server-sdk');
const fs = require('fs');
const path = require('path');

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

/**
 * 读取并执行paipan核心代码
 */
function loadPaipanCore() {
  const paipanCorePath = path.join(__dirname, 'paipan-core.js');
  const paipanCode = fs.readFileSync(paipanCorePath, 'utf8');
  
  // 创建一个沙盒环境来执行paipan代码
  const sandbox = {
    window: {},
    console: console
  };
  
  // 执行paipan代码
  const vm = require('vm');
  const context = vm.createContext(sandbox);
  vm.runInContext(paipanCode, context);
  
  return sandbox.window.p;
}

/**
 * 解析生日时间字符串
 * @param {string} birthDateTime - 格式: YYYYMMDDHHMM
 * @returns {object} 解析后的时间对象
 */
function parseBirthDateTime(birthDateTime) {
  const str = birthDateTime.toString();
  
  if (str.length !== 12) {
    throw new Error('生日时间格式错误，应为YYYYMMDDHHMM格式');
  }
  
  return {
    year: parseInt(str.substring(0, 4)),
    month: parseInt(str.substring(4, 6)),
    day: parseInt(str.substring(6, 8)),
    hour: parseInt(str.substring(8, 10)),
    minute: parseInt(str.substring(10, 12))
  };
}

/**
 * 云函数入口函数
 * @param {object} event - 云函数事件参数
 * @param {string} event.birthDateTime - 生日时间，格式: YYYYMMDDHHMM
 * @param {number} [event.gender] - 性别，0为男，1为女，默认为0
 * @param {number} [event.longitude] - 经度，默认使用北京经度116.4
 * @param {number} [event.latitude] - 纬度，默认使用北京纬度39.9
 * @returns {object} 包含八字排盘结果的对象
 */
exports.main = async (event, context) => {
  try {
    const { birthDateTime, gender = 0, longitude = 116.4, latitude = 39.9 } = event;
    
    if (!birthDateTime) {
      throw new Error('缺少必要参数: birthDateTime');
    }
    
    // 解析生日时间
    const { year, month, day, hour, minute } = parseBirthDateTime(birthDateTime);
    
    // 加载paipan核心库
    const p = loadPaipanCore();
    
    // 使用真太阳时排盘
    // p.fatemaps(xb, yy, mm, dd, hh, mt, ss, J, W)
    // xb: 性别(0男1女)
    // yy: 年
    // mm: 月
    // dd: 日
    // hh: 时
    // mt: 分
    // ss: 秒
    // J: 经度(东经为正)
    // W: 纬度(北纬为正)
    const result = p.fatemaps(
      gender,
      year,
      month,
      day,
      hour,
      minute,
      0, // 秒数设为0
      longitude, // 北京经度
      latitude   // 北京纬度
    );
    
    if (result === false) {
      throw new Error('八字计算失败，请检查输入的日期时间是否正确');
    }
    
    // 提取核心八字信息
    const bazi = {
      // 基本信息
      birthDateTime: birthDateTime,
      gender: result.xb,
      mz: result.mz, // 命造(乾/坤)
      
      // 公历和农历
      gregorian: result.gl, // 公历[年,月,日]
      lunar: result.nl, // 农历信息
      
      // 四柱八字
      fourPillars: result.sz, // 四柱字符串数组
      tianGan: result.ctg, // 天干字符数组
      diZhi: result.cdz, // 地支字符数组
      tianGanCode: result.tg, // 天干代码数组
      diZhiCode: result.dz, // 地支代码数组
      
      // 生肖星座
      shengXiao: result.sx, // 生肖
      xingZuo: result.xz, // 星座
      
      // 阴阳五行统计
      yinYangCount: result.nyy, // 阴阳数量[阳,阴]
      wuXingCount: result.nwx, // 五行数量[金,水,木,火,土]
      
      // 真太阳时信息(如果有)
      localMeanTime: result.pty, // 地方平太阳时
      localTrueTime: result.zty, // 地方真太阳时
      
      // 大运信息
      dayun: result.dy, // 大运详细信息
      qiyunDesc: result.qyy_desc, // 起运描述
      qiyunDesc2: result.qyy_desc2, // 起运详细描述
      
      // 地支藏干
      cangGan: result.bctg, // 藏干字符
      shiShen: result.bzcg, // 十神字符
      
      // 经纬度信息
      longitude: longitude,
      latitude: latitude
    };
    
    return {
      success: true,
      data: bazi,
      message: '八字排盘成功'
    };
    
  } catch (error) {
    console.error('paipanBazi云函数执行错误:', error);
    return {
      success: false,
      error: error.message,
      message: '八字排盘失败'
    };
  }
};