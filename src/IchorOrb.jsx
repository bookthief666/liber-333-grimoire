import { useEffect, useRef, useState } from 'react';
import unicursalHexagramUrl from './assets/crowley-unicursal-hexagram.svg';
import './ichorOrb.css';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 v_uv;
  uniform vec2 u_touch;
  uniform float u_time;
  uniform float u_ripple_age;
  uniform float u_energy;
  uniform float u_reduced_motion;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise2(p);
      p = turn * p * 2.01 + 13.7;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 centered = (v_uv - 0.5) * 2.0;
    float radius = length(centered);
    float motionRate = mix(1.0, 0.055, u_reduced_motion);
    float time = u_time * motionRate;

    float sphere = 1.0 - smoothstep(0.838, 0.896, radius);
    float nearSphere = 1.0 - smoothstep(0.90, 1.14, radius);
    float halo = nearSphere * (1.0 - sphere) * 0.30;

    if (sphere <= 0.001 && halo <= 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float z = sqrt(max(0.0, 1.0 - min(radius * radius, 0.999)));
    vec3 normal = normalize(vec3(centered, z));

    float touchDistance = distance(v_uv, u_touch);
    float wave = sin(touchDistance * 64.0 - u_ripple_age * 14.0)
      * exp(-touchDistance * 7.8)
      * exp(-u_ripple_age * 1.46)
      * u_energy;

    vec2 refracted = centered;
    refracted += normal.xy * wave * 0.052;
    refracted += vec2(
      sin(time * 0.25 + centered.y * 3.6),
      cos(time * 0.21 + centered.x * 3.9)
    ) * 0.008;

    vec2 warp = vec2(
      fbm(refracted * 1.52 + vec2(time * 0.030, -time * 0.020)),
      fbm(refracted * 1.52 + vec2(7.3, -4.8) + vec2(-time * 0.024, time * 0.028))
    ) - 0.5;

    vec2 flowUv = refracted + warp * 0.46;
    float currentA = fbm(flowUv * 2.05 + vec2(time * 0.024, -time * 0.016));
    float currentB = fbm(flowUv * 3.75 + vec2(-time * 0.035, time * 0.023));
    float currentC = fbm(flowUv * 7.1 + warp * 1.35 - time * 0.018);

    float ribbon = 1.0 - smoothstep(0.07, 0.20, abs(currentA - (0.53 + currentB * 0.065)));
    float fineRibbon = 1.0 - smoothstep(0.035, 0.11, abs(currentC - (0.57 + currentA * 0.045)));
    float abyssDepth = clamp(0.13 + currentA * 0.39 + currentB * 0.09 - radius * 0.11, 0.0, 1.0);

    vec3 voidBlack = vec3(0.0010, 0.0017, 0.0060);
    vec3 deepIndigo = vec3(0.012, 0.009, 0.041);
    vec3 ichorTeal = vec3(0.022, 0.245, 0.215);
    vec3 sanguine = vec3(0.47, 0.012, 0.052);

    vec3 color = mix(voidBlack, deepIndigo, abyssDepth * 0.50);
    color += ichorTeal * ribbon * (0.095 + currentB * 0.035);
    color += sanguine * fineRibbon * (0.030 + u_energy * 0.085);

    float viewFacing = max(normal.z, 0.0);
    float fresnel = pow(1.0 - viewFacing, 3.45);
    vec3 lightDirection = normalize(vec3(-0.48, 0.60, 0.76));
    float lightFacing = max(dot(normal, lightDirection), 0.0);
    float brokenHighlight = 0.74 + (currentC - 0.5) * 0.34;
    float liquidHighlight = pow(lightFacing, 38.0) * brokenHighlight;
    float broadHighlight = pow(lightFacing, 5.4);

    color += vec3(0.48, 0.61, 0.78) * liquidHighlight * 0.48;
    color += vec3(0.070, 0.12, 0.19) * broadHighlight * 0.14;
    color += mix(ichorTeal, sanguine, 0.42) * fresnel * 0.31;

    float touchCore = exp(-touchDistance * touchDistance * 155.0) * u_energy;
    color += vec3(0.72, 0.84, 0.95) * touchCore * 0.56;
    color += sanguine * abs(wave) * 0.17;

    float lowerShadow = smoothstep(-0.80, 0.30, centered.y);
    color *= mix(0.48, 1.0, lowerShadow);
    color *= sphere;

    vec3 haloColor = mix(vec3(0.025, 0.10, 0.11), sanguine, 0.28 + u_energy * 0.22);
    color += haloColor * halo;

    float alpha = clamp(sphere + halo * 0.62, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Unknown shader error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export default function IchorOrb() {
  const canvasRef = useRef(null);
  const rippleRef = useRef({ x: 0.5, y: 0.5, startedAt: -10000 });
  const awakenTimerRef = useRef(null);
  const [fallback, setFallback] = useState(false);
  const [awakened, setAwakened] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: false,
    });

    if (!gl) {
      setFallback(true);
      return undefined;
    }

    let program;
    let frame = 0;
    let resizeObserver;
    let contextLost = false;

    const onContextLost = (event) => {
      event.preventDefault();
      contextLost = true;
      cancelAnimationFrame(frame);
      setFallback(true);
    };

    canvas.addEventListener('webglcontextlost', onContextLost, false);

    try {
      const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || 'Ichor shader link failed.');
      }
    } catch (error) {
      console.warn('Ichor Orb WebGL fallback:', error);
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
      setFallback(true);
      return undefined;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    gl.useProgram(program);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      touch: gl.getUniformLocation(program, 'u_touch'),
      time: gl.getUniformLocation(program, 'u_time'),
      rippleAge: gl.getUniformLocation(program, 'u_ripple_age'),
      energy: gl.getUniformLocation(program, 'u_energy'),
      reducedMotion: gl.getUniformLocation(program, 'u_reduced_motion'),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(2, Math.round(rect.width * dpr));
      const height = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    const startedAt = performance.now();
    const render = (now) => {
      if (contextLost) return;
      resize();
      const ripple = rippleRef.current;
      const rippleAge = Math.max(0, (now - ripple.startedAt) / 1000);
      const energy = ripple.startedAt > 0 ? Math.exp(-rippleAge * 1.22) : 0;
      const reducedMotion =
        document.documentElement.classList.contains('liber-force-reduced-motion') ||
        (window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
          !document.documentElement.classList.contains('liber-force-full-motion'));

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniforms.touch, ripple.x, ripple.y);
      gl.uniform1f(uniforms.time, (now - startedAt) / 1000);
      gl.uniform1f(uniforms.rippleAge, rippleAge);
      gl.uniform1f(uniforms.energy, energy);
      gl.uniform1f(uniforms.reducedMotion, reducedMotion ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  useEffect(
    () => () => {
      if (awakenTimerRef.current) window.clearTimeout(awakenTimerRef.current);
    },
    [],
  );

  const disturb = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX ?? rect.left + rect.width / 2;
    const clientY = event.clientY ?? rect.top + rect.height / 2;
    rippleRef.current = {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, 1 - (clientY - rect.top) / rect.height)),
      startedAt: performance.now(),
    };

    setAwakened(true);
    if (awakenTimerRef.current) window.clearTimeout(awakenTimerRef.current);
    awakenTimerRef.current = window.setTimeout(() => setAwakened(false), 2400);

    try {
      navigator.vibrate?.(18);
    } catch {
      // Haptics are optional.
    }
  };

  const onKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    disturb({});
  };

  const sigilStyle = {
    '--ichor-sigil-mask': `url("${unicursalHexagramUrl}")`,
  };

  return (
    <div className="ichor-orb-stage">
      <div className="ichor-orb-aura" aria-hidden="true" />
      <button
        type="button"
        className={`ichor-orb ${fallback ? 'is-fallback' : ''} ${awakened ? 'is-awakened' : ''}`}
        onPointerDown={disturb}
        onKeyDown={onKeyDown}
        aria-label="Living Ichor Orb. Touch the surface to awaken the unicursal hexagram."
        title="Awaken the Ichor"
        style={sigilStyle}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="ichor-orb-sigil" aria-hidden="true" />
        <span className="ichor-orb-surface" aria-hidden="true" />
        <span className="ichor-orb-fallback" aria-hidden="true">
          <span className="ichor-orb-fallback-sigil" />
        </span>
      </button>
      <div className="ichor-orb-shadow" aria-hidden="true" />
    </div>
  );
}
