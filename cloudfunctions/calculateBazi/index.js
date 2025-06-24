const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 引入专业万年历库的核心代码
const paipanCode = require('./paipan-core')

/**
 * 八字计算云函数
 * 输入：出生时间（yyyymmddhhmm格式）
 * 输出：八字信息
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { birthDateTime } = event
    
    if (!birthDateTime) {
      return {
        success: false,
        error: '缺少出生时间参数'
      }
    }
    
    // 解析出生时间
    const year = parseInt(birthDateTime.substring(0, 4))
    const month = parseInt(birthDateTime.substring(4, 6))
    const day = parseInt(birthDateTime.substring(6, 8))
    const hour = parseInt(birthDateTime.substring(8, 10))
    const minute = parseInt(birthDateTime.substring(10, 12))
    
    // 验证时间格式
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      return {
        success: false,
        error: '出生时间格式错误'
      }
    }
    
    // 使用专业万年历库计算八字
    const baziResult = calculateBazi(year, month, day, hour, minute)
    
    // 返回八字的八个汉字
    return {
      success: true,
      data: {
        birthDateTime: birthDateTime,
        bazi: baziResult
      }
    }
    
  } catch (error) {
    console.error('计算八字失败:', error)
    return {
      success: false,
      error: '计算八字失败: ' + error.message
    }
  }
}

/**
 * 使用专业万年历库计算八字的核心函数
 * @param {number} year 年
 * @param {number} month 月
 * @param {number} day 日
 * @param {number} hour 时
 * @param {number} minute 分
 * @returns {string} 八字字符串
 */
function calculateBazi(year, month, day, hour, minute) {
  // 创建万年历实例
  const p = new paipanCode.paipan()
  
  // 使用GetGZ函数计算四柱干支
  const result = p.GetGZ(year, month, day, hour, minute, 0)
  
  if (!result) {
    throw new Error('日期无效或计算失败')
  }
  
  const [tg, dz, ob] = result
  
  // 组合成八字字符串
  const bazi = p.ctg[tg[0]] + p.cdz[dz[0]] + // 年柱
               p.ctg[tg[1]] + p.cdz[dz[1]] + // 月柱
               p.ctg[tg[2]] + p.cdz[dz[2]] + // 日柱
               p.ctg[tg[3]] + p.cdz[dz[3]]   // 时柱
  
  return bazi
}

/**
 * 获取年干
 * 根据公历年份计算，以立春为分界
 */
function getNianGan(year, month, day) {
  let actualYear = year;
  
  // 如果是1-2月，需要判断是否过了立春
  if (month <= 2) {
    // 立春一般在2月3-5日，1月和2月4日前算上一年
    if (month === 1 || (month === 2 && day < 4)) {
      actualYear = year - 1;
    }
  }
  
  // 年干计算：(年份-3) % 10，因为公元4年为甲子年
  let gan = (actualYear - 3) % 10;
  if (gan <= 0) gan += 10;
  return gan - 1; // 转换为0-9索引
}

/**
 * 获取年支
 * 根据公历年份计算，以立春为分界
 */
function getNianZhi(year, month, day) {
  let actualYear = year;
  
  // 如果是1-2月，需要判断是否过了立春
  if (month <= 2) {
    // 立春一般在2月3-5日，1月和2月4日前算上一年
    if (month === 1 || (month === 2 && day < 4)) {
      actualYear = year - 1;
    }
  }
  
  // 年支计算：(年份-3) % 12，因为公元4年为甲子年
  let zhi = (actualYear - 3) % 12;
  if (zhi <= 0) zhi += 12;
  return zhi - 1; // 转换为0-11索引
}

/**
 * 获取月支
 * 根据节气确定月支，基于标准的二十四节气表
 * 月支对应：寅月(立春-惊蛰)、卯月(惊蛰-清明)、辰月(清明-立夏)、巳月(立夏-芒种)
 * 午月(芒种-小暑)、未月(小暑-立秋)、申月(立秋-白露)、酉月(白露-寒露)
 * 戌月(寒露-立冬)、亥月(立冬-大雪)、子月(大雪-小寒)、丑月(小寒-立春)
 */
