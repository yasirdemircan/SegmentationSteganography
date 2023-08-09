# SegmentationSteganography

This repository contains the source code of a LSB steganography method using image segmentation. 
The application uses a webserver command (ws) to create a webserver in the working directory, the default webserver used can be found in the following link :
-https://github.com/lwsjs/local-web-server

An example hide command for starting the algorithm for the example.png in the working directory would be : 
- python steg.py hide example.png

This command will start a webserver and create a Chrome instance to run the web app which lets the user select a file to hide and a password.
Embedded image can be obtained from the bottom canvas after the success message.

The following command can be used to start the web app in extracting mode. This UI gives an option to enter the password and extract the data :
- python steg.py show steg.png
