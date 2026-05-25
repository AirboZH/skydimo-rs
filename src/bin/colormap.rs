//! Run one of SkyDimo's 6 built-in ColorMap PNGs as a scrolling animation,
//! or any PNG file you point at.
//!
//!   cargo run --release --bin colormap -- list
//!   cargo run --release --bin colormap -- run --leds 51 --map 4 --scroll 0.1
//!   cargo run --release --bin colormap -- run --leds 51 --file ./mypic.png

use std::time::{Duration, Instant};

use anyhow::Result;
use clap::{Parser, Subcommand};
use skydimo::{colormap, find_ch340_port, Rgb, Skydimo};

#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    List,
    Run {
        #[arg(long)]
        port: Option<String>,
        #[arg(long, default_value_t = 51)]
        leds: u16,
        /// Built-in map name (3..=8). Mutually exclusive with --file.
        #[arg(long)]
        map: Option<String>,
        /// External PNG file. Mutually exclusive with --map.
        #[arg(long)]
        file: Option<String>,
        /// Vertical cycles per second (negative = reverse).
        #[arg(long, default_value_t = 0.1)]
        scroll: f64,
        #[arg(long, default_value_t = 30)]
        fps: u32,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.cmd {
        Cmd::List => {
            println!("built-in maps:");
            for (n, b) in colormap::BUILTIN {
                println!("  {n} ({} bytes)", b.len());
            }
        }
        Cmd::Run {
            port,
            leds,
            map,
            file,
            scroll,
            fps,
        } => {
            let port = port.map(Ok).unwrap_or_else(find_ch340_port)?;
            let cm = match (map, file) {
                (Some(name), None) => colormap::load_builtin(&name)?,
                (None, Some(path)) => colormap::ColorMap::from_path(&path)?,
                (None, None) => colormap::load_builtin("8")?, // default rainbow
                (Some(_), Some(_)) => anyhow::bail!("pass --map or --file, not both"),
            };
            println!("colormap on {port}, {leds} leds, scroll={scroll}, {fps} fps");

            let mut dev = Skydimo::open(&port, leds)?;
            let mut frame = vec![Rgb::BLACK; leds as usize];
            let frame_dur = Duration::from_secs_f64(1.0 / fps as f64);
            let start = Instant::now();
            loop {
                let t = start.elapsed().as_secs_f64();
                cm.render(leds, t, scroll, &mut frame);
                dev.write(&frame)?;
                std::thread::sleep(frame_dur);
            }
        }
    }
    Ok(())
}
