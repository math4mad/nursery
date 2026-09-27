/* Nursery · 探索 Ὁδός —— 纪念碑谷式三关 (致敬艾达: 白色小圆锥人, 不抄本尊)
 * 关一·感知: 旋转塔台搭桥 (客体恒常)
 * 关二·范畴: 三门择"能堆起来的" (affordance 分类)
 * 关三·语言: 转穹顶引光, 小光人走入光中, 星升 (词物连接)
 * 交互: 拖拽可转构件; 点击地面引路 (一格一跳)
 */
(function () {
  var host = document.getElementById('mv-stage');
  if (!host || !window.THREE) return;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
  catch (e) { host.style.background = '#efe9df'; return; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  host.appendChild(renderer.domElement);

  var BG = 0xf6f1e8;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 26, 44);

  var FS = 6.4;
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  var focus = new THREE.Vector3(-3, 0.6, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc0, 0.95));
  var sun = new THREE.DirectionalLight(0xfff3e0, 0.7);
  sun.position.set(8, 14, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -16; sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -12;
  scene.add(sun);

  function mat(c, r) { return new THREE.MeshLambertMaterial({ color: c, roughness: r || 0.95 }); }
  var C = {
    cream: 0xfbf7ee, sand: 0xe8d5b0, rose: 0xe8b7ad, sky: 0xbcd0dd,
    mint: 0xbcd6bd, gold: 0xd9a441, ink: 0x3b332c, red: 0xd98c8c,
    blue: 0xa9b7d6, yellow: 0xe8c96a, white: 0xfdfdfb
  };
  function box(w, h, d, c, x, y, z, m) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c));
    b.position.set(x, y, z); b.castShadow = b.receiveShadow = true;
    (m || scene).add(b); return b;
  }

  /* ============ 白色小圆锥人 (艾达式致敬) ============ */
  var hero = new THREE.Group();
  var dress = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.62, 24), mat(C.white));
  dress.position.y = 0.31; dress.castShadow = true; hero.add(dress);
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), mat(0xf3e3d3));
  head.position.y = 0.72; head.castShadow = true; hero.add(head);
  [[-0.05], [0.05]].forEach(function (p) {
    var eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mat(C.ink, 0.5));
    eye.position.set(p[0], 0.74, 0.115); hero.add(eye);
  });
  hero.position.set(-7.2, 0, 0.4);
  scene.add(hero);

  /* ============ 关一 · 感知: 断桥与塔台 ============ */
  box(5, 0.6, 5, C.cream, -7, -0.3, 0);           // 起点台
  box(5, 0.6, 5, C.sand, 0.5, -0.3, 0);           // 对岸台
  var tower = new THREE.Group();
  tower.position.set(-2.6, 0, 0); scene.add(tower);
  var tBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 1.5, 20), mat(C.rose));
  tBody.position.y = 0.15; tBody.castShadow = true; tower.add(tBody);
  var bridge = box(3.4, 0.14, 0.6, C.mint, 1.35, 0.95, 0, tower); // 桥臂(随塔转)
  var bridgeSolved = false, bridgeTarget = 0;      // 目标: 桥臂指 +x (朝对岸缺口)
  var walkPads = [new THREE.Vector3(-7.2, 0, 0.4), new THREE.Vector3(-2.6, 1.02, 0), new THREE.Vector3(0.5, 0, 0.4)];

  /* ============ 关二 · 范畴: 三门 ============ */
  var hall = new THREE.Group(); hall.position.set(5.6, 0, 0); scene.add(hall);
  box(5.4, 3.2, 0.6, C.sky, 0, 1.3, -1.2, hall);   // 门墙
  box(5.4, 0.5, 2.6, C.cream, 0, -0.25, 0, hall);  // 门廊台
  box(6.6, 0.6, 5, C.cream, 0.6, -0.3, 0.6, hall); // 落地大台
  var doors = [];
  [[C.red, 'ball'], [C.blue, 'disc'], [C.yellow, 'block']].forEach(function (d, i) {
    var x = -1.7 + i * 1.7;
    var frame = box(1.1, 1.9, 0.16, d[0], x, 0.95, -0.86, hall); frame.name = 'door-' + d[1];
    var knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat(C.white));
    knob.position.set(x + 0.35, 0.95, -0.74); hall.add(knob);
    /* 门上牌: 球/扁盘/积木 */
    var tag;
    if (d[1] === 'ball') { tag = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(d[0])); tag.name = 'tag-ball'; }
    else if (d[1] === 'disc') { tag = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), mat(d[0])); tag.name = 'tag-disc'; }
    else tag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(d[0])); tag.name = 'tag-block';
    tag.position.set(x, 2.35, -0.9); tag.castShadow = true; hall.add(tag);
    doors.push({ frame: frame, x: x, kind: d[1], open: 0, tag: tag });
  });
  var doorSolved = false;

  /* ============ 关三 · 语言: 穹顶与光 ============ */
  var domeG = new THREE.Group(); domeG.position.set(11.5, 0, 0); scene.add(domeG);
  box(4.4, 0.6, 4.4, C.mint, 0, -0.3, 0, domeG);
  var dome = new THREE.Group(); dome.position.y = 0; domeG.add(dome);
  var shell = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.gold));
  shell.scale.set(1, 0.8, 1); shell.position.y = 0.02; shell.castShadow = true; dome.add(shell);
  /* 光缝: 深色薄板贴壳面模拟缺口 */
  var slit = box(0.16, 1.05, 0.06, C.ink, 0, 0.55, 1.06, dome);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  lamp.position.set(11.5, 1.4, -3.4); scene.add(lamp);
  var beam = box(0.1, 0.1, 4.6, 0xfff2c8, 11.5, 1.0, -1.2);
  beam.material = new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0 });
  var lightPad = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24), new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0 }));
  lightPad.position.set(11.5, 0.05, 1.1); scene.add(lightPad);
  var domeSolved = false, domeTarget = 0;          // 缝朝 +z (对灯与垫的连线) 
  var star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xf7d774 }));
  star.position.set(11.5, 1.2, 0); scene.add(star); star.visible = false;
  var finale = false;

  /* ============ 字幕与状态 ============ */
  var capNum = document.querySelector('.mv-cap-num'), capTxt = document.querySelector('.mv-cap-txt');
  var hint = document.getElementById('mv-hint');
  var dots = Array.prototype.slice.call(document.querySelectorAll('.mv-dot'));
  var ACT = 1;
  function setAct(a, t, h) {
    ACT = a; capNum.textContent = '0' + a; capTxt.textContent = t;
    hint.textContent = h; dots.forEach(function (d, i) { d.classList.toggle('on', i < a); });
    focusGoal = [-3, 5.6, 11.5][a - 1];
  }
  var focusGoal = -3;

  /* ============ 交互: 拖转 + 点路 ============ */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(ev) {
    var r = renderer.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(scene.children, true);
  }
  var drag = null;
  renderer.domElement.addEventListener('pointerdown', function (ev) {
    var hits = pick(ev);
    if (!hits.length) return;
    /* 扫描前 4 命中: 塔/穹顶 > 门 > 光垫 (防小光人自己挡点击) */
    var objs = hits.slice(0, 4).map(function (h) { return h.object; });
    for (var k = 0; k < objs.length; k++) {
      var o = objs[k];
      if (!bridgeSolved && isDesc(o, tower)) { drag = { part: 'tower', x: ev.clientX, a: tower.rotation.y }; return; }
      if (!domeSolved && isDesc(o, dome)) { drag = { part: 'dome', x: ev.clientX, a: dome.rotation.y }; return; }
    }
    if (!doorSolved) {
      for (var k2 = 0; k2 < objs.length; k2++) {
        for (var i = 0; i < doors.length; i++) {
          if (objs[k2] === doors[i].frame || objs[k2] === doors[i].tag) { knock(i); return; }
        }
      }
    }
    for (var k3 = 0; k3 < objs.length; k3++) {
      if (objs[k3].userData.pad) { walkTo(objs[k3].userData.pad); return; }
      if (objs[k3] === bridge && bridgeSolved) { walkTo(walkPads[2]); return; }
    }
  });
  window.addEventListener('pointermove', function (ev) {
    if (!drag) return;
    var da = (ev.clientX - drag.x) * 0.008;
    if (drag.part === 'tower') tower.rotation.y = drag.a + da;
    else dome.rotation.y = drag.a + da;
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    var p = drag.part; drag = null;
    var rot = (p === 'tower' ? tower.rotation.y : p === 'dome' ? dome.rotation.y : 0);
    var err = norm(rot);
    if (Math.abs(err) < 0.35) {
      if (p === 'tower') { snap(tower, 0); bridgeSolved = true; setAct(1, '关一 · 感知', '桥已通 — 点对岸, 让小光人走过去'); padAt(walkPads[2]); }
      else { snap(dome, 0); domeSolved = true; shine(true); setAct(3, '关三 · 语言', '光落进垫上了 — 点光垫'); padAt(new THREE.Vector3(11.5, 0.08, 1.1), finalePad); }
    }
  });
  function norm(a) { a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); return a > Math.PI ? a - Math.PI * 2 : a; }
  function snap(g, to) { g.userData.snapTo = to; }
  var finalePad = new THREE.Vector3(11.5, 0.08, 1.1);
  function padAt(v, tag) {
    var pad = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 }));
    pad.name = 'pad';
    pad.position.copy(v); pad.userData.pad = v; scene.add(pad); return pad;
  }
  function isDesc(o, root) { while (o) { if (o === root) return true; o = o.parent; } return false; }

  function knock(i) {
    var d = doors[i];
    if (d.kind === 'block') {
      doorSolved = true; d.open = 1e-6;
      setAct(2, '关二 · 范畴', '积木门开了 — 点门后的地台');
      var back = new THREE.Vector3(6.2, 0.08, 1.6); padAt(back);
      walkPads.push(back);
    } else {
      hint.textContent = '摇摇晃晃… 它堆不起来。再想想。';
      d.frame.userData.shake = 1e-6;
    }
  }

  /* ============ 行走 ============ */
  var path = null, walkT = 0;
  function walkTo(target) {
    if (path) return;
    var pts = [hero.position.clone()];
    if (ACT === 1 && bridgeSolved && target.distanceTo(walkPads[2]) < 0.9 && hero.position.x < -4) pts.push(walkPads[1]);
    pts.push(target.clone());
    path = { pts: pts, i: 0 };
  }

  function shine(on) {
    beam.material.opacity = on ? 0.85 : 0;
    lightPad.material.opacity = on ? 0.9 : 0;
  }

  /* ============ 帧循环 ============ */
  function resize() {
    var w = host.clientWidth || window.innerWidth, h = host.clientHeight || 600;
    renderer.setSize(w, h, false);
    var aspect = w / h;
    camera.left = -FS * aspect / 2; camera.right = FS * aspect / 2;
    camera.top = FS / 2; camera.bottom = -FS / 2;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  resize(); requestAnimationFrame(function () { resize(); setTimeout(resize, 150); });

  setAct(1, '关一 · 感知', '按住粉色塔台, 拖 — 把薄荷桥转到缺口上');
  padAt(walkPads[0]);

  var clock = { last: performance.now() };
  function frame(now) {
    var dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
    var t = now / 1000;

    /* 吸附动画 */
    [tower, dome].forEach(function (g) {
      if (g.userData.snapTo !== undefined) {
        g.rotation.y += (g.userData.snapTo - g.rotation.y) * Math.min(1, dt * 8);
        if (Math.abs(g.rotation.y - g.userData.snapTo) < 0.01) { g.rotation.y = g.userData.snapTo; delete g.userData.snapTo; }
      }
    });
    /* 桥随塔: 解后桥水平 */
    bridge.rotation.z = 0;

    /* 门开 + 摇 */
    doors.forEach(function (d) {
      if (d.open > 0) { d.open = Math.min(1, d.open + dt * 2); d.frame.scale.y = Math.max(0.06, 1 - d.open * 0.94); }
      if (d.frame.userData.shake) {
        d.frame.userData.shake += dt * 14;
        d.frame.position.x = d.x + Math.sin(d.frame.userData.shake * 6) * 0.06 * Math.max(0, 1 - d.frame.userData.shake / 1.2);
        if (d.frame.userData.shake > 1.2) { d.frame.userData.shake = 0; d.frame.position.x = d.x; }
      }
    });

    /* 行走: 一格一跳 */
    if (path) {
      var to = path.pts[path.i + 1];
      if (!to) { path = null; arrive(); }
      else {
        var dir = to.clone().sub(hero.position); dir.y = 0;
        var dist = dir.length();
        var sp = 1.6 * dt;
        if (dist <= sp) { hero.position.copy(to); hero.position.y = to.y; path.i++; if (path.i >= path.pts.length - 1) { path = null; arrive(); } }
        else { hero.position.addScaledVector(dir.normalize(), sp); hero.position.y = to.y + Math.abs(Math.sin(t * 9)) * 0.05; }
        hero.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
    function arrive() {
      if (ACT === 1 && bridgeSolved && hero.position.distanceTo(walkPads[2]) < 0.6) setAct(2, '关二 · 范畴', '三扇门, 哪一扇门上的东西堆得起来? 点它');
      if (ACT === 2 && doorSolved && hero.position.distanceTo(walkPads[walkPads.length - 1]) < 0.6) setAct(3, '关三 · 语言', '按住金穹顶, 拖 — 让光缝对准灯与垫');
      if (ACT === 3 && domeSolved && !finale && hero.position.distanceTo(finalePad) < 0.6) finale = true;
      if (finale && ACT === 3 && domeSolved && hero.position.distanceTo(finalePad) < 0.6) {
        star.visible = true;
        setAct(3, '关三 · 语言 · 成', '「MAMA」— 词与物, 在这一刻接上了 ✦');
      }
    }

    /* 终幕: 星升 */
    if (star.visible) {
      star.position.y += (3.4 - star.position.y) * dt * 0.8;
      star.rotation.y += dt * 1.4;
      hero.position.y = Math.max(0.08, hero.position.y);
    }
    /* 光呼吸 */
    if (domeSolved) { beam.material.opacity = 0.6 + 0.25 * Math.sin(t * 3); }

    /* 相机平移 + 等距 */
    focus.x += (focusGoal - focus.x) * Math.min(1, dt * 2);
    camera.position.set(focus.x - 6, 7, 8);
    camera.lookAt(focus.x, 0.5, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* 测试/审片句柄: 世界→屏幕坐标 */
  window.__mv = {
    screen: function (x, y, z) {
      var v = new THREE.Vector3(x, y, z).project(camera);
      var r = renderer.domElement.getBoundingClientRect();
      return [Math.round(r.left + (v.x + 1) / 2 * r.width), Math.round(r.top + (1 - v.y) / 2 * r.height)];
    },
    pos: function () {
      return {
        focusX: +focus.x.toFixed(2), focusGoal: focusGoal,
        tower: tower.position.toArray().map(function (n, i) { return n + (i === 1 ? 0.5 : 0); }),
        hero: hero.position.toArray(),
        doors: doors.map(function (d) { return [d.x, d.kind, d.frame.position.y]; }),
        dome: domeG.position.toArray(),
        act: ACT, bridgeSolved: bridgeSolved, doorSolved: doorSolved, domeSolved: domeSolved
      };
    },
    solve: function (what) {
      if (what === 'bridge' && !bridgeSolved) { snap(tower, 0); bridgeSolved = true; setAct(1, '关一 · 感知', '桥已通 — 点对岸, 让小光人走过去'); padAt(walkPads[2]); }
      if (what === 'door' && !doorSolved) { doorSolved = true; var d = doors[2]; d.open = 1e-6; setAct(2, '关二 · 范畴', '积木门开了 — 点门后的地台'); var back = new THREE.Vector3(6.2, 0.08, 1.6); padAt(back); walkPads.push(back); }
      if (what === 'dome' && !domeSolved) { snap(dome, 0); domeSolved = true; shine(true); setAct(3, '关三 · 语言', '光落进垫上了 — 点光垫'); padAt(finalePad); }
    },
    goto: function (v) { hero.position.set(v[0], v[1] || 0, v[2]); },
    hitAt: function (sx, sy) {
      var r = renderer.domElement.getBoundingClientRect();
      ndc.set(((sx - r.left) / r.width) * 2 - 1, -((sy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var hits = ray.intersectObjects(scene.children, true);
      return hits.slice(0, 3).map(function (h) { return (h.object.name || h.object.type) + '@' + h.point.y.toFixed(2); });
    }
  };
  var rp = document.getElementById('mv-replay');
  if (rp) rp.addEventListener('click', function () { location.reload(); });
})();
