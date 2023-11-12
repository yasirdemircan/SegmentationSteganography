// Converting binary to ascii
export default function bin2asc(bin) {
    let output = "";
    let decimals = [];
    for (let i = 0; i < bin.length; i = i + 8) {

        let toDec = "";
        toDec += bin[i] + bin[i + 1] + bin[i + 2] + bin[i + 3] + bin[i + 4] + bin[i + 5] + bin[i + 6] + bin[i +
            7];
        decimals.push(parseInt(toDec, 2));
        toDec = "";
    }

    // CHECK FOR END OF MEDIUM 25 ascii character
    for (let index = 0; index < decimals.length; index++) {
        if (decimals[index] != 25) {
            output += String.fromCharCode(decimals[index])

        } else {
            return output;

        }

    }

    return output;

}