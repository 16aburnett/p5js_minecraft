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

    reload_chunks ()
    {
        for (let s = 0; s < CHUNK_STACK_COUNT; ++s)
        {
            this.chunks[s].reload_chunk ();
        }
    }

    draw_solid_blocks ()
    {
        // draw in reverse order so the top of the world is rendered first
        for (let s = CHUNK_STACK_COUNT-1; s >= 0; --s)
            this.chunks[s].draw_solid_blocks ();
    }
    
    draw_transparent_blocks ()
    {
        // draw in reverse order so the top of the world is rendered first
        for (let s = CHUNK_STACK_COUNT-1; s >= 0; --s)
            this.chunks[s].draw_transparent_blocks ();
    }
}