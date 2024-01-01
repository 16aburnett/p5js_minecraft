


culling faces that are facing away from camera
- for one 16x16x50 chunk
    - improved 15 fps to 30 fps


cull faces that arent in camera view
- i get 30 fps when staring away from a 16x16x50 chunk, aka only 30 fps for no geometry in view

cull faces that are obstructed by geometry
- havent seen this yet, but caves come to mind


- had to put touchpad sensitivity to "most sensitive" to get rid of the keypress delay


- [] skybox that follows camera
- [] player physics
    - gravity - fall until hit ground
    - terrain collisions
- [] block breaking/placing
    - determine what block the camera is looking at
- [] inventory system
- [] better HUD/debug info
    - crosshair in center of screen
    - player position
    - 3 axis gyro thing
    - HUD should not ever go behind geometry



***always translate, then rotate, then scale
https://p5js.org/learn/getting-started-in-webgl-coords-and-transform.html

this is good material
- https://www.pearson.com/content/dam/one-dot-com/one-dot-com/us/en/files/Proceedings-ICTCM2019-PaulBouthellier.pdf


# Possible optimizations
- build geometry once and draw model each frame
    - i tested and this has promise - steady 60 fps with 16x16x16 chunk
    - but I am not sure how to texture it since the model ends up being one big geometry
        and texture() during building the geom seems to have no effect
- dont draw chunks that are completely hidden
- dont draw chunks that are completely air
- dont draw chunks that are behind the camera
- draw only 1 chunk per frame
    - for loading chunks
    - idk about this, just an idea


- push/pop = yikes
    - commented out the block drawing code so that we only do translate/rotate and push/pop
        and the performance was still crap...
    - GPU is not fully loaded
    - tried reducing draw_block to just push+translate+pop and
        performance was still the same
    - i commented out push+pop so we only translate for each block
        and now we get steady 60 fps.....
    - push and pop seem to be the bottleneck??
    - couldn't we just translate one way and translate back when we are done?
    - looking at the p5 documentation, it looks like push+pop do a lot
"In WEBGL mode additional style settings are stored. These are controlled by the following functions: setCamera(), ambientLight(), directionalLight(), pointLight(), texture(), specularMaterial(), shininess(), normalMaterial() and shader()."

    - 4 chunks: push+pop around draw_block
        - 10 fps
    - 4 chunks: no push+pop around draw_block + reverse translate
        - 20 fps
        - still more push+pop to cull
        - looks the exact same
    - 4 chunks: removed all push+pop in draw_block
        - 30 fps
        - looks exactly the same
        - awesome! but 60 fps would be better...
        - 30% cpu load
        - 20% gpu load
        - not HW constrained, just too much geom?
        - flew into the middle of the chunks and get 60fps 
            due to backface culling - aka the geometry is the bottleneck (not the code)




# Collision detection
take the previous frame's position
calculate the new frame's position -> we're in the update loop for this new position
determine if the new position collided with a block
if collided, reset the position to right before the collided block 
    but retain movement in other directions
if not, move freely

- collisions can be detected in the 3 directions separately