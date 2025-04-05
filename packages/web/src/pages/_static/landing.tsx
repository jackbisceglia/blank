import { Button } from "@/components/ui/button";
import { loginRPC } from "@/rpc/auth";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";

function useClientEffect(fn: () => void, deps?: unknown[]) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    fn();
  }, deps ?? []);
}

export const Route = createFileRoute("/_static/landing")({
  component: function RouteComponent() {
    const login = useServerFn(loginRPC);
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [laggedPosition, setLaggedPosition] = useState({ x: 0, y: 0 });
    const animationRef = useRef<number>(0);
    const windowSizeRef = useRef({ width: 0, height: 0 });

    // Update window size on mount and resize
    useClientEffect(() => {
      const updateWindowSize = () => {
        windowSizeRef.current = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        // Initialize positions in the center of the screen
        if (targetPosition.x === 0 && targetPosition.y === 0) {
          const initialPos = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          };
          setTargetPosition(initialPos);
          setLaggedPosition(initialPos);
        }
      };

      updateWindowSize();
      window.addEventListener("resize", updateWindowSize);

      return () => {
        window.removeEventListener("resize", updateWindowSize);
      };
    }, []);

    // Generate new random target positions periodically
    useClientEffect(() => {
      if (typeof window === "undefined") return;

      const generateRandomPosition = () => {
        // Get current window dimensions
        const { width, height } = windowSizeRef.current;
        const padding = 200;

        // Center points
        const centerX = width / 2;
        const centerY = height / 2;

        const stdDevX = width * 0.25;
        const stdDevY = height * 0.25;

        const generateGaussianRandom = () => {
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 =
            Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          return z0;
        };

        let x = centerX + generateGaussianRandom() * stdDevX;
        let y = centerY + generateGaussianRandom() * stdDevY;

        x = Math.max(padding, Math.min(width - padding, x));
        y = Math.max(padding, Math.min(height - padding, y));

        setTargetPosition({ x, y });
      };

      // Generate initial position
      generateRandomPosition();

      // Set interval to change position every 0.5-3 seconds
      const intervalId = setInterval(
        () => {
          generateRandomPosition();
        },
        Math.random() * 2500 + 500 // Random interval between 0.5s and 3s
        // 1000
      );

      return () => {
        clearInterval(intervalId);
      };
    }, []);

    // Animate laggedPosition to follow targetPosition with delay
    useClientEffect(() => {
      if (typeof window === "undefined") return;

      const animateLaggedPosition = () => {
        // Slower lag factor for more dreamy movement
        const lagFactor = 0.015;

        setLaggedPosition((prevPos) => ({
          x: prevPos.x + (targetPosition.x - prevPos.x) * lagFactor,
          y: prevPos.y + (targetPosition.y - prevPos.y) * lagFactor,
        }));

        animationRef.current = requestAnimationFrame(animateLaggedPosition);
      };

      animationRef.current = requestAnimationFrame(animateLaggedPosition);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }, [targetPosition]);

    return (
      <div className="relative min-h-screen">
        {/* Faintly visible dot pattern base layer */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
            opacity: "0.075", // Slightly darker base dots
          }}
        />

        {/* Blue-tinted dots reveal layer */}
        <div
          className="fixed inset-0 z-1 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--blank-theme) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
            maskImage: `radial-gradient(circle at ${laggedPosition.x.toString()}px ${laggedPosition.y.toString()}px, black 0%, transparent 250px)`,
            WebkitMaskImage: `radial-gradient(circle at ${laggedPosition.x.toString()}px ${laggedPosition.y.toString()}px, black 0%, transparent 250px)`,
            opacity: "0.4",
            transition: "none",
          }}
        />

        {/* Inner glow effect - softer core */}
        <div
          className="fixed pointer-events-none z-2"
          style={{
            background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 100%)`,
            width: "250px",
            height: "250px",
            borderRadius: "100%",
            transform: `translate(${(laggedPosition.x - 125).toString()}px, ${(laggedPosition.y - 125).toString()}px)`,
            opacity: "0.05",
            mixBlendMode: "screen",
            filter: "blur(12px)",
            transition: "none",
          }}
        />

        {/* Outer glow effect - even softer spread */}
        <div
          className="fixed pointer-events-none z-2"
          style={{
            background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, rgba(245, 245, 255, 0.1) 40%, transparent 80%)`,
            width: "450px",
            height: "450px",
            borderRadius: "100%",
            transform: `translate(${(laggedPosition.x - 225).toString()}px, ${(laggedPosition.y - 225).toString()}px)`,
            opacity: "0.05",
            mixBlendMode: "soft-light",
            filter: "blur(20px)",
            transition: "none",
          }}
        />

        <header className="relative z-10 px-8">
          <nav className="container flex items-center justify-between py-4 mx-auto w-full max-w-screen-2xl">
            <Link
              search={(prev) => ({
                cmd: prev.cmd,
                action: prev.action,
                ...prev,
              })}
              to="/"
              className="flex items-center gap-2 duration-150"
            >
              <img src="/blank-logo.svg" className="w-8 h-8" alt="BLANK logo" />
              <span className="text-xl font-semibold tracking-tight">
                BLANK
              </span>
            </Link>
            <div className="md:flex items-center gap-8">
              <Button
                onClick={() => void login()}
                variant="outline"
                size="sm"
                className="tracking-wide"
              >
                Log In
              </Button>
            </div>
          </nav>
        </header>

        <main className="min-h-screen px-8 w-full flex flex-col text-foreground font-mono selection:bg-primary selection:text-primary-foreground max-w-screen-2xl mx-auto relative z-10">
          <section className="py-12 md:py-24 flex-col space-y-6 flex items-center justify-center min-h-[3/4] mt-36">
            <h1 className="text-4xl md:text-5xl tracking-tight w-fit">
              split expenses&nbsp;
              <span className="text-blank-theme font-bold">effortlessly</span>
            </h1>
            <p className="text-muted-foreground">
              handle your expenses without the hassle— as easy as sending a
              text.
            </p>
            <div className="flex gap-4 w-full text-center md:w-auto my-4">
              <Button
                onClick={() => void login()}
                className="min-w-44 w-full md:w-auto"
              >
                Get Started
              </Button>
              <Button
                asChild
                variant="outline"
                className="min-w-44 w-full md:w-auto"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </section>
        </main>

        <footer className="w-full relative z-10 px-8">
          <div className="container flex flex-col py-8 mx-auto w-full max-w-screen-2xl gap-6">
            <div className="flex items-center gap-2">
              <img src="/blank-logo.svg" className="w-8 h-8" alt="BLANK logo" />
              <span className="text-xl font-semibold tracking-tight">
                BLANK
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  },
});
