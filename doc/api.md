# REST API 文档

Cloud189 Auto Save 提供标准的 REST API 接口，方便第三方程序（如脚本、其他工具）进行集成。

## 1. 认证要求

所有请求必须在 HTTP Header 中包含 `x-api-key`：

```http
x-api-key: YOUR_SYSTEM_API_KEY
```
*API Key 可在系统设置 -> 系统配置中查看或修改。*

---

## 2. 账号管理 (Accounts)

### 获取账号列表
- **GET** `/api/accounts`
- **说明**：获取所有配置的天翼云盘账号。

### 获取容量信息
- **GET** `/api/accounts/capacity/:id`
- **说明**：获取指定账号的可用空间。

---

## 3. 任务管理 (Tasks)

### 获取任务列表
- **GET** `/api/tasks`
- **参数**：
  - `status`: 过滤状态（`all`, `running`, `completed`, `error`）
  - `search`: 关键词搜索
- **说明**：获取所有转存任务。

### 创建任务
- **POST** `/api/tasks`
- **Payload**:
```json
{
    "accountId": 1,
    "shareLink": "https://cloud.189.cn/t/xxxx",
    "accessCode": "1234",
    "targetFolderId": "-11",
    "resourceName": "我的电影"
}
```

### 立即执行任务
- **POST** `/api/tasks/:id/execute`
- **说明**：强制立即开始转存该任务。

### 批量执行所有任务
- **POST** `/api/tasks/executeAll`

---

## 4. 文件管理 (File Manager)

### 列出目录内容
- **GET** `/api/file-manager/list`
- **参数**：`accountId`, `folderId` (默认 `-11`)

### 获取下载直链
- **GET** `/api/file-manager/download-link`
- **参数**：`accountId`, `fileId`
- **说明**：获取天翼云盘的文件直链。

### 重命名文件
- **POST** `/api/file-manager/rename`
- **Payload**: `{ "accountId": 1, "fileId": "xxx", "destFileName": "new_name.mkv" }`

---

## 5. 媒体服务器相关 (Emby/STRM)

### 生成 STRM 文件
- **POST** `/api/tasks/strm`
- **Payload**: `{ "taskIds": [1, 2, 3], "overwrite": true }`

### Emby 独立反代端口
- **默认地址**：`http://YOUR_IP:8097`
- **说明**：提供高性能流代理，建议在 Emby/Jellyfin 中作为外部播放地址。

---

## 6. 返回格式

所有接口均返回统一的 JSON 格式：

```json
{
    "success": true,
    "data": { ... },
    "error": "若失败则显示错误信息"
}
```
