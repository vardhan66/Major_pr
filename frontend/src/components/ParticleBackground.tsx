import { useEffect, useRef } from "react";

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      dx: number;
      dy: number;
      opacity: number;
      pulse: number;
      color: string;
      trail: { x: number; y: number }[];
      waveOffset: number; // New: Track wave offset
    }> = [];

    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      dx: (Math.random() - 0.5) * 1.5,
      dy: (Math.random() - 0.5) * 1.5,
      opacity: Math.random() * 0.5 + 0.5,
      pulse: Math.random() * 0.015 + 0.005,
      color: `rgba(0, ${100 + Math.random() * 100}, 255, 1)`,
      trail: [],
      waveOffset: Math.random() * Math.PI * 2, // New: Random wave offset
    });

    for (let i = 0; i < 200; i++) {
      particles.push(createParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections between nearby particles (Crypto Node Effect)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 200, 255, ${1 - distance / 100})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      particles.forEach((particle) => {
        // Store past positions for trails (limit 10)
        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > 5) {
          particle.trail.shift();
        }

        // Draw particle trail
        ctx.beginPath();
        for (let i = 0; i < particle.trail.length; i++) {
          const trailPoint = particle.trail[i];
          const alpha = i / particle.trail.length;
          ctx.fillStyle = `rgba(0, 200, 255, ${alpha * 0.6})`;
          ctx.arc(trailPoint.x, trailPoint.y, particle.radius * (0.5 + alpha), 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 150, 255, ${particle.opacity})`;
        ctx.shadowColor = "rgba(0, 200, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.fill();

        // Pulsing effect
        particle.radius += particle.pulse;
        if (particle.radius > 3 || particle.radius < 1) particle.pulse *= -1;

        // Quantum Effect: Wave-like motion
        particle.x += Math.sin(particle.waveOffset) * 0.5;
        particle.y += Math.cos(particle.waveOffset) * 0.5;
        particle.waveOffset += 0.07;

        // Quantum Effect: Random teleportation
        if (Math.random() < 0.001) {
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }

        // Opacity flickering (Uncertainty effect)
        particle.opacity += (Math.random() - 0.5) * 0.005;
        if (particle.opacity < 0.3) particle.opacity = 0.3;
        if (particle.opacity > 1) particle.opacity = 1;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-background"
      style={{ background: "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)" }}
    />
  );
};

export default ParticleBackground;
