//! Single-pixel sweep — useful to figure out the LED count of an unknown strip.
//! Whichever LED is the last one to light up before the loop wraps tells you the count.
//!
//!   cargo run --release --bin wipe -- --leds 200

use std::time::Duration;

use anyhow::Result;
use clap::Parser;
use screen_light::{find_ch340_port, Rgb, Skydimo};

#[derive(Parser)]
struct Cli {
    #[arg(long)]
    port: Option<String>,
    /// Upper-bound number of LEDs to attempt to address.
    #[arg(long, default_value_t = 120)]
    leds: u16,
    #[arg(long, default_value_t = 60)]
    delay_ms: u64,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let port = cli.port.map(Ok).unwrap_or_else(find_ch340_port)?;
    let mut dev = Skydimo::open(&port, cli.leds)?;
    let n = cli.leds as usize;

    let mut frame = vec![Rgb::BLACK; n];
    println!("sweeping {n} LEDs on {port}. count which one is last to light.");
    loop {
        for i in 0..n {
            frame.fill(Rgb::BLACK);
            frame[i] = Rgb::WHITE;
            dev.write(&frame)?;
            std::thread::sleep(Duration::from_millis(cli.delay_ms));
        }
    }
}
