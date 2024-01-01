// Minecraft in P5.js
// Chunks are a subdivision of the world
// Author: Amy Burnett
//========================================================================
// Globals

let is_chunk_debug_border_shown = true;

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

    }

    // draws all solid blocks (non-transparent) of this chunk 
    draw_solid_blocks ()
    {
        graphics.push ();
        // move to chunk's position
        graphics.translate (this.x, this.y, this.z);

        // draw outline of chunk
        if (is_chunk_debug_border_shown)
        {
            graphics.push ();
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
            graphics.pop ();
        }

        // 1. first, draw non-transparent blocks
        // loop over x direction drawing blocks left to right
        for (let i = 0; i < CHUNK_SIZE; ++i)
        {
            // loop over y direction drawing blocks bottom to top
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
                // loop over z direction drawing blocks back to forward
                for (let k = 0; k < CHUNK_SIZE; ++k)
                {
                    // ignore if transparent block
                    // we will do another pass for transparent blocks
                    let is_transparent_block = this.blocks[i][j][k] == BLOCK_ID_WATER;
                    if (!is_transparent_block)
                        draw_block (i, j, k, this);
                }
            }
        }

        graphics.pop ();
    }

    // draw all transparent blocks of this chunk
    draw_transparent_blocks ()
    {
        graphics.push ();
        // move to chunk's position
        graphics.translate (this.x, this.y, this.z);

        // 2. next, draw transparent blocks
        // loop over x direction drawing blocks left to right
        for (let i = 0; i < CHUNK_SIZE; ++i)
        {
            // loop over y direction drawing blocks bottom to top
            for (let j = 0; j < CHUNK_SIZE; ++j)
            {
                // loop over z direction drawing blocks back to forward
                for (let k = 0; k < CHUNK_SIZE; ++k)
                {
                    // ignore non-transparent blocks
                    let is_transparent_block = this.blocks[i][j][k] == BLOCK_ID_WATER;
                    if (is_transparent_block)
                        draw_block (i, j, k, this);
                }
            }
        }
        graphics.pop ();
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
            let noise_scale = 0.06;
            let noise_range_low = 0;
            let noise_range_high = 1;
            let noise_range = noise_range_high - noise_range_low;
            let noise_value = noise (noise_scale * (x + chunk.xi * CHUNK_SIZE), noise_scale * (z + chunk.zi * CHUNK_SIZE));
            let sea_level = Math.round (WORLD_HEIGHT/2);
            let surface_height_range_low = sea_level - 8;
            let surface_height_range_high = sea_level + 8;
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
