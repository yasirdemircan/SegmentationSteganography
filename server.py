from ctypes import resize
import os
from io import BytesIO
import threading
import base64

#for post req server
import http.server

#parsing html for pipeline
from bs4 import BeautifulSoup

import sys #for starting arguments



import tarfile
import tempfile
from six.moves import urllib

from matplotlib import gridspec
from matplotlib import pyplot as plt
import numpy as np
from PIL import Image
from urllib.request import Request, urlopen
from urllib.parse import urlparse

import tensorflow.compat.v1 as tf


original_wh = (0,0)

import socketserver

INDEXFILE = 'index.html'



class MyRequestHandler(http.server.SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
      self.send_response(200, "ok")
      self.send_header('Access-Control-Allow-Origin', '*')
      self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
      self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
      self.send_header("Access-Control-Allow-Headers", "Content-Type")
      self.end_headers()

    def do_GET(self):

        # Parse query data to find out what was requested
        parsedParams = urlparse(self.path)

        # See if the file requested exists
        if os.access('.' + os.sep + parsedParams.path, os.R_OK):
            # File exists, serve it up
            http.server.SimpleHTTPRequestHandler.do_GET(self)

        # send index.html, but don't redirect
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        with open(INDEXFILE, 'rb') as fin:
            self.copyfile(fin, self.wfile)
    

    def do_POST(self):
        # Get the length of the POST request body.
        content_length = int(self.headers.get('Content-Length'))

        # Read the POST request body.
        post_data = self.rfile.read(content_length)

        # Decode the POST request body.
        post_data = post_data.decode()
        #creating the image
        binary_data = base64.b64decode(post_data)
        image_stream = BytesIO(binary_data)
        reqimg = Image.open(image_stream)
        reqimg.save("reqimg.png")
        # Print the POST request body.
        print(post_data)

        # Send a response to the client.
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

        #Convert and send image
        respimg = run_model(reqimg)

        image_bytes = BytesIO()
        respimg.save(image_bytes, format='JPEG')
        base64_string = base64.b64encode(image_bytes.getvalue())
        base64_string = base64_string.decode()

        self.wfile.write(base64_string.encode())


class DeepLabModel(object):
  """Class to load deeplab model and run inference."""

  INPUT_TENSOR_NAME = 'ImageTensor:0'
  OUTPUT_TENSOR_NAME = 'SemanticPredictions:0'
  INPUT_SIZE = 513
  FROZEN_GRAPH_NAME = 'model/frozen_inference_graph.pb'

  def __init__(self):
    """Creates and loads pretrained deeplab model."""
    self.graph = tf.Graph()

    graph_def = None
    #Read .pb model as binary
    graphfile = open(self.FROZEN_GRAPH_NAME, "rb")
    graph_def = tf.GraphDef.FromString(graphfile.read())
    #Error handling
    if graph_def is None:
      raise RuntimeError('Cannot find inference graph in tar archive.')
    #Importing trained model
    with self.graph.as_default():
      tf.import_graph_def(graph_def, name='')

    self.sess = tf.Session(graph=self.graph)


  def run(self, image):
    """Runs inference on a single image.

    Args:
      image: A PIL.Image object, raw input image.

    Returns:
      resized_image: RGB image resized from original input image.
      seg_map: Segmentation map of `resized_image`.
    """
    #Resizing image according to input size
    """
    width, height = image.size
    resize_ratio = 1.0 * self.INPUT_SIZE / max(width, height)
    target_size = (int(resize_ratio * width), int(resize_ratio * height))
    resized_image = image.convert('RGB').resize(target_size, Image.ANTIALIAS)
    """
    #Running model on resized image
    batch_seg_map = self.sess.run(
        self.OUTPUT_TENSOR_NAME,
        feed_dict={self.INPUT_TENSOR_NAME: [np.asarray(image)]})
    seg_map = batch_seg_map[0]
    return image, seg_map






#Initializing model
MODEL = DeepLabModel()
print('model loaded successfully! serving at port 8000')





#Function for resetting LSB for consistent segmap
def get_bin(x): return format(x, '08b')

def clearlsb(pix):
    r = get_bin(pix[0])
    g = get_bin(pix[1])
    b = get_bin(pix[2])
    newr = r[0]+r[1]+r[2]+r[3]+r[4]+r[5]+r[6]+"0"
    newg = g[0]+g[1]+g[2]+g[3]+g[4]+g[5]+g[6]+"0"
    newb = b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+"0"
    newpx = (int(newr, 2), int(newg, 2), int(newb, 2))
    return newpx

#Function to resize image for input
def Resize_img(src_img):
    im = src_img
    width, height = im.size
    global original_wh
    original_wh = (im.width,im.height)
    resize_ratio = 1.0 * 513 / max(width, height)
    target_size = (int(resize_ratio * width), int(resize_ratio * height))
    resized_image = im.convert('RGB').resize(target_size)
    return resized_image
    
def Preprocess(im):
  #Opening image and clearing LSB
   # im = Image.open(sys.argv[2])

    
    px = im.load()

    for x in range(im.width):
        for y in range(im.height):

            px.__setitem__((x, y), clearlsb(px[x, y]))
    #Baseline no lsb image
    im.convert('RGB').save("temp.jpg")
 


def run_model(im):
  """Inferences DeepLab model"""
  try:

    Preprocess(im);
    original_im = Image.open("temp.jpg")
    original_im = Resize_img(original_im)
  except IOError as ioex:
    print(ioex);
    return

  
  
  input_im, seg_map = MODEL.run(original_im)
  

  
#Converting label segmap into 1 channel segmentation jpg
  for index,x in enumerate(seg_map):
    for index2,y in enumerate(x):
      if y > 0:
        seg_map[index][index2] = 255
        
  segimg =Image.fromarray(seg_map.astype(np.uint8),"L")
  
  #Scale segmentation map back to original
  target_size = original_wh
  segimg = segimg.resize(target_size,resample= Image.NEAREST)
  
  segimg.save("segmap.jpg")

  
#send segimg with post
  
  input_im.save("img.jpg")
  return segimg  






#Running model here
#run_model()
#print(sys.argv[1])

# Create a new server object.
server = http.server.HTTPServer(('localhost', 8000), MyRequestHandler)


# Start the server.
server.serve_forever()