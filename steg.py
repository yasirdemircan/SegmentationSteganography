from ctypes import resize
import os
from io import BytesIO

#parsing html for pipeline
from bs4 import BeautifulSoup

import sys #for starting arguments

#Web UI access
import webbrowser

#The chrome application path 
chrome_path = 'C:/Program Files/Google/Chrome/Application/chrome.exe %s'

import tarfile
import tempfile
from six.moves import urllib

from matplotlib import gridspec
from matplotlib import pyplot as plt
import numpy as np
from PIL import Image
from urllib.request import Request, urlopen

import tensorflow.compat.v1 as tf


original_wh = (0,0)

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
print('model loaded successfully!')


_SAMPLE_URL = ("https://preview.redd.it/4z172n2jirq51.png?auto=webp&s=c80b2a8906cdc28f8322cdd6b34d2a6b783b83a5")


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
    
def Preprocess():
  #Opening image and clearing LSB
    im = Image.open(sys.argv[2])

    
    px = im.load()

    for x in range(im.width):
        for y in range(im.height):

            px.__setitem__((x, y), clearlsb(px[x, y]))
    #Baseline no lsb image
    im.convert('RGB').save("temp.jpg")
 


def run_model():
  """Inferences DeepLab model"""
  try:

    Preprocess();
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
  
  input_im.save("img.jpg")
    

run_model()
print(sys.argv[1])


def editHTML(htmlfile,filename):
  # Open the html file
  base = os.path.dirname(os.path.abspath(__file__))
  html = open(os.path.join(base, htmlfile))

  # Parse the html with BeautifulSoup
  soup = BeautifulSoup(html, "html.parser")

  # Find the element you want to modify
  old_text = soup.find("img", {"id": "img"})
  old_text["src"] = filename
  print(old_text)

  # Write the modified html to a new file
  with open(htmlfile, "wb") as f_output:
    f_output.write(soup.prettify("utf-8"))

    #host the modified html file
    os.popen("ws")


if (sys.argv[1] == "hide"):

  #Edit segmented filename into the hosted html
  editHTML("index.html",sys.argv[2])

  url = 'http://localhost:8000/index.html'

  webbrowser.get(chrome_path).open(url)
else:
  editHTML("index2.html",sys.argv[2])
  url = 'http://localhost:8000/index2.html'
  webbrowser.get(chrome_path).open(url)