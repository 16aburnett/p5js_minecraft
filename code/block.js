// Minecraft in P5.js
// Block
// Author: Amy Burnett
//========================================================================
// Globals

const BACK_FACE_CULLING = true;

const BLOCK_WIDTH = 1;

// Block IDs that represent the different kinds of blocks
const BLOCK_ID_NONE         = -1;
const BLOCK_ID_AIR          = 0;
const BLOCK_ID_GRASS        = 1;
const BLOCK_ID_DIRT         = 2;
const BLOCK_ID_STONE        = 3;
const BLOCK_ID_WATER        = 4;
const BLOCK_ID_SAND         = 5;
const BLOCK_ID_LOG          = 6;
const BLOCK_ID_LEAVES       = 7;
const BLOCK_ID_GLASS        = 8;
const ITEM_ID_STONE_PICKAXE = 9;
const ITEM_ID_STONE_SHOVEL  = 10;
const ITEM_ID_STONE_AXE     = 11;
const ITEM_ID_STONE_HOE     = 12;
const ITEM_ID_STONE_SWORD   = 13;
const BLOCK_ID_STR_MAP = new Map ();
BLOCK_ID_STR_MAP.set (BLOCK_ID_NONE  , "BLOCK_ID_NONE");
BLOCK_ID_STR_MAP.set (BLOCK_ID_AIR   , "BLOCK_ID_AIR");
BLOCK_ID_STR_MAP.set (BLOCK_ID_GRASS , "BLOCK_ID_GRASS");
BLOCK_ID_STR_MAP.set (BLOCK_ID_DIRT  , "BLOCK_ID_DIRT");
BLOCK_ID_STR_MAP.set (BLOCK_ID_STONE , "BLOCK_ID_STONE");
BLOCK_ID_STR_MAP.set (BLOCK_ID_WATER , "BLOCK_ID_WATER");
BLOCK_ID_STR_MAP.set (BLOCK_ID_SAND  , "BLOCK_ID_SAND");
BLOCK_ID_STR_MAP.set (BLOCK_ID_LOG   , "BLOCK_ID_LOG");
BLOCK_ID_STR_MAP.set (BLOCK_ID_LEAVES, "BLOCK_ID_LEAVES");
BLOCK_ID_STR_MAP.set (BLOCK_ID_GLASS , "BLOCK_ID_GLASS");
BLOCK_ID_STR_MAP.set (ITEM_ID_STONE_PICKAXE, "ITEM_ID_STONE_PICKAXE");
BLOCK_ID_STR_MAP.set (ITEM_ID_STONE_SHOVEL , "ITEM_ID_STONE_SHOVEL");
BLOCK_ID_STR_MAP.set (ITEM_ID_STONE_AXE    , "ITEM_ID_STONE_AXE");
BLOCK_ID_STR_MAP.set (ITEM_ID_STONE_HOE    , "ITEM_ID_STONE_HOE");
BLOCK_ID_STR_MAP.set (ITEM_ID_STONE_SWORD  , "ITEM_ID_STONE_SWORD");

const TEXTURE_TOP    = 0;
const TEXTURE_SIDE   = 1;
const TEXTURE_BOTTOM = 2;

const DRAW_STYLE_TEXTURED_PLANE   = 0; // individual texture images + plane
const DRAW_STYLE_WIREFRAME        = 1;
const DRAW_STYLE_FILL             = 2;
const DRAW_STYLE_FILL_WIREFRAME   = 3;
const DRAW_STYLE_TEXTURED         = 4; // texture atlas + vertex shape - super slow
const DRAW_STYLE_NONE             = 5; // texture atlas + vertex shape
const DRAW_STYLE_MAX              = 6;
let current_draw_style = 0;
const DRAW_STYLE_STR_MAP = new Map ();
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_TEXTURED_PLANE, "normal textured plane");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_WIREFRAME, "wireframe");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_FILL, "simple fill");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_FILL_WIREFRAME, "simple fill + wireframe");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_TEXTURED, "texture atlas + manual vertex planes (super slow)");
DRAW_STYLE_STR_MAP.set (DRAW_STYLE_NONE, "none");

