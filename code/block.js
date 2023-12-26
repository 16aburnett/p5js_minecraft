// Minecraft in P5.js
// Block
// Author: Amy Burnett
//========================================================================
// Globals

const BLOCK_WIDTH = 16;

// Block IDs that represent the different kinds of blocks
const BLOCK_ID_AIR        = 0;
const BLOCK_ID_GRASS      = 1;
const BLOCK_ID_DIRT       = 2;
const BLOCK_ID_STONE      = 3;
const BLOCK_ID_WATER      = 4;
const BLOCK_ID_SAND       = 5;

const TEXTURE_TOP    = 0;
const TEXTURE_SIDE   = 1;
const TEXTURE_BOTTOM = 2;

const DRAW_STYLE_TEXTURED_PLANE   = 0; // individual texture images + plane
const DRAW_STYLE_WIREFRAME        = 1;
const DRAW_STYLE_FILL             = 2;
const DRAW_STYLE_FILL_WIREFRAME   = 3;
const DRAW_STYLE_TEXTURED         = 4; // texture atlas + vertex shape
const DRAW_STYLE_MAX              = 5;
let current_draw_style = 0;

const DRAW_STYLE_STR_MAP = new Map ();
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_TEXTURED_PLANE, "DRAW_STYLE_TEXTURED_PLANE");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_WIREFRAME, "DRAW_STYLE_WIREFRAME");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_FILL, "DRAW_STYLE_FILL");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_FILL_WIREFRAME, "DRAW_STYLE_FILL_WIREFRAME");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_TEXTURED, "DRAW_STYLE_TEXTURED (super slow)");

// The size of each texture in the texture atlas
const TEXTURE_WIDTH = 16;

// to save space, we only store block_ids to describe the world
// and so other static block information like textures is stored once 
// per block type (instead of once per block instance)
// dynamic block information will need to be stored elsewhere
let map_block_id_to_block_static_data;

//========================================================================

// this represents 
class BlockStaticData
{
    constructor (block_id, texture_atlas_data, texture_img_data, fill_color)
    {
        this.block_id = block_id;
        this.texture_atlas_data = texture_atlas_data;
        this.texture_img_data = texture_img_data;
        this.fill_color = fill_color;
    }
}

//========================================================================

// sets up block data
// this is needed because we need to give time for preload() to complete
// before adding texture images to blocks
// this should be called from the main setup() function
function block_setup ()
{
    map_block_id_to_block_static_data = new Map ();

    // air does not have a texture
    // but adding it here for completeness
    map_block_id_to_block_static_data.set (BLOCK_ID_AIR, new BlockStaticData (
        BLOCK_ID_AIR, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_null, // top
            texture_null, // sides
            texture_null  // bottom
        ], 
        [100, 150, 255, 100])
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_GRASS, new BlockStaticData (
        BLOCK_ID_GRASS, 
        [ // texture atlas positions
            [4, 0], // top
            [3, 0], // sides
            [2, 0]  // bottom
        ], 
        [ // individual texture images
            texture_grass_top, // top
            texture_grass_side, // sides
            texture_dirt  // bottom
        ], 
        "lime")
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_DIRT, new BlockStaticData (
        BLOCK_ID_DIRT, 
        [ // texture atlas positions
            [2, 0], // top
            [2, 0], // sides
            [2, 0]  // bottom
        ], 
        [ // individual texture images
            texture_dirt, // top
            texture_dirt, // sides
            texture_dirt  // bottom
        ], 
        "#964B00")
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_STONE, new BlockStaticData (
        BLOCK_ID_STONE, 
        [ // texture atlas positions
            [1, 0], // top
            [1, 0], // sides
            [1, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone, // top
            texture_stone, // sides
            texture_stone  // bottom
        ], 
        "gray")
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_WATER, new BlockStaticData (
        BLOCK_ID_WATER, 
        [ // texture atlas positions
            [6, 0], // top
            [6, 0], // sides
            [6, 0]  // bottom
        ], 
        [ // individual texture images
            texture_water, // top
            texture_water, // sides
            texture_water  // bottom
        ], 
        [50, 100, 255, 150])
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_SAND, new BlockStaticData (
        BLOCK_ID_SAND, 
        [ // texture atlas positions
            [5, 0], // top
            [5, 0], // sides
            [5, 0]  // bottom
        ], 
        [ // individual texture images
            texture_sand, // top
            texture_sand, // sides
            texture_sand  // bottom
        ], 
        "#C2B280")
    );

}

