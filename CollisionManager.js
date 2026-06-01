class CollisionManager {
    static getWeaponPoints(unit) {
        const points = [];
        const cosA = Math.cos(unit.weaponAngle);
        const sinA = Math.sin(unit.weaponAngle);
        
        // p.x=6 (base)가 딱 unit.bodyRadius에 오도록 보정
        const offsetX = unit.bodyRadius - 6 * unit.b;
        
        for (let p of unit.weaponPixels) {
            const lx = p.x * unit.b + offsetX;
            const ly = p.y * unit.b;
            points.push({
                x: unit.x + cosA * lx - sinA * ly,
                y: unit.y + sinA * lx + cosA * ly
            });
        }
        return points;
    }

    static checkCollisions(units, items, grid) {
        // 성능 최적화: 이번 프레임의 각 유닛 무기 궤적을 1회만 계산 후 캐싱
        const wPointsMap = new Map();
        for (let unit of units) {
            if (!unit.isDead) {
                wPointsMap.set(unit, this.getWeaponPoints(unit));
            }
        }
        
        // 1. Body vs Enemy Territory
        for (let unit of units) {
            if (unit.isDead) continue;
            
            const checkRadius = unit.bodyRadius;
            let collided = false;
            let bounceNormalX = 0;
            let bounceNormalY = 0;
            
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const px = unit.x + Math.cos(angle) * checkRadius;
                const py = unit.y + Math.sin(angle) * checkRadius;
                
                const cellFaction = grid.getFactionAt(px, py);
                if (cellFaction && cellFaction !== FACTIONS.NEUTRAL && cellFaction !== unit.faction) {
                    collided = true;
                    bounceNormalX += unit.x - px;
                    bounceNormalY += unit.y - py;
                }
            }
            
            if (collided) {
                const len = Math.sqrt(bounceNormalX*bounceNormalX + bounceNormalY*bounceNormalY);
                if (len > 0) {
                    bounceNormalX /= len;
                    bounceNormalY /= len;
                    
                    const dot = unit.vx * bounceNormalX + unit.vy * bounceNormalY;
                    if (dot < 0) {
                        unit.vx = unit.vx - 2 * dot * bounceNormalX;
                        unit.vy = unit.vy - 2 * dot * bounceNormalY;
                    }
                    
                    unit.x += bounceNormalX * 2;
                    unit.y += bounceNormalY * 2;
                } else {
                    unit.vx *= -1;
                    unit.vy *= -1;
                }
            }
        }
        
        // 2. Unit vs Unit
        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const u1 = units[i];
                const u2 = units[j];
                if (u1.isDead || u2.isDead) continue;
                
                const wPoints1 = wPointsMap.get(u1);
                const wPoints2 = wPointsMap.get(u2);
                
                const bodyDistSq = (u1.x - u2.x)**2 + (u1.y - u2.y)**2;
                
                // Weapon vs Weapon (Bounce and reverse spin)
                let weaponClash = false;
                const maxWReach = u1.weaponLength + u2.weaponLength + u1.effectiveWeaponRadius + u2.effectiveWeaponRadius;
                if (bodyDistSq <= maxWReach * maxWReach) {
                    for (let p1 of wPoints1) {
                    for (let p2 of wPoints2) {
                        const distSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
                        const radSum = u1.effectiveWeaponRadius + u2.effectiveWeaponRadius;
                        if (distSq <= radSum * radSum) {
                            weaponClash = true;
                            break;
                        }
                    }
                    if (weaponClash) break;
                }
                }
                
                if (weaponClash && u1.weaponClashCooldown === 0 && u2.weaponClashCooldown === 0) {
                    u1.spinSpeed *= -1;
                    u2.spinSpeed *= -1;
                    u1.weaponAngle += u1.spinSpeed * 3;
                    u2.weaponAngle += u2.spinSpeed * 3;
                    
                    // Hit-stop and Sound (타격감을 위해 경직 시간 복구)
                    u1.freezeTimer = 15;
                    u2.freezeTimer = 15;
                    u1.weaponClashCooldown = 20;
                    u2.weaponClashCooldown = 20;
                    
                    // Repel bodies (넉백을 대폭 줄여서 작은 캐릭터가 파고들 수 있게 함)
                    const dx = u2.x - u1.x;
                    const dy = u2.y - u1.y;
                    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    const push = 3; // 기존 15에서 3으로 대폭 하향 (사거리 방어막 붕괴)
                    u1.knockbackX -= (dx/dist) * push;
                    u1.knockbackY -= (dy/dist) * push;
                    u2.knockbackX += (dx/dist) * push;
                    u2.knockbackY += (dy/dist) * push;
                    
                    if (window.soundManager) window.soundManager.playClashSound();
                }
                
                // Weapon1 vs Body2
                let hitBody2 = false;
                const maxReach1 = u1.weaponLength + u2.bodyRadius + u1.effectiveWeaponRadius;
                if (bodyDistSq <= maxReach1 * maxReach1) {
                    const wPoints1_ = wPointsMap.get(u1);
                    for (let p1 of wPoints1_) {
                    const distSq = (p1.x - u2.x)**2 + (p1.y - u2.y)**2;
                    const radSum = u1.effectiveWeaponRadius + u2.bodyRadius;
                    if (distSq <= radSum * radSum) {
                        hitBody2 = true;
                        break;
                    }
                }
                }
                if (hitBody2) {
                    if (u2.takeDamage(u1.damage) && u1.weaponClashCooldown === 0) {
                        u1.spinSpeed *= -1; // Reverse attacker's weapon
                        u1.weaponAngle += u1.spinSpeed * 3;
                        
                        // Hit-stop and Sound
                        u1.freezeTimer = 15;
                        u2.freezeTimer = 15;
                        u1.weaponClashCooldown = 20;
                        if (window.soundManager) window.soundManager.playClashSound();
                    }
                    const wp = u1.getWeaponPosition();
                    const angle = Math.atan2(u2.y - wp.y, u2.x - wp.x);
                    u2.x += Math.cos(angle) * 5;
                    u2.y += Math.sin(angle) * 5;
                }
                
                // Weapon2 vs Body1
                let hitBody1 = false;
                const maxReach2 = u2.weaponLength + u1.bodyRadius + u2.effectiveWeaponRadius;
                if (bodyDistSq <= maxReach2 * maxReach2) {
                    const wPoints2_ = wPointsMap.get(u2);
                    for (let p2 of wPoints2_) {
                    const distSq = (p2.x - u1.x)**2 + (p2.y - u1.y)**2;
                    const radSum = u2.effectiveWeaponRadius + u1.bodyRadius;
                    if (distSq <= radSum * radSum) {
                        hitBody1 = true;
                        break;
                    }
                }
                }
                if (hitBody1) {
                    if (u1.takeDamage(u2.damage) && u2.weaponClashCooldown === 0) {
                        u2.spinSpeed *= -1; // Reverse attacker's weapon
                        u2.weaponAngle += u2.spinSpeed * 3;
                        
                        // Hit-stop and Sound
                        u1.freezeTimer = 15;
                        u2.freezeTimer = 15;
                        u2.weaponClashCooldown = 20;
                        if (window.soundManager) window.soundManager.playClashSound();
                    }
                    const wp = u2.getWeaponPosition();
                    const angle = Math.atan2(u1.y - wp.y, u1.x - wp.x);
                    u1.x += Math.cos(angle) * 5;
                    u1.y += Math.sin(angle) * 5;
                }
                
                // Body1 vs Body2
                const bDistSq = (u1.x - u2.x)**2 + (u1.y - u2.y)**2;
                const bRadSum = u1.bodyRadius + u2.bodyRadius;
                if (bDistSq <= bRadSum * bRadSum) {
                    const tempVx = u1.vx;
                    const tempVy = u1.vy;
                    u1.vx = u2.vx;
                    u1.vy = u2.vy;
                    u2.vx = tempVx;
                    u2.vy = tempVy;
                    
                    const angle = Math.atan2(u2.y - u1.y, u2.x - u1.x);
                    u1.x -= Math.cos(angle) * 2;
                    u1.y -= Math.sin(angle) * 2;
                    u2.x += Math.cos(angle) * 2;
                    u2.y += Math.sin(angle) * 2;
                }
            }
        }
        
        // 3. Units vs Items
        for (let unit of units) {
            if (unit.isDead) continue;
            
            const wPoints = wPointsMap.get(unit); // 캐시 재사용
            
            for (let item of items) {
                if (!item.active) continue;
                
                const bDistSq = (unit.x - item.x)**2 + (unit.y - item.y)**2;
                // 아이템 획득 반경 상향 조정
                const bRadSum = unit.bodyRadius + item.radius + 25;
                
                let wHit = false;
                const itemMaxReach = unit.weaponLength + item.radius + 15;
                if (bDistSq <= itemMaxReach * itemMaxReach) {
                    for (let p of wPoints) {
                        const distSq = (p.x - item.x)**2 + (p.y - item.y)**2;
                        const radSum = unit.effectiveWeaponRadius + item.radius + 15;
                        if (distSq <= radSum * radSum) {
                            wHit = true;
                            break;
                        }
                    }
                }
                
                if (bDistSq <= bRadSum*bRadSum || wHit) {
                    const text = item.applyBuff(unit);
                    if (window.gameLoop && window.gameLoop.textEffects) {
                        window.gameLoop.textEffects.push({
                            x: unit.x,
                            y: unit.y - unit.bodyRadius - 10,
                            text: text,
                            color: item.color,
                            life: 60,
                            maxLife: 60
                        });
                    }
                    item.active = false;
                }
            }
        }
    }
}
