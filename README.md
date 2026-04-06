# 3DGenerator — AI 3D 模型生成平台

基于 **Nuxt 4 + Vue 3 + Three.js** 生态的全栈 3D 模型生成与预览平台，涵盖 SSR、实时 3D 渲染、GSAP 动画、性能优化及现代前端架构实践。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Nuxt 4（SSR + SPA 混合模式） |
| UI | Vue 3 Composition API + TypeScript |
| 3D 引擎 | Three.js + TresJS（Vue 3D 渲染器） |
| 动画 | GSAP（ScrollTrigger、页面过渡） |
| 样式 | UnoCSS（原子化 CSS） |
| 状态管理 | Pinia |
| 国际化 | @nuxtjs/i18n（zh-CN / en） |
| API | Nuxt Server Routes + SSE（Server-Sent Events） |
| 部署 | Vercel（Edge Functions） |

## 项目结构

```
tripo-lite/
├── pages/
│   ├── index.vue                      # 首页：Hero + Gallery 网格
│   └── workspace/
│       ├── generate.vue               # AI 生成界面（提示词 + 参数）
│       ├── history.vue                # 生成历史列表
│       └── viewer/[id].vue            # 单模型 3D 工作区
├── components/
│   ├── gallery/
│   │   ├── ModelCard.vue              # 画廊卡片，clip-reveal 悬停效果
│   │   ├── ModelPreview3D.vue         # 快照渲染器 + 双层 clip
│   │   └── CategoryFilter.vue         # 分类筛选栏
│   ├── home/
│   │   └── HeroScene.vue             # GPU 粒子系统（自定义 GLSL）
│   ├── viewer/
│   │   ├── ModelViewer.vue            # 完整 3D 查看器（TresCanvas + OrbitControls）
│   │   ├── MaterialSwitcher.vue       # 材质模式切换（PBR/Clay/Wire/Normal）
│   │   └── ModelInfo.vue              # 模型元数据面板
│   ├── generate/
│   │   ├── PromptInput.vue            # AI 提示词输入
│   │   ├── ParamPanel.vue             # 生成参数面板
│   │   ├── ProgressBar.vue            # SSE 进度追踪器
│   │   └── PointCloud.vue             # 点云可视化
│   └── layout/
│       ├── AppHeader.vue              # 顶部导航栏
│       └── AppSidebar.vue             # 侧边导航
├── composables/
│   ├── useGLTFLoader.ts               # GLB 模型加载（meshopt 支持）
│   ├── useMaterialSwitcher.ts         # 运行时材质切换
│   ├── useModelGenerate.ts            # AI 生成状态机
│   ├── useSSE.ts                      # Server-Sent Events 客户端
│   ├── useGsap.ts                     # GSAP 实例提供者
│   └── useAnimatedNumber.ts           # 平滑数字插值
├── stores/
│   └── model.ts                       # Pinia：模型任务管理
├── server/
│   └── api/
│       ├── models/index.get.ts        # 画廊模型列表 API
│       ├── models/[id].get.ts         # 单模型 API
│       ├── generate.post.ts           # AI 生成触发
│       ├── proxy-model.get.ts         # GLB 代理（CORS 绕过）
│       └── download.get.ts            # 模型下载处理
├── plugins/
│   ├── gsap.client.ts                 # GSAP + ScrollTrigger 注册
│   └── pageTransition.client.ts       # 路由过渡编排
├── locales/
│   ├── zh-CN.json                     # 中文语言包
│   └── en.json                        # 英文语言包
└── types/
    └── model.ts                       # TypeScript 类型定义
```

## 架构与核心技术要点

### 1. SSR + 仅客户端 3D 渲染

Nuxt 4 全局启用 SSR 以获得 SEO 和快速首屏渲染。所有 Three.js 组件都包裹在 `<ClientOnly>` 中，因为 WebGL API 仅在浏览器端可用。核心难点在于管理 `onMounted`、`onUnmounted` 等生命周期钩子在 SSR 与客户端水合阶段的行为差异。

```vue
<!-- pages/workspace/viewer/[id].vue -->
<ClientOnly>
  <TresCanvas clear-color="#0A0A0F">
    <TresPerspectiveCamera :position="[0, 2, 5]" :fov="50" />
    <OrbitControls :enable-damping="true" :damping-factor="0.08" />
    <primitive v-if="modelScene" :object="modelScene" />
  </TresCanvas>
</ClientOnly>
```

SSR 安全的清理方式使用 `onScopeDispose` 并配合 `import.meta.client` 守卫，而非直接使用 `onUnmounted`——后者在 SSR 期间非组件上下文中会抛出异常。

### 2. 画廊：快照渲染器 + Clip-Reveal 交互

首页画廊采用**渲染一次即销毁**模式，而非为每张卡片维持持久的 WebGL 上下文：

```
GLB 加载 → Three.js 渲染（PBR）→ toDataURL → 切换为 Clay 材质 →
再次渲染 → toDataURL → 销毁渲染器 → forceContextLoss()
```

悬停时，两个静态图像层通过 CSS `clip-path` 分割，由一个跟踪鼠标 X 位置的 CSS 变量驱动。整条交互链路为：**JS `setProperty('--cp')` → CSS `var(--cp)` 作用于 clip-path → GPU 合成** —— 零 Vue 响应式开销。

```css
.clip-reveal.is-hovering .clip-layer--gray {
  clip-path: polygon(0 0, var(--cp) 0, var(--cp) 100%, 0 100%);
}
.clip-reveal.is-hovering .clip-layer--tex {
  clip-path: polygon(var(--cp) 0, 100% 0, 100% 100%, var(--cp) 100%);
}
```

