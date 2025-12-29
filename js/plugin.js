// 代码结构：
// - 全局变量
// - 工具函数（日志记录、UI控制）
// - Eagle API封装函数
// - 核心功能函数
// - 插件事件监听
// - DOM事件处理

// 全局变量
let pluginInstance = null;
let isSyncing = false;
let config = {
    rawFormats: ['cr2', 'cr3', 'cr', 'arw', 'dng', 'nef', 'nrw', 'orf', 'raf', 'rw2', 'rwl', 'sr2', 'srw']
};

// 日志记录函数
function log(message, type = 'info') {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    
    const logDiv = document.createElement('div');
    logDiv.className = `log ${type}`;
    logDiv.setAttribute('data-time', new Date().toLocaleTimeString());
    logDiv.textContent = message;
    
    statusDiv.appendChild(logDiv);
    statusDiv.scrollTop = statusDiv.scrollHeight;
    
    // 控制台同时记录
    console.log(`${type.toUpperCase()}: ${message}`);
}

// UI控制函数 - 更新同步按钮状态
function setSyncButtonState(enabled) {
    const btn = document.getElementById('syncJpgToRawBtn');
    const text = document.getElementById('syncJpgToRawText');
    const loading = document.getElementById('syncJpgToRawLoading');
    
    if (btn && text && loading) {
        btn.disabled = !enabled;
        
        if (enabled) {
            text.textContent = '同步JPG到RAW标签';
            loading.style.display = 'none';
        } else {
            text.textContent = '同步中...';
            loading.style.display = 'inline-block';
        }
    }
}

// 清空日志
function clearLog() {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.innerHTML = '';
        log('日志已清空', 'info');
    }
}

// 更新进度显示
function updateProgress(processed, success, failed, total, currentFileName = '') {
    // 更新统计信息
    document.getElementById('processedCount').textContent = processed;
    document.getElementById('successCount').textContent = success;
    document.getElementById('failedCount').textContent = failed;
    document.getElementById('totalCount').textContent = total;
    
    // 更新进度条
    const progressBar = document.getElementById('progressBar');
    if (progressBar && total > 0) {
        const percentage = Math.min(Math.round((processed / total) * 100), 100);
        progressBar.style.width = percentage + '%';
    }
    
    // 更新当前处理的文件名
    const currentFileDiv = document.getElementById('currentFile');
    if (currentFileDiv) {
        currentFileDiv.textContent = currentFileName ? `当前处理: ${currentFileName}` : '';
    }
}

// 重置进度显示
function resetProgress() {
    updateProgress(0, 0, 0, 0, '');
}

// 配置管理函数 - 更新配置UI（仅RAW格式）
function updateConfigUI() {
    try {
        // 更新RAW格式
        document.querySelectorAll('input[name="rawFormats"]').forEach(checkbox => {
            checkbox.checked = config.rawFormats.includes(checkbox.value);
        });
    } catch (error) {
        console.error('更新配置UI错误:', error);
        log(`更新配置UI失败: ${error.message}`, 'error');
    }}


