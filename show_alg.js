var c = document.getElementById("canvas");
var c2 = document.getElementById("segcanvas"); // canvas element of segmap

var ctx = c.getContext("2d");
var ctx2 = c2.getContext("2d"); //Canvas context for segmap

var imageEL = document.getElementById("img");
var segEL = document.getElementById("segimg");

var imgData;
var rgbArray = [];
var binArray = [];
var binPixels = [];
var colorMap = [];


var imgData2; //Uint8 Clamped array Segmap data
var rgbArray2 = []; //Rgb value array for Segmap
var binArray2 = []; // binary rgb array for Segmap
var binPixels2 = []; // binary array of actual pixels for Segmap



//Hash distribution for pixels
var hashMap = [];
var freqtable = [];
var datalength = null;
var password;

function initCanvas() {
    //Setting dimensions for canvas objects
    c.width = imageEL.width;
    c.height = imageEL.height;
    c2.width = imageEL.width;
    c2.height = imageEL.height;

    ctx.drawImage(imageEL, 0, 0);
};



Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))).then(() => {
    console.log('images finished loading');

    //First Block
    initCanvas();
    imgData = ctx.getImageData(0, 0, imageEL.width, imageEL.height);



    for (let i = 0; i < imgData.data.length; i += 4) {
        rgbArray.push(imgData.data[i]);
        rgbArray.push(imgData.data[i + 1]);
        rgbArray.push(imgData.data[i + 2]);


    }
    console.log(rgbArray, rgbArray.length, imgData.data.length);
    //ctx.putImageData(imgData, 0, 0);
    paddingnbinary(rgbArray, binArray);
    dividePixels(binArray, binPixels);
    console.log(binPixels, binPixels.length);

//Second Block
ctx2.drawImage(segEL, 0, 0);
imgData2 = ctx2.getImageData(0, 0, imageEL.width, imageEL.height); //Segmap dimension == image dimension

for (let i = 0; i < imgData2.data.length; i += 4) {
    rgbArray2.push(imgData2.data[i]);
    rgbArray2.push(imgData2.data[i + 1]);
    rgbArray2.push(imgData2.data[i + 2]);


}
document.querySelector("#decode").addEventListener('click', function () {

    document.getElementById("status").innerText = "Working...";

   setTimeout(function(){

    paddingnbinary(rgbArray2, binArray2);
    dividePixels(binArray2, binPixels2);
    //Some pixels are not 0 or 255 !!!
    console.log("Segpixels:", binPixels2, binPixels2.length);
    //Remaining steg code after segmap process

    getWhiteCount();

    iterateHash();
    revealBits2(datalength);
    Repack();
   },0);

})

});


//Adding paddings and binary conversion

function paddingnbinary(rgbarr, binarr) {
 
    rgbarr.forEach(function (el) {
        var dec2bin = el.toString(2);
        var padding = ""
        if (dec2bin.length < 8) {
            for (let j = 0; j < 8 - dec2bin.length; j++) {
                padding += "0"

            }
            dec2bin = padding + dec2bin;
        }
        binarr.push(dec2bin);
    })
}

// Divide rgb values into pixels
function dividePixels(binarr, binpix) {
    let pixel = [];
    for (let i = 0; i < binarr.length; i += 3) {
        pixel.push(binarr[i]);
        pixel.push(binarr[i + 1]);
        pixel.push(binarr[i + 2]);
        binpix.push(pixel);
        pixel = [];

    }

}

function revealBits2(bitlen) {
    let bitcount = 0;
    let hashCount = 0;
    let output = "";
    let usedbits = []
    for (let i = 0; bitcount < bitlen; i++) { //i < bitlen / 3
        //console.log(binPixels[i], colorMap[i]);
        let hashDist = hashMap[hashCount] //Hash value for the current pixel
        //console.log(parseInt(hashDist[0]))
        
        if (colorMap[i] === true) { 

            for (let j = 0; j < 3; j++) {
                if (j != (bitcount + parseInt(freqtable[hashCount])) % 3) { // If i should use this color for hiding


                    let rgb = binPixels[i][j];
                    let arr = rgb.split('');
                    output += xor(arr[7], freqtable[hashCount]);
                    bitcount++;
                    usedbits.push(i)



                } else {
                    ; //to continue iteration
                }


            }
            hashCount++
            console.log("Hash Count:", hashCount, "Bitcount:", bitcount, "bitlength:", bitlen)

        }


    }

    document.getElementById("result_textbox").innerHTML = bin2asc(output);
    document.getElementById("status").innerHTML = "Success!"
    console.info("Done:", output, output.length, bin2asc(output));
    console.log(JSON.stringify(usedbits))
    console.log(JSON.stringify(colorMap))

}



