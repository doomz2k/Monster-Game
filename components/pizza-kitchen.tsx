'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Check, Volume2 } from 'lucide-react';
import {
  TOPPINGS,
  pizzaMatches,
  placeFor,
  type PizzaRecipe,
  type ToppingId,
} from '@/lib/adventure';
import { QuantityDial } from './quantity-dial';
import type { AudioDirector } from '@/lib/audio';

function Pizza({
  counts,
  baking,
}: {
  counts: Partial<Record<ToppingId, number>>;
  baking: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ counts, baking });
  const repaint = useRef<() => void>(() => {});
  useEffect(() => {
    latest.current = { counts, baking };
    repaint.current();
  }, [counts, baking]);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 6.8, 4.8);
    camera.lookAt(0, 0, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(320, 270);
    renderer.setClearColor(0x000000, 0);
    host.current.appendChild(renderer.domElement);
    const pizza = new THREE.Group();
    scene.add(pizza);
    let toppingTag: { id: ToppingId; index: number } | null = null;
    const add = (
      geometry: THREE.BufferGeometry,
      colour: string,
      x: number,
      y: number,
      z: number,
      scale = 1,
    ) => {
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: colour, roughness: 0.78 }),
      );
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(scale);
      if (toppingTag) mesh.userData.topping = { ...toppingTag };
      pizza.add(mesh);
      return mesh;
    };
    add(
      new THREE.CylinderGeometry(2.05, 2.05, 0.12, 64),
      '#ca9c6b',
      0,
      -0.16,
      0,
    );
    add(new THREE.CylinderGeometry(1.8, 1.75, 0.22, 64), '#eabe77', 0, 0, 0);
    add(
      new THREE.CylinderGeometry(1.62, 1.62, 0.04, 64),
      '#c84833',
      0,
      0.13,
      0,
    );
    add(
      new THREE.CylinderGeometry(1.49, 1.54, 0.045, 64),
      '#f6d986',
      0,
      0.16,
      0,
    );
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39996,
        r = 0.2 + (i % 5) * 0.27;
      const spot = add(
        new THREE.SphereGeometry(0.1, 8, 6),
        '#f9e9ab',
        Math.cos(a) * r,
        0.19,
        Math.sin(a) * r,
      );
      spot.scale.y = 0.14;
    }
    TOPPINGS.forEach((t, layer) => {
      for (let i = 0; i < 12; i++) {
        toppingTag = { id: t.id, index: i };
        const a = i * 2.39996 + layer * 1.2,
          r = 0.28 + Math.sqrt(((i * 7 + layer * 3) % 19) / 19) * 1.06;
        const x = Math.cos(a) * r,
          z = Math.sin(a) * r,
          y = 0.22 + layer * 0.04;
        if (t.id === 'tomato') {
          add(
            new THREE.CylinderGeometry(0.2, 0.2, 0.07, 16),
            t.colour,
            x,
            y,
            z,
          );
          add(
            new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10),
            '#ef9875',
            x,
            y + 0.01,
            z,
          );
        } else if (t.id === 'olive' || t.id === 'pepper') {
          const ring = add(
            new THREE.TorusGeometry(
              t.id === 'olive' ? 0.1 : 0.19,
              t.id === 'olive' ? 0.055 : 0.04,
              8,
              14,
            ),
            t.colour,
            x,
            y,
            z,
          );
          ring.rotation.x = Math.PI / 2;
        } else if (t.id === 'mushroom') {
          const cap = add(
            new THREE.SphereGeometry(0.2, 12, 8),
            t.colour,
            x,
            y,
            z,
          );
          cap.scale.set(1, 0.25, 0.65);
          add(
            new THREE.BoxGeometry(0.09, 0.06, 0.18),
            '#f3dfb7',
            x,
            y,
            z + 0.12,
          );
        } else {
          const kernel = add(
            new THREE.SphereGeometry(0.12, 10, 8),
            t.colour,
            x,
            y,
            z,
          );
          kernel.scale.set(0.75, 0.55, 1);
        }
      }
    });
    scene.add(new THREE.HemisphereLight('#fff8e7', '#916347', 1.2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    const light = new THREE.DirectionalLight('#fff4dc', 2.4);
    light.position.set(-3, 7, 4);
    scene.add(light);
    let frame = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (t: number) => {
      pizza.children.forEach((o) => {
        const tag = o.userData.topping;
        if (tag)
          o.visible =
            tag.index < (latest.current.counts[tag.id as ToppingId] ?? 0);
      });
      pizza.rotation.y =
        latest.current.baking && !reduced ? Math.sin(t / 700) * 0.12 : 0;
      renderer.render(scene, camera);
      if (latest.current.baking && !reduced)
        frame = requestAnimationFrame(draw);
    };
    const resize = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width,
        height = entry.contentRect.height;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(host.current);
    repaint.current = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
    };
    draw(0);
    return () => {
      resize.disconnect();
      cancelAnimationFrame(frame);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <figure
      ref={host}
      className="pizza-preview"
      aria-label={
        'Your pizza: ' +
        TOPPINGS.map(
          (t) => `${counts[t.id] ?? 0} ${t.name.toLowerCase()}`,
        ).join(', ')
      }
    />
  );
}

