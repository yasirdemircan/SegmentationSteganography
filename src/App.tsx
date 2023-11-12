import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer';
import {styles} from "./styles/Appstyle"
import { BsCloudUploadFill } from "react-icons/bs"
import getSize from './hooks/GetSize';
import { Button, ChakraProvider, Text, Stack, Box, Flex, Input, Image,  Icon, } from '@chakra-ui/react'
import LoadingDisplay from './components/LoadingDisplay';
import useHide, { useShow } from './hooks/HideAlg';
import useFetch from './hooks/useFetch';
import CapacityDisplay from './components/CapacityDisplay';



function App() {

  const [progress, setProgress] = useState("ready");
  const [fileSize, setFileSize] = useState("");
  const [password, setPass] = useState("");
  const [dataurl, setDataURL] = useState("");
  const [segMapSource, setSegMap] = useState("");

  //Input Data
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  //Input image 
  const fileInputRef2 = React.useRef<HTMLInputElement>(null);

  const canvas = React.useRef<HTMLCanvasElement>(null);
  const segcanvas = React.useRef<HTMLCanvasElement>(null);
  const origcanvas = React.useRef<HTMLCanvasElement>(null);

  const imageEl = React.useRef<HTMLImageElement>(null);
  const segEl = React.useRef<HTMLImageElement>(null);





  const hideFunc = useHide
  const showFunc = useShow
  const customFetch = useFetch

  const refsParam = {
    fileInputRef: fileInputRef,
    canvas: canvas,
    segcanvas: segcanvas,
    origcanvas: origcanvas,
    imageEl: imageEl,
    segEl: segEl,
  }

  const inputClick = () => {
    document.getElementById("input")?.click()
  }
  const inputClick2 = () => {
    document.getElementById("input2")?.click()

    if (fileInputRef2.current != null) {
      fileInputRef2.current.onchange = () => {
        handleImageInput()
        setProgress("segmenting")
      }
    }


  }



  useEffect(()=>{
    if (fileInputRef.current != null) {
      fileInputRef.current.onchange = ()=>{
        getSize(fileInputRef, setFileSize)
      }
    }
  
  },[])



  useEffect(() => {
    if (segMapSource != "" && segEl.current != null) {
      console.log(segMapSource)
      segEl.current.src = segMapSource
    }

  }, [segMapSource])


  const handleImageInput = () => {
    var file;
    var reader = new FileReader();

    if (fileInputRef2.current?.value == '') {
      console.log('No file selected');
      return;
    }
    if (fileInputRef2.current?.files !== null) {
      console.log(fileInputRef2.current?.files)
      file = fileInputRef2.current?.files[0];
    }



    reader.onload = (e) => {
      if (imageEl.current !== null) {
        let imageSource = 'data:image/png;base64,' + Buffer.from(e.target?.result as ArrayBuffer).toString("base64")
        imageEl.current.src = imageSource

        customFetch(imageSource.split(",")[1], 8000, setSegMap, setProgress)

      }

      console.log(e.target?.result)
    }

    reader.onerror = function (e) {
      // error occurred
      console.log('Error : ' + e.type);
    };

    reader.readAsArrayBuffer(file as File);

  }





  return (
    <ChakraProvider>

      <script integrity="sha512-E8QSvWZ0eCLGk4km3hxSsNmGWbLtSCSUcewDQPQWZF6pEU8GlT8a5fF32wOl1i8ftdMhssTrF/OhyGWwonTcXA==" src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
  
      <Flex style={styles.container} height={"100%"} flexDirection={'row'}>

        <Box  style={styles.controlpanel} >
          <Stack >

            <Button colorScheme='yellow' isDisabled={progress === ("segmenting" || "loading") ? true : false} onClick={inputClick2} rightIcon={<Icon as={BsCloudUploadFill}></Icon>}>Select Image</Button>
            <Button colorScheme='yellow' isDisabled={progress === ("segmenting" || "loading") ? true : false} onClick={inputClick} rightIcon={<Icon as={BsCloudUploadFill}></Icon>}>Select Data</Button>
            <Input id='input' ref={fileInputRef} style={{ display: "none" }} borderColor={"yellow"} type='file'></Input>
            <Input id='input2' ref={fileInputRef2} style={{ display: "none" }} borderColor={"yellow"} type='file'></Input>
           
            <Text style={{fontSize:18}}>{fileSize}</Text>


          </Stack>
          <Stack style={{ marginTop: 200 }}>
            <Input borderColor={"#ECC94B"}
            focusBorderColor='#904e95'
            type='password' _placeholder={{ color: "#ECC94B", opacity: "60%" , fontSize:20}} placeholder='Password' onChange={(e) => {
              setPass(e.target.value)
            }}></Input>
            <Button colorScheme='yellow'
              isDisabled={progress === ("segmenting" || "loading") ? true : false}
              onClick={() => {
                if (fileInputRef2.current?.value != '' && password != '' && fileInputRef.current?.value != '' && segMapSource != '') {
                  hideFunc(refsParam, password, setProgress, setDataURL)


                }
                else {
                  alert("Please provide an input image , embedding data and password")
                }


              }}>Start Encoding</Button>

            <Button colorScheme='yellow'
              isDisabled={progress === ("segmenting" || "loading") ? true : false}
              onClick={() => {
                if (fileInputRef2.current?.value != '' && password != '' && segMapSource != '') {
                  showFunc(refsParam, password, setProgress, setDataURL)


                }
                else {
                  alert("Please provide an input image and password")
                }


              }}>Start Decoding</Button>

            <CapacityDisplay dataurl={segMapSource}></CapacityDisplay>



          </Stack>

        </Box>


        <Flex style={styles.rightPanel}>
      
      
          <Box maxWidth={"50%"} height={"100vh"} width={"100vh"}>
            <Image className='image' ref={imageEl} src={require("./assets/test1.png")}></Image>
            <Image ref={segEl} src={require("./assets/segmap.jpg")} display={"none"}  ></Image>
            <Text align={'center'}>Original Image</Text>
          </Box>

          <Box  maxWidth={"50%"} maxHeight={"40%"} style={{ padding: 20 }}>
            {LoadingDisplay(dataurl, progress)}
          </Box>
        </Flex>

      </Flex>

      <canvas id="canvas" ref={canvas} style={{ display: "none" }} >
      </canvas>

      <canvas id="segcanvas" ref={segcanvas} style={{ display: "none" }}>
      </canvas>
      <canvas id="origcanvas" ref={origcanvas} style={{ display: "none" }}>
      </canvas>
  
    </ChakraProvider>

  );
}

export default App;
