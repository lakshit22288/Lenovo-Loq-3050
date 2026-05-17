document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('animation-canvas');
    const ctx = canvas.getContext('2d');
    const preloader = document.getElementById('preloader');
    const loaderBar = document.getElementById('loader-bar');
    const loaderPercent = document.getElementById('loader-percent');
    const scrollContainer = document.querySelector('.scroll-container');

    // Config
    const totalFrames = 240;
    const images = [];
    let loadedFramesCount = 0;

    // Scroll States
    let maxScroll = 0;
    let targetScrollFraction = 0;
    let currentScrollFraction = 0;
    const lerpFactor = 0.4; // Smoothness factor (increased for much faster, snappier response)

    // Helper to format frame path
    const getFramePath = (index) => {
        const paddedIndex = String(index).padStart(3, '0');
        return `frames/ezgif-frame-${paddedIndex}.jpg`;
    };

    // Preload All Images
    const preloadImages = () => {
        return new Promise((resolve) => {
            const handleFrameLoad = () => {
                loadedFramesCount++;
                const percent = Math.round((loadedFramesCount / totalFrames) * 100);
                loaderBar.style.width = `${percent}%`;
                loaderPercent.textContent = `${percent}%`;

                if (loadedFramesCount === totalFrames) {
                    setTimeout(() => {
                        preloader.classList.add('loaded');
                        resolve();
                    }, 400);
                }
            };

            for (let i = 1; i <= totalFrames; i++) {
                const img = new Image();
                img.src = getFramePath(i);
                img.onload = handleFrameLoad;
                img.onerror = () => {
                    console.error(`Failed to load frame ${i}`);
                    handleFrameLoad();
                };
                images.push(img);
            }
        });
    };

    // Responsive Canvas Size & Image Draw (Cover Mode)
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawFrame(currentScrollFraction);
    };

    const drawFrame = (scrollFraction) => {
        // Map fraction (0 to 1) to image index (0 to 239)
        const frameIndex = Math.min(
            totalFrames - 1,
            Math.max(0, Math.floor(scrollFraction * totalFrames))
        );

        const img = images[frameIndex];
        if (!img || !img.complete) return;

        const imgWidth = img.width;
        const imgHeight = img.height;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, drawX, drawY;

        // "background-size: cover" math for Canvas
        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            drawX = 0;
            drawY = (canvasHeight - drawHeight) / 2;
        } else {
            drawWidth = canvasHeight * imgRatio;
            drawHeight = canvasHeight;
            drawX = (canvasWidth - drawWidth) / 2;
            drawY = 0;
        }

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    };

    // Calculate Scroll Metrics
    const updateScrollMetrics = () => {
        maxScroll = scrollContainer.scrollHeight - window.innerHeight;
        // Avoid division by zero
        if (maxScroll <= 0) maxScroll = 1;
        const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        targetScrollFraction = scrollY / maxScroll;
    };

    // DOM Element for Hero Overlay
    const heroOverlay = document.getElementById('hero-overlay');

    // Linear Interpolation (Lerp) Frame Loop
    const tick = () => {
        // Smooth scroll position calculation (lerp)
        currentScrollFraction += (targetScrollFraction - currentScrollFraction) * lerpFactor;

        // Prevent extremely small oscillations and snap
        if (Math.abs(targetScrollFraction - currentScrollFraction) < 0.0001) {
            currentScrollFraction = targetScrollFraction;
        }

        // Draw current smooth frame
        drawFrame(currentScrollFraction);

        // Fade out Hero Overlay by 30% scroll
        if (heroOverlay) {
            // Opacity goes from 1.0 at 0% to 0.0 at 30% (0.3 fraction)
            let overlayOpacity = 1 - (currentScrollFraction / 0.3);
            if (overlayOpacity < 0) overlayOpacity = 0;
            if (overlayOpacity > 1) overlayOpacity = 1;
            heroOverlay.style.opacity = overlayOpacity.toFixed(3);
        }

        requestAnimationFrame(tick);
    };

    // Initialize System
    const init = async () => {
        // 1. Preload assets
        await preloadImages();

        // 2. Initialize metrics & canvas
        updateScrollMetrics();
        resizeCanvas();

        // 3. Register Events
        window.addEventListener('scroll', updateScrollMetrics, { passive: true });
        window.addEventListener('resize', () => {
            updateScrollMetrics();
            resizeCanvas();
        });

        // 4. Start Core Render/Scroll Loop
        requestAnimationFrame(tick);
    };

    init();
});
