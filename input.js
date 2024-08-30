
export const KEYS = {
    W: 87, // 'W' key
    A: 65, // 'A' key
    S: 83, // 'S' key
    D: 68,  // 'D' key
    Q: 81,
    E: 69,
    SPACE: 32, // 'Space' key
};

export class InputController {

    constructor(characterId) {
        this.characterId = characterId
        this.initialize_();
    }

    initialize_() {

        this.current_ = {
            leftButton: false,
            rightButton: false,
            mouseX: 0,
            mouseY: 0
        }

        this.previous_ = null
        this.keys_ = {}
        this.previousKeys_ = {}

        document.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
        document.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
        document.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
        document.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
        document.addEventListener('keyup', (e) => this.onKeyUp_(e), false);

    }

    addShootingManager(sm) {
        this.sm = sm
    }

    async onMouseDown_(e) {
        switch (e.button) {
            case 0: {
                this.current_.leftButton = true;
                
                this.sm.shoot()

                break;
            }
            case 2: {
                this.current_.rightButton = true;
                break;
            }
        }
    }


    onMouseUp_(e) {
        switch (e.button) {
            case 0: {
                this.current_.leftButton = false;
                break;
            }
            case 2: {
                this.current_.rightButton = false;
                break;
            }
        }
    }

    onMouseMove_(e) {

        if (this.previous_ === null) {
            this.previous_ = { ...this.current_ };
        }

        this.current_.mouseX = e.pageX - window.innerWidth / 2;
        this.current_.mouseY = e.pageY - window.innerHeight / 2;

        this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
        this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

    }

    onKeyDown_(e) {
        this.keys_[e.keyCode] = true;
    }

    onKeyUp_(e) {
        this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
        return this.keys_[keyCode]
    }

    update() {
        this.previous_ = { ...this.current_ }
    }

}