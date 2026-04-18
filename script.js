document.addEventListener('DOMContentLoaded', () => {

    // --- タイトルアニメーション (Glitch & Float ポリシー保持) ---
    const heroTitle = document.getElementById('hero-title');
    if(heroTitle) {
        const titleText = 'NoseChan';
        const glitchAnims = ['charFloat', 'charGlitch', 'charSpin', 'charFloat', 'charFloat'];

        titleText.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char === ' ' ? '\u00A0' : char;
            const delay = i * 0.12;
            const duration = 2.8 + (i % 3) * 0.4;
            span.style.animationDelay = `${delay}s`;
            span.style.animationDuration = `${duration}s`;
            heroTitle.appendChild(span);
        });

        function triggerRandomAnim() {
            const spans = heroTitle.querySelectorAll('.char');
            const target = spans[Math.floor(Math.random() * spans.length)];
            const anim = glitchAnims[Math.floor(Math.random() * glitchAnims.length)];
            const dur = anim === 'charSpin' ? '0.8s' : '0.5s';
            target.style.animation = `${anim} ${dur} ease forwards`;
            setTimeout(() => {
                const i = Array.from(spans).indexOf(target);
                const delay = i * 0.12;
                const duration = 2.8 + (i % 3) * 0.4;
                target.style.animation = `charFloat ${duration}s ${delay}s ease-in-out infinite`;
            }, parseFloat(dur) * 1000 + 50);
            setTimeout(triggerRandomAnim, 800 + Math.random() * 2200);
        }
        setTimeout(triggerRandomAnim, 1500);
    }

    // --- スクロールフェードイン ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- ポリシーの背景星空 ＋ 【マウスで動く機能】 ---
    const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
    const pcCanvas = document.getElementById('particle-canvas'), pcCtx = pcCanvas.getContext('2d');
    const tpCanvas = document.getElementById('text-particle-canvas'), tpCtx = tpCanvas.getContext('2d');
    let sw, sh, particles = [], tpParticles = [], font;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let time = 0, sy = 0, introProgress = 0;

    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    window.addEventListener('scroll', () => { sy = window.pageYOffset; });

    function resizeCanvas() {
        sw = canvas.width = pcCanvas.width = tpCanvas.width = window.innerWidth;
        sh = canvas.height = pcCanvas.height = tpCanvas.height = window.innerHeight;
        if (font) createTextParticles();
        createParticles();
    }
    window.addEventListener('resize', resizeCanvas);

    // 幾何学フレームを描画する関数
    function drawWavyStarFrame(cx, cy, size, opacity, waveAmp, waveFreq, intro) {
        const accent = getComputedStyle(document.body).getPropertyValue('--accent-color');
        // 元のスクロールによる膨張効果も保持
        const cs = size * intro * (1 + (0.5) * (1 - Math.exp(-sy * 0.0005)));
        ctx.lineWidth = 1.0; ctx.strokeStyle = accent; ctx.globalAlpha = opacity * intro;
        ctx.shadowBlur = 15 * intro; ctx.shadowColor = accent; ctx.beginPath();
        const pts = [{ x: cx - cs, y: cy }, { x: cx, y: cy - cs }, { x: cx + cs, y: cy }, { x: cx, y: cy + cs }, { x: cx - cs, y: cy }];
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < 5; i++) {
            const off = i * (Math.PI / 2);
            const wx = cx + Math.sin(time * waveFreq + off) * (waveAmp * intro + Math.sin(time * 2.5) * 8);
            const wy = cy + Math.cos(time * waveFreq + off) * (waveAmp * intro + Math.sin(time * 2.5) * 8);
            ctx.quadraticCurveTo(wx, wy, pts[i].x, pts[i].y);
        }
        ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    class Particle {
        constructor() { this.init(); }
        init() { this.x = Math.random() * sw; this.y = Math.random() * sh; this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3; this.r = Math.random() * 1.2 + 0.3; this.o = Math.random() * 0.4 + 0.1; }
        update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > sw || this.y < 0 || this.y > sh) this.init(); }
        draw() { pcCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--particle-color'); pcCtx.globalAlpha = this.o; pcCtx.beginPath(); pcCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2); pcCtx.fill(); }
    }
    function createParticles() { particles = []; for (let i = 0; i < sw / 15; i++) particles.push(new Particle()); }

    if (window.opentype) {
        opentype.load('https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCvC73w.ttf', (err, f) => { if (!err) { font = f; createTextParticles(); } });
    }
    function createTextParticles() {
        tpParticles = []; const fs = Math.max(sw * 0.12, 100), tw = font.getAdvanceWidth("NoseChan", fs);
        const path = font.getPath("NoseChan", (sw - tw) / 2, (sh + fs * 0.7) / 2, fs);
        path.commands.forEach(cmd => { if (cmd.x && cmd.y && Math.random() > 0.88) tpParticles.push({ x: Math.random() * sw, y: Math.random() * sh, bx: cmd.x, by: cmd.y, vx: 0, vy: 0 }); });
    }

    function animate() {
        time += 0.01; 
        mx += (tx - mx) * 0.05; // マウスのイージング
        my += (ty - my) * 0.05;
        if (introProgress < 1) introProgress += (1 - introProgress) * 0.03;
        
        ctx.clearRect(0, 0, sw, sh); pcCtx.clearRect(0, 0, sw, sh); tpCtx.clearRect(0, 0, sw, sh);
        const bsz = Math.max(sw, sh) * 0.5;

        // 【ここがマウスで星枠が動く機能（パララックス）】
        // 画面中央を基準としたマウスの相対位置を計算
        let mouseOffsetX = (mx - sw / 2) * 0.08; // 係数で動きの大きさを調整
        let mouseOffsetY = (my - sh / 2) * 0.08;

        // 2つの枠を、マウス座標に応じて少しずらして描画（奥行きを出すために奥の枠は大きく動かす）
        drawWavyStarFrame(sw / 2 + mouseOffsetX, sh / 2 + mouseOffsetY, bsz * 0.9, 0.03, 10, 0.3, Math.pow(introProgress, 2));
        drawWavyStarFrame(sw / 2 + mouseOffsetX * 1.6, sh / 2 + mouseOffsetY * 1.6, bsz * 1.2, 0.1, 25, 0.5, introProgress);

        particles.forEach(p => { p.update(); p.draw(); });
        
        tpCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-color');
        tpParticles.forEach(p => {
            p.vx += (p.bx - p.x) * 0.1; p.vy += (p.by - (p.y + sy * 0.4)) * 0.1;
            p.vx *= 0.8; p.vy *= 0.8; p.x += p.vx; p.y += p.vy;
            tpCtx.beginPath(); tpCtx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); tpCtx.fill();
        });

        requestAnimationFrame(animate);
    }
    resizeCanvas(); animate();

    // --- 背景画像のローテーション ---
    const bgLayers = document.querySelectorAll('.bg-image-layer');
    let currentIdx = -1;
    function updateBg() {
        if(bgLayers.length === 0) return;
        let next = Math.floor(Math.random() * bgLayers.length);
        while (next === currentIdx) next = Math.floor(Math.random() * bgLayers.length);
        if (currentIdx >= 0) bgLayers[currentIdx].classList.remove('active');
        bgLayers[next].classList.add('active');
        currentIdx = next;
    }
    updateBg(); setInterval(updateBg, 15000);
});