//! Run one of SkyDimo's 15 built-in color-strap presets as a flowing gradient.
//!
//!   cargo run --release --bin strap -- list
//!   cargo run --release --bin strap -- run --leds 51 --preset 3 --speed 0.2 --fps 30

use std::time::{Duration, Instant};

use anyhow::Result;
use clap::{Parser, Subcommand};
use screen_light::{find_ch340_port, strap, Rgb, Skydimo};

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Print all 15 presets with their key colors.
    List,
    Run {
        #[arg(long)]
        port: Option<String>,
        #[arg(long, default_value_t = 51)]
        leds: u16,
        /// Preset index 0..=14
        #[arg(long, default_value_t = 0)]
        preset: usize,
        /// Cycles per second (negative = reverse)
        #[arg(long, default_value_t = 0.2)]
        speed: f64,
        #[arg(long, default_value_t = 30)]
        fps: u32,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let presets = strap::load_presets()?;

    match cli.cmd {
        Cmd::List => {
            for (i, p) in presets.iter().enumerate() {
                println!(
                    "{:2}: ends={:?} keys={:?}",
                    i,
                    p.ends_color,
                    p.key_colors
                        .iter()
                        .map(|k| (k.key, k.color))
                        .collect::<Vec<_>>()
                );
            }
        }
        Cmd::Run {
            port,
            leds,
            preset,
            speed,
            fps,
        } => {
            let port = port.map(Ok).unwrap_or_else(find_ch340_port)?;
            let p = strap::pick(&presets, preset)?;
            println!(
                "preset {preset} on {port}, {leds} leds, speed={speed}, {fps} fps"
            );

            let mut dev = Skydimo::open(&port, leds)?;
            let mut frame = vec![Rgb::BLACK; leds as usize];
            let frame_dur = Duration::from_secs_f64(1.0 / fps as f64);
            let start = Instant::now();
            loop {
                let t = start.elapsed().as_secs_f64();
                p.render(leds, t, speed, &mut frame);
                dev.write(&frame)?;
                std::thread::sleep(frame_dur);
            }
        }
    }
    Ok(())
}
