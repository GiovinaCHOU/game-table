// 大富翁立體角色：程式生成的關節角色＋動作（走路、待機、開心、沮喪、倒地）
(function (root) {
  const C = {};
  const M = (T, c, e) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, e || {}));

  function limb(T, mat, len, r, x, y, z) { // 從關節往下垂的手腳
    const pivot = new T.Group(); pivot.position.set(x, y, z);
    const m = new T.Mesh(new T.CapsuleGeometry(r, len, 4, 8), mat); m.position.y = -len / 2 - r * 0.5; m.castShadow = true; pivot.add(m);
    return pivot;
  }
  function mesh(T, geo, mat, x, y, z, parent) { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; }

  // ---------- 人形骨架 ----------
  function humanoid(T, o) {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const sc = o.scale || 1;
    const legL = limb(T, o.legMat, 0.26, o.limbR || 0.055, -0.075, 0.42, 0), legR = limb(T, o.legMat, 0.26, o.limbR || 0.055, 0.075, 0.42, 0);
    const torso = mesh(T, new T.CapsuleGeometry(o.torsoR || 0.13, 0.22, 4, 10), o.bodyMat, 0, 0.6, 0, body); torso.scale.set(1, 1, 0.75);
    const armL = limb(T, o.armMat || o.bodyMat, 0.22, (o.limbR || 0.055) * 0.85, -0.18, 0.76, 0), armR = limb(T, o.armMat || o.bodyMat, 0.22, (o.limbR || 0.055) * 0.85, 0.18, 0.76, 0);
    const handR = new T.Group(); handR.position.y = -0.3; armR.add(handR);
    const handL = new T.Group(); handL.position.y = -0.3; armL.add(handL);
    const head = new T.Group(); head.position.y = 0.98; body.add(head);
    const skull = mesh(T, new T.SphereGeometry(o.headR || 0.13, 16, 12), o.headMat, 0, 0, 0, head);
    if (o.eyes !== false) { const em = o.eyeMat || M(T, '#111111', { roughness: 0.2 }); [-0.045, 0.045].forEach(x => mesh(T, new T.SphereGeometry(0.018, 8, 6), em, x, 0.015, (o.headR || 0.13) * 0.92, head)); }
    body.add(legL, legR, armL, armR);
    g.scale.setScalar(sc);
    return { g, body, head, skull, legs: [legL, legR], arms: [armL, armR], handR, handL, torso, kind: 'biped' };
  }
  // ---------- 四足骨架 ----------
  function quadruped(T, o) {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const L = o.len || 0.5, H = o.height || 0.32, W = o.wide || 0.22;
    const trunk = mesh(T, new T.SphereGeometry(0.5, 16, 12), o.bodyMat, 0, H + 0.1, 0, body); trunk.scale.set(W * 1.9, (o.bodyH || 0.38), L * 1.6);
    const legs = [];
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => { const lg = limb(T, o.legMat || o.bodyMat, H - 0.08, o.legR || 0.045, sx * W * 0.55, H + 0.02, sz * L * 0.45); body.add(lg); legs.push(lg); });
    const head = new T.Group(); head.position.set(0, H + 0.2 + (o.neck || 0), L * 0.75); body.add(head);
    const skull = mesh(T, new T.SphereGeometry(o.headR || 0.13, 14, 12), o.headMat || o.bodyMat, 0, 0, 0, head);
    if (o.snout) { const sn = mesh(T, new T.SphereGeometry(o.snout, 12, 10), o.snoutMat || o.headMat || o.bodyMat, 0, -0.03, (o.headR || 0.13) * 0.85, head); sn.scale.z = o.snoutLen || 1.2; }
    const em = M(T, '#0d0d0d', { roughness: 0.15 }); [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.02, 8, 6), em, s * (o.headR || 0.13) * 0.5, 0.04, (o.headR || 0.13) * 0.82, head));
    let tail = null; if (o.tail) { tail = new T.Group(); tail.position.set(0, H + 0.15, -L * 0.75); body.add(tail); const tm = mesh(T, new T.CapsuleGeometry(o.tail.r, o.tail.len, 4, 8), o.tail.mat || o.bodyMat, 0, 0, -o.tail.len / 2, tail); tm.rotation.x = Math.PI / 2 + (o.tail.lift || 0.4); }
    return { g, body, head, skull, legs, arms: [], tail, kind: 'quad' };
  }

  // ---------- 各主題角色 ----------
  function ragnarok(T, i, color) {
    const skin = M(T, '#e6c7a6'), robe = M(T, '#f4efe4', { roughness: 0.8 }), trim = M(T, color), gold = M(T, '#d4af37', { metalness: 0.9, roughness: 0.25 });
    if (i === 4) { // 芬里爾：巨狼
      const r = quadruped(T, { bodyMat: M(T, '#6f747c', { roughness: 0.9 }), headR: 0.15, snout: 0.08, snoutLen: 1.8, len: 0.55, height: 0.36, tail: { r: 0.05, len: 0.35, lift: 0.9 } });
      [-1, 1].forEach(s => { const e = mesh(T, new T.ConeGeometry(0.05, 0.12, 4), r.skull.material, s * 0.08, 0.14, -0.02, r.head); e.rotation.z = -s * 0.2; });
      const chain = mesh(T, new T.TorusGeometry(0.15, 0.025, 6, 16), gold, 0, -0.08, 0.02, r.head); chain.rotation.x = Math.PI / 2.4;
      return r;
    }
    const r = humanoid(T, { bodyMat: robe, legMat: skin, armMat: skin, headMat: skin });
    const sash = mesh(T, new T.TorusGeometry(0.13, 0.025, 6, 18), trim, 0, 0.62, 0, r.body); sash.rotation.set(Math.PI / 2.6, 0, 0.5);
    const hair = (c) => { const h = mesh(T, new T.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), M(T, c, { roughness: 0.9 }), 0, 0.02, -0.01, r.head); return h; };
    if (i === 0) { hair('#f2f2f2'); mesh(T, new T.ConeGeometry(0.09, 0.2, 10), M(T, '#f5f5f5', { roughness: 1 }), 0, -0.12, 0.08, r.head).rotation.x = Math.PI; const b = mesh(T, new T.ConeGeometry(0.035, 0.32, 4), M(T, '#fff1a8', { emissive: '#ffd84a', emissiveIntensity: 1.5 }), 0, 0, 0, r.handR); b.rotation.z = 0.3; }
    if (i === 1) { hair('#d9a441'); const cape = mesh(T, new T.PlaneGeometry(0.34, 0.5), M(T, '#a3201c', { side: T.DoubleSide }), 0, 0.6, -0.11, r.body); cape.rotation.x = 0.12; const hm = new T.Group(); r.handR.add(hm); mesh(T, new T.CylinderGeometry(0.015, 0.015, 0.22, 6), M(T, '#5a3d22'), 0, 0, 0, hm); mesh(T, new T.BoxGeometry(0.12, 0.08, 0.08), M(T, '#9aa0a6', { metalness: 0.9, roughness: 0.3 }), 0, -0.12, 0, hm); }
    if (i === 2) { mesh(T, new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 0.02, 0, r.head); mesh(T, new T.BoxGeometry(0.03, 0.1, 0.24), M(T, '#9b1c1c'), 0, 0.16, 0, r.head); mesh(T, new T.CylinderGeometry(0.01, 0.01, 0.8, 6), M(T, '#8a6a3a'), 0, 0.1, 0, r.handR); const sh = mesh(T, new T.CylinderGeometry(0.12, 0.12, 0.02, 20), gold, 0, 0, 0.04, r.handL); sh.rotation.x = Math.PI / 2; }
    if (i === 3) { hair('#3d5a6c'); mesh(T, new T.ConeGeometry(0.1, 0.18, 10), M(T, '#3d5a6c', { roughness: 1 }), 0, -0.12, 0.08, r.head).rotation.x = Math.PI; const tr = new T.Group(); r.handR.add(tr); mesh(T, new T.CylinderGeometry(0.012, 0.012, 0.8, 6), gold, 0, 0.1, 0, tr); [-0.04, 0, 0.04].forEach(x => mesh(T, new T.ConeGeometry(0.012, 0.09, 4), gold, x, 0.54, 0, tr)); mesh(T, new T.TorusGeometry(0.11, 0.015, 6, 16), gold, 0, 0.1, 0, r.head).rotation.x = Math.PI / 2; }
    if (i === 5) { r.skull.material = M(T, '#6b4f2a'); mesh(T, new T.ConeGeometry(0.05, 0.12, 6), M(T, '#d9a441'), 0, -0.02, 0.15, r.head).rotation.x = Math.PI / 2; const sun = mesh(T, new T.CircleGeometry(0.13, 24), M(T, '#ffb703', { emissive: '#ff8c00', emissiveIntensity: 1.6, side: T.DoubleSide }), 0, 0.25, -0.05, r.head); void sun; }
    if (i === 6) { hair('#3b2a1a'); for (let k = 0; k < 8; k++) mesh(T, new T.SphereGeometry(0.025, 6, 6), M(T, '#6a2c70'), Math.cos(k / 8 * 6.28) * 0.13, 0.07, Math.sin(k / 8 * 6.28) * 0.13, r.head); mesh(T, new T.CylinderGeometry(0.04, 0.025, 0.07, 10), gold, 0, 0.02, 0, r.handR); }
    if (i === 7) { hair('#4a3321'); r.torso.material = M(T, '#6b4a2e', { roughness: 0.9 }); mesh(T, new T.BoxGeometry(0.02, 0.35, 0.04), M(T, '#c0c6cc', { metalness: 0.9, roughness: 0.2 }), 0, -0.1, 0.02, r.handR); const sh = mesh(T, new T.CylinderGeometry(0.1, 0.1, 0.02, 16), M(T, '#7a5230'), 0, 0, 0.04, r.handL); sh.rotation.x = Math.PI / 2; }
    return r;
  }
  function cyber(T, i, color) {
    const skin = M(T, '#c9a38a'), jacket = M(T, '#34323f', { roughness: 0.3, metalness: 0.45 }), pants = M(T, '#111018'), neon = M(T, color, { emissive: color, emissiveIntensity: 1.6 });
    const r = humanoid(T, { bodyMat: jacket, legMat: pants, armMat: jacket, headMat: skin });
    const strip = mesh(T, new T.BoxGeometry(0.015, 0.22, 0.01), neon, 0.06, 0.62, 0.1, r.body); void strip;
    const hair = (c, e) => mesh(T, new T.SphereGeometry(0.137, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), M(T, c, e || { roughness: 0.6 }), 0, 0.02, -0.01, r.head);
    if (i === 0) { hair('#141414'); r.arms[1].children[0].material = M(T, '#8a8f99', { metalness: 0.95, roughness: 0.2, emissive: color, emissiveIntensity: 0.25 }); mesh(T, new T.BoxGeometry(0.05, 0.015, 0.01), neon, 0.06, 0.03, 0.125, r.head); }
    if (i === 1) { const hood = mesh(T, new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.6), jacket, 0, 0.01, -0.02, r.head); void hood; mesh(T, new T.BoxGeometry(0.2, 0.04, 0.03), M(T, '#00e5ff', { emissive: '#00e5ff', emissiveIntensity: 2 }), 0, 0.02, 0.12, r.head); }
    if (i === 2) { for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.02, 0.12, 4), M(T, '#ff2e88', { emissive: '#ff2e88', emissiveIntensity: 0.8 }), 0, 0.13, -0.08 + k * 0.04, r.head); const gt = mesh(T, new T.BoxGeometry(0.14, 0.34, 0.03), M(T, '#b5121b', { metalness: 0.4 }), 0.02, 0.62, -0.14, r.body); gt.rotation.z = 0.5; }
    if (i === 3) { const chrome = M(T, '#c7ccd6', { metalness: 1, roughness: 0.12 }); r.skull.material = chrome; r.torso.material = chrome; r.legs.concat(r.arms).forEach(l => l.children[0].material = chrome); r.head.children.filter(c => c.geometry && c.geometry.parameters && c.geometry.parameters.radius === 0.018).forEach(e => e.material = M(T, color, { emissive: color, emissiveIntensity: 2.5 })); }
    if (i === 4) { r.torso.material = M(T, '#e9eef2', { roughness: 0.7 }); r.arms.forEach(a => a.children[0].material = r.torso.material); hair('#2b2b2b'); mesh(T, new T.BoxGeometry(0.12, 0.06, 0.02), M(T, '#7fd1c7'), 0, -0.04, 0.12, r.head); }
    if (i === 5) { const hm = mesh(T, new T.SphereGeometry(0.16, 16, 12), M(T, '#1b1b22', { metalness: 0.6, roughness: 0.2 }), 0, 0.01, 0, r.head); void hm; const v = mesh(T, new T.SphereGeometry(0.162, 16, 8, -0.9, 1.8, 1.0, 0.7), M(T, color, { emissive: color, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.1 }), 0, 0.01, 0, r.head); void v; }
    if (i === 6) { hair(color, { emissive: color, emissiveIntensity: 1.2, roughness: 0.4 }); mesh(T, new T.CylinderGeometry(0.012, 0.012, 0.12, 6), M(T, '#d0d0d0', { metalness: 1 }), 0, 0.05, 0, r.handR); mesh(T, new T.SphereGeometry(0.025, 8, 6), M(T, '#333'), 0, 0.12, 0, r.handR); }
    if (i === 7) { const coat = mesh(T, new T.CylinderGeometry(0.15, 0.22, 0.5, 12, 1, true), M(T, '#2a0d10', { side: T.DoubleSide }), 0, 0.5, 0, r.body); void coat; mesh(T, new T.CylinderGeometry(0.16, 0.16, 0.02, 16), M(T, '#111'), 0, 0.09, 0, r.head); mesh(T, new T.CylinderGeometry(0.1, 0.11, 0.1, 16), M(T, '#111'), 0, 0.15, 0, r.head); mesh(T, new T.TorusGeometry(0.1, 0.012, 6, 20), M(T, '#ffd166', { metalness: 1, roughness: 0.2 }), 0, 0.74, 0.04, r.body).rotation.x = 1.3; }
    return r;
  }
  function animal(T, i, color) {
    const fur = (c) => M(T, c, { roughness: 0.95 });
    if (i === 0) { const r = quadruped(T, { bodyMat: fur('#c99a52'), headR: 0.13, snout: 0.07, len: 0.52, height: 0.36, tail: { r: 0.025, len: 0.35, lift: 0.2 } }); const mane = mesh(T, new T.SphereGeometry(0.2, 14, 10), fur('#7a4a1e'), 0, 0, -0.04, r.head); mane.scale.z = 0.7; return r; }
    if (i === 1) { const r = quadruped(T, { bodyMat: fur('#cbbba4'), headR: 0.1, snout: 0.05, len: 0.3, height: 0.18, wide: 0.16, bodyH: 0.3, tail: { r: 0.05, len: 0.02 } }); [-1, 1].forEach(s => { const e = mesh(T, new T.CapsuleGeometry(0.025, 0.2, 4, 8), r.skull.material, s * 0.04, 0.18, -0.02, r.head); e.rotation.z = -s * 0.15; }); return r; }
    if (i === 2) { const r = quadruped(T, { bodyMat: fur('#7d756c'), headR: 0.1, snout: 0.045, snoutLen: 1.5, len: 0.36, height: 0.22, wide: 0.17, tail: { r: 0.05, len: 0.28, lift: 0.5 } }); mesh(T, new T.BoxGeometry(0.17, 0.04, 0.02), fur('#1d1a17'), 0, 0.03, 0.09, r.head); [-1, 1].forEach(s => mesh(T, new T.ConeGeometry(0.035, 0.07, 4), r.skull.material, s * 0.06, 0.1, -0.01, r.head)); return r; }
    if (i === 3) { const r = quadruped(T, { bodyMat: fur('#7f7183'), headR: 0.15, snout: 0.12, snoutLen: 0.8, len: 0.55, height: 0.26, wide: 0.3, bodyH: 0.48, legR: 0.07, tail: { r: 0.02, len: 0.1 } }); [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.03, 8, 6), r.skull.material, s * 0.08, 0.12, -0.04, r.head)); return r; }
    if (i === 4) { const r = quadruped(T, { bodyMat: fur('#7a4a2c'), headR: 0.1, snout: 0.05, len: 0.38, height: 0.2, wide: 0.2, tail: { r: 0.08, len: 0.18, lift: -0.3, mat: fur('#3c2a1e') } }); mesh(T, new T.BoxGeometry(0.04, 0.04, 0.01), M(T, '#f2e3b3'), 0, -0.07, 0.14, r.head); if (r.tail) r.tail.children[0].scale.set(1.8, 1, 0.35); return r; }
    if (i === 5) { const r = quadruped(T, { bodyMat: M(T, '#4e6338', { roughness: 0.5 }), headR: 0.09, snout: 0.07, snoutLen: 3.2, len: 0.7, height: 0.14, wide: 0.2, bodyH: 0.18, legR: 0.04, tail: { r: 0.06, len: 0.6, lift: -0.15 } }); for (let k = 0; k < 6; k++) mesh(T, new T.ConeGeometry(0.025, 0.05, 4), M(T, '#3b4d2a'), 0, 0.23, -0.4 + k * 0.13, r.body); return r; }
    if (i === 6) { const r = quadruped(T, { bodyMat: fur('#5a3b26'), headR: 0.15, snout: 0.07, len: 0.48, height: 0.32, wide: 0.28, bodyH: 0.46, legR: 0.07, tail: { r: 0.03, len: 0.04 } }); [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.04, 8, 6), r.skull.material, s * 0.1, 0.12, -0.02, r.head)); return r; }
    // 猴子：人形＋長尾巴
    const r = humanoid(T, { bodyMat: fur('#7d5230'), legMat: fur('#7d5230'), headMat: fur('#7d5230'), scale: 0.85 });
    mesh(T, new T.SphereGeometry(0.09, 12, 10), M(T, '#d7b48a'), 0, -0.02, 0.07, r.head).scale.z = 0.6;
    [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.045, 8, 6), M(T, '#d7b48a'), s * 0.14, 0.02, 0, r.head));
    const tail = new T.Group(); tail.position.set(0, 0.45, -0.1); r.body.add(tail); const tm = mesh(T, new T.TorusGeometry(0.16, 0.02, 6, 16, Math.PI * 1.3), r.torso.material, 0, 0.1, -0.12, tail); tm.rotation.y = Math.PI / 2; r.tail = tail;
    return r;
  }
  function alien(T, i, color) {
    // H.R. Giger 風格：生物機械、骨白＋濕黑、拉長頭顱、肋骨、尾巴
    const black = M(T, '#2c322c', { roughness: 0.22, metalness: 0.7 }), bone = M(T, '#bdb59c', { roughness: 0.35, metalness: 0.2 }), acc = M(T, color, { emissive: color, emissiveIntensity: 0.7, roughness: 0.3 });
    if (i === 3) { // 黏液族：會抖動的半透明團塊
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const blob = mesh(T, new T.SphereGeometry(0.3, 20, 16), M(T, color, { transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 }), 0, 0.3, 0, body);
      const core = mesh(T, new T.IcosahedronGeometry(0.1, 0), black, 0, 0.3, 0, body); void core;
      const head = new T.Group(); head.position.y = 0.45; body.add(head);
      [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.035, 8, 6), M(T, '#0a0a0a', { roughness: 0.05 }), s * 0.08, 0, 0.24, head));
      return { g, body, head, skull: blob, legs: [], arms: [], kind: 'blob', blob };
    }
    if (i === 5) { // 水母族：漂浮的鐘形＋觸手
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const bell = mesh(T, new T.SphereGeometry(0.28, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), M(T, color, { transparent: true, opacity: 0.6, emissive: color, emissiveIntensity: 0.6, side: T.DoubleSide }), 0, 0.7, 0, body);
      const legs = []; for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; const p = limb(T, M(T, color, { transparent: true, opacity: 0.5, emissive: color, emissiveIntensity: 0.4 }), 0.45, 0.018, Math.cos(a) * 0.15, 0.7, Math.sin(a) * 0.15); body.add(p); legs.push(p); }
      const head = new T.Group(); head.position.y = 0.8; body.add(head);
      return { g, body, head, skull: bell, legs, arms: [], kind: 'float' };
    }
    const r = humanoid(T, { bodyMat: black, legMat: black, armMat: black, headMat: black, eyes: false, limbR: 0.035, torsoR: 0.1 });
    // 肋骨與脊椎
    for (let k = 0; k < 4; k++) { const rb = mesh(T, new T.TorusGeometry(0.11, 0.012, 6, 14, Math.PI * 1.2), bone, 0, 0.52 + k * 0.07, 0, r.body); rb.rotation.set(Math.PI / 2, 0, Math.PI * 1.4); }
    for (let k = 0; k < 6; k++) mesh(T, new T.SphereGeometry(0.03, 8, 6), bone, 0, 0.45 + k * 0.08, -0.1, r.body);
    // 尾巴
    const tail = new T.Group(); tail.position.set(0, 0.45, -0.1); r.body.add(tail);
    for (let k = 0; k < 7; k++) mesh(T, new T.SphereGeometry(0.035 - k * 0.003, 8, 6), k % 2 ? bone : black, 0, -k * 0.04, -k * 0.07, tail);
    r.tail = tail;
    // 拉長頭顱
    r.skull.scale.set(0.85, 0.9, 1);
    const dome = mesh(T, new T.CapsuleGeometry(0.1, 0.28, 6, 12), black, 0, 0.08, -0.16, r.head); dome.rotation.x = -1.15;
    const jaw = mesh(T, new T.BoxGeometry(0.08, 0.03, 0.06), bone, 0, -0.08, 0.1, r.head); void jaw;
    for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.006, 0.03, 3), bone, -0.03 + k * 0.015, -0.065, 0.13, r.head).rotation.x = Math.PI;
    if (i === 0) { r.skull.scale.set(1.25, 1.1, 1); [-1, 1].forEach(s => { const e = mesh(T, new T.SphereGeometry(0.04, 10, 8), M(T, '#050505', { roughness: 0.02, metalness: 0.5 }), s * 0.055, 0.02, 0.1, r.head); e.scale.set(1, 1.5, 0.6); e.rotation.z = s * 0.4; }); }
    if (i === 1) { for (let k = 0; k < 6; k++) { const t = limb(T, black, 0.15, 0.012, -0.05 + k * 0.02, -0.05, 0.08); t.rotation.x = 0.4; r.head.add(t); } }
    if (i === 2) { const a2 = limb(T, black, 0.18, 0.025, -0.15, 0.62, 0.05), a3 = limb(T, black, 0.18, 0.025, 0.15, 0.62, 0.05); r.body.add(a2, a3); r.arms.push(a2, a3); [-1, 1].forEach(s => mesh(T, new T.SphereGeometry(0.03, 8, 6), acc, s * 0.05, 0.03, 0.1, r.head)); }
    if (i === 4) { [r.skull, r.torso].forEach(m => m.material = M(T, '#8f9599', { metalness: 1, roughness: 0.15 })); for (let k = 0; k < 3; k++) mesh(T, new T.TorusGeometry(0.06, 0.008, 4, 12), acc, 0, 0.55 + k * 0.08, 0.1, r.body); }
    if (i === 6) { r.skull.material = M(T, '#3c4a35', { roughness: 0.4, metalness: 0.4 }); for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.015, 0.06, 4), bone, 0, 0.1 - k * 0.02, -0.1 - k * 0.04, r.head); }
    if (i === 7) { const cap = mesh(T, new T.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(T, color, { emissive: color, emissiveIntensity: 0.3, roughness: 0.6 }), 0, 0.1, 0, r.head); for (let k = 0; k < 7; k++) mesh(T, new T.SphereGeometry(0.02, 6, 6), bone, Math.cos(k) * 0.12, 0.2, Math.sin(k) * 0.12, r.head); void cap; }
    // 生物發光管線（角色代表色）
    const vein = mesh(T, new T.TorusGeometry(0.105, 0.006, 4, 20), acc, 0, 0.62, 0, r.body); vein.rotation.x = Math.PI / 2;
    return r;
  }

  // ---------- 對外：建立角色 ----------
  C.make = function (T, theme, idx, color, avatarTex) {
    let r;
    if (avatarTex) { // 自畫角色：人形身體＋臉部貼上你畫的圖
      r = humanoid(T, { bodyMat: M(T, color, { roughness: 0.6 }), legMat: M(T, '#2b2b33'), headMat: M(T, '#f2f2f2') , eyes: false });
      const face = new T.Mesh(new T.CircleGeometry(0.125, 24), new T.MeshBasicMaterial({ map: avatarTex })); face.position.z = 0.131; r.head.add(face);
    } else if (theme === 'ragnarok') r = ragnarok(T, idx, color);
    else if (theme === 'cyber') r = cyber(T, idx, color);
    else if (theme === 'animal') r = animal(T, idx, color);
    else r = alien(T, idx, color);
    // 腳下的玩家色光圈
    const ring = new T.Mesh(new T.RingGeometry(0.2, 0.26, 28), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; r.g.add(ring); r.ring = ring;
    // 頭上的箭頭（輪到時顯示）
    const arrow = new T.Mesh(new T.ConeGeometry(0.07, 0.15, 4), new T.MeshBasicMaterial({ color })); arrow.rotation.x = Math.PI; arrow.position.y = 1.35; arrow.visible = false; r.g.add(arrow); r.arrow = arrow;
    r.state = 'idle'; r.stateUntil = 0; r.phase = Math.random() * 6;
    return r;
  };
  // 每一幀更新動作
  C.update = function (r, t, dt) {
    const s = r.state, now = performance.now();
    if (r.stateUntil && now > r.stateUntil && s !== 'walk' && s !== 'fall') { r.state = 'idle'; r.stateUntil = 0; }
    r.phase += dt * (s === 'walk' ? 11 : 2);
    const sw = Math.sin(r.phase);
    const legs = r.legs, arms = r.arms;
    let bodyY = 0, bodyRX = 0, headRX = 0, armUp = 0;
    if (s === 'walk') { bodyY = Math.abs(Math.sin(r.phase)) * 0.04; legs.forEach((l, k) => l.rotation.x = (k % 2 ? -1 : 1) * sw * 0.7 * (r.kind === 'quad' && k > 1 ? -1 : 1)); arms.forEach((a, k) => a.rotation.x = (k % 2 ? 1 : -1) * sw * 0.6); }
    else { legs.forEach(l => l.rotation.x *= 0.8); arms.forEach((a, k) => a.rotation.x = Math.sin(t * 1.5 + k) * 0.05); bodyY = Math.sin(t * 2 + r.phase) * 0.012; }
    if (s === 'joy') { bodyY = Math.abs(Math.sin(t * 9)) * 0.22; armUp = -2.6; }
    if (s === 'sad') { headRX = 0.55; bodyRX = 0.15; }
    if (s === 'scared') { bodyY = Math.sin(t * 40) * 0.01; r.body.position.x = Math.sin(t * 45) * 0.02; headRX = -0.2; armUp = -1.2; }
    else r.body.position.x *= 0.8;
    if (armUp) arms.forEach((a, k) => { a.rotation.x = armUp + Math.sin(t * 10 + k) * 0.2; });
    r.body.position.y = bodyY + (r.kind === 'float' ? 0.15 + Math.sin(t * 2) * 0.06 : 0);
    r.body.rotation.x += (bodyRX - r.body.rotation.x) * 0.15;
    if (r.head) r.head.rotation.x += (headRX - r.head.rotation.x) * 0.15;
    if (r.tail) r.tail.rotation.y = Math.sin(t * 3 + r.phase) * 0.4;
    if (r.blob) { const k = 1 + Math.sin(t * 5) * 0.06; r.blob.scale.set(k, 2 - k, k); }
    if (r.kind === 'float') legs.forEach((l, k) => { l.rotation.x = Math.sin(t * 3 + k) * 0.25; l.rotation.z = Math.cos(t * 2.5 + k) * 0.2; });
    // 倒地
    const fallT = s === 'fall' ? -Math.PI / 2 : 0; r.g.rotation.z += (fallT - r.g.rotation.z) * 0.12;
    if (r.arrow.visible) { r.arrow.position.y = 1.35 + Math.sin(t * 4) * 0.06; r.arrow.rotation.y = t * 2; }
  };
  C.set = function (r, state, ms) { r.state = state; r.stateUntil = ms ? performance.now() + ms : 0; };

  root.MONO_CHARS = C;
})(typeof window !== 'undefined' ? window : globalThis);
