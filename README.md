# bolt.SE

bolt.SE，旨在将大语言模型（LLM）的代码生成能力与现代软件工程最佳实践深度融合。该系统基于开源项目bolt.diy 构建，通过四个核心模块增强了LLM辅助开发的工程化程度：首先，API 优先开发模块基于OpenAPI规范实现API定义与管理，使LLM能够理解并生成符合接口规范的代码；其次，测试驱动开发（TDD）模块将“测试先行”理念与代码生成相结合，通过结构化测试约束引导LLM生成高质量代码；再次，模型上下文协议（MCP）模块提供标准化接口使LLM能够安全调用外部工具和数据源，突破知识局限；最后，持续集成与部署模块则结合了TDD模块与MCP模块，实现了从测试定义到自动部署的全链路自动化。

```mermaid

sequenceDiagram
    %% 使用不同颜色区分bolt.diy和bolt.SE的组件
    %% bolt.diy组件使用默认颜色，bolt.SE组件使用蓝色
    
    %% 定义参与者和分组
    box 原始bolt.diy组件
    participant UI as 用户界面
    participant LLM as 大语言模型
    participant MP as MessageParser
    participant FS as FileStore
    participant AR as ActionRunner
    participant WC as WebContainer
    end
    
    box 新增bolt.SE组件
    participant TDD as TDD模块
    participant API as API Actions模块
    participant MCP as MCP模块
    end
    
    %% 标注整体流程区域
    rect rgb(240, 240, 240)
    note right of UI: bolt.diy基础流程
    
    %% bolt.diy的标准流程
    UI->>+LLM: 1. 发送软件需求
    LLM->>+MP: 2. 生成XML结构化响应
    MP-->>-LLM: 解析完成
    LLM-->>-UI: 3. 返回自然语言回复
    
    MP->>+FS: 4. 生成代码文件
    FS-->>-MP: 文件创建完成
    
    MP->>+AR: 5. 生成执行脚本
    AR->>+WC: 6. 获取执行文件
    WC-->>-AR: 返回文件内容
    
    AR->>+WC: 7. 执行命令
    WC-->>-AR: 返回执行结果
    AR-->>UI: 8. 返回执行结果
    end
    
    %% bolt.SE扩展功能 - 测试驱动开发
    rect rgb(233, 244, 255)
    note right of UI: bolt.SE: 测试驱动开发流程
    
    UI->>+TDD: 9. 创建测试用例
    TDD-->>-UI: 返回测试树结构
    
    TDD->>LLM: 10. 注入测试约束上下文
    
    AR->>+TDD: 11. 执行测试用例
    TDD->>WC: 运行测试
    WC-->>TDD: 返回测试结果
    
    alt 测试失败
        TDD->>LLM: 12. 发送失败信息
        LLM->>FS: 13. 生成修复代码
        FS->>AR: 14. 执行修复
        AR->>TDD: 15. 重新测试
    end
    
    TDD-->>-UI: 16. 展示测试结果
    end
    
    %% bolt.SE扩展功能 - API优先开发
    rect rgb(233, 244, 255)
    note right of UI: bolt.SE: API优先开发流程
    
    UI->>+API: 17. 选择/定义API
    API-->>-UI: 返回API上下文标签
    
    API->>LLM: 18. 注入API描述上下文
    LLM->>FS: 19. 生成符合API的代码
    end
    
    %% bolt.SE扩展功能 - MCP集成
    rect rgb(233, 244, 255)
    note right of UI: bolt.SE: MCP外部工具集成
    
    UI->>+MCP: 20. 请求外部工具调用
    
    MCP->>MCP: 21. 格式化工具调用请求
    MCP->>LLM: 22. 提供工具调用结果
    
    alt 调用外部API
        MCP->>API: 23. 调用外部服务
        API-->>MCP: 返回API响应
    end
    
    MCP-->>-UI: 24. 返回调用结果
    end

```

## 运行项目

1. **安装包管理器（pnpm）**：

   ```bash
   npm install -g pnpm
   ```

2. **安装项目依赖**：

   ```bash
   pnpm install
   ```

3. **启动开发服务器**：

   ```bash
   pnpm run dev
   ```


## 配置 API 密钥与模型服务商

### 添加你的 LLM API 密钥

1. 打开首页（主界面）
2. 在下拉菜单中选择你想使用的服务商
3. 点击铅笔图标（编辑）
4. 在安全输入框中输入你的 API 密钥

![API 密钥配置界面](./docs/images/api-key-ui-section.png)


## 可用脚本命令

* **`pnpm run dev`**：启动开发服务器
* **`pnpm run build`**：构建项目
* **`pnpm run start`**：使用 Wrangler Pages 本地运行构建后的项目
* **`pnpm run preview`**：构建并在本地运行生产版本
* **`pnpm test`**：使用 Vitest 运行测试套件
* **`pnpm run typecheck`**：运行 TypeScript 类型检查
* **`pnpm run typegen`**：使用 Wrangler 生成 TypeScript 类型
* **`pnpm run deploy`**：将项目部署到 Cloudflare Pages
* **`pnpm run lint:fix`**：自动修复代码格式问题

## TODO


- [ ] 接入3L Teacher,包括
  - 将3Lteacher生成的软件需求文档传入 bolt.SE 
  - 接入数据库（当前使用用户的浏览器indexDB本地数据库）
  - 部署（当前pnpm deploy部署到Cloudflare服务）
- [ ] **高优先级！** 加入 Api Actions会曝露API key到聊天记录中（见`interface ApiKeyAuth`）
- [ ] merge origin/import-sample-chat 分支，实现导入范例
- [ ] REAME.md 文档添加界面操作说明（如何添加MCP、如何天界API schemma等）
- [ ] 改善中文翻译
 

## 许可证

本项目基于 [bolt.diy](https://github.com/stackblitz/bolt.diy) 开源项目进行开发，原始项目由 StackBlitz 团队及社区贡献者维护。

本项目遵循 [MIT 许可证](./LICENSE)，您可以自由使用、修改和分发本软件，但需保留原始版权声明。
