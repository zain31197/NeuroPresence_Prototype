Optional: drop your own short source-clip videos here.

The three seed clips in this prototype are drawn procedurally
(src/components/ClipCanvas.tsx) rather than shipped as files, so the repo stays
small and nothing in the build can be mistaken for model output.

To use a real video as a seed clip, put it in this folder and add a `src` field
pointing at it to the matching entry in src/mock/seedData.ts, e.g.

  src: './clips/office-navy-blazer.mp4'

You can also add clips at runtime from the Source Clips screen; those stay in
the browser tab and are never uploaded anywhere.