此方案消除了旧版自动旋转方案中 13 个并发 WebGL 渲染循环。

### 3. Three.js 查看器性能优化

3D 模型查看器页面应用了多项从生产级 3D Web 应用中总结的优化策略：

**移除阴影贴图** — `renderer.shadowMap.enabled = false` 消除了逐光源深度 Pass（会重新渲染整个场景）。对于模型预览场景，烘焙到纹理中的环境光遮蔽已足够。

**OrbitControls 阻尼** — `enableDamping: true` 配合 `dampingFactor: 0.08` 为相机运动添加惯性，使旋转手感自然，且无额外渲染开销。

**Raycaster RAF 节流** — `pointermove` 每秒触发 60-120 次。将 raycaster 调用包裹在 `requestAnimationFrame` 中，确保每渲染帧最多执行一次碰撞检测。

**Mesh 列表缓存** — `scene.traverse()` 每次调用为 O(n)。在模型加载时缓存扁平化的 mesh 数组，并传递给 `raycaster.intersectObjects(cachedMeshes, false)`，避免冗余的树遍历。

### 4. GSAP 动画系统

GSAP 注册为 Nuxt 仅客户端插件，通过 `useGsap()` composable 提供实例。两个主要使用场景：

**滚动触发画廊入场** — 每张卡片通过 `ScrollTrigger` 以交错的淡入 + translateY 动画入场：

```ts
gsap.from('.model-card', {
  y: 60, opacity: 0, duration: 0.8,
  stagger: 0.1,
  scrollTrigger: { trigger: '.gallery-grid', start: 'top 80%' }
})
```

**页面过渡** — `pageTransition.client.ts` 插件钩入 Nuxt 的 `page:transition:finish` 事件，在每次路由切换时运行 GSAP 入场动画，与 Vue 的 `<Transition>` CSS 协同工作。

### 5. Hero 粒子系统（自定义 GLSL）

首页 Hero 区域使用自定义 `ShaderMaterial` 渲染 GPU 驱动的粒子场：

```glsl
// 顶点着色器 — 每个粒子的位置在 GPU 上计算
void main() {
  vec3 pos = position;
  pos.x += sin(uTime * 0.5 + position.y * 2.0) * 0.3;
  pos.y += cos(uTime * 0.3 + position.x * 1.5) * 0.2;
  gl_PointSize = uSize * (300.0 / length(mvPosition.xyz));
  gl_Position = projectionMatrix * mvPosition;
}
```

鼠标排斥效果逐帧计算：将光标位置作为 uniform 传入，在顶点着色器中计算距离，并在一定半径内推开粒子。

### 6. 材质切换系统

`useMaterialSwitcher` composable 使用 `WeakMap<Mesh, Material>` 存储原始 PBR 材质，并在运行时进行切换：

```ts
type MaterialMode = 'originalPbr' | 'matcapSilver' | 'whiteClay' | 'wireframe' | 'normal'
```

每种模式按需动态导入所需的 Three.js 类（`MeshStandardMaterial`、`MeshMatcapMaterial` 等）以实现代码分割。切换回 PBR 时从 WeakMap 中恢复原始材质。

### 7. SSE（Server-Sent Events）驱动 AI 生成

生成流程使用 SSE 替代轮询：

```
客户端: POST /api/generate { prompt, quality }
服务端: 返回 taskId
客户端: GET /api/tasks/{id}/stream（SSE 连接）
服务端: 推送进度事件 → { status, progress: 0-100, modelUrl? }
客户端: useSSE() composable 在断连时自动重连
```

`useSSE.ts` 封装 `EventSource`，提供响应式状态（`status`、`progress`、`error`）并在组件卸载时自动清理。

### 8. GLB 模型管线

所有 3D 模型使用 GLB 格式（二进制 glTF）并应用 meshopt 压缩。加载管线：

```ts
const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)  // 处理 meshopt 压缩的缓冲区
loader.load(url, (gltf) => {
  const model = gltf.scene
  // 自动居中并归一化缩放
  const box = new Box3().setFromObject(model)
  model.position.sub(box.getCenter(new Vector3()))
  model.scale.setScalar(2.0 / Math.max(...box.getSize(new Vector3()).toArray()))
})
```

服务端通过 `proxy-model.get.ts` 代理外部 GLB URL 以绕过 CORS 限制，以流式传输二进制响应并设置正确的 `Content-Type: model/gltf-binary` 头。

### 9. IntersectionObserver 模式

项目中使用了两种 Observer 模式：

**懒初始化** — 重型资源（WebGL 上下文、GLB 加载）延迟到元素首次进入视口时才初始化：

```ts
const initObserver = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    init()             // 一次性初始化
    initObserver.disconnect()
  }
}, { threshold: 0.1 })
```

**基于可见性的暂停/恢复** — 对于确实需要持久渲染循环的组件，在离屏时暂停动画、进入视口时恢复，通过第二个 `threshold: 0.01` 的 Observer 实现。

### 10. 国际化

使用 `@nuxtjs/i18n`，策略为 `no_prefix`（URL 中不带语言前缀）。zh-CN 和 en 的语言 JSON 文件按需懒加载。所有面向用户的字符串在模板中使用 `$t('key')`。Header 中的语言切换器切换 `locale.value`，触发所有翻译字符串的重新渲染。

## 快速开始

```bash
# 安装依赖
pnpm install

# 环境变量
cp .env.example .env
# 编辑 .env: NUXT_TRIPO_API_KEY=your_key

# 开发模式
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

## 部署

针对 Vercel 优化。在 Vercel 控制台中设置 `NUXT_TRIPO_API_KEY` 和 `NUXT_TRIPO_API_BASE`，然后通过 `git push` 部署即可。

## 许可证

MIT
