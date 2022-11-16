class SpeedRate{

    static speedRate = 1;

    static set(value) {
        SpeedRate.speedRate = value;
    }
    static get() {
        return SpeedRate.speedRate;
    }
}

export default SpeedRate;