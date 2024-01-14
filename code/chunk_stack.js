// Minecraft in P5.js
// Chunks stacks consist of all chunks at the same X,Z
// (i.e. chunks stacked vertically represents one chunkstack)
// Author: Amy Burnett
//========================================================================
// Globals

//========================================================================

class ChunkStack
{
    constructor (xi, zi)
    {
        this.chunks = [];
        
        // initialize subchunks
        for (let s = 0; s < CHUNK_STACK_COUNT; ++s)
        {
            this.chunks.push (new Chunk (xi, s, zi));
        }
    }

    draw_solid_blocks ()
    {
        for (let s = 0; s< CHUNK_STACK_COUNT; ++s)
            this.chunks[s].draw_solid_blocks ();
    }
    
    draw_transparent_blocks ()
    {
        for (let s = 0; s< CHUNK_STACK_COUNT; ++s)
            this.chunks[s].draw_transparent_blocks ();
    }
}