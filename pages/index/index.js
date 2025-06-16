// index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
//testgit
Page({
  data: {
    // motto: 'Hello World', // Removed motto
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: '',
    },
    hasUserInfo: false,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    birthDate: '', // Added for date picker
    currentDate: getFormattedDate(new Date()), // Added for date picker end range
    petType: '', // Added for pet type input
    petAppearance: '', // Added for pet appearance input
    furType: '', // 添加毛发类型
  },
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const { nickName } = this.data.userInfo
    this.setData({
      "userInfo.avatarUrl": avatarUrl,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  onInputChange(e) {
    const nickName = e.detail.value
    const { avatarUrl } = this.data.userInfo
    this.setData({
      "userInfo.nickName": nickName,
      hasUserInfo: nickName && avatarUrl && avatarUrl !== defaultAvatarUrl,
    })
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息', 
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  // 用于宠物生日输入和验证
  bindBirthDateInput: function(e) {
    const value = e.detail.value;
    this.setData({
      birthDate: value
    });
  },

  // 用于宠物种类输入
  bindPetTypeInput: function(e) {
    this.setData({
      petType: e.detail.value
    });
  },

  // 用于宠物外貌输入
  bindPetAppearanceInput: function(e) {
    this.setData({
      petAppearance: e.detail.value
    });
  },

  // 用于毛发类型输入
  bindFurTypeInput: function(e) {
    this.setData({
      furType: e.detail.value
    });
  },
  calculate: function() {
    // 检查是否已登录
    if (!this.data.hasUserInfo) {
      this.showLoginTip();
      return;
    }
    
    if (!this.data.birthDate) {
      wx.showToast({
        title: '请输入宠物生日',
        icon: 'none'
      });
      return;
    }
    
    // 验证宠物生日格式
    const birthDate = this.data.birthDate;
    const isValidFormat = /^\d{8}$|^\d{12}$/.test(birthDate);
    
    if (!isValidFormat) {
      wx.showToast({
        title: '生日格式有误，请输入8位或12位数字',
        icon: 'none'
      });
      return;
    }
    if (!this.data.petType) {
      wx.showToast({
        title: '请输入宠物种类',
        icon: 'none'
      });
      return;
    }
    if (!this.data.furType) {
      wx.showToast({
        title: '请输入外貌特征',
        icon: 'none'
      });
      return;
    }
    // 收集宠物数据，包含宠物名字
    const petData = {
      nickName: this.data.userInfo.nickName,
      birthDate: this.data.birthDate,
      petType: this.data.petType,
      petAppearance: this.data.furType
    };
    
    // 跳转到结果页面
    wx.navigateTo({
      url: '/pages/result/result?petData=' + encodeURIComponent(JSON.stringify(petData))
    });
  },
  
  // 显示登录提示
  showLoginTip: function() {
    wx.showToast({
      title: '请先登录',
      icon: 'none',
      duration: 2000
    });
  }
})