// The size of each texture in the texture atlas
const TEXTURE_WIDTH = 16;

// to save space, we only store block_ids to describe the world
// and so other static block information like textures is stored once 
// per block type (instead of once per block instance)
// dynamic block information will need to be stored elsewhere
let map_block_id_to_block_static_data;

const TOOL_NONE    = 0;
const TOOL_PICKAXE = 1;
const TOOL_SHOVEL  = 2;
const TOOL_AXE     = 3;
const TOOL_HOE     = 4;
const TOOL_SWORD   = 5;

//========================================================================

// this represents 
class BlockStaticData
{
    constructor (block_id, texture_atlas_data, texture_img_data, fill_color, stack_max_size, is_transparent, mine_duration, preferred_tool, is_item, tool_efficiency_factor, tool_type, tool_durability_max)
    {
        this.block_id = block_id;
        this.texture_atlas_data = texture_atlas_data;
        this.texture_img_data = texture_img_data;
        this.fill_color = fill_color;
        this.stack_max_size = stack_max_size;
        // whether the texture has transparency or not
        // this is true for water or leaves
        this.is_transparent = is_transparent;
        this.mine_duration = mine_duration;
        // the type of tool that can break this block
        this.preferred_tool = preferred_tool;
        // **for now** ad hoc for items
        this.is_item = is_item;
        this.tool_efficiency_factor = tool_efficiency_factor;
        this.tool_type = tool_type;
        // the number of uses of a tool item before it breaks
        this.tool_durability_max = tool_durability_max;
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
        [100, 150, 255, 100],
        stack_max_size=64,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
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
        "lime",
        stack_max_size=64,
        is_transparent=false,
        mine_duration=2,
        preferred_tool=TOOL_SHOVEL,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
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
        "#964B00",
        stack_max_size=64,
        is_transparent=false,
        mine_duration=2,
        preferred_tool=TOOL_SHOVEL,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
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
        "gray",
        stack_max_size=64,
        is_transparent=false,
        mine_duration=5,
        preferred_tool=TOOL_PICKAXE,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
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
        [50, 100, 255, 150],
        stack_max_size=64,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
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
        "#C2B280",
        stack_max_size=64,
        is_transparent=false,
        mine_duration=2,
        preferred_tool=TOOL_SHOVEL,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_LOG, new BlockStaticData (
        BLOCK_ID_LOG, 
        [ // texture atlas positions
            [8, 0], // top
            [7, 0], // sides
            [8, 0]  // bottom
        ], 
        [ // individual texture images
            texture_log_top, // top
            texture_log_side, // sides
            texture_log_top  // bottom
        ], 
        "#694b37",
        stack_max_size=64,
        is_transparent=false,
        mine_duration=2,
        preferred_tool=TOOL_AXE,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_LEAVES, new BlockStaticData (
        BLOCK_ID_LEAVES, 
        [ // texture atlas positions
            [9, 0], // top
            [9, 0], // sides
            [9, 0]  // bottom
        ], 
        [ // individual texture images
            texture_leaves, // top
            texture_leaves, // sides
            texture_leaves  // bottom
        ], 
        "#88ff22",
        stack_max_size=64,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=TOOL_HOE,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
    );
    map_block_id_to_block_static_data.set (BLOCK_ID_GLASS, new BlockStaticData (
        BLOCK_ID_GLASS, 
        [ // texture atlas positions
            [0, 1], // top
            [0, 1], // sides
            [0, 1]  // bottom
        ], 
        [ // individual texture images
            texture_glass, // top
            texture_glass, // sides
            texture_glass  // bottom
        ], 
        [210, 230, 255, 60],
        stack_max_size=64,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=false,
        tool_efficiency_factor=0,
        tool_type=TOOL_NONE,
        tool_durability_max=null)
    );
    map_block_id_to_block_static_data.set (ITEM_ID_STONE_PICKAXE, new BlockStaticData (
        ITEM_ID_STONE_PICKAXE, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone_pickaxe, // top
            texture_stone_pickaxe, // sides
            texture_stone_pickaxe  // bottom
        ], 
        "gray",
        stack_max_size=1,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=true,
        tool_efficiency_factor=3,
        tool_type=TOOL_PICKAXE,
        tool_durability_max=128)
    );
    map_block_id_to_block_static_data.set (ITEM_ID_STONE_SHOVEL, new BlockStaticData (
        ITEM_ID_STONE_SHOVEL, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone_shovel, // top
            texture_stone_shovel, // sides
            texture_stone_shovel  // bottom
        ], 
        "gray",
        stack_max_size=1,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=true,
        tool_efficiency_factor=3,
        tool_type=TOOL_SHOVEL,
        tool_durability_max=128)
    );
    map_block_id_to_block_static_data.set (ITEM_ID_STONE_AXE, new BlockStaticData (
        ITEM_ID_STONE_AXE, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone_axe, // top
            texture_stone_axe, // sides
            texture_stone_axe  // bottom
        ], 
        "gray",
        stack_max_size=1,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=true,
        tool_efficiency_factor=3,
        tool_type=TOOL_AXE,
        tool_durability_max=128)
    );
    map_block_id_to_block_static_data.set (ITEM_ID_STONE_HOE, new BlockStaticData (
        ITEM_ID_STONE_HOE, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone_hoe, // top
            texture_stone_hoe, // sides
            texture_stone_hoe  // bottom
        ], 
        "gray",
        stack_max_size=1,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=true,
        tool_efficiency_factor=10,
        tool_type=TOOL_HOE,
        tool_durability_max=128)
    );
    map_block_id_to_block_static_data.set (ITEM_ID_STONE_SWORD, new BlockStaticData (
        ITEM_ID_STONE_SWORD, 
        [ // texture atlas positions
            [0, 0], // top
            [0, 0], // sides
            [0, 0]  // bottom
        ], 
        [ // individual texture images
            texture_stone_sword, // top
            texture_stone_sword, // sides
            texture_stone_sword  // bottom
        ], 
        "gray",
        stack_max_size=1,
        is_transparent=true,
        mine_duration=2,
        preferred_tool=null,
        is_item=true,
        tool_efficiency_factor=3,
        tool_type=TOOL_SWORD,
        tool_durability_max=128)
    );

}

