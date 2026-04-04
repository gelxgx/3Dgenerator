<template>
  <div class="absolute inset-0 overflow-hidden">
    <!-- Animated gradient orbs -->
    <div class="hero-orb hero-orb-1" />
    <div class="hero-orb hero-orb-2" />
    <div class="hero-orb hero-orb-3" />

    <!-- Grid pattern overlay -->
    <div class="absolute inset-0 opacity-8" style="background-image: linear-gradient(rgba(108,92,231,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,92,231,0.06) 1px, transparent 1px); background-size: 60px 60px;" />

    <!-- Noise texture overlay for depth -->
    <div class="absolute inset-0 opacity-30" style="background: radial-gradient(ellipse at 30% 20%, rgba(108,92,231,0.15), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(0,206,201,0.1), transparent 60%);" />
  </div>
</template>

<style scoped>
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.hero-orb-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.3) 0%, transparent 70%);
  top: -100px;
  left: -50px;
  animation: float-1 12s ease-in-out infinite;
}

.hero-orb-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0, 206, 201, 0.2) 0%, transparent 70%);
  bottom: -80px;
  right: -60px;
  animation: float-2 15s ease-in-out infinite;
}

.hero-orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(108, 92, 231, 0.15) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: float-3 10s ease-in-out infinite;
}

@keyframes float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, 30px) scale(1.1); }
  66% { transform: translate(-20px, -15px) scale(0.95); }
}

@keyframes float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, -20px) scale(1.05); }
  66% { transform: translate(25px, 15px) scale(0.9); }
}

@keyframes float-3 {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}
</style>
