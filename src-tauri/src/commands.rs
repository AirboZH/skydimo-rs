use serde::Serialize;
use tauri::State;

use crate::controller::{
    ColorMapInfo, Mode, ModeParams, ModelInfo, PortInfo, StateSnapshot, StrapInfo, MODELS,
};
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct CmdError {
    message: String,
}

impl<E: std::fmt::Display> From<E> for CmdError {
    fn from(e: E) -> Self {
        Self {
            message: e.to_string(),
        }
    }
}

type CmdResult<T> = std::result::Result<T, CmdError>;

#[tauri::command]
pub fn list_ports(state: State<'_, AppState>) -> CmdResult<Vec<PortInfo>> {
    let c = state.controller.lock();
    Ok(c.list_ports()?)
}

#[tauri::command]
pub fn list_models() -> Vec<ModelInfo> {
    MODELS.to_vec()
}

#[tauri::command]
pub fn list_straps(state: State<'_, AppState>) -> Vec<StrapInfo> {
    state.controller.lock().list_straps()
}

#[tauri::command]
pub fn list_colormaps(state: State<'_, AppState>) -> Vec<ColorMapInfo> {
    state.controller.lock().list_colormaps()
}

#[tauri::command]
pub fn connect(
    state: State<'_, AppState>,
    port: Option<String>,
    n_leds: u16,
    model: Option<String>,
) -> CmdResult<StateSnapshot> {
    let mut c = state.controller.lock();
    c.connect(port, n_leds, model)?;
    Ok(c.snapshot())
}

#[tauri::command]
pub fn disconnect(state: State<'_, AppState>) -> StateSnapshot {
    let mut c = state.controller.lock();
    c.disconnect();
    c.snapshot()
}

#[tauri::command]
pub fn get_state(state: State<'_, AppState>) -> StateSnapshot {
    state.controller.lock().snapshot()
}

#[tauri::command]
pub fn set_mode(state: State<'_, AppState>, mode: Mode, params: ModeParams) -> StateSnapshot {
    let mut c = state.controller.lock();
    c.set_mode(mode, params);
    c.snapshot()
}

#[tauri::command]
pub fn set_brightness(state: State<'_, AppState>, value: u8) -> StateSnapshot {
    let mut c = state.controller.lock();
    c.set_brightness(value);
    c.snapshot()
}

#[tauri::command]
pub fn set_master_switch(state: State<'_, AppState>, on: bool) -> StateSnapshot {
    let mut c = state.controller.lock();
    c.set_master(on);
    c.snapshot()
}

#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
