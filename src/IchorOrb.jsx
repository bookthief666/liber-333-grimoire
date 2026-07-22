import { useEffect, useRef, useState } from 'react';
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
  uniform vec2 u_resolution;
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
      p = turn * p * 2.03 + 13.7;
      amplitude *= 0.5;
    }
    return value;
  }

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  void main() {
    vec2 centered = (v_uv - 0.5) * 2.0;
    float radius = length(centered);
    float time = u_time * mix(1.0, 0.08, u_reduced_motion);

    float sphere = 1.0 - smoothstep(0.835, 0.895, radius);
    float nearSphere = 1.0 - smoothstep(0.90, 1.16, radius);
    float halo = nearSphere * (1.0 - sphere) * 0.42;

    if (sphere <= 0.001 && halo <= 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    float z = sqrt(max(0.0, 1.0 - min(radius * radius, 0.999)));
    vec3 normal = normalize(vec3(centered, z));

    float touchDistance = distance(v_uv, u_touch);
    float wave = sin(touchDistance * 66.0 - u_ripple_age * 15.0)
      * exp(-touchDistance * 7.2)
      * exp(-u_ripple_age * 1.35)
      * u_energy;

    vec2 refracted = centered;
    refracted += normal.xy * wave * 0.055;
    refracted += vec2(
      sin(time * 0.37 + centered.y * 4.0),
      cos(time * 0.29 + centered.x * 4.5)
    ) * 0.012;

    float currentA = fbm(refracted * 2.5 + vec2(time * 0.055, -time * 0.038));
    float currentB = fbm(refracted.yx * 4.2 + vec2(-time * 0.075, time * 0.045));
    float currentC = fbm(refracted * 8.0 + currentA * 2.4 - time * 0.025);

    float veins = smoothstep(0.52, 0.83, currentA * 0.78 + currentB * 0.42);
    float fineVeins = smoothstep(0.60, 0.88, currentC + currentA * 0.18);
    float abyssDepth = clamp(0.28 + currentA * 0.58 - radius * 0.16, 0.0, 1.0);

    vec3 voidBlack = vec3(0.0015, 0.0025, 0.009);
    vec3 deepIndigo = vec3(0.014, 0.010, 0.052);
    vec3 ichorTeal = vec3(0.028, 0.32, 0.27);
    vec3 sanguine = vec3(0.58, 0.018, 0.075);
    vec3 paleGold = vec3(0.92, 0.55, 0.20);

    vec3 color = mix(voidBlack, deepIndigo, abyssDepth * 0.72);
    color += ichorTeal * veins * 0.34;
    color += sanguine * fineVeins * (0.10 + u_energy * 0.16);

    float viewFacing = max(normal.z, 0.0);
    float fresnel = pow(1.0 - viewFacing, 3.2);
    vec3 lightDirection = normalize(vec3(-0.46, 0.58, 0.78));
    float liquidHighlight = pow(max(dot(normal, lightDirection), 0.0), 34.0);
    float broadHighlight = pow(max(dot(normal, lightDirection), 0.0), 5.0);

    color += vec3(0.62, 0.72, 0.92) * liquidHighlight * 0.85;
    color += vec3(0.10, 0.18, 0.27) * broadHighlight * 0.22;
    color += mix(ichorTeal, sanguine, 0.48) * fresnel * 0.58;

    vec2 sigilPoint = rotate2d(time * 0.035) * refracted;
    float outerRing = abs(length(sigilPoint) - 0.42);
    float innerRing = abs(length(sigilPoint) - 0.205);
    float centerRing = abs(length(sigilPoint) - 0.072);

    vec2 a = vec2(0.0, 0.34);
    vec2 b = vec2(-0.295, -0.17);
    vec2 c = vec2(0.295, -0.17);
    float triangle = min(
      segmentDistance(sigilPoint, a, b),
      min(segmentDistance(sigilPoint, b, c), segmentDistance(sigilPoint, c, a))
    );

    vec2 inversePoint = rotate2d(3.14159265) * sigilPoint;
    float inverseTriangle = min(
      segmentDistance(inversePoint, a * 0.72, b * 0.72),
      min(
        segmentDistance(inversePoint, b * 0.72, c * 0.72),
        segmentDistance(inversePoint, c * 0.72, a * 0.72)
      )
    );

    float sigilDistance = min(
      min(outerRing, innerRing),
      min(centerRing, min(triangle, inverseTriangle))
    );
    float sigil = 1.0 - smoothstep(0.006, 0.020, sigilDistance);
    float sigilReveal = 0.09 + u_energy * 0.74 + (0.5 + 0.5 * sin(time * 0.43)) * 0.035;
    color += mix(ichorTeal, paleGold, u_energy * 0.72) * sigil * sigilReveal * sphere;

    float touchCore = exp(-touchDistance * touchDistance * 150.0) * u_energy;
    color += vec3(0.88, 0.95, 1.0) * touchCore * 0.75;
    color += sanguine * abs(wave) * 0.26;

    float lowerShadow = smoothstep(-0.78, 0.36, centered.y);
    color *= mix(0.56, 1.0, lowerShadow);
    color *= sphere;

    vec3 haloColor = mix(vec3(0.04, 0.17, 0.19), sanguine, 0.34 + u_energy * 0.28);
    color += haloColor * halo;

    float alpha = clamp(sphere + halo * 0.76, 0.0, 1.0);
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
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });

    if (!gl) {
      setFallback(true);
      return undefined;
    }

    let program;
    let frame = 0;
    let resizeObserver;

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
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      touch: gl.getUniformLocation(program, 'u_touch'),
      time: gl.getUniformLocation(program, 'u_time'),
      rippleAge: gl.getUniformLocation(program, 'u_ripple_age'),
      energy: gl.getUniformLocation(program, 'u_energy'),
      reducedMotion: gl.getUniformLocation(program, 'u_reduced_motion'),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

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

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const startedAt = performance.now();
    const render = (now) => {
      resize();
      const ripple = rippleRef.current;
      const rippleAge = Math.max(0, (now - ripple.startedAt) / 1000);
      const energy = ripple.startedAt > 0 ? Math.exp(-rippleAge * 1.22) : 0;
      const reducedMotion =
        document.documentElement.classList.contains('liber-force-reduced-motion') ||
        (window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
          !document.documentElement.classList.contains('liber-force-full-motion'));

      gl.useProgram(program);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
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
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

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

  return (
    <div className="ichor-orb-stage">
      <div className="ichor-orb-aura" aria-hidden="true" />
      <button
        type="button"
        className={`ichor-orb ${fallback ? 'is-fallback' : ''}`}
        onPointerDown={disturb}
        onKeyDown={onKeyDown}
        aria-label="Living Ichor Orb. Touch the surface to disturb it."
        title="Disturb the Ichor"
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        <span className="ichor-orb-fallback" aria-hidden="true">
          <span>☉</span>
        </span>
      </button>
      <div className="ichor-orb-shadow" aria-hidden="true" />
    </div>
  );
}
