//! Color-strap: linear gradient through a few key colors, looped end-to-end,
//! sampled at any t in [0, 1).
//!
//! Source: SkyDimo's `effects/colorStraps.json` (15 presets).

use anyhow::{anyhow, Result};
use serde::Deserialize;

use crate::Rgb;

#[derive(Debug, Deserialize, Clone)]
pub struct ColorStrapFile {
    #[serde(rename = "colorStrapList")]
    pub list: Vec<ColorStrap>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ColorStrap {
    #[serde(rename = "endsColor")]
    pub ends_color: [u8; 3],
    #[serde(rename = "keyColors")]
    pub key_colors: Vec<KeyColor>,
    #[serde(default)]
    pub name: String,
    #[serde(default = "default_one")]
    pub range: f64,
    #[serde(default = "default_one")]
    pub speed: f64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct KeyColor {
    pub color: [u8; 3],
    pub key: f64,
}

fn default_one() -> f64 {
    1.0
}

/// Embed the official preset JSON at compile time.
pub const PRESETS_JSON: &str = include_str!("../assets/colorStraps.json");

pub fn load_presets() -> Result<Vec<ColorStrap>> {
    let f: ColorStrapFile = serde_json::from_str(PRESETS_JSON)?;
    Ok(f.list)
}

impl ColorStrap {
    /// Sample the strap at `t` in [0, 1). Wraps around (key 0.0 == 1.0 == ends_color).
    pub fn sample(&self, t: f64) -> Rgb {
        let t = t.rem_euclid(1.0);
        // Build a sorted list of (key, color) including ends at 0.0 and 1.0.
        let mut points: Vec<(f64, [u8; 3])> = Vec::with_capacity(self.key_colors.len() + 2);
        points.push((0.0, self.ends_color));
        for kc in &self.key_colors {
            points.push((kc.key, kc.color));
        }
        points.push((1.0, self.ends_color));
        points.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

        for w in points.windows(2) {
            let (k0, c0) = w[0];
            let (k1, c1) = w[1];
            if t >= k0 && t <= k1 {
                let span = (k1 - k0).max(1e-9);
                let f = (t - k0) / span;
                return Rgb(
                    lerp_u8(c0[0], c1[0], f),
                    lerp_u8(c0[1], c1[1], f),
                    lerp_u8(c0[2], c1[2], f),
                );
            }
        }
        Rgb(self.ends_color[0], self.ends_color[1], self.ends_color[2])
    }

    /// Render an entire strip frame at time `time_s`. `flow` is cycles per second.
    pub fn render(&self, n_leds: u16, time_s: f64, flow: f64, out: &mut [Rgb]) {
        let n = n_leds as usize;
        for i in 0..n {
            let t = (i as f64 / n as f64) + time_s * flow;
            out[i] = self.sample(t);
        }
    }
}

pub fn pick(presets: &[ColorStrap], idx: usize) -> Result<&ColorStrap> {
    presets
        .get(idx)
        .ok_or_else(|| anyhow!("preset {idx} out of range (have {})", presets.len()))
}

fn lerp_u8(a: u8, b: u8, t: f64) -> u8 {
    let v = a as f64 + (b as f64 - a as f64) * t.clamp(0.0, 1.0);
    v.round().clamp(0.0, 255.0) as u8
}
