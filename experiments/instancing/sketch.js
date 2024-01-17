// Minecraft in P5.js
// This experiment tests the performance of simply trying to draw
// a 16x16x16 chunk of blocks
// Author: Amy Burnett
//========================================================================
// Globals

let graphics;
let cam;

const CHUNK_SIZE = 16;
const BLOCK_WIDTH = 16;

const MODE_NAIVE = 0;
const MODE_HIDDEN_BLOCK_CULLING = 1;
const MODE_PREBUILT_GEOMETRY_NAIVE = 2;
const MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES = 3;
const MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES_TEXTURE_ATLAS = 4;
const MODE_PREBUILT_GEOMETRY_HIDDEN_BLOCK_CULLING_BY_VERTICES_TEXTURE_ATLAS = 5;
const MODE_MAX = 6;
let mode_to_string = new Map ();
mode_to_string.set (MODE_NAIVE, "NAIVE");
mode_to_string.set (MODE_HIDDEN_BLOCK_CULLING, "HIDDEN_BLOCK_CULLING");
mode_to_string.set (MODE_PREBUILT_GEOMETRY_NAIVE, "PREBUILT_GEOMETRY_NAIVE");
mode_to_string.set (MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES, "PREBUILT_GEOMETRY_NAIVE_BY_VERTICES");
mode_to_string.set (MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES_TEXTURE_ATLAS, "PREBUILT_GEOMETRY_NAIVE_BY_VERTICES_TEXTURE_ATLAS");
mode_to_string.set (MODE_PREBUILT_GEOMETRY_HIDDEN_BLOCK_CULLING_BY_VERTICES_TEXTURE_ATLAS, "PREBUILT_GEOMETRY_HIDDEN_BLOCK_CULLING_BY_VERTICES_TEXTURE_ATLAS");
let g_mode = MODE_PREBUILT_GEOMETRY_HIDDEN_BLOCK_CULLING_BY_VERTICES_TEXTURE_ATLAS;

let g_frame_rate_history = [];

let texture_grass_top;
let texture_grass_bottom;
let texture_grass_side;
let texture_atlas;

let g_chunk_geometry_naive = null;
let g_chunk_geometry_naive_by_vertices = null;
let g_chunk_geometry_naive_by_vertices_texture_atlas = null;
let g_chunk_geometry_hidden_block_culling_by_vertices_texture_atlas = null;
const TEXTURE_WIDTH = 160;

//========================================================================

function preload ()
{
   texture_grass_top    = loadImage ("texture_grass_top_64x.png");
   texture_grass_bottom = loadImage ("texture_dirt_64x.png");
   texture_grass_side   = loadImage ("texture_grass_side_64x.png");
   texture_atlas = loadImage ("block_texture_atlas_10x.png");
}

//========================================================================

function setup ()
{
   graphics = createGraphics (windowWidth, windowHeight, WEBGL);
   cam = graphics.createCamera();
   createCanvas (windowWidth, windowHeight);
}

//========================================================================

function draw () {
   graphics.clear ();
   graphics.reset ();
   graphics.background (160, 200, 255);
   // graphics.orbitControl ();

   switch (g_mode)
   {
      case MODE_NAIVE:
         draw_chunk_naive ();
         break;
      case MODE_HIDDEN_BLOCK_CULLING:
         draw_chunk_hidden_block_culling ();
         break;
      case MODE_PREBUILT_GEOMETRY_NAIVE:
         draw_chunk_prebuilt_geometry_naive ();
         break;
      case MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES:
         draw_chunk_prebuilt_geometry_naive_by_vertices ();
         break;
      case MODE_PREBUILT_GEOMETRY_NAIVE_BY_VERTICES_TEXTURE_ATLAS:
         draw_chunk_prebuilt_geometry_naive_by_vertices_texture_atlas ();
         break;
      case MODE_PREBUILT_GEOMETRY_HIDDEN_BLOCK_CULLING_BY_VERTICES_TEXTURE_ATLAS:
         draw_chunk_prebuilt_geometry_hidden_block_culling_by_vertices_texture_atlas ();
         break;
   }

   // draw 3D graphics as an image in the 2D canvas
   image (graphics, 0, 0, width, height);

   textSize (12);
   fill (0);
   noStroke ();
   textAlign (LEFT, TOP);
   text (
      `FPS:            ${(frameRate ()).toFixed (2)}\n` +
      `FPS_ave_of_100: ${(g_frame_rate_history.reduce ((acc, curr) => {return acc + curr}, 0) / g_frame_rate_history.length).toFixed (2)}\n` +
      `draw mode:      ${mode_to_string.get (g_mode)}\n`,
      0,
      0
   );
   g_frame_rate_history.push (frameRate ());
   if (g_frame_rate_history.length > 100)
      g_frame_rate_history.slice (1, g_frame_rate_history.length);
}