export function PizzaKitchen({
  recipe,
  max,
  audio,
  onComplete,
}: {
  recipe: PizzaRecipe;
  max: number;
  audio: AudioDirector;
  onComplete: () => void;
}) {
  const [counts, setCounts] = useState<Partial<Record<ToppingId, number>>>({}),
    [step, setStep] = useState(0),
    [baking, setBaking] = useState(false),
    [feedback, setFeedback] = useState('');
  const finished = useRef(false);
  const current = recipe.steps[step],
    topping = TOPPINGS.find((t) => t.id === current.topping)!,
    customer = placeFor(recipe.customer);
  const allReady = pizzaMatches(recipe, counts);
  const repeat = () =>
    void audio.lines([recipe.intro, 'topping-' + topping.id, current.prompt]);
  useEffect(() => {
    void audio.lines([
      recipe.intro,
      'topping-' + recipe.steps[0].topping,
      recipe.steps[0].prompt,
    ]);
    return () => audio.stop();
  }, [recipe, audio]);
  useEffect(() => {
    if (!baking) return;
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [baking]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (value: number) => {
    setFeedback('');
    setCounts((old) => ({ ...old, [topping.id]: value }));
    void audio.line('number-' + value);
  };
  const next = () => {
    if ((counts[topping.id] ?? 0) !== current.quantity) {
      setFeedback('Count the recipe pictures together');
      void audio.lines(['pizza-retry', current.prompt]);
      return;
    }
    if (step < recipe.steps.length - 1) {
      const index = step + 1;
      setStep(index);
      setFeedback('');
      void audio.lines([
        'pizza-next',
        'topping-' + recipe.steps[index].topping,
        recipe.steps[index].prompt,
      ]);
    } else if (allReady) {
      if (finished.current) return;
      finished.current = true;
      setBaking(true);
      void audio.line('pizza-bake');
    }
  };
  return (
    <div className={'pizza-kitchen ' + (baking ? 'pizza-baking' : '')}>
      <div className="pizza-customer">
        <span style={{ background: customer.colour }}>{customer.icon}</span>
        <div>
          <small>{customer.friend} would like…</small>
          <h3>{recipe.name}</h3>
        </div>
        <button
          data-repeat-prompt
          className="round-control"
          onClick={repeat}
          aria-label="Hear the customer and recipe"
        >
          <Volume2 />
        </button>
      </div>
      <div className="pizza-workbench">
        <div className="pizza-board">
          <Pizza counts={counts} baking={baking} />
          <span>{baking ? '🔥 Baking your pizza…' : 'Made by you'}</span>
        </div>
        <div className="pizza-recipe">
          <div className="recipe-tabs" aria-label="Recipe toppings">
            {recipe.steps.map((s, i) => {
              const t = TOPPINGS.find((t) => t.id === s.topping)!;
              return (
                <span
                  key={s.topping}
                  className={'recipe-step ' + (i === step ? 'current' : '')}
                  aria-label={t.name + (i < step ? ', finished' : '')}
                >
                  <span>{t.icon}</span>
                  {i < step && <Check size={18} />}
                </span>
              );
            })}
          </div>
          <h4>
            {topping.icon} {topping.name}
          </h4>
          <div className="recipe-sum">
            <strong>{current.left}</strong>
            <b>{current.operation}</b>
            <strong>{current.right}</strong>
            <b>=</b>
            <strong>?</strong>
          </div>
          <div className="recipe-counters" aria-label="Pictures to help count">
            {current.operation === '+' ? (
              <>
                <span>
                  {Array.from({ length: current.left }, (_, i) => (
                    <i key={i}>{topping.icon}</i>
                  ))}
                  {!current.left && '0'}
                </span>
                <b>+</b>
                <span>
                  {Array.from({ length: current.right }, (_, i) => (
                    <i key={i}>{topping.icon}</i>
                  ))}
                </span>
              </>
            ) : (
              <span>
                {Array.from({ length: current.left }, (_, i) => (
                  <i
                    key={i}
                    className={i >= current.quantity ? 'crossed-out' : ''}
                  >
                    {topping.icon}
                  </i>
                ))}
              </span>
            )}
          </div>
          <QuantityDial
            value={counts[topping.id] ?? 0}
            max={max}
            onChange={choose}
            onConfirm={next}
            disabled={baking}
            label={topping.name}
            confirmLabel={
              step === recipe.steps.length - 1
                ? 'Bake my pizza'
                : 'Next topping'
            }
          />
        </div>
      </div>
      <div className="pizza-oven">
        <output aria-live="polite">{feedback}</output>
      </div>
    </div>
  );
}
