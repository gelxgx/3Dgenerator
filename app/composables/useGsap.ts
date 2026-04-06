export function useGsap() {
  const nuxtApp = useNuxtApp()

  return {
    // @ts-expect-error gsap is loaded from CDN
    gsap: (nuxtApp.$gsap as typeof import('gsap').gsap) || null,
    ScrollTrigger: (nuxtApp.$ScrollTrigger as any) || null,
  }
}
