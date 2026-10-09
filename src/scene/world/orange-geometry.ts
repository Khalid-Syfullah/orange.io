import { BufferAttribute, BufferGeometry, SphereGeometry, Vector3 } from "three";
import { mulberry32 } from "./rng";

const W = 128; // width segments
const H = 96; // height segments (the equator is row H / 2)

export type OrangeGeometry = {
  /** The whole orange. */
  whole: BufferGeometry;
  /** The top (stem) half and the bottom half: same vertex buffers as `whole`, different index lists. */
  top: BufferGeometry;
  bottom: BufferGeometry;
  /** The equator ring, in order around the fruit, as [x, z] pairs (y = 0). */
  rim: [number, number][];
};

/**
 * An orange with natural asymmetry: a slightly flattened, lumpy sphere with a
 * navel dimple at each pole, displaced once from smooth low-frequency waves.
 * The halves are built by splitting the index list of the SAME displaced mesh,
 * so normals and uvs are identical across the cut and a closed orange is seamless.
 * Nothing is rebuilt while scrolling.
 */
export function buildOrange(): OrangeGeometry {
  const whole = new SphereGeometry(1, W, H);
  const pos = whole.attributes.position;
  const v = new Vector3();
  const rnd = mulberry32(8);
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r0 = v.length();
    const theta = Math.atan2(v.z, v.x);
    const phi = Math.acos(Math.min(1, Math.max(-1, v.y / r0))); // 0 at the top pole
    let r = 1;
    r += 0.013 * Math.sin(2 * theta + ph[0]) * Math.sin(phi * 2 + ph[1]);
    r += 0.008 * Math.sin(3 * theta + ph[2]) * Math.sin(phi * 3);
    r += 0.006 * Math.sin(5 * phi + ph[3]);
    r -= 0.07 * Math.exp(-Math.pow(phi / 0.2, 2)); // stem dimple
    r -= 0.035 * Math.exp(-Math.pow((Math.PI - phi) / 0.16, 2)); // navel
    v.multiplyScalar(r / r0);
    v.y *= 0.975; // slightly oblate
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  whole.computeVertexNormals();

  // split the triangles at the equator row (vertex index = row * (W + 1) + col)
  const index = whole.index!.array;
  const rowOf = (vi: number) => Math.floor(vi / (W + 1));
  const topIdx: number[] = [];
  const botIdx: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    const rows = [rowOf(index[t]), rowOf(index[t + 1]), rowOf(index[t + 2])];
    const max = Math.max(...rows);
    const min = Math.min(...rows);
    if (max <= H / 2) topIdx.push(index[t], index[t + 1], index[t + 2]);
    else if (min >= H / 2) botIdx.push(index[t], index[t + 1], index[t + 2]);
  }
  const half = (idx: number[]) => {
    const g = new BufferGeometry();
    g.setAttribute("position", whole.attributes.position);
    g.setAttribute("normal", whole.attributes.normal);
    g.setAttribute("uv", whole.attributes.uv);
    g.setIndex(new BufferAttribute(new Uint32Array(idx), 1));
    return g;
  };

  const rim: [number, number][] = [];
  for (let c = 0; c < W; c++) {
    const vi = (H / 2) * (W + 1) + c;
    rim.push([pos.getX(vi), pos.getZ(vi)]);
  }
  return { whole, top: half(topIdx), bottom: half(botIdx), rim };
}

/**
 * The cut face: concentric rings from the rim to the centre, y = 0, normal +y.
 * UV is polar in the ring parameter (so the texture's circle always meets the
 * real rim exactly): u,v = 0.5 + dir * s * 0.49.
 */
export function buildCutFace(rim: [number, number][], rings = 28): BufferGeometry {
  const n = rim.length;
  const positions: number[] = [0, 0, 0];
  const uvs: number[] = [0.5, 0.5];
  for (let r = 1; r <= rings; r++) {
    const s = r / rings;
    for (let i = 0; i < n; i++) {
      const [x, z] = rim[i];
      positions.push(x * s, 0, z * s);
      const a = Math.atan2(z, x);
      uvs.push(0.5 + Math.cos(a) * s * 0.49, 0.5 + Math.sin(a) * s * 0.49);
    }
  }
  const idx: number[] = [];
  const ring = (r: number, i: number) => 1 + (r - 1) * n + (i % n);
  for (let i = 0; i < n; i++) idx.push(0, ring(1, i + 1), ring(1, i)); // centre fan, facing +y
  for (let r = 1; r < rings; r++) {
    for (let i = 0; i < n; i++) {
      const a = ring(r, i);
      const b = ring(r, i + 1);
      const c = ring(r + 1, i);
      const d = ring(r + 1, i + 1);
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(positions.length).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  return g;
}