//========================================================================

// draws a box face by face and omits faces that cannot be seen
function draw_block (x, y, z, chunk, block_type)
{
    let this_block_type = block_type;
    // ignore if it is an airblock
    if (this_block_type == BLOCK_ID_AIR)
        return;

    let world_x = (chunk.xi * CHUNK_SIZE * BLOCK_WIDTH) + x * BLOCK_WIDTH;
    let world_y = -((chunk.yi * CHUNK_SIZE * BLOCK_WIDTH) + y * BLOCK_WIDTH); // y axis is reversed
    let world_z = (chunk.zi * CHUNK_SIZE * BLOCK_WIDTH) + z * BLOCK_WIDTH;
    let position_world = createVector (world_x, world_y, world_z);
    let block_xi = chunk.xi * CHUNK_SIZE + x;
    let block_yi = chunk.yi * CHUNK_SIZE + y;
    let block_zi = chunk.zi * CHUNK_SIZE + z;

    // dont draw if block is behind the camera
    // (i.e. it wont be seen by the camera so no need to waste calcuations)
    // we know a block is behind the camera if the camera is pointing
    // at least 90 degrees away from the block (or FOV)
    if (player.is_outside_camera_view (position_world))
    {
        ++g_num_out_of_view_culled_blocks;
        // all 6 faces are not drawn
        // this ignores whether blocks would be culled by other means
        g_num_culled_faces_out_of_view += 6;
        return;
    }

    // move to block's center position
    // we will need to undo this later
    graphics.translate (x*BLOCK_WIDTH, -y*BLOCK_WIDTH, z*BLOCK_WIDTH);

    // [for debug info] if we drew at least one face, then we drew the block
    // otherwise we culled it
    let was_block_drawn = false;

    // enable wireframe
    if (current_draw_style == DRAW_STYLE_WIREFRAME || current_draw_style == DRAW_STYLE_FILL_WIREFRAME)
    {
        graphics.stroke (0);
        // highlight blue if water
        if (this_block_type == BLOCK_ID_WATER)
            graphics.stroke (0, 0, 255);
        graphics.strokeWeight (1);
    }
    // no wireframe
    else
    {
        graphics.noStroke ();
    }

    // front face
    // only draw if the next block is transparent and the camera is not behind the plane
    let is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeZ >= world_z;
    let next_block = world.get_block_type (block_xi, block_yi, block_zi+1);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    let are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // planes are draw from the center
        // so shift right and up to make the origin at bottom left
        // (keep in mind that y axis is reversed so we need to negate)
        // and since this is the front face (and z axis increases towards the front)
        // we have to move the face forward
        graphics.translate (BLOCK_WIDTH/2, -BLOCK_WIDTH/2, BLOCK_WIDTH);
        // draw the face
        draw_face (this_block_type, TEXTURE_SIDE);
        // undo translate
        graphics.translate (-(BLOCK_WIDTH/2), -(-BLOCK_WIDTH/2), -(BLOCK_WIDTH));

        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }

    // back face
    // only draw if the next block is transparent and the camera is not behind the plane
    is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeZ <= world_z;
    next_block = world.get_block_type (block_xi, block_yi, block_zi-1);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // planes are draw from the center
        // so shift right and up to make the origin at bottom left
        // (keep in mind that y axis is reversed so we need to negate)
        graphics.translate (BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0);
        // rotate 180 deg so the normal is facing back
        // unsure if this is needed or correct
        graphics.rotateY (PI);
        // draw the face
        draw_face (this_block_type, TEXTURE_SIDE);
        // undo rotation
        graphics.rotateY (-PI);
        // undo translation
        graphics.translate (-(BLOCK_WIDTH/2), -(-BLOCK_WIDTH/2), -(0));
        
        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }

    // left face
    // only draw if the next block is transparent and the camera is not behind the plane
    is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeX <= world_x;
    next_block = world.get_block_type (block_xi-1, block_yi, block_zi);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // plane's are draw from the center
        // so we need to correct for that
        graphics.translate (0, -BLOCK_WIDTH/2, BLOCK_WIDTH/2);
        // and then rotate to be perpendicular to the front and back faces
        graphics.rotateY (PI/2);
        // draw the face
        draw_face (this_block_type, TEXTURE_SIDE);
        // undo rotation
        graphics.rotateY (-(PI/2));
        // undo translation
        graphics.translate (-(0), -(-BLOCK_WIDTH/2), -(BLOCK_WIDTH/2));
        
        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }

    // right face
    // only draw if the next block is transparent and the camera is not behind the plane
    is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeX >= world_x;
    next_block = world.get_block_type (block_xi+1, block_yi, block_zi);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // plane's are draw from the center
        // so we need to correct for that
        // also we need to move it to the right side of the block
        graphics.translate (BLOCK_WIDTH, -BLOCK_WIDTH/2, BLOCK_WIDTH/2);
        // and then rotate to be perpendicular to the front and back faces
        graphics.rotateY (-PI/2);
        // draw the face
        draw_face (this_block_type, TEXTURE_SIDE);
        // undo rotation
        graphics.rotateY (-(-PI/2));
        // undo translation
        graphics.translate (-(BLOCK_WIDTH), -(-BLOCK_WIDTH/2), -(BLOCK_WIDTH/2));
        
        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }

    // top face
    // only draw if the next block is transparent and the camera is not behind the plane
    is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeY <= world_y;
    next_block = world.get_block_type (block_xi, block_yi+1, block_zi);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // plane's are draw from the center
        // so we need to correct for that
        graphics.translate (BLOCK_WIDTH/2, -BLOCK_WIDTH, BLOCK_WIDTH/2);
        // and then rotate to be perpendicular to the front and back faces
        graphics.rotateX (-PI/2);
        // draw the face
        draw_face (this_block_type, TEXTURE_TOP);
        // undo rotation
        graphics.rotateX (-(-PI/2));
        // undo translation
        graphics.translate (-(BLOCK_WIDTH/2), -(-BLOCK_WIDTH), -(BLOCK_WIDTH/2));
        
        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }
    
    // bottom face
    // only draw if the next block is transparent and the camera is not behind the plane
    is_camera_infront_of_plane = true;
    if (BACK_FACE_CULLING) is_camera_infront_of_plane = player.camera.eyeY >= world_y;
    next_block = world.get_block_type (block_xi, block_yi-1, block_zi);
    is_next_block_transparent = next_block == null || map_block_id_to_block_static_data.get (next_block).is_transparent;
    are_both_blocks_water = this_block_type == BLOCK_ID_WATER && next_block == BLOCK_ID_WATER;
    if (is_camera_infront_of_plane && is_next_block_transparent && !are_both_blocks_water)
    {
        // move to plane's position
        // plane's are draw from the center
        // so we need to correct for that
        graphics.translate (BLOCK_WIDTH/2, 0, BLOCK_WIDTH/2);
        // and then rotate to be perpendicular to the front and back faces
        graphics.rotateX (PI/2);
        // draw the face
        draw_face (this_block_type, TEXTURE_BOTTOM);

        // undo rotation
        graphics.rotateX (-(PI/2));
        // undo translation
        graphics.translate (-(BLOCK_WIDTH/2), -(0), -(BLOCK_WIDTH/2));
        
        // we drew at least one face of the block so we drew the block
        was_block_drawn = true;
        ++g_num_drawn_faces;
    }
    // dont draw face
    else
    {
        // culled due to backface culling
        if (!is_camera_infront_of_plane)
            ++g_num_culled_faces_back_face;
        // culled due to being hidden
        else
            ++g_num_culled_faces_hidden;
    }

    // undo translation
    graphics.translate (-(x*BLOCK_WIDTH), -(-y*BLOCK_WIDTH), -(z*BLOCK_WIDTH));

    // [for debug info]
    // check if we drew the block
    if (was_block_drawn)
        // block was drawn so increment counter
        ++g_num_drawn_blocks;
    else
        // no face was drawn - probably hidden by other blocks
        ++g_num_hidden_culled_blocks;

}

