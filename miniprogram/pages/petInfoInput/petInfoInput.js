// index.js
const app = getApp()
const ContentChecker = require('../../utils/contentChecker')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    petName: '',
    birthDate: '',
    petType: '',
    petAppearance: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('Index page loaded');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('petInfoInput onShow 被调用');
    const app = getApp();
    console.log('全局数据:', app.globalData);
    
    // 检查是否有从petDetail页面传递的编辑信息
    if (app.globalData && app.globalData.editPetInfo) {
      console.log('发现编辑信息:', app.globalData.editPetInfo);
      const petData = app.globalData.editPetInfo; // editPetInfo 本身就是 petData
      
      console.log('解析的宠物数据:', petData);
      
      // 自动填充宠物信息
      this.setData({
        petName: petData.petName || '',
        birthDate: petData.birthDate || '',
        petType: petData.petType || '',
        petAppearance: petData.petAppearance  || ''
      });
      
      console.log('已填充数据到页面:', {
        petName: petData.petName || '',
        birthDate: petData.birthDate || '',
        petType: petData.petType || '',
        petAppearance: petData.petAppearance  || ''
      });
      
      // 清除全局数据，避免重复填充
      delete app.globalData.editPetInfo;
    } else {
      console.log('没有发现编辑信息');
    }
  },

  /**
   * 宠物名字输入处理
   */
  bindPetNameInput: function(e) {
    this.setData({
      petName: e.detail.value
    });
  },

  /**
   * 宠物名字输入框失去焦点时进行内容检测
   */
  onPetNameBlur: function(e) {
    const petName = e.detail.value;
    if (petName && petName.trim()) {
      ContentChecker.checkNickname(petName, {
        onSuccess: (result) => {
          console.log('宠物名字内容检测通过:', result);
        },
        onRisk: (result) => {
          console.log('宠物名字内容有风险:', result);
          this.setData({ petName: '' });
        },
        onError: (error) => {
          console.log('宠物名字内容检测失败，允许输入:', error);
        }
      });
    }
  },

  /**
   * 宠物生日输入处理
   */
  bindBirthDateInput: function(e) {
    const value = e.detail.value;
    this.setData({
      birthDate: value
    });
    
    // 实时验证日期格式
    if (value && !this.validateDateFormat(value)) {
      wx.showToast({
        title: '日期格式不正确',
        icon: 'none',
        duration: 1500
      });
    }
  },

  /**
   * 宠物类型品种输入处理
   */
  bindPetTypeInput: function(e) {
    this.setData({
      petType: e.detail.value
    });
  },

  /**
   * 宠物外貌特征输入处理
   */
  bindPetAppearanceInput: function(e) {
    this.setData({
      petAppearance: e.detail.value
    });
  },

  /**
   * 宠物外貌特征输入框失去焦点时进行内容检测
   */
  onPetAppearanceBlur: function(e) {
    const petAppearance = e.detail.value;
    if (petAppearance && petAppearance.trim()) {
      ContentChecker.checkComment(petAppearance, {
        onSuccess: (result) => {
          console.log('宠物外貌特征内容检测通过:', result);
        },
        onRisk: (result) => {
          console.log('宠物外貌特征内容有风险:', result);
          this.setData({ petAppearance: '' });
        },
        onError: (error) => {
          console.log('宠物外貌特征内容检测失败，允许输入:', error);
        }
      });
    }
  },

  /**
   * 验证日期格式 (yyyymmddhhmm)
   */
  validateDateFormat: function(dateStr) {
    // 检查基本格式：8位数字(yyyymmdd)或12位数字(yyyymmddhhmm)
    if (!/^\d{8}$|^\d{12}$/.test(dateStr)) {
      return false;
    }
    
    // 提取年月日时分
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6));
    const day = parseInt(dateStr.substring(6, 8));
    
    // 验证年份范围 (1900-2030)
    if (year < 1900 || year > 2030) {
      return false;
    }
    
    // 验证月份 (1-12)
    if (month < 1 || month > 12) {
      return false;
    }
    
    // 验证日期 (1-31)
    if (day < 1 || day > 31) {
      return false;
    }
    
    // 如果包含时间，验证时分
    if (dateStr.length === 12) {
      const hour = parseInt(dateStr.substring(8, 10));
      const minute = parseInt(dateStr.substring(10, 12));
      
      // 验证小时 (0-23)
      if (hour < 0 || hour > 23) {
        return false;
      }
      
      // 验证分钟 (0-59)
      if (minute < 0 || minute > 59) {
        return false;
      }
    }
    
    // 进一步验证日期的有效性
    try {
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || 
          dateObj.getMonth() !== month - 1 || 
          dateObj.getDate() !== day) {
        return false;
      }
    } catch (e) {
      return false;
    }
    
    return true;
  },

  /**
   * 保存宠物信息到本地存储
   * @returns {Promise} 返回Promise以支持异步流程控制
   */
  savePetInfo: function() {
    return new Promise((resolve, reject) => {
      const { petName, birthDate, petType, petAppearance } = this.data;
      
      // 验证必填字段（兼容setData设置的值）
      if (!petName || !String(petName).trim()) {
        wx.showToast({
          title: '请输入宠物名字',
          icon: 'none'
        });
        reject(new Error('请输入宠物名字'));
        return;
      }
      
      if (!birthDate || !String(birthDate).trim()) {
        wx.showToast({
          title: '请输入宠物生日',
          icon: 'none'
        });
        reject(new Error('请输入宠物生日'));
        return;
      }
      
      if (!petType || !String(petType).trim()) {
        wx.showToast({
          title: '请输入宠物类型品种',
          icon: 'none'
        });
        reject(new Error('请输入宠物类型品种'));
        return;
      }
      
      if (!petAppearance || !String(petAppearance).trim()) {
        wx.showToast({
          title: '请输入宠物外貌特征',
          icon: 'none'
        });
        reject(new Error('请输入宠物外貌特征'));
        return;
      }
      
      // 验证日期格式
      if (!this.validateDateFormat(birthDate)) {
        wx.showToast({
          title: '日期格式不正确，请使用yyyymmddhhmm格式',
          icon: 'none',
          duration: 3000
        });
        reject(new Error('日期格式不正确'));
        return;
      }
      
      try {
        // 构建宠物信息对象
        const petInfo = {
          id: String(petName).trim(), // 使用宠物名作为唯一ID
          petData: {
            petName: String(petName).trim(),
            birthDate: String(birthDate).trim(),
            petType: String(petType).trim(),
            petAppearance: String(petAppearance).trim()
          },
          timestamp: Date.now(),
          createTime: new Date().toISOString(),
          createTimeFormatted: new Date().toLocaleString('zh-CN'),
          calculated:0,
          output: {}
        };
        
        // 获取现有的宠物信息列表
        let petInfoList = wx.getStorageSync('petInfoList') || [];
        
        // 检查是否已存在相同的宠物信息
        const existingIndex = petInfoList.findIndex(item => 
          item.petData && item.petData.petName === petInfo.petData.petName);
        
        if (existingIndex !== -1) {
          // 宠物已存在，询问用户是否更新
          wx.showModal({
            title: '宠物信息已存在',
            content: `宠物"${petInfo.petData.petName}"的信息已存在，是否要更新？`,
            confirmText: '更新',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                // 用户确认更新
                petInfoList[existingIndex] = petInfo;
                
                // 保存到本地存储
                wx.setStorageSync('petInfoList', petInfoList);
                
                wx.showToast({
                  title: '宠物信息已更新',
                  icon: 'success'
                });
                
                console.log('宠物信息已更新:', petInfo);
                resolve(petInfo);
              } else {
                // 用户取消更新
                console.log('用户取消更新宠物信息');
                reject(new Error('用户取消更新'));
              }
            },
            fail: () => {
              reject(new Error('显示确认对话框失败'));
            }
          });
        } else {
          // 添加新记录到开头
          petInfoList.unshift(petInfo);
          
          // 限制记录数量，最多保存50条
          if (petInfoList.length > 50) {
            petInfoList = petInfoList.slice(0, 50);
          }
          
          // 保存到本地存储
          wx.setStorageSync('petInfoList', petInfoList);
          
          wx.showToast({
            title: '宠物信息已保存',
            icon: 'success'
          });
          
          console.log('宠物信息已保存:', petInfo);
          resolve(petInfo);
        }
        
      } catch (error) {
        console.error('保存宠物信息失败:', error);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
        reject(error);
      }
    });
  },

  /**
   * 开始分析 - 先保存宠物信息，然后跳转到result页面
   */
  calculate: async function() {
    try {
      // 显示加载提示
      wx.showLoading({
        title: '保存中...',
        mask: true
      });
      
      // 先调用savePetInfo保存宠物信息，等待保存完成
      const petInfo = await this.savePetInfo();
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 跳转到result页面，只传递petName参数
      const petName = petInfo.petData.petName;
      wx.navigateTo({
        url: `/pages/result/result?petName=${petName}`
      });
      
    } catch (error) {
      // 隐藏加载提示
      wx.hideLoading();
      
      console.error('保存宠物信息或跳转失败:', error);
      
      // 如果是用户取消操作，不显示错误提示
      if (error.message !== '用户取消更新') {
        wx.showToast({
          title: '操作失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  /**
   * 清空输入内容
   */
  clearInputs: function() {
    this.setData({
      petName: '',
      birthDate: '',
      petType: '',
      petAppearance: ''
    });
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('Index page ready');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('Index page hide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('Index page unload');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 可以在这里添加刷新逻辑
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 可以在这里添加加载更多逻辑
  },
});