//========================================================================

function draw_chunk_naive ()
{
   for (let i = 0; i < CHUNK_SIZE; ++i)
   {
      for (let j = 0; j < CHUNK_SIZE; ++j)
      {
         for (let k = 0; k < CHUNK_SIZE; ++k)
         {
            graphics.noFill ();
            graphics.noStroke ();
            graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
            
            // front
            graphics.translate (0, 0, BLOCK_WIDTH/2);
            graphics.texture (texture_grass_side);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.translate (0, 0, -BLOCK_WIDTH/2);
            // back
            graphics.translate (0, 0, -BLOCK_WIDTH/2);
            graphics.texture (texture_grass_side);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.translate (0, 0, BLOCK_WIDTH/2);
            // left
            graphics.translate (-BLOCK_WIDTH/2, 0, 0);
            graphics.rotateY (HALF_PI);
            graphics.texture (texture_grass_side);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.rotateY (-HALF_PI);
            graphics.translate (BLOCK_WIDTH/2, 0, 0);
            // right
            graphics.translate (BLOCK_WIDTH/2, 0, 0);
            graphics.rotateY (HALF_PI);
            graphics.texture (texture_grass_side);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.rotateY (-HALF_PI);
            graphics.translate (-BLOCK_WIDTH/2, 0, 0);
            // top
            graphics.translate (0, -BLOCK_WIDTH/2, 0);
            graphics.rotateX (HALF_PI);
            graphics.texture (texture_grass_top);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.rotateX (-HALF_PI);
            graphics.translate (0, BLOCK_WIDTH/2, 0);
            // bottom
            graphics.translate (0, BLOCK_WIDTH/2, 0);
            graphics.rotateX (HALF_PI);
            graphics.texture (texture_grass_bottom);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            graphics.rotateX (-HALF_PI);
            graphics.translate (0, -BLOCK_WIDTH/2, 0);

            graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
         }
      }
   }
}

//========================================================================

function draw_chunk_hidden_block_culling ()
{
   for (let i = 0; i < CHUNK_SIZE; ++i)
   {
      for (let j = 0; j < CHUNK_SIZE; ++j)
      {
         for (let k = 0; k < CHUNK_SIZE; ++k)
         {
            if (i == 0 || i == CHUNK_SIZE-1 || j == 0 || j == CHUNK_SIZE-1 || k == 0 || k == CHUNK_SIZE-1)
            {
               graphics.noFill ();
               graphics.noStroke ();
               graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
               
               // front
               graphics.translate (0, 0, BLOCK_WIDTH/2);
               graphics.texture (texture_grass_side);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.translate (0, 0, -BLOCK_WIDTH/2);
               // back
               graphics.translate (0, 0, -BLOCK_WIDTH/2);
               graphics.texture (texture_grass_side);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.translate (0, 0, BLOCK_WIDTH/2);
               // left
               graphics.translate (-BLOCK_WIDTH/2, 0, 0);
               graphics.rotateY (HALF_PI);
               graphics.texture (texture_grass_side);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.rotateY (-HALF_PI);
               graphics.translate (BLOCK_WIDTH/2, 0, 0);
               // right
               graphics.translate (BLOCK_WIDTH/2, 0, 0);
               graphics.rotateY (HALF_PI);
               graphics.texture (texture_grass_side);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.rotateY (-HALF_PI);
               graphics.translate (-BLOCK_WIDTH/2, 0, 0);
               // top
               graphics.translate (0, -BLOCK_WIDTH/2, 0);
               graphics.rotateX (HALF_PI);
               graphics.texture (texture_grass_top);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.rotateX (-HALF_PI);
               graphics.translate (0, BLOCK_WIDTH/2, 0);
               // bottom
               graphics.translate (0, BLOCK_WIDTH/2, 0);
               graphics.rotateX (HALF_PI);
               graphics.texture (texture_grass_bottom);
               graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
               graphics.rotateX (-HALF_PI);
               graphics.translate (0, -BLOCK_WIDTH/2, 0);
   
               graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
            }
         }
      }
   }
}

//========================================================================

