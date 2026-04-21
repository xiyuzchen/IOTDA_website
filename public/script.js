// 配置
// 配置
const CONFIG = {
  // 后端API地址 - 根据您的部署情况修改
  // 本地开发：http://localhost:5000/api
  // 生产环境：https://您的域名/api
  API_BASE_URL: 'http://localhost:5000/api',
  
  // 模拟数据开关
  // true: 使用模拟数据（当后端不可用时）
  // false: 使用真实API数据（当后端正常运行时）
  USE_MOCK_DATA: false,
  
  // 自动刷新间隔（毫秒）
  REFRESH_INTERVAL: 30000,
  
  // 华为云信息（显示在界面上）
  HUAWEI_INFO: {
    region: '华北-北京四',
    projectId: 'c1d7260632dc4d23bcd064076d170f21',
    appId: 'bded63f778f04ee9b917d3aabbf5e9da',
    productId: '69b4db91cbb0cf6bb946e086',
    productName: 'vihanc_图书馆数据模型'
  }
};

// 全局状态
let appState = {
  devices: [],
  properties: [],
  focusHistory: [],
  stats: {
    total: 0,
    online: 0,
    offline: 0,
    avgFocus: 0,
    todayCount: 0
  },
  lastUpdate: null,
  selectedDevice: null
};

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
  // 初始化UI
  initUI();
  
  // 加载初始数据
  loadInitialData();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 设置自动刷新
  if (CONFIG.REFRESH_INTERVAL > 0) {
    setInterval(() => {
      refreshData();
    }, CONFIG.REFRESH_INTERVAL);
  }
});

// 初始化UI
function initUI() {
  // 设置初始时间
  updateLastUpdateTime();
  
  // 显示加载状态
  showLoading();
}

