import React, { useEffect, useRef, memo } from 'react';

const triggerSubjectConfetti = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'];

    for (let i = 0; i < 50; i++) {
        particles.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 2,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0
        });
    }

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
            if (p.life > 0) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1; // gravity
                p.life -= 0.02;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                alive = true;
            }
        });
        if (alive) requestAnimationFrame(animate);
    };
    animate();
};

const SubjectConfetti = memo(({ triggerId, subjectId }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (triggerId === subjectId && canvasRef.current) {
            triggerSubjectConfetti(canvasRef.current);
        }
    }, [triggerId, subjectId]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-50 rounded-xl"
            width={400}
            height={200}
            style={{ width: '100%', height: '100%' }}
        />
    );
});

SubjectConfetti.displayName = 'SubjectConfetti';

export default SubjectConfetti;
