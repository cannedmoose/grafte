- rasterization is per layer

Concepts:

- Document
  What the user is drawing on, has layers containing drawing items and width/height

- Viewport
  The part of the document the user sees, width/height/zoom level

- Selection
  Items in the document that are currently selected, certain operations will happen on them
  (works as a double link between 2 objects)

- Scratch
  Items drawn to the screen though not part of the document (excluding selection...)

- App
  Made up of all the above. Operations include:
  Add/edit/remove items in document
  Edit viewport
  Select/deselect objects
  Draw to scratch
