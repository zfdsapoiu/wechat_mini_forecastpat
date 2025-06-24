# Paipan 万年历库使用说明

## 项目简介

Paipan是一个专业的万年历库，支持农历公历干支历互转、万年历、四柱八字排盘、大运推算、真太阳时计算等功能。本项目完整移植了 [hkargc/paipan](https://github.com/hkargc/paipan) 项目的全部功能。

## 核心功能

### 1. 历法转换
- **公历转儒略日**: `p.Jdays(yy, mm, dd, hh, mt, ss)`
- **儒略日转公历**: `p.Jtime(jd)`
- **公历转农历**: `p.Solar2Lunar(yy, mm, dd)`
- **农历转公历**: `p.Lunar2Solar(yy, mm, dd, ry)`
- **公历转干支历**: `p.GetGZ(yy, mm, dd, hh, mt, ss)`

### 2. 八字排盘
- **基础八字计算**: `p.GetGZ(yy, mm, dd, hh, mt, ss)`
- **真太阳时排盘**: `p.fatemaps(xb, yy, mm, dd, hh, mt, ss, J, W)`
  - `xb`: 性别 (0=女, 1=男)
  - `J`: 经度 (东经为正，西经为负)
  - `W`: 纬度 (北纬为正，南纬为负)

### 3. 关系分析
- **刑冲合害分析**: 使用 `paipan.gx.js` 进行天干地支关系分析
- **支持关系类型**:
  - 天干相冲 (甲庚冲、乙辛冲等)
  - 天干相合 (甲己合化土、乙庚合化金等)
  - 地支相冲 (子午冲、丑未冲等)
  - 地支三刑 (寅巳申三刑、丑戌未三刑等)
  - 地支三合 (寅午戌三合火、申子辰三合水等)

### 4. 辅助功能
- **星期计算**: `p.GetWeek(yy, mm, dd)`
- **星座计算**: `p.GetXZ(yy, mm, dd, hh, mt, ss)`
- **节气计算**: `p.GetAdjustedJQ(yy, false)`
- **日出日落**: `p.risenset(jd, J, W, LX)`

## 使用示例

### JavaScript 使用

```javascript
// 引入库文件
// <script src="./paipan-lib/js/paipan.js"></script>
// <script src="./paipan-lib/js/paipan.gx.js"></script>

// 创建实例
var p = new paipan();

// 基础八字计算
var bazi = p.GetGZ(1990, 9, 1, 14, 49, 0);
console.log('八字:', bazi);

// 真太阳时排盘 (北京地区)
var fatemaps = p.fatemaps(1, 1990, 9, 1, 14, 49, 0, 116.4, 39.9);
console.log('排盘结果:', fatemaps);

// 公历转农历
var lunar = p.Solar2Lunar(1990, 9, 1);
console.log('农历:', lunar);

// 节气计算
var jieqi = p.GetAdjustedJQ(1990, false);
console.log('1990年节气:', jieqi);
```

### 云函数中使用

```javascript
// 在云函数中使用 paipan-core.js
const { paipan } = require('./paipan-core');

exports.main = async (event, context) => {
  const { birthDateTime } = event;
  
  // 解析时间
  const year = parseInt(birthDateTime.substring(0, 4));
  const month = parseInt(birthDateTime.substring(4, 6));
  const day = parseInt(birthDateTime.substring(6, 8));
  const hour = parseInt(birthDateTime.substring(8, 10));
  const minute = parseInt(birthDateTime.substring(10, 12));
  
  // 创建实例并计算八字
  const p = new paipan();
  const bazi = p.GetGZ(year, month, day, hour, minute, 0);
  
  return {
    birthDateTime,
    bazi: bazi.join('')
  };
};
```

## 精确度说明

本项目与寿星万年历进行过逐时比对，精确度如下：
- **公历儒略历**: 完全匹配
- **节气及月相**: 相差不超过20秒
- **真太阳时**: 相差在20秒内
- **农历**: -721年至2300年完全匹配
- **四柱八字**: 高精度算法，支持真太阳时

## 文件结构

```
paipan-lib/
├── js/
│   ├── paipan.js          # 核心万年历库
│   ├── paipan.gx.js       # 关系分析库
│   ├── paipan.min.js      # 压缩版本
│   └── jquery-3.6.0.min.js
├── lib/
│   └── class.paipan.php   # PHP版本
├── sxwnl/                 # 寿星万年历源码
├── demo.html              # 演示页面
├── demo.php               # PHP演示
└── README.md              # 项目说明
```

## 注意事项

1. **时区处理**: 默认使用东八区时间，可通过经纬度参数调整
2. **真太阳时**: 古代排盘建议使用真太阳时，现代可选择
3. **早晚子时**: 可通过 `zwz` 参数控制是否区分早晚子时
4. **精确度**: 节气计算精确到秒级，适合专业应用
5. **兼容性**: 支持从-1000年到3000年的计算范围

## 扩展功能

基于完整的paipan库，可以进一步开发：
- 大运流年推算
- 命盘分析
- 择日功能
- 星座运势
- 农历节日计算
- 二十四节气详细信息

## 参考资源

- 原项目地址: https://github.com/hkargc/paipan
- 演示地址: https://hkargv.github.io/paipan/
- 算法来源: http://www.bieyu.com/
- 寿星万年历: http://www.nongli.net/sxwnl/