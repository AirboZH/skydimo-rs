//! General CLI:
//!
//!   cargo run --release -- list
//!   cargo run --release -- fill --leds 51 --color ff0000
//!   cargo run --release -- off  --leds 51

use anyhow::{anyhow, Context, Result};
use clap::{Parser, Subcommand};
use skydimo::{find_ch340_port, Rgb, Skydimo};

#[derive(Parser)]
#[command(name = "skydimo", about = "Drive SkyDimo LED strip over CH340 serial")]
struct Cli {
    /// Serial port path. Auto-detect if omitted.
    #[arg(long, global = true)]
    port: Option<String>,

    /// LED count for the connected strip (e.g. SK0121=51, SK0149=107).
    #[arg(long, global = true, default_value_t = 51)]
    leds: u16,

    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// List serial ports.
    List,
    /// Fill the strip with one color.
    Fill {
        /// 6-digit hex (e.g. ff8800).
        #[arg(long)]
        color: String,
    },
    /// Turn all LEDs off.
    Off,
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    if matches!(cli.cmd, Cmd::List) {
        for p in serialport::available_ports()? {
            println!("{:<32} {:?}", p.port_name, p.port_type);
        }
        return Ok(());
    }

    let port = match cli.port {
        Some(p) => p,
        None => find_ch340_port()?,
    };
    println!("port: {port}, leds: {}", cli.leds);

    let mut dev = Skydimo::open(&port, cli.leds)?;

    match cli.cmd {
        Cmd::List => unreachable!(),
        Cmd::Fill { color } => {
            let c = parse_hex(&color)?;
            dev.fill(c)?;
            println!("filled #{color}");
        }
        Cmd::Off => {
            dev.off()?;
            println!("off");
        }
    }
    Ok(())
}

fn parse_hex(s: &str) -> Result<Rgb> {
    let s = s.trim_start_matches('#');
    if s.len() != 6 {
        return Err(anyhow!("color must be 6 hex digits, got {s:?}"));
    }
    let r = u8::from_str_radix(&s[0..2], 16).context("r")?;
    let g = u8::from_str_radix(&s[2..4], 16).context("g")?;
    let b = u8::from_str_radix(&s[4..6], 16).context("b")?;
    Ok(Rgb(r, g, b))
}