function getYueZhi(year, month, day) {
  // 根据标准节气表进行月支计算
  // 寅月：立春(2月4日左右) - 惊蛰(3月6日左右)
  // 卯月：惊蛰(3月6日左右) - 清明(4月5日左右)
  // 辰月：清明(4月5日左右) - 立夏(5月6日左右)
  // 巳月：立夏(5月6日左右) - 芒种(6月6日左右)
  // 午月：芒种(6月6日左右) - 小暑(7月7日左右)
  // 未月：小暑(7月7日左右) - 立秋(8月8日左右)
  // 申月：立秋(8月8日左右) - 白露(9月8日左右)
  // 酉月：白露(9月8日左右) - 寒露(10月8日左右)
  // 戌月：寒露(10月8日左右) - 立冬(11月8日左右)
  // 亥月：立冬(11月8日左右) - 大雪(12月7日左右)
  // 子月：大雪(12月7日左右) - 小寒(1月6日左右)
  // 丑月：小寒(1月6日左右) - 立春(2月4日左右)
  
  if (month === 1) {
    return day < 6 ? 0 : 1; // 小寒前为子月，小寒后为丑月
  } else if (month === 2) {
    return day < 4 ? 1 : 2; // 立春前为丑月，立春后为寅月
  } else if (month === 3) {
    return day < 6 ? 2 : 3; // 惊蛰前为寅月，惊蛰后为卯月
  } else if (month === 4) {
    return day < 5 ? 3 : 4; // 清明前为卯月，清明后为辰月
  } else if (month === 5) {
    return day < 6 ? 4 : 5; // 立夏前为辰月，立夏后为巳月
  } else if (month === 6) {
    return day < 6 ? 5 : 6; // 芒种前为巳月，芒种后为午月
  } else if (month === 7) {
    return day < 7 ? 6 : 7; // 小暑前为午月，小暑后为未月
  } else if (month === 8) {
    return day < 8 ? 7 : 8; // 立秋前为未月，立秋后为申月
  } else if (month === 9) {
    return day < 8 ? 8 : 9; // 白露前为申月，白露后为酉月
  } else if (month === 10) {
    return day < 8 ? 9 : 10; // 寒露前为酉月，寒露后为戌月
  } else if (month === 11) {
    return day < 8 ? 10 : 11; // 立冬前为戌月，立冬后为亥月
  } else if (month === 12) {
    return day < 7 ? 11 : 0; // 大雪前为亥月，大雪后为子月
  }
  
  return 2; // 默认寅月
}

/**
 * 获取月干
 * 五虎遁：甲己之年丙作首，乙庚之岁戊为头，丙辛必定寻庚起，丁壬壬位顺行流，若问戊癸何方发，甲寅之上好追求
 */
function getYueGan(nianGanIndex, yueZhiIndex) {
  // 五虎遁起始天干：甲己->丙(2), 乙庚->戊(4), 丙辛->庚(6), 丁壬->壬(8), 戊癸->甲(0)
  const wuHuDun = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 对应甲乙丙丁戊己庚辛壬癸
  const startGan = wuHuDun[nianGanIndex];
  
  // 从寅月开始计算，寅=2，所以需要调整
  const yinIndex = 2;
  let offset = yueZhiIndex - yinIndex;
  if (offset < 0) offset += 12;
  
  return (startGan + offset) % 10;
}

/**
 * 获取日干支
 * 使用基准日期1900年1月1日为甲戌日计算
 */
function getRiGanZhi(year, month, day) {
  // 计算与1900年1月1日的天数差
  const baseDate = new Date(1900, 0, 1); // 1900年1月1日
  const targetDate = new Date(year, month - 1, day);
  const daysDiff = Math.floor((targetDate - baseDate) / (24 * 60 * 60 * 1000));
  
  // 1900年1月1日为甲戌日，天干甲=0，地支戌=10
  const baseGan = 0; // 甲
  const baseZhi = 10; // 戌
  
  // 计算日干支
  let ganIndex = (baseGan + daysDiff) % 10;
  let zhiIndex = (baseZhi + daysDiff) % 12;
  
  // 处理负数情况
  if (ganIndex < 0) ganIndex += 10;
  if (zhiIndex < 0) zhiIndex += 12;
  
  return {
    riGanIndex: ganIndex,
    riZhiIndex: zhiIndex
  };
}

/**
 * 获取时支
 * 时辰对应：23-1点子时，1-3点丑时，3-5点寅时...21-23点亥时
 */
function getShiZhi(hour) {
  // 23点开始为子时
  let timeIndex;
  if (hour === 23) {
    timeIndex = 0; // 子时
  } else {
    timeIndex = Math.floor((hour + 1) / 2);
  }
  return timeIndex % 12;
}

/**
 * 获取时干
 * 五鼠遁：甲己还加甲，乙庚丙作初，丙辛从戊起，丁壬庚子居，戊癸起壬子
 */
function getShiGan(riGanIndex, shiZhiIndex) {
  // 五鼠遁起始天干：甲己->甲(0), 乙庚->丙(2), 丙辛->戊(4), 丁壬->庚(6), 戊癸->壬(8)
  const wuShuDun = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 对应甲乙丙丁戊己庚辛壬癸
  const startGan = wuShuDun[riGanIndex];
  
  // 从子时开始计算
  return (startGan + shiZhiIndex) % 10;
}