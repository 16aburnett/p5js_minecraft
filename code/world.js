// Minecraft in P5.js
// World: manages the blocks and chunks of the world
// and is the interface between blocks and other components
// Author: Amy Burnett
//========================================================================
// Globals

// this should be 256
const WORLD_HEIGHT = 32;
// this should be 65
const SEA_LEVEL = 16
// a chunk is a CHUNK_SIZE^3 subset of the full map
const CHUNK_SIZE = 16;

//========================================================================

class World
{
    constructor ()
    {
        // quick access map of the currently loaded chunks
        // this enables quick lookup using the chunk_xi, chunk_yi, and chunk_zi indices
        this.chunk_map = new Map ();

        // initialize the chunk map
        this.chunk_map.set ("0,0,0", new Chunk (0, 0, 0));
        this.chunk_map.set ("0,1,0", new Chunk (0, 1, 0));

        this.chunk_map.set ("0,0,1", new Chunk (0, 0, 1));
        this.chunk_map.set ("0,1,1", new Chunk (0, 1, 1));

        this.chunk_map.set ("1,0,0", new Chunk (1, 0, 0));
        this.chunk_map.set ("1,1,0", new Chunk (1, 1, 0));

        this.chunk_map.set ("1,0,1", new Chunk (1, 0, 1));
        this.chunk_map.set ("1,1,1", new Chunk (1, 1, 1));
    
        // this.chunk_map.set ("-1,0,0", new Chunk (-1, 0, 0));
        // this.chunk_map.set ("-1,1,0", new Chunk (-1, 1, 0));
        
        // this.chunk_map.set ("-1,0,1", new Chunk (-1, 0, 1));
        // this.chunk_map.set ("-1,1,1", new Chunk (-1, 1, 1));

        // this.chunk_map.set ("-1,0,-1", new Chunk (-1, 0, -1));
        // this.chunk_map.set ("-1,1,-1", new Chunk (-1, 1, -1));

        // this.chunk_map.set ("0,0,-1", new Chunk (0, 0, -1));
        // this.chunk_map.set ("0,1,-1", new Chunk (0, 1, -1));

        // this.chunk_map.set ("1,0,-1", new Chunk (1, 0, -1));
        // this.chunk_map.set ("1,1,-1", new Chunk (1, 1, -1));
    }
    
    // returns the block type at the given block indices.
    // returns null if indices are invalid or if the containing 
    // chunk is not loaded.
    get_block_type (block_xi, block_yi, block_zi)
    {
        // TODO: this might be able to accept coords if we
        // floor them to indices

        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.chunk_map.has (`${chunk_xi},${chunk_yi},${chunk_zi}`))
            return null;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);
        
        // return the block
        return this.chunk_map.get (`${chunk_xi},${chunk_yi},${chunk_zi}`).blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi];
    }

    // Axis-Aligned Bounding Box
    get_block_AABB (block_xi, block_yi, block_zi)
    {
        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.chunk_map.has (`${chunk_xi},${chunk_yi},${chunk_zi}`))
            return null;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [world_x, world_y, world_z] = convert_block_index_to_world_coords (block_xi, block_yi, block_zi);
        
        return [
            world_x,
            world_x + BLOCK_WIDTH,
            world_y,
            world_y - BLOCK_WIDTH,
            world_z,
            world_z + BLOCK_WIDTH
        ];

    }

    set_block_at (block_id, block_xi, block_yi, block_zi)
    {
        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.chunk_map.has (`${chunk_xi},${chunk_yi},${chunk_zi}`))
            // dont place anything since the chunk isnt loaded
            return;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);

        // set block id
        this.chunk_map.get (`${chunk_xi},${chunk_yi},${chunk_zi}`).blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi] = block_id;
    }

    delete_block_at (block_xi, block_yi, block_zi)
    {
        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.chunk_map.has (`${chunk_xi},${chunk_yi},${chunk_zi}`))
            return null;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);

        // remove block (aka set to air)
        this.chunk_map.get (`${chunk_xi},${chunk_yi},${chunk_zi}`).blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi] = BLOCK_ID_AIR;
    }

    update ()
    {
        
    }

    draw_solid_blocks ()
    {
        // draw chunks
        // we need to split up the solid blocks and transparent blocks
        // because of weird draw order issues
        // these issues are resolved by first drawing all the solid blocks
        // and then drawing all the transparent blocks so that solid blocks
        // can be seen through the transparent blocks.
        // draw solid blocks of each chunk
        for (let chunk of this.chunk_map.values ())
            chunk.draw_solid_blocks ();
    }

    draw_transparent_blocks ()
    {
        // draw transparent blocks of each chunk
        for (let chunk of this.chunk_map.values ())
            chunk.draw_transparent_blocks ();
    }
}

//========================================================================
// helper functions

// converts the given world coordinates to the containing block index
// does not ensure indices are valid
function convert_world_to_block_index (world_x, world_y, world_z)
{
    let block_xi = Math.floor ( world_x / BLOCK_WIDTH);
    let block_yi = Math.floor (-world_y / BLOCK_WIDTH);
    let block_zi = Math.floor ( world_z / BLOCK_WIDTH);
    return [block_xi, block_yi, block_zi];
}

//========================================================================

// converts the given world coordinates to block coordinates
function convert_world_to_block_coords (world_x, world_y, world_z)
{
    let block_x =  world_x / BLOCK_WIDTH;
    let block_y = -world_y / BLOCK_WIDTH;
    let block_z =  world_z / BLOCK_WIDTH;
    return [block_x, block_y, block_z];
}

//========================================================================

// converts the given world coordinates to the containing block index
// relative to the containing chunk
// chunk indices go from 0 to CHUNK_SIZE
function convert_world_to_chunk_block_index (world_x, world_y, world_z)
{
    let [block_xi, block_yi, block_zi] = convert_world_to_block_index (world_x, world_y, world_z);
    return convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);
}

//========================================================================

// converts the given world coordinates to the containing chunk index
function convert_world_to_chunk_index (world_x, world_y, world_z)
{
    let chunk_xi = Math.floor ( world_x / (CHUNK_SIZE * BLOCK_WIDTH));
    let chunk_yi = Math.floor (-world_y / (CHUNK_SIZE * BLOCK_WIDTH));
    let chunk_zi = Math.floor ( world_z / (CHUNK_SIZE * BLOCK_WIDTH));
    return [chunk_xi, chunk_yi, chunk_zi];
}

//========================================================================

// converts the given world coordinates to the containing block index
// relative to the containing chunk
// chunk indices go from 0 to CHUNK_SIZE
function convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi)
{
    let chunk_block_xi = block_xi < 0 ? (block_xi + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : block_xi % CHUNK_SIZE;
    let chunk_block_yi = block_yi < 0 ? (block_yi + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : block_yi % CHUNK_SIZE;
    let chunk_block_zi = block_zi < 0 ? (block_zi + 1) % CHUNK_SIZE + (CHUNK_SIZE - 1) : block_zi % CHUNK_SIZE;
    return [chunk_block_xi, chunk_block_yi, chunk_block_zi];
}

//========================================================================

function convert_block_index_to_world_coords (block_xi, block_yi, block_zi)
{
    let world_x =  block_xi * BLOCK_WIDTH;
    let world_y = -block_yi * BLOCK_WIDTH;
    let world_z =  block_zi * BLOCK_WIDTH;
    return [world_x, world_y, world_z];
}
