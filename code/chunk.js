// Minecraft in P5.js
// Chunks are a subdivision of the world
// Author: Amy Burnett
//========================================================================
// Globals

//========================================================================

class Chunk
{
    constructor (xi, yi, zi)
    {
        // position of this chunk
        // these are block index positions, not world positions
        this.xi = xi;
        this.yi = yi;
        this.zi = zi;
        // these represent the world location for this chunk
        this.x =  this.xi * CHUNK_SIZE * BLOCK_WIDTH;
        this.y = -this.yi * CHUNK_SIZE * BLOCK_WIDTH;
        this.z =  this.zi * CHUNK_SIZE * BLOCK_WIDTH;
        // 3D array that stores block ids for this chunk
        // x, y, z
        this.blocks = [];

        // keeps track of if this chunk is loaded
        // we will draw this chunk only if it is loaded
        this.is_loaded = true;
        
        // initialize chunk to air for now
        // [ x ][ y ][ z ]
        // [col][row][dep]
        for (let x = 0; x < CHUNK_SIZE; ++x)
        {
            // add new col/x-value
            this.blocks.push ([]);
            for (let y = 0; y < CHUNK_SIZE; ++y)
            {
                // add new row/y-value
                this.blocks[x].push ([]);
                for (let z = 0; z < CHUNK_SIZE; ++z)
                {
                    // set new depth/z-value to air (ie no block)
                    this.blocks[x][y].push (BLOCK_ID_AIR);
                }
                // add position for keeping track of non-zero z blocks
                // in for this x,y position
                // 0 initially but we will update it
                this.blocks[x][y].push (0);
            }
        }

        // if we have data for this chunk saved already,
        // then load existing chunk data
        let has_saved_chunk_data = false;
        if (has_saved_chunk_data)
        {
            // load saved chunk data
            // TODO
        }
        else
        {
            // generate terrain via perlin noise
            generate_terrain_for_chunk (this);
        }

        // preprocess chunk
        // count non-zeros
        // for culling dimensions of air
        for (let x = 0; x < CHUNK_SIZE; ++x)
        {
            for (let y = 0; y < CHUNK_SIZE; ++y)
            {
                for (let z = 0; z < CHUNK_SIZE; ++z)
                {
                    if (this.blocks[x][y][z] != BLOCK_ID_AIR)
                        // not an air block so increment non-zero counter
                        ++this.blocks[x][y][CHUNK_SIZE];
                }
            }
        }

    }

    // draws all solid blocks (non-transparent) of this chunk 
    draw_solid_blocks ()
    {
        // ensure chunk is loaded and ready
        if (!this.is_loaded)
            return;

        // move to chunk's position
        graphics.translate (this.x, this.y, this.z);

        // draw outline of chunk
        if (is_in_debug_mode)
        {
            // boxes are draw from the center so we need to align to the chunk
            graphics.translate (CHUNK_SIZE * BLOCK_WIDTH / 2, -CHUNK_SIZE * BLOCK_WIDTH / 2, CHUNK_SIZE * BLOCK_WIDTH / 2);
            // highlight if camera is in this chunk
            if (this.x <= player.camera.eyeX && player.camera.eyeX <= this.x + CHUNK_SIZE * BLOCK_WIDTH &&
                this.y >= player.camera.eyeY && player.camera.eyeY >= this.y - CHUNK_SIZE * BLOCK_WIDTH &&
                this.z <= player.camera.eyeZ && player.camera.eyeZ <= this.z + CHUNK_SIZE * BLOCK_WIDTH)
            {
                graphics.stroke (255, 255, 0);
                graphics.strokeWeight (2);
            }
            else
            {
                graphics.stroke (255, 0, 255);
                graphics.strokeWeight (1);
            }
            graphics.noFill ();
            graphics.box (CHUNK_SIZE * BLOCK_WIDTH, CHUNK_SIZE * BLOCK_WIDTH, CHUNK_SIZE * BLOCK_WIDTH);

            // undo translate
            graphics.translate (-(CHUNK_SIZE * BLOCK_WIDTH / 2), -(-CHUNK_SIZE * BLOCK_WIDTH / 2), -(CHUNK_SIZE * BLOCK_WIDTH / 2));
        }

        // 1. first, draw non-transparent blocks
        // loop over x direction drawing blocks left to right
        for (let i = 0; i < CHUNK_SIZE; ++i)
        {
            // loop over y direction drawing blocks bottom to top
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
                // ensure z direction has blocks for this x,y
                // we dont have to waste time iterating over depth
                // if there isnt any blocks
                // if (this.blocks[i][j][CHUNK_SIZE] == 0)
                //     continue;
                // loop over z direction drawing blocks back to forward
                for (let k = 0; k < CHUNK_SIZE; ++k)
                {
                    // ignore if transparent block
                    // we will do another pass for transparent blocks
                    let block_type = this.blocks[i][j][k];
                    let is_transparent_block = map_block_id_to_block_static_data.get (block_type).is_transparent;
                    if (!is_transparent_block)
                        draw_block (i, j, k, this, block_type);
                }
            }
        }

