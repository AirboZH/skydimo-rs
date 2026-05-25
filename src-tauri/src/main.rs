// Hide the console window on Windows release builds. macOS-only app, but kept
// for parity with Tauri's templates.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    skydimo_rs_lib::run();
}
