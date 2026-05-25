//! ColorMap: a 2D color image we sample at (x = led_position, y = scrolled time).
//!
//! Source: SkyDimo's `effects/colorful/ColorMap_*.png` — looks like 6 hand-painted
//! gradient sheets that animate by scrolling vertically over time.

use anyhow::{Context, Result};
use image::RgbaImage;

use crate::Rgb;

pub struct ColorMap {
    img: RgbaImage,
    w: u32,
    h: u32,
}

impl ColorMap {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let img = image::load_from_memory(bytes)
            .context("decode png")?
            .to_rgba8();
        let (w, h) = img.dimensions();
        Ok(Self { img, w, h })
    }

    pub fn from_path(path: &str) -> Result<Self> {
        let img = image::open(path)
            .with_context(|| format!("open {path}"))?
            .to_rgba8();
        let (w, h) = img.dimensions();
        Ok(Self { img, w, h })
    }

    /// Sample at normalized coordinates u,v in [0, 1). Wraps both axes.
    pub fn sample(&self, u: f64, v: f64) -> Rgb {
        let u = u.rem_euclid(1.0);
        let v = v.rem_euclid(1.0);
        let x = ((u * self.w as f64) as u32).min(self.w - 1);
        let y = ((v * self.h as f64) as u32).min(self.h - 1);
        let p = self.img.get_pixel(x, y);
        Rgb(p[0], p[1], p[2])
    }

    /// Render an entire strip frame. `scroll` is vertical cycles per second.
    pub fn render(&self, n_leds: u16, time_s: f64, scroll: f64, out: &mut [Rgb]) {
        let n = n_leds as usize;
        let v = time_s * scroll;
        for i in 0..n {
            let u = i as f64 / n as f64;
            out[i] = self.sample(u, v);
        }
    }
}

/// Embed the 6 official ColorMap PNGs at compile time.
pub const BUILTIN: &[(&str, &[u8])] = &[
    ("3", include_bytes!("../assets/colorful/ColorMap_3.png")),
    ("4", include_bytes!("../assets/colorful/ColorMap_4.png")),
    ("5", include_bytes!("../assets/colorful/ColorMap_5.png")),
    ("6", include_bytes!("../assets/colorful/ColorMap_6.png")),
    ("7", include_bytes!("../assets/colorful/ColorMap_7.png")),
    ("8", include_bytes!("../assets/colorful/ColorMap_8.png")),
];

pub fn load_builtin(name: &str) -> Result<ColorMap> {
    let bytes = BUILTIN
        .iter()
        .find(|(n, _)| *n == name)
        .map(|(_, b)| *b)
        .ok_or_else(|| {
            anyhow::anyhow!(
                "unknown builtin {name:?}, available: {:?}",
                BUILTIN.iter().map(|(n, _)| *n).collect::<Vec<_>>()
            )
        })?;
    ColorMap::from_bytes(bytes)
}
