// Minecraft in P5.js
// Chunks are a subdivision of the world
// Author: Amy Burnett
//========================================================================
// Globals

// 3D array that stores block ids for this chunk
// x, y, z
let blocks = [];

//========================================================================

class Chunk
{
    constructor ()
    {

    }
    
}


//========================================================================

function draw_chunk ()
{
    // 1. first, draw non-transparent blocks
    // loop over x direction drawing blocks left to right
    for (let i = 0; i < CHUNK_SIZE; ++i)
    {
        // loop over y direction drawing blocks bottom to top
        for (let j = 0; j < WORLD_HEIGHT; ++j)
        {
            // loop over z direction drawing blocks back to forward
            for (let k = 0; k < CHUNK_SIZE; ++k)
            {
                // ignore if transparent block
                // we will do another pass for transparent blocks
                let is_transparent_block = blocks[i][j][k] == BLOCK_ID_WATER;
                if (!is_transparent_block)
                    draw_block (i,j,k);
            }
        }
    }
    // 2. next, draw transparent blocks
    // loop over x direction drawing blocks left to right
    for (let i = 0; i < CHUNK_SIZE; ++i)
    {
        // loop over y direction drawing blocks bottom to top
        for (let j = 0; j < WORLD_HEIGHT; ++j)
        {
            // loop over z direction drawing blocks back to forward
            for (let k = 0; k < CHUNK_SIZE; ++k)
            {
                // ignore non-transparent blocks
                let is_transparent_block = blocks[i][j][k] == BLOCK_ID_WATER;
                if (is_transparent_block)
                    draw_block (i,j,k);
            }
        }
    }
    
}