// Eagle API封装 - 获取所有JPG文件（优先处理选中的文件）
async function getJpgFiles() {
    try {
        if (typeof eagle === 'undefined' || typeof eagle.item === 'undefined') {
            log('Eagle API 未就绪', 'error');
            return [];
        }
        
        log('开始获取JPG文件...', 'info');
        log('eagle对象是否存在: ' + (typeof eagle !== 'undefined'), 'info');
        log('eagle.item.getSelected是否存在: ' + (typeof eagle.item.getSelected === 'function'), 'info');
        
        let selectedJpgFiles = [];
        
        // 先尝试获取用户选中的文件
        if (typeof eagle.item.getSelected === 'function') {
            try {
                const selectedFiles = await eagle.item.getSelected();
                log(`获取到选中文件 ${selectedFiles.length} 个`, 'info');
                
                // 过滤出JPG文件
                selectedJpgFiles = selectedFiles.filter(item => 
                    item && item.name && item.name.match(/\.(jpg|jpeg)$/i)
                );
                
                log(`找到 ${selectedJpgFiles.length} 个选中的JPG文件`, 'info');
                if (selectedJpgFiles.length > 0) {
                    // 记录选中文件详情
                    selectedJpgFiles.forEach(file => {
                        log(`选中的JPG文件: ${file.name}`, 'info');
                    });
                    return selectedJpgFiles;
                }
            } catch (error) {
                console.error('获取选中文件失败:', error);
                log('获取选中文件时出错: ' + error.message, 'warning');
                // 继续尝试获取所有文件
            }
        }
        
        // 如果没有选中JPG文件或获取选中文件失败，尝试获取所有文件
        let allFiles = [];
        if (typeof eagle.item.getAll === 'function') {
            try {
                allFiles = await eagle.item.getAll();
                log(`获取到所有文件 ${allFiles.length} 个`, 'info');
                
                // 过滤出所有JPG文件
                const allJpgFiles = allFiles.filter(item => 
                    item && item.name && item.name.match(/\.(jpg|jpeg)$/i)
                );
                
                log(`找到 ${allJpgFiles.length} 个JPG文件`);
                return allJpgFiles;
            } catch (error) {
                console.error('获取所有文件失败:', error);
                log('获取所有文件时出错: ' + error.message, 'error');
                return [];
            }
        } else {
            log('eagle.item.getAll不存在或不是函数', 'error');
            return [];
        }
    } catch (error) {
        console.error('getJpgFiles 错误:', error);
        log(`获取JPG文件失败: ${error.message}`, 'error');
        return [];
    }
}

// Eagle API封装 - 获取文件标签
async function getFileTags(fileId) {
    try {
        if (typeof eagle === 'undefined' || typeof eagle.item === 'undefined') {
            log('Eagle API 未就绪', 'error');
            return [];
        }
        
        if (!fileId) {
            log('文件ID不能为空', 'error');
            return [];
        }
        
        const tags = await eagle.item.getTags(fileId);
        return Array.isArray(tags) ? tags : [];
    } catch (error) {
        console.error('getFileTags 错误:', error);
        log(`获取文件标签失败: ${error.message}`, 'error');
        return [];
    }
}

// Eagle API封装 - 设置文件标签
async function setFileTags(fileId, tags) {
    try {
        if (typeof eagle === 'undefined' || typeof eagle.item === 'undefined') {
            log('Eagle API 未就绪', 'error');
            return false;
        }
        
        if (!fileId) {
            log('文件ID不能为空', 'error');
            return false;
        }
        
        if (!Array.isArray(tags)) {
            log('标签格式不正确', 'error');
            return false;
        }
        
        await eagle.item.setTags(fileId, tags);
        return true;
    } catch (error) {
        console.error('setFileTags 错误:', error);
        log(`设置文件标签失败: ${error.message}`, 'error');
        return false;
    }
}

// 工具函数 - 获取灵活的文件名匹配模式
function getFlexibleFileNamePatterns(fileName, fileExtRegex) {
    // 移除扩展名
    const baseName = fileName.replace(new RegExp(`\\.${fileExtRegex}$`, 'i'), '');
    
    const patterns = [
        baseName, // 精确匹配
        baseName.replace(/_edited$/i, ''), // 移除_edited后缀
        baseName.replace(/_processed$/i, ''), // 移除_processed后缀
        baseName.replace(/\s*\(.*?\)\s*$/i, ''), // 移除括号内容
        baseName.replace(/\s*\[.*?\]\s*$/i, '') // 移除方括号内容
    ];
    
    // 去重并过滤空字符串
    return [...new Set(patterns)].filter(Boolean);
}

