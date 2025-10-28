import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { GameSettings } from '@/types/game';

export const usePlimcoPhysics = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  settings: GameSettings,
  onBallLanded: (prizeIndex: number) => void
) => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: settings.gravity },
    });

    const world = engine.world;
    engineRef.current = engine;
    worldRef.current = world;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: 'transparent',
      },
    });
    renderRef.current = render;

    // Create walls
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#8B4513',
        strokeStyle: '#5D2E0F',
        lineWidth: 3
      }
    };

    const leftWall = Matter.Bodies.rectangle(10, 300, 20, 600, wallOptions);
    const rightWall = Matter.Bodies.rectangle(790, 300, 20, 600, wallOptions);
    const bottomWall = Matter.Bodies.rectangle(400, 590, 800, 20, wallOptions);

    Matter.World.add(world, [leftWall, rightWall, bottomWall]);

    // Create pegs in triangular pattern
    const pegRadius = 6;
    const pegOptions = {
      isStatic: true,
      restitution: 0.7,
      render: {
        fillStyle: settings.pegColor,
        strokeStyle: '#000',
        lineWidth: 2
      }
    };

    const startY = 100;
    const rowSpacing = 50;
    const pegSpacing = 60;

    for (let row = 0; row < settings.pegRows; row++) {
      const pegsInRow = row + 3;
      const rowWidth = (pegsInRow - 1) * pegSpacing;
      const startX = (800 - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * pegSpacing;
        const y = startY + row * rowSpacing;
        const peg = Matter.Bodies.circle(x, y, pegRadius, pegOptions);
        Matter.World.add(world, peg);
      }
    }

    // Create prize zones
    const numPrizes = settings.prizes.length;
    const zoneWidth = 760 / numPrizes;
    const zoneY = 560;
    const zones: Matter.Body[] = [];

    for (let i = 0; i < numPrizes; i++) {
      const x = 20 + i * zoneWidth + zoneWidth / 2;
      const zone = Matter.Bodies.rectangle(x, zoneY, zoneWidth - 10, 60, {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: i % 2 === 0 ? '#FFD700' : '#FFA500',
          strokeStyle: '#000',
          lineWidth: 2
        },
        label: `prize-${i}`
      });
      zones.push(zone);
      Matter.World.add(world, zone);
    }

    // Collision detection for prizes
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const ball = bodyA.label.startsWith('ball') ? bodyA : bodyB;
        const prize = bodyA.label.startsWith('prize') ? bodyA : bodyB;

        if (ball.label.startsWith('ball') && prize.label.startsWith('prize')) {
          const prizeIndex = parseInt(prize.label.split('-')[1]);

          // Remove ball after short delay
          setTimeout(() => {
            Matter.World.remove(world, ball);
            onBallLanded(prizeIndex);
          }, 100);
        }
      });
    });

    // Run the engine and renderer
    Matter.Runner.run(engine);
    Matter.Render.run(render);

    setIsReady(true);

    // Cleanup
    return () => {
      Matter.Render.stop(render);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      if (render.textures) {
        Matter.Common.clear(render.textures);
      }
    };
  }, [settings.pegRows, settings.pegColor, settings.prizes.length, settings.gravity]);

  const dropBall = (x: number = 400) => {
    if (!worldRef.current) return;

    const ball = Matter.Bodies.circle(x, 30, settings.ballSize, {
      restitution: 0.5,
      friction: 0.1,
      density: 0.04,
      render: {
        fillStyle: settings.ballColor,
        strokeStyle: '#000',
        lineWidth: 2
      },
      label: `ball-${Date.now()}`
    });

    Matter.World.add(worldRef.current, ball);
  };

  return { isReady, dropBall };
};
