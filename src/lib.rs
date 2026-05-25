//! SkyDimo / Adalight-variant LED strip driver.
//!
//! Wire format per frame:
//!
//! ```text
//! 'A' 'd' 'a' 0x00 nb_hi nb_lo  R G B  R G B  ...
//! ```
//!
//! - 4-byte magic "Ada\0"
//! - 16-bit big-endian LED count
//! - n_leds * 3 bytes RGB payload
//!
//! Serial: 115200 baud, 8N1, no flow control.

use std::time::Duration;

use anyhow::{anyhow, Context, Result};
use serialport::{DataBits, FlowControl, Parity, SerialPort, SerialPortType, StopBits};

pub mod colormap;
pub mod strap;

pub const BAUD: u32 = 115_200;
pub const MAGIC: [u8; 4] = *b"Ada\0";

/// CH340/CH341 USB-serial chip vendor (WCH).
pub const CH340_VID: u16 = 0x1A86;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Rgb(pub u8, pub u8, pub u8);

impl Rgb {
    pub const BLACK: Rgb = Rgb(0, 0, 0);
    pub const RED: Rgb = Rgb(255, 0, 0);
    pub const GREEN: Rgb = Rgb(0, 255, 0);
    pub const BLUE: Rgb = Rgb(0, 0, 255);
    pub const WHITE: Rgb = Rgb(255, 255, 255);
}

pub struct Skydimo {
    port: Box<dyn SerialPort>,
    n_leds: u16,
    buf: Vec<u8>,
}

impl Skydimo {
    pub fn open(path: &str, n_leds: u16) -> Result<Self> {
        let port = serialport::new(path, BAUD)
            .data_bits(DataBits::Eight)
            .parity(Parity::None)
            .stop_bits(StopBits::One)
            .flow_control(FlowControl::None)
            .timeout(Duration::from_millis(500))
            .open()
            .with_context(|| format!("open serial port {path}"))?;

        let mut buf = vec![0u8; 6 + (n_leds as usize) * 3];
        buf[..4].copy_from_slice(&MAGIC);
        buf[4] = (n_leds >> 8) as u8;
        buf[5] = (n_leds & 0xFF) as u8;

        Ok(Self { port, n_leds, buf })
    }

    pub fn n_leds(&self) -> u16 {
        self.n_leds
    }

    /// Push RGB data. Length must equal `n_leds`.
    pub fn write(&mut self, frame: &[Rgb]) -> Result<()> {
        if frame.len() != self.n_leds as usize {
            return Err(anyhow!(
                "frame length {} != n_leds {}",
                frame.len(),
                self.n_leds
            ));
        }
        for (i, c) in frame.iter().enumerate() {
            let o = 6 + i * 3;
            self.buf[o] = c.0;
            self.buf[o + 1] = c.1;
            self.buf[o + 2] = c.2;
        }
        self.port.write_all(&self.buf).context("serial write")?;
        self.port.flush().context("serial flush")?;
        Ok(())
    }

    pub fn fill(&mut self, c: Rgb) -> Result<()> {
        let frame = vec![c; self.n_leds as usize];
        self.write(&frame)
    }

    pub fn off(&mut self) -> Result<()> {
        self.fill(Rgb::BLACK)
    }
}

/// Auto-detect the first CH340 USB-serial device.
pub fn find_ch340_port() -> Result<String> {
    let ports = serialport::available_ports().context("list serial ports")?;
    for p in &ports {
        if let SerialPortType::UsbPort(info) = &p.port_type {
            if info.vid == CH340_VID {
                return Ok(p.port_name.clone());
            }
        }
    }
    // Fallback: take any /dev/cu.usbserial-* on macOS.
    for p in &ports {
        if p.port_name.contains("usbserial") {
            return Ok(p.port_name.clone());
        }
    }
    Err(anyhow!(
        "no CH340 device found. Available ports: {:?}",
        ports.iter().map(|p| &p.port_name).collect::<Vec<_>>()
    ))
}