        // undo translate to chunk's position
        graphics.translate (-this.x, -this.y, -this.z);
    }

    // draw all transparent blocks of this chunk
    draw_transparent_blocks ()
    {
        // ensure chunk is loaded and ready
        if (!this.is_loaded)
            return;

        // move to chunk's position
        graphics.translate (this.x, this.y, this.z);

        // 2. next, draw transparent blocks
        // loop over x direction drawing blocks left to right
        for (let i = 0; i < CHUNK_SIZE; ++i)
        {
            // loop over y direction drawing blocks bottom to top
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
                // ensure z direction has blocks for this x,y
                // we dont have to waste time iterating over depth
                // if there isnt any blocks
                // if (this.blocks[i][j][CHUNK_SIZE] == 0)
                //     continue;
                // loop over z direction drawing blocks back to forward
                for (let k = 0; k < CHUNK_SIZE; ++k)
                {
                    // ignore non-transparent blocks
                    let block_type = this.blocks[i][j][k];
                    let is_transparent_block = map_block_id_to_block_static_data.get (block_type).is_transparent;
                    if (is_transparent_block)
                        draw_block (i, j, k, this, block_type);
                }
            }
        }

        // undo translate to chunk's position
        graphics.translate (-this.x, -this.y, -this.z);
    }
}

//========================================================================

function generate_terrain_for_chunk (chunk)
{
    for (let x = 0; x < CHUNK_SIZE; ++x)
    {
        for (let z = 0; z < CHUNK_SIZE; ++z)
        {
            // use noise to determine where to place the surface
            // scale changes frequency of change
            let noise_scale = 0.05;
            let noise_range_low = 0;
            let noise_range_high = 1;
            let noise_offset = 0.5;
            let noise_range = noise_range_high - noise_range_low;
            let noise_value = noise (noise_offset + noise_scale * (x + chunk.xi * CHUNK_SIZE), noise_offset + noise_scale * (z + chunk.zi * CHUNK_SIZE));
            let sea_level = Math.round (WORLD_HEIGHT/2);
            // play with these offsets to change between more hill-y or ocean-y
            let surface_height_range_low = sea_level - 10;
            let surface_height_range_high = sea_level + 10;
            let surface_height_range = surface_height_range_high - surface_height_range_low;
            let block_y_surface_height = Math.floor ((((noise_value - noise_range_low) * surface_height_range) / noise_range) + surface_height_range_low);
            let block_y_min = CHUNK_SIZE * chunk.yi;
            let block_y_max = CHUNK_SIZE * (chunk.yi + 1);
            // place grass at height if above water
            if (block_y_surface_height >= sea_level)
            {
                // above sea level so make it grass
                // surface_height may be in a different vertical chunk
                // ensure it is in this chunk
                if (block_y_min <= block_y_surface_height && block_y_surface_height < block_y_max)
                    chunk.blocks[x][block_y_surface_height % CHUNK_SIZE][z] = BLOCK_ID_GRASS;
            }
            else
            {
                // underwater so make the surface sand
                // surface_height may be in a different vertical chunk
                // ensure it is in this chunk
                if (block_y_min <= block_y_surface_height && block_y_surface_height < block_y_max)
                    chunk.blocks[x][block_y_surface_height % CHUNK_SIZE][z] = BLOCK_ID_SAND;
            }
            // place dirt below
            let num_dirt = 3;
            for (let d = 1; d <= num_dirt; ++d)
            {
                // ensure in bounds
                if (block_y_surface_height-d < 0)
                    break;
                // place dirt
                // surface_height may be in a different vertical chunk
                // ensure it is in this chunk
                if (block_y_min <= (block_y_surface_height-d) && (block_y_surface_height-d) < block_y_max)
                    chunk.blocks[x][(block_y_surface_height-d) % CHUNK_SIZE][z] = BLOCK_ID_DIRT;
            }
            // place stone below
            let block_y = block_y_surface_height-num_dirt-1;
            while (block_y >= 0)
            {
                // place stone
                // surface_height may be in a different vertical chunk
                // ensure it is in this chunk
                if (block_y_min <= block_y && block_y < block_y_max)
                    chunk.blocks[x][block_y % CHUNK_SIZE][z] = BLOCK_ID_STONE;
                // advance to next height
                --block_y;
            }
            // place water on top if below sea level
            block_y = block_y_surface_height+1;
            while (block_y <= sea_level)
            {
                // place water
                // surface_height may be in a different vertical chunk
                // ensure it is in this chunk
                if (block_y_min <= block_y && block_y < block_y_max)
                    chunk.blocks[x][block_y % CHUNK_SIZE][z] = BLOCK_ID_WATER;
                ++block_y;
            }
        }
    }
}

//========================================================================
