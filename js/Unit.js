class Unit {
    constructor(faction, startX, startY, customStats = null, customPixels = null) {
        this.faction = faction;
        this.color = COLORS[faction];
        this.x = startX;
        this.y = startY;
        
        // 스탯 가져오기 (커스텀 값이 없으면 AI 기본 스탯)
        const stats = customStats || FACTION_STATS[faction] || FACTION_STATS.NEUTRAL;
        
        // 스탯 3포인트가 기존 BASE 값들과 완벽히 일치하도록 공식 계산
        this.speed = 2.5 + (stats.move * 1.0);       // 기본 이동속도 상향 (회피 및 접근 용이)
        this.spinSpeed = 0.02 + (stats.spin * 0.02); // 3점 = 0.08
        this.damage = 10 + (stats.damage * 7);       // 3점 = 31
        
        // 크기 스탯의 무기 사거리 격차 대폭 완화 (짧은 무기도 타격 가능하게)
        this.weaponLength = 70 + (stats.size * 8);   // 1=78, 5=110
        this.bodyRadius = 24 + (stats.size * 4);     // 1=28, 5=44
        this.weaponRadius = 3 + (stats.size * 1);
        
        // 아이템 생성 확률 (1~5)
        this.luckStat = stats.luck || 3;
        
        // 체력(Health) 스탯 (3점 = 100) -> 상하한선 격차 완화
        this.healthStat = stats.health || 3;
        this.maxHp = 40 + (this.healthStat * 20);    // 1=60, 3=100, 5=140
        
        // Random starting direction
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        
        this.weaponAngle = 0;
        
        // Combat stats
        this.hp = this.maxHp;
        this.isDead = false;
        this.invulnerable = 0;
        this.freezeTimer = 0;
        this.weaponClashCooldown = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        
        this.generateWeaponPixels(customPixels);
        
        this.updateUI();
    }
    
    generateWeaponPixels(customPixels) {
        this.weaponPixels = [];
        const rectFunc = (x, y) => this.weaponPixels.push({x, y});
        const wType = WEAPON_TYPES[this.faction];
        
        switch (wType) {
            case 'SCYTHE':
                for(let i=-6; i<=-1; i++) rectFunc(14, i);
                for(let i=8; i<=13; i++) rectFunc(i, -6);
                rectFunc(8, -5); rectFunc(8, -4); rectFunc(7, -6); rectFunc(7, -5);
                rectFunc(13, -1); rectFunc(13, -2);
                break;
            case 'SWORD':
                rectFunc(6, 0); rectFunc(7, 0); rectFunc(6, -1); rectFunc(6, 1);
                rectFunc(8, -2); rectFunc(8, -1); rectFunc(8, 1); rectFunc(8, 2);
                for(let i=8; i<=15; i++) rectFunc(i, 0);
                for(let i=9; i<=14; i++) { rectFunc(i, -1); rectFunc(i, 1); }
                break;
            case 'SPEAR':
                for(let i=6; i<=10; i++) rectFunc(i, 0);
                for(let i=-2; i<=2; i++) rectFunc(11, i);
                for(let i=-3; i<=3; i++) rectFunc(12, i);
                for(let i=-2; i<=2; i++) rectFunc(13, i);
                rectFunc(14, -1); rectFunc(14, 0); rectFunc(14, 1);
                rectFunc(15, 0); rectFunc(16, 0); rectFunc(17, 0);
                break;
            case 'AXE':
                for(let i=6; i<=13; i++) rectFunc(i, 0);
                rectFunc(11, -1); rectFunc(12, -1); rectFunc(13, -1);
                rectFunc(12, -2); rectFunc(13, -2); rectFunc(14, -2);
                rectFunc(13, -3); rectFunc(14, -3); rectFunc(15, -3);
                rectFunc(14, -4);
                rectFunc(11, 1); rectFunc(12, 1); rectFunc(13, 1);
                rectFunc(12, 2); rectFunc(13, 2); rectFunc(14, 2);
                rectFunc(13, 3); rectFunc(14, 3); rectFunc(15, 3);
                rectFunc(14, 4);
                break;
            case 'SHOVEL':
                for(let i=6; i<=11; i++) rectFunc(i, 0);
                rectFunc(12, -1); rectFunc(12, 0); rectFunc(12, 1);
                for(let x=13; x<=15; x++) for(let y=-2; y<=2; y++) rectFunc(x, y);
                rectFunc(16, -1); rectFunc(16, 0); rectFunc(16, 1);
                rectFunc(17, 0);
                break;
            case 'HAMMER':
                rectFunc(6, 0); rectFunc(7, 0); rectFunc(8, 0);
                for(let x=9; x<=13; x++) for(let y=-2; y<=2; y++) rectFunc(x, y);
                break;
            case 'BLADE':
                rectFunc(6, 0); rectFunc(7, 0); rectFunc(8, 0);
                rectFunc(8, -1); rectFunc(8, -2); rectFunc(8, 1); rectFunc(8, 2);
                for(let y=-2; y<=2; y++) rectFunc(9, y);
                for(let x=10; x<=13; x++) { rectFunc(x, -1); rectFunc(x, 0); rectFunc(x, 1); }
                rectFunc(14, 0); rectFunc(15, 0); rectFunc(16, 0); rectFunc(17, 0);
                break;
            case 'TRIDENT':
                for(let i=6; i<=10; i++) rectFunc(i, 0);
                for(let i=-2; i<=2; i++) rectFunc(11, i);
                for(let i=12; i<=15; i++) { rectFunc(i, -2); rectFunc(i, 0); rectFunc(i, 2); }
                rectFunc(16, -2); rectFunc(16, 0); rectFunc(16, 2);
                rectFunc(10, -1); rectFunc(10, 1);
                rectFunc(17, 0);
                break;
            case 'CUSTOM':
                if (customPixels) {
                    customPixels.forEach(p => rectFunc(p.x, p.y));
                }
                break;
        }
        
        let maxX = 15;
        if (this.weaponPixels.length > 0) {
            maxX = Math.max(...this.weaponPixels.map(p => p.x));
        }
        // b는 Getter로 이동
    }

    get b() {
        let maxX = 15;
        if (this.weaponPixels && this.weaponPixels.length > 0) {
            maxX = Math.max(...this.weaponPixels.map(p => p.x));
        }
        return this.weaponLength / maxX;
    }
    
    get effectiveWeaponRadius() {
        return Math.max(this.weaponRadius, this.b * 0.75);
    }
    
    getWeaponPosition() {
        return {
            x: this.x + Math.cos(this.weaponAngle) * this.weaponLength,
            y: this.y + Math.sin(this.weaponAngle) * this.weaponLength
        };
    }
    
    update(grid, canvasWidth, canvasHeight, padding) {
        if (this.isDead) return;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.weaponClashCooldown > 0) this.weaponClashCooldown--;
        
        if (this.freezeTimer > 0) {
            this.freezeTimer--;
            // Hit-stop이 끝나는 순간(0이 될 때) 넉백 적용
            if (this.freezeTimer === 0) {
                this.x += this.knockbackX;
                this.y += this.knockbackY;
                this.knockbackX = 0;
                this.knockbackY = 0;
            }
            return;
        }
        
        // Move unit
        this.x += this.vx;
        this.y += this.vy;
        
        // Spin weapon & Interpolate swept area across angles and shaft length
        const oldAngle = this.weaponAngle;
        this.weaponAngle += this.spinSpeed;
        
        const angleDiff = Math.abs(this.spinSpeed);
        const tipArcLength = this.weaponLength * angleDiff;
        const angleSteps = Math.max(1, Math.ceil(tipArcLength / this.weaponRadius));
        
        for (let a = 1; a <= angleSteps; a++) {
            const interpolatedAngle = oldAngle + this.spinSpeed * (a / angleSteps);
            const wpX = this.x + Math.cos(interpolatedAngle) * this.weaponLength;
            const wpY = this.y + Math.sin(interpolatedAngle) * this.weaponLength;
            
            const lengthSteps = Math.ceil(this.weaponLength / (this.weaponRadius * 1.5));
            for (let i = 0; i <= lengthSteps; i++) {
                const t = i / lengthSteps;
                const px = this.x + (wpX - this.x) * t;
                const py = this.y + (wpY - this.y) * t;
                grid.colorCircle(px, py, this.weaponRadius, this.faction);
            }
        }
        
        // Bounce off canvas edges (Body bounds)
        if (this.x - this.bodyRadius < 0) {
            this.x = this.bodyRadius;
            this.vx *= -1;
        } else if (this.x + this.bodyRadius > canvasWidth) {
            this.x = canvasWidth - this.bodyRadius;
            this.vx *= -1;
        }
        
        if (this.y - this.bodyRadius < 0) {
            this.y = this.bodyRadius;
            this.vy *= -1;
        } else if (this.y + this.bodyRadius > canvasHeight) {
            this.y = canvasHeight - this.bodyRadius;
            this.vy *= -1;
        }
        
        // Update velocity vector to match current speed stat (in case it got buffed)
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > 0 && Math.abs(currentSpeed - this.speed) > 0.01) {
            const ratio = this.speed / currentSpeed;
            this.vx *= ratio;
            this.vy *= ratio;
        }
    }

    takeDamage(amount) {
        if (this.isDead || this.invulnerable > 0) return false;
        
        this.hp -= amount;
        this.invulnerable = 30; // 30 frames i-frames
        
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            document.getElementById(`ui-${this.faction}`).classList.add('dead');
        }
        this.updateUI();
        return true;
    }
    
    updateUI() {
        const hpBar = document.getElementById(`hp-${this.faction}`);
        if (hpBar) {
            hpBar.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`;
        }
    }
}
