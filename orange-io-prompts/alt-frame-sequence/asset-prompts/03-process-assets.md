# Asset 3: Turn the video and images into site assets

Run these in the orange.io repo root once you have the generated video and images. Install `ffmpeg` first (`sudo apt install ffmpeg` or `brew install ffmpeg`).

## Frame sequences

```bash
mkdir -p public/frames/desktop public/frames/mobile

# desktop: 20 frames per second, 1600px wide, WebP
ffmpeg -i orchard.mp4 -vf "fps=20,scale=1600:-2" -c:v libwebp -quality 70 \
  public/frames/desktop/%04d.webp

# mobile: 9:16 version, 800px wide
ffmpeg -i orchard-9x16.mp4 -vf "fps=20,scale=800:-2" -c:v libwebp -quality 65 \
  public/frames/mobile/%04d.webp
```

Count the frames afterwards and put the number into `frames.count` in the hero config:

```bash
ls public/frames/desktop | wc -l
```

Keep the desktop and mobile sets at the same frame count so one progress value maps to the same moment in both.

## Whole-orange cutout

```bash
# grab the last frame of the video
ffmpeg -sseof -0.1 -i orchard.mp4 -frames:v 1 last.png

# remove the background
pip install rembg --break-system-packages
rembg i last.png orange-whole-full.png
```

Crop `orange-whole-full.png` tightly around the orange and save it as `public/img/orange-whole.png`. Then set `orangePosition` in the hero config so the cutout sits exactly over the orange in the last frame (center as a percentage of the viewport, and width as a percentage of the viewport width).

## Halves

```bash
rembg i halved-orange.png halves-cut.png
```

Split `halves-cut.png` into the left and right halves, crop each tightly with the same height, and save them as `public/img/orange-half-left.png` and `public/img/orange-half-right.png`.

## Finally

In the hero config, set `useGeneratedPlaceholders` to `false` and update `frames.count`. Then scroll through the page and tune `orangePosition` and the timeline values until the handoff from video to cutout is invisible.

## File size targets

- Desktop frames: aim for about 60 to 120 KB each.
- Mobile frames: aim for about 25 to 60 KB each.
- If the total is too heavy, lower `fps` to 15 or reduce the `-quality` value.