//========================================================================

// draws a box face by face and omits faces that cannot be seen
function draw_block (x, y, z)
{
    // ignore if it is an airblock
    if (blocks[x][y][z] == BLOCK_ID_AIR)
        return;

    push ();
    // move to block's center position
    translate (x*BLOCK_WIDTH, -y*BLOCK_WIDTH, z*BLOCK_WIDTH);

    // enable wireframe
    if (current_draw_style == DRAW_STYLE_WIREFRAME || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
    {
        stroke (0);
        strokeWeight (1);
    }
    // no wireframe
    else
        noStroke ();

    // front face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    let is_camera_infront_of_plane = camera.eyeZ >= z*BLOCK_WIDTH;
    let is_this_block_water = blocks[x][y][z] == BLOCK_ID_WATER;
    if ((z+1 >= CHUNK_SIZE || blocks[x][y][z+1] == BLOCK_ID_AIR || (blocks[x][y][z+1] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        // move to plane's position
        translate (0, 0, BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
            // plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_SIDE]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }

    // back face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeZ <= z*BLOCK_WIDTH;
    if ((z-1 < 0 || blocks[x][y][z-1] == BLOCK_ID_AIR || (blocks[x][y][z-1] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        translate (0, 0, -BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_SIDE]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }

    // left face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeX <= x*BLOCK_WIDTH;
    if ((x-1 < 0 || blocks[x-1][y][z] == BLOCK_ID_AIR || (blocks[x-1][y][z] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        rotateY (PI/2);
        translate (0, 0, -BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_SIDE]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }

    // right face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    is_camera_infront_of_plane = camera.eyeX >= x*BLOCK_WIDTH;
    if ((x+1 >= CHUNK_SIZE || blocks[x+1][y][z] == BLOCK_ID_AIR || (blocks[x+1][y][z] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        rotateY (PI/2);
        translate (0, 0, BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_SIDE][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_SIDE]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }

    // top face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    // is_camera_infront_of_plane = camera.eyeY >= y*BLOCK_WIDTH;
    // y axis needs to be reversed and negated
    is_camera_infront_of_plane = camera.eyeY <= -y*BLOCK_WIDTH;
    if ((y+1 >= WORLD_HEIGHT || blocks[x][y+1][z] == BLOCK_ID_AIR || (blocks[x][y+1][z] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        rotateX (PI/2);
        translate (0, 0, BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_TOP][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_TOP][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_TOP]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }
    
    // bottom face
    // only draw if no block is immediately in front of face
    // dont draw if camera is behind plane
    // is_camera_infront_of_plane = camera.eyeY <= y*BLOCK_WIDTH;
    // y axis needs to be reversed and negated
    is_camera_infront_of_plane = camera.eyeY >= -y*BLOCK_WIDTH;
    if ((y-1 < 0 || blocks[x][y-1][z] == BLOCK_ID_AIR || (blocks[x][y-1][z] == BLOCK_ID_WATER && !is_this_block_water)) && is_camera_infront_of_plane)
    {
        push ();
        rotateX (PI/2);
        translate (0, 0, -BLOCK_WIDTH/2);
        // draw textured face via texture atlas + manual vertex shape
        if (current_draw_style == DRAW_STYLE_TEXTURED)
        {
            let texture_id_x = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_BOTTOM][0];
            let texture_id_y = map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_atlas_data[TEXTURE_BOTTOM][1];
            texture (texture_atlas);
            beginShape ();
            vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            endShape ();
        }
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        if (current_draw_style == DRAW_STYLE_TEXTURED_PLANE)
        {
            texture (map_block_id_to_block_static_data.get (blocks[x][y][z]).texture_img_data[TEXTURE_BOTTOM]);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
            
        }
        // or draw filled plane
        if (current_draw_style == DRAW_STYLE_FILL || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
        {
            fill (map_block_id_to_block_static_data.get (blocks[x][y][z]).fill_color);
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        // or draw wireframe plane
        if (current_draw_style == DRAW_STYLE_WIREFRAME)
        {
            noFill ();
            plane (BLOCK_WIDTH, BLOCK_WIDTH);
        }
        pop ();
    }

    pop ();
}