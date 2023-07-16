    /*
             Yasir Yakup Demircan 
             Steg encoder for new algorithm
             */




        var c = document.getElementById("canvas"); //canvas element for steg img
        var c2 = document.getElementById("segcanvas"); // canvas element of segmap
        var c3 = document.getElementById("origcanvas") // original image canvas

        //Variable for password
        var password;

        //Frequency table for XOR operation
        var freqtable = [];

        //Function to convert uint8array to binary encoded string "0101"
        const toBinString = (bytes) =>
            bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '');


        //get size of input image
        document.querySelector("#getsize").addEventListener("click", function () {

            

            if (document.querySelector("#file").value == '') {
                console.log('No file selected');
                return;
            }

            let file = document.querySelector("#file").files[0];

            let reader = new FileReader();
            reader.onload = function (e) {
                // binary data
                let readResult = e.target.result;
                let bufferdata = new Uint8Array(readResult);
                document.getElementById("filesize_text").innerHTML = "File Size: " + (toBinString(bufferdata).length) / 8000 + "KB";
                console.log("File Size: " + (toBinString(bufferdata).length) / 8000 + "KB");
            }

            reader.onerror = function (e) {
                // error occurred
                console.log('Error : ' + e.type);
            };
            reader.readAsArrayBuffer(file);

        })


        document.querySelector("#encode").addEventListener('click', function () {

            // no file selected to read
            if (document.querySelector("#file").value == '') {
                console.log('No file selected');
                return;
            }

            var file = document.querySelector("#file").files[0];

            var reader = new FileReader();

            //Showing progress
            document.getElementById("status").innerHTML = "Working...";
            reader.onload = function (e) {
                // binary data
                console.log(e.target.result);
                var readResult = e.target.result;
                let bufferdata = new Uint8Array(readResult);
                //console.log(toBinString(bufferdata),toBinString(bufferdata).length);

                //Provided data to hide + ASCII END OF MEDIUM charcode
                key = toBinString(bufferdata) + "00011001";


                //Encoding steps

                //Convert rgb array to binary
                paddingnbinary(rgbArray2, binArray2);
                //divide values pixel by pixel (Exclude alpha channel)
                dividePixels(binArray2, binPixels2);
            
            
             

                //Remaining steg code after segmap process
                
                //Create the boolean array from the segmentation map
                getWhiteCount();

                //Create the distribution from the password
                iterateHash();

                //Modify pixels according to rules and embed the data
                hideBits(key);

                //Repack the modified pixels as png and write to canvas
                Repack();

            };
            reader.onerror = function (e) {
                // error occurred
                console.log('Error : ' + e.type);
            };
            reader.readAsArrayBuffer(file);
        });



        //Function to convert a string to binary array
        function stringToBinary(str) {
            let strOut = "";
            for (var i = 0; i < str.length; i++) {
                //Concat padded binary string as octet
                strOut += str[i].charCodeAt(0).toString(2).padStart(8, '0');
            }
            return strOut
        }

        //8016 bits data
        var key = null;
        var ctx = c.getContext("2d"); //Canvas context for image
        var ctx2 = c2.getContext("2d"); //Canvas context for segmap

        //Image and segmentation map images
        var imageEL = document.getElementById("img");
        var segEL = document.getElementById("segimg");
       




        var imgData; //Uint8 Clamped array image data
        var rgbArray = []; //Rgb value array for original image
        var binArray = []; // binary rgb array for original image
        var binPixels = []; // binary array of actual pixels
        var hashMap = []; // pseudorandom exclusion/inclusion map (binary trios)
        var colorMap; //Bool array from segmentation
        var capacityAfterEx = 0; //capacity after exclusion computed with white pixels

        var imgData2; //Uint8 Clamped array Segmap data
        var rgbArray2 = []; //Rgb value array for Segmap
        var binArray2 = []; // binary rgb array for Segmap
        var binPixels2 = []; // binary array of actual pixels for Segmap


        //Adjust canvas sizes and draw original image
        function initCanvas() {

            //Setting dimensions for canvas objects
            c.width = imageEL.width;
            c.height = imageEL.height;

            c2.width = imageEL.width;
            c2.height = imageEL.height;

            c3.width = imageEL.width;
            c3.height = imageEL.height;

            c3.getContext("2d").drawImage(imageEL, 0, 0);
            ctx.drawImage(imageEL, 0, 0);
        };



        // Check if all images are loaded
        Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))).then(() => {
            console.log('images finished loading');

            initCanvas();


            imgData = ctx.getImageData(0, 0, imageEL.width, imageEL.height);


            // Increase 4 store 3 (Excluding the alpha channel)

            for (let i = 0; i < imgData.data.length; i += 4) {
                rgbArray.push(imgData.data[i]);
                rgbArray.push(imgData.data[i + 1]);
                rgbArray.push(imgData.data[i + 2]);


            }
            // console.log(rgbArray, rgbArray.length, imgData.data.length);
            //ctx.putImageData(imgData, 0, 0);
            paddingnbinary(rgbArray, binArray);
            dividePixels(binArray, binPixels);

            ctx2.drawImage(segEL, 0, 0);
            imgData2 = ctx2.getImageData(0, 0, imageEL.width, imageEL.height); //Segmap dimension == image dimension

            for (let i = 0; i < imgData2.data.length; i += 4) {
                rgbArray2.push(imgData2.data[i]);
                rgbArray2.push(imgData2.data[i + 1]);
                rgbArray2.push(imgData2.data[i + 2]);


            }







        });

       


        //Adding paddings and int to binary conversion

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



        function hideBits(bits) {
            let bitlen = bits.length; //Message length
            let bitcount = 0; //Index of current message bit
            let hashCount = 0; //Index of distribution for current pixel (increases only by hide)
            let hiddenRES = ""; // Hidden bits as a string (Debug Output)
            let usedbits = []; // Used bit indexes for hiding (Debug Output)
            for (let i = 0; bitcount < bitlen; i++) { 
          
               
                if (colorMap[i] === true) { //if the pixel is true in segmentation map (Foreground)
                    for (let j = 0; j < 3; j++) { //RGB iteration

                        if (j != (bitcount + parseInt(freqtable[hashCount])) % 3) { // If this color channel should be used for hiding (current bit count + 0,1)%3

                            if (bits[bitcount] != undefined) {

                                //Get current binary pixel
                                let rgb = binPixels[i][j];

                                //Split binary pixel into individual bits
                                let arr = rgb.split('');

                                //Modify the LSB and XOR the bit
                                arr[7] = xor(bits[bitcount], freqtable[hashCount]);

                                //Combine arrays into string and modify image pixel
                                binPixels[i][j] = arr.join('');

                                //Counters about hidden data
                                hiddenRES += bits[bitcount]
                                bitcount++;
                                usedbits.push(i);
                            }


                        } else {
                              //background pixel
                            ; //continue iteration
                        }


                    }
                    //increase if a pixel used 
                    hashCount++
             

                }


            }
            document.getElementById("status").innerHTML = "Success!";
            console.info("Done:", hiddenRES, hiddenRES.length);


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

            console.warn("DONE!")
        }


        function getWhiteCount() {
            let whiteCount = 0; //Pixels we can hide in
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
            // Creating hash according to the provided password
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

            // Repeat 5 times to avoid obvious patterns
            hash = hash + dhash + thash + qhash + q2hash;

            console.log("White Count:", whiteCount)

            //Steg encode capacity in KiloBytes
            let estimated_capacity = (whiteCount * 2)
            var bold = document.createElement("b");
            bold.innerHTML = "Estimated Capacity:" + estimated_capacity + " Bits /" + estimated_capacity / 8000 + "KB";
            document.getElementById("estimated_cap_text").innerHTML = "Estimated Capacity:" + estimated_capacity + " Bits /" + estimated_capacity / 8000 + "KB";


            console.log(hash);
        }






        // Function to process distribution from hash

        function processHashDistribution() {


            for (let i = 0; i < hash.length; i++) {
                const element = hash[i];
                hashMap.push((parseInt(element, 16) % 8).toString(
                    2)); //MOD 8 to reduce the number of bits to 3  hex -> base10 -> mod8 -> binary

            }


            //Configure binary paddings for hash map
            hashMap.forEach(function (bin, index) {
                if (bin.length === 1) {
                    hashMap[index] = "00" + bin

                }
                if (bin.length === 2) {
                    hashMap[index] = "0" + bin

                }
            });

            console.log(hashMap);

        };

        // Iterate hash until data bitsize is met
        function iterateHash() {
            freqtable = []
            //Iterative hash to REPEATING HASH for performance concerns

            while (countHashCap() < key.length) {
                hashMap = [];
                hash = hash + hash
                processHashDistribution();
            }
            console.log("Final HASH:", hash);


            //Creating freqtable for XOR operation
            hashMap.forEach(function (bintrio) {
                freqtable.push(freq(bintrio));
            });
            console.log(freqtable)

        };

        //Count capacity of the extended hash
        function countHashCap() {
            let size = 0;
            let wastedsize = 0
            for (let i = 0; i < hashMap.length; i++) {
                const bin_trio = hashMap[i];
                for (let j = 0; j < bin_trio.length; j++) {
                    const char = bin_trio[j];
                    if (char === "1") {
                        size++
                    } else {
                        wastedsize++
                    }
                }
            }
            console.log("Hash capacity:", size, "Wasted bits:", wastedsize);
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


        //Getting individual pixel for inspection (DEBUG FUNC)
        function getPxDetails(x, y, pixcanvas) {
            let ctx = pixcanvas.getContext("2d");
            let id = ctx.getImageData(x, y, 1, 1);
            let idata = id.data;
            return "R:" + idata[0] + " G:" + idata[1] + " B:" + idata[2] + " A:" + idata[3]
        }


        /*
        TODO
        --Process hash distribution processes cumulatively (Performance impact!)
        -find available bit count
        -Indicate message end 
        -use threads if necessary
        
        
        */