# JPG-RAW 标签互通插件

这是一个专为 Eagle 设计的窗口插件，用于将 JPG 文件的标签自动同步到对应的 RAW 文件。

## 插件逻辑

### 核心功能流程

1. **初始化阶段**
   - 插件加载时初始化 Eagle API 事件监听
   - 检查 DOM 加载状态，准备用户界面
   - 显示插件准备就绪信息

2. **同步执行阶段**
   - 用户点击"同步JPG到RAW标签"按钮
   - 系统检查是否有正在进行的同步操作（防止重复调用）
   - 禁用同步按钮并显示加载状态
   - 获取 Eagle 中的所有 JPG 文件列表
   - 遍历每个 JPG 文件：
     - 获取 JPG 文件的所有标签
     - 查找同名的 RAW 文件（支持 .cr2/.cr3/.cr 格式）
     - 将 JPG 文件的标签同步到对应的 RAW 文件
     - 记录同步结果（成功/失败）

3. **完成阶段**
   - 恢复同步按钮状态
   - 显示同步统计信息（成功/总数）
   - 保持详细的日志记录供用户查看

### 技术实现

- **Eagle API 集成**：使用 `eagle.item.get()`、`eagle.item.getTags()` 和 `eagle.item.setTags()` 等 API
- **异步编程**：采用 `async/await` 处理异步操作，确保流程控制清晰
- **错误处理**：完善的异常捕获和日志记录机制
- **UI/UX 设计**：响应式界面、加载状态指示、分类日志显示
- **模块化设计**：功能分离为工具函数、API封装、核心功能和事件处理
- **性能优化**：跳过无标签文件和无对应RAW文件的JPG文件，提高同步效率

## 安装方法

1. 下载插件文件夹
2. 打开 Eagle 软件
3. 将插件文件夹拖放到 Eagle 软件窗口中
4. 在插件列表中找到并启动 "JPG-RAW标签互通插件"

## 使用说明

1. 确保 Eagle 中已导入 JPG 和对应的 RAW 文件
2. 打开插件窗口
3. 点击 "同步JPG到RAW标签" 按钮
4. 查看窗口底部的同步日志
5. 同步完成后，所有同名的 RAW 文件将获得与 JPG 文件相同的标签

## 功能特性

- ✅ 自动扫描 Eagle 中的所有 JPG 文件
- ✅ 支持多种 RAW 格式（.cr2/.cr3/.cr）
- ✅ 完整的同步日志记录
- ✅ 防止重复同步操作
- ✅ 响应式用户界面设计
- ✅ 详细的同步统计信息

## 注意事项

1. 请确保 JPG 和 RAW 文件具有相同的文件名（不包括扩展名）
2. 同步过程中请勿关闭插件窗口
3. 建议定期备份 Eagle 数据库

## 更新日志

### v1.0.0
- 初始版本发布
- 实现 JPG 到 RAW 标签同步功能
- 提供完整的用户界面和日志记录

## 开发说明

### Eagle API 自动注入机制

在 Eagle 插件开发中，Eagle 软件会自动将 `eagle` API 对象注入到插件的 JavaScript 运行环境中。这意味着：

- 插件无需用户手动输入任何 API 密钥或配置信息
- Eagle 软件在插件加载时自动提供完整的 API 对象
- 插件只需检查 `eagle` 对象是否存在即可安全使用所有 API 方法
- 这种机制确保了插件与 Eagle 之间的无缝集成

### API 使用说明

本插件使用 Eagle 官方推荐的 API 调用方式，主要涉及文件和标签操作：

#### 文件相关 API
- **获取文件**：`eagle.item.get()` - 万用搜索方法，可获取指定条件的文件
  - 参数：
    - `id` string (可选) - 文件ID
    - `ids` string[] (可选) - 文件ID数组
    - `isSelected` boolean (可选) - 正在被选中的文件
    - `isUntagged` boolean (可选) - 尚未标签
    - `isUnfiled` boolean (可选) - 尚未分类
    - `keywords` string[] (可选) - 包含关键字
    - `tags` string[] (可选) - 包含标签
    - `folders` string[] (可选) - 包含文件夹
    - `ext` string (可选) - 格式
    - `annotation` string (可选) - 注释
    - `rating` Interger (可选) - 评分，0 ~ 5
    - `url` string (可选) - 来源链接
    - `shape` string (可选) - 形状，square、portrait、panoramic-portrait、landscape、panoramic-landscape
    - `fields` string[] (可选) - 指定返回的字段，仅返回需要的数据以提升性能
  - 返回：`Promise<items: Item[]>` - items 查询结果
