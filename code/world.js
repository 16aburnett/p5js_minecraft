// Minecraft in P5.js
// World: manages the blocks and chunks of the world
// and is the interface between blocks and other components
// Author: Amy Burnett
//========================================================================
// Globals

// a chunk is a CHUNK_SIZE^3 subset of the full map
const CHUNK_SIZE = 16;
// this should be 65
const SEA_LEVEL = 64;
// this should be 256
const WORLD_HEIGHT = 128;
const CHUNK_STACK_COUNT = WORLD_HEIGHT / CHUNK_SIZE;

const CHUNK_RENDER_RADIUS = 6;

let should_chunks_follow_player = true;

//========================================================================

class World
{
    constructor ()
    {
        // quick access map of the currently loaded chunk stacks.
        // this enables quick lookup using the chunk_xi, and chunk_zi indices
        // and the chunk stack can be queried with chunk_yi to get the chunk
        this.loaded_chunks_map = new Map ();
        // keep track of modified chunk stacks that are outside the render distance
        // if a chunk is needed again, we can fetch the data here,
        // otherwise, we'll need to generate the terrain
        // Note: idealy, we should save this to a file to save RAM,
        // but unfortunately, we cannot save to files via javascript without
        // the user needing to approve a prompt for downloading the file.
        this.unloaded_chunks_map = new Map ();
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

        // ensure chunk stack is loaded
        if (!this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`))
            return null;

        // ensure value y chunk
        if (!(0 <= chunk_yi && chunk_yi < CHUNK_STACK_COUNT))
        {
            return null;
        }

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);
        
        // return the block
        return this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi].blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi];
    }

    // Axis-Aligned Bounding Box
    get_block_AABB (block_xi, block_yi, block_zi)
    {
        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`))
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
        if (!this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`))
            // dont place anything since the chunk isnt loaded
            return;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);

        // set block id
        this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi].blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi] = block_id;

        // We now need to update the chunk's geometry so it reflects the new block
        this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi].reload_chunk ();
    }

    delete_block_at (block_xi, block_yi, block_zi)
    {
        let chunk_xi = Math.floor (block_xi / CHUNK_SIZE);
        let chunk_yi = Math.floor (block_yi / CHUNK_SIZE);
        let chunk_zi = Math.floor (block_zi / CHUNK_SIZE);

        // ensure chunk is loaded
        if (!this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`))
            return null;

        // convert block idx to chunk block idx
        // ignoring chunk_block_yi bc chunks occupy full world height atm
        let [chunk_block_xi, chunk_block_yi, chunk_block_zi] = convert_block_index_to_chunk_block_index (block_xi, block_yi, block_zi);

        // remove block (aka set to air)
        this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi].blocks[chunk_block_xi][chunk_block_yi][chunk_block_zi] = BLOCK_ID_AIR;

        // We now need to update the chunk's geometry so it reflects the new block
        this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi].reload_chunk ();

        // Edge case: if block was on the edge of a chunk
        // then the next chunk will have a hole in its geometry
        // so update neighbor chunks if needed.
        // front
        if (chunk_block_zi == CHUNK_SIZE-1)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi+1}`) && chunk_yi < this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi+1}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi+1}`).chunks[chunk_yi].reload_chunk ();
            }
        }
        // back
        if (chunk_block_zi == 0)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi-1}`) && chunk_yi < this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi-1}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi-1}`).chunks[chunk_yi].reload_chunk ();
            }
        }
        // left
        if (chunk_block_xi == 0)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi-1},${chunk_zi}`) && chunk_yi < this.loaded_chunks_map.get (`${chunk_xi-1},${chunk_zi}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi-1},${chunk_zi}`).chunks[chunk_yi].reload_chunk ();
            }
        }
        // right
        if (chunk_block_xi == CHUNK_SIZE-1)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi+1},${chunk_zi}`) && chunk_yi < this.loaded_chunks_map.get (`${chunk_xi+1},${chunk_zi}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi+1},${chunk_zi}`).chunks[chunk_yi].reload_chunk ();
            }
        }
        // top
        if (chunk_block_yi == CHUNK_SIZE-1)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`) && chunk_yi+1 < this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi+1].reload_chunk ();
            }
        }
        // bottom
        if (chunk_block_yi == 0)
        {
            // ensure there is a loaded chunk in this dir
            if (this.loaded_chunks_map.has (`${chunk_xi},${chunk_zi}`) && 0 <= chunk_yi-1 && chunk_yi-1 < this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks.length)
            {
                // reload chunk to avoid holes
                this.loaded_chunks_map.get (`${chunk_xi},${chunk_zi}`).chunks[chunk_yi-1].reload_chunk ();
            }
        }
        
    }

    reload_chunks ()
    {
        for (let chunk_stack of this.loaded_chunks_map.values ())
            chunk_stack.reload_chunks ();
    }

    update ()
    {
        // dont update chunk loading if it is disabled
        if (should_chunks_follow_player == false)
            return;

        // find player's position and render chunks around player
        // generating new terrain as necessary
        // and removing out-of-range chunks
        let [player_pos_chunk_xi, player_pos_chunk_yi, player_pos_chunk_zi] = convert_world_to_chunk_index (player.position.x, player.position.y, player.position.z);

        // TEMP: unload all chunks
        for (let [key, value] of this.loaded_chunks_map.entries ())
        {
            this.unloaded_chunks_map.set (key, value);
            this.loaded_chunks_map.delete (key);
        }

        // non-instanced chunk drawing is way too slow for
        // multiple chunks to have a playable FPS
        // so ensure other draw styles only render 1 chunk
        let chunk_render_radius = CHUNK_RENDER_RADIUS;
        if (current_draw_style != DRAW_STYLE_INSTANCED)
            chunk_render_radius = 1;

        // draw chunks in rings around the center chunk
        for (let ring_offset = 0; ring_offset < chunk_render_radius; ++ring_offset)
        {
            // try to load NxN of chunks around player
            for (let ci = -ring_offset; ci <= ring_offset; ++ci)
            {
                for (let cj = -ring_offset; cj <= ring_offset; ++cj)
                {
                    // ignore chunks that arent in the ring
                    if (!(ci == -ring_offset || ci == ring_offset || cj == -ring_offset || cj == ring_offset))
                        continue;
                    // check if current chunk is loaded
                    if (this.loaded_chunks_map.has (`${player_pos_chunk_xi+ci},${player_pos_chunk_zi+cj}`))
                        // already loaded, nothing to do
                        null;
                    else
                    {
                        // not loaded, check if we previously loaded this chunk and it is unloaded
                        if (this.unloaded_chunks_map.has (`${player_pos_chunk_xi+ci},${player_pos_chunk_zi+cj}`))
                        {
                            // chunk was unloaded, reload it
                            let key = `${player_pos_chunk_xi+ci},${player_pos_chunk_zi+cj}`;
                            let chunk_stack = this.unloaded_chunks_map.get (key);
                            this.loaded_chunks_map.set (key, chunk_stack);
                            this.unloaded_chunks_map.delete (key);
                        }
                        // not loaded and not unloaded, unvisited chunk stack, generate new terrain
                        else
                        {
                            let new_chunk = new ChunkStack (player_pos_chunk_xi+ci, player_pos_chunk_zi+cj);
                            this.loaded_chunks_map.set (`${player_pos_chunk_xi+ci},${player_pos_chunk_zi+cj}`, new_chunk);
                            // **if saved to a file, we should load the chunk data here
                            generate_random_trees (new_chunk);
                        }
                    }
                }
            }
        }
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
        for (let chunk of this.loaded_chunks_map.values ())
            chunk.draw_solid_blocks ();
    }

    draw_transparent_blocks ()
    {
        // draw transparent blocks of each chunk
        for (let chunk of this.loaded_chunks_map.values ())
            chunk.draw_transparent_blocks ();
    }
}

//========================================================================

// generates random trees for the given chunk
function generate_random_trees (chunk_stack)
{
    // generate trees
    let num_trees = Math.floor (random (0, 10));
    for (let t = 0; t < num_trees; ++t)
    {
        // find a random x, z position to place the tree
        let chunk_block_xi = Math.floor (random (0, CHUNK_SIZE));
        let chunk_block_zi = Math.floor (random (0, CHUNK_SIZE));
        let block_xi = chunk_stack.chunks[0].xi * CHUNK_SIZE + chunk_block_xi;
        let block_zi = chunk_stack.chunks[0].zi * CHUNK_SIZE + chunk_block_zi;

        // find surface level
        let block_yi = 0;
        for ( ; block_yi < WORLD_HEIGHT; ++block_yi)
        {
            let block_id = world.get_block_type (block_xi, block_yi, block_zi);
            if (block_id == BLOCK_ID_GRASS)
            {
                // assume that grass block means surface
                break;
            }
        }

        // ensure that we found a grass block
        if (block_yi >= WORLD_HEIGHT)
            // ignore this tree
            break;

        // ensure tree can be placed there
        // **skip for now

        // place tree
        world.set_block_at (BLOCK_ID_LOG, block_xi, block_yi+1, block_zi);
        world.set_block_at (BLOCK_ID_LOG, block_xi, block_yi+2, block_zi);
        world.set_block_at (BLOCK_ID_LOG, block_xi, block_yi+3, block_zi);
        world.set_block_at (BLOCK_ID_LOG, block_xi, block_yi+4, block_zi);
        world.set_block_at (BLOCK_ID_LOG, block_xi, block_yi+5, block_zi);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+6, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+6, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+6, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+6, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+6, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+5, block_zi-1); // top
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+5, block_zi-1); // top right
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+5, block_zi  ); // right
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+5, block_zi+1); // bottom
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+5, block_zi+1); // bottom left
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+5, block_zi  ); // left


        // world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+4, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+4, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+4, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+4, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+4, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+4, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+4, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+4, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+4, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+4, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+4, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+4, block_zi-1);
        // world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+4, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+4, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+4, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+4, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+4, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+4, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+4, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+4, block_zi+2);

        // world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+4, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+4, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+4, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+4, block_zi+1);
        // world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+4, block_zi+2);


        // world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+3, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+3, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+3, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+3, block_zi+1);
        // world.set_block_at (BLOCK_ID_LEAVES, block_xi-2, block_yi+3, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+3, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+3, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+3, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+3, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi-1, block_yi+3, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+3, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+3, block_zi-1);
        // world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+3, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+3, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi  , block_yi+3, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+3, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+3, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+3, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+3, block_zi+1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+1, block_yi+3, block_zi+2);

        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+3, block_zi-2);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+3, block_zi-1);
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+3, block_zi  );
        world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+3, block_zi+1);
        // world.set_block_at (BLOCK_ID_LEAVES, block_xi+2, block_yi+3, block_zi+2);

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
