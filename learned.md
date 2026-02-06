# 开发教训记录

本文档记录开发过程中的教训和经验。

---

## 通用规则

- 每个子任务完成后更新 tasks.md 进度
- 遵循设计文档，不随意扩展功能
- Code review 和测试后才能标记任务完成

---

## 记录

### 2026-02-06 初始开发

1. **测试用例边界值**: DicePool 计算测试时，Sum 模式的值可能超过 MAX_DICE_POOL 导致测试失败，需要在测试用例中使用不超过上限的数值

2. **PowerShell 语法差异**: Windows 下 mkdir 不支持 -p 参数和多路径，需要使用 New-Item -ItemType Directory -Force

3. **路径别名配置**: Vitest 和 Vite 需要在各自配置文件中设置相同的 path alias

4. **Zustand 状态管理**: Store 中的 refreshState 方法用于同步 Core 层和 UI 层状态，避免直接暴露 Core 对象

5. **类型导出**: index.ts 导出文件需要同时导出类型和实现，便于其他模块统一引用

6. **游戏数据初始化**: GameManager 需要在初始化时加载配置数据（场景、卡牌等）并注册到对应管理器，仅创建管理器实例不会自动加载数据
