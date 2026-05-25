//! Rolling rainbow:  cargo run --release --bin rainbow -- --leds 51

use std::time::{Duration, Instant};

use anyhow::Result;
use clap::Parser;
use skydimo::{find_ch340_port, Rgb, Skydimo};

#[derive(Parser)]
struct Cli {
    #[arg(long)]
    port: Option<String>,
    #[arg(long, default_value_t = 51)]
    leds: u16,
    /// Frames per second.
    #[arg(long, default_value_t = 30)]
    fps: u32,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let port = cli.port.map(Ok).unwrap_or_else(find_ch340_port)?;
    let mut dev = Skydimo::open(&port, cli.leds)?;

    let frame_dur = Duration::from_secs_f64(1.0 / cli.fps as f64);
    let n = cli.leds as usize;
    let mut frame = vec![Rgb::BLACK; n];
    let start = Instant::now();

    println!("rolling rainbow on {port} @ {} fps. ctrl-c to stop.", cli.fps);
    loop {
        let t = start.elapsed().as_secs_f64();
        for i in 0..n {
            let h = ((i as f64 / n as f64) + t * 0.2).fract();
            frame[i] = hsv(h, 1.0, 1.0);
        }
        dev.write(&frame)?;
        std::thread::sleep(frame_dur);
    }
}

/// HSV (h,s,v in [0,1]) -> RGB
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