- **获取标签**：`eagle.item.getTags()` - 获取指定文件的标签
  - 参数：`fileId` - 文件ID
  - 返回：标签名称数组
- **设置标签**：`eagle.item.setTags()` - 为指定文件设置标签
  - 参数：`fileId` - 文件ID，`tags` - 标签名称数组
  - 返回：操作成功状态
- **保存修改**：`item.save()` - 保存对文件对象的修改
  - 参数：无
  - 返回：`Promise<result: boolean>` - 修改是否成功

#### 标签相关 API
- **获取所有标签**：`eagle.tag.get()` - 获取所有标签或按名称筛选标签
  - 参数：`{ name: "关键词" }` - 可选，按名称筛选
  - 返回：标签对象数组
- **获取最近使用标签**：`eagle.tag.getRecents()` - 获取最近使用的标签
  - 返回：标签对象数组
- **保存标签修改**：`tag.save()` - 保存标签的修改（仅支持修改名称）
  - 返回：修改成功状态

API 调用示例：
```javascript
// 获取所有 JPG 文件
const jpgFiles = await eagle.item.get({
    ext: 'jpg,jpeg'
});

// 获取文件标签
const tags = await eagle.item.getTags(fileId);

// 设置文件标签
await eagle.item.setTags(fileId, ['标签1', '标签2']);

// 获取所有标签
const allTags = await eagle.tag.get();

// 按名称筛选标签
const designTags = await eagle.tag.get({ name: "design" });

// 获取最近使用的标签
const recentTags = await eagle.tag.getRecents();
```

### 代码结构详解

本插件采用模块化设计，代码结构清晰：

```javascript
// 代码结构：
// - 全局变量
// - 工具函数（日志记录、UI控制）
// - Eagle API封装函数
// - 核心功能函数
// - 插件事件监听
// - DOM事件处理
```

#### 主要功能模块

1. **全局变量**
   - `pluginInstance` - 插件实例对象
   - `isSyncing` - 同步操作状态标志（防止重复调用）

2. **工具函数**
   - `log()` - 日志记录函数，支持分类显示（info/success/error）
   - `setSyncButtonState()` - 控制同步按钮的启用/禁用状态
   - `clearLog()` - 清空日志面板内容

3. **Eagle API封装**
   - `getJpgFiles()` - 获取所有JPG文件
   - `getFileTags()` - 获取文件的标签
   - `setFileTags()` - 设置文件的标签
   - `findRawFiles()` - 查找对应的RAW文件

4. **核心功能函数**
   - `syncJpgToRawTags()` - JPG到RAW标签同步的主函数

5. **事件处理**
   - `initPluginEvents()` - 初始化Eagle插件事件监听
   - `initDomEvents()` - 初始化DOM事件处理

### 兼容性说明

- **Eagle版本要求**：Eagle 4.0 build12 及以上版本
- **支持的RAW格式**：.cr2, .cr3, .cr
- **支持的JPG格式**：.jpg, .jpeg

### 性能优化

- **智能跳过**：自动跳过无标签的JPG文件和无对应RAW文件的JPG文件
- **错误隔离**：单个文件处理失败不会影响整个同步流程
- **资源管理**：合理使用异步操作，避免阻塞UI线程
- **日志优化**：分类日志显示，提高用户体验

### 主要文件结构

```
jpg-raw标签互通插件/
├── manifest.json    # 插件配置文件
├── index.html       # 插件界面
├── logo.png         # 插件图标
└── js/
    └── plugin.js    # 核心功能实现
```

### 开发环境要求

- Eagle 4.0 build12+ 
- 现代浏览器环境（支持 ES6+）

## 支持与反馈

如有问题或建议，请在插件仓库提交 issue 或联系开发者。

---

© 2025 JPG-RAW 标签互通插件 | 专为 Eagle 设计