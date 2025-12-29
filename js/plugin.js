// 插件初始化
eagle.onPluginCreate((plugin) => {
	console.log('eagle.onPluginCreate');
	console.log(plugin);
	
	// 更新插件信息显示
	if (document.querySelector('#message')) {
		document.querySelector('#message').innerHTML = `
		<ul>
			<li>id: ${plugin.manifest.id}</li>
			<li>version: ${plugin.manifest.version}</li>
			<li>name: ${plugin.manifest.name}</li>
			<li>logo: ${plugin.manifest.logo}</li>
			<li>path: ${plugin.path}</li>
		</ul>
		`;
	}
	
	// 绑定按钮点击事件
	bindButtonEvents();
});


// 绑定按钮事件
function bindButtonEvents() {
	// 查找开始处理按钮
	const startBtn = document.querySelector('#startBtn');
	const clearBtn = document.querySelector('#clearBtn');
	
	if (startBtn) {
		startBtn.addEventListener('click', async () => {
			await copyTagsFromJPGtoRAW();
		});
	}
	
	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			clearLog();
		});
	}
}

// 显示日志信息
function log(message, type = 'info') {
	const logContainer = document.querySelector('#logContainer');
	if (!logContainer) return;
	
	const logElement = document.createElement('div');
	logElement.className = `log ${type}`;
	logElement.textContent = message;
	logElement.setAttribute('data-time', new Date().toLocaleTimeString());
	
	logContainer.appendChild(logElement);
	
	// 滚动到底部
	logContainer.scrollTop = logContainer.scrollHeight;
	
	// 控制台日志
	console.log(`${type}: ${message}`);
}

// 清空日志
function clearLog() {
	const logContainer = document.querySelector('#logContainer');
	if (logContainer) {
		logContainer.innerHTML = '';
	}
}

