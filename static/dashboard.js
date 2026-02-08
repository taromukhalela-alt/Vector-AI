document.addEventListener('DOMContentLoaded', () => {
    const v0 = document.getElementById('v0');
    const angle = document.getElementById('angle');
    const mass = document.getElementById('mass');
    const drag = document.getElementById('drag');

    const v0Val = document.getElementById('v0-val');
    const angleVal = document.getElementById('angle-val');
    const massVal = document.getElementById('mass-val');
    const dragVal = document.getElementById('drag-val');

    const runBtn = document.getElementById('run-btn');
    const trainBtn = document.getElementById('train-btn');

    const canvas = document.getElementById('traj-canvas');
    const ctx = canvas.getContext('2d');

    const metricsEl = document.getElementById('metrics');
    const explanationEl = document.getElementById('explanation');
    const statsEl = document.getElementById('traj-stats');

    function updateLabels() {
        v0Val.textContent = v0.value;
        angleVal.textContent = angle.value;
        massVal.textContent = mass.value;
        dragVal.textContent = drag.value;
    }

    function clearCanvas() {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        // background
        ctx.fillStyle = '#0f1116';
        ctx.fillRect(0,0,canvas.width, canvas.height);
    }

    function drawTrajectory(trueTraj, mlTraj) {
        clearCanvas();
        // Determine scaling
        const allX = (trueTraj.x || []).concat(mlTraj.x || []);
        const allY = (trueTraj.y || []).concat(mlTraj.y || []);
        const maxX = Math.max(1, ...allX);
        const maxY = Math.max(1, ...allY);

        function toCanvas(x,y) {
            const px = (x / maxX) * (canvas.width - 40) + 20;
            const py = canvas.height - ((y / maxY) * (canvas.height - 40) + 20);
            return [px, py];
        }

        // Draw true trajectory
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#67e8f9';
        for (let i=0;i<trueTraj.x.length;i++){
            const [px,py] = toCanvas(trueTraj.x[i], trueTraj.y[i]);
            if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();

        // Draw ML trajectory
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.setLineDash([6,6]);
        ctx.strokeStyle = '#fb7185';
        for (let i=0;i<mlTraj.x.length;i++){
            const [px,py] = toCanvas(mlTraj.x[i], mlTraj.y[i]);
            if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Legend
        ctx.fillStyle = '#e9eef6';
        ctx.fillText('True Physics', 10, 20);
        ctx.fillStyle = '#67e8f9';
        ctx.fillRect(95, 12, 12, 6);
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(190, 12, 12, 6);
        ctx.fillStyle = '#e9eef6';
        ctx.fillText('ML Prediction', 110, 20);
    }

    async function runSimulation() {
        // Pulse canvas to indicate run
        animateCanvasPulse();

        const payload = {
            v0: parseFloat(v0.value),
            angle: parseFloat(angle.value),
            mass: parseFloat(mass.value),
            drag: parseFloat(drag.value)
        };

        const res = await fetch('/api/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
            alert('Simulation failed: ' + (data.error || 'unknown'));
            return;
        }

        const physics = data.physics; // arrays
        const ml = data.ml || {x:[], y:[], t:[]};

        drawTrajectory(physics, ml);

        // Show metrics and explanation
        metricsEl.innerHTML = `Error margin: <strong>${data.error_margin.toFixed(3)} m</strong>`;
        // Explanation: support both string and structured response
        explanationEl.textContent = data.explanation || (data.explanation_text || 'No explanation available.');
        // Render symbolic steps if present
        const symPanel = document.getElementById('symbolic-panel');
        if (data.symbolic && Array.isArray(data.symbolic) && data.symbolic.length > 0) {
            symPanel.innerHTML = data.symbolic.map(s => {
                if (s.step && s.expr) return `<div><strong>${s.step}</strong>: <pre style="white-space:pre-wrap; font-size:13px;">${JSON.stringify(s.expr, null, 2)}</pre></div>`;
                if (s.step && s.values) return `<div><strong>${s.step}</strong>: <pre style="white-space:pre-wrap; font-size:13px;">${JSON.stringify(s.values, null, 2)}</pre></div>`;
                return `<div><pre style="white-space:pre-wrap; font-size:13px;">${JSON.stringify(s)}</pre></div>`;
            }).join('');
            document.getElementById('toggle-symbolic').style.display = 'inline-block';
        } else {
            symPanel.innerHTML = '';
            document.getElementById('toggle-symbolic').style.display = 'none';
        }

        statsEl.innerHTML = `Duration: ${physics.t.length ? physics.t.length : 0} samples`;
    }

    async function trainModel() {
        trainBtn.disabled = true; trainBtn.textContent = 'Training...';
        const res = await fetch('/api/train_physics', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            alert('Training complete. Metrics: ' + JSON.stringify(data.metrics));
        } else {
            alert('Training failed: ' + (data.error || 'unknown'));
        }
        trainBtn.disabled = false; trainBtn.textContent = 'Train ML Model';
    }

    // Wire up UI
    updateLabels();
    v0.addEventListener('input', updateLabels);
    angle.addEventListener('input', updateLabels);
    mass.addEventListener('input', updateLabels);
    drag.addEventListener('input', updateLabels);

    runBtn.addEventListener('click', runSimulation);
    trainBtn.addEventListener('click', trainModel);

    // Toggle symbolic panel
    const toggleBtn = document.getElementById('toggle-symbolic');
    const symPanel = document.getElementById('symbolic-panel');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', String(!expanded));
            if (expanded) {
                symPanel.classList.add('hidden');
                symPanel.setAttribute('aria-hidden', 'true');
                toggleBtn.textContent = 'Show derivation';
            } else {
                symPanel.classList.remove('hidden');
                symPanel.setAttribute('aria-hidden', 'false');
                toggleBtn.textContent = 'Hide derivation';
            }
        });
    }

    // Small animation: when running simulation, pulse the canvas
    async function animateCanvasPulse() {
        canvas.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease';
        canvas.style.transform = 'scale(1.02)';
        canvas.style.boxShadow = '0 12px 30px rgba(26,115,232,0.12)';
        await new Promise(r => setTimeout(r, 250));
        canvas.style.transform = '';
        canvas.style.boxShadow = '';
    }

    // Attach keyboard shortcut: press '/' to focus inline search
    document.addEventListener('keydown', (e) => {
        if (e.key === '/') {
            const el = document.getElementById('inline-search');
            if (el) { el.focus(); e.preventDefault(); }
        }
        // 'c' opens canvas focus and run
        if (e.key === 'c') {
            runBtn.focus();
        }
    });

    // Initial render
    clearCanvas();
});