// Puffy: a small round friend with long floppy ears who keeps beside the wanderer. While he walks, Puffy trots
// along on its stubby feet; when he runs, it can't keep up on foot, so it hops into the air, puffs itself up
// round with air and flies, flapping arms and ears, rising a little on every beat and sinking between them.
// When he slows down it lets the air out, drops, and lands with a squash that throws up a few leaves.
//
// Painted as he is: its body in three flat mixes with a grain (figure.js's paint), and covered in dabs pinned to
// it (pins.js) that ride on it as it moves, running round its round body and down its ears. It is on layer 1, so
// it casts a shadow with his. Its rig and clips (Idle, Walk, Fly) are public/figure/puffy.glb.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { pinDabs } from '../oilpaint/pins.js';
import { paint } from './figure.js';

// the palette it is painted with: light, half-tone, shade
// (a pale baby blue: its half-tone and shade stay soft and greyed, or the autumn light turns it to deep violet)
const FUR = [[0.88, 0.95, 1.0], [0.66, 0.78, 0.9], [0.4, 0.46, 0.6]];
const EAR_IN = [[1.0, 0.76, 0.8], [0.82, 0.52, 0.62], [0.44, 0.28, 0.42]];
const BLUSH = [[1.0, 0.6, 0.62], [0.86, 0.42, 0.5], [0.5, 0.25, 0.36]];
const FACE = [[0.2, 0.28, 0.46], [0.12, 0.17, 0.32], [0.06, 0.08, 0.18]];
const PAINTS = { Puffy_Body: FUR, Puffy_Ear: FUR, Puffy_Limb: FUR, Puffy_EarInner: EAR_IN, Puffy_Blush: BLUSH, Puffy_Face: FACE };

const T = {
  size: 0.7, // metres tall
  side: 1.05, // how far to his right it keeps
  behind: 0.35, // and how far back (further when flying)
  walkMax: 3.6, // the fastest it trots, m/s
  flyMax: 9.5,
  stride: 0.37, // metres a Walk loop carries it at its size, so the feet don't slide
  takeOff: 3.4, // he goes faster than this: up it goes
  settle: 2.2, // slower than this, and close: down it comes
  hover: 0.95, // how high above the ground it flaps to stay
  flap: 2.5, // up, m/s, on every beat
  floatFall: 5.5, // gravity while puffed up
  fall: 11, // and with the air let out
  earBack: 0.12, // radians the ears trail back for each m/s it goes (about 10° at a trot)
  earBackMax: 0.75,
};

const clamp = THREE.MathUtils.clamp;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * @param shared the paint's shared uniforms (sun, mist, shade, noise)
 * @param opts.blocked (x, z) => true where it can't walk (a trunk): it hops instead
 * @param opts.onLand (position, how hard) when it comes down from the air
 */
export async function createPuffy(shared, { base = './figure/', blocked = () => false, onLand = () => {} } = {}) {
  const gltf = await new GLTFLoader().loadAsync(base + 'puffy.glb');
  const model = gltf.scene;
  // (each paint of the model is its own mesh: body, ears, insides of the ears, limbs, cheeks, face)
  const meshes = {};
  model.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material?.name ?? 'Puffy_Body';
    meshes[name] = o;
    o.material = paint(shared, PAINTS[name] ?? FUR, { skinned: true, grain: name === 'Puffy_Face' ? 0.5 : 1.3 });
    o.layers.enable(1); // (in the picture his shadow is drawn from)
    o.frustumCulled = false;
  });
  model.scale.setScalar(T.size / 2); // (it was made 2 units tall)

  // group: where it is and which way it faces; body: its squash and stretch and lean, from the feet
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.add(model);
  group.add(body);

  // --- dabs pinned to it. Points are as it was made: 2 units tall, facing +z, its left at +x ---
  const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1), OUT = new THREE.Vector3(1, 0, 0);
  const parts = [];
  const part = (name, count, style) => meshes[name] && parts.push({ mesh: meshes[name], count, style });
  // round the body, as a painter goes round a ball, rising a little
  part('Puffy_Body', 380, (p, n) => {
    const round = new THREE.Vector3().crossVectors(UP, n);
    return { pal: 0, size: [0.04, 0.075], dir: round.lengthSq() < 0.04 ? FWD : round.normalize().add(new THREE.Vector3(0, 0.25, 0)) };
  });
  // down the ears: over the head their root runs outwards, then the rest hangs
  const along = (p) => (p.y > 1.62 ? new THREE.Vector3(Math.sign(p.x), -0.6, 0) : UP);
  part('Puffy_Ear', 200, (p) => ({ pal: 0, size: [0.035, 0.08], dir: along(p) }));
  part('Puffy_EarInner', 50, (p) => ({ pal: 1, size: [0.03, 0.065], dir: along(p) }));
  // arms run down, feet run forward
  part('Puffy_Limb', 110, (p) => ({ pal: 0, size: [0.035, 0.06], dir: p.y < 0.4 ? FWD : UP }));
  // a few soft touches of pink on the cheeks; the eyes and nose are left as they are, so the face stays clear
  part('Puffy_Blush', 16, () => ({ pal: 2, size: [0.03, 0.036], dir: OUT }));
  const pins = pinDabs(shared, [FUR, EAR_IN, BLUSH], parts);

  // the ears, root to tip, each side: blown back a little by its own speed, on top of whatever the clip does
  const bone = (name) => model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
  const ears = ['l', 'r'].map((s) => [1, 2, 3].map((k) => bone(`ear.${k}.${s}`)).filter(Boolean));
  const EAR_SHARE = [0.45, 0.33, 0.22]; // (how the sweep is shared down the ear: it bends, not just tips)
  const backward = new THREE.Vector3();
  const earAxis = new THREE.Vector3();
  const earDir = new THREE.Vector3();
  const here = new THREE.Vector3();
  const there = new THREE.Vector3();
  const parentQ = new THREE.Quaternion();
  const turnQ = new THREE.Quaternion();
  let earBack = 0, earBackV = 0;

  /** Turns each bone of each ear towards Puffy's back by its share of `angle`: hanging or spread, it goes back. */
  function sweepEars(angle) {
    group.updateMatrixWorld(true);
    body.getWorldQuaternion(parentQ);
    backward.set(0, 0, -1).applyQuaternion(parentQ);
    for (const chain of ears) {
      chain.forEach((b, k) => {
        // which way this piece of the ear points now (after the pieces above it have moved)
        b.getWorldPosition(here);
        if (chain[k + 1]) chain[k + 1].getWorldPosition(there).sub(here);
        else there.copy(here).sub(chain[k - 1].getWorldPosition(earDir));
        earAxis.crossVectors(there, backward);
        if (earAxis.lengthSq() < 1e-10) return;
        b.parent.getWorldQuaternion(parentQ);
        earAxis.normalize().applyQuaternion(parentQ.invert());
        b.quaternion.premultiply(turnQ.setFromAxisAngle(earAxis, angle * EAR_SHARE[k]));
        b.updateMatrixWorld(true);
      });
    }
  }

  const mixer = new THREE.AnimationMixer(model);
  const clip = (name) => gltf.animations.find((a) => a.name === name);
  const act = {};
  for (const name of ['Idle', 'Walk', 'Fly']) {
    act[name] = mixer.clipAction(clip(name));
    act[name].play();
    act[name].setEffectiveWeight(name === 'Idle' ? 1 : 0);
  }

  const pos = new THREE.Vector3();
  const vel = new THREE.Vector3();
  const want = new THREE.Vector3();
  let yaw = 0;
  let airborne = false; // off the ground: flying or falling
  let flying = false; // puffed up and flapping
  let flyW = 0; // how much of the Fly clip shows
  let calmFor = 0; // how long he has been slow and near: it lands after a moment of that
  let squash = 0, squashV = 0; // a spring: below 0 squashed flat, above stretched tall
  let tilt = 0, roll = 0;

  function hop(up) {
    airborne = true;
    vel.y = up;
    squashV += 3.5; // stretch as it leaves the ground
  }

  return {
    group,
    /** The dabs that ride on it: add these to the scene too. */
    dabs: pins.mesh,
    get flying() { return flying; },
    position: pos,

    /** Put it beside someone at once (after a teleport): x, z, his yaw (0 looks along +z). */
    place(x, z, leadYaw, groundAt) {
      const fx = Math.sin(leadYaw), fz = Math.cos(leadYaw);
      pos.set(x - fz * T.side, 0, z + fx * T.side);
      pos.y = groundAt(pos.x, pos.z);
      vel.set(0, 0, 0);
      yaw = leadYaw;
      airborne = flying = false;
      flyW = 0;
    },

    /**
     * @param lead { x, y, z, yaw, speed, vx, vz }: the one it follows; yaw 0 looks along +z
     * @param groundAt (x, z) => the land's height
     */
    update(dt, lead, groundAt) {
      if (dt <= 0) return;
      const fx = Math.sin(lead.yaw), fz = Math.cos(lead.yaw);
      // (his right, seen from behind him)
      const rx = -fz, rz = fx;
      const back = flying ? T.behind + 0.6 : T.behind;
      want.set(lead.x + rx * T.side - fx * back + lead.vx * 0.2, 0, lead.z + rz * T.side - fz * back + lead.vz * 0.2);
      const dx = want.x - pos.x, dz = want.z - pos.z;
      const far = Math.hypot(dx, dz);
      if (far > 30 || !Number.isFinite(far)) {
        this.place(lead.x, lead.z, lead.yaw, groundAt);
        return;
      }

      // take to the air when he runs, or when it has fallen behind; come down when he is slow and near
      const hurry = lead.speed > T.takeOff || far > 5;
      if (hurry) {
        calmFor = 0;
        if (!flying) {
          flying = true;
          if (!airborne) hop(4.6);
        }
      } else if (flying) {
        calmFor = lead.speed < T.settle && far < 2 ? calmFor + dt : 0;
        if (calmFor > 0.5) flying = false; // the air goes out of it, and it drops
      }

      // across the ground: towards its place, at his pace, no faster than it can go
      const max = airborne ? T.flyMax : T.walkMax;
      const gain = airborne ? 2.2 : 3;
      let vx = dx * gain + lead.vx, vz = dz * gain + lead.vz;
      const v = Math.hypot(vx, vz);
      if (v > max) { vx *= max / v; vz *= max / v; }
      if (far < 0.12 && lead.speed < 0.2) vx = vz = 0;
      const grip = 1 - Math.exp(-dt * (airborne ? 3 : 9));
      vel.x += (vx - vel.x) * grip;
      vel.z += (vz - vel.z) * grip;
      let nx = pos.x + vel.x * dt, nz = pos.z + vel.z * dt;
      // not into him
      const ox = nx - lead.x, oz = nz - lead.z, od = Math.hypot(ox, oz);
      if (od < 0.6 && od > 1e-4) { nx = lead.x + (ox / od) * 0.6; nz = lead.z + (oz / od) * 0.6; }
      // where it can't walk, it hops
      if (!airborne && blocked(nx, nz)) hop(4.2);
      pos.x = nx; pos.z = nz;

      // up and down
      const ground = groundAt(pos.x, pos.z);
      if (!airborne) {
        pos.y = ground;
        vel.y = 0;
      } else {
        vel.y -= (flying ? T.floatFall : T.fall) * dt;
        // a beat of the arms whenever it has sunk to its height: Kirby's way of staying up
        if (flying && pos.y < ground + T.hover && vel.y < 0.4) {
          vel.y = T.flap + (ground + T.hover - pos.y) * 1.5;
          squashV += 1.2;
        }
        pos.y += vel.y * dt;
        if (pos.y <= ground) {
          const hit = -vel.y;
          pos.y = ground;
          if (flying) vel.y = T.flap; // skimmed the ground: beat straight back up
          else {
            airborne = false;
            vel.y = 0;
            squashV -= Math.min(6, 1 + hit * 0.9); // lands, and squashes
            onLand(pos, hit);
          }
        }
      }

      // facing: where it goes, or, standing (or shuffling the last bit into its place), the way he faces
      const flat = Math.hypot(vel.x, vel.z);
      const going = flat > 0.25 && (far > 0.6 || lead.speed > 0.5);
      const face = going ? Math.atan2(vel.x, vel.z) : lead.yaw;
      const turn = wrap(face - yaw);
      yaw += turn * (1 - Math.exp(-dt * (going ? 10 : 4)));

      // squash and stretch: a spring that settles back to round
      squashV += (-squash * 160 - squashV * 11) * dt;
      squash = clamp(squash + squashV * dt, -0.4, 0.35);
      // leaning into its speed, into its turns
      tilt += (clamp(flat * (airborne ? 0.05 : 0.035), 0, 0.35) - tilt) * (1 - Math.exp(-dt * 6));
      roll += (clamp(-turn * flat * 0.06, -0.3, 0.3) - roll) * (1 - Math.exp(-dt * 6));

      group.position.copy(pos);
      group.rotation.set(0, yaw, 0);
      body.rotation.set(tilt, 0, roll);
      body.scale.set(1 - squash * 0.5, 1 + squash, 1 - squash * 0.5);

      // the clips: Idle and Walk on the ground, by its pace; Fly in the air
      flyW += ((flying ? 1 : 0) - flyW) * (1 - Math.exp(-dt * (flying ? 10 : 5)));
      const walkW = airborne ? 0 : clamp((flat - 0.1) / 0.4, 0, 1);
      const ground01 = 1 - flyW;
      act.Fly.setEffectiveWeight(flyW);
      act.Walk.setEffectiveWeight(ground01 * walkW);
      act.Idle.setEffectiveWeight(ground01 * (1 - walkW));
      act.Walk.timeScale = clamp(flat / T.stride, 0.8, 4.2);
      act.Fly.timeScale = flying ? 1.6 : 0.6;
      mixer.update(dt);

      // Its ears trail behind it as it goes, more the faster, gently: on a soft spring, so they lag a moment
      // when it sets off and swing forward a little when it stops. Falling lifts them; flapping up presses them.
      const earWant = clamp(flat * T.earBack, 0, T.earBackMax) + (airborne ? clamp(-vel.y * 0.05, -0.15, 0.25) : 0);
      earBackV += ((earWant - earBack) * 55 - earBackV * 6.5) * dt;
      earBack += earBackV * dt;
      if (Math.abs(earBack) > 1e-3) sweepEars(earBack);

      // the dabs go where the skin under them has gone
      group.updateMatrixWorld(true);
      pins.update();
    },
  };
}
