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
  // 有眼白、瞳孔、反光點的眼睛（會眨眼）
  const SH = {};
  function eye(T, parent, x, y, z, size, iris) {
    const e = new T.Group(); e.position.set(x, y, z); parent.add(e);
    SH.white = SH.white || M(T, '#fbfbf6', { roughness: 0.25 }); SH.hi = SH.hi || new T.MeshBasicMaterial({ color: '#ffffff' });
    const w = mesh(T, new T.SphereGeometry(size, 12, 10), SH.white, 0, 0, 0, e); w.scale.set(1, 1.12, 0.55);
    const pu = mesh(T, new T.SphereGeometry(0.018, 10, 8), M(T, iris || '#1a120c', { roughness: 0.1 }), 0, -size * 0.05, size * 0.38, e); pu.scale.setScalar(size / 0.03); pu.scale.z *= 0.5;
    mesh(T, new T.SphereGeometry(size * 0.22, 6, 6), SH.hi, size * 0.28, size * 0.3, size * 0.62, e);
    return e;
  }

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
    const hr = o.headR || 0.13;
    const skull = mesh(T, new T.SphereGeometry(hr, 20, 16), o.headMat, 0, 0, 0, head);
    const eyes = [];
    if (o.eyes !== false) { // 五官：眼睛、眉毛、鼻子、嘴巴、耳朵
      [-1, 1].forEach(sd => eyes.push(eye(T, head, sd * 0.046, 0.012, hr * 0.86, 0.03, o.iris)));
      const brow = M(T, o.browColor || '#3a2a1e', { roughness: 0.9 });
      [-1, 1].forEach(sd => { const b = mesh(T, new T.BoxGeometry(0.042, 0.009, 0.012), brow, sd * 0.047, 0.058, hr * 0.9, head); b.rotation.z = -sd * 0.12; });
      mesh(T, new T.SphereGeometry(0.017, 8, 6), o.headMat, 0, -0.02, hr * 0.98, head);
      const mo = mesh(T, new T.TorusGeometry(0.022, 0.005, 4, 12, Math.PI), M(T, '#7a2e2a'), 0, -0.045, hr * 0.9, head); mo.rotation.z = Math.PI;
      [-1, 1].forEach(sd => { const ea = mesh(T, new T.SphereGeometry(0.028, 8, 6), o.headMat, sd * hr * 0.97, 0, 0, head); ea.scale.set(0.5, 1, 0.8); });
    }
    // 脖子、肩膀、手掌、鞋子、腰帶
    mesh(T, new T.CylinderGeometry(0.042, 0.05, 0.1, 10), o.neckMat || o.headMat, 0, 0.86, 0, body);
    const limbR = o.limbR || 0.055, handMat = o.handMat || o.headMat;
    [armL, armR].forEach(a => mesh(T, new T.SphereGeometry(limbR * 1.05, 10, 8), o.armMat || o.bodyMat, 0, -0.01, 0, a));
    [handL, handR].forEach(h => mesh(T, new T.SphereGeometry(limbR * 0.95, 10, 8), handMat, 0, 0.03, 0, h));
    const shoe = o.shoeMat || M(T, '#2a2320', { roughness: 0.6 });
    [legL, legR].forEach(l => { const f = mesh(T, new T.SphereGeometry(0.06, 10, 8), shoe, 0, -0.33, 0.03, l); f.scale.set(0.95, 0.6, 1.45); });
    const hip = mesh(T, new T.SphereGeometry(o.torsoR || 0.13, 14, 10), o.hipMat || o.legMat, 0, 0.46, 0, body); hip.scale.set(1, 0.55, 0.75);
    body.add(legL, legR, armL, armR);
    g.scale.setScalar(sc);
    return { g, body, head, skull, legs: [legL, legR], arms: [armL, armR], handR, handL, torso, eyes, kind: 'biped' };
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
    const hr = o.headR || 0.13;
    if (o.snout) {
      const sn = mesh(T, new T.SphereGeometry(o.snout, 14, 10), o.snoutMat || o.headMat || o.bodyMat, 0, -0.03, hr * 0.85, head); sn.scale.z = o.snoutLen || 1.2;
      if (o.nose !== false) { const ns = mesh(T, new T.SphereGeometry(o.snout * 0.38, 10, 8), M(T, o.noseColor || '#1b1513', { roughness: 0.3 }), 0, -0.03 + o.snout * 0.45, hr * 0.85 + o.snout * (o.snoutLen || 1.2) * 0.9, head); ns.scale.set(1.3, 0.8, 0.8); }
    }
    const eyes = [-1, 1].map(sd => eye(T, head, sd * hr * 0.5, 0.04, hr * 0.78, o.eyeR || hr * 0.2, o.iris));
    // 腳掌、胸口
    legs.forEach(l => { const pw = mesh(T, new T.SphereGeometry((o.legR || 0.045) * 1.35, 10, 8), o.pawMat || o.legMat || o.bodyMat, 0, -(H - 0.08) - (o.legR || 0.045) * 0.6, 0.015, l); pw.scale.set(1, 0.65, 1.25); });
    if (o.bellyMat) { const bl = mesh(T, new T.SphereGeometry(0.5, 14, 10), o.bellyMat, 0, H + 0.04, L * 0.15, body); bl.scale.set(W * 1.5, (o.bodyH || 0.38) * 0.75, L * 1.2); }
    let tail = null; if (o.tail) { tail = new T.Group(); tail.position.set(0, H + 0.15, -L * 0.75); body.add(tail); const tm = mesh(T, new T.CapsuleGeometry(o.tail.r, o.tail.len, 4, 8), o.tail.mat || o.bodyMat, 0, 0, -o.tail.len / 2, tail); tm.rotation.x = Math.PI / 2 + (o.tail.lift || 0.4); }
    return { g, body, head, skull, legs, arms: [], tail, eyes, kind: 'quad' };
  }

  // ---------- 各主題角色 ----------
  function ragnarok(T, i, color) {
    const skin = M(T, '#e6c7a6'), robe = M(T, '#f4efe4', { roughness: 0.8 }), trim = M(T, color), gold = M(T, '#d4af37', { metalness: 0.9, roughness: 0.25 });
    if (i === 4) { // 芬里爾：巨狼（長吻、尖耳、鬃毛、發光的眼、蓬鬆尾巴、被金鍊鎖著）
      const fur = M(T, '#4a4f58', { roughness: 0.95 }), pale = M(T, '#aeb4bc', { roughness: 0.95 }), dark = M(T, '#22252b', { roughness: 0.9 });
      const r = quadruped(T, { bodyMat: fur, legMat: fur, legR: 0.065, headR: 0.15, len: 0.58, height: 0.3, wide: 0.24, bodyH: 0.4, neck: 0.14, tail: { r: 0.07, len: 0.34, lift: 0.5, mat: fur } });
      r.body.scale.setScalar(1.2);
      r.skull.scale.set(1, 0.9, 1.05);
      // 長吻＋黑鼻頭＋下顎
      const snout = mesh(T, new T.ConeGeometry(0.075, 0.24, 10), pale, 0, -0.035, 0.2, r.head); snout.rotation.x = Math.PI / 2; snout.scale.set(1, 1, 0.75);
      mesh(T, new T.SphereGeometry(0.03, 8, 6), M(T, '#0b0b0b', { roughness: 0.3 }), 0, -0.02, 0.31, r.head);
      const jaw = mesh(T, new T.BoxGeometry(0.08, 0.025, 0.15), dark, 0, -0.085, 0.17, r.head); jaw.rotation.x = 0.12;
      for (let k = 0; k < 2; k++) mesh(T, new T.ConeGeometry(0.01, 0.04, 4), M(T, '#f4f1e6'), (k ? 1 : -1) * 0.03, -0.075, 0.24, r.head).rotation.x = Math.PI;
      // 尖耳
      [-1, 1].forEach(sd => { const e = mesh(T, new T.ConeGeometry(0.045, 0.17, 4), fur, sd * 0.075, 0.15, -0.03, r.head); e.rotation.z = -sd * 0.18; e.rotation.x = -0.15; const ei = mesh(T, new T.ConeGeometry(0.025, 0.1, 4), M(T, '#7a5560'), sd * 0.075, 0.14, -0.015, r.head); ei.rotation.copy(e.rotation); });
      // 發光的琥珀色眼睛（蓋在原本的黑眼上）
      const glow = M(T, '#ffb020', { emissive: '#ff9000', emissiveIntensity: 2.2 });
      [-1, 1].forEach(sd => { const e = mesh(T, new T.SphereGeometry(0.024, 10, 8), glow, sd * 0.065, 0.045, 0.12, r.head); e.scale.set(1.3, 0.7, 0.6); e.rotation.z = sd * 0.35; });
      // 頸部鬃毛
      for (let k = 0; k < 9; k++) { const a = (k / 8 - 0.5) * 2.6; const m = mesh(T, new T.ConeGeometry(0.06, 0.2, 5), fur, Math.sin(a) * 0.15, 0.62 + Math.cos(a) * 0.05, 0.3 - Math.abs(Math.sin(a)) * 0.04, r.body); m.rotation.set(-1.9, 0, -Math.sin(a) * 0.6); }
      mesh(T, new T.SphereGeometry(0.13, 12, 10), pale, 0, 0.42, 0.3, r.body).scale.set(1, 1.1, 0.7); // 胸口淺色毛
      // 蓬鬆尾巴＋淺色尾尖
      const tip = mesh(T, new T.SphereGeometry(0.075, 10, 8), pale, 0, 0, -0.36, r.tail); tip.scale.set(1, 1, 1.4); void tip;
      // 神鍊格萊普尼爾
      const gold2 = M(T, '#d4af37', { metalness: 0.9, roughness: 0.25, emissive: '#5a4300', emissiveIntensity: 0.4 });
      const chain = mesh(T, new T.TorusGeometry(0.15, 0.022, 6, 18), gold2, 0, 0.6, 0.32, r.body); chain.rotation.x = Math.PI / 2.3;
      return r;
    }
    const r = humanoid(T, { bodyMat: robe, legMat: skin, armMat: skin, headMat: skin, shoeMat: M(T, '#8a6a3a', { roughness: 0.8 }), hipMat: robe });
    const skirt = mesh(T, new T.CylinderGeometry(0.12, 0.19, 0.24, 16, 1, true), robe, 0, 0.4, 0, r.body); skirt.material = M(T, '#f4efe4', { roughness: 0.8, side: T.DoubleSide });
    mesh(T, new T.TorusGeometry(0.125, 0.018, 6, 20), gold, 0, 0.5, 0, r.body).rotation.x = Math.PI / 2; // 金腰帶
    [-1, 1].forEach(sd => { const sp = mesh(T, new T.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), trim, sd * 0.17, 0.78, 0, r.body); sp.scale.set(1, 0.7, 1); }); // 肩甲
    const sash = mesh(T, new T.TorusGeometry(0.13, 0.025, 6, 18), trim, 0, 0.62, 0, r.body); sash.rotation.set(Math.PI / 2.6, 0, 0.5);
    const hair = (c) => { const h = mesh(T, new T.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), M(T, c, { roughness: 0.9 }), 0, 0.02, -0.01, r.head); return h; };
    if (i === 0) { hair('#f2f2f2'); mesh(T, new T.ConeGeometry(0.09, 0.2, 10), M(T, '#f5f5f5', { roughness: 1 }), 0, -0.12, 0.08, r.head).rotation.x = Math.PI; const b = mesh(T, new T.ConeGeometry(0.035, 0.32, 4), M(T, '#fff1a8', { emissive: '#ffd84a', emissiveIntensity: 1.5 }), 0, 0, 0, r.handR); b.rotation.z = 0.3; }
    if (i === 1) { hair('#d9a441'); const cape = mesh(T, new T.PlaneGeometry(0.34, 0.5), M(T, '#a3201c', { side: T.DoubleSide }), 0, 0.6, -0.11, r.body); cape.rotation.x = 0.12; const hm = new T.Group(); r.handR.add(hm); mesh(T, new T.CylinderGeometry(0.015, 0.015, 0.22, 6), M(T, '#5a3d22'), 0, 0, 0, hm); mesh(T, new T.BoxGeometry(0.12, 0.08, 0.08), M(T, '#9aa0a6', { metalness: 0.9, roughness: 0.3 }), 0, -0.12, 0, hm); }
    if (i === 2) { mesh(T, new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold, 0, 0.02, 0, r.head); mesh(T, new T.BoxGeometry(0.03, 0.1, 0.24), M(T, '#9b1c1c'), 0, 0.16, 0, r.head); mesh(T, new T.CylinderGeometry(0.01, 0.01, 0.8, 6), M(T, '#8a6a3a'), 0, 0.1, 0, r.handR); const sh = mesh(T, new T.CylinderGeometry(0.12, 0.12, 0.02, 20), gold, 0, 0, 0.04, r.handL); sh.rotation.x = Math.PI / 2; }
    if (i === 3) { hair('#3d5a6c'); mesh(T, new T.ConeGeometry(0.1, 0.18, 10), M(T, '#3d5a6c', { roughness: 1 }), 0, -0.12, 0.08, r.head).rotation.x = Math.PI; const tr = new T.Group(); r.handR.add(tr); mesh(T, new T.CylinderGeometry(0.012, 0.012, 0.8, 6), gold, 0, 0.1, 0, tr); [-0.04, 0, 0.04].forEach(x => mesh(T, new T.ConeGeometry(0.012, 0.09, 4), gold, x, 0.54, 0, tr)); mesh(T, new T.TorusGeometry(0.11, 0.015, 6, 16), gold, 0, 0.1, 0, r.head).rotation.x = Math.PI / 2; }
    if (i === 5) { r.skull.material = M(T, '#6b4f2a'); mesh(T, new T.ConeGeometry(0.05, 0.12, 6), M(T, '#d9a441'), 0, -0.02, 0.15, r.head).rotation.x = Math.PI / 2; const sun = mesh(T, new T.CircleGeometry(0.13, 24), M(T, '#ffb703', { emissive: '#ff8c00', emissiveIntensity: 1.6, side: T.DoubleSide }), 0, 0.25, -0.05, r.head); void sun; }
    if (i === 6) { // 美杜莎：蛇髮、發光的金色蛇眼、綠色鱗紋長袍、蛇纏手臂
      r.torso.material = M(T, '#2f6b45', { roughness: 0.5, metalness: 0.2 }); r.skull.material = M(T, '#cfe0c4');
      const sk = M(T, '#4fae6a', { roughness: 0.4 }), dk = M(T, '#2a5a36', { roughness: 0.4 }), eyeG = M(T, '#ffd23a', { emissive: '#ffb000', emissiveIntensity: 2 });
      const snakes = [];
      for (let k = 0; k < 11; k++) { const a = k / 11 * Math.PI * 2, up = k % 3 === 0;
        const g = new T.Group(); g.position.set(Math.cos(a) * 0.1, 0.05 + (up ? 0.04 : 0), Math.sin(a) * 0.1 - 0.02); g.rotation.set(Math.sin(a) * 0.9 - (up ? 0.6 : 0), 0, -Math.cos(a) * 0.9); r.head.add(g);
        const pts = [0, 1, 2, 3].map(j => new T.Vector3(Math.sin(j * 1.4 + k) * 0.025, j * 0.05, Math.cos(j * 1.2) * 0.02));
        mesh(T, new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.013, 6), k % 2 ? sk : dk, 0, 0, 0, g);
        const hd = mesh(T, new T.SphereGeometry(0.02, 8, 6), k % 2 ? sk : dk, pts[3].x, pts[3].y + 0.01, pts[3].z + 0.01, g); hd.scale.set(1, 0.8, 1.5);
        [-1, 1].forEach(sd => mesh(T, new T.SphereGeometry(0.005, 4, 4), eyeG, pts[3].x + sd * 0.01, pts[3].y + 0.017, pts[3].z + 0.022, g));
        snakes.push(g); }
      r.head.traverse(c => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.radius === 0.018) c.material = eyeG; });
      const coil = mesh(T, new T.TorusGeometry(0.06, 0.016, 6, 14), sk, 0, 0.05, 0, r.handR); coil.rotation.x = Math.PI / 2; void coil;
      r.tick = (t) => snakes.forEach((g, k) => { g.rotation.y = Math.sin(t * 2.2 + k) * 0.25; });
    }
    if (i === 7) { hair('#4a3321'); r.torso.material = M(T, '#6b4a2e', { roughness: 0.9 }); mesh(T, new T.BoxGeometry(0.02, 0.35, 0.04), M(T, '#c0c6cc', { metalness: 0.9, roughness: 0.2 }), 0, -0.1, 0.02, r.handR); const sh = mesh(T, new T.CylinderGeometry(0.1, 0.1, 0.02, 16), M(T, '#7a5230'), 0, 0, 0.04, r.handL); sh.rotation.x = Math.PI / 2; }
    return r;
  }
  function cyber(T, i, color) {
    const tint = new T.Color(color).lerp(new T.Color('#1a1826'), 0.62);
    const skin = M(T, ['#c9a38a', '#8d5a3b', '#e8c3a6', '#b98563'][i % 4]), jacket = M(T, tint, { roughness: 0.35, metalness: 0.35 }), pants = M(T, '#262434', { roughness: 0.6 }), neon = M(T, color, { emissive: color, emissiveIntensity: 1.6 });
    const r = humanoid(T, { bodyMat: jacket, legMat: pants, armMat: jacket, headMat: skin, handMat: M(T, '#2b2a33', { roughness: 0.4 }), shoeMat: M(T, '#15141c', { metalness: 0.5, roughness: 0.3 }), iris: '#3a2a6a' });
    const collar = mesh(T, new T.CylinderGeometry(0.075, 0.11, 0.08, 14, 1, true), M(T, '#2a2834', { side: T.DoubleSide, metalness: 0.4, roughness: 0.35 }), 0, 0.84, 0, r.body); void collar;
    [-1, 1].forEach(sd => mesh(T, new T.BoxGeometry(0.03, 0.012, 0.01), neon, sd * 0.06, 0.26, 0.06, r.legs[sd < 0 ? 0 : 1])); // 鞋上的霓虹條
    const strip = mesh(T, new T.BoxGeometry(0.015, 0.22, 0.01), neon, 0.06, 0.62, 0.1, r.body); void strip;
    const hair = (c, e) => mesh(T, new T.SphereGeometry(0.137, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), M(T, c, e || { roughness: 0.6 }), 0, 0.02, -0.01, r.head);
    if (i === 0) { hair('#141414'); r.arms[1].children[0].material = M(T, '#8a8f99', { metalness: 0.95, roughness: 0.2, emissive: color, emissiveIntensity: 0.25 }); mesh(T, new T.BoxGeometry(0.05, 0.015, 0.01), neon, 0.06, 0.03, 0.125, r.head); }
    if (i === 1) { const hood = mesh(T, new T.SphereGeometry(0.15, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.6), jacket, 0, 0.01, -0.02, r.head); void hood; mesh(T, new T.BoxGeometry(0.2, 0.04, 0.03), M(T, '#00e5ff', { emissive: '#00e5ff', emissiveIntensity: 2 }), 0, 0.02, 0.12, r.head); }
    if (i === 2) { for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.02, 0.12, 4), M(T, '#ff2e88', { emissive: '#ff2e88', emissiveIntensity: 0.8 }), 0, 0.13, -0.08 + k * 0.04, r.head); const gt = mesh(T, new T.BoxGeometry(0.14, 0.34, 0.03), M(T, '#b5121b', { metalness: 0.4 }), 0.02, 0.62, -0.14, r.body); gt.rotation.z = 0.5; }
    if (i === 3) { const chrome = M(T, '#c7ccd6', { metalness: 1, roughness: 0.12 }); r.skull.material = chrome; r.torso.material = chrome; r.legs.concat(r.arms).forEach(l => l.children[0].material = chrome); r.head.traverse(c => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.radius === 0.018) c.material = M(T, color, { emissive: color, emissiveIntensity: 2.5 }); }); }
    if (i === 4) { r.torso.material = M(T, '#e9eef2', { roughness: 0.7 }); r.arms.forEach(a => a.children[0].material = r.torso.material); hair('#2b2b2b'); mesh(T, new T.BoxGeometry(0.12, 0.06, 0.02), M(T, '#7fd1c7'), 0, -0.04, 0.12, r.head); }
    if (i === 5) { const hm = mesh(T, new T.SphereGeometry(0.16, 16, 12), M(T, '#1b1b22', { metalness: 0.6, roughness: 0.2 }), 0, 0.01, 0, r.head); void hm; const v = mesh(T, new T.SphereGeometry(0.162, 16, 8, -0.9, 1.8, 1.0, 0.7), M(T, color, { emissive: color, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.1 }), 0, 0.01, 0, r.head); void v; }
    if (i === 6) { hair(color, { emissive: color, emissiveIntensity: 1.2, roughness: 0.4 }); mesh(T, new T.CylinderGeometry(0.012, 0.012, 0.12, 6), M(T, '#d0d0d0', { metalness: 1 }), 0, 0.05, 0, r.handR); mesh(T, new T.SphereGeometry(0.025, 8, 6), M(T, '#333'), 0, 0.12, 0, r.handR); }
    if (i === 7) { const coat = mesh(T, new T.CylinderGeometry(0.15, 0.22, 0.5, 12, 1, true), M(T, '#2a0d10', { side: T.DoubleSide }), 0, 0.5, 0, r.body); void coat; mesh(T, new T.CylinderGeometry(0.16, 0.16, 0.02, 16), M(T, '#111'), 0, 0.09, 0, r.head); mesh(T, new T.CylinderGeometry(0.1, 0.11, 0.1, 16), M(T, '#111'), 0, 0.15, 0, r.head); mesh(T, new T.TorusGeometry(0.1, 0.012, 6, 20), M(T, '#ffd166', { metalness: 1, roughness: 0.2 }), 0, 0.74, 0.04, r.body).rotation.x = 1.3; }
    return r;
  }
  function animal(T, i, color) {
    const fur = (c) => M(T, c, { roughness: 0.95 });
    const ear = (r, mat, inner, x, y, z, w, h, rz, pointy) => { const e = mesh(T, pointy ? new T.ConeGeometry(w, h, 6) : new T.SphereGeometry(w, 10, 8), mat, x, y, z, r.head); if (!pointy) e.scale.set(1, h / w, 0.45); e.rotation.z = rz || 0; if (inner) { const n = mesh(T, pointy ? new T.ConeGeometry(w * 0.55, h * 0.7, 6) : new T.SphereGeometry(w * 0.6, 8, 6), inner, x, y - (pointy ? 0.005 : 0), z + 0.012, r.head); if (!pointy) n.scale.set(1, h / w, 0.3); n.rotation.z = rz || 0; } return e; };
    const pink = M(T, '#e8a3a8', { roughness: 0.8 });
    if (i === 0) { // 獅子：鬃毛一圈、圓耳、淺色口鼻、尾巴毛球
      const body = fur('#d6a35a'), muzzle = fur('#f0d4a0'), mane = fur('#8a4d1c');
      const r = quadruped(T, { bodyMat: body, bellyMat: muzzle, pawMat: muzzle, headR: 0.14, snout: 0.075, snoutLen: 1.0, snoutMat: muzzle, len: 0.55, height: 0.36, legR: 0.055, tail: { r: 0.022, len: 0.38, lift: 0.3 }, iris: '#7a4a10' });
      for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const m = mesh(T, new T.ConeGeometry(0.06, 0.16, 6), mane, Math.cos(a) * 0.15, Math.sin(a) * 0.15, -0.04, r.head); m.rotation.z = a - Math.PI / 2; m.rotation.x = -0.25; }
      mesh(T, new T.SphereGeometry(0.17, 14, 10), mane, 0, 0, -0.08, r.head).scale.set(1, 1, 0.6);
      [-1, 1].forEach(sd => ear(r, body, pink, sd * 0.11, 0.12, 0.02, 0.04, 0.04));
      mesh(T, new T.SphereGeometry(0.05, 8, 6), mane, 0, 0, -0.4, r.tail).scale.set(1, 1, 1.4);
      return r;
    }
    if (i === 1) { // 兔子：長耳（粉色內耳）、白尾球、粉鼻子、大後腳
      const body = fur('#d8cbb8'), white = fur('#f6f1ea');
      const r = quadruped(T, { bodyMat: body, bellyMat: white, pawMat: white, headR: 0.11, snout: 0.05, snoutLen: 0.8, snoutMat: white, noseColor: '#e07a88', len: 0.3, height: 0.18, wide: 0.17, bodyH: 0.32, legR: 0.04, tail: { r: 0.06, len: 0.01, mat: white } });
      [-1, 1].forEach(sd => { const e = mesh(T, new T.CapsuleGeometry(0.03, 0.2, 4, 10), body, sd * 0.045, 0.2, -0.02, r.head); e.rotation.z = -sd * 0.18; e.scale.z = 0.5; const n = mesh(T, new T.CapsuleGeometry(0.017, 0.16, 4, 8), pink, sd * 0.045, 0.2, 0.0, r.head); n.rotation.z = -sd * 0.18; n.scale.z = 0.3; });
      r.legs.slice(2).forEach(l => l.scale.set(1.3, 1, 1.5));
      [-1, 1].forEach(sd => mesh(T, new T.SphereGeometry(0.035, 8, 6), white, sd * 0.04, -0.05, 0.12, r.head)); // 鼓鼓的臉頰
      mesh(T, new T.BoxGeometry(0.03, 0.025, 0.01), white, 0, -0.08, 0.13, r.head); // 門牙
      return r;
    }
    if (i === 2) { // 狸貓：黑眼罩、白口鼻、尖耳白邊、環紋大尾巴
      const body = fur('#8a8076'), dark = fur('#2a2420'), white = fur('#efe9df');
      const r = quadruped(T, { bodyMat: body, bellyMat: fur('#b0a698'), pawMat: dark, legMat: dark, headR: 0.11, snout: 0.045, snoutLen: 1.4, snoutMat: white, len: 0.36, height: 0.22, wide: 0.18, legR: 0.04, tail: { r: 0.055, len: 0.3, lift: 0.6 } });
      [-1, 1].forEach(sd => { const m = mesh(T, new T.SphereGeometry(0.045, 10, 8), dark, sd * 0.05, 0.035, 0.07, r.head); m.scale.set(1.2, 0.75, 0.6); });
      r.eyes.forEach(e => e.position.z += 0.012);
      [-1, 1].forEach(sd => { ear(r, dark, white, sd * 0.07, 0.1, -0.01, 0.035, 0.07, -sd * 0.25, true); });
      for (let k = 0; k < 4; k++) { const rg = mesh(T, new T.TorusGeometry(0.056, 0.014, 6, 14), dark, 0, 0, -0.06 - k * 0.075, r.tail); rg.rotation.x = 0; }
      return r;
    }
    if (i === 3) { // 河馬：大嘴、鼻孔、小耳朵、牙齒、粉肚子
      const body = M(T, '#8e7f93', { roughness: 0.55 }), belly = M(T, '#d9a8b4', { roughness: 0.6 });
      const r = quadruped(T, { bodyMat: body, bellyMat: belly, pawMat: M(T, '#6f6274'), headR: 0.15, snout: 0.13, snoutLen: 0.85, snoutMat: belly, nose: false, len: 0.55, height: 0.26, wide: 0.3, bodyH: 0.5, legR: 0.075, eyeR: 0.026, tail: { r: 0.02, len: 0.1 } });
      r.eyes.forEach(e => { e.position.y += 0.06; e.position.z -= 0.03; mesh(T, new T.SphereGeometry(0.035, 8, 6), body, 0, -0.015, -0.01, e).scale.set(1, 0.6, 1); });
      [-1, 1].forEach(sd => { mesh(T, new T.SphereGeometry(0.018, 8, 6), M(T, '#3a2a30'), sd * 0.045, 0.06, 0.26, r.head); ear(r, body, pink, sd * 0.09, 0.13, -0.05, 0.03, 0.04); mesh(T, new T.ConeGeometry(0.015, 0.05, 6), M(T, '#fffbea'), sd * 0.07, -0.07, 0.24, r.head); });
      return r;
    }
    if (i === 4) { // 河狸：扁平鱗狀尾巴、大門牙、圓耳、深色手腳
      const body = fur('#7a4a2c'), dark = fur('#3c2a1e');
      const r = quadruped(T, { bodyMat: body, bellyMat: fur('#9c6a44'), pawMat: dark, legMat: dark, headR: 0.11, snout: 0.055, snoutLen: 1.0, snoutMat: fur('#a3774f'), len: 0.38, height: 0.2, wide: 0.2, legR: 0.04, tail: { r: 0.08, len: 0.2, lift: -0.3, mat: M(T, '#3a2a22', { roughness: 0.5 }) } });
      [-1, 1].forEach(sd => { mesh(T, new T.BoxGeometry(0.022, 0.04, 0.012), M(T, '#f6e7b0'), sd * 0.012, -0.075, 0.16, r.head); ear(r, body, null, sd * 0.08, 0.08, -0.02, 0.025, 0.025); });
      if (r.tail) r.tail.children[0].scale.set(1.9, 1, 0.3);
      for (let k = 0; k < 3; k++) mesh(T, new T.BoxGeometry(0.22, 0.004, 0.01), M(T, '#251a14'), 0, 0.012, -0.06 - k * 0.06, r.tail).rotation.x = 0.3; // 尾巴紋路
      return r;
    }
    if (i === 5) { // 鱷魚：背上鱗片、長嘴＋牙齒、凸起的眼睛
      const skin = M(T, '#4e6338', { roughness: 0.45 }), belly = M(T, '#c9c08a', { roughness: 0.6 }), ridge = M(T, '#33442a', { roughness: 0.5 });
      const r = quadruped(T, { bodyMat: skin, bellyMat: belly, headR: 0.09, snout: 0.07, snoutLen: 3.2, nose: false, len: 0.7, height: 0.14, wide: 0.2, bodyH: 0.18, legR: 0.04, eyeR: 0.024, iris: '#c9a400', tail: { r: 0.06, len: 0.6, lift: -0.15 } });
      r.eyes.forEach(e => { e.position.y += 0.05; e.position.z -= 0.02; });
      for (let k = 0; k < 9; k++) mesh(T, new T.ConeGeometry(0.025, 0.055, 4), ridge, (k % 2 ? 0.035 : -0.035), 0.24, -0.45 + k * 0.11, r.body);
      for (let k = 0; k < 7; k++) [-1, 1].forEach(sd => mesh(T, new T.ConeGeometry(0.008, 0.025, 4), M(T, '#fffbea'), sd * 0.055, -0.065, 0.1 + k * 0.025, r.head).rotation.x = Math.PI);
      return r;
    }
    if (i === 6) { // 棕熊：圓耳、淺色口鼻、大熊掌、肩上隆起
      const body = fur('#6a4329'), muzzle = fur('#c8a27a');
      const r = quadruped(T, { bodyMat: body, pawMat: fur('#4a2e1c'), headR: 0.15, snout: 0.075, snoutLen: 1.1, snoutMat: muzzle, len: 0.48, height: 0.32, wide: 0.28, bodyH: 0.46, legR: 0.075, tail: { r: 0.03, len: 0.04 } });
      [-1, 1].forEach(sd => ear(r, body, muzzle, sd * 0.11, 0.12, -0.02, 0.045, 0.045));
      mesh(T, new T.SphereGeometry(0.2, 12, 10), body, 0, 0.55, 0.12, r.body).scale.set(1.1, 0.7, 1);
      return r;
    }
    // 猴子：人形＋心形臉＋長捲尾巴
    const brown = fur('#7d5230'), face = M(T, '#e2c09a', { roughness: 0.8 });
    const r = humanoid(T, { bodyMat: brown, legMat: brown, armMat: brown, headMat: brown, handMat: face, shoeMat: face, browColor: '#4a2e18', scale: 0.85 });
    const fp = mesh(T, new T.SphereGeometry(0.1, 14, 10), face, 0, -0.015, 0.06, r.head); fp.scale.set(1.05, 0.95, 0.75);
    mesh(T, new T.SphereGeometry(0.06, 10, 8), face, 0, -0.06, 0.1, r.head).scale.set(1.2, 0.8, 0.8);
    r.eyes.forEach(e => e.position.z += 0.02);
    [-1, 1].forEach(sd => { mesh(T, new T.SphereGeometry(0.05, 10, 8), brown, sd * 0.14, 0.02, 0, r.head).scale.set(0.6, 1, 0.8); mesh(T, new T.SphereGeometry(0.032, 8, 6), face, sd * 0.15, 0.02, 0.01, r.head).scale.set(0.5, 1, 0.8); });
    mesh(T, new T.SphereGeometry(0.09, 10, 8), face, 0, 0.6, 0.06, r.body).scale.set(1, 1.2, 0.6); // 淺色肚子
    const tail = new T.Group(); tail.position.set(0, 0.45, -0.1); r.body.add(tail); const tm = mesh(T, new T.TorusGeometry(0.16, 0.02, 6, 16, Math.PI * 1.5), brown, 0, 0.1, -0.12, tail); tm.rotation.y = Math.PI / 2; r.tail = tail;
    return r;
  }
  function alien(T, i, color) {
    // 深空異種：Giger 生物機械（骨白＋濕黑）＋各自的代表色發光部位，8 種完全不同的輪廓
    const black = M(T, '#241c2c', { roughness: 0.16, metalness: 0.75 }), bone = M(T, '#e6dcc4', { roughness: 0.35, metalness: 0.15 }),
      acc = M(T, color, { emissive: color, emissiveIntensity: 1.1, roughness: 0.3 });
    const glowOrb = (parent, x, y, z, r) => mesh(T, new T.SphereGeometry(r, 12, 10), acc, x, y, z, parent);
    const seg = (parent, n, r0, step, mats, dir) => { const g = new T.Group(); parent.add(g); for (let k = 0; k < n; k++) mesh(T, new T.SphereGeometry(r0 * (1 - k / (n + 2)), 10, 8), mats[k % mats.length], 0, (dir ? dir[1] : 0) * k * step, (dir ? dir[2] : -1) * k * step, g); return g; };
    if (i === 0) { // 巢母：四腳爬行、往後拉長的頭顱、背上的管子、分節尾巴
      const r = quadruped(T, { bodyMat: black, legMat: black, pawMat: bone, headR: 0.12, len: 0.6, height: 0.3, wide: 0.2, bodyH: 0.3, legR: 0.035, neck: 0.06, eyeR: 0.0001, tail: null });
      r.eyes.forEach(e => e.visible = false); r.eyes = [];
      const dome = mesh(T, new T.CapsuleGeometry(0.1, 0.42, 8, 14), black, 0, 0.07, -0.2, r.head); dome.rotation.x = -1.2;
      const jaw = mesh(T, new T.CapsuleGeometry(0.06, 0.14, 6, 10), bone, 0, -0.04, 0.12, r.head); jaw.rotation.x = 1.4;
      for (let k = 0; k < 6; k++) mesh(T, new T.ConeGeometry(0.008, 0.035, 3), bone, -0.035 + k * 0.014, -0.075, 0.17, r.head).rotation.x = Math.PI;
      glowOrb(r.head, 0, 0.0, 0.2, 0.02);
      for (let k = 0; k < 4; k++) [-1, 1].forEach(sd => { const p = mesh(T, new T.CylinderGeometry(0.025, 0.03, 0.32, 8), k % 2 ? bone : black, sd * 0.07, 0.62, 0.15 - k * 0.12, r.body); p.rotation.set(-0.9, 0, sd * 0.25); });
      for (let k = 0; k < 5; k++) { const rb = mesh(T, new T.TorusGeometry(0.2, 0.018, 6, 14, Math.PI), bone, 0, 0.42, 0.2 - k * 0.1, r.body); rb.rotation.set(0, 0, Math.PI); }
      const tail = new T.Group(); tail.position.set(0, 0.42, -0.4); r.body.add(tail); r.tail = tail;
      for (let k = 0; k < 10; k++) mesh(T, new T.SphereGeometry(0.05 - k * 0.004, 8, 6), k % 2 ? bone : black, 0, k * 0.025, -k * 0.07, tail);
      mesh(T, new T.ConeGeometry(0.03, 0.14, 4), acc, 0, 0.26, -0.75, tail).rotation.x = -1.3;
      return r;
    }
    if (i === 1) { // 骨翼者：雙足、背後一對骨架翅膀＋半透明翼膜，會拍動
      const r = humanoid(T, { bodyMat: black, legMat: black, armMat: black, headMat: bone, handMat: bone, shoeMat: bone, eyes: false, limbR: 0.04, torsoR: 0.11 });
      r.skull.scale.set(0.8, 1.15, 1.1);
      [-1, 1].forEach(sd => { const e = mesh(T, new T.SphereGeometry(0.03, 10, 8), acc, sd * 0.045, 0.02, 0.1, r.head); e.scale.set(1.4, 0.6, 0.5); e.rotation.z = sd * 0.4; });
      for (let k = 0; k < 2; k++) [-1, 1].forEach(sd => { const h = mesh(T, new T.ConeGeometry(0.025, 0.18, 6), bone, sd * 0.07, 0.12, -0.04 - k * 0.04, r.head); h.rotation.set(-0.6, 0, -sd * 0.5); });
      for (let k = 0; k < 4; k++) { const rb = mesh(T, new T.TorusGeometry(0.1, 0.012, 6, 14, Math.PI * 1.2), bone, 0, 0.52 + k * 0.07, 0, r.body); rb.rotation.set(Math.PI / 2, 0, Math.PI * 1.4); }
      const wings = [];
      [-1, 1].forEach(sd => {
        const w = new T.Group(); w.position.set(sd * 0.08, 0.78, -0.1); r.body.add(w); wings.push(w);
        const mem = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.45, side: T.DoubleSide, roughness: 0.4 });
        const shape = new T.Shape(); shape.moveTo(0, 0); shape.lineTo(sd * 0.7, 0.35); shape.lineTo(sd * 0.62, -0.05); shape.lineTo(sd * 0.48, -0.25); shape.lineTo(sd * 0.3, -0.2); shape.lineTo(0, -0.1); shape.closePath();
        const m = new T.Mesh(new T.ShapeGeometry(shape), mem); w.add(m);
        [[0.7, 0.35], [0.62, -0.05], [0.48, -0.25]].forEach(([x, y]) => { const len = Math.hypot(x, y); const b = mesh(T, new T.CylinderGeometry(0.012, 0.02, len, 6), bone, sd * x / 2, y / 2, 0, w); b.rotation.z = Math.atan2(y, sd * x) - Math.PI / 2; });
      });
      r.tick = (t, s) => { const f = s === 'walk' ? 6 : s === 'joy' ? 12 : 2; wings.forEach((w, k) => { w.rotation.y = (k ? -1 : 1) * (0.5 + Math.sin(t * f) * 0.35); }); };
      return r;
    }
    if (i === 2) { // 織網者：六隻腳的生物機械蜘蛛
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const thorax = mesh(T, new T.SphereGeometry(0.16, 16, 12), black, 0, 0.38, 0.05, body); thorax.scale.set(1, 0.7, 1.1);
      const abd = mesh(T, new T.SphereGeometry(0.24, 16, 12), black, 0, 0.45, -0.3, body); abd.scale.set(0.9, 0.8, 1.2);
      for (let k = 0; k < 5; k++) { const rb = mesh(T, new T.TorusGeometry(0.2 - Math.abs(k - 2) * 0.03, 0.014, 6, 16, Math.PI), bone, 0, 0.47, -0.42 + k * 0.08, body); rb.rotation.set(0, Math.PI / 2, Math.PI / 2); }
      glowOrb(body, 0, 0.6, -0.36, 0.05);
      const head = new T.Group(); head.position.set(0, 0.4, 0.22); body.add(head);
      const sk = mesh(T, new T.SphereGeometry(0.09, 12, 10), bone, 0, 0, 0, head);
      for (let k = 0; k < 6; k++) glowOrb(head, (k % 3 - 1) * 0.035, 0.03 + Math.floor(k / 3) * 0.03, 0.08, 0.014);
      [-1, 1].forEach(sd => { const f = mesh(T, new T.ConeGeometry(0.015, 0.09, 4), bone, sd * 0.03, -0.06, 0.07, head); f.rotation.x = 2.6; });
      const legs = [];
      for (let k = 0; k < 6; k++) { const sd = k < 3 ? -1 : 1, j = k % 3; const hip = new T.Group(); hip.position.set(sd * 0.1, 0.38, 0.12 - j * 0.12); hip.rotation.set(0, sd * (0.4 - j * 0.4), sd * 1.0); body.add(hip);
        const up = limb(T, j % 2 ? bone : black, 0.22, 0.022, 0, 0, 0); hip.add(up); const knee = new T.Group(); knee.position.y = -0.27; up.add(knee); knee.rotation.z = -sd * 1.9;
        const lo = limb(T, black, 0.3, 0.016, 0, 0, 0); knee.add(lo); legs.push(up); }
      return { g, body, head, skull: sk, legs, arms: [], kind: 'quad' };
    }
    if (i === 3) { // 漂浮觸手：一顆大眼球核心＋機械環＋垂下的觸手
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const head = new T.Group(); head.position.y = 0.75; body.add(head);
      const ball = mesh(T, new T.SphereGeometry(0.22, 24, 18), bone, 0, 0, 0, head);
      const iris = mesh(T, new T.SphereGeometry(0.1, 16, 12), acc, 0, 0, 0.16, head); iris.scale.z = 0.45;
      mesh(T, new T.SphereGeometry(0.05, 12, 10), M(T, '#080808', { roughness: 0.05 }), 0, 0, 0.205, head).scale.z = 0.4;
      const lid = mesh(T, new T.SphereGeometry(0.235, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), black, 0, 0, 0, head); lid.rotation.x = -0.25;
      const ring = mesh(T, new T.TorusGeometry(0.3, 0.03, 8, 32), black, 0, 0, 0, head); ring.rotation.x = Math.PI / 2;
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; glowOrb(head, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, 0.018); }
      const legs = []; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; const p = new T.Group(); p.position.set(Math.cos(a) * 0.14, 0.58, Math.sin(a) * 0.14); body.add(p);
        let par = p; for (let j = 0; j < 5; j++) { const sg = mesh(T, new T.SphereGeometry(0.035 - j * 0.005, 8, 6), j % 2 ? bone : black, 0, -j * 0.07, 0, par); void sg; } legs.push(p); }
      glowOrb(body, 0, 0.5, 0, 0.04);
      return { g, body, head, skull: ball, legs, arms: [], kind: 'float', eyes: [] };
    }
    if (i === 4) { // 高瘦行者：很高很瘦、長手、皇冠狀頭骨、發光的臉部裂縫
      const r = humanoid(T, { bodyMat: black, legMat: black, armMat: black, headMat: black, handMat: bone, shoeMat: black, eyes: false, limbR: 0.028, torsoR: 0.08 });
      r.body.scale.set(0.9, 1.35, 0.9); r.arms.forEach(a => a.scale.y = 1.35);
      for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.2; const c = mesh(T, new T.ConeGeometry(0.025, 0.2 + (k === 3 ? 0.1 : 0), 5), bone, Math.sin(a) * 0.1, 0.12 + Math.cos(a) * 0.04, -0.02 + Math.cos(a) * 0.02, r.head); c.rotation.z = -a * 0.6; }
      const slit = mesh(T, new T.BoxGeometry(0.1, 0.014, 0.02), acc, 0, 0.0, 0.125, r.head); void slit;
      for (let k = 0; k < 6; k++) mesh(T, new T.TorusGeometry(0.075, 0.01, 4, 14), bone, 0, 0.5 + k * 0.06, 0, r.body).rotation.x = Math.PI / 2;
      [r.handL, r.handR].forEach(h => { for (let k = 0; k < 3; k++) mesh(T, new T.CylinderGeometry(0.006, 0.003, 0.12, 4), bone, -0.012 + k * 0.012, -0.07, 0, h); });
      const cape = mesh(T, new T.PlaneGeometry(0.3, 0.6), new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, side: T.DoubleSide, transparent: true, opacity: 0.6 }), 0, 0.55, -0.1, r.body); cape.rotation.x = 0.1;
      return r;
    }
    if (i === 5) { // 甲殼獸：矮壯、分節的圓形甲殼、短腳、發光縫隙
      const r = quadruped(T, { bodyMat: black, legMat: black, pawMat: bone, headR: 0.1, snout: 0.05, snoutLen: 0.8, snoutMat: bone, nose: false, len: 0.42, height: 0.16, wide: 0.24, bodyH: 0.3, legR: 0.05, eyeR: 0.022, iris: color, tail: { r: 0.04, len: 0.12, mat: bone } });
      for (let k = 0; k < 6; k++) { const band = mesh(T, new T.SphereGeometry(0.34 - Math.abs(k - 2.5) * 0.03, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), k % 2 ? bone : black, 0, 0.18, -0.28 + k * 0.11, r.body); band.scale.set(1, 0.85, 0.3); }
      for (let k = 0; k < 5; k++) mesh(T, new T.TorusGeometry(0.3 - Math.abs(k - 2) * 0.03, 0.01, 4, 24, Math.PI), acc, 0, 0.18, -0.22 + k * 0.11, r.body);
      for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.03, 0.08, 4), bone, 0, 0.47, -0.22 + k * 0.11, r.body);
      return r;
    }
    if (i === 6) { // 晶體生命：由會發光的水晶組成
      const crys = new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.82 });
      const core = M(T, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.5 });
      const r = humanoid(T, { bodyMat: crys, legMat: crys, armMat: crys, headMat: crys, handMat: crys, shoeMat: black, hipMat: black, eyes: false, limbR: 0.045 });
      r.skull.visible = false; mesh(T, new T.OctahedronGeometry(0.14, 0), crys, 0, 0.02, 0, r.head).scale.y = 1.4;
      mesh(T, new T.OctahedronGeometry(0.05, 0), core, 0, 0.02, 0, r.head);
      mesh(T, new T.OctahedronGeometry(0.07, 0), core, 0, 0.65, 0, r.body);
      const shards = []; for (let k = 0; k < 9; k++) { const sh = mesh(T, new T.OctahedronGeometry(0.05 + Math.random() * 0.04, 0), crys, (Math.random() - 0.5) * 0.3, 0.55 + Math.random() * 0.35, -0.08 - Math.random() * 0.06, r.body); sh.scale.y = 2.2; sh.rotation.set(Math.random() - 0.5, 0, (Math.random() - 0.5) * 1.2); shards.push(sh); }
      r.tick = (t) => { crys.emissiveIntensity = 0.45 + Math.sin(t * 3) * 0.25; shards.forEach((s2, k) => s2.rotation.y = t * 0.6 + k); };
      return r;
    }
    // 孢子旅者：無人深空風格的外星生物，大頭、皮膚是代表色、頭上長著發光植物
    const skin = M(T, color, { roughness: 0.6 }), belly = M(T, '#fff1d6', { roughness: 0.7 });
    const r = humanoid(T, { bodyMat: skin, legMat: skin, armMat: skin, headMat: skin, handMat: belly, shoeMat: M(T, '#5a2e6e'), headR: 0.17, iris: '#2a1a5e', browColor: '#5a2e6e', scale: 0.95 });
    r.head.position.y = 1.02; r.eyes.forEach(e => { e.scale.setScalar(1.6); e.position.y += 0.02; e.position.x *= 1.25; e.position.z += 0.02; });
    mesh(T, new T.SphereGeometry(0.09, 12, 10), belly, 0, 0.6, 0.07, r.body).scale.set(1, 1.3, 0.6);
    [-1, 1].forEach(sd => { const fr = mesh(T, new T.ConeGeometry(0.06, 0.2, 6), M(T, '#7df9ff', { emissive: '#3fd8c8', emissiveIntensity: 0.5 }), sd * 0.17, 0.02, -0.02, r.head); fr.rotation.z = -sd * 1.3; });
    const stalks = []; for (let k = 0; k < 3; k++) { const a = (k - 1) * 0.5; const st = new T.Group(); st.position.set(Math.sin(a) * 0.08, 0.14, -0.02); st.rotation.z = -a; r.head.add(st);
      mesh(T, new T.CylinderGeometry(0.008, 0.012, 0.18, 6), M(T, '#3a7a4a'), 0, 0.09, 0, st); const bulb = mesh(T, new T.SphereGeometry(0.035, 10, 8), M(T, ['#ff79c6', '#7df9ff', '#ffd27a'][k], { emissive: ['#ff79c6', '#7df9ff', '#ffd27a'][k], emissiveIntensity: 1.2 }), 0, 0.2, 0, st); void bulb; stalks.push(st); }
    r.tick = (t) => stalks.forEach((st, k) => st.rotation.x = Math.sin(t * 2 + k) * 0.15);
    return r;
  }

  // ---------- 花紋貼圖（布料刺繡、鱗片、羽毛、星星…），讓衣服和身體有細節 ----------
  const PATC = {};
  function PAT(T, kind, c1, c2, rep) {
    const key = kind + c1 + c2 + (rep || ''); if (PATC[key]) return PATC[key];
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, 256, 256); g.strokeStyle = g.fillStyle = c2;
    if (kind === 'cloud') { g.lineWidth = 5; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { const cx = x * 86 + (y % 2) * 43 + 20, cy = y * 86 + 40; g.beginPath(); g.arc(cx, cy, 16, Math.PI, Math.PI * 2.3); g.stroke(); g.beginPath(); g.arc(cx + 20, cy + 8, 11, Math.PI * 1.1, Math.PI * 2.5); g.stroke(); g.beginPath(); g.moveTo(cx - 16, cy + 4); g.quadraticCurveTo(cx + 8, cy + 26, cx + 34, cy + 14); g.stroke(); } }
    if (kind === 'scales') { for (let y = -1; y < 9; y++) for (let x = -1; x < 9; x++) { const cx = x * 32 + (y % 2) * 16, cy = y * 28; const gr = g.createRadialGradient(cx, cy + 6, 2, cx, cy + 4, 20); gr.addColorStop(0, c2); gr.addColorStop(1, c1); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 17, 0, Math.PI); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 17, 0, Math.PI); g.stroke(); } }
    if (kind === 'feathers') { for (let y = -1; y < 10; y++) for (let x = -1; x < 9; x++) { const cx = x * 30 + (y % 2) * 15, cy = y * 26; g.fillStyle = (x + y) % 3 ? c2 : c1; g.beginPath(); g.moveTo(cx - 14, cy); g.quadraticCurveTo(cx, cy + 34, cx + 14, cy); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + 24); g.stroke(); } }
    if (kind === 'stars') { g.globalAlpha = 0.9; for (let k = 0; k < 26; k++) { const x = (k * 97) % 256, y = (k * 61) % 256, r = 4 + (k % 4) * 3; g.beginPath(); for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5 - Math.PI / 2, rr = q % 2 ? r * 0.42 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); } g.globalAlpha = 0.5; for (let k = 0; k < 50; k++) { g.beginPath(); g.arc((k * 53) % 256, (k * 131) % 256, 1.5, 0, 7); g.fill(); } }
    if (kind === 'fur') { g.lineCap = 'round'; for (let k = 0; k < 900; k++) { const x = Math.random() * 256, y = Math.random() * 256, l = 6 + Math.random() * 10; g.strokeStyle = Math.random() < 0.5 ? c2 : 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 4, y + l); g.stroke(); } }
    if (kind === 'brocade') { g.lineWidth = 3; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const cx = x * 64 + 32 + (y % 2) * 32, cy = y * 64 + 32; g.beginPath(); for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4; g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); } g.stroke(); g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.stroke(); g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill(); } }
    if (kind === 'stripes') { for (let y = 0; y < 256; y += 32) { g.fillRect(0, y, 256, 10); } }
    if (kind === 'plates') { g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.4)'; for (let y = 0; y < 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } g.fillStyle = c2; for (let y = 16; y < 256; y += 32) for (let x = 16; x < 256; x += 48) { g.beginPath(); g.arc(x + (y / 32 % 2) * 24, y, 4, 0, 7); g.fill(); } }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep || 2, rep || 2); return (PATC[key] = t);
  }
  const PM = (T, kind, c1, c2, rep, e) => M(T, '#ffffff', Object.assign({ map: PAT(T, kind, c1, c2, rep) }, e || {}));

  // ---------- 蛇類（那伽、大巨蛇）：盤起的身體＋抬起的頭 ----------
  function serpent(T, o) {
    const g = new T.Group(), body = new T.Group(); g.add(body);
    const pts = []; for (let k = 0; k <= 26; k++) { const a = k * 0.55, rr = 0.26 - k * 0.006; pts.push(new T.Vector3(Math.cos(a) * rr, 0.07 + k * 0.012 + (k > 18 ? (k - 18) * 0.07 : 0), Math.sin(a) * rr * (k > 18 ? 0.4 : 1))); }
    mesh(T, new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, o.thick || 0.07, 10), o.mat, 0, 0, 0, body);
    const top = pts[pts.length - 1];
    const head = new T.Group(); head.position.copy(top); head.position.y += 0.05; body.add(head);
    const skull = mesh(T, new T.SphereGeometry(o.headR || 0.1, 14, 10), o.mat, 0, 0, 0.04, head); skull.scale.set(1, 0.75, 1.45);
    const hr = o.headR || 0.1; const eyes = [-1, 1].map(sd => { const e = mesh(T, new T.SphereGeometry(hr * 0.24, 10, 8), o.eyeMat, sd * hr * 0.62, hr * 0.42, 0.04 + hr * 0.95, head); e.scale.set(1.2, 0.75, 0.8); return e; });
    const tongue = mesh(T, new T.BoxGeometry(0.012, 0.005, 0.12), M(T, '#d11a3a'), 0, -hr * 0.2, 0.04 + hr * 1.5, head);
    return { g, body, head, skull, legs: [], arms: [], kind: 'float', eyes: [], tongue, pts };
  }
  // ---------- 鳥類（貓頭鷹、鳳凰、天狗翅膀用）----------
  function wing(T, mat, sd, parent, x, y, z, s) {
    const w = new T.Group(); w.position.set(x, y, z); parent.add(w);
    for (let k = 0; k < 5; k++) { const f = mesh(T, new T.CapsuleGeometry(0.035 * s, (0.3 - k * 0.04) * s, 4, 6), mat, sd * (0.06 + k * 0.05) * s, -k * 0.035 * s, -0.02, w); f.rotation.z = sd * (1.2 + k * 0.12); }
    return w;
  }

  function buddha(T, i, color) {
    const gold = M(T, '#e0b040', { metalness: 0.85, roughness: 0.25 }), red = M(T, '#c21d24', { roughness: 0.5 });
    if (i === 3 || i === 6) { // 舞獅／雪獅
      const snow = i === 6, furC = snow ? '#f4f6f8' : '#d82a22', mane = M(T, snow ? '#3fc0c8' : '#ffcf3a', { roughness: 0.9 });
      const r = quadruped(T, { bodyMat: snow ? PM(T, 'fur', '#f2f6f8', '#c8dce4', 2, { roughness: 0.95 }) : PM(T, 'scales', '#c81e1a', '#ffcf3a', 3, { roughness: 0.6 }), legMat: snow ? PM(T, 'fur', '#e8eef0', '#c0d0d8', 2, { roughness: 0.95 }) : PM(T, 'stripes', '#f2e6c8', '#d82a22', 2, { roughness: 0.8 }), headR: 0.2, len: 0.48, height: 0.3, legR: 0.055, neck: 0.08, tail: { r: 0.05, len: 0.2, lift: 0.8, mat: mane }, iris: '#1a1a1a' });
      r.skull.scale.set(1.15, 1, 1.05);
      if (!snow) { const horn = mesh(T, new T.ConeGeometry(0.035, 0.12, 8), gold, 0, 0.21, 0.04, r.head); horn.rotation.x = -0.3; mesh(T, new T.SphereGeometry(0.07, 10, 8), M(T, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.3 }), 0, 0.2, 0.08, r.head).scale.set(1.4, 0.5, 0.6); } // 獅頭鏡
      const mouth = mesh(T, new T.BoxGeometry(0.22, 0.05, 0.08), M(T, '#2a0a0a'), 0, -0.1, 0.17, r.head); void mouth;
      [-1, 1].forEach(sd => mesh(T, new T.BoxGeometry(0.035, 0.03, 0.02), M(T, '#ffffff'), sd * 0.06, -0.075, 0.21, r.head));
      for (let k = 0; k < 22; k++) { const a = k / 22 * Math.PI * 2; const m = mesh(T, new T.ConeGeometry(0.045, snow ? 0.2 : 0.14, 5), mane, Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.06, r.head); m.rotation.z = a - Math.PI / 2; m.rotation.x = -0.3; }
      [-1, 1].forEach(sd => { const e = mesh(T, new T.SphereGeometry(0.06, 10, 8), mane, sd * 0.17, 0.14, -0.02, r.head); e.scale.set(0.6, 1, 0.5); });
      r.eyes.forEach(e => e.scale.setScalar(1.6));
      r.tick = (t, s) => { r.head.rotation.z = Math.sin(t * 6) * (s === 'idle' ? 0.12 : 0.05); r.head.rotation.y = Math.sin(t * 3) * 0.15; };
      return r;
    }
    if (i === 5) { // 那伽：多頭蛇，鱗片金邊，頭冠展開
      const r = serpent(T, { mat: PM(T, 'scales', '#1f6fb8', '#7ad8ff', 6, { roughness: 0.35, metalness: 0.3 }), eyeMat: M(T, '#ffd23a', { emissive: '#ffb000', emissiveIntensity: 2 }), thick: 0.075, headR: 0.1 });
      for (let k = -2; k <= 2; k++) { if (!k) continue; const h = mesh(T, new T.SphereGeometry(0.07, 10, 8), r.skull.material, k * 0.08, -0.02 - Math.abs(k) * 0.03, -0.04, r.head); h.scale.set(1, 0.7, 1.4); [-1, 1].forEach(sd => mesh(T, new T.SphereGeometry(0.012, 6, 4), M(T, '#ffd23a', { emissive: '#ffb000', emissiveIntensity: 2 }), k * 0.08 + sd * 0.03, 0, 0.04, r.head)); }
      const hood = mesh(T, new T.SphereGeometry(0.22, 16, 8, 0, Math.PI, 0, Math.PI), gold, 0, 0.02, -0.08, r.head); hood.scale.set(1.2, 1, 0.2); hood.rotation.y = Math.PI;
      for (let k = 0; k < 5; k++) mesh(T, new T.ConeGeometry(0.02, 0.1, 6), gold, (k - 2) * 0.07, 0.2 - Math.abs(k - 2) * 0.03, -0.08, r.head);
      r.tick = (t) => { r.head.rotation.y = Math.sin(t * 1.5) * 0.3; r.tongue.scale.z = 0.5 + Math.abs(Math.sin(t * 8)) * 0.8; };
      return r;
    }
    const skinC = { 0: '#ffd6c6', 1: '#f4f4f2', 2: '#1e1e26', 4: '#3fa868', 7: '#c8202a' }[i];
    const robeC = { 0: '#e0b040', 1: '#f2f0ea', 2: '#22222a', 4: '#7a3ac8', 7: '#2a2a32' }[i];
    const skin = M(T, skinC, { roughness: 0.6 });
    const robe = i === 0 ? PM(T, 'plates', '#d8a838', '#fff0a0', 2, { metalness: 0.55, roughness: 0.35 }) : i === 1 ? PM(T, 'cloud', '#f2f0ea', '#c8c0b0', 2, { roughness: 0.75 }) : i === 2 ? PM(T, 'cloud', '#22222a', '#4a4a5a', 2, { roughness: 0.75 }) : i === 4 ? PM(T, 'brocade', '#6a2ab8', '#e0b040', 2, { roughness: 0.6 }) : PM(T, 'cloud', '#2a2a32', '#55556a', 2, { roughness: 0.8 });
    const r = humanoid(T, { bodyMat: robe, legMat: i === 0 ? red : robe, armMat: i === 4 ? skin : robe, headMat: skin, handMat: skin, iris: i === 2 || i === 4 ? '#ffffff' : '#1a120c', scale: i === 1 ? 1.22 : i === 0 ? 0.95 : 1, headR: i === 0 ? 0.19 : 0.13 });
    const skirt = mesh(T, new T.CylinderGeometry(0.13, 0.2, 0.3, 16, 1, true), M(T, robeC, { side: T.DoubleSide, roughness: 0.7 }), 0, 0.38, 0, r.body); void skirt;
    if (i === 0) { // 電音三太子：大頭、雙髻、墨鏡、金甲、紅肚兜、奶嘴
      [-1, 1].forEach(sd => mesh(T, new T.SphereGeometry(0.07, 12, 10), M(T, '#141414'), sd * 0.11, 0.15, -0.02, r.head));
      mesh(T, new T.SphereGeometry(0.195, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), M(T, '#141414'), 0, 0.02, -0.01, r.head);
      const gl = mesh(T, new T.BoxGeometry(0.24, 0.06, 0.03), M(T, '#0a0a0a', { metalness: 0.9, roughness: 0.05 }), 0, 0.02, 0.17, r.head); void gl;
      mesh(T, new T.TorusGeometry(0.025, 0.008, 6, 12), M(T, '#ff7ab8'), 0, -0.07, 0.18, r.head);
      mesh(T, new T.SphereGeometry(0.03, 8, 6), M(T, '#ff7ab8'), 0, -0.07, 0.17, r.head);
      [-1, 1].forEach(sd => { const c = mesh(T, new T.SphereGeometry(0.04, 8, 6), M(T, '#ff9aa8'), sd * 0.1, -0.04, 0.14, r.head); c.scale.z = 0.3; });
      const sash = mesh(T, new T.TorusGeometry(0.14, 0.03, 6, 18), M(T, color, { emissive: color, emissiveIntensity: 0.6 }), 0, 0.64, 0, r.body); sash.rotation.set(Math.PI / 2.4, 0, 0.6);
      r.tick = (t, s) => { if (s === 'idle') { r.body.rotation.y = Math.sin(t * 4) * 0.35; r.head.rotation.z = Math.sin(t * 8) * 0.12; r.arms.forEach((a, k) => a.rotation.z = (k ? -1 : 1) * (0.4 + Math.abs(Math.sin(t * 8)) * 0.5)); } };
    }
    if (i === 1) { // 七爺：高帽「一見大吉」、長舌、白袍
      const hat = mesh(T, new T.CylinderGeometry(0.06, 0.12, 0.42, 12), M(T, '#f6f6f0'), 0, 0.3, 0, r.head); void hat;
      const [c, g] = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 128; return [c, c.getContext('2d')]; })(); g.fillStyle = '#f6f6f0'; g.fillRect(0, 0, 32, 128); g.fillStyle = '#b01010'; g.font = 'bold 26px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif'; g.textAlign = 'center'; '一見大吉'.split('').forEach((ch, k) => g.fillText(ch, 16, 28 + k * 30));
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; mesh(T, new T.PlaneGeometry(0.07, 0.3), new T.MeshBasicMaterial({ map: tx }), 0, 0.3, 0.092, r.head);
      const tg = mesh(T, new T.BoxGeometry(0.04, 0.16, 0.012), M(T, '#d0122a'), 0, -0.13, 0.13, r.head); tg.rotation.x = -0.2;
      const fan = mesh(T, new T.CircleGeometry(0.12, 16, 0, Math.PI), M(T, '#f0e8d0', { side: T.DoubleSide }), 0, 0.05, 0.03, r.handR); fan.rotation.y = Math.PI / 2;
      mesh(T, new T.TorusGeometry(0.11, 0.02, 6, 18), M(T, color), 0, 0.58, 0, r.body).rotation.x = Math.PI / 2;
    }
    if (i === 2) { // 八爺：黑臉、方帽、令牌、鐵鍊
      mesh(T, new T.BoxGeometry(0.24, 0.16, 0.24), M(T, '#141418'), 0, 0.17, 0, r.head);
      const [c, g] = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 64; return [c, c.getContext('2d')]; })(); g.fillStyle = '#141418'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#e8c35a'; g.font = 'bold 28px "Songti TC","Noto Serif TC","Noto Serif CJK TC",serif'; g.textAlign = 'center'; g.fillText('善惡', 32, 40);
      const tx = new T.CanvasTexture(c); tx.colorSpace = T.SRGBColorSpace; mesh(T, new T.PlaneGeometry(0.16, 0.12), new T.MeshBasicMaterial({ map: tx }), 0, 0.17, 0.122, r.head);
      mesh(T, new T.BoxGeometry(0.1, 0.18, 0.02), M(T, '#3a2a1a'), 0, -0.02, 0.04, r.handR);
      for (let k = 0; k < 6; k++) { const l = mesh(T, new T.TorusGeometry(0.02, 0.006, 4, 8), M(T, '#9a9aa8', { metalness: 0.9, roughness: 0.3 }), 0, -0.03 - k * 0.03, 0, r.handL); l.rotation.y = k % 2 ? Math.PI / 2 : 0; }
      mesh(T, new T.TorusGeometry(0.13, 0.02, 6, 18), M(T, color), 0, 0.58, 0, r.body).rotation.x = Math.PI / 2;
    }
    if (i === 4) { // 夜叉守門神（泰國 Yak）：綠臉、尖金冠、獠牙、大棒
      r.g.scale.setScalar(1.15);
      const crown = new T.Group(); crown.position.y = 0.08; r.head.add(crown);
      for (let k = 0; k < 4; k++) mesh(T, new T.CylinderGeometry(0.11 - k * 0.025, 0.13 - k * 0.025, 0.08, 12), gold, 0, k * 0.08, 0, crown);
      mesh(T, new T.ConeGeometry(0.03, 0.25, 8), gold, 0, 0.42, 0, crown);
      [-1, 1].forEach(sd => { const f = mesh(T, new T.ConeGeometry(0.014, 0.06, 6), M(T, '#fffbe8'), sd * 0.05, -0.07, 0.11, r.head); f.rotation.x = 0.2; });
      r.head.traverse(c => { if (c.geometry && c.geometry.parameters && c.geometry.parameters.radius === 0.018) c.material = M(T, '#ffd23a', { emissive: '#ff9a00', emissiveIntensity: 1.5 }); });
      const club = mesh(T, new T.CylinderGeometry(0.035, 0.02, 0.55, 8), gold, 0, 0.12, 0.05, r.handR); club.rotation.x = 0.3;
      [-1, 1].forEach(sd => mesh(T, new T.SphereGeometry(0.08, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold, sd * 0.17, 0.79, 0, r.body));
      mesh(T, new T.TorusGeometry(0.13, 0.02, 6, 18), M(T, color), 0, 0.5, 0, r.body).rotation.x = Math.PI / 2;
    }
    if (i === 7) { // 天狗：紅臉長鼻、黑翅膀、頭襟、羽扇
      const nose = mesh(T, new T.CylinderGeometry(0.012, 0.025, 0.2, 8), skin, 0, 0, 0.2, r.head); nose.rotation.x = Math.PI / 2 - 0.15;
      mesh(T, new T.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), M(T, '#f0f0f0', { roughness: 0.9 }), 0, 0.01, -0.02, r.head);
      mesh(T, new T.CylinderGeometry(0.035, 0.045, 0.05, 6), M(T, '#111'), 0, 0.14, 0.04, r.head);
      const fm = M(T, '#1a1a22', { roughness: 0.8 }); [-1, 1].forEach(sd => wing(T, fm, sd, r.body, sd * 0.08, 0.78, -0.12, 1.1));
      const fan = mesh(T, new T.CircleGeometry(0.11, 10, Math.PI * 0.2, Math.PI * 0.6), M(T, '#3a5a2a', { side: T.DoubleSide }), 0, 0.12, 0, r.handR); void fan;
      mesh(T, new T.TorusGeometry(0.13, 0.02, 6, 18), M(T, color), 0, 0.5, 0, r.body).rotation.x = Math.PI / 2;
      // 山伏的結袈裟（胸前一排毛球）＋一本齒木屐
      for (let k = 0; k < 3; k++) mesh(T, new T.SphereGeometry(0.03, 10, 8), M(T, '#f0f0f0', { roughness: 1 }), 0, 0.72 - k * 0.07, 0.11, r.body);
      r.legs.forEach(l => { mesh(T, new T.BoxGeometry(0.09, 0.025, 0.15), M(T, '#7a5030'), 0, -0.33, 0.01, l); mesh(T, new T.BoxGeometry(0.02, 0.06, 0.12), M(T, '#5a3a20'), 0, -0.37, 0.01, l); });
    }
    if (i === 0) { // 三太子：乾坤圈、腳踩風火輪、紅肚兜金邊、肩甲
      const ring = mesh(T, new T.TorusGeometry(0.06, 0.014, 8, 20), gold, 0, -0.05, 0, r.handL); ring.rotation.x = Math.PI / 2;
      r.legs.forEach(l => { const w = mesh(T, new T.TorusGeometry(0.07, 0.022, 8, 22), M(T, '#ff6a1a', { emissive: '#ff3a00', emissiveIntensity: 1.2 }), 0, -0.36, 0, l); w.rotation.y = Math.PI / 2; const f = mesh(T, new T.ConeGeometry(0.05, 0.12, 8), M(T, '#ffd23a', { emissive: '#ff8a00', emissiveIntensity: 1.6, transparent: true, opacity: 0.85 }), 0, -0.36, -0.08, l); f.rotation.x = -1.6; });
      const bib = mesh(T, new T.BoxGeometry(0.16, 0.16, 0.02), PM(T, 'cloud', '#c81e24', '#ffd23a', 1), 0, 0.62, 0.105, r.body); bib.rotation.z = Math.PI / 4;
      [-1, 1].forEach(sd => { const pad = mesh(T, new T.SphereGeometry(0.07, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold, sd * 0.17, 0.78, 0, r.body); pad.rotation.z = -sd * 0.4; });
    }
    if (i === 1 || i === 2) { // 七爺八爺：黑色領口、紅腰帶垂穗、手上的扇／令牌已在上面
      mesh(T, new T.TorusGeometry(0.08, 0.018, 6, 18), M(T, i === 1 ? '#1a1a1a' : '#c0a050'), 0, 0.86, 0, r.body).rotation.x = Math.PI / 2;
      [-1, 1].forEach(sd => { const tz = mesh(T, new T.CylinderGeometry(0.008, 0.02, 0.16, 6), M(T, '#c81e24'), sd * 0.05, 0.42, 0.12, r.body); tz.rotation.z = sd * 0.1; });
    }
    if (i === 4) { // 夜叉：金項圈、手環、腰間護甲
      mesh(T, new T.TorusGeometry(0.1, 0.025, 8, 20), gold, 0, 0.86, 0, r.body).rotation.x = Math.PI / 2;
      [r.handL, r.handR].forEach(h => mesh(T, new T.TorusGeometry(0.04, 0.012, 6, 14), gold, 0, 0.04, 0, h).rotation.x = Math.PI / 2);
      for (let k = 0; k < 5; k++) { const pl = mesh(T, new T.BoxGeometry(0.06, 0.1, 0.015), gold, (k - 2) * 0.06, 0.4, 0.15 - Math.abs(k - 2) * 0.02, r.body); pl.rotation.y = (k - 2) * 0.3; }
    }
    return r;
  }

  function magic(T, i, color) {
    if (i === 1) { // 大巨蛇：粗壯綠鱗、發光黃眼
      const r = serpent(T, { mat: PM(T, 'scales', '#1e5a2a', '#6aaa50', 6, { roughness: 0.35, metalness: 0.25 }), eyeMat: M(T, '#f5e23a', { emissive: '#e0c000', emissiveIntensity: 2.4 }), thick: 0.095, headR: 0.13 });
      r.g.scale.setScalar(1.15);
      const belly = M(T, '#c8c27a'); mesh(T, new T.SphereGeometry(0.09, 10, 8), belly, 0, -0.04, 0.1, r.head).scale.set(0.9, 0.4, 1.3);
      r.tick = (t) => { r.head.rotation.y = Math.sin(t * 1.2) * 0.4; r.head.position.y = r.pts[r.pts.length - 1].y + 0.05 + Math.sin(t * 2) * 0.03; r.tongue.scale.z = 0.4 + Math.abs(Math.sin(t * 7)) * 0.9; };
      return r;
    }
    if (i === 2 || i === 5) { // 貓頭鷹信使／鳳凰：站立的鳥
      const fire = i === 5;
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const bm = fire ? PM(T, 'feathers', '#ff6a1a', '#ffc040', 3, { emissive: '#ff4a00', emissiveIntensity: 0.6, roughness: 0.4 }) : PM(T, 'feathers', '#8a6440', '#c8a070', 3, { roughness: 0.95 });
      const torso = mesh(T, new T.SphereGeometry(0.22, 18, 14), bm, 0, 0.38, 0, body); torso.scale.set(fire ? 0.8 : 1, fire ? 1.15 : 1.15, fire ? 0.8 : 0.95);
      const belly = mesh(T, new T.SphereGeometry(0.17, 14, 10), fire ? M(T, '#ffd23a', { emissive: '#ffb000', emissiveIntensity: 0.8 }) : M(T, '#ead8bc', { roughness: 0.95 }), 0, 0.34, 0.07, body); belly.scale.set(0.9, 1.1, 0.7);
      const head = new T.Group(); head.position.y = fire ? 0.7 : 0.66; body.add(head);
      const skull = mesh(T, new T.SphereGeometry(fire ? 0.12 : 0.17, 16, 12), bm, 0, 0, 0, head);
      const eyes = [];
      if (!fire) { [-1, 1].forEach(sd => { const disc = mesh(T, new T.CircleGeometry(0.075, 18), M(T, '#f2e8d4'), sd * 0.075, 0.01, 0.15, head); void disc; eyes.push(eye(T, head, sd * 0.075, 0.01, 0.155, 0.05, '#f0a000')); });
        [-1, 1].forEach(sd => { const t2 = mesh(T, new T.ConeGeometry(0.035, 0.1, 4), bm, sd * 0.12, 0.15, 0, head); t2.rotation.z = -sd * 0.3; });
        const env = mesh(T, new T.BoxGeometry(0.16, 0.1, 0.01), M(T, '#f8f2e2'), 0, 0.22, 0.2, body); env.rotation.x = -0.2; mesh(T, new T.CircleGeometry(0.013, 10), M(T, '#6a0e0e'), 0.03, 0.2, 0.207, body).rotation.x = -0.2;
      } else { [-1, 1].forEach(sd => eyes.push(eye(T, head, sd * 0.05, 0.02, 0.09, 0.025, '#1a0a00')));
        for (let k = 0; k < 5; k++) { const c = mesh(T, new T.ConeGeometry(0.025, 0.16, 6), M(T, '#ffe04a', { emissive: '#ffa000', emissiveIntensity: 1.5 }), (k - 2) * 0.03, 0.14, -0.02 - Math.abs(k - 2) * 0.015, head); c.rotation.x = -0.3; c.rotation.z = (k - 2) * -0.2; } }
      const beak = mesh(T, new T.ConeGeometry(0.03, 0.08, 6), M(T, fire ? '#ffd23a' : '#4a3a2a'), 0, fire ? 0 : -0.04, fire ? 0.13 : 0.16, head); beak.rotation.x = fire ? Math.PI / 2 : Math.PI / 1.6;
      const wm = fire ? M(T, '#ff4a1a', { emissive: '#ff2a00', emissiveIntensity: 1 }) : M(T, '#7a5a3a', { roughness: 0.95 });
      const wings = [-1, 1].map(sd => wing(T, wm, sd, body, sd * 0.15, 0.48, -0.02, fire ? 1.3 : 0.9));
      const legs = [-1, 1].map(sd => { const l = limb(T, M(T, fire ? '#c04a00' : '#d0a040'), 0.06, 0.02, sd * 0.07, 0.17, 0); body.add(l); return l; });
      let flames = [];
      if (fire) { for (let k = 0; k < 7; k++) { const f = mesh(T, new T.ConeGeometry(0.04, 0.45 - Math.abs(k - 3) * 0.05, 6), M(T, k % 2 ? '#ffd23a' : '#ff5a1a', { emissive: k % 2 ? '#ffb000' : '#ff3000', emissiveIntensity: 2, transparent: true, opacity: 0.9 }), (k - 3) * 0.04, 0.2, -0.28, body); f.rotation.x = -1.9; flames.push(f); } }
      const r = { g, body, head, skull, legs, arms: [], eyes, kind: 'biped' };
      r.tick = (t, s) => { wings.forEach((w, k) => w.rotation.z = (k ? -1 : 1) * (s === 'joy' || s === 'walk' ? Math.sin(t * 18) * 0.5 : Math.sin(t * 2) * 0.05)); if (!fire) head.rotation.y = Math.sin(t * 0.6) * 0.6; flames.forEach((f, k) => f.scale.y = 1 + Math.sin(t * 12 + k) * 0.2); };
      return r;
    }
    if (i === 3) { // 小火龍：圓滾滾、翅膀、角、尾巴火焰
      const sc = PM(T, 'scales', '#e8501a', '#ffa040', 4, { roughness: 0.45 }), belly = PM(T, 'stripes', '#ffd890', '#e8b060', 2, { roughness: 0.6 });
      const r = quadruped(T, { bodyMat: sc, bellyMat: belly, legMat: sc, headR: 0.16, snout: 0.07, snoutLen: 1.3, len: 0.42, height: 0.24, legR: 0.05, neck: 0.12, tail: { r: 0.04, len: 0.36, lift: 0.2 }, iris: '#1a1a1a', noseColor: '#a03010' });
      [-1, 1].forEach(sd => { const h = mesh(T, new T.ConeGeometry(0.025, 0.12, 6), M(T, '#fff2c8'), sd * 0.07, 0.14, -0.04, r.head); h.rotation.x = -0.5; });
      const wm = M(T, '#c03a1a', { side: T.DoubleSide }); const wings = [-1, 1].map(sd => { const w = new T.Group(); w.position.set(sd * 0.12, 0.55, 0); r.body.add(w); const shp = new T.Shape(); shp.moveTo(0, 0); shp.lineTo(0.05, 0.14); shp.lineTo(0.09, 0.06); shp.lineTo(0.13, 0.11); shp.lineTo(0.15, 0.02); shp.lineTo(0.11, -0.02); shp.closePath(); const m = mesh(T, new T.ShapeGeometry(shp), wm, 0, 0, 0, w); m.scale.x = sd; m.rotation.y = sd * 0.5; return w; });
      const fl = mesh(T, new T.ConeGeometry(0.05, 0.14, 8), M(T, '#ffd23a', { emissive: '#ff8a00', emissiveIntensity: 2.5 }), 0, 0.04, -0.38, r.tail); fl.rotation.x = -1.2;
      for (let k = 0; k < 6; k++) { const sp = mesh(T, new T.ConeGeometry(0.03 - k * 0.003, 0.08, 6), M(T, '#ffd890'), 0, 0.5 - k * 0.01, 0.2 - k * 0.09, r.body); sp.rotation.x = -0.4; }
      r.tick = (t) => { wings.forEach((w, k) => w.rotation.z = (k ? -1 : 1) * Math.sin(t * 6) * 0.35); fl.scale.setScalar(1 + Math.sin(t * 14) * 0.2); };
      return r;
    }
    if (i === 4) { // 獨角獸：白色、金色螺旋角、粉彩鬃毛
      const wh = M(T, '#f8f6ff', { roughness: 0.5 });
      const r = quadruped(T, { bodyMat: wh, legMat: wh, headR: 0.12, snout: 0.07, snoutLen: 1.5, len: 0.55, height: 0.42, legR: 0.04, neck: 0.22, pawMat: M(T, '#d8b04a', { metalness: 0.6 }), tail: { r: 0.05, len: 0.3, lift: 0.4, mat: M(T, '#c8a8ff') }, iris: '#5a3a9a', noseColor: '#e8a8c0' });
      const horn = mesh(T, new T.ConeGeometry(0.025, 0.24, 12), M(T, '#ffd86a', { metalness: 0.8, roughness: 0.2, emissive: '#ffb000', emissiveIntensity: 0.4 }), 0, 0.15, 0.06, r.head); horn.rotation.x = 0.5;
      const cols = ['#ff9ad8', '#c8a8ff', '#8ad8ff', '#ffe08a']; for (let k = 0; k < 8; k++) { const m = mesh(T, new T.SphereGeometry(0.045, 8, 6), M(T, cols[k % 4]), 0, 0.12 - k * 0.04, -0.06 - k * 0.025, r.head); m.scale.set(0.7, 1, 1.3); }
      [-1, 1].forEach(sd => { const e = mesh(T, new T.ConeGeometry(0.025, 0.08, 6), wh, sd * 0.06, 0.12, -0.03, r.head); e.rotation.z = -sd * 0.2; });
      return r;
    }
    if (i === 6) { // 人馬：馬身＋人類上半身＋弓
      const coat = PM(T, 'fur', '#7a4a2a', '#9a6a40', 2, { roughness: 0.85 }), skin = M(T, '#c89a72');
      const r = quadruped(T, { bodyMat: coat, legMat: coat, headR: 0.001, len: 0.5, height: 0.36, legR: 0.045, neck: 0, tail: { r: 0.04, len: 0.3, lift: 0.3, mat: M(T, '#2a1a10') } });
      r.head.visible = false;
      const up = humanoid(T, { bodyMat: skin, legMat: coat, armMat: skin, headMat: skin, iris: '#2a1a0a' });
      up.legs.forEach(l => l.visible = false); up.g.position.set(0, 0.3, 0.3); up.g.scale.setScalar(0.85); r.body.add(up.g);
      mesh(T, new T.SphereGeometry(0.137, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.7), M(T, '#3a2414'), 0, 0.02, -0.02, up.head);
      const bow = mesh(T, new T.TorusGeometry(0.22, 0.012, 6, 20, Math.PI), M(T, '#5a3a1a'), 0, 0.02, 0, up.handL); bow.rotation.z = Math.PI / 2;
      const sash = mesh(T, new T.TorusGeometry(0.13, 0.02, 6, 18), M(T, color), 0, 0.64, 0, up.body); sash.rotation.set(Math.PI / 2.4, 0, 0.6);
      const qv = mesh(T, new T.CylinderGeometry(0.045, 0.04, 0.26, 10), PM(T, 'brocade', '#5a3018', '#c89040', 1), 0.06, 0.72, -0.12, up.body); qv.rotation.z = 0.4; for (let k = 0; k < 3; k++) { const ar = mesh(T, new T.CylinderGeometry(0.006, 0.006, 0.12, 4), M(T, '#e8e0d0'), 0.12 + k * 0.015, 0.87 + k * 0.01, -0.12, up.body); ar.rotation.z = 0.4; mesh(T, new T.ConeGeometry(0.015, 0.04, 3), M(T, '#c82020'), 0.15 + k * 0.015, 0.93 + k * 0.01, -0.12, up.body).rotation.z = 0.4; }
      r.head = up.head; r.arms = up.arms; r.eyes = up.eyes; r.skull = up.skull;
      return r;
    }
    if (i === 7) { // 狼人：灰毛、駝背、狼頭、利爪
      const fur = PM(T, 'fur', '#55555f', '#8a8a98', 2, { roughness: 0.95 }), pale = PM(T, 'fur', '#9a9aa6', '#c8c8d0', 2, { roughness: 0.95 });
      const r = humanoid(T, { bodyMat: fur, legMat: fur, armMat: fur, headMat: fur, handMat: pale, iris: '#ffb000', eyes: false, scale: 1.12 });
      r.body.rotation.x = 0.25; r.torso.scale.set(1.25, 1.1, 0.9);
      const sn = mesh(T, new T.ConeGeometry(0.06, 0.18, 8), pale, 0, -0.03, 0.15, r.head); sn.rotation.x = Math.PI / 2;
      mesh(T, new T.SphereGeometry(0.022, 8, 6), M(T, '#0a0a0a'), 0, -0.01, 0.24, r.head);
      [-1, 1].forEach(sd => { const e = mesh(T, new T.ConeGeometry(0.04, 0.12, 4), fur, sd * 0.08, 0.13, -0.02, r.head); e.rotation.z = -sd * 0.25; });
      const glow = M(T, '#ffb000', { emissive: '#ff8a00', emissiveIntensity: 2.2 }); r.eyes = [-1, 1].map(sd => { const e = mesh(T, new T.SphereGeometry(0.02, 8, 6), glow, sd * 0.05, 0.035, 0.11, r.head); e.scale.set(1.3, 0.7, 0.6); return e; });
      [r.handL, r.handR].forEach(h => { for (let k = 0; k < 3; k++) { const c = mesh(T, new T.ConeGeometry(0.008, 0.06, 4), M(T, '#eee'), (k - 1) * 0.02, -0.04, 0.02, h); c.rotation.x = Math.PI; } });
      for (let k = 0; k < 7; k++) { const m = mesh(T, new T.ConeGeometry(0.04, 0.14, 5), fur, (k - 3) * 0.04, 0.88, -0.08, r.body); m.rotation.x = -2.2; }
      mesh(T, new T.TorusGeometry(0.13, 0.02, 6, 18), M(T, color), 0, 0.47, 0, r.body).rotation.x = Math.PI / 2;
      // 被撐破的褲子
      r.legs.forEach((l, k) => { const pt = mesh(T, new T.CylinderGeometry(0.075, 0.068, 0.16, 8, 1, true), M(T, '#3a3060', { side: T.DoubleSide, roughness: 0.9 }), 0, -0.06, 0, l); for (let q = 0; q < 4; q++) { const tr = mesh(T, new T.ConeGeometry(0.02, 0.05, 3), M(T, '#3a3060'), Math.cos(q * 1.6) * 0.06, -0.16, Math.sin(q * 1.6) * 0.06, l); tr.rotation.x = Math.PI; } });
      return r;
    }
    // 0 見習巫師：尖帽、長袍、圍巾、發光魔杖
    const robe = PM(T, 'stars', '#241a48', '#e8c46a', 2, { roughness: 0.8 }), skin = M(T, '#f0cfb0');
    const r = humanoid(T, { bodyMat: robe, legMat: robe, armMat: robe, headMat: skin, iris: '#3a6a3a' });
    mesh(T, new T.CylinderGeometry(0.13, 0.22, 0.34, 16, 1, true), M(T, '#2a2050', { side: T.DoubleSide, roughness: 0.8 }), 0, 0.36, 0, r.body);
    mesh(T, new T.SphereGeometry(0.137, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), M(T, '#7a3a1a', { roughness: 0.9 }), 0, 0.01, -0.01, r.head);
    const brim = mesh(T, new T.CylinderGeometry(0.24, 0.24, 0.015, 24), robe, 0, 0.1, 0, r.head); void brim;
    const hat = mesh(T, new T.ConeGeometry(0.13, 0.36, 16), robe, 0.02, 0.27, -0.02, r.head); hat.rotation.z = -0.2;
    [0, 1, 2].forEach(k => mesh(T, new T.TorusGeometry(0.075, 0.025, 6, 16), M(T, k % 2 ? '#e8c46a' : color), 0, 0.84 - k * 0.0, 0, r.body).rotation.x = Math.PI / 2);
    const wand = mesh(T, new T.CylinderGeometry(0.008, 0.012, 0.28, 6), M(T, '#4a2a14'), 0, 0.08, 0.06, r.handR); wand.rotation.x = 0.8;
    mesh(T, new T.TorusGeometry(0.135, 0.015, 6, 20), M(T, '#7a4a20'), 0, 0.52, 0, r.body).rotation.x = Math.PI / 2; mesh(T, new T.BoxGeometry(0.06, 0.07, 0.03), M(T, '#8a5a28'), 0.09, 0.47, 0.12, r.body);
    const book = mesh(T, new T.BoxGeometry(0.1, 0.13, 0.035), PM(T, 'brocade', '#6a1a1a', '#e8c46a', 1), 0, -0.02, 0.04, r.handL); book.rotation.y = 0.3;
    const tip = mesh(T, new T.SphereGeometry(0.02, 8, 6), M(T, '#bfe8ff', { emissive: '#8ad0ff', emissiveIntensity: 3 }), 0, 0.17, 0.17, r.handR);
    r.tick = (t) => { tip.scale.setScalar(1 + Math.sin(t * 6) * 0.3); };
    return r;
  }


  // ===== 怪奇小鎮：80 年代小鎮的原創角色 =====
  function town(T, i, color) {
    const jeans = PM(T, 'stripes', '#3a5a8a', '#34527e', 6, { roughness: 0.9 }), sneaker = M(T, '#f2f2ee', { roughness: 0.6 });
    const skinA = M(T, '#f2cfb0', { roughness: 0.6 }), skinB = M(T, '#d9a780', { roughness: 0.6 });
    const curls = (head, mat, n, r0, yTop) => { let made = 0; for (let k = 0; made < n && k < n * 4; k++) { const a = k * 2.399, h = (k % n) / n; const y = yTop - h * 0.16, rr = r0 * (0.75 + 0.25 * Math.sin(h * 3)); const x = Math.cos(a) * rr, z = Math.sin(a) * rr - 0.02;
      if (z > 0.02 && y < 0.07) continue; made++; mesh(T, new T.SphereGeometry(0.042 + (k % 3) * 0.006, 8, 6), mat, x, y, z, head); } }; // 只長在頭頂、後腦和兩側，不蓋到臉
    if (i === 7) { // 花臉怪：又高又瘦、灰紅皮膚，頭會像花瓣一樣裂開，裡面一圈一圈尖牙
      const hide = PM(T, 'fur', '#4a2a2c', '#6a3a38', 3, { roughness: 0.7 }), flesh = M(T, '#b8343c', { roughness: 0.35, emissive: '#400', emissiveIntensity: 0.4 }), tooth = M(T, '#efe8d8', { roughness: 0.3 });
      const r = humanoid(T, { bodyMat: hide, legMat: hide, armMat: hide, headMat: hide, handMat: hide, eyes: false, scale: 1.25, limbR: 0.042, torsoR: 0.1, headR: 0.1 });
      r.torso.scale.set(0.9, 1.2, 0.7); r.arms.forEach(a => { a.scale.y = 1.45; a.rotation.z = (a.position.x < 0 ? 1 : -1) * 0.12; });
      r.skull.visible = false; r.head.position.y += 0.02;
      const throat = mesh(T, new T.SphereGeometry(0.05, 12, 10), flesh, 0, 0.02, 0, r.head);
      for (let k = 0; k < 12; k++) { const th = mesh(T, new T.ConeGeometry(0.008, 0.04, 4), tooth, Math.cos(k * 0.524) * 0.045, 0.05, Math.sin(k * 0.524) * 0.045, r.head); th.rotation.set(Math.sin(k * 0.524) * 0.9, 0, -Math.cos(k * 0.524) * 0.9); }
      const petals = []; for (let k = 0; k < 5; k++) { const yaw = new T.Group(); yaw.rotation.y = k / 5 * Math.PI * 2; r.head.add(yaw);
        const hinge = new T.Group(); hinge.position.set(0, -0.02, 0.045); yaw.add(hinge);
        const outer = mesh(T, new T.SphereGeometry(1, 14, 10), hide, 0, 0.11, 0.0, hinge); outer.scale.set(0.07, 0.14, 0.022);
        const inner = mesh(T, new T.SphereGeometry(1, 14, 10), flesh, 0, 0.11, -0.012, hinge); inner.scale.set(0.06, 0.125, 0.014);
        for (let q = 0; q < 6; q++) { const th = mesh(T, new T.ConeGeometry(0.007, 0.035, 4), tooth, (q % 2 ? 1 : -1) * 0.035, 0.05 + q * 0.025, -0.025, hinge); th.rotation.x = -Math.PI / 2; }
        petals.push(hinge); }
      void throat;
      [r.handL, r.handR].forEach(h => { for (let k = 0; k < 4; k++) { const c = mesh(T, new T.ConeGeometry(0.007, 0.09, 4), M(T, '#2a1a1a'), (k - 1.5) * 0.018, -0.07, 0.02, h); c.rotation.x = Math.PI - 0.2; } });
      r.legs.forEach(l => l.scale.y = 1.25);
      r.tick = (t, s) => { const open = s === 'joy' || s === 'walk' ? 1.0 + Math.sin(t * 9) * 0.25 : 0.25 + Math.pow(Math.max(0, Math.sin(t * 0.9)), 2) * 1.0; petals.forEach(h => h.rotation.x = open); r.head.rotation.x = -0.2; r.head.rotation.z = Math.sin(t * 1.3) * 0.12; };
      return r;
    }
    const cfg = [
      { body: PM(T, 'stripes', '#c8323a', '#a82830', 4, { roughness: 0.85 }), skin: skinA, hair: '#3a2a1e' },
      { body: PM(T, 'cloud', '#ff8ac0', '#ffb8d8', 2, { roughness: 0.9 }), skin: skinA, hair: '#5a4434' },
      { body: PM(T, 'stripes', '#2f6fd0', '#e8e4d8', 3, { roughness: 0.85 }), skin: skinB, hair: '#2a1a12' },
      { body: PM(T, 'stripes', '#f28a2a', '#2a2a2a', 3, { roughness: 0.85 }), skin: skinA, hair: '#c8461e' },
      { body: M(T, '#8a6a3e', { roughness: 0.8 }), skin: skinA, hair: '#4a3628' },
      { body: PM(T, 'fur', '#1e3a66', '#2a4a7a', 2, { roughness: 0.75 }), skin: skinA, hair: '#3a2a1c' },
      { body: PM(T, 'plates', '#151518', '#2a2a30', 2, { roughness: 0.35, metalness: 0.2 }), skin: skinA, hair: '#1a1410' }
    ][i];
    const hairM = M(T, cfg.hair, { roughness: 0.85 });
    const r = humanoid(T, { bodyMat: cfg.body, legMat: i === 4 ? M(T, '#6a5232', { roughness: 0.8 }) : i === 6 ? M(T, '#1a1a1e', { roughness: 0.5 }) : jeans, armMat: cfg.body, headMat: cfg.skin, iris: '#3a2a1a', shoeMat: i === 4 || i === 6 ? M(T, '#1a1410') : sneaker, scale: i === 4 ? 1.15 : i === 5 || i === 6 ? 1.08 : 0.95 });
    const hr = 0.13;
    if (i === 0) { // 單車男孩：紅帽T、深色瀏海、背包、對講機、旁邊一台腳踏車
      mesh(T, new T.SphereGeometry(hr + 0.008, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hairM, 0, 0.012, -0.008, r.head);
      const hood = mesh(T, new T.TorusGeometry(0.1, 0.035, 8, 16, Math.PI * 1.4), cfg.body, 0, 0.86, -0.04, r.body); hood.rotation.set(Math.PI / 2, 0, -Math.PI * 0.2);
      mesh(T, new T.BoxGeometry(0.2, 0.24, 0.1), M(T, '#2a4a3a', { roughness: 0.9 }), 0, 0.64, -0.14, r.body);
      const wt = mesh(T, new T.BoxGeometry(0.05, 0.1, 0.03), M(T, '#222'), 0, -0.02, 0.04, r.handR); mesh(T, new T.CylinderGeometry(0.004, 0.004, 0.1, 4), M(T, '#555'), 0.015, 0.09, 0, wt);
      const bike = new T.Group(); bike.position.set(0.32, 0, 0.05); bike.rotation.y = Math.PI / 2; r.g.add(bike); const fm = M(T, '#d0202a', { metalness: 0.5, roughness: 0.35 }), tire = M(T, '#151515');
      [-1, 1].forEach(sd => { const w = mesh(T, new T.TorusGeometry(0.14, 0.018, 6, 22), tire, sd * 0.24, 0.15, 0, bike); void w; mesh(T, new T.CylinderGeometry(0.004, 0.004, 0.27, 4), M(T, '#bbb'), sd * 0.24, 0.15, 0, bike).rotation.x = Math.PI / 2; });
      const bar = (x1, y1, x2, y2) => { const a = new T.Vector3(x1, y1, 0), b = new T.Vector3(x2, y2, 0), m = mesh(T, new T.CylinderGeometry(0.012, 0.012, a.distanceTo(b), 6), fm, 0, 0, 0, bike); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize()); };
      bar(-0.24, 0.15, -0.02, 0.15); bar(-0.02, 0.15, 0.2, 0.36); bar(-0.24, 0.15, -0.08, 0.36); bar(-0.08, 0.36, 0.2, 0.36); bar(0.2, 0.36, 0.24, 0.15); bar(-0.02, 0.15, -0.08, 0.36);
      mesh(T, new T.BoxGeometry(0.1, 0.02, 0.05), M(T, '#222'), -0.08, 0.38, 0, bike); mesh(T, new T.CylinderGeometry(0.008, 0.008, 0.18, 6), M(T, '#999', { metalness: 0.8 }), 0.2, 0.4, 0, bike).rotation.x = Math.PI / 2;
    }
    if (i === 1) { // 超能力女孩：短到快光頭、粉紅外套、淺藍病號服裙、流鼻血、偶爾舉手發功
      mesh(T, new T.SphereGeometry(hr + 0.004, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.75), PM(T, 'fur', '#5a4232', '#7a5e48', 3, { roughness: 1 }), 0, 0.006, -0.004, r.head);
      mesh(T, new T.CylinderGeometry(0.13, 0.2, 0.28, 16, 1, true), M(T, '#bcd8e8', { side: T.DoubleSide, roughness: 0.9 }), 0, 0.36, 0, r.body);
      const bl = mesh(T, new T.BoxGeometry(0.01, 0.04, 0.01), M(T, '#c0101a', { roughness: 0.2, emissive: '#600', emissiveIntensity: 0.6 }), -0.01, -0.035, hr * 1.0, r.head); void bl;
      const glow = mesh(T, new T.SphereGeometry(0.04, 10, 8), M(T, '#ffb8e0', { emissive: '#ff6ac0', emissiveIntensity: 2, transparent: true, opacity: 0.7 }), 0, -0.06, 0, r.handR);
      const wf = mesh(T, new T.CylinderGeometry(0.05, 0.05, 0.012, 16), M(T, '#e0a040', { roughness: 0.7 }), 0, -0.03, 0.04, r.handL); wf.rotation.x = Math.PI / 2;
      r.tick = (t, s) => { const k = Math.max(0, Math.sin(t * 0.7)); if (s === 'idle') { r.arms[1].rotation.x = -k * 1.5; r.arms[1].rotation.z = Math.sin(t * 30) * 0.02 * k; } glow.scale.setScalar(0.4 + k * 1.2); r.head.rotation.x = k * 0.12; };
    }
    if (i === 2) { // 捲髮男孩：一頭捲髮、藍白卡車帽、缺一顆門牙的大笑、指南針
      curls(r.head, hairM, 26, 0.125, 0.02);
      const cap = mesh(T, new T.SphereGeometry(hr + 0.015, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.3), PM(T, 'stripes', '#2f6fd0', '#f2f2ee', 2), 0, 0.03, -0.01, r.head); void cap;
      const bill = mesh(T, new T.CylinderGeometry(0.1, 0.1, 0.012, 16, 1, false, -Math.PI / 2, Math.PI), M(T, '#2f6fd0'), 0, 0.06, 0.1, r.head); bill.rotation.x = 0.1;
      [-1, 1].forEach(sd => mesh(T, new T.BoxGeometry(0.018, 0.016, 0.006), M(T, '#fff'), sd * 0.013, -0.048, hr * 0.96, r.head));
      const cp = mesh(T, new T.CylinderGeometry(0.035, 0.035, 0.012, 14), M(T, '#c8a040', { metalness: 0.8, roughness: 0.3 }), 0, -0.03, 0.04, r.handR); cp.rotation.x = Math.PI / 2;
    }
    if (i === 3) { // 滑板女孩：紅褐長髮馬尾、耳機、夾著滑板
      mesh(T, new T.SphereGeometry(hr + 0.008, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.8), hairM, 0, 0.012, -0.01, r.head);
      for (let k = 0; k < 5; k++) mesh(T, new T.SphereGeometry(0.05 - k * 0.006, 8, 6), hairM, 0, 0.02 - k * 0.06, -0.15 - k * 0.012, r.head);
      const band = mesh(T, new T.TorusGeometry(0.14, 0.01, 6, 20, Math.PI), M(T, '#ffd23a'), 0, 0.02, 0, r.head); band.rotation.y = Math.PI / 2;
      [-1, 1].forEach(sd => { const cup = mesh(T, new T.CylinderGeometry(0.04, 0.04, 0.03, 14), M(T, '#ff8c1a'), sd * 0.14, 0.0, 0, r.head); cup.rotation.z = Math.PI / 2; });
      const board = new T.Group(); board.position.set(0.06, -0.02, 0); board.rotation.set(0, 0, 0.2); r.handR.add(board);
      mesh(T, new T.BoxGeometry(0.03, 0.5, 0.12), PM(T, 'stripes', '#2a2a2a', '#ff8c1a', 2), 0, 0, 0, board);
      [-1, 1].forEach(e => [-1, 1].forEach(sd => { const w = mesh(T, new T.CylinderGeometry(0.022, 0.022, 0.02, 10), M(T, '#ffe08a'), 0.03, e * 0.17, sd * 0.05, board); w.rotation.z = Math.PI / 2; }));
    }
    if (i === 4) { // 小鎮警長：寬邊警帽、金色星徽、咖啡杯、鬍子、腰帶
      const hat = new T.Group(); hat.position.y = 0.1; r.head.add(hat);
      mesh(T, new T.CylinderGeometry(0.24, 0.24, 0.015, 24), M(T, '#6a5232'), 0, 0, 0, hat); const cr = mesh(T, new T.CylinderGeometry(0.1, 0.13, 0.11, 16), M(T, '#6a5232'), 0, 0.06, 0, hat); void cr;
      mesh(T, new T.CylinderGeometry(0.132, 0.132, 0.02, 16), M(T, '#3a2a18'), 0, 0.015, 0, hat);
      const must = mesh(T, new T.CapsuleGeometry(0.012, 0.05, 4, 8), hairM, 0, -0.03, hr * 0.97, r.head); must.rotation.z = Math.PI / 2;
      const brd = mesh(T, new T.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hairM, 0, -0.035, 0.07, r.head); brd.scale.set(1.25, 0.9, 0.8);
      const star = new T.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? 0.014 : 0.032; k ? star.lineTo(Math.cos(a) * rr, -Math.sin(a) * rr) : star.moveTo(Math.cos(a) * rr, -Math.sin(a) * rr); }
      mesh(T, new T.ExtrudeGeometry(star, { depth: 0.006, bevelEnabled: false }), M(T, '#e8c04a', { metalness: 0.9, roughness: 0.25 }), -0.06, 0.7, 0.1, r.body);
      mesh(T, new T.TorusGeometry(0.135, 0.02, 6, 18), M(T, '#2a1a10'), 0, 0.48, 0, r.body).rotation.x = Math.PI / 2;
      const cup = mesh(T, new T.CylinderGeometry(0.035, 0.03, 0.08, 12), M(T, '#f4f0e8'), 0, -0.02, 0.05, r.handR); mesh(T, new T.CylinderGeometry(0.03, 0.03, 0.005, 12), M(T, '#3a2010'), 0, 0.038, 0, cup);
      const steam = mesh(T, new T.SphereGeometry(0.02, 8, 6), M(T, '#ffffff', { transparent: true, opacity: 0.4 }), 0, 0.09, 0, cup);
      r.tick = (t) => { steam.position.y = 0.06 + (t * 0.08 % 0.1); steam.material.opacity = 0.45 - (t * 0.08 % 0.1) * 4; };
    }
    if (i === 5) { // 球棒帥哥：超蓬的頭髮、深藍夾克、釘滿釘子的球棒扛在肩上
      const puff = mesh(T, new T.SphereGeometry(0.16, 16, 12), hairM, 0, 0.07, -0.02, r.head); puff.scale.set(1, 0.85, 1.05);
      const front = mesh(T, new T.SphereGeometry(0.08, 12, 10), hairM, 0, 0.12, 0.08, r.head); front.scale.set(1.3, 0.8, 0.9);
      mesh(T, new T.TorusGeometry(0.09, 0.03, 8, 16), M(T, '#f2f2ee'), 0, 0.86, 0, r.body).rotation.x = Math.PI / 2;
      const bat = new T.Group(); bat.position.set(0, -0.02, 0.02); bat.rotation.set(-2.4, 0, 0.2); r.handR.add(bat);
      mesh(T, new T.CylinderGeometry(0.035, 0.015, 0.55, 10), M(T, '#a8743a', { roughness: 0.6 }), 0, 0.28, 0, bat);
      for (let k = 0; k < 14; k++) { const a = k * 1.9, y = 0.36 + (k % 7) * 0.025; const n = mesh(T, new T.CylinderGeometry(0.003, 0.003, 0.06, 4), M(T, '#9a9aa2', { metalness: 0.9, roughness: 0.3 }), Math.cos(a) * 0.035, y, Math.sin(a) * 0.035, bat); n.rotation.set(Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57); }
      r.arms[1].rotation.x = -2.6;
      r.tick = (t, s) => { if (s === 'idle') r.arms[1].rotation.x = -2.6 + Math.sin(t * 1.4) * 0.08; };
    }
    if (i === 6) { // 重金屬吉他手：黑色長捲髮、皮衣鉚釘、紅色 V 型電吉他
      curls(r.head, hairM, 40, 0.13, 0.11); for (let k = 0; k < 10; k++) mesh(T, new T.SphereGeometry(0.045, 8, 6), hairM, Math.cos(k * 0.65 + 2.2) * 0.12, -0.08 - (k % 3) * 0.05, Math.sin(k * 0.65 + 2.2) * 0.1 - 0.03, r.head);
      for (let k = 0; k < 8; k++) mesh(T, new T.SphereGeometry(0.008, 6, 4), M(T, '#ddd', { metalness: 1, roughness: 0.2 }), -0.12 + (k % 4) * 0.08, 0.84 - Math.floor(k / 4) * 0.03, 0.09, r.body);
      const gtr = new T.Group(); gtr.position.set(0.02, 0.5, 0.16); gtr.rotation.set(0, 0, 0.95); r.body.add(gtr);
      const vs = new T.Shape(); vs.moveTo(0, 0); vs.lineTo(-0.15, -0.3); vs.lineTo(-0.08, -0.32); vs.lineTo(0, -0.12); vs.lineTo(0.08, -0.32); vs.lineTo(0.15, -0.3); vs.lineTo(0, 0);
      const body = mesh(T, new T.ExtrudeGeometry(vs, { depth: 0.03, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 }), M(T, '#c8121e', { roughness: 0.2, metalness: 0.3 }), 0, 0.08, -0.015, gtr); body.rotation.z = Math.PI;
      mesh(T, new T.BoxGeometry(0.03, 0.38, 0.015), M(T, '#2a1a10'), 0, 0.27, 0, gtr); mesh(T, new T.BoxGeometry(0.06, 0.07, 0.015), M(T, '#111'), 0, 0.48, 0, gtr);
      r.arms[1].rotation.x = -0.9; r.arms[0].rotation.x = -1.2; r.arms[0].rotation.z = 0.6;
      r.tick = (t, s) => { r.arms[1].rotation.x = -0.9 + Math.sin(t * (s === 'joy' ? 22 : 8)) * 0.18; r.head.rotation.x = s === 'joy' ? Math.sin(t * 14) * 0.25 : Math.sin(t * 3) * 0.06; };
    }
    mesh(T, new T.TorusGeometry(0.135, 0.016, 6, 18), M(T, color), 0, 0.5, 0, r.body).rotation.x = Math.PI / 2;
    return r;
  }

  // ---------- 對外：建立角色 ----------
  // ---------- 質感加工：所有角色共用 ----------
  // 1. 邊緣光（菲涅耳）：輪廓有一圈主題色的亮邊，角色從背景跳出來，看起來像精緻的公仔
  // 2. 細微凹凸：布料、皮毛、皮膚表面加一點噪點凹凸，不再像塑膠
  const RIM = { ragnarok: [1.0, 0.85, 0.55, 0.55], cyber: [0.3, 0.9, 1.0, 0.7], animal: [1.0, 0.95, 0.8, 0.45], alien: [0.9, 0.5, 1.0, 0.6], buddha: [1.0, 0.75, 0.35, 0.6], magic: [0.55, 0.7, 1.0, 0.6], town: [1.0, 0.45, 0.35, 0.55] };
  let bumpTex = null; const polished = new WeakMap();
  function noiseTex(T) {
    if (bumpTex) return bumpTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const v = 128 + (Math.random() - 0.5) * 70 + Math.sin(x * 0.7) * 10 + Math.sin(y * 0.9 + x * 0.3) * 10, i = (y * 128 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); bumpTex = new T.CanvasTexture(c); bumpTex.wrapS = bumpTex.wrapT = T.RepeatWrapping; bumpTex.repeat.set(3, 3); return bumpTex;
  }
  function polish(T, r, theme) {
    const rc = RIM[theme] || RIM.animal;
    r.g.traverse(o => { const m = o.material; if (!m || !m.isMeshStandardMaterial || polished.has(m) || o.userData.tag) return; polished.set(m, 1);
      if (m.roughness > 0.4 && m.metalness < 0.5 && !m.transparent) { m.bumpMap = noiseTex(T); m.bumpScale = 1.2; }
      m.onBeforeCompile = sh => { sh.uniforms.rimC = { value: new T.Vector3(rc[0], rc[1], rc[2]) }; sh.uniforms.rimK = { value: rc[3] };
        sh.fragmentShader = 'uniform vec3 rimC; uniform float rimK;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', 'float rimF = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);\n gl_FragColor.rgb += rimC * rimF * rimK;\n#include <dithering_fragment>'); };
      m.customProgramCacheKey = () => 'rim-' + theme; m.needsUpdate = true; });
  }
  C.make = function (T, theme, idx, color, avatarTex, extra) {
    let r;
    if (avatarTex) { // 自畫角色：你畫的圖本身就是角色（紙板立牌，永遠面向鏡頭）
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const card = new T.Group(); card.position.y = 0.08; body.add(card);
      const pic = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshBasicMaterial({ map: avatarTex, transparent: true, alphaTest: 0.35, side: T.DoubleSide }));
      pic.position.y = 0.52; pic.castShadow = true; card.add(pic);
      const base = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.06, 20), M(T, color, { roughness: 0.4, metalness: 0.2 })); base.position.y = 0.03; base.castShadow = true; g.add(base);
      r = { g, body, head: null, skull: null, legs: [], arms: [], kind: 'standee', billboard: card };
    } else if ((theme === 'town' || theme === 'gang') && root.MONO_PIXEL && (theme !== 'gang' || root.MONO_PIXEL.gangFrame)) { // 怪奇小鎮／幫派街區：16-bit 像素立牌（永遠面向鏡頭，動作換影格）
      const P0 = root.MONO_PIXEL, pillIm = theme === 'gang' && extra && extra.pill ? Object.assign(new Image(), { src: extra.pill }) : null, stp = (extra && extra.stamp) || 0, P = theme === 'gang' ? { tokenFrame: (i, s, t) => P0.gangFrame(i, s, t, { img: pillIm && pillIm.complete && pillIm.naturalWidth ? pillIm : null, stamp: stp }), SW: P0.SW, SH: P0.SH } : P0, g = new T.Group(), body = new T.Group(); g.add(body);
      const card = new T.Group(); body.add(card);
      const tx = new T.CanvasTexture(P.tokenFrame(idx, 'idle', 0)); tx.magFilter = T.NearestFilter; tx.minFilter = T.NearestFilter; tx.generateMipmaps = false; tx.colorSpace = T.SRGBColorSpace;
      const sc = theme === 'town' && idx === 7 ? 1.25 : 1, pic = new T.Mesh(new T.PlaneGeometry(0.78 * sc, 0.78 * sc * P.SH / P.SW), new T.MeshBasicMaterial({ map: tx, transparent: true, alphaTest: 0.5, side: T.DoubleSide }));
      pic.position.y = 0.39 * sc * P.SH / P.SW - 0.02; pic.castShadow = true; card.add(pic);
      const shadow = new T.Mesh(new T.CircleGeometry(0.2, 16), new T.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.35, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012; g.add(shadow);
      r = { g, body, head: null, skull: null, legs: [], arms: [], kind: 'standee', billboard: card };
      let cur = null; r.tick = (t, st) => { const fr = P.tokenFrame(idx, st === 'puppet' ? 'idle' : st, t); if (fr !== cur) { cur = fr; tx.image = fr; tx.needsUpdate = true; } };
    } else if (theme === 'ragnarok') r = ragnarok(T, idx, color);
    else if (theme === 'cyber') r = cyber(T, idx, color);
    else if (theme === 'animal') r = animal(T, idx, color);
    else if (theme === 'buddha') r = buddha(T, idx, color);
    else if (theme === 'magic') r = magic(T, idx, color);
    else if (theme === 'town') r = town(T, idx, color);
    else r = alien(T, idx, color);
    // 腳下的玩家色光圈
    const ring = new T.Mesh(new T.RingGeometry(0.2, 0.26, 28), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; r.g.add(ring); r.ring = ring;
    // 頭上的箭頭（輪到時顯示）
    const arrow = new T.Mesh(new T.ConeGeometry(0.07, 0.15, 4), new T.MeshBasicMaterial({ color })); arrow.rotation.x = Math.PI; arrow.position.y = 1.35; arrow.visible = false; arrow.userData.tag = true; r.g.add(arrow); r.arrow = arrow;
    if (!avatarTex && r.kind !== 'standee') try { polish(T, r, theme); } catch (e) {}
    r.state = 'idle'; r.stateUntil = 0; r.phase = Math.random() * 6;
    return r;
  };
  // 每一幀更新動作
  C.update = function (r, t, dt) {
    const s = r.state, now = performance.now();
    if (s === 'puppet') { if (r.tick) r.tick(t, s); if (r.arrow.visible) r.arrow.position.y = 1.35; return; } // 由動畫腳本直接控制
    if (r.stateUntil && now > r.stateUntil && s !== 'walk' && s !== 'fall') { r.state = 'idle'; r.stateUntil = 0; }
    r.phase += dt * (s === 'walk' ? 11 : 2);
    const sw = Math.sin(r.phase);
    const legs = r.legs, arms = r.arms;
    let bodyY = 0, bodyRX = 0, headRX = 0, armUp = 0;
    if (r.kind === 'standee') { r.body.rotation.z = s === 'walk' ? sw * 0.14 : s === 'scared' ? Math.sin(t * 40) * 0.06 : r.body.rotation.z * 0.85; }
    if (s === 'walk') { bodyY = Math.abs(Math.sin(r.phase)) * (r.kind === 'standee' ? 0.12 : 0.04); legs.forEach((l, k) => l.rotation.x = (k % 2 ? -1 : 1) * sw * 0.7 * (r.kind === 'quad' && k > 1 ? -1 : 1)); arms.forEach((a, k) => a.rotation.x = (k % 2 ? 1 : -1) * sw * 0.6); }
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
    if (r.tick) r.tick(t, s);
    if (r.eyes && r.eyes.length) { const bl = ((t + r.phase * 0.7) % 3.7) < 0.12 ? 0.12 : 1; r.eyes.forEach(e => e.scale.y = bl); }
    if (r.arrow.visible) { r.arrow.position.y = 1.35 + Math.sin(t * 4) * 0.06; r.arrow.rotation.y = t * 2; }
  };
  C.set = function (r, state, ms) { r.state = state; r.stateUntil = ms ? performance.now() + ms : 0; };

  root.MONO_CHARS = C;
})(typeof window !== 'undefined' ? window : globalThis);
