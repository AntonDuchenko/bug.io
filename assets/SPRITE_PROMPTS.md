# Sprite Generation Prompts for Bug.io

## Common style (add to every prompt):
`pixel art, top-down view, transparent background, 64x64 sprite, cute chibi style, thick outlines, bright colors, game asset, single character centered, no shadow`

---

## Player (64x64) -> player.png
pixel art, top-down view, transparent background, 64x64 sprite, cute chibi programmer character with hoodie and laptop glow, blue color theme, thick outlines, game asset, single character centered

## Enemies (64x64)

### Bug -> bug.png
pixel art, top-down view, transparent background, 64x64 sprite, cute orange beetle bug insect with antennae, small round body, thick outlines, game enemy asset, single character centered

### Infinite Loop -> infinite_loop.png
pixel art, top-down view, transparent background, 64x64 sprite, purple spinning ouroboros snake eating its own tail, glowing eyes, thick outlines, game enemy asset, single character centered

### Null Pointer -> null_pointer.png
pixel art, top-down view, transparent background, 64x64 sprite, red angry ghost cursor pointer with X eyes, small and fast looking, thick outlines, game enemy asset, single character centered

## Elites (64x64)

### Legacy Code -> legacy_code.png
pixel art, top-down view, transparent background, 64x64 sprite, old dusty green scroll with cobwebs and angry face, thick outlines, game elite enemy asset, single character centered

### Virus -> virus.png
pixel art, top-down view, transparent background, 64x64 sprite, red spiky virus cell with evil grin, biological threat look, thick outlines, game elite enemy asset, single character centered

### Deprecated Package -> deprecated_pkg.png
pixel art, top-down view, transparent background, 64x64 sprite, gray old cracked cardboard box with warning sign and sad face, thick outlines, game elite enemy asset, single character centered

## Bosses (128x128)

### Windows XP -> boss_xp.png
pixel art, top-down view, transparent background, 128x128 sprite, giant blue computer monitor boss with Windows XP logo face, menacing look, cracks on screen, thick outlines, game boss asset, single character centered

### Stack Overflow -> boss_so.png
pixel art, top-down view, transparent background, 128x128 sprite, giant orange book stack boss with Stack Overflow logo, books piled up forming a creature with glowing eyes, thick outlines, game boss asset, single character centered

### Blockchain -> boss_blockchain.png
pixel art, top-down view, transparent background, 128x128 sprite, giant purple crystal chain boss, connected chain links forming a hexagonal creature, glowing purple energy, thick outlines, game boss asset, single character centered

## Pickups (32x32)

### XP Gem -> xp_gem.png
pixel art, transparent background, 32x32 sprite, small green glowing diamond crystal gem, simple, thick outlines, game pickup item

### XP Gem High -> xp_gem_high.png
pixel art, transparent background, 32x32 sprite, small golden glowing star crystal gem, simple, thick outlines, game pickup item

### Loot Chest -> chest.png
pixel art, transparent background, 48x48 sprite, golden treasure chest with star emblem, slightly open with golden glow coming out, thick outlines, game pickup item

---

# Location Backgrounds & Tilesets

Each location needs a **tileable background** (256x256 or 512x512) that tiles seamlessly.
Format: PNG, can have NO transparency (full background).

## Common style for backgrounds:
`pixel art, top-down view, seamless tileable pattern, 256x256, dark moody atmosphere, game background tileset, no characters`

---

## 1. localhost (default) -> bg_localhost.png
pixel art, top-down view, seamless tileable pattern, 256x256, dark office desk surface with subtle grid lines, dark gray and navy blue, scattered tiny code symbols, IDE/terminal aesthetic, game background

## 2. Staging Environment -> bg_staging.png
pixel art, top-down view, seamless tileable pattern, 256x256, git branch diagram pattern on dark background, green and blue merge lines, pull request arrows, CI/CD pipeline aesthetic, game background