// 加载初始数据
async function loadInitialData() {
  try {
    if (CONFIG.USE_MOCK_DATA) {
      // 使用模拟数据
      loadMockData();
    } else {
      // 从API获取真实数据
      await fetchRealData();
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    showToast('加载数据失败，切换到模拟数据', 'error');
    // 失败时使用模拟数据
    loadMockData();
  }
}

// 加载模拟数据（备用）
function loadMockData() {
  // 模拟数据
  const mockData = {
    devices: [
      {
        device_id: "device_001",
        device_name: "学习区监控设备",
        status: "在线",
        last_active: "2026-03-23 14:35:22",
        focus_percentage: 85,
        temperature: 23.5,
        humidity: 45,
        light: 320,
        noise: 38,
        timestamp: "2026-03-23 14:35:22",
        category: "focus_report"
      },
      {
        device_id: "device_002",
        device_name: "办公区监控设备",
        status: "在线",
        last_active: "2026-03-23 14:32:15",
        focus_percentage: 72,
        temperature: 24.2,
        humidity: 48,
        light: 280,
        noise: 45,
        timestamp: "2026-03-23 14:32:15",
        category: "focus_report"
      },
      {
        device_id: "device_003",
        device_name: "环境监测设备",
        status: "在线",
        last_active: "2026-03-23 14:30:10",
        focus_percentage: null,
        temperature: 22.8,
        humidity: 52,
        light: 350,
        noise: 42,
        timestamp: "2026-03-23 14:30:10",
        category: "environment"
      }
    ],
    properties: [
      { name: "device_id", value: "device_001", type: "string", last_update: "2026-03-23 14:35:22" },
      { name: "focus_percentage", value: "85%", type: "integer", last_update: "2026-03-23 14:35:22" },
      { name: "temperature", value: "23.5℃", type: "float", last_update: "2026-03-23 14:35:22" },
      { name: "humidity", value: "45%", type: "float", last_update: "2026-03-23 14:35:22" },
      { name: "light", value: "320 lux", type: "integer", last_update: "2026-03-23 14:35:22" },
      { name: "noise", value: "38 dB", type: "integer", last_update: "2026-03-23 14:35:22" },
      { name: "status", value: "在线", type: "string", last_update: "2026-03-23 14:35:22" }
    ],
    focusHistory: [
      { time: "09:00", value: 65 },
      { time: "10:00", value: 72 },
      { time: "11:00", value: 80 },
      { time: "12:00", value: 45 },
      { time: "13:00", value: 68 },
      { time: "14:00", value: 85 },
      { time: "15:00", value: 78 },
      { time: "16:00", value: 82 }
    ],
    stats: {
      total: 3,
      online: 3,
      offline: 0,
      avgFocus: 78,
      todayCount: 128
    },
    lastUpdate: new Date().toISOString()
  };
  
  // 更新应用状态
  appState.devices = mockData.devices;
  appState.properties = mockData.properties;
  appState.focusHistory = mockData.focusHistory;
  appState.stats = mockData.stats;
  appState.lastUpdate = mockData.lastUpdate;
  
  // 更新UI
  updateUI();
  
  // 隐藏加载状态
  hideLoading();
  
  // 显示数据源提示
  showToast('使用模拟数据展示', 'info');
}

// 从API获取真实数据
async function fetchRealData() {
  try {
    // 显示加载状态
    showLoading();
    
    // 1. 获取设备数据
    const devicesResponse = await fetch(`${CONFIG.API_BASE_URL}/devices`);
    if (!devicesResponse.ok) {
      throw new Error(`设备数据请求失败: ${devicesResponse.status}`);
    }
    
    const devicesData = await devicesResponse.json();
    
    // 更新应用状态
    appState.devices = devicesData.devices || [];
    appState.stats = devicesData.stats || { total: 0, online: 0, offline: 0 };
    appState.lastUpdate = devicesData.lastUpdate;
    
    // 2. 获取第一个设备的专注度历史数据（如果有专注度数据）
    const focusDevice = appState.devices.find(d => d.focus_percentage !== null);
    if (focusDevice) {
      try {
        const historyResponse = await fetch(
          `${CONFIG.API_BASE_URL}/device/${focusDevice.device_id}/history?property=focus_percentage&hours=24`
        );
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          appState.focusHistory = historyData.history || [];
        }
      } catch (historyError) {
        console.warn('获取历史数据失败:', historyError);
      }
    }
    
    // 3. 获取产品模型属性
    try {
      const propertiesResponse = await fetch(`${CONFIG.API_BASE_URL}/product/model`);
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        appState.properties = propertiesData.properties || [];
        
        // 用真实设备数据更新属性值
        if (appState.devices.length > 0) {
          const device = appState.devices[0];
          appState.properties = appState.properties.map(prop => {
            let value = '--';
            let lastUpdate = prop.last_update;
            
            // 根据属性名映射设备数据
            switch(prop.name) {
              case 'device_id':
                value = device.device_id;
                break;
              case 'focus_percentage':
                value = device.focus_percentage ? `${device.focus_percentage}%` : '--';
                lastUpdate = device.timestamp;
                break;
              case 'temperature':
                value = device.temperature ? `${device.temperature}℃` : '--';
                lastUpdate = device.timestamp;
                break;
              case 'humidity':
                value = device.humidity ? `${device.humidity}%` : '--';
                lastUpdate = device.timestamp;
                break;
              case 'light':
                value = device.light ? `${device.light} lux` : '--';
                lastUpdate = device.timestamp;
                break;
              case 'noise':
                value = device.noise ? `${device.noise} dB` : '--';
                lastUpdate = device.timestamp;
                break;
              case 'status':
                value = device.status;
                lastUpdate = device.last_active;
                break;
            }
            
            return { ...prop, value, last_update: lastUpdate };
          });
        }
      }
    } catch (propertiesError) {
      console.warn('获取产品模型失败:', propertiesError);
    }
    
    // 计算平均专注度
    const focusDevices = appState.devices.filter(d => d.focus_percentage !== null);
    if (focusDevices.length > 0) {
      const totalFocus = focusDevices.reduce((sum, device) => sum + device.focus_percentage, 0);
      appState.stats.avgFocus = Math.round(totalFocus / focusDevices.length);
    }
    
    // 更新UI
    updateUI();
    
    // 隐藏加载状态
    hideLoading();
    
    // 显示成功提示
    const dataSource = CONFIG.USE_MOCK_DATA ? '模拟数据' : '华为云IoT';
    showToast(`数据加载成功 (${dataSource})`, 'success');
    
  } catch (error) {
    console.error('获取真实数据失败:', error);
    throw error;
  }
}