// 复制JPG标签到RAW文件的主函数
async function copyTagsFromJPGtoRAW() {
    try {
        // 禁用开始按钮
        const startBtn = document.querySelector('#startBtn');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<span class="loading"></span>处理中...';
        }
        
        log('开始处理...', 'info');
        
        // 获取选中的文件
        let selected = await eagle.item.getSelected();
        log(`已获取 ${selected.length} 个选中文件`, 'info');
        
        // 筛选选中的文件中ext == jpg
        let selectedJpgs = selected.filter(item => item.ext === 'jpg');
        
        if (selectedJpgs.length === 0) {
            log('没有选中的JPG文件', 'info');
            return;
        }
        
        log(`筛选出 ${selectedJpgs.length} 个JPG文件`, 'info');
        
        // 获取所有文件，用于后续查找对应的RAW文件
        let allItems = await eagle.item.get();
        log(`已获取 ${allItems.length} 个所有文件`, 'info');
        
        // 定义RAW格式列表
        const rawExts = ['arw', 'cr2', 'cr3', 'dng', 'nef', 'nrw', 'orf', 'pef', 'raf', 'rw2', 'srw', 'raw'];
        
        // 存储处理结果
        let processedCount = 0;
        let foundCount = 0;
        let itemsToSave = []; // 存储需要保存的RAW项目
        
        // 遍历选中的JPG文件
        for (let jpgItem of selectedJpgs) {
            // 获取JPG文件名（不含扩展名）
            let jpgNameWithoutExt = jpgItem.name.replace(/\.jpg$/i, '');
            
            // 查找对应的RAW文件：name相同且ext符合RAW格式列表
            let rawItem = allItems.find(item => {
                // 获取文件名（不含扩展名）
                let itemNameWithoutExt = item.name.replace(/\.\w+$/, '');
                
                // 检查文件名是否相同且扩展名是否为RAW格式
                return itemNameWithoutExt === jpgNameWithoutExt && rawExts.includes(item.ext.toLowerCase());
            });
            
            foundCount++;
            log(`处理第 ${foundCount}/${selectedJpgs.length} 个文件: ${jpgItem.name}`, 'info');
            
            // 如果找到对应的RAW文件
            if (rawItem) {
                // 将JPG的标签复制到RAW文件
                rawItem.tags = [...jpgItem.tags];
                
                // 将JPG的注释复制到RAW文件
                rawItem.annotation = jpgItem.annotation;
                
                // 添加到需要保存的项目列表
                itemsToSave.push(rawItem);
                
                processedCount++;
                log(`✓ 已将标签和注释从 ${jpgItem.name} 复制到 ${rawItem.name}`, 'success');
            } else {
                log(`✗ 未找到与 ${jpgItem.name} 对应的RAW文件`, 'info');
            }
        }

        
        
        // 处理选中的RAW文件（标签为空时从JPG复制）
        log(`开始检查选中的RAW文件...`, 'info');
        let rawToProcessCount = 0;
        let rawProcessedCount = 0;
        
        // 筛选选中的RAW文件
        let selectedRaws = selected.filter(item => rawExts.includes(item.ext.toLowerCase()));
        
        if (selectedRaws.length > 0) {
            log(`发现 ${selectedRaws.length} 个选中的RAW文件`, 'info');
            
            for (let rawItem of selectedRaws) {
                rawToProcessCount++;
                log(`检查第 ${rawToProcessCount}/${selectedRaws.length} 个RAW文件: ${rawItem.name}`, 'info');
                
                // 只处理标签为空的RAW文件
                if (!rawItem.tags || rawItem.tags.length === 0) {
                    // 获取RAW文件名（不含扩展名）
                    let rawNameWithoutExt = rawItem.name.replace(/\.\w+$/, '');
                    
                    // 查找对应的JPG文件
                    let jpgItem = allItems.find(item => {
                        let itemNameWithoutExt = item.name.replace(/\.jpg$/i, '');
                        return itemNameWithoutExt === rawNameWithoutExt && item.ext.toLowerCase() === 'jpg';
                    });
                    
                    if (jpgItem) {
                        // 将JPG的标签复制到RAW文件
                        rawItem.tags = [...jpgItem.tags];
                        
                        // 将JPG的注释复制到RAW文件
                        rawItem.annotation = jpgItem.annotation;
                        
                        // 添加到需要保存的项目列表
                        itemsToSave.push(rawItem);
                        
                        rawProcessedCount++;
                        log(`✓ 已将标签和注释从 ${jpgItem.name} 复制到 ${rawItem.name} (RAW标签为空)`, 'success');
                    } else {
                        log(`✗ 未找到与 ${rawItem.name} 对应的JPG文件`, 'info');
                    }
                } else {
                    log(`✓ ${rawItem.name} 的标签不为空，跳过处理`, 'info');
                }
            }
            
            log(`RAW文件检查完成！共检查 ${selectedRaws.length} 个RAW文件，成功从JPG复制 ${rawProcessedCount} 个RAW文件的标签和注释`, 'success');
        } else {
            log(`没有发现选中的RAW文件，跳过RAW到JPG的标签复制`, 'info');
        }
        
        // 统一保存所有修改过的RAW项目
        if (itemsToSave.length > 0) {
            log(`开始保存 ${itemsToSave.length} 个文件的更改...`, 'info');
            for (let i = 0; i < itemsToSave.length; i++) {
                await itemsToSave[i].save();
                log(`已保存第 ${i + 1}/${itemsToSave.length} 个文件`, 'info');
            }
            log(`所有文件保存完成！`, 'success');
        }
        // 显示完成信息
        log(`处理完成！共处理 ${selectedJpgs.length} 个JPG文件，成功复制 ${processedCount} 个文件的标签和注释`, 'success');
        
    } catch (error) {
        log(`插件执行错误: ${error.message}`, 'error');
        console.error(error);
    } finally {
        // 恢复开始按钮
        const startBtn = document.querySelector('#startBtn');
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.innerHTML = '开始处理';
        }
    }
}
