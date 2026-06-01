class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false }); // 최적화
        
        // 원소별 강렬한 선형 그라데이션 팔레트 (Tip -> Handle 순서의 역순으로 밝음 -> 어두움)
        this.WEAPON_PALETTES = {
            FIRE: ['#ffffff', '#ff2200', '#aa0000', '#330000'],
            WATER: ['#ccffff', '#0066ff', '#0000aa', '#000044'],
            EARTH: ['#ffeecc', '#cc7722', '#663300', '#221100'],
            WIND: ['#ccffcc', '#00dd00', '#007700', '#002200'],
            ICE: ['#ffffff', '#00ccff', '#006699', '#002244'],
            LIGHTNING: ['#ffffff', '#ffee00', '#aa8800', '#443300'],
            LIGHT: ['#ffffff', '#ffee66', '#cc9900', '#554400'],
            DARK: ['#eeccff', '#9900ff', '#440088', '#110022'],
            NEUTRAL: ['#ffffff', '#aaaaaa', '#555555', '#222222'],
            PLAYER: ['#ffffff', '#ff0000', '#880000', '#330000'] // Default, updated via setPlayerCustomData
        };
        this.playerCustomPixels = [];
    }

    // hex 색상을 받아 4단 선형 그라데이션 자동 생성 및 픽셀 데이터 저장
    setPlayerCustomData(hexColor, pixels) {
        this.playerCustomPixels = pixels;
        
        // 간단한 Hex to RGB 변환
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);
        
        // 밝기 조정 함수 (비율)
        const adjust = (factor) => {
            const clamp = (val) => Math.min(255, Math.max(0, Math.round(val)));
            return `rgb(${clamp(r*factor)}, ${clamp(g*factor)}, ${clamp(b*factor)})`;
        };
        
        // [Tip(아주 밝음), Head(원본), Shaft(어두움), Handle(매우 어두움)]
        const p0 = '#ffffff'; // 끝단은 빛남
        const p1 = hexColor;  // 원본
        const p2 = adjust(0.5); // 50% 어둡게
        const p3 = adjust(0.2); // 80% 어둡게
        
        this.WEAPON_PALETTES.PLAYER = [p0, p1, p2, p3];
    }

    draw(grid, units, items, textEffects, padding) {
        // Clear full screen (Out of bounds area)
        this.ctx.fillStyle = '#111'; // 어두운 여백 색상
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(padding, padding);

        // Draw Arena Background
        this.ctx.fillStyle = COLORS[FACTIONS.NEUTRAL];
        this.ctx.fillRect(0, 0, this.canvas.width - padding*2, this.canvas.height - padding*2);

        // Draw Grid
        this.drawGrid(grid);

        // Draw Items
        this.drawItems(items);

        // Draw Units
        this.drawUnits(units);
        
        // Draw Text Effects
        if (textEffects) this.drawTextEffects(textEffects);

        this.ctx.restore();
    }

    drawGrid(grid) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.drawImage(grid.canvas, 0, 0);
        this.ctx.drawImage(grid.gridLinesCanvas, 0, 0);
    }

    drawItems(items) {
        for (let item of items) {
            if (!item.active) continue;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y + item.floatOffsetY, item.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = item.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.closePath();
            
            // Add a glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = item.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // reset
        }
    }

    drawUnits(units) {
        for (let unit of units) {
            if (unit.isDead) continue;
            
            // Blinking effect if invulnerable
            if (unit.invulnerable > 0 && Math.floor(unit.invulnerable / 4) % 2 === 0) {
                this.ctx.globalAlpha = 0.3;
            } else {
                this.ctx.globalAlpha = 1.0;
            }
            
            this.ctx.save();
            this.ctx.translate(unit.x, unit.y);
            this.ctx.rotate(unit.weaponAngle);
            
            // Unit 내부에서 생성된 픽셀 데이터를 기반으로 그림 (크기 b 도 Unit에서 계산됨)
            const b = unit.b; 
            const offsetX = unit.bodyRadius - 6 * b;
            
            const buildWeaponPath = (rectFunc) => {
                unit.weaponPixels.forEach(p => rectFunc(p.x, p.y));
            };
            
            // 1. 가독성을 위한 검은색 실루엣 (윤곽선 역할, stroke() 대신 큰 사각형 fill 사용)
            this.ctx.beginPath();
            buildWeaponPath((x, y) => {
                this.ctx.rect(x*b + offsetX - 1, y*b - 1, b + 2, b + 2); // 1px씩 크게
            });
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fill();
            
            // 2. 내부 픽셀 경계선(선 겹침)이 없는 순수 그라데이션 영역
            this.ctx.beginPath();
            buildWeaponPath((x, y) => {
                this.ctx.rect(x*b + offsetX, y*b, b, b);
            });
            
            const factionKey = unit.faction.toUpperCase(); // 진영 키 대문자화!
            const palette = this.WEAPON_PALETTES[factionKey] || this.WEAPON_PALETTES.NEUTRAL;
            
            // 물빠진 느낌 방지: 손잡이부터 날 끝까지 선형 그라데이션으로 강렬한 원색 배치
            const grad = this.ctx.createLinearGradient(0, 0, 16*b, 0);
            grad.addColorStop(0, palette[3]);   // 손잡이 (가장 어두움)
            grad.addColorStop(0.4, palette[2]); // 막대기 (중간 톤)
            grad.addColorStop(0.8, palette[1]); // 무기 머리 (가장 강렬한 원소 원색)
            grad.addColorStop(1, palette[0]);   // 무기 끝단 (눈부신 하이라이트)
            
            this.ctx.fillStyle = grad;
            this.ctx.fill(); // stroke()를 쓰지 않으므로 내부에 경계선이 생기지 않음
            
            this.ctx.restore();

            // Draw Body (원형 복구)
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y, unit.bodyRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = unit.color;
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = unit.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            this.ctx.closePath();
            
            // Draw internal detail for body
            this.ctx.beginPath();
            this.ctx.arc(unit.x, unit.y, unit.bodyRadius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fill();
            this.ctx.closePath();
            
            // Reset alpha for next unit
            this.ctx.globalAlpha = 1.0;
        }
    }

    drawTextEffects(effects) {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (let effect of effects) {
            const alpha = effect.life / effect.maxLife;
            this.ctx.font = `bold ${16 + (1 - alpha) * 10}px 'Outfit', sans-serif`;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 3;
            
            this.ctx.strokeText(effect.text, effect.x, effect.y);
            this.ctx.fillText(effect.text, effect.x, effect.y);
        }
    }
}
