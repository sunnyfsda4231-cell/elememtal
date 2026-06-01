class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 12;
        this.color = ITEM_COLORS[type];
        this.active = true;
        this.wobble = Math.random() * Math.PI * 2;
        this.floatOffsetY = 0;
    }

    update() {
        this.wobble += 0.05;
        this.floatOffsetY = Math.sin(this.wobble) * 5;
    }

    applyBuff(unit) {
        let effectText = "";
        switch (this.type) {
            case ITEM_TYPES.HEAL:
                const healAmt = Math.floor(unit.maxHp * 0.33);
                unit.hp = Math.min(unit.maxHp, unit.hp + healAmt);
                effectText = "HEAL!";
                break;
            case ITEM_TYPES.HEALTH_UP:
                unit.maxHp += 20;
                unit.hp += 20;
                effectText = "MAX HP UP!";
                break;
            case ITEM_TYPES.SPEED_UP:
                unit.speed += 1.5;
                effectText = "SPEED UP!";
                break;
            case ITEM_TYPES.SPIN_UP:
                unit.spinSpeed = Math.sign(unit.spinSpeed) * (Math.abs(unit.spinSpeed) + 0.05);
                effectText = "SPIN UP!";
                break;
            case ITEM_TYPES.SIZE_UP:
                unit.weaponLength += 30; // 무기 길이 증가 (이에 따라 시각적 도트 크기 b가 6에서 8로 증가)
                unit.weaponRadius += 2;  // 타격 판정도 무기 굵기에 맞춰 소폭 증가
                unit.bodyRadius += 12;   // 커진 무기에 가려지지 않도록 본체 크기도 비율(b*6)에 맞춰 완벽히 증가
                effectText = "SIZE UP!";
                break;
        }
        
        // 아이템 효과 적용 후 상태바 즉시 갱신 (특히 HP)
        if (unit.updateUI) unit.updateUI();
        
        return effectText;
    }
}
