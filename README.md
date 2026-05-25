# screen-light

Reverse-engineered driver for SkyDimo LED strips, written in Rust.

The hardware exposes itself as a generic CH340 USB-to-serial device
(VID `0x1A86`) and accepts an Adalight-variant frame format:

```
'A' 'd' 'a' 0x00  nb_hi nb_lo   R G B  R G B  ...   (n_leds × 3 bytes)
```

Serial: 115200 baud, 8N1, no flow control.

## Usage

Quit the official SkyDimo app first (only one process can hold the port).

```sh
# 0. Confirm the device shows up. Look for /dev/cu.usbserial-*.
cargo run --release --bin skydimo -- list

# 1. Light it up red. Replace 51 with your strip's LED count.
cargo run --release --bin skydimo -- --leds 51 fill --color ff0000

# 2. Off.
cargo run --release --bin skydimo -- --leds 51 off

# 3. Don't know the LED count? Sweep one pixel and count.
cargo run --release --bin wipe -- --leds 120

# 4. Demo: rolling rainbow.
cargo run --release --bin rainbow -- --leds 51 --fps 30

# 5. Run one of the 15 official color-strap presets (flowing gradient).
cargo run --release --bin strap -- list
cargo run --release --bin strap -- run --leds 51 --preset 3 --speed 0.2

# 6. Run one of the 6 official ColorMap PNGs (scrolling animation),
#    or any PNG you point at.
cargo run --release --bin colormap -- list
cargo run --release --bin colormap -- run --leds 51 --map 4 --scroll 0.1
cargo run --release --bin colormap -- run --leds 51 --file ~/Pictures/anything.png
```

## Built-in presets

Lifted from SkyDimo's `effects/` directory and embedded into the binary:

- `assets/colorStraps.json` — 15 color-strap presets (flowing gradient).
- `assets/colorful/ColorMap_*.png` — 6 hand-painted gradient sheets used for
  scrolling animations.

The `strap` and `colormap` binaries replicate the official "幻彩模式" (colorful mode)
exactly, with the same data the official app ships.

## LED counts per known SkyDimo model

Pulled from `controler_config/SKController.json` in the official app.

| Model  | n_leds | Lines (segments)     |
|--------|--------|----------------------|
| SK0121 | 51     | [13, 25, 13]         |
| SK0124 | 54     | [14, 26, 14]         |
| SK0127 | 65     | [17, 31, 17]         |
| SK0132 | 77     | [20, 37, 20]         |
| SK0134 | 71     | [15, 41, 15]         |
| SK0149 | 107    | [19, 69, 19]         |
| SK0L21 | 76     | [13, 25, 13, 25]     |
| SK0L24 | 80     | [14, 26, 14, 26]     |
| SK0L27 | 96     | [17, 31, 17, 31]     |
| SK0L32 | 114    | [20, 37, 20, 37]     |
| SK0L34 | 112    | [15, 41, 15, 41]     |
| SK0201 | 40     | [20, 20]             |
| SK0202 | 60     | [30, 30]             |

`lines` are physical segments (top / right / bottom / left), useful when
mapping screen-edge pixels onto the strip for screen-sync mode.
