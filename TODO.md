


culling faces that are facing away from camera
- for one 16x16x50 chunk
    - improved 15 fps to 30 fps


cull faces that arent in camera view
- i get 30 fps when staring away from a 16x16x50 chunk, aka only 30 fps for no geometry in view

cull faces that are obstructed by geometry
- havent seen this yet, but caves come to mind




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