//========================================================================

function draw_face (block_type, texture_face)
{
    switch (current_draw_style)
    {
        // draw textured face via texture atlas + manual vertex shape
        case DRAW_STYLE_TEXTURED:
            let texture_id_x = map_block_id_to_block_static_data.get (block_type).texture_atlas_data[texture_face][0];
            let texture_id_y = map_block_id_to_block_static_data.get (block_type).texture_atlas_data[texture_face][1];
            graphics.texture (texture_atlas);
            graphics.beginShape ();
            graphics.vertex (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top left
            graphics.vertex ( BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+0)*TEXTURE_WIDTH); // top right
            graphics.vertex ( BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+1)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom right
            graphics.vertex (-BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, (texture_id_x+0)*TEXTURE_WIDTH, (texture_id_y+1)*TEXTURE_WIDTH); // bottom left
            graphics.endShape ();
            break;
        // or textured plane
        // textured plane seems to be faster than a textured custom vertex shape
        // this also means no texture atlas
        case DRAW_STYLE_TEXTURED_PLANE:
            graphics.texture (map_block_id_to_block_static_data.get (block_type).texture_img_data[texture_face]);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            // graphics.quad (-BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, BLOCK_WIDTH/2, -BLOCK_WIDTH/2, 0, BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0, -BLOCK_WIDTH/2,  BLOCK_WIDTH/2, 0);
            break;
        // or draw filled plane
        case DRAW_STYLE_FILL:
        case DRAW_STYLE_FILL_WIREFRAME:
            graphics.fill (map_block_id_to_block_static_data.get (block_type).fill_color);
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            break;
        // or draw wireframe plane
        case DRAW_STYLE_WIREFRAME:
            graphics.noFill ();
            graphics.plane (BLOCK_WIDTH, BLOCK_WIDTH);
            break;
        case DRAW_STYLE_NONE:
            // dont draw anything
            break;
    }
}