function draw_chunk_prebuilt_geometry_naive ()
{
   // build geometry if we havent built it before
   if (g_chunk_geometry_naive == null)
      g_chunk_geometry_naive = graphics.buildGeometry (() => {
         for (let i = 0; i < CHUNK_SIZE; ++i)
         {
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
               for (let k = 0; k < CHUNK_SIZE; ++k)
               {
                  graphics.noFill ();
                  graphics.noStroke ();
                  graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
                  
                  // front
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  graphics.texture (texture_grass_side);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  // back
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  graphics.texture (texture_grass_side);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  // left
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_grass_side);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  // right
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_grass_side);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  // top
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_grass_top);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  // bottom
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_grass_bottom);
                  graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);

                  graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
               }
            }
         }
      });
   graphics.noFill ();
   graphics.noStroke ();
   graphics.texture (texture_grass_bottom);
   graphics.model (g_chunk_geometry_naive);
}

//========================================================================

function draw_chunk_prebuilt_geometry_naive_by_vertices ()
{
   // build geometry if we havent built it before
   if (g_chunk_geometry_naive_by_vertices == null)
      g_chunk_geometry_naive_by_vertices = graphics.buildGeometry (() => {
         for (let i = 0; i < CHUNK_SIZE; ++i)
         {
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
               for (let k = 0; k < CHUNK_SIZE; ++k)
               {
                  graphics.noFill ();
                  graphics.noStroke ();
                  graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
                  
                  // front
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  graphics.texture (texture_grass_side);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  // back
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  graphics.texture (texture_grass_side);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  // left
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_grass_side);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  // right
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_grass_side);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  // top
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_grass_top);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  // bottom
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_grass_bottom);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 0, 0); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, 1024, 0); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 1024, 1024); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, 0, 1024); // bottom left
                  graphics.endShape ();
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);

                  graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
               }
            }
         }
      });
   graphics.noFill ();
   graphics.noStroke ();
   graphics.texture (texture_grass_bottom);
   graphics.model (g_chunk_geometry_naive_by_vertices);
}

//========================================================================

function draw_chunk_prebuilt_geometry_naive_by_vertices_texture_atlas ()
{
   // build geometry if we havent built it before
   if (g_chunk_geometry_naive_by_vertices_texture_atlas == null)
      g_chunk_geometry_naive_by_vertices_texture_atlas = graphics.buildGeometry (() => {
         for (let i = 0; i < CHUNK_SIZE; ++i)
         {
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
               for (let k = 0; k < CHUNK_SIZE; ++k)
               {
                  graphics.noFill ();
                  graphics.noStroke ();
                  graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
                  
                  // front
                  let texture_id_x = 3;
                  let texture_id_y = 0;
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  // back
                  texture_id_x = 3;
                  texture_id_y = 0;
                  graphics.translate (0, 0, -BLOCK_WIDTH/2);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.translate (0, 0, BLOCK_WIDTH/2);
                  // left
                  texture_id_x = 3;
                  texture_id_y = 0;
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  // right
                  texture_id_x = 3;
                  texture_id_y = 0;
                  graphics.translate (BLOCK_WIDTH/2, 0, 0);
                  graphics.rotateY (HALF_PI);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.rotateY (-HALF_PI);
                  graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                  // top
                  texture_id_x = 4;
                  texture_id_y = 0;
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  // bottom
                  texture_id_x = 2;
                  texture_id_y = 0;
                  graphics.translate (0, BLOCK_WIDTH/2, 0);
                  graphics.rotateX (HALF_PI);
                  graphics.texture (texture_atlas);
                  graphics.beginShape ();
                  graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                  graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                  graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                  graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                  graphics.endShape ();
                  graphics.rotateX (-HALF_PI);
                  graphics.translate (0, -BLOCK_WIDTH/2, 0);

                  graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
               }
            }
         }
      });
   // draw model
   graphics.noFill ();
   graphics.noStroke ();
   graphics.texture (texture_atlas);
   graphics.model (g_chunk_geometry_naive_by_vertices_texture_atlas);
}

//========================================================================

