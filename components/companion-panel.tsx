'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Check, Home, LockKeyhole, Sparkles } from 'lucide-react';
import {
  COMPANIONS,
  chooseCompanion,
  companionAvailable,
  type CompanionId,
} from '@/lib/companion';
import { createCompanion } from '@/lib/companion-model';
import type { ProgressData } from '@/lib/learning';
import type { AudioDirector } from '@/lib/audio';
import { useGamePreferences } from './game-preferences';
import { graphicsPixelRatio } from '@/lib/graphics-quality';

export function CompanionPicture({ id }: { id: CompanionId }) {
  const c = COMPANIONS.find((c) => c.id === id)!;
  return (
    <svg viewBox="0 0 120 110" aria-hidden="true" className="companion-picture">
      <ellipse cx="60" cy="99" rx="28" ry="5" fill="#546a5620" />
      <path
        d="M34 46Q0 20 7 55Q14 68 34 61M86 46Q120 20 113 55Q106 68 86 61"
        fill={c.wing}
      />
      {id === 'sprig' && (
        <path
          d="M40 33Q22 0 36 8Q51 12 50 34M70 34Q69 12 84 8Q98 0 80 33"
          fill={c.wing}
        />
      )}
      {id === 'twinkle' && (
        <g stroke="#8a74b0" strokeWidth="3">
          <path d="M48 32L40 12M72 32L80 12" />
          <circle cx="40" cy="12" r="5" fill="#f7d77b" />
          <circle cx="80" cy="12" r="5" fill="#f7d77b" />
        </g>
      )}
      <ellipse cx="60" cy="57" rx="34" ry="35" fill={c.colour} />
      {id === 'puff' && (
        <g fill={c.colour}>
          <circle cx="43" cy="31" r="13" />
          <circle cx="62" cy="24" r="15" />
          <circle cx="78" cy="33" r="12" />
        </g>
      )}
      <ellipse cx="60" cy="73" rx="21" ry="17" fill={c.belly} />
      {[46, 74].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="47" rx="11" ry="13" fill="#fff9eb" />
          <ellipse cx={x + 1} cy="48" rx="5.5" ry="7" fill="#34364b" />
          <circle cx={x - 1} cy="45" r="2" fill="white" />
        </g>
      ))}
      <path
        d="M54 63Q60 70 66 63"
        fill="none"
        stroke="#59484c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {id === 'puff' && <path d="M53 58Q60 50 67 58L60 63Z" fill="#eabb69" />}
      <ellipse cx="42" cy="89" rx="10" ry="5" fill={c.belly} />
      <ellipse cx="78" cy="89" rx="10" ry="5" fill={c.belly} />
    </svg>
  );
}
function CompanionPreview({ id }: { id: CompanionId }) {
  const host = useRef<HTMLDivElement>(null),
    { preferences, reducedMotion } = useGamePreferences();
  const tier =
    preferences.graphics === 'auto' ? 'balanced' : preferences.graphics;
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20),
      model = createCompanion(id);
    camera.position.set(1.8, 1.35, 4.1);
    camera.lookAt(0, 0.2, 0);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    host.current.appendChild(renderer.domElement);
    const sun = new THREE.DirectionalLight('#fff3d7', 3);
    sun.position.set(-3, 5, 4);
    scene.add(
      sun,
      new THREE.HemisphereLight('#e7f7ff', '#7b9271', 2),
      model.root,
    );
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.92, 0.14, 32),
      new THREE.MeshStandardMaterial({ color: '#c5d39b', roughness: 0.9 }),
    );
    pad.position.y = -0.75;
    scene.add(pad);
    model.root.rotation.y = 0.15;
    let frame = 0,
      last = -1000;
    const draw = (t: number) => {
      if (!reducedMotion) frame = requestAnimationFrame(draw);
      if (document.hidden || t - last < 1000 / 30) return;
      last = t;
      model.animate(t / 1000, 0, false, reducedMotion);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      renderer.setPixelRatio(
        graphicsPixelRatio(tier, width, height, devicePixelRatio),
      );
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    observer.observe(host.current);
    draw(0);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [id, tier, reducedMotion]);
  return (
    <figure
      ref={host}
      className="companion-preview"
      aria-label={
        COMPANIONS.find((c) => c.id === id)!.name +
        ' flaps, blinks and bobs on a little garden stage'
      }
    >
      <CompanionPicture id={id} />
    </figure>
  );
}
export function CompanionPanel({
  progress: p,
  onChange,
  audio,
}: {
  progress: ProgressData;
  onChange: (p: ProgressData) => void;
  audio: AudioDirector;
}) {
  const [preview, setPreview] = useState<CompanionId>(
      p.adventure.companion ?? 'sprig',
    ),
    [message, setMessage] = useState('A little friend for your adventures');
  const selected = p.adventure.companion;
  const repeatLine = useRef('companions');
  return (
    <div className="companion-workspace">
      <button
        hidden
        data-repeat-prompt
        onClick={() => {
          void audio.line(repeatLine.current);
        }}
      >
        Listen again
      </button>
      <div className="companion-stage">
        <CompanionPreview id={preview} />
        <strong>{COMPANIONS.find((c) => c.id === preview)!.name}</strong>
        <span>
          <Sparkles size={17} /> Adventures are better together
        </span>
      </div>
      <div className="companion-controls">
        <div className="companion-choices">
          {COMPANIONS.map((c) => {
            const available = companionAvailable(c.id, p.adventure);
            return (
              <button
                key={c.id}
                data-game-choice
                aria-pressed={selected === c.id}
                aria-label={
                  c.name + (available ? ' — come with me' : ' — ' + c.clue)
                }
                onClick={() => {
                  setPreview(c.id);
                  if (!available) {
                    repeatLine.current = 'companion-' + c.id + '-locked';
                    setMessage(c.clue);
                    void audio.line('companion-' + c.id + '-locked');
                    return;
                  }
                  onChange(chooseCompanion(p, c.id));
                  repeatLine.current = 'companion-' + c.id;
                  setMessage(c.name + ' is coming with you');
                  void audio.line('companion-' + c.id);
                }}
              >
                <CompanionPicture id={c.id} />
                <strong>{c.name}</strong>
                <span>
                  {selected === c.id ? (
                    <Check />
                  ) : available ? (
                    <span className="pad-key a-key">A</span>
                  ) : (
                    <>
                      <LockKeyhole size={16} />
                      {c.id === 'puff' ? '🌱' : '🚀'}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <button
          className="companion-rest"
          data-game-choice
          aria-pressed={selected === null}
          onClick={() => {
            repeatLine.current = 'companion-rest';
            onChange(chooseCompanion(p, null));
            setMessage('Your friends are resting at home');
            void audio.line('companion-rest');
          }}
        >
          <Home /> Stay at home {selected === null && <Check />}
        </button>
        <output className="companion-message" aria-live="polite">
          {message}
        </output>
      </div>
    </div>
  );
}
