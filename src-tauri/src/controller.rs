//! Runtime controller — owns the serial device, the active mode parameters,
//! and a single render thread that walks the LEDs at ~30 fps.
//!
//! State and the device live behind separate locks so the render thread can
//! mutate the device without blocking IPC reads of the state.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

use anyhow::{anyhow, Context, Result};
use parking_lot::Mutex;
use screen_light::{
    colormap::{self, ColorMap},
    find_ch340_port,
    strap::{self, ColorStrap},
    Rgb, Skydimo,
};
use serde::{Deserialize, Serialize};

const TARGET_FPS: f64 = 30.0;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Mode {
    Solid,
    Rainbow,
    Strap,
    ColorMap,
    Breathe,
    Off,
}

impl Default for Mode {
    fn default() -> Self {
        Mode::Off
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ModeParams {
    /// "#RRGGBB" — used by Solid and Breathe.
    pub color: Option<String>,
    /// Speed multiplier (rainbow / strap / colormap / breathe).
    pub speed: Option<f64>,
    /// Saturation 0-100 (rainbow).
    pub sat: Option<u8>,
    /// Frames per second cap (rainbow).
    pub fps: Option<u32>,
    /// 0-based strap index (strap).
    pub strap_index: Option<usize>,
    /// Builtin colormap id like "3", "4" ... (colormap).
    pub colormap_id: Option<String>,
    /// Breathe cycle in seconds.
    pub cycle_s: Option<f64>,
    /// Breathe depth 0-100.
    pub depth: Option<u8>,
}

#[derive(Debug, Clone, Serialize)]
pub struct StateSnapshot {
    pub connected: bool,
    pub port: Option<String>,
    pub n_leds: Option<u16>,
    pub model: Option<String>,
    pub mode: Mode,
    pub params: ModeParams,
    pub brightness: u8,
    pub master_on: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PortInfo {
    pub name: String,
    pub vid: Option<u16>,
    pub pid: Option<u16>,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub is_ch340: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ModelInfo {
    pub id: &'static str,
    pub n_leds: u16,
    pub lines: &'static [u16],
}

pub const MODELS: &[ModelInfo] = &[
    ModelInfo { id: "SK0121", n_leds: 51, lines: &[13, 25, 13] },
    ModelInfo { id: "SK0124", n_leds: 54, lines: &[14, 26, 14] },
    ModelInfo { id: "SK0127", n_leds: 65, lines: &[17, 31, 17] },
    ModelInfo { id: "SK0132", n_leds: 77, lines: &[20, 37, 20] },
    ModelInfo { id: "SK0134", n_leds: 71, lines: &[15, 41, 15] },
    ModelInfo { id: "SK0149", n_leds: 107, lines: &[19, 69, 19] },
    ModelInfo { id: "SK0L21", n_leds: 76, lines: &[13, 25, 13, 25] },
    ModelInfo { id: "SK0L24", n_leds: 80, lines: &[14, 26, 14, 26] },
    ModelInfo { id: "SK0L27", n_leds: 96, lines: &[17, 31, 17, 31] },
    ModelInfo { id: "SK0L32", n_leds: 114, lines: &[20, 37, 20, 37] },
    ModelInfo { id: "SK0L34", n_leds: 112, lines: &[15, 41, 15, 41] },
    ModelInfo { id: "SK0201", n_leds: 40, lines: &[20, 20] },
    ModelInfo { id: "SK0202", n_leds: 60, lines: &[30, 30] },
];

#[derive(Debug, Clone, Serialize)]
pub struct StrapInfo {
    pub index: usize,
    pub name: String,
    /// Hex stops — sampled at 8 evenly spaced points so the UI can render a
    /// thumbnail without re-implementing the lerp.
    pub stops: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ColorMapInfo {
    pub id: &'static str,
    pub name: String,
}

/// Shared mutable state read by the render thread every frame.
#[derive(Debug, Clone)]
struct LiveState {
    mode: Mode,
    params: ModeParams,
    brightness: u8,
    master_on: bool,
}

impl Default for LiveState {
    fn default() -> Self {
        Self {
            mode: Mode::Off,
            params: ModeParams::default(),
            brightness: 72,
            master_on: true,
        }
    }
}

pub struct Controller {
    /// Connection metadata (no device handle here — the worker owns it).
    port: Option<String>,
    n_leds: Option<u16>,
    model: Option<String>,
    error: Option<String>,

    /// Tunable state read live by the worker.
    live: Arc<Mutex<LiveState>>,
    /// Worker handle — abort flag + join.
    worker: Option<Worker>,
    /// Cached strap presets (loaded once).
    straps: Vec<ColorStrap>,
}

struct Worker {
    stop: Arc<AtomicBool>,
    handle: Option<JoinHandle<()>>,
}

impl Worker {
    fn stop(mut self) {
        self.stop.store(true, Ordering::Release);
        if let Some(h) = self.handle.take() {
            let _ = h.join();
        }
    }
}

impl Controller {
    pub fn new() -> Self {
        let straps = strap::load_presets().unwrap_or_default();
        Self {
            port: None,
            n_leds: None,
            model: None,
            error: None,
            live: Arc::new(Mutex::new(LiveState::default())),
            worker: None,
            straps,
        }
    }

    pub fn list_ports(&self) -> Result<Vec<PortInfo>> {
        let ports = serialport::available_ports().context("list serial ports")?;
        let mut out = Vec::new();
        for p in ports {
            let (vid, pid, manufacturer, product, is_ch340) = match &p.port_type {
                serialport::SerialPortType::UsbPort(info) => (
                    Some(info.vid),
                    Some(info.pid),
                    info.manufacturer.clone(),
                    info.product.clone(),
                    info.vid == screen_light::CH340_VID,
                ),
                _ => (None, None, None, None, false),
            };
            // macOS exposes both /dev/cu.* and /dev/tty.* — we only want cu.
            if p.port_name.contains("/tty.") {
                continue;
            }
            out.push(PortInfo {
                name: p.port_name,
                vid,
                pid,
                manufacturer,
                product,
                is_ch340,
            });
        }
        Ok(out)
    }

    pub fn list_straps(&self) -> Vec<StrapInfo> {
        self.straps
            .iter()
            .enumerate()
            .map(|(i, s)| {
                let stops = (0..8)
                    .map(|k| {
                        let t = k as f64 / 7.0;
                        let Rgb(r, g, b) = s.sample(t);
                        format!("#{:02X}{:02X}{:02X}", r, g, b)
                    })
                    .collect();
                StrapInfo {
                    index: i,
                    name: if s.name.is_empty() {
                        format!("Strap {}", i + 1)
                    } else {
                        s.name.clone()
                    },
                    stops,
                }
            })
            .collect()
    }

    pub fn list_colormaps(&self) -> Vec<ColorMapInfo> {
        colormap::BUILTIN
            .iter()
            .map(|(id, _)| ColorMapInfo {
                id,
                name: format!("Map {}", id),
            })
            .collect()
    }

    pub fn connect(&mut self, port_arg: Option<String>, n_leds: u16, model: Option<String>) -> Result<()> {
        if n_leds == 0 {
            return Err(anyhow!("led count must be > 0"));
        }

        // If something is already running, stop it first so we can take the port.
        if let Some(w) = self.worker.take() {
            w.stop();
        }

        let port = match port_arg {
            Some(p) if !p.is_empty() => p,
            _ => find_ch340_port()?,
        };

        let dev = Skydimo::open(&port, n_leds).with_context(|| format!("open {port}"))?;

        self.port = Some(port);
        self.n_leds = Some(n_leds);
        self.model = model;
        self.error = None;

        self.start_worker(dev);
        Ok(())
    }

    pub fn disconnect(&mut self) {
        if let Some(w) = self.worker.take() {
            w.stop();
        }
        self.port = None;
        self.n_leds = None;
        self.model = None;
    }

    pub fn set_mode(&mut self, mode: Mode, params: ModeParams) {
        let mut live = self.live.lock();
        live.mode = mode;
        live.params = params;
    }

    pub fn set_brightness(&mut self, value: u8) {
        let mut live = self.live.lock();
        live.brightness = value.min(100);
    }

    pub fn set_master(&mut self, on: bool) {
        let mut live = self.live.lock();
        live.master_on = on;
    }

    pub fn snapshot(&self) -> StateSnapshot {
        let live = self.live.lock();
        StateSnapshot {
            connected: self.worker.is_some(),
            port: self.port.clone(),
            n_leds: self.n_leds,
            model: self.model.clone(),
            mode: live.mode,
            params: live.params.clone(),
            brightness: live.brightness,
            master_on: live.master_on,
            error: self.error.clone(),
        }
    }

    fn start_worker(&mut self, mut dev: Skydimo) {
        let stop = Arc::new(AtomicBool::new(false));
        let live = Arc::clone(&self.live);
        let n_leds = dev.n_leds() as usize;
        let straps = self.straps.clone();
        let stop_flag = Arc::clone(&stop);

        let handle = thread::spawn(move || {
            let mut frame: Vec<Rgb> = vec![Rgb::BLACK; n_leds];
            let start = Instant::now();
            let mut colormap_cache: Option<(String, ColorMap)> = None;

            while !stop_flag.load(Ordering::Acquire) {
                let snapshot = live.lock().clone();
                let t = start.elapsed().as_secs_f64();
                render(
                    &snapshot,
                    t,
                    &straps,
                    &mut colormap_cache,
                    &mut frame,
                );
                apply_brightness(&mut frame, snapshot.brightness, snapshot.master_on);
                if dev.write(&frame).is_err() {
                    // Device gone; bail out so the panel can reconnect.
                    break;
                }
                let target_dt = Duration::from_secs_f64(1.0 / TARGET_FPS);
                thread::sleep(target_dt);
            }

            // On exit, blank the strip — best-effort.
            for c in frame.iter_mut() {
                *c = Rgb::BLACK;
            }
            let _ = dev.write(&frame);
        });

        self.worker = Some(Worker {
            stop,
            handle: Some(handle),
        });
    }
}

impl Drop for Controller {
    fn drop(&mut self) {
        if let Some(w) = self.worker.take() {
            w.stop();
        }
    }
}

fn render(
    state: &LiveState,
    t: f64,
    straps: &[ColorStrap],
    colormap_cache: &mut Option<(String, ColorMap)>,
    out: &mut [Rgb],
) {
    let n = out.len();
    if n == 0 {
        return;
    }
    if !state.master_on {
        for c in out.iter_mut() {
            *c = Rgb::BLACK;
        }
        return;
    }
    match state.mode {
        Mode::Off => {
            for c in out.iter_mut() {
                *c = Rgb::BLACK;
            }
        }
        Mode::Solid => {
            let c = parse_color(state.params.color.as_deref()).unwrap_or(Rgb(255, 184, 92));
            for o in out.iter_mut() {
                *o = c;
            }
        }
        Mode::Rainbow => {
            let speed = state.params.speed.unwrap_or(0.2);
            let sat = state.params.sat.map(|s| s as f64 / 100.0).unwrap_or(1.0);
            for i in 0..n {
                let h = ((i as f64 / n as f64) + t * speed).fract();
                out[i] = hsv(h, sat, 1.0);
            }
        }
        Mode::Strap => {
            let idx = state.params.strap_index.unwrap_or(4).min(straps.len().saturating_sub(1));
            if let Some(s) = straps.get(idx) {
                let speed = state.params.speed.unwrap_or(0.2);
                s.render(n as u16, t, speed, out);
            } else {
                for c in out.iter_mut() {
                    *c = Rgb::BLACK;
                }
            }
        }
        Mode::ColorMap => {
            let id = state.params.colormap_id.clone().unwrap_or_else(|| "3".to_string());
            let needs_load = match colormap_cache {
                Some((cid, _)) => *cid != id,
                None => true,
            };
            if needs_load {
                if let Ok(cm) = colormap::load_builtin(&id) {
                    *colormap_cache = Some((id.clone(), cm));
                } else {
                    *colormap_cache = None;
                }
            }
            if let Some((_, cm)) = colormap_cache.as_ref() {
                let speed = state.params.speed.unwrap_or(0.1);
                cm.render(n as u16, t, speed, out);
            } else {
                for c in out.iter_mut() {
                    *c = Rgb::BLACK;
                }
            }
        }
        Mode::Breathe => {
            let c = parse_color(state.params.color.as_deref()).unwrap_or(Rgb(255, 138, 59));
            let cycle = state.params.cycle_s.unwrap_or(4.0).max(0.1);
            let depth = state.params.depth.map(|d| d as f64 / 100.0).unwrap_or(0.8);
            // Triangular breathe: 0 -> 1 -> 0 over `cycle` seconds.
            let phase = (t / cycle).fract();
            let env = 1.0 - (phase * 2.0 - 1.0).abs();
            let level = (1.0 - depth) + depth * env;
            let scaled = scale_color(c, level);
            for o in out.iter_mut() {
                *o = scaled;
            }
        }
    }
}

fn apply_brightness(frame: &mut [Rgb], brightness: u8, master_on: bool) {
    if !master_on {
        for c in frame.iter_mut() {
            *c = Rgb::BLACK;
        }
        return;
    }
    let f = brightness as f64 / 100.0;
    for c in frame.iter_mut() {
        *c = scale_color(*c, f);
    }
}

fn scale_color(c: Rgb, f: f64) -> Rgb {
    let f = f.clamp(0.0, 1.0);
    Rgb(
        (c.0 as f64 * f).round() as u8,
        (c.1 as f64 * f).round() as u8,
        (c.2 as f64 * f).round() as u8,
    )
}

fn parse_color(s: Option<&str>) -> Option<Rgb> {
    let s = s?.trim().trim_start_matches('#');
    if s.len() != 6 {
        return None;
    }
    let r = u8::from_str_radix(&s[0..2], 16).ok()?;
    let g = u8::from_str_radix(&s[2..4], 16).ok()?;
    let b = u8::from_str_radix(&s[4..6], 16).ok()?;
    Some(Rgb(r, g, b))
}

fn hsv(h: f64, s: f64, v: f64) -> Rgb {
    let i = (h * 6.0).floor();
    let f = h * 6.0 - i;
    let p = v * (1.0 - s);
    let q = v * (1.0 - f * s);
    let t = v * (1.0 - (1.0 - f) * s);
    let (r, g, b) = match (i as i32).rem_euclid(6) {
        0 => (v, t, p),
        1 => (q, v, p),
        2 => (p, v, t),
        3 => (p, q, v),
        4 => (t, p, v),
        _ => (v, p, q),
    };
    Rgb(
        (r * 255.0).round() as u8,
        (g * 255.0).round() as u8,
        (b * 255.0).round() as u8,
    )
}
