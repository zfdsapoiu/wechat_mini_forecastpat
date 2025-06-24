/**
 * 专业万年历库核心代码 - 用于云函数
 * 基于 hkargv/paipan 项目
 */

// 导出paipan类供云函数使用
function paipan() {
	/**
	 * 标准时间发出地经度(角度表示,东经为正西经为负),北京时间的经度为+120度0分
	 */
	this.J = 120;
	/**
	 * 默认纬度(角度表示,北纬为正南纬为负),这里是中国标准时间发出地(陕西省渭南市蒲城县)
	 */
	this.W = 35;
	/**
     * 缓存每年的节气计算结果Jie Qi
     */
    this.JQ = [];
    /**
     * 缓存农历相关的计算结果Month code月代码
     */
    this.MC = [];
	/**
	 * 缓存synodic month朔望月
	 */
	this.SM = [];
    /**
     * 四柱是否区分"早晚子"时,true则23:00-24:00算成上一日柱
     */
    this.zwz = true;
	/**
     * 是否采用精确法"排大运",用于起运处,粗略法一年按360天算,精确法按回归年算
     */
    this.pdy = false;
    /**
     * 均值朔望月長 synodic month (new Moon to new Moon)
     */
    this.synmonth = 29.530588853;
	/**
     * 回归年长 Tropical year
     */
    this.ty = 365.24244475;
    /**
     * 星期 week day
     */
    this.wkd = ['日', '一', '二', '三', '四', '五', '六'];
    /**
     * 六十甲子
     */
    this.gz = [
        '甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
        '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
        '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
        '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
        '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
        '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'
    ];
    /**
     * 十天干 char of TianGan
     */
    this.ctg = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    /**
     * 十二地支 char of DiZhi
     */
    this.cdz = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    /**
     * 十二生肖 char of symbolic animals ShengXiao
     */
    this.csx = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    /**
     * 廿四节气(从春分开始) JieQi
     */
    this.jq = ['春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'];

    // 数学工具函数
    this.floatval = function(val) {
        return parseFloat(val) || 0;
    };
    
    this.intval = function(val) {
        return parseInt(val) || 0;
    };
    
    // 验证日期有效性
    this.ValidDate = function(yy, mm, dd) {
        if (yy < 1000 || yy > 3000) return false;
        if (mm < 1 || mm > 12) return false;
        if (dd < 1 || dd > 31) return false;
        
        var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // 闰年判断
        if ((yy % 4 === 0 && yy % 100 !== 0) || (yy % 400 === 0)) {
            daysInMonth[1] = 29;
        }
        
        return dd <= daysInMonth[mm - 1];
    };
    
    // 计算儒略日
    this.Jdays = function(yy, mm, dd, hh, mt, ss) {
        var hh = hh || 0;
        var mt = mt || 0;
        var ss = ss || 0;
        
        if (mm <= 2) {
            yy -= 1;
            mm += 12;
        }
        
        var a = Math.floor(yy / 100);
        var b = 2 - a + Math.floor(a / 4);
        
        var jd = Math.floor(365.25 * (yy + 4716)) + Math.floor(30.6001 * (mm + 1)) + dd + b - 1524.5;
        jd += (hh + mt / 60 + ss / 3600) / 24;
        
        return jd;
    };
    
    // 获取调整后的节气
    this.GetAdjustedJQ = function(yy, cache) {
        if (cache && this.JQ[yy]) {
            return this.JQ[yy];
        }
        
        var jq = [];
        
        // 简化的节气计算 - 基于平均值
        var baseJD = this.Jdays(yy, 3, 20, 12, 0, 0); // 春分基准
        
        for (var i = 0; i < 24; i++) {
            jq[i] = baseJD + i * 15.2184; // 平均每个节气约15.2184天
        }
        
        if (cache) {
            this.JQ[yy] = jq;
        }
        
        return jq;
    };
    
    /**
     * 四柱計算,根据this.zwz决定是否分早子时晚子时,传公历
     * @param int yy(1000-3000)
     * @param int mm(1-12)
     * @param int dd(1-31)
     * @param int hh(0-23)
     * @param int mt(0-59),分钟,在跨节的时辰上会需要,有的排盘忽略跨节
     * @param int ss(0-59),秒数
     * @return false/array(天干, 地支, 附加资料)
     */
    this.GetGZ = function(yy, mm, dd, hh, mt, ss) {
        var yy = this.floatval(yy);
        var mm = this.floatval(mm);
        var dd = this.floatval(dd);
        var hh = this.floatval(hh);
        var mt = (mt === undefined) ? 0 : this.floatval(mt);
        var ss = (ss === undefined) ? 0 : this.floatval(ss);

        if (mt + ss == 0) { //避免整点模糊
            ss = 10;
        }

        if (this.ValidDate(yy, mm, dd) === false) {
            return false;
        }

        var spcjd = this.Jdays(yy, mm, dd, hh, mt, ss);
        if (spcjd === false) {
            return false;
        }
		
		var jr = [];
		for(var ty = yy; ; ty--){ //公历年的立春在前一年春分开始的数组中
			var dj = this.GetAdjustedJQ(ty, false);
			jr = dj.concat(jr); //往前插入
			if(spcjd >= dj[21]){ //dj[21]為立春,約在2月5日前後,若小於dj[21],則屬於前一個節氣年
				ty++;
				break;
			}
		}

        var tg = [];
        var dz = [];
        var ygz = ((ty + 4712 + 24) % 60 + 60) % 60;
        tg[0] = ygz % 10; //年干
        dz[0] = ygz % 12; //年支
        for (var j = 0; ; j++) {
            if (spcjd < jr[21 + 2*j]) {
                var tm = j - 1;
                break;
            } //已超過指定時刻,故應取前一個節氣
        }

        var tmm = ((ty + 4712) * 12 + tm + 60) % 60;
        var mgz = (tmm + 50) % 60;
        tg[1] = mgz % 10; //月干
        dz[1] = mgz % 12; //月支
        //計算日柱之干支 
        var jda = spcjd + 0.5; //加0.5是將起始點從正午改為從0點開始
        var thes = ((jda - Math.floor(jda)) * 86400) + 3600; //將jd的小數部份化為秒,並加上起始點前移的一小時(3600秒),取其整數值
        var dayjd = Math.floor(jda) + thes / 86400; //將秒數化為日數,加回到jd的整數部份
        var dgz = (Math.floor(dayjd + 49) % 60 + 60) % 60;
        tg[2] = dgz % 10; //日干
        dz[2] = dgz % 12; //日支
        if (this.zwz && (hh >= 23)) { //区分早晚子时,日柱前移一柱
            tg[2] = (tg[2] + 10 - 1) % 10;
            dz[2] = (dz[2] + 12 - 1) % 12;
        }
        //計算時柱之干支
        var dh = dayjd * 12;
        var hgz = (Math.floor(dh + 48) % 60 + 60) % 60;
        tg[3] = hgz % 10; //時干
        dz[3] = hgz % 12; //時支
		
		var ob = {
			ty: ty,
			jr: jr
		};
        return [tg, dz, ob];
    };
}

module.exports = {
    paipan: paipan
};