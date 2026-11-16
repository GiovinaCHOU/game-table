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

  // ---------- 對外：建立角色 ----------
  C.make = function (T, theme, idx, color, avatarTex) {
    let r;
    if (avatarTex) { // 自畫角色：你畫的圖本身就是角色（紙板立牌，永遠面向鏡頭）
      const g = new T.Group(), body = new T.Group(); g.add(body);
      const card = new T.Group(); card.position.y = 0.08; body.add(card);
      const pic = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshBasicMaterial({ map: avatarTex, transparent: true, alphaTest: 0.35, side: T.DoubleSide }));
      pic.position.y = 0.52; pic.castShadow = true; card.add(pic);
      const base = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.06, 20), M(T, color, { roughness: 0.4, metalness: 0.2 })); base.position.y = 0.03; base.castShadow = true; g.add(base);
      r = { g, body, head: null, skull: null, legs: [], arms: [], kind: 'standee', billboard: card };
    } else if (theme === 'ragnarok') r = ragnarok(T, idx, color);
    else if (theme === 'cyber') r = cyber(T, idx, color);
    else if (theme === 'animal') r = animal(T, idx, color);
    else r = alien(T, idx, color);
    // 腳下的玩家色光圈
    const ring = new T.Mesh(new T.RingGeometry(0.2, 0.26, 28), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.01; r.g.add(ring); r.ring = ring;
    // 頭上的箭頭（輪到時顯示）
    const arrow = new T.Mesh(new T.ConeGeometry(0.07, 0.15, 4), new T.MeshBasicMaterial({ color })); arrow.rotation.x = Math.PI; arrow.position.y = 1.35; arrow.visible = false; arrow.userData.tag = true; r.g.add(arrow); r.arrow = arrow;
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
