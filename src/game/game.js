export class Entity {
    constructor(name) {
        this.name = name
        this.x = 0.0;
        this.y = 0.0;
        this.size = {
            x: 1.0,
            y: 1.0
        }
    }
}

export class Player extends Entity {
    constructor(name) {
        super(name);
        this.username = name;
        this.speed = 250.0;
        this.color = "#3c47daff";
        this.energy;
        this.size = {
            x: 10.0,
            y: 10.0
        }
    }
}

export class Food extends Entity {
    constructor(name) {
        super(name);
        this.energy = 2.0;
        this.color = "#FFFFFF";
        this.size = {
            x: 5.0,
            y: 5.0
        }
    } 
}
