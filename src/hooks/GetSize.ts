import toBinString from "../utils/BinString.js"

export default function getSize(e:React.RefObject<HTMLInputElement>,
    handleFilesize:React.Dispatch<React.SetStateAction<string>>){

    const element = e.current;
    let file;
 if (element?.value == '') {
        console.log('No file selected');
        return;
    }

    if (element?.files){
        file = element.files[0]
    }
   

    let reader = new FileReader();
    reader.onload = function (e) {
        // binary data
        let readResult = e.target?.result;
        let bufferdata = new Uint8Array(readResult as ArrayBuffer);
        handleFilesize("File Size: " + (toBinString(bufferdata).length) / 8000 + "KB");
        console.log("File Size: " + (toBinString(bufferdata).length) / 8000 + "KB");
    }

    reader.onerror = function (e) {
        // error occurred
        console.log('Error : ' + e.type);
    };
    reader.readAsArrayBuffer(file as File);

}