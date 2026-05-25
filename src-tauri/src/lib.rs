mod controller;
mod commands;
mod tray;

use std::sync::Arc;

use parking_lot::Mutex;
use tauri::Manager;

use controller::Controller;

pub struct AppState {
    pub controller: Arc<Mutex<Controller>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let controller = Arc::new(Mutex::new(Controller::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            controller: Arc::clone(&controller),
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_ports,
            commands::list_models,
            commands::list_straps,
            commands::list_colormaps,
            commands::connect,
            commands::disconnect,
            commands::get_state,
            commands::set_mode,
            commands::set_brightness,
            commands::set_master_switch,
            commands::quit_app,
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            tray::setup(app)?;

            if let Some(panel) = app.get_webview_window("panel") {
                let _ = panel.hide();
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "panel" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
                if let tauri::WindowEvent::Focused(false) = event {
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running skydimo-rs");
}