// 刷新数据
async function refreshData() {
  try {
    if (!CONFIG.USE_MOCK_DATA) {
      await fetchRealData();
    } else {
      // 模拟数据自动更新
      simulateMockUpdate();
    }
    
    // 更新最后更新时间
    updateLastUpdateTime();
  } catch (error) {
    console.warn('数据刷新失败:', error);
  }
}

// 更新UI
function updateUI() {
  // 更新数据表格
  updateDataTable(appState.devices);
  
  // 更新属性列表
  updatePropertyList(appState.properties);
  
  // 更新统计信息
  updateSummary(appState.stats);
  
  // 更新图表
  updateChart(appState.focusHistory);
  
  // 更新页脚状态
  updateFooterStatus();
}

// 更新数据表格
function updateDataTable(devices) {
  const tableBody = document.getElementById('data-table-body');
  
  // 清空现有行
  tableBody.innerHTML = '';
  
  // 更新记录数
  document.getElementById('record-count').textContent = devices.length;
  
  // 添加新行
  devices.forEach(device => {
    const row = document.createElement('tr');
    
    // 根据专注度设置颜色
    const focusPercentage = device.focus_percentage;
    let focusClass = '';
    let focusDisplay = '--';
    
    if (focusPercentage !== null) {
      focusDisplay = `${focusPercentage}%`;
      if (focusPercentage >= 80) {
        focusClass = 'high-focus';
      } else if (focusPercentage >= 60) {
        focusClass = 'medium-focus';
      } else {
        focusClass = 'low-focus';
      }
    }
    
    row.innerHTML = `
      <td>${device.device_id}</td>
      <td class="${focusClass}">${focusDisplay}</td>
      <td>${device.temperature ? device.temperature + '℃' : '--'}</td>
      <td>${device.humidity ? device.humidity + '%' : '--'}</td>
      <td>${device.light ? device.light + ' lux' : '--'}</td>
      <td>${device.noise ? device.noise + ' dB' : '--'}</td>
      <td>${device.timestamp || '--'}</td>
      <td><button class="btn-view" data-device-id="${device.device_id}">查看详情</button></td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // 为查看详情按钮添加事件监听器
  document.querySelectorAll('.btn-view').forEach(button => {
    button.addEventListener('click', function() {
      const deviceId = this.getAttribute('data-device-id');
      const device = appState.devices.find(d => d.device_id === deviceId);
      if (device) {
        showDeviceDetails(device);
      }
    });
  });
}

// 更新属性列表
function updatePropertyList(properties) {
  const propertyList = document.getElementById('property-list');
  
  // 清空现有属性
  propertyList.innerHTML = '';
  
  // 添加属性项
  properties.forEach(property => {
    const propertyItem = document.createElement('div');
    propertyItem.className = 'property-item';
    
    propertyItem.innerHTML = `
      <div class="property-name">${property.name}</div>
      <div class="property-value">${property.value}</div>
      <div class="property-meta">
        <span>类型: ${property.type}</span>
        <span>更新: ${property.last_update}</span>
      </div>
    `;
    
    propertyList.appendChild(propertyItem);
  });
}

// 更新统计信息
function updateSummary(stats) {
  document.getElementById('today-count').textContent = stats.todayCount || stats.total * 40;
  document.getElementById('avg-focus').textContent = stats.avgFocus ? stats.avgFocus + '%' : '--';
  document.getElementById('device-count').textContent = stats.total;
}

// 更新图表
function updateChart(historyData) {
  if (!window.focusChart) {
    // 初始化图表
    const ctx = document.getElementById('focus-chart').getContext('2d');
    const labels = historyData.map(item => item.time);
    const data = historyData.map(item => item.value);
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(24, 144, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(24, 144, 255, 0.1)');
    
    window.focusChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '专注度 (%)',
          data: data,
          backgroundColor: gradient,
          borderColor: '#1890ff',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#1890ff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                return `专注度: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            title: {
              display: true,
              text: '时间'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            title: {
              display: true,
              text: '专注度 (%)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  } else {
    // 更新图表数据
    const labels = historyData.map(item => item.time);
    const data = historyData.map(item => item.value);
    
    window.focusChart.data.labels = labels;
    window.focusChart.data.datasets[0].data = data;
    window.focusChart.update();
  }
}

// 更新最后更新时间
function updateLastUpdateTime() {
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  document.getElementById('last-update-time').textContent = timeString;
}

// 更新页脚状态
function updateFooterStatus() {
  const onlineCount = appState.stats.online || 0;
  const totalCount = appState.stats.total || 0;
  
  // 更新系统状态
  const statusElement = document.querySelector('.status-online');
  if (statusElement) {
    if (onlineCount === totalCount && totalCount > 0) {
      statusElement.textContent = '运行正常';
      statusElement.style.color = '#52c41a';
    } else if (onlineCount > 0) {
      statusElement.textContent = '部分在线';
      statusElement.style.color = '#faad14';
    } else {
      statusElement.textContent = '无在线设备';
      statusElement.style.color = '#ff4d4f';
    }
  }
}

// 显示设备详情
function showDeviceDetails(device) {
  // 填充详情数据
  document.getElementById('detail-device-id').textContent = device.device_id;
  document.getElementById('detail-device-name').textContent = device.device_name;
  document.getElementById('detail-device-status').textContent = device.status;
  document.getElementById('detail-last-active').textContent = device.last_active;
  document.getElementById('detail-focus-current').textContent = device.focus_percentage ? `${device.focus_percentage}%` : '--';
  document.getElementById('detail-focus-avg').textContent = appState.stats.avgFocus ? appState.stats.avgFocus + '%' : '--';
  document.getElementById('detail-focus-max').textContent = '--'; // 需要历史数据计算
  document.getElementById('detail-focus-min').textContent = '--'; // 需要历史数据计算
  document.getElementById('detail-temp').textContent = device.temperature ? device.temperature + '℃' : '--';
  document.getElementById('detail-humidity').textContent = device.humidity ? device.humidity + '%' : '--';
  document.getElementById('detail-light').textContent = device.light ? device.light + ' lux' : '--';
  document.getElementById('detail-noise').textContent = device.noise ? device.noise + ' dB' : '--';
  
  // 显示原始数据
  document.getElementById('detail-raw-data').textContent = JSON.stringify(device, null, 2);
  
  // 显示模态框
  document.getElementById('data-detail-modal').style.display = 'flex';
}

// 模拟数据更新（备用）
function simulateMockUpdate() {
  if (appState.devices.length === 0) return;
  
  // 随机更新一个设备的专注度数据
  const deviceIndex = Math.floor(Math.random() * appState.devices.length);
  const device = appState.devices[deviceIndex];
  
  if (device.focus_percentage !== null) {
    // 生成一个接近原值但稍有波动的专注度
    const change = Math.floor(Math.random() * 10) - 5; // -5 到 +5 的变化
    const newFocus = Math.min(100, Math.max(0, device.focus_percentage + change));
    device.focus_percentage = newFocus;
    
    // 更新时间戳
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    device.timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${timeString}`;
    
    // 更新历史数据
    if (appState.focusHistory.length > 0) {
      appState.focusHistory.push({ time: timeString, value: newFocus });
      if (appState.focusHistory.length > 20) {
        appState.focusHistory.shift();
      }
    }
    
    // 更新UI
    updateDataTable(appState.devices);
    updateChart(appState.focusHistory);
  }
}

// 显示加载状态
function showLoading() {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>正在从华为云IoT平台加载数据...</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(loadingIndicator);
}

// 隐藏加载状态
function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 分类筛选
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', function() {
      // 移除所有active类
      document.querySelectorAll('.category-item').forEach(el => {
        el.classList.remove('active');
      });
      
      // 添加active类到当前项
      this.classList.add('active');
      
      // 根据分类筛选数据
      const category = this.getAttribute('data-category');
      filterByCategory(category);
    });
  });
  
  // 搜索功能
  document.getElementById('service-search').addEventListener('input', filterData);
  document.getElementById('property-search').addEventListener('input', filterData);
  
  // 刷新按钮
  document.getElementById('refresh-btn').addEventListener('click', async function() {
    // 显示刷新动画
    const originalHTML = this.innerHTML;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
    this.disabled = true;
    
    try {
      await refreshData();
      showToast('数据刷新成功！', 'success');
    } catch (error) {
      showToast('刷新失败，请检查网络连接', 'error');
    } finally {
      // 恢复按钮状态
      setTimeout(() => {
        this.innerHTML = originalHTML;
        this.disabled = false;
      }, 1000);
    }
  });
  
  // 导出按钮
  document.getElementById('export-btn').addEventListener('click', function() {
    // 创建导出数据
    const exportData = {
      timestamp: new Date().toISOString(),
      devices: appState.devices,
      properties: appState.properties,
      focusHistory: appState.focusHistory,
      stats: appState.stats,
      source: CONFIG.USE_MOCK_DATA ? '模拟数据' : '华为云IoT平台'
    };
    
    // 创建下载链接
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    // 创建临时链接并触发下载
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.href = url;
    link.download = `专注度数据_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示导出成功提示
    showToast('数据导出成功！', 'success');
  });
  
  // 时间范围选择
  document.getElementById('time-range').addEventListener('change', function() {
    // 在实际应用中，这里应该根据选择的时间范围重新获取数据
    showToast(`已切换到${this.options[this.selectedIndex].text}数据`, 'info');
  });
  
  // 模态框关闭按钮
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  
  // 点击模态框外部关闭
  document.getElementById('data-detail-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });
}

// 根据分类筛选数据
function filterByCategory(category) {
  let filteredDevices;
  
  if (category === 'all') {
    filteredDevices = appState.devices;
  } else if (category === 'focus_report') {
    filteredDevices = appState.devices.filter(device => device.focus_percentage !== null);
  } else if (category === 'environment') {
    filteredDevices = appState.devices.filter(device => 
      device.temperature !== null || device.humidity !== null || 
      device.light !== null || device.noise !== null
    );
  } else if (category === 'device_info') {
    filteredDevices = appState.devices;
  } else {
    filteredDevices = appState.devices;
  }
  
  updateDataTable(filteredDevices);
  
  // 更新图表标题
  let chartTitle = '专注度变化趋势';
  if (category === 'environment') {
    chartTitle = '环境数据变化趋势';
  }
  
  document.querySelector('.chart-header h3').innerHTML = `<i class="fas fa-chart-area"></i> ${chartTitle}`;
}

// 根据搜索条件筛选数据
function filterData() {
  const serviceSearch = document.getElementById('service-search').value.toLowerCase();
  const propertySearch = document.getElementById('property-search').value.toLowerCase();
  
  let filteredDevices = appState.devices;
  
  // 按服务名称筛选
  if (serviceSearch) {
    filteredDevices = filteredDevices.filter(device => 
      (device.device_name && device.device_name.toLowerCase().includes(serviceSearch)) || 
      device.device_id.toLowerCase().includes(serviceSearch)
    );
  }
  
  // 按属性筛选
  if (propertySearch) {
    filteredDevices = filteredDevices.filter(device => 
      device.device_id.toLowerCase().includes(propertySearch) || 
      (device.focus_percentage && device.focus_percentage.toString().includes(propertySearch)) ||
      (device.temperature && device.temperature.toString().includes(propertySearch)) ||
      (device.humidity && device.humidity.toString().includes(propertySearch))
    );
  }
  
  updateDataTable(filteredDevices);
}

// 关闭模态框
function closeModal() {
  document.getElementById('data-detail-modal').style.display = 'none';
}

// 显示提示消息
function showToast(message, type = 'info') {
  // 移除现有的toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建toast元素
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 显示toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后移除toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}