//Repacking pixels as image to canvas
function Repack() {
    let intData = []; // includes alpha channel
    for (let i = 0; i < binPixels.length; i++) {
        for (let j = 0; j < 3; j++) {

            intData.push(parseInt(binPixels[i][j], 2));



        }
        intData.push(255);

    }
    console.log(intData);

    let uintArr = new Uint8ClampedArray(intData);
    let imgData2 = new ImageData(uintArr, imageEL.width, imageEL.height);


    ctx.putImageData(imgData2, 0, 0);
}





function getWhiteCount() {


    let whiteCount = 0;
    colorMap = []; // Export this colormap for final encoding 
    console.log("segmaskpixels:", binPixels2.length);
    for (let i = 0; i < binPixels2.length; i++) {
        // False for close to white flagged for DONT HIDE
        let sum = parseInt(binPixels2[i][0], 2) + parseInt(binPixels2[i][1], 2) + parseInt(binPixels2[i][2], 2)


        if (sum === 0) {

            colorMap.push(false); //FALSE
        } else {
            whiteCount++;
            colorMap.push(true);
        }

    }

    password = document.getElementById("password_input").value;
    console.log(password);

    hash = CryptoJS.SHA256(password).toString(CryptoJS.enc
        .Hex); // Create initial hash for pseudo-randomness

    //4 times recursice hash to remove artifacts
    let dhash = CryptoJS.SHA1(hash).toString(CryptoJS.enc
        .Hex);

    let thash = CryptoJS.SHA1(dhash).toString(CryptoJS.enc
        .Hex);
    let qhash = CryptoJS.SHA1(thash).toString(CryptoJS.enc
        .Hex);
    let q2hash = CryptoJS.SHA1(qhash).toString(CryptoJS.enc
        .Hex);

    // Hash to double hash to preserve algorithm
    hash = hash + dhash + thash + qhash + q2hash;


    console.log("White Count:", whiteCount)

    //Estimated bit capacity
    let estimated_capacity = (whiteCount * 2)

    //Read all data
    datalength = estimated_capacity;
    // Increasing the hash size (TODO: Automation)


    console.log(hash);
}

function processHashDistribution() {
    freqtable = []

    for (let i = 0; i < hash.length; i++) {
        const element = hash[i];
        hashMap.push((parseInt(element, 16) % 8).toString(
            2)); //MOD 8 to reduce the number of bits to 3  hex -> base10 -> mod8 -> binary

    }

    //Padding process

    hashMap.forEach(function (bin, index) {
        if (bin.length === 1) {
            hashMap[index] = "00" + bin

        }
        if (bin.length === 2) {
            hashMap[index] = "0" + bin

        }
    });

    console.log(hashMap);

    //Creating freqtable for hashmap
    hashMap.forEach(function (bintrio) {
        freqtable.push(freq(bintrio));
    });
    console.log(freqtable)

}
// Iterate hash until data bitsize is met
function iterateHash() {

    //Iterative hash to REPEATING HASH for performance concerns
    /*
      while (countHashCap() < datalength) {
            hashMap = [];
            hash = hash + CryptoJS.SHA1(hash).toString(CryptoJS.enc
                .Hex);
            processHashDistribution();
        }
        console.log("Final HASH:",hash);
    */
    while (countHashCap() < datalength) {
        hashMap = [];
        hash += hash
        processHashDistribution();
    }
    console.log("Final HASH:", hash);

};

//Count capacity of the extended hash
function countHashCap() {
    let size = 0;
    for (let i = 0; i < hashMap.length; i++) {
        const bin_trio = hashMap[i];
        for (let j = 0; j < bin_trio.length; j++) {
            const char = bin_trio[j];
            if (char === "1") {
                size++
            }
        }
    }
    console.log("Hash capacity", size, " bits");
    return size;
}

//Function to get frequency of binary trios of hash string
function freq(bin) {
    let count_0 = 0;
    let count_1 = 0;

    for (let i = 0; i < 3; i++) {
        const digit = bin[i];
        if (digit === "0") {
            count_0++;
        } else {
            count_1++;
        }
    }

    if (count_0 > count_1) {
        return "0"
    } else {
        return "1"
    }

}

function xor(a, b) {
    if (a === b) {
        return "0"
    } else {
        return "1"
    }
}



// Converting binary to ascii
function bin2asc(bin) {
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