use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, LogicalPosition, Manager, PhysicalPosition, WebviewWindow,
};

const TRAY_ICON_PNG: &[u8] = include_bytes!("../icons/tray.png");

pub fn setup(app: &App) -> tauri::Result<()> {
    let show_item = MenuItem::with_id(app, "show", "Show panel", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit SkyDimo", true, Some("Cmd+Q"))?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let icon = Image::from_bytes(TRAY_ICON_PNG)?;

    TrayIconBuilder::with_id("skydimo-tray")
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("panel") {
                    let _ = show_panel(&window, None);
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                rect,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("panel") {
                    let visible = window.is_visible().unwrap_or(false);
                    if visible {
                        let _ = window.hide();
                    } else {
                        // Convert the rect's position+size to a physical anchor
                        // (mid-bottom of the tray icon).
                        let scale = window
                            .current_monitor()
                            .ok()
                            .flatten()
                            .map(|m| m.scale_factor())
                            .unwrap_or(1.0);
                        let pos = match rect.position {
                            tauri::Position::Physical(p) => p,
                            tauri::Position::Logical(p) => p.to_physical::<i32>(scale),
                        };
                        let size = match rect.size {
                            tauri::Size::Physical(s) => s,
                            tauri::Size::Logical(s) => s.to_physical::<u32>(scale),
                        };
                        let anchor = PhysicalPosition::new(
                            pos.x as f64 + size.width as f64 / 2.0,
                            pos.y as f64 + size.height as f64,
                        );
                        let _ = show_panel(&window, Some(anchor));
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn show_panel(window: &WebviewWindow, anchor: Option<PhysicalPosition<f64>>) -> tauri::Result<()> {
    if let Some(anchor) = anchor {
        let monitor = window.current_monitor()?;
        let scale = monitor.as_ref().map(|m| m.scale_factor()).unwrap_or(1.0);
        let size = window.outer_size()?;
        let center_x = anchor.x / scale;
        let icon_bottom_y = anchor.y / scale;
        let win_w = size.width as f64 / scale;

        let mut x = center_x - win_w / 2.0;
        if let Some(m) = monitor.as_ref() {
            let mon_pos = m.position();
            let mon_size = m.size();
            let min_x = mon_pos.x as f64 / scale + 6.0;
            let max_x = (mon_pos.x as f64 + mon_size.width as f64) / scale - win_w - 6.0;
            if x < min_x {
                x = min_x;
            }
            if x > max_x {
                x = max_x;
            }
        }
        let y = icon_bottom_y + 6.0;
        let _ = window.set_position(LogicalPosition::new(x, y));
    }
    window.show()?;
    window.set_focus()?;
    Ok(())
}
