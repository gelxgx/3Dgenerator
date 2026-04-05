export function useGsap() {
  const nuxtApp = useNuxtApp()

  return {
    gsap: (nuxtApp.$gsap as typeof import('gsap').gsap) || null,
    ScrollTrigger: (nuxtApp.$ScrollTrigger as any) || null,
  }
}
