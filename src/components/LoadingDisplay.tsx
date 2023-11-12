import React, { useState } from 'react'
import { Button, ChakraProvider, Text, Stack, Box, Flex, Input, Divider, Image, TagLabel, Icon, Spinner, Center, Alert } from '@chakra-ui/react'




const redirectDownload = (url: string) => {
  let a = document.createElement("a");
  a.download = "stegenc.png"
  a.href = url;
  a.click()
}

  


export default function LoadingDisplay(dataurl:string,progress:string) {
  

  
  const renderFunc = ()=>{
    switch (progress) {
      case "ready": return (<Box width={500} height={500} ></Box>);
      case "Loading": return (<Box width={500} height={500} >
        <Center>
          <Spinner
            thickness='4px'
            speed='0.65s'
            emptyColor='gray.200'
            color='yellow.500'
            size='xl'
          />
          <Text>Loading...</Text>
        </Center>
      </Box>);
      case "segmenting": return (<Box width={500} height={500} >
      <Center>
        <Spinner
          thickness='4px'
          speed='0.65s'
          emptyColor='gray.200'
          color='yellow.500'
          size='xl'
        />
        <Text>Segmenting the image...</Text>
      </Center>
    </Box>);

    case "Done_extract": return (<Box width={800} height={800} >
    <Center>
      
     <div style={{overflowY: 'scroll',height:800,width:800}}>
     <Text>Extracted Data:</Text>
      <Text>{dataurl}</Text>
     </div>

      
    </Center>
  </Box>)

      case "Done": return (<Box width={500} height={500} >
        <Center>
        <Button onClick={() => { redirectDownload(dataurl) }}>Download</Button>
        </Center>
      </Box>);
      default: return (<Box width={500} height={500} ></Box>)
    }
  }


  return(<>{renderFunc()}</>)


}


