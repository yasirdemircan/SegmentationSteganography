
export default function useFetch(imgdata:string,port:number,statefunc:Function,progressfunc:Function):void {

    fetch("http://localhost:"+port, {
        method: "POST",
        
        headers: { "Content-Type": "application/json" },
        body: imgdata
      }).then(response => response.text())
      .then(text => {
        progressfunc("ready")
        statefunc('data:image/png;base64,' + text)
      })

}