function draw_chunk_prebuilt_geometry_hidden_block_culling_by_vertices_texture_atlas ()
{
   // build geometry if we havent built it before
   if (g_chunk_geometry_hidden_block_culling_by_vertices_texture_atlas == null)
      g_chunk_geometry_hidden_block_culling_by_vertices_texture_atlas = graphics.buildGeometry (() => {
         for (let i = 0; i < CHUNK_SIZE; ++i)
         {
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
               for (let k = 0; k < CHUNK_SIZE; ++k)
               {
                  if (i == 0 || i == CHUNK_SIZE-1 || j == 0 || j == CHUNK_SIZE-1 || k == 0 || k == CHUNK_SIZE-1)
                  {
                     graphics.noFill ();
                     graphics.noStroke ();
                     graphics.translate (i*BLOCK_WIDTH, -j*BLOCK_WIDTH, k*BLOCK_WIDTH);
                     
                     // front
                     let texture_id_x = 3;
                     let texture_id_y = 0;
                     graphics.translate (0, 0, BLOCK_WIDTH/2);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.translate (0, 0, -BLOCK_WIDTH/2);
                     // back
                     texture_id_x = 3;
                     texture_id_y = 0;
                     graphics.translate (0, 0, -BLOCK_WIDTH/2);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.translate (0, 0, BLOCK_WIDTH/2);
                     // left
                     texture_id_x = 3;
                     texture_id_y = 0;
                     graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                     graphics.rotateY (HALF_PI);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.rotateY (-HALF_PI);
                     graphics.translate (BLOCK_WIDTH/2, 0, 0);
                     // right
                     texture_id_x = 3;
                     texture_id_y = 0;
                     graphics.translate (BLOCK_WIDTH/2, 0, 0);
                     graphics.rotateY (HALF_PI);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.rotateY (-HALF_PI);
                     graphics.translate (-BLOCK_WIDTH/2, 0, 0);
                     // top
                     texture_id_x = 4;
                     texture_id_y = 0;
                     graphics.translate (0, -BLOCK_WIDTH/2, 0);
                     graphics.rotateX (HALF_PI);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.rotateX (-HALF_PI);
                     graphics.translate (0, BLOCK_WIDTH/2, 0);
                     // bottom
                     texture_id_x = 2;
                     texture_id_y = 0;
                     graphics.translate (0, BLOCK_WIDTH/2, 0);
                     graphics.rotateX (HALF_PI);
                     graphics.texture (texture_atlas);
                     graphics.beginShape ();
                     graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
                     graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
                     graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
                     graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
                     graphics.endShape ();
                     graphics.rotateX (-HALF_PI);
                     graphics.translate (0, -BLOCK_WIDTH/2, 0);

                     graphics.translate (-i*BLOCK_WIDTH, j*BLOCK_WIDTH, -k*BLOCK_WIDTH);
                  }
               }
            }
         }
      });
   // draw model
   graphics.noFill ();
   graphics.noStroke ();
   graphics.texture (texture_atlas);
   graphics.model (g_chunk_geometry_hidden_block_culling_by_vertices_texture_atlas);
}

//========================================================================

function keyPressed ()
{
   if (keyCode == "T".charCodeAt (0))
   {
      g_mode = (g_mode + 1) % MODE_MAX;
   }
   if (keyCode == "L".charCodeAt (0))
   {
      loop ();
   }
   if (keyCode == "N".charCodeAt (0))
   {
      noLoop ();
   }
   if (keyCode == "C".charCodeAt (0))
   {
      g_chunk_geometry_naive = null;
      g_chunk_geometry_naive_by_vertices = null;
      g_chunk_geometry_naive_by_vertices_texture_atlas = null;
      g_chunk_geometry_hidden_block_culling_by_vertices_texture_atlas = null;
   }
}

//========================================================================

// https://stackoverflow.com/questions/68986225/orbitcontrol-in-creategraphics-webgl-on-a-2d-canvas
const sensitivityX = 1;
const sensitivityY = 1;
const sensitivityZ = 0.001;
const scaleFactor = 100;
function mouseDragged() {
   // I'm only implementing orbit and zoom here, but you could implement
   // panning as well.
   
   // Technically _orbit is not a publicly documented part of the
   // p5.Camera API. I will leave it as an excersise to the reader to
   // re-implement this functionality via the public API.
   
   // The _orbit function updates the Euler angles for the position of
   // the camera around the target towards which it is oriented, and
   // adjusts its distance from the target.
   const deltaTheta = (-sensitivityX * (mouseX - pmouseX)) / scaleFactor;
   const deltaPhi = (sensitivityY * (mouseY - pmouseY)) / scaleFactor;
   cam._orbit(deltaTheta, deltaPhi, 0);
 }
 
 function mouseWheel(event) {
   if (event.delta > 0) {
     cam._orbit(0, 0, sensitivityZ * scaleFactor);
   } else {
     cam._orbit(0, 0, -sensitivityZ * scaleFactor);
   }
 }