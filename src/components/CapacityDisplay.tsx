import React , {PropsWithChildren, useEffect, useState} from 'react'



export default function CapacityDisplay({dataurl}:{dataurl:string}) {
    var oldDataUrl = ""
    const [bitCapacity,setCapacity] = useState(0);


    

    const calculateCap = ()=>{
        let tempCap = 0;
      
        
    
        const img = document.createElement("img");
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        img.src = dataurl;
    

        img.onload = ()=>{
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight

            context?.drawImage(img,0,0);

            let pixeldata = context?.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data
            console.log(pixeldata)
            let alpha = 0
            for(let i = 0; i < canvas.width*canvas.height*4; i++) {
                
                if(pixeldata?.at(i) as number > 0){
                    
                    tempCap = tempCap + 1
                    
                 }
            }
            setCapacity(((tempCap) - (canvas.width*canvas.height))/12000)
        }
   
    }
    
    useEffect(() => {

        if ( dataurl !== oldDataUrl) {
          calculateCap();
          console.log("worked")
          oldDataUrl = dataurl
        }
        
      }, [dataurl]);

   
    
  return (
    <div>Capacity: {bitCapacity} KB</div>
  )
}
