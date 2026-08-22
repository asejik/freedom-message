"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Glowing neon particles drifting upward with subtle twinkle
    const particleCount = Math.min(30, Math.floor(width / 45));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      speedX: (Math.random() - 0.5) * 0.18,
      speedY: -(Math.random() * 0.25 + 0.08), // Gentle upward drift
      baseOpacity: Math.random() * 0.2 + 0.08,
      opacity: 0.15,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? "rgba(0, 240, 255," : "rgba(168, 85, 247,", // Cyan & Violet particles
    }));

    // Floating neon ambient glow orbs — tuned darker & deeper
    const orbs = [
      {
        x: width * 0.15,
        y: height * 0.2,
        baseRadius: Math.max(280, width * 0.32),
        radius: Math.max(280, width * 0.32),
        r: 0, g: 240, b: 255, // Electric Cyan
        alpha: 0.065,
        vx: 0.12,
        vy: 0.08,
        phase: 0,
      },
      {
        x: width * 0.85,
        y: height * 0.3,
        baseRadius: Math.max(300, width * 0.35),
        radius: Math.max(300, width * 0.35),
        r: 139, g: 92, b: 246, // Vivid Purple
        alpha: 0.075,
        vx: -0.1,
        vy: 0.12,
        phase: Math.PI * 0.5,
      },
      {
        x: width * 0.5,
        y: height * 0.75,
        baseRadius: Math.max(320, width * 0.38),
        radius: Math.max(320, width * 0.38),
        r: 79, g: 70, b: 229, // Neon Indigo / Royal Blue
        alpha: 0.08,
        vx: 0.09,
        vy: -0.1,
        phase: Math.PI,
      },
      {
        x: width * 0.8,
        y: height * 0.85,
        baseRadius: Math.max(260, width * 0.3),
        radius: Math.max(260, width * 0.3),
        r: 217, g: 70, b: 239, // Neon Magenta
        alpha: 0.055,
        vx: -0.12,
        vy: -0.09,
        phase: Math.PI * 1.5,
      },
      {
        x: width * 0.1,
        y: height * 0.8,
        baseRadius: Math.max(240, width * 0.28),
        radius: Math.max(240, width * 0.28),
        r: 6, g: 182, b: 212, // Vibrant Teal
        alpha: 0.055,
        vx: 0.1,
        vy: -0.1,
        phase: Math.PI * 0.8,
      },
    ];

    let time = 0;

    const draw = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing neon ambient orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.radius = orb.baseRadius + Math.sin(time + orb.phase) * 30;

        // Soft bounce within boundary margin
        if (orb.x < -width * 0.2 || orb.x > width * 1.2) orb.vx *= -1;
        if (orb.y < -height * 0.2 || orb.y > height * 1.2) orb.vy *= -1;

        const pulseAlpha = orb.alpha + Math.sin(time * 0.8 + orb.phase) * 0.015;
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        gradient.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${Math.max(0.02, pulseAlpha)})`);
        gradient.addColorStop(0.5, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${Math.max(0.005, pulseAlpha * 0.35)})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw drifting neon particles
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentOpacity = p.baseOpacity + Math.sin(time * 2 + p.twinkleOffset) * 0.08;

        // Outer neon glow
        ctx.fillStyle = `${p.color} ${Math.max(0, currentOpacity * 0.4)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `${p.color} ${Math.max(0, currentOpacity)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Dynamic Animated Canvas with Neon Glow */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "transparent" }}
      />
      {/* Ambient Neon Atmosphere Vignette / Radial Highlights */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-35"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(0, 240, 255, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 85% 25%, rgba(139, 92, 246, 0.045) 0%, transparent 45%),
            radial-gradient(circle at 50% 90%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(217, 70, 239, 0.03) 0%, transparent 40%)
          `
        }}
      />
    </>
  );
}
