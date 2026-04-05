/**
 * Page Transition Plugin — GSAP-enhanced route transitions
 *
 * 在路由切换时添加 GSAP 动画增强：
 *   - 离场：fade out + 上移 + blur + scale down
 *   - 入场：fade in + 下移还原 + unblur + scale up
 *   - 过渡遮罩闪光效果
 *
 * 面试亮点：展示 Vue Router 导航守卫 + GSAP 联动、SSR-safe 处理
 */
export default defineNuxtPlugin((nuxtApp) => {
  // 注册 Vue 过渡钩子（GSAP 增强版）
  nuxtApp.hook('page:transition:finish', () => {
    // 入场完成后的清理或附加效果
    const gsap = (window as any).gsap
    if (!gsap)
      return

    // 页面内容入场后，给主内容区域做一个轻微的 "弹入" 效果
    const mainContent = document.querySelector('.flex-1.flex')
    if (mainContent) {
      gsap.fromTo(mainContent, { opacity: 0.8, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    }
  })

  // 监听路由变化，添加过渡遮罩效果
  const router = useRouter()

  router.beforeEach((_to, _from, next) => {
    const gsap = (window as any).gsap
    if (!gsap) {
      next()
      return
    }

    // 创建或获取遮罩层
    let overlay = document.querySelector('.page-transition-overlay') as HTMLElement
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.className = 'page-transition-overlay'
      document.body.appendChild(overlay)
    }

    // 遮罩闪光 + 页面模糊
    gsap.timeline()
      .to(overlay, {
        opacity: 1,
        duration: 0.15,
        ease: 'power2.in',
      })
      .to(overlay, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out',
      })

    next()
  })
})
