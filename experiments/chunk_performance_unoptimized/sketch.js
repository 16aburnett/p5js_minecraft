// Minecraft in P5.js
// This experiment tests the performance of simply trying to draw
// a 16x16x16 chunk of blocks
// Author: Amy Burnett
//========================================================================
// Globals

//========================================================================

function preload ()
{

}

//========================================================================

function setup ()
{
   createCanvas (windowWidth, windowHeight, WEBGL);
}

//========================================================================

function draw() {
   background(200);
   orbitControl ();
   for (let i = 0; i < 16; ++i)
   {
      for (let j = 0; j < 16; ++j)
      {
         for (let k = 0; k <  16; ++k)
         {
            // if (i == 0 || i == 15 || j == 0 || j == 15 || k == 0 || k == 15)
            // {
            fill (255);
            translate (i*16, j*16, k*16);
            box (16);
            translate (-i*16, -j*16, -k*16);
            // }
         }
      }
   }
   print (frameRate ().toFixed (2));
}