// Eagle API封装 - 查找对应的RAW文件（增强版）
async function findRawFiles(jpgFileName) {
    try {
        if (typeof eagle === 'undefined' || typeof eagle.item === 'undefined') {
            log('Eagle API 未就绪', 'error');
            return [];
        }
        
        if (!jpgFileName) {
            log('文件名不能为空', 'error');
            return [];
        }
        
        log(`开始查找 ${jpgFileName} 对应的RAW文件...`, 'info');
        
        // 获取所有匹配模式
        const patterns = getFlexibleFileNamePatterns(jpgFileName, 'jpg|jpeg');
        log(`查找模式: ${JSON.stringify(patterns)}`, 'info');
        
        // 先获取所有文件
        let allFiles = [];
        if (typeof eagle.item.getAll === 'function') {
            try {
                allFiles = await eagle.item.getAll();
                log(`获取到所有文件 ${allFiles.length} 个`, 'info');
            } catch (error) {
                console.error('获取所有文件失败:', error);
                log('获取所有文件时出错: ' + error.message, 'error');
                return [];
            }
        } else {
            log('eagle.item.getAll不存在或不是函数', 'error');
            return [];
        }
        
        // 筛选出所有RAW文件
        const allRawFiles = allFiles.filter(item => {
            if (!item || !item.name) {
                return false;
            }
            const ext = item.name.split('.').pop().toLowerCase();
            return config.rawFormats.includes(ext);
        });
        
        log(`筛选出所有RAW文件 ${allRawFiles.length} 个`, 'info');
        
        // 所有找到的匹配RAW文件
        const matchedRawFiles = [];
        const foundNames = new Set();
        
        // 尝试每种匹配模式
        for (const pattern of patterns) {
            // 在所有RAW文件中查找匹配的文件
            const matchingFiles = allRawFiles.filter(file => {
                if (!file || !file.name) return false;
                
                // 获取文件名（不包含扩展名）
                const rawBaseName = file.name.replace(new RegExp(`\.(${config.rawFormats.join('|')})$`, 'i'), '');
                
                // 检查是否匹配当前模式
                return rawBaseName === pattern;
            });
            
            if (matchingFiles.length > 0) {
                // 过滤掉已经找到的文件（避免重复）
                const uniqueFiles = matchingFiles.filter(file => {
                    if (file && file.name && !foundNames.has(file.name)) {
                        foundNames.add(file.name);
                        return true;
                    }
                    return false;
                });
                
                matchedRawFiles.push(...uniqueFiles);
                
                // 如果找到文件，记录日志并停止查找
                uniqueFiles.forEach(file => {
                    log(`找到匹配的RAW文件: ${file.name}`, 'info');
                });
                break;
            }
        }
        
        log(`找到 ${matchedRawFiles.length} 个匹配的RAW文件`, 'info');
        return matchedRawFiles;
    } catch (error) {
        console.error('findRawFiles 错误:', error);
        log(`查找RAW文件失败: ${error.message}`, 'error');
        return [];
    }
}





// 核心功能 - 同步JPG到RAW标签
async function syncJpgToRawTags() {
    // 防止重复调用
    if (isSyncing) {
        log('同步操作正在进行中，请稍候...', 'info');
        return;
    }
    
    isSyncing = true;
    setSyncButtonState(false);
    
    try {
        log('开始同步JPG到RAW标签...', 'info');
        
        // 检查Eagle环境
        if (typeof eagle === 'undefined') {
            log('Eagle环境未检测到，请在Eagle软件中运行此插件', 'error');
            return;
        }
        
        if (typeof eagle.item === 'undefined') {
            log('Eagle文件API未就绪', 'error');
            return;
        }
        
        // 获取所有JPG文件
        const jpgFiles = await getJpgFiles();
        if (jpgFiles.length === 0) {
            log('未找到任何JPG文件', 'info');
            return;
        }
        
        let successCount = 0;
        let failedCount = 0;
        let totalCount = 0;
        let processedCount = 0;
        
        // 重置进度条
        resetProgress();
        
        // 遍历处理每个JPG文件
        for (const jpgFile of jpgFiles) {
            try {
                if (!jpgFile || !jpgFile.id || !jpgFile.name) {
                    log('无效的JPG文件对象', 'error');
                    failedCount++;
                    processedCount++;
                    updateProgress(processedCount, successCount, failedCount, totalCount);
                    continue;
                }
                
                // 更新当前处理文件
                updateProgress(processedCount, successCount, failedCount, totalCount, jpgFile.name);
                
                // 获取JPG文件的标签
                const tags = await getFileTags(jpgFile.id);
                if (tags.length === 0) {
                    processedCount++;
                    updateProgress(processedCount, successCount, failedCount, totalCount);
                    continue; // 跳过无标签的文件
                }
                
                // 查找对应的RAW文件
                const rawFiles = await findRawFiles(jpgFile.name);
                if (rawFiles.length === 0) {
                    processedCount++;
                    updateProgress(processedCount, successCount, failedCount, totalCount);
                    continue; // 跳过无对应RAW文件的JPG
                }
                
                // 同步标签到RAW文件
                for (const rawFile of rawFiles) {
                    try {
                        if (!rawFile || !rawFile.id || !rawFile.name) {
                            log('无效的RAW文件对象', 'error');
                            failedCount++;
                            totalCount++;
                            processedCount++;
                            updateProgress(processedCount, successCount, failedCount, totalCount);
                            continue;
                        }
                        
                        totalCount++;
                        const success = await setFileTags(rawFile.id, tags);
                        
                        if (success) {
                            successCount++;
                            log(`成功同步: ${jpgFile.name} → ${rawFile.name}`, 'success');
                        } else {
                            failedCount++;
                            log(`同步失败: ${jpgFile.name} → ${rawFile.name}`, 'error');
                        }
                        processedCount++;
                        updateProgress(processedCount, successCount, failedCount, totalCount);
                    } catch (rawError) {
                        console.error('处理RAW文件错误:', rawError);
                        log(`处理RAW文件时出错: ${rawError.message}`, 'error');
                        failedCount++;
                        totalCount++;
                        processedCount++;
                        updateProgress(processedCount, successCount, failedCount, totalCount);
                    }
                }
            } catch (jpgError) {
                console.error('处理JPG文件错误:', jpgError);
                log(`处理JPG文件时出错: ${jpgError.message}`, 'error');
                failedCount++;
                processedCount++;
                updateProgress(processedCount, successCount, failedCount, totalCount);
            }
        }
        
        // 同步完成
        log(`同步完成: ${successCount} 成功 / ${failedCount} 失败 / ${totalCount} 总数`, 'success');
        updateProgress(processedCount, successCount, failedCount, totalCount);
        
    } catch (error) {
        console.error('同步操作主错误:', error);
        log(`同步过程中发生严重错误: ${error.message}`, 'error');
    } finally {
        // 恢复按钮状态
        isSyncing = false;
        setSyncButtonState(true);
    }
}

// 插件事件监听
function initPluginEvents() {
    try {
        if (typeof eagle === 'undefined') {
            log('Eagle环境未检测到', 'error');
            return;
        }
        
        // 插件创建事件
        eagle.onPluginCreate((plugin) => {
            try {
                pluginInstance = plugin;
                console.log('插件已创建:', plugin);
                log('插件已成功加载', 'success');
            } catch (error) {
                console.error('onPluginCreate 错误:', error);
                log(`插件初始化错误: ${error.message}`, 'error');
            }
        });

        // 插件显示事件
        eagle.onPluginShow(() => {
            try {
                console.log('插件已显示');
            } catch (error) {
                console.error('onPluginShow 错误:', error);
            }
        });

        // 插件隐藏事件
        eagle.onPluginHide(() => {
            try {
                console.log('插件已隐藏');
            } catch (error) {
                console.error('onPluginHide 错误:', error);
            }
        });

        // 插件退出前事件
        eagle.onPluginBeforeExit(() => {
            try {
                console.log('插件即将退出');
            } catch (error) {
                console.error('onPluginBeforeExit 错误:', error);
            }
        });
        
    } catch (error) {
        console.error('Eagle事件监听器注册错误:', error);
        log(`插件事件监听错误: ${error.message}`, 'error');
    }
}

// DOM事件处理
function initDomEvents() {
    try {
        // 清空按钮事件
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                clearLog();
            });
        }
        
        log('插件已准备就绪，配置已加载', 'info');
        
    } catch (error) {
        console.error('DOM事件绑定错误:', error);
        log(`界面初始化错误: ${error.message}`, 'error');
    }
}

// 初始化函数
function init() {
    // 初始化插件事件
    initPluginEvents();
    
    // 初始化DOM事件
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDomEvents);
    } else {
        initDomEvents();
    }
}

// 启动初始化
init();