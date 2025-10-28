import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { GameSettings } from '@/types/game';

export const usePlinkoPhysics = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  settings: GameSettings,
  multipliers: number[],
  onBallLanded: (slotIndex: number, betAmount: number) => void
) => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = 600;
    const height = 700;

    // Create engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0.8 },
    });

    const world = engine.world;
    engineRef.current = engine;
    worldRef.current = world;

    // Create renderer
    const render = Matter.Render.create({
      canvas: canvas,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#1a1a2e',
      },
    });
    renderRef.current = render;

    // Create walls
    const wallThickness = 20;
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#16213e',
        strokeStyle: '#0f3460',
        lineWidth: 2
      }
    };

    const leftWall = Matter.Bodies.rectangle(wallThickness/2, height/2, wallThickness, height, wallOptions);
    const rightWall = Matter.Bodies.rectangle(width - wallThickness/2, height/2, wallThickness, height, wallOptions);

    Matter.World.add(world, [leftWall, rightWall]);

    // Create pegs in pyramid pattern
    const pegRadius = 4;
    const rows = settings.rows;
    const startY = 120;
    const rowSpacing = 45;
    const baseSpacing = 40;

    const pegOptions = {
      isStatic: true,
      restitution: 0.6,
      friction: 0.001,
      render: {
        fillStyle: '#22d3ee',
        strokeStyle: '#06b6d4',
        lineWidth: 2,
      }
    };

    // Create pins in perfect triangular pyramid formation
    for (let row = 0; row < rows; row++) {
      const pegsInRow = row + 3; // Start with 3 pegs, add 1 per row
      const rowWidth = (pegsInRow - 1) * baseSpacing;
      const startX = (width - rowWidth) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const x = startX + col * baseSpacing;
        const y = startY + row * rowSpacing;
        const peg = Matter.Bodies.circle(x, y, pegRadius, pegOptions);
        Matter.World.add(world, peg);
      }
    }

    // Create prize slots at bottom
    const numSlots = multipliers.length;
    const slotWidth = (width - wallThickness * 2) / numSlots;
    const slotHeight = 50;
    const slotY = height - slotHeight - 10;

    // Create dividers between slots
    for (let i = 0; i <= numSlots; i++) {
      const x = wallThickness + i * slotWidth;
      const divider = Matter.Bodies.rectangle(x, slotY + slotHeight/2, 3, slotHeight, {
        isStatic: true,
        render: {
          fillStyle: '#2d4059',
          strokeStyle: '#1a2332',
          lineWidth: 1
        }
      });
      Matter.World.add(world, divider);
    }

    // Create sensor zones for detecting ball landing
    for (let i = 0; i < numSlots; i++) {
      const x = wallThickness + i * slotWidth + slotWidth / 2;
      const multiplier = multipliers[i];

      // Color based on multiplier value
      let color;
      if (multiplier >= 50) color = '#ff0080'; // High multiplier - hot pink
      else if (multiplier >= 10) color = '#ff6b35'; // Good multiplier - orange
      else if (multiplier >= 1) color = '#f7b801'; // Normal - yellow
      else color = '#6c5b7b'; // Low multiplier - purple

      const zone = Matter.Bodies.rectangle(x, slotY + slotHeight/2, slotWidth - 6, slotHeight - 6, {
        isStatic: true,
        isSensor: true,
        render: {
          fillStyle: color,
          opacity: 0.8,
          strokeStyle: '#000',
          lineWidth: 1
        },
        label: `slot-${i}`
      });
      Matter.World.add(world, zone);
    }

    // Collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const ball = bodyA.label?.startsWith('ball') ? bodyA : bodyB;
        const slot = bodyA.label?.startsWith('slot') ? bodyA : bodyB;

        if (ball.label?.startsWith('ball') && slot.label?.startsWith('slot')) {
          const slotIndex = parseInt(slot.label.split('-')[1]);

          // Mark ball for removal
          if (!ball.plugin?.landed) {
            ball.plugin = { ...ball.plugin, landed: true };
            const betAmount = ball.plugin?.betAmount || 0;

            setTimeout(() => {
              if (worldRef.current) {
                Matter.World.remove(worldRef.current, ball);
              }
              onBallLanded(slotIndex, betAmount);
            }, 200);
          }
        }
      });
    });

    // Run the engine and renderer
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    setIsReady(true);

    // Cleanup
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, [settings.rows, multipliers.length]);

  const dropBall = (betAmount: number) => {
    if (!worldRef.current) return;

    // Drop from center with slight random variation
    const centerX = 300;
    const randomOffset = (Math.random() - 0.5) * 20;
    const x = centerX + randomOffset;

    const ball = Matter.Bodies.circle(x, 50, 8, {
      restitution: 0.4,
      friction: 0.1,
      density: 0.001,
      render: {
        fillStyle: '#fbbf24',
        strokeStyle: '#f59e0b',
        lineWidth: 3,
      },
      label: `ball-${Date.now()}`,
      plugin: { betAmount } // Store bet amount with the ball
    });

    Matter.World.add(worldRef.current, ball);
  };

  return { isReady, dropBall };
};