## 3. Legacy Codebase -> bg_legacy.png
pixel art, top-down view, seamless tileable pattern, 256x256, old yellowed paper with faded code, coffee stains, dusty cobweb corners, brownish green tones, ancient manuscript aesthetic, game background

## 4. Dark Mode -> bg_darkmode.png
pixel art, top-down view, seamless tileable pattern, 256x256, very dark almost black surface, tiny dim stars, subtle dark purple fog wisps, barely visible code text, extremely dark and mysterious, game background

## 5. Cloud Infrastructure -> bg_cloud.png
pixel art, top-down view, seamless tileable pattern, 256x256, server rack circuit board pattern, blue and cyan neon traces, cloud shapes, digital data flow lines on dark background, game background

## 6. Incident / Outage -> bg_incident.png
pixel art, top-down view, seamless tileable pattern, 256x256, red alert emergency floor, warning stripes, flashing alarm lights, cracked server tiles, danger zone aesthetic, dark red and orange tones, game background

## 7. Hackathon -> bg_hackathon.png
pixel art, top-down view, seamless tileable pattern, 256x256, messy hackathon table surface, energy drink cans, sticky notes, scattered cables, pizza boxes, colorful neon on dark background, game background

## 8. Infinite Loop -> bg_infinite_loop.png
pixel art, top-down view, seamless tileable pattern, 256x256, recursive fractal pattern, purple spirals and loops, Escher-style impossible geometry, hypnotic repeating pattern on dark background, game background

## 9. Production Server -> bg_production.png
pixel art, top-down view, seamless tileable pattern, 256x256, hot server room floor with heat vents, orange warning lights, metal grate tiles, temperature gauges, industrial fire hazard aesthetic on dark background, game background

---

# Location Props (optional, 64x64, transparent)

Small decorative objects scattered on the map for visual variety.

## localhost props -> props_localhost.png (spritesheet 4 items in row = 256x64)
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: coffee mug, small monitor, keyboard, mouse pad, top-down view, dark color theme, game prop assets

## Staging props -> props_staging.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: merge conflict sign, green checkmark badge, red X badge, git branch node, top-down view, game prop assets

## Legacy Codebase props -> props_legacy.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: dusty old book, cobweb cluster, ancient floppy disk, cracked coffee mug, top-down view, game prop assets

## Dark Mode props -> props_darkmode.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: dim lantern, dark crystal, shadow puddle, flickering candle, top-down view, very dark colors, game prop assets

## Cloud props -> props_cloud.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: small server rack, network cable coil, cloud hologram, data packet box, top-down view, blue neon theme, game prop assets

## Incident props -> props_incident.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: warning cone, broken alarm, fire extinguisher, error log printout, top-down view, red alert theme, game prop assets

## Hackathon props -> props_hackathon.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: energy drink can, pizza slice, sticky note pile, tangled USB cable, top-down view, colorful neon, game prop assets

## Infinite Loop props -> props_loop.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: mobius strip, infinity symbol crystal, recursive mirror, spinning gear, top-down view, purple theme, game prop assets

## Production Server props -> props_production.png
pixel art, transparent background, 64x64 each, 4 items in a row spritesheet 256x64: heat vent, fire patch, thermometer, melting server, top-down view, orange fire theme, game prop assets

---

# Projectile Sprites (optional, 16x16, transparent)

## Console.log -> proj_console.png
pixel art, transparent background, 16x16, small yellow glowing text bracket symbol >{}, game projectile asset

## Git Push -> proj_gitpush.png
pixel art, transparent background, 16x16, small green glowing arrow pointing right, game projectile asset

## Exploit -> proj_exploit.png
pixel art, transparent background, 16x16, small red glowing skull symbol, game projectile asset

---

## File naming:
```
assets/
  player.png
  bug.png
  infinite_loop.png
  null_pointer.png
  legacy_code.png
  virus.png
  deprecated_pkg.png
  boss_xp.png
  boss_so.png
  boss_blockchain.png
  xp_gem.png
  xp_gem_high.png
  chest.png
```
