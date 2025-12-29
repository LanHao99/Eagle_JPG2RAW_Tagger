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
                
                // 保存更改
                await rawItem.save();
                
                processedCount++;
                log(`✓ 已将标签和注释从 ${jpgItem.name} 复制到 ${rawItem.name}`, 'success');
            } else {
                log(`✗ 未找到与 ${jpgItem.name} 对应的RAW文件`, 'info');
            }
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
