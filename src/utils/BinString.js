 //Function to convert uint8array to binary encoded string "0101"

export default function toBinString(bytes){
   return bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '');
}