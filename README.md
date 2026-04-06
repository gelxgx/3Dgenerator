# 3DGenerator — AI 3D 模型生成平台

基于 **Nuxt 4 + Vue 3 + Three.js** 生态的全栈 3D 模型生成与预览平台，涵盖 SSR、实时 3D 渲染、骨骼动画、模型分割、材质编辑、多格式导出、GSAP 动画、国际化及现代前端工程实践。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Nuxt 4（SSR + SPA 混合模式） |
| UI | Vue 3 Composition API + TypeScript |
| 3D 引擎 | Three.js + TresJS（Vue 3D 声明式渲染器） |
| 动画 | GSAP（ScrollTrigger）+ CSS Keyframe 动画 |
| 样式 | UnoCSS（原子化 CSS + Glassmorphism 设计系统） |
| 状态管理 | Pinia 3 |
| 国际化 | @nuxtjs/i18n v10（zh-CN / en） |
| API | Nuxt Server Routes + SSE（Server-Sent Events） |
| 代码质量 | ESLint（@antfu/eslint-config）+ Husky + Commitlint |
| 部署 | Vercel（Edge Functions） |

## 项目结构（Nuxt 4）

```
3dgenerator/
├── app/                                  # 应用源码（Nuxt 4 srcDir）
│   ├── pages/
│   │   ├── index.vue                     # 首页：Hero 粒子系统 + Gallery 网格
│   │   └── workspace/
│   │       ├── generate.vue              # AI 生成界面（提示词 + 参数面板）
│   │       ├── history.vue               # 生成历史列表
│   │       └── viewer/[id].vue           # 3D 工作区（查看/编辑/导出）
│   ├── components/
│   │   ├── gallery/
│   │   │   ├── ModelCard.vue             # 画廊卡片，clip-reveal 悬停效果
│   │   │   ├── ModelPreview3D.vue        # 快照渲染器 + 双层 clip 交互
│   │   │   └── CategoryFilter.vue        # 分类筛选栏
│   │   ├── home/
│   │   │   └── HeroScene.vue             # GPU 粒子系统（自定义 GLSL Shader）
│   │   ├── viewer/
│   │   │   ├── ModelViewer.vue           # 3D 查看器（TresCanvas + OrbitControls）
│   │   │   ├── ViewerToolbar.vue         # 工具栏（爆炸视图/线框/网格）
│   │   │   ├── MaterialSwitcher.vue      # 材质模式切换（PBR/Clay/Wire/Normal）
│   │   │   ├── MaterialEditor.vue        # 实时材质属性编辑器
│   │   │   ├── SceneTree.vue             # 场景节点树
│   │   │   ├── AnimationPanel.vue        # 骨骼动画控制面板
│   │   │   ├── SegmentPanel.vue          # 模型语义分割面板
│   │   │   └── ModelInfo.vue             # 模型元数据 + 多格式导出
│   │   ├── generate/
│   │   │   ├── PromptInput.vue           # AI 提示词输入
│   │   │   ├── ParamPanel.vue            # 生成参数面板
│   │   │   ├── ProgressBar.vue           # SSE 进度追踪器
│   │   │   └── PointCloud.vue            # 生成过程点云粒子可视化
│   │   └── layout/
│   │       ├── AppHeader.vue             # 顶部导航栏（含语言切换）
│   │       └── AppSidebar.vue            # 侧边导航
│   ├── composables/
│   │   ├── useGLTFLoader.ts              # GLB 模型加载（meshopt 支持）
│   │   ├── useMaterialSwitcher.ts        # 运行时材质切换
│   │   ├── useModelGenerate.ts           # AI 生成状态机
│   │   ├── useModelInteraction.ts        # 模型交互（点选 Mesh）
│   │   ├── useExplodeView.ts             # 爆炸视图（GSAP 驱动）
│   │   ├── useSkeletonViewer.ts          # 骨骼可视化
│   │   ├── useAnimationPlayer.ts         # 动画播放控制器
│   │   ├── useSegmentation.ts            # 模型语义分割
│   │   ├── useModelExport.ts             # 多格式导出（GLB/OBJ/STL）
│   │   └── useGsap.ts                    # GSAP 实例提供者
│   ├── stores/
│   │   └── model.ts                      # Pinia：模型任务管理 + localStorage 持久化
│   ├── plugins/
│   │   ├── gsap.client.ts                # GSAP + ScrollTrigger CDN 加载
│   │   └── pageTransition.client.ts      # 路由过渡编排
│   └── app.vue                           # 根组件
├── shared/                               # App 与 Server 共享代码
│   └── types/
│       └── model.ts                      # TypeScript 类型定义（自动导入）
├── i18n/
│   └── locales/
│       ├── zh-CN.json                    # 中文语言包
│       └── en.json                       # 英文语言包
├── server/
│   ├── api/
│   │   ├── models/index.get.ts           # 画廊 API（自动扫描 public/models/）
│   │   ├── models/[id].get.ts            # 单模型 API
│   │   ├── generate.post.ts              # AI 生成触发（SSE 推送）
│   │   ├── proxy-model.get.ts            # GLB 代理（CORS）
│   │   └── download.get.ts              # 模型下载
│   └── utils/
│       ├── api3d.ts                      # 3D API 客户端封装
│       └── promptEngine.ts               # 提示词增强引擎
├── public/models/                        # GLB 模型文件（自动扫描）
├── nuxt.config.ts
└── package.json
```

## 核心功能

### 3D 模型查看与交互
- **实时 3D 渲染** — TresJS 声明式渲染 + OrbitControls 相机控制
- **材质切换** — PBR / Matcap Silver / White Clay / Wireframe / Normal Map 五种模式
- **材质编辑器** — 实时调整 Color、Roughness、Metalness、Opacity
- **爆炸视图** — GSAP 驱动的模型拆解动画
- **场景树** — 递归展示模型节点层级，点选高亮
- **Mesh 交互** — Raycaster 拾取网格，显示顶点/面数信息

### 骨骼动画系统
- **SkeletonHelper 可视化** — 骨骼线框叠加显示
- **动画播放器** — 播放/暂停、进度拖拽、速度调节（0.25x ~ 2x）
- **多 Clip 切换** — 支持 GLTF 中多个 AnimationClip

### 模型分割
- **语义分割** — 按 Mesh 自动分割为独立 Segment
- **颜色编码** — 每个 Segment 分配唯一颜色
- **可见性控制** — 独立切换每个 Segment 的显示/隐藏

### 多格式导出
- **GLB** — 标准 glTF Binary 格式
- **OBJ** — Wavefront OBJ 格式
- **STL** — 3D 打印格式

### AI 3D 模型生成
- **SSE 实时进度推送** — Server-Sent Events 驱动生成状态
- **点云粒子可视化** — 自定义 GLSL Shader 的生成过程动效
- **提示词增强引擎** — 自动分析并优化用户提示词
- **多版本 API 支持** — Standard v2.0 ~ Advanced v3.1

### 首页与画廊
- **GPU 粒子 Hero** — 自定义 ShaderMaterial，鼠标排斥交互
- **快照渲染器** — 渲染即销毁，零持久 WebGL 上下文
- **Clip-Reveal 悬停** — CSS clip-path 双层材质对比
- **CSS Keyframe 入场动画** — SSR 安全，heroReady 门控避免水合闪烁
- **动态模型扫描** — API 自动读取 public/models/ 目录

## 架构亮点

### SSR + 仅客户端 3D 渲染
Nuxt 4 全局启用 SSR。所有 Three.js 组件包裹在 `<ClientOnly>` 中。核心挑战在于管理 SSR/客户端水合阶段的生命周期差异，以及确保动画不因 SSR → Hydration 时序而重复播放。

### 动画时序控制
首页动画使用 `heroReady` 门控模式：SSR 阶段元素以 `opacity-0` 渲染，客户端挂载后统一触发 CSS Keyframe 动画，彻底消除 SSR 水合导致的动画重播问题。

### Nuxt 4 目录结构
采用 Nuxt 4 标准 `app/` + `shared/` + `server/` 三层结构。`shared/types/` 自动导入，App 和 Server 共享类型定义。

### 性能优化
- 移除阴影贴图，环境光遮蔽由纹理烘焙提供
- DPR 限制 `Math.min(devicePixelRatio, 1.5)` 避免 Retina 4x 开销
- OrbitControls 阻尼（`dampingFactor: 0.08`）零额外渲染开销
- Vite optimizeDeps 预构建 Three.js 依赖
- 画廊快照渲染器：渲染后立即 `forceContextLoss()` 释放 GPU 资源

## 快速开始

```bash
# 安装依赖
pnpm install

# 环境变量
cp .env.example .env
# 编辑 .env 设置 API Key

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 部署

针对 Vercel 优化。在 Vercel 控制台中设置环境变量 `NUXT_API_KEY_3D` 和 `NUXT_API_BASE_3D`，然后通过 `git push` 部署即可。

## 许可证

MIT
