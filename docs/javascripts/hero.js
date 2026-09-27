/* Nursery · 西 world 片头式 Hero —— three.js 程序化 3D 场景
 * 运镜脚本 (24s 循环):
 *   A 0-7s   远景: 白色虚空, 小小人影(男孩剪影)走向玩具箱, 相机缓推
 *   W1 7-8s  切白 (字幕切换)
 *   B 8-11s  第一人称俯视: 低头看箱中婴儿
 *   C 11-18s 环绕: 正面 → 左侧 → 右侧 → 回正
 *   D 18-23s 止于面部: 特写轻漂, 婴儿呼吸
 *   W2 23-24s 切白回环
 * 参考: ~/Downloads/【1080P】《西部世界》乐高版片头.mp4 (主人 0928 指定)
 */
(function () {
  var host = document.getElementById('ww-stage');
  if (!host || !window.THREE) { host && (host.style.background = 'linear-gradient(#fbfaf7,#efe9df)'); return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (e) { host.style.background = 'linear-gradient(#fbfaf7,#efe9df)'; return; }

  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  var VOID = 0xf7f5f1;
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(VOID);
  scene.fog = new THREE.FogExp2(VOID, 0.095);

  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);

  /* ---- 灯光: 白空漫射 + 暖主光 ---- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c5, 0.85));
  var sun = new THREE.DirectionalLight(0xfff2df, 0.72);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
  scene.add(sun);

  /* ---- 地面: 无尽白 ---- */
  var floor = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: VOID, roughness: 1 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---- 玩具箱 (木色开口箱 + 四脚) ---- */
  var box = new THREE.Group();
  var wood = new THREE.MeshStandardMaterial({ color: 0xc9a678, roughness: 0.85 });
  var woodDark = new THREE.MeshStandardMaterial({ color: 0xb8946a, roughness: 0.9 });
  function wall(w, h, d, x, y, z, m) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m || wood);
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; box.add(mesh); return mesh;
  }
  wall(1.2, 0.42, 0.08, 0, 0.31, 0.56);       // 前
  wall(1.2, 0.42, 0.08, 0, 0.31, -0.56);      // 后
  wall(0.08, 0.42, 1.2, 0.56, 0.31, 0);       // 右
  wall(0.08, 0.42, 1.2, -0.56, 0.31, 0);      // 左
  wall(1.24, 0.08, 1.24, 0, 0.06, 0, woodDark); // 底
  [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]].forEach(function (p) {
    var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 10), woodDark);
    leg.position.set(p[0], 0.07, p[1]); leg.castShadow = true; box.add(leg);
  });
  /* 箱内软垫 */
  var pad = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.12, 1.06),
    new THREE.MeshStandardMaterial({ color: 0xf3e6d2, roughness: 1 }));
  pad.position.set(0, 0.16, 0); box.add(pad);
  box.position.set(0, 0, 0);
  scene.add(box);

  /* ---- 玩具: 小积木 + 小球 (亮色点缀) ---- */
  var toyCols = [0xe8a24b, 0x9fc4a6, 0xd98c8c, 0xa9b7d6];
  var toys = new THREE.Group();
  for (var i = 0; i < 4; i++) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14),
      new THREE.MeshStandardMaterial({ color: toyCols[i], roughness: 0.7 }));
    b.position.set(0.3 - i * 0.2, 0.29, 0.34 - (i % 2) * 0.14);
    b.rotation.y = i * 0.6; b.castShadow = true; toys.add(b);
  }
  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xd98c8c, roughness: 0.6 }));
  ball.position.set(-0.72, 0.09, 0.5); ball.castShadow = true; toys.add(ball);
  scene.add(toys);

  /* ---- 婴儿 (程序化 cute 建模) ---- */
  var baby = new THREE.Group();
  var skin = new THREE.MeshStandardMaterial({ color: 0xf0c8ab, roughness: 0.95 });
  var onesie = new THREE.MeshStandardMaterial({ color: 0xfdfbf6, roughness: 1 });
  var dark = new THREE.MeshStandardMaterial({ color: 0x3b2f2a, roughness: 0.6 });
  var blush = new THREE.MeshStandardMaterial({ color: 0xf0b6a4, roughness: 1 });

  var head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), skin);
  head.position.set(0, 0.42, 0.2); head.castShadow = true; baby.add(head);
  /* 头发小卷 — 额前上方 */
  var curl = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.015, 10, 20, Math.PI * 1.5), dark);
  curl.position.set(0, 0.585, 0.1); curl.rotation.x = Math.PI / 2.1; baby.add(curl);
  /* 五官贴球面: 头心 C=(0,0.42,0.2) R=0.19, 脸朝前上 45° */
  function onHead(dx, dy, dz, r, m, sink) {
    var L = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var k = (0.19 - (r || 0) * (sink === undefined ? 0.5 : sink)) / L;
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m);
    mesh.position.set(dx * k, 0.42 + dy * k, 0.2 + dz * k);
    baby.add(mesh); return mesh;
  }
  var eyeL = onHead(-0.075, 0.13, 0.13, 0.03, dark);
  var eyeR = onHead(0.075, 0.13, 0.13, 0.03, dark);
  var gL = onHead(-0.062, 0.155, 0.155, 0.01, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0);
  var gR = onHead(0.088, 0.155, 0.155, 0.01, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0);
  var blL = onHead(-0.125, 0.09, 0.14, 0.024, blush, 0.8); blL.scale.set(1.2, 0.5, 1);
  var blR = onHead(0.125, 0.09, 0.14, 0.024, blush, 0.8); blR.scale.set(1.2, 0.5, 1);
  var mouth = onHead(0, 0.045, 0.175, 0.02, blush, 0.6); mouth.scale.set(1.3, 0.55, 0.8);
  /* 发卷移到额顶交界 */
  curl.position.set(0, 0.55, 0.06);
  /* 身体 (连体衣, 躺姿) */
  var body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), onesie);
  body.scale.set(0.85, 0.62, 1.25); body.position.set(0, 0.24, -0.05);
  body.castShadow = true; baby.add(body);
  /* 小手 */
  [-0.19, 0.19].forEach(function (x) {
    var arm = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 12), skin);
    arm.position.set(x, 0.32, 0.1); baby.add(arm);
  });
  /* 小脚丫从垫上探出 */
  var foot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 12), skin);
  foot.scale.set(0.8, 0.7, 1); foot.position.set(0.1, 0.2, -0.3); baby.add(foot);
  box.add(baby);

  /* ---- 男孩剪影 (远景行走者) ---- */
  var boy = new THREE.Group();
  var ink = new THREE.MeshStandardMaterial({ color: 0x24211e, roughness: 0.9 });
  function limb(w, h, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), ink);
    m.position.set(x, y, z); m.castShadow = true; return m;
  }
  var bHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), ink);
  bHead.position.y = 0.92; boy.add(bHead);
  boy.add(limb(0.14, 0.4, 0, 0.62, 0));            // 躯干
  var legL = limb(0.07, 0.42, -0.05, 0.21, 0); boy.add(legL);
  var legR = limb(0.07, 0.42, 0.05, 0.21, 0); boy.add(legR);
  var armL = limb(0.05, 0.34, -0.13, 0.65, 0); boy.add(armL);
  var armR = limb(0.05, 0.34, 0.13, 0.65, 0); boy.add(armR);
  boy.scale.setScalar(0.82); boy.position.set(-7.2, 0, -4.6);
  scene.add(boy);

  /* ---- 运镜 ---- */
  var LOOP = 24;
  var look = new THREE.Vector3();
  function ease(u) { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); }
  var CAPS = [
    [0, '01', '远景 · 走近'], [8, '02', '俯视 · 箱中婴儿'],
    [11, '03', '环绕 · 正面 → 左 → 右'], [18, '04', '止于面部']
  ];
  var capNum = document.querySelector('.ww-cap-num'), capTxt = document.querySelector('.ww-cap-txt');
  var fade = document.getElementById('ww-fade');
  var lastCap = -1;

  function choreo(t) {
    /* A: 远景推近 */
    if (t < 8) {
      var u = ease(t / 7);
      camera.position.set(-1.6 + 1.6 * u, 1.5 - 0.15 * u, 11 - 5.5 * u);
      look.set(0, 0.45, 0);
      /* 男孩走向玩具箱 */
      var wu = ease(t / 7.5);
      boy.position.x = -7.2 + 6.1 * wu; boy.position.z = -4.6 + 3.7 * wu;
      boy.rotation.y = 0.6;
      var sw = Math.sin(t * 9) * 0.5;
      legL.rotation.x = sw; legR.rotation.x = -sw;
      armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
      boy.visible = true;
    } else boy.visible = false;
    /* B: 第一人称俯视 */
    if (t >= 8 && t < 11) {
      var u2 = ease((t - 8) / 2.2);
      camera.position.set(0.3 - 0.3 * u2, 2.1 - 0.6 * u2, 1.4 - 0.45 * u2);
      look.set(0, 0.47, 0.2);
    }
    /* C: 环绕 正→左→右→正 */
    if (t >= 11 && t < 18) {
      var tt = (t - 11) / 7;
      var ang = 0;
      if (tt < 0.3) ang = -ease(tt / 0.3) * 1.15;                     // 正→左
      else if (tt < 0.75) ang = -1.15 + ease((tt - 0.3) / 0.45) * 2.3; // 左→右
      else ang = 1.15 - ease((tt - 0.75) / 0.25) * 1.15;               // 右→正
      var R = 2.0 - 0.25 * tt, H = 1.05 - 0.18 * Math.sin(tt * Math.PI);
      camera.position.set(Math.sin(ang) * R, H, 0.2 + Math.cos(ang) * R);
      look.set(0, 0.48, 0.2);
    }
    /* D: 面部特写 */
    if (t >= 18) {
      var u4 = ease((t - 18) / 3);
      camera.position.set(0, 1.08 - 0.1 * u4 + 0.012 * Math.sin(t * 2), 1.5 - 0.38 * u4);
      look.set(0, 0.53, 0.2);
    }
    /* 切白: 两段转场 */
    var f = 0;
    var x1 = Math.abs(t - 7.5); if (x1 < 0.5) f = Math.max(f, 1 - x1 / 0.5);
    var x2 = Math.abs(t - 23.5); x2 = Math.min(x2, LOOP - x2);
    if (x2 < 0.5) f = Math.max(f, 1 - x2 / 0.5);
    fade.style.opacity = (f * 0.96).toFixed(3);
    /* 字幕 */
    var ci = 0; for (var k = 0; k < CAPS.length; k++) if (t >= CAPS[k][0]) ci = k;
    if (ci !== lastCap) { lastCap = ci; capNum.textContent = CAPS[ci][1]; capTxt.textContent = CAPS[ci][2]; }
  }

  function resize() {
    var w = host.clientWidth || window.innerWidth, h = host.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  resize();
  requestAnimationFrame(function(){ resize(); setTimeout(resize, 150); });

  var clock0 = performance.now();
  var frozen = null;
  var qp = new URLSearchParams(location.search).get('t');
  if (qp !== null) frozen = parseFloat(qp) % LOOP;
  window.__ww = { seek: function (v) { frozen = ((v % LOOP) + LOOP) % LOOP; }, LOOP: LOOP, debug: function(){ return { cam:[+camera.position.x.toFixed(2),+camera.position.y.toFixed(2),+camera.position.z.toFixed(2)], look:[+look.x.toFixed(2),+look.y.toFixed(2),+look.z.toFixed(2)], buf:[renderer.domElement.width,renderer.domElement.height], css:[renderer.domElement.clientWidth,renderer.domElement.clientHeight], t: (frozen!==null?frozen:-1) }; } };
  function frame(now) {
    var t = frozen !== null ? frozen : ((now - clock0) / 1000) % LOOP;
    /* 婴儿呼吸 */
    body.scale.y = 0.62 + 0.012 * Math.sin(t * 2.2);
    head.position.y = 0.42 + 0.005 * Math.sin(t * 2.2 + 1);
    if (!reduce) choreo(t);
    camera.lookAt(look);
    renderer.render(scene, camera);
    if (!reduce && frozen === null) requestAnimationFrame(frame);
    else if (!reduce) requestAnimationFrame(frame);
  }
  if (reduce) { choreoStatic(); camera.lookAt(look); capNum.textContent = '04'; capTxt.textContent = '止于面部 · 静帧'; renderer.render(scene, camera); }
  else requestAnimationFrame(frame);

  function choreoStatic() {
    camera.position.set(0, 0.92, 1.1); look.set(0, 0.5, 0.2);
  }

  var rp = document.getElementById('ww-replay');
  if (rp) rp.addEventListener('click', function () { clock0 = performance.now(); frozen = null; history.replaceState(null,'',location.pathname